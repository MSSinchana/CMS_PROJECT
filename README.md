# GreenCode AI — AI for Sustainable Software

GreenCode AI is a full-stack MVP that analyzes Python code for inefficient patterns, suggests optimized alternatives, benchmarks performance in a restricted environment, and estimates sustainability impact.

Primary SDG: **SDG 12 — Responsible Consumption and Production**  
Secondary SDGs: **SDG 9** and **SDG 13**.

## Features

- Python static analysis using AST for:
  - unnecessary nested loops
  - repeated calculations
  - inefficient string operations
  - unnecessary sorting
  - excessive object creation
  - possible repeated database/API operations
- Findings with severity and certainty (`actual` vs `possible`)
- AI optimization via configurable LLM API
- Rule-based fallback optimization if no AI key is configured
- Safe benchmark endpoint (restricted subprocess + timeout + AST checks)
- Measured execution time, CPU, and memory
- **Estimated** energy and **estimated** CO₂ with documented assumptions
- Green Score (0–100)
- Project-based history and dashboard metrics
- Dockerized frontend, backend, and PostgreSQL

## Tech Stack

- Frontend: React + Vite + JavaScript + CSS + Recharts
- Backend: Python + FastAPI + SQLAlchemy
- Database: PostgreSQL

## Architecture

- `frontend/`: React app with pages for dashboard, analysis, results, optimization, benchmark, history, projects, and settings.
- `backend/app/`: FastAPI app, services, DB models, and API routes.
- `backend/tests/`: pytest tests for analyzer and core API.
- `docker-compose.yml`: local orchestration for frontend, backend, and PostgreSQL.

## Setup (Local)

### 1) Backend

```bash
cd /home/runner/work/CMS_PROJECT/CMS_PROJECT/backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Update `DATABASE_URL` to your PostgreSQL connection string.

Run API:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2) Frontend

```bash
cd /home/runner/work/CMS_PROJECT/CMS_PROJECT/frontend
npm install
cp .env.example .env
npm run dev
```

Frontend runs at `http://localhost:5173`.

## Setup (Docker)

```bash
cd /home/runner/work/CMS_PROJECT/CMS_PROJECT
docker compose up --build
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`
- PostgreSQL: `localhost:5432`

## API Endpoints

- `GET /api/health`
- `POST /api/analyze`
- `POST /api/optimize`
- `POST /api/benchmark`
- `POST /api/projects`
- `GET /api/projects`
- `GET /api/history/{project_id}`
- `GET /api/dashboard/{project_id}`

## Benchmark & Safety

- Benchmarking requires code to define `target()`.
- User code is parsed and validated against a restrictive AST policy.
- Execution runs in a subprocess with CPU/memory/time limits.
- Imports, dangerous builtins, and unsafe constructs are blocked.

## Sustainability Assumptions

The app labels all sustainability values as estimates.

- CPU model: power scales linearly with CPU utilization from `CPU_BASE_POWER_WATTS`
- Memory model: `MEMORY_POWER_WATTS_PER_GB`
- CO₂ factor: `GRID_EMISSION_FACTOR_G_PER_KWH`

These assumptions are configurable through environment variables.

## Error Handling

- Empty input and invalid Python syntax return safe errors.
- Unsupported language returns 400.
- Missing project/analysis/optimization returns 404 or 400.
- Benchmark timeout returns 408.
- AI failure falls back to rule-based recommendations.

## Tests

Backend tests:

```bash
cd /home/runner/work/CMS_PROJECT/CMS_PROJECT/backend
pytest
```

Frontend build check:

```bash
cd /home/runner/work/CMS_PROJECT/CMS_PROJECT/frontend
npm run build
```

## Limitations (MVP)

- Supports Python only.
- Benchmarking is intentionally restricted and not a full sandbox guarantee.
- LLM integration expects OpenAI-style chat-completions payloads.
- Green Score heuristic is configurable but simplified.

## Security Considerations

- No hardcoded API keys.
- `.env`-based configuration with `.env.example` templates.
- Restricted benchmark execution and bounded runtime resources.
- CORS controlled by `FRONTEND_ORIGIN`.

## SDG Alignment

- **SDG 12**: encourages resource-efficient coding decisions.
- **SDG 9**: improves software engineering innovation with measurable optimization.
- **SDG 13**: provides visibility into estimated carbon impact of code execution.
