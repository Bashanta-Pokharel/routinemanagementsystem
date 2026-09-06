import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.core.database import Base, get_db
from app.api.seed import setup_clean_bca_structure
from app.models.all_models import Faculty, Department, Program, Semester, Section, Subject, Teacher, Room, RoomType, Period, WorkingDay

def seed_test_data(db):
    setup_clean_bca_structure(db)
    dept = db.query(Department).first()
    sem1 = db.query(Semester).filter(Semester.semester_number == 1).first()
    rt = db.query(RoomType).first()
    
    # Add teachers
    t1 = Teacher(employee_id="T001", name="Bashanta Pokharel", email="bashanta@campus.edu", department_id=dept.id)
    t2 = Teacher(employee_id="T002", name="Prof. Sita Rai", email="sita@campus.edu", department_id=dept.id)
    t3 = Teacher(employee_id="T003", name="Er. Hari Thapa", email="hari@campus.edu", department_id=dept.id)
    t4 = Teacher(employee_id="T004", name="Ramesh Joshi", email="ramesh@campus.edu", department_id=dept.id)
    db.add_all([t1, t2, t3, t4])
    db.flush()

    # Add subjects
    s1 = Subject(code="CACS101", name="C Programming", semester_id=sem1.id, required_room_type_id=rt.id, weekly_periods=4, eligible_teachers=[t1])
    s2 = Subject(code="CACS102", name="Mathematics I", semester_id=sem1.id, required_room_type_id=rt.id, weekly_periods=4, eligible_teachers=[t2])
    db.add_all([s1, s2])
    db.commit()

@pytest.fixture
def client():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    session = TestingSessionLocal()
    seed_test_data(session)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
    session.close()

def test_auth_login(client):
    res = client.post("/api/auth/login", json={"email": "admin@campus.edu", "password": "admin123"})
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "admin@campus.edu"

def test_get_academic_structure(client):
    res = client.get("/api/academic/faculties")
    assert res.status_code == 200
    assert len(res.json()) >= 1

    res = client.get("/api/academic/programs")
    assert res.status_code == 200
    assert len(res.json()) >= 1

    res = client.get("/api/academic/sections")
    assert res.status_code == 200
    assert len(res.json()) >= 8

def test_get_teachers_and_rooms(client):
    res = client.get("/api/teachers")
    assert res.status_code == 200
    teachers = res.json()
    assert len(teachers) >= 4

    res = client.get("/api/rooms")
    assert res.status_code == 200
    assert len(res.json()) >= 6

    res_days = client.get("/api/periods/days")
    assert res_days.status_code == 200
    assert len(res_days.json()) == 6

def test_bca_multi_semester_endpoint(client):
    payload = {
        "routine_title": "BCA Semesters 1 & 3 Routine",
        "days": ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "periods": [
            {"name": "Period 1", "start_time": "10:00 AM", "end_time": "11:00 AM", "type": "Teaching"},
            {"name": "Period 2", "start_time": "11:00 AM", "end_time": "12:00 PM", "type": "Teaching"},
            {"name": "Break", "start_time": "12:00 PM", "end_time": "12:30 PM", "type": "Break"},
            {"name": "Period 3", "start_time": "12:30 PM", "end_time": "01:30 PM", "type": "Teaching"},
            {"name": "Period 4", "start_time": "01:30 PM", "end_time": "02:30 PM", "type": "Teaching"},
        ],
        "teachers": [
            {
                "name": "Bashanta Pokharel",
                "speciality": "C Programming, Data Structures",
                "free_time_start": "10:00 AM",
                "free_time_end": "02:30 PM"
            },
            {
                "name": "Prof. Sita Rai",
                "speciality": "Calculus, Statistics",
                "free_time_start": "10:00 AM",
                "free_time_end": "02:30 PM"
            }
        ],
        "running_semesters": [
            {
                "semester_number": 1,
                "semester_name": "BCA Semester 1",
                "section_name": "BCA 1st Sem",
                "room_name": "Room 101",
                "subjects": [
                    {"name": "C Programming", "weekly_periods": 4, "teacher_name": "Bashanta Pokharel"},
                    {"name": "Mathematics I", "weekly_periods": 4, "teacher_name": "Prof. Sita Rai"}
                ]
            },
            {
                "semester_number": 3,
                "semester_name": "BCA Semester 3",
                "section_name": "BCA 3rd Sem",
                "room_name": "Room 102",
                "subjects": [
                    {"name": "Data Structures", "weekly_periods": 4, "teacher_name": "Bashanta Pokharel"},
                    {"name": "Statistics", "weekly_periods": 4, "teacher_name": "Prof. Sita Rai"}
                ]
            }
        ]
    }

    res = client.post("/api/timetable/bca-routine", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["conflict_count"] == 0
    assert data["total_classes"] == 16
    assert "semester_routines" in data
    assert "teacher_routines" in data

def test_clean_reset_endpoint(client):
    res = client.post("/api/seed/clean-reset")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
