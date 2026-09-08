from datetime import datetime

from pydantic import BaseModel, Field


class ProjectCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    description: str | None = None


class ProjectOut(BaseModel):
    id: int
    name: str
    description: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class AnalyzeRequest(BaseModel):
    project_id: int
    code: str
    language: str = "python"


class FindingOut(BaseModel):
    category: str
    severity: str
    certainty: str
    line_number: int | None
    message: str

    class Config:
        from_attributes = True


class AnalyzeResponse(BaseModel):
    analysis_id: int
    parse_ok: bool
    summary: str
    findings: list[FindingOut]
    issue_count: int
    optimization_opportunities: int
    benchmark_ready: bool


class OptimizeRequest(BaseModel):
    analysis_id: int


class OptimizeResponse(BaseModel):
    analysis_id: int
    source: str
    explanation: str
    original_code: str
    optimized_code: str


class BenchmarkRequest(BaseModel):
    analysis_id: int
    iterations: int = Field(default=500, ge=50, le=5000)


class BenchmarkResponse(BaseModel):
    analysis_id: int
    benchmark_id: int
    iterations: int
    original_time_ms: float
    optimized_time_ms: float
    original_cpu_percent: float
    optimized_cpu_percent: float
    original_memory_mb: float
    optimized_memory_mb: float
    estimated_energy_wh: float
    estimated_co2_g: float
    assumptions: str


class AnalysisHistoryItem(BaseModel):
    analysis_id: int
    created_at: datetime
    issue_count: int
    green_score: int | None


class HistoryResponse(BaseModel):
    project_id: int
    analyses: list[AnalysisHistoryItem]


class DashboardCard(BaseModel):
    project_id: int
    latest_analysis_id: int | None
    green_score: int
    execution_time_ms: float | None
    cpu_usage_percent: float | None
    memory_usage_mb: float | None
    estimated_energy_wh: float | None
    estimated_co2_g: float | None
    issue_count: int
    optimization_opportunities: int
    benchmark_count: int
