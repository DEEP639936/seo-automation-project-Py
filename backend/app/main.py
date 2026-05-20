from datetime import datetime
from contextlib import asynccontextmanager
import time
import bcrypt

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError, HTTPException
from sqlalchemy.exc import IntegrityError
from jose import JWTError

from app.config import settings
from app.database import engine, Base, SessionLocal
from app.models import *  # noqa: F401,F403 - import all models to register them
from app.models.user import User
from app.routers import (
    auth_router, website_router, audit_router, keyword_router,
    content_router, ranking_router, backlink_router, report_router, dashboard_router,
)
from app.middleware.error_handler import (
    validation_error_handler, http_exception_handler,
    integrity_error_handler, jwt_error_handler, generic_exception_handler,
)
from app.cron.scheduled_jobs import start_scheduler, shutdown_scheduler
from app.utils.logger import logger


# ── Password helper (no passlib) ──────────────────────────────────────────────

def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


# ── Demo user seeder ──────────────────────────────────────────────────────────

def seed_demo_user() -> None:
    """Create a local demo account so a fresh database has a working login."""
    if not settings.use_mock_data:
        return

    db = SessionLocal()
    try:
        existing_user = db.query(User).filter(User.email == settings.demo_user_email).first()
        if existing_user:
            return

        demo_user = User(
            email=settings.demo_user_email,
            password=hash_password(settings.demo_user_password),  # ← bcrypt directly
            first_name="Demo",
            last_name="User",
        )
        db.add(demo_user)
        db.commit()
        logger.info(f"Demo user created: {settings.demo_user_email}")
    finally:
        db.close()


# ── App lifespan ──────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    Base.metadata.create_all(bind=engine)
    logger.info("SQLite database connected and tables created.")
    seed_demo_user()
    start_scheduler()
    yield
    # Shutdown
    shutdown_scheduler()
    logger.info("Application shutting down.")


# ── App init ──────────────────────────────────────────────────────────────────

app = FastAPI(
    title="SEO Automation API",
    description="AI-Powered SEO Automation System Backend",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://seo-automation-project.vercel.app",
        "https://seo-automation-project-py.vercel.app",
    ],
    allow_origin_regex=r"https://seo-automation-project-py-.*\.vercel\.app",  # ← ADD THIS LINE
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Compression
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    duration = (time.time() - start_time) * 1000
    logger.info(f"{request.method} {request.url.path} - {response.status_code} - {duration:.2f}ms")
    return response

# Exception handlers
app.add_exception_handler(RequestValidationError, validation_error_handler)
app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(IntegrityError, integrity_error_handler)
app.add_exception_handler(JWTError, jwt_error_handler)
app.add_exception_handler(Exception, generic_exception_handler)


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/")
async def root():
    return {
        "status": "success",
        "message": "SEO Automation API is running",
        "docs": "/docs",
        "health": "/api/health",
        "version": "1.0.0",
    }


@app.get("/api/health")
async def health_check():
    return {
        "status": "success",
        "message": "SEO Automation API is running",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0",
    }


app.include_router(auth_router)
app.include_router(website_router)
app.include_router(audit_router)
app.include_router(keyword_router)
app.include_router(content_router)
app.include_router(ranking_router)
app.include_router(backlink_router)
app.include_router(report_router)
app.include_router(dashboard_router)


@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    return JSONResponse(
        status_code=404,
        content={"status": "error", "message": "Route not found"},
    )