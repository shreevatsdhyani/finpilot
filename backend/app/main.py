"""FinPilot AI — FastAPI application entry-point."""

from __future__ import annotations

from contextlib import asynccontextmanager

from bson.errors import InvalidId
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.db.mongo import get_db, seed_news, seed_policies

# Import routers
from app.routes import (
    assistant,
    audit,
    auth,
    dashboard,
    expenses,
    forecast,
    news,
    policies,
    recommendations,
    scenarios,
    settings as settings_route,
    salary,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: seed DB (graceful if Mongo is not yet ready)
    try:
        db = get_db()
        seed_policies(db)
        seed_news(db)
        print("[OK] MongoDB connected & seeded")
    except Exception as e:
        print(f"[WARN] MongoDB seed skipped (will retry on first request): {e}")
    yield


app = FastAPI(
    title="FinPilot AI",
    description="Local-first predictive personal finance copilot API",
    version="0.1.0",
    lifespan=lifespan,
)


# ── Global exception handler for invalid MongoDB ObjectId strings ──
@app.exception_handler(InvalidId)
async def invalid_object_id_handler(request: Request, exc: InvalidId):
    return JSONResponse(
        status_code=400,
        content={"detail": f"Invalid ID format: {exc}"},
    )

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(salary.router)
app.include_router(expenses.router)
app.include_router(forecast.router)
app.include_router(scenarios.router)
app.include_router(recommendations.router)
app.include_router(assistant.router)
app.include_router(policies.router)
app.include_router(news.router)
app.include_router(audit.router)
app.include_router(settings_route.router)


@app.get("/health")
def health():
    return {"status": "ok"}
