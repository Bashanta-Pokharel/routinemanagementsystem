import os
from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = "UniSchedule - Campus & College Routine Management System"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "unischedule_super_secure_jwt_secret_key_2026_xyz_789")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    ALGORITHM: str = "HS256"
    # MySQL XAMPP default: root, no password, localhost:3306, routinedb
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "mysql+pymysql://root:@localhost:3306/routinedb?charset=utf8mb4"
    )
    SQLITE_FALLBACK_URL: str = "sqlite:///./timetable.db"

settings = Settings()
