from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    analyses: Mapped[list["Analysis"]] = relationship("Analysis", back_populates="project")


class Analysis(Base):
    __tablename__ = "analyses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"), index=True)
    code: Mapped[str] = mapped_column(Text, nullable=False)
    language: Mapped[str] = mapped_column(String(40), default="python")
    status: Mapped[str] = mapped_column(String(40), default="completed")
    parse_ok: Mapped[bool] = mapped_column(default=True)
    summary: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    project: Mapped[Project] = relationship("Project", back_populates="analyses")
    findings: Mapped[list["Finding"]] = relationship("Finding", back_populates="analysis", cascade="all, delete-orphan")
    optimization: Mapped[Optimization | None] = relationship("Optimization", back_populates="analysis", uselist=False, cascade="all, delete-orphan")
    benchmarks: Mapped[list["Benchmark"]] = relationship("Benchmark", back_populates="analysis", cascade="all, delete-orphan")
    sustainability_metrics: Mapped[list["SustainabilityMetric"]] = relationship("SustainabilityMetric", back_populates="analysis", cascade="all, delete-orphan")
    green_score: Mapped[GreenScore | None] = relationship("GreenScore", back_populates="analysis", uselist=False, cascade="all, delete-orphan")


class Finding(Base):
    __tablename__ = "findings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    analysis_id: Mapped[int] = mapped_column(ForeignKey("analyses.id"), index=True)
    category: Mapped[str] = mapped_column(String(80))
    severity: Mapped[str] = mapped_column(String(20))
    certainty: Mapped[str] = mapped_column(String(20), default="possible")
    line_number: Mapped[int | None] = mapped_column(Integer, nullable=True)
    message: Mapped[str] = mapped_column(Text)

    analysis: Mapped[Analysis] = relationship("Analysis", back_populates="findings")


class Optimization(Base):
    __tablename__ = "optimizations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    analysis_id: Mapped[int] = mapped_column(ForeignKey("analyses.id"), unique=True, index=True)
    explanation: Mapped[str] = mapped_column(Text)
    optimized_code: Mapped[str] = mapped_column(Text)
    source: Mapped[str] = mapped_column(String(20), default="rules")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    analysis: Mapped[Analysis] = relationship("Analysis", back_populates="optimization")


class Benchmark(Base):
    __tablename__ = "benchmarks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    analysis_id: Mapped[int] = mapped_column(ForeignKey("analyses.id"), index=True)
    iterations: Mapped[int] = mapped_column(Integer, default=1000)
    original_time_ms: Mapped[float] = mapped_column(Float)
    optimized_time_ms: Mapped[float] = mapped_column(Float)
    original_cpu_percent: Mapped[float] = mapped_column(Float)
    optimized_cpu_percent: Mapped[float] = mapped_column(Float)
    original_memory_mb: Mapped[float] = mapped_column(Float)
    optimized_memory_mb: Mapped[float] = mapped_column(Float)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    analysis: Mapped[Analysis] = relationship("Analysis", back_populates="benchmarks")


class SustainabilityMetric(Base):
    __tablename__ = "sustainability_metrics"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    analysis_id: Mapped[int] = mapped_column(ForeignKey("analyses.id"), index=True)
    benchmark_id: Mapped[int | None] = mapped_column(ForeignKey("benchmarks.id"), nullable=True)
    estimated_energy_wh: Mapped[float] = mapped_column(Float)
    estimated_co2_g: Mapped[float] = mapped_column(Float)
    assumptions: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    analysis: Mapped[Analysis] = relationship("Analysis", back_populates="sustainability_metrics")


class GreenScore(Base):
    __tablename__ = "green_scores"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    analysis_id: Mapped[int] = mapped_column(ForeignKey("analyses.id"), unique=True, index=True)
    score: Mapped[int] = mapped_column(Integer)
    rationale: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    analysis: Mapped[Analysis] = relationship("Analysis", back_populates="green_score")
