from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "GreenCode AI API"
    app_env: str = "development"
    app_debug: bool = True
    database_url: str = "******localhost:5432/greencode_ai"
    frontend_origin: str = "http://localhost:5173"

    llm_api_url: str | None = None
    llm_api_key: str | None = None
    llm_model: str | None = None

    benchmark_timeout_seconds: int = 5
    benchmark_max_iterations: int = 5000

    grid_emission_factor_g_per_kwh: float = 475.0
    cpu_base_power_watts: float = 65.0
    memory_power_watts_per_gb: float = 0.372

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache
def get_settings() -> Settings:
    return Settings()
