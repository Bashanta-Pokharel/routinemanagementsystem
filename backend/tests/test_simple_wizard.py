import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.models.all_models import Base, Timetable, TimetableEntry, Teacher, Subject
from app.scheduler.simple_wizard import (
    parse_time_to_minutes,
    is_period_within_teacher_free_time,
    generate_simple_wizard_routine
)

@pytest.fixture
def db():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSessionLocal()
    yield session
    session.close()

def test_time_parsing_and_free_intervals():
    assert parse_time_to_minutes("08:00 AM") == 480
    assert parse_time_to_minutes("10:00 AM") == 600
    assert parse_time_to_minutes("12:00 PM") == 720
    assert parse_time_to_minutes("01:00 PM") == 780
    assert parse_time_to_minutes("03:30 PM") == 930

    # Test free time interval matching
    # Teacher Bashanta free from 1:00 PM to 3:30 PM
    t_start = "01:00 PM"
    t_end = "03:30 PM"

    # Slot at 10:00 AM - 11:00 AM -> Outside free time
    assert is_period_within_teacher_free_time("10:00 AM", "11:00 AM", t_start, t_end) is False

    # Slot at 01:30 PM - 02:30 PM -> Inside free time
    assert is_period_within_teacher_free_time("01:30 PM", "02:30 PM", t_start, t_end) is True

    # Slot at 02:30 PM - 03:30 PM -> Inside free time
    assert is_period_within_teacher_free_time("02:30 PM", "03:30 PM", t_start, t_end) is True

def test_generate_simple_wizard_routine_with_teacher_free_times(db):
    class_name = "BCA 1st Sem"
    days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    periods = [
        {"name": "Period 1", "start_time": "10:00 AM", "end_time": "11:00 AM", "type": "Teaching"},
        {"name": "Period 2", "start_time": "11:00 AM", "end_time": "12:00 PM", "type": "Teaching"},
        {"name": "Break", "start_time": "12:00 PM", "end_time": "12:30 PM", "type": "Break"},
        {"name": "Period 3", "start_time": "12:30 PM", "end_time": "01:30 PM", "type": "Teaching"},
        {"name": "Period 4", "start_time": "01:30 PM", "end_time": "02:30 PM", "type": "Teaching"},
        {"name": "Period 5", "start_time": "02:30 PM", "end_time": "03:30 PM", "type": "Teaching"},
    ]

    subjects = [
        {
            "name": "C Programming",
            "weekly_periods": 4,
            "teacher_name": "Bashanta",
            "free_time_start": "01:00 PM",
            "free_time_end": "03:30 PM"
        },
        {
            "name": "Mathematics I",
            "weekly_periods": 4,
            "teacher_name": "Sita Rai",
            "free_time_start": "10:00 AM",
            "free_time_end": "12:00 PM"
        },
        {
            "name": "Digital Logic",
            "weekly_periods": 4,
            "teacher_name": "Hari Thapa",
            "free_time_start": "11:00 AM",
            "free_time_end": "01:30 PM"
        },
        {
            "name": "Computer Fundamentals",
            "weekly_periods": 4,
            "teacher_name": "Ramesh Joshi",
            "free_time_start": "10:00 AM",
            "free_time_end": "03:30 PM"
        },
        {
            "name": "Society and Technology",
            "weekly_periods": 3,
            "teacher_name": "Anita Shrestha",
            "free_time_start": "10:00 AM",
            "free_time_end": "03:30 PM"
        },
        {
            "name": "English I",
            "weekly_periods": 3,
            "teacher_name": "Pooja Adhikari",
            "free_time_start": "10:00 AM",
            "free_time_end": "03:30 PM"
        },
    ]

    result = generate_simple_wizard_routine(
        db=db,
        class_name=class_name,
        days_list=days,
        periods_list=periods,
        subjects_list=subjects
    )

    assert "timetable_id" in result
    assert result["conflict_count"] == 0
    assert len(result["entries"]) >= 22

    # Verify teacher Bashanta was ONLY scheduled in afternoon slots (1:30 PM - 3:30 PM)
    bashanta_entries = [e for e in result["entries"] if e["teacher_name"] == "Bashanta"]
    assert len(bashanta_entries) == 4
    for e in bashanta_entries:
        assert e["start_time"] in ("01:30 PM", "02:30 PM", "12:30 PM")

    # Verify teacher Sita Rai was ONLY scheduled in morning slots (10:00 AM - 12:00 PM)
    sita_entries = [e for e in result["entries"] if e["teacher_name"] == "Sita Rai"]
    assert len(sita_entries) == 4
    for e in sita_entries:
        assert e["start_time"] in ("10:00 AM", "11:00 AM")

    # Verify Database persistence
    tt = db.query(Timetable).filter(Timetable.id == result["timetable_id"]).first()
    assert tt is not None
    assert len(tt.entries) == len(result["entries"])

def test_variable_periods_per_day(db):
    class_name = "CSIT 2nd Sem"
    days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    periods = [
        {"name": "Period 1", "start_time": "10:00 AM", "end_time": "11:00 AM", "type": "Teaching"},
        {"name": "Period 2", "start_time": "11:00 AM", "end_time": "12:00 PM", "type": "Teaching"},
        {"name": "Period 3", "start_time": "12:00 PM", "end_time": "01:00 PM", "type": "Teaching"},
        {"name": "Period 4", "start_time": "01:00 PM", "end_time": "02:00 PM", "type": "Teaching"},
        {"name": "Period 5", "start_time": "02:00 PM", "end_time": "03:00 PM", "type": "Teaching"},
    ]

    # Sunday - Thursday has 4 periods, Friday has only 3 periods
    day_period_counts = {
        "Sunday": 4,
        "Monday": 4,
        "Tuesday": 4,
        "Wednesday": 4,
        "Thursday": 4,
        "Friday": 3
    }

    subjects = [
        {"name": "Data Structures", "weekly_periods": 4, "teacher_name": "Bashanta", "free_time_start": "10:00 AM", "free_time_end": "03:00 PM"},
        {"name": "Linear Algebra", "weekly_periods": 4, "teacher_name": "Sita Rai", "free_time_start": "10:00 AM", "free_time_end": "03:00 PM"},
        {"name": "Microprocessor", "weekly_periods": 4, "teacher_name": "Hari Thapa", "free_time_start": "10:00 AM", "free_time_end": "03:00 PM"},
        {"name": "OOP in C++", "weekly_periods": 4, "teacher_name": "Ramesh Joshi", "free_time_start": "10:00 AM", "free_time_end": "03:00 PM"},
        {"name": "Discrete Math", "weekly_periods": 3, "teacher_name": "Anita Shrestha", "free_time_start": "10:00 AM", "free_time_end": "03:00 PM"},
    ]

    result = generate_simple_wizard_routine(
        db=db,
        class_name=class_name,
        days_list=days,
        periods_list=periods,
        subjects_list=subjects,
        day_period_counts=day_period_counts
    )

    assert result["conflict_count"] == 0
    assert len(result["entries"]) >= 18
    # Verify that Friday entries do not exceed 3 periods (Period 1, 2, 3)
    friday_entries = [e for e in result["entries"] if e["day_name"] == "Friday"]
    assert len(friday_entries) <= 3
    for fe in friday_entries:
        assert fe["period_name"] in ("Period 1", "Period 2", "Period 3")

