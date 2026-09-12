from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .config import get_settings
from .database import Base, engine, get_db
from .models import Analysis, Benchmark, Finding, GreenScore, Optimization, Project, SustainabilityMetric
from .schemas import (
    AnalyzeRequest,
    AnalyzeResponse,
    BenchmarkRequest,
    BenchmarkResponse,
    DashboardCard,
    HistoryResponse,
    ProjectCreate,
    ProjectOut,
    OptimizeRequest,
    OptimizeResponse,
)
from .services.analyzer import analyze_python_code
from .services.benchmark import BenchmarkSafetyError, run_safe_benchmark
from .services.optimizer import generate_optimization
from .services.scoring import calculate_green_score
from .services.sustainability import estimate_energy_and_co2

settings = get_settings()
app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin, "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok", "service": settings.app_name}


@app.post("/api/projects", response_model=ProjectOut)
def create_project(payload: ProjectCreate, db: Session = Depends(get_db)) -> ProjectOut:
    project = Project(name=payload.name.strip(), description=(payload.description or "").strip() or None)
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@app.get("/api/projects", response_model=list[ProjectOut])
def list_projects(db: Session = Depends(get_db)) -> list[ProjectOut]:
    return db.query(Project).order_by(Project.created_at.desc()).all()


@app.post("/api/analyze", response_model=AnalyzeResponse)
def analyze_code(payload: AnalyzeRequest, db: Session = Depends(get_db)) -> AnalyzeResponse:
    if payload.language.lower() != "python":
        raise HTTPException(status_code=400, detail="Only Python code is supported in this MVP.")

    project = db.get(Project, payload.project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    parse_ok, summary, finding_dicts = analyze_python_code(payload.code)
    analysis = Analysis(
        project_id=payload.project_id,
        code=payload.code,
        language="python",
        parse_ok=parse_ok,
        summary=summary,
        status="completed" if parse_ok else "failed",
    )
    db.add(analysis)
    db.flush()

    for finding_data in finding_dicts:
        db.add(Finding(analysis_id=analysis.id, **finding_data))

    score, rationale = calculate_green_score(finding_dicts if parse_ok else [])
    db.add(
        GreenScore(
            analysis_id=analysis.id,
            score=score if parse_ok else 0,
            rationale=rationale if parse_ok else summary,
        )
    )
    db.commit()
    db.refresh(analysis)

    findings = db.query(Finding).filter(Finding.analysis_id == analysis.id).all()
    issue_count = len(findings)

    return AnalyzeResponse(
        analysis_id=analysis.id,
        parse_ok=parse_ok,
        summary=summary,
        findings=findings,
        issue_count=issue_count,
        optimization_opportunities=issue_count,
        benchmark_ready=parse_ok,
    )


@app.post("/api/optimize", response_model=OptimizeResponse)
async def optimize_code(payload: OptimizeRequest, db: Session = Depends(get_db)) -> OptimizeResponse:
    analysis = db.get(Analysis, payload.analysis_id)
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    if not analysis.parse_ok:
        raise HTTPException(status_code=400, detail="Cannot optimize invalid Python code.")

    findings = db.query(Finding).filter(Finding.analysis_id == analysis.id).all()
    explanation, optimized_code, source = await generate_optimization(analysis.code, [
        {
            "category": item.category,
            "severity": item.severity,
            "certainty": item.certainty,
            "message": item.message,
        }
        for item in findings
    ])

    existing = db.query(Optimization).filter(Optimization.analysis_id == analysis.id).first()
    if existing:
        existing.explanation = explanation
        existing.optimized_code = optimized_code
        existing.source = source
        optimization = existing
    else:
        optimization = Optimization(
            analysis_id=analysis.id,
            explanation=explanation,
            optimized_code=optimized_code,
            source=source,
        )
        db.add(optimization)

    db.commit()
    db.refresh(optimization)

    return OptimizeResponse(
        analysis_id=analysis.id,
        source=optimization.source,
        explanation=optimization.explanation,
        original_code=analysis.code,
        optimized_code=optimization.optimized_code,
    )


@app.post("/api/benchmark", response_model=BenchmarkResponse)
def benchmark(payload: BenchmarkRequest, db: Session = Depends(get_db)) -> BenchmarkResponse:
    analysis = db.get(Analysis, payload.analysis_id)
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")

    optimization = db.query(Optimization).filter(Optimization.analysis_id == analysis.id).first()
    if not optimization:
        raise HTTPException(status_code=400, detail="Run optimization before benchmarking.")

    try:
        original = run_safe_benchmark(analysis.code, payload.iterations)
        optimized = run_safe_benchmark(optimization.optimized_code, payload.iterations)
    except BenchmarkSafetyError as exc:
        raise HTTPException(status_code=400, detail=f"Benchmark blocked for safety: {exc}") from exc
    except TimeoutError as exc:
        raise HTTPException(status_code=408, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Benchmark failed: {exc}") from exc

    benchmark_row = Benchmark(
        analysis_id=analysis.id,
        iterations=payload.iterations,
        original_time_ms=original["time_ms"],
        optimized_time_ms=optimized["time_ms"],
        original_cpu_percent=original["cpu_percent"],
        optimized_cpu_percent=optimized["cpu_percent"],
        original_memory_mb=original["memory_mb"],
        optimized_memory_mb=optimized["memory_mb"],
    )
    db.add(benchmark_row)
    db.flush()

    optimized_energy_wh, optimized_co2_g, assumptions = estimate_energy_and_co2(
        optimized["time_ms"],
        optimized["cpu_percent"],
        optimized["memory_mb"],
        settings.cpu_base_power_watts,
        settings.memory_power_watts_per_gb,
        settings.grid_emission_factor_g_per_kwh,
    )

    metric = SustainabilityMetric(
        analysis_id=analysis.id,
        benchmark_id=benchmark_row.id,
        estimated_energy_wh=optimized_energy_wh,
        estimated_co2_g=optimized_co2_g,
        assumptions=assumptions,
    )
    db.add(metric)

    findings = db.query(Finding).filter(Finding.analysis_id == analysis.id).all()
    score, rationale = calculate_green_score(
        findings,
        {
            "original_time_ms": original["time_ms"],
            "optimized_time_ms": optimized["time_ms"],
        },
    )

    existing_score = db.query(GreenScore).filter(GreenScore.analysis_id == analysis.id).first()
    if existing_score:
        existing_score.score = score
        existing_score.rationale = rationale
    else:
        db.add(GreenScore(analysis_id=analysis.id, score=score, rationale=rationale))

    db.commit()
    db.refresh(benchmark_row)

    return BenchmarkResponse(
        analysis_id=analysis.id,
        benchmark_id=benchmark_row.id,
        iterations=payload.iterations,
        original_time_ms=benchmark_row.original_time_ms,
        optimized_time_ms=benchmark_row.optimized_time_ms,
        original_cpu_percent=benchmark_row.original_cpu_percent,
        optimized_cpu_percent=benchmark_row.optimized_cpu_percent,
        original_memory_mb=benchmark_row.original_memory_mb,
        optimized_memory_mb=benchmark_row.optimized_memory_mb,
        estimated_energy_wh=optimized_energy_wh,
        estimated_co2_g=optimized_co2_g,
        assumptions=assumptions,
    )


@app.get("/api/history/{project_id}", response_model=HistoryResponse)
def get_history(project_id: int, db: Session = Depends(get_db)) -> HistoryResponse:
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    analyses = db.query(Analysis).filter(Analysis.project_id == project_id).order_by(Analysis.created_at.desc()).all()
    items = []
    for analysis in analyses:
        score = db.query(GreenScore).filter(GreenScore.analysis_id == analysis.id).first()
        issue_count = db.query(Finding).filter(Finding.analysis_id == analysis.id).count()
        items.append(
            {
                "analysis_id": analysis.id,
                "created_at": analysis.created_at,
                "issue_count": issue_count,
                "green_score": score.score if score else None,
            }
        )

    return HistoryResponse(project_id=project_id, analyses=items)


@app.get("/api/dashboard/{project_id}", response_model=DashboardCard)
def get_dashboard(project_id: int, db: Session = Depends(get_db)) -> DashboardCard:
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    latest_analysis = (
        db.query(Analysis)
        .filter(Analysis.project_id == project_id)
        .order_by(Analysis.created_at.desc())
        .first()
    )

    if not latest_analysis:
        return DashboardCard(
            project_id=project_id,
            latest_analysis_id=None,
            green_score=0,
            execution_time_ms=None,
            cpu_usage_percent=None,
            memory_usage_mb=None,
            estimated_energy_wh=None,
            estimated_co2_g=None,
            issue_count=0,
            optimization_opportunities=0,
            benchmark_count=0,
        )

    score = db.query(GreenScore).filter(GreenScore.analysis_id == latest_analysis.id).first()
    latest_benchmark = (
        db.query(Benchmark)
        .filter(Benchmark.analysis_id == latest_analysis.id)
        .order_by(Benchmark.created_at.desc())
        .first()
    )
    latest_metric = (
        db.query(SustainabilityMetric)
        .filter(SustainabilityMetric.analysis_id == latest_analysis.id)
        .order_by(SustainabilityMetric.created_at.desc())
        .first()
    )
    issue_count = db.query(Finding).filter(Finding.analysis_id == latest_analysis.id).count()
    benchmark_count = db.query(Benchmark).filter(Benchmark.analysis_id == latest_analysis.id).count()

    return DashboardCard(
        project_id=project_id,
        latest_analysis_id=latest_analysis.id,
        green_score=score.score if score else 0,
        execution_time_ms=latest_benchmark.optimized_time_ms if latest_benchmark else None,
        cpu_usage_percent=latest_benchmark.optimized_cpu_percent if latest_benchmark else None,
        memory_usage_mb=latest_benchmark.optimized_memory_mb if latest_benchmark else None,
        estimated_energy_wh=latest_metric.estimated_energy_wh if latest_metric else None,
        estimated_co2_g=latest_metric.estimated_co2_g if latest_metric else None,
        issue_count=issue_count,
        optimization_opportunities=issue_count,
        benchmark_count=benchmark_count,
    )
