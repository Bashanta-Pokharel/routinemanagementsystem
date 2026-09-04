from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.api.auth import router as auth_router
from app.api.campus import router as campus_router
from app.api.teachers import router as teachers_router
from app.api.subjects import router as subjects_router
from app.api.rooms import router as rooms_router
from app.api.periods import router as periods_router
from app.api.timetable import router as timetable_router
from app.api.dashboard import router as dashboard_router
from app.api.rules import router as rules_router
from app.api.notifications import router as system_router
from app.api.seed import router as seed_router, seed_database

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB schema
    Base.metadata.create_all(bind=engine)
    # Seed initial data if empty
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Smart University and College Routine & Timetable Optimization Management System with CP-SAT Constraint Engine.",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(campus_router, prefix=settings.API_V1_STR)
app.include_router(teachers_router, prefix=settings.API_V1_STR)
app.include_router(subjects_router, prefix=settings.API_V1_STR)
app.include_router(rooms_router, prefix=settings.API_V1_STR)
app.include_router(periods_router, prefix=settings.API_V1_STR)
app.include_router(timetable_router, prefix=settings.API_V1_STR)
app.include_router(dashboard_router, prefix=settings.API_V1_STR)
app.include_router(rules_router, prefix=settings.API_V1_STR)
app.include_router(system_router, prefix=settings.API_V1_STR)
app.include_router(seed_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "app": settings.PROJECT_NAME,
        "status": "online",
        "docs": "/docs",
        "message": "UniSchedule Routine Engine API is ready."
    }
