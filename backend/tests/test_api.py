import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.core.database import Base, get_db
from app.api.seed import seed_database

from sqlalchemy.pool import StaticPool

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
    seed_database(session)

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
    assert len(res.json()) >= 2

    res = client.get("/api/academic/programs")
    assert res.status_code == 200
    assert len(res.json()) >= 3

    res = client.get("/api/academic/sections")
    assert res.status_code == 200
    assert len(res.json()) >= 6

def test_get_teachers_and_availability(client):
    res = client.get("/api/teachers")
    assert res.status_code == 200
    teachers = res.json()
    assert len(teachers) >= 8

    t_id = teachers[0]["id"]
    res_avail = client.get(f"/api/teachers/{t_id}/availability")
    assert res_avail.status_code == 200
    avails = res_avail.json()
    assert len(avails) > 0

def test_get_rooms_and_periods(client):
    res = client.get("/api/rooms")
    assert res.status_code == 200
    assert len(res.json()) >= 8

    res_days = client.get("/api/periods/days")
    assert res_days.status_code == 200
    assert len(res_days.json()) == 6

    res_periods = client.get("/api/periods")
    assert res_periods.status_code == 200
    assert len(res_periods.json()) > 20

def test_generate_and_manage_timetable(client):
    # Fetch academic year
    res_ay = client.get("/api/academic/academic-years")
    assert res_ay.status_code == 200
    ay_id = res_ay.json()[0]["id"]

    # Generate timetable
    gen_payload = {
        "academic_year_id": ay_id,
        "name": "Mid-Term Master Routine",
        "num_solutions": 2
    }
    res_gen = client.post("/api/timetable/generate", json=gen_payload)
    assert res_gen.status_code == 200
    gen_data = res_gen.json()
    assert "timetable_id" in gen_data
    tt_id = gen_data["timetable_id"]
    assert gen_data["conflict_count"] == 0

    # Get timetable details
    res_tt = client.get(f"/api/timetable/{tt_id}")
    assert res_tt.status_code == 200
    tt_data = res_tt.json()
    assert len(tt_data["entries"]) > 0

    # Validate timetable
    res_val = client.post(f"/api/timetable/validate?timetable_id={tt_id}")
    assert res_val.status_code == 200
    val_data = res_val.json()
    assert val_data["is_valid"] is True
    assert val_data["total_conflicts"] == 0

    # Test explain
    first_entry_id = tt_data["entries"][0]["id"]
    res_exp = client.get(f"/api/timetable/{tt_id}/explain/{first_entry_id}")
    assert res_exp.status_code == 200
    exp_data = res_exp.json()
    assert "reasons" in exp_data

    # Test publish
    res_pub = client.post(f"/api/timetable/{tt_id}/publish")
    assert res_pub.status_code == 200

def test_dashboard_stats(client):
    res = client.get("/api/dashboard/stats")
    assert res.status_code == 200
    stats = res.json()
    assert stats["faculties_count"] >= 2
    assert stats["programs_count"] >= 3
    assert stats["sections_count"] >= 6
    assert stats["teachers_count"] >= 8
