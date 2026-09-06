import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.models.all_models import Base, Timetable, TimetableEntry, Teacher, Subject, Section
from app.scheduler.bca_multi_semester import generate_bca_multi_semester_routine

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

def test_bca_multi_semester_concurrent_scheduling(db):
    """
    Test that when multiple BCA semesters run concurrently and share teachers:
    1. A teacher is NEVER assigned to two different semesters at the same day & period.
    2. Teacher free time intervals are strictly respected.
    3. All running semesters get full required periods scheduled.
    """
    days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    periods = [
        {"name": "Period 1", "start_time": "10:00 AM", "end_time": "11:00 AM", "type": "Teaching"},
        {"name": "Period 2", "start_time": "11:00 AM", "end_time": "12:00 PM", "type": "Teaching"},
        {"name": "Break", "start_time": "12:00 PM", "end_time": "12:30 PM", "type": "Break"},
        {"name": "Period 3", "start_time": "12:30 PM", "end_time": "01:30 PM", "type": "Teaching"},
        {"name": "Period 4", "start_time": "01:30 PM", "end_time": "02:30 PM", "type": "Teaching"},
        {"name": "Period 5", "start_time": "02:30 PM", "end_time": "03:30 PM", "type": "Teaching"},
    ]

    day_period_counts = {
        "Sunday": 6,
        "Monday": 6,
        "Tuesday": 6,
        "Wednesday": 6,
        "Thursday": 6,
        "Friday": 4
    }

    # Teachers list with specialty and free time windows
    teachers = [
        {
            "name": "Bashanta Pokharel",
            "speciality": "C Programming, Data Structures, Java OOP",
            "free_time_start": "10:00 AM",
            "free_time_end": "03:30 PM",
            "max_classes_per_day": 4
        },
        {
            "name": "Prof. Sita Rai",
            "speciality": "Calculus, Numerical Methods, Statistics",
            "free_time_start": "10:00 AM",
            "free_time_end": "01:30 PM",
            "max_classes_per_day": 3
        },
        {
            "name": "Er. Hari Thapa",
            "speciality": "Digital Logic, Computer Architecture, Microprocessor",
            "free_time_start": "11:00 AM",
            "free_time_end": "03:30 PM",
            "max_classes_per_day": 3
        },
        {
            "name": "Ramesh Joshi",
            "speciality": "Database Systems, Computer Fundamentals, Web Tech",
            "free_time_start": "10:00 AM",
            "free_time_end": "03:30 PM",
            "max_classes_per_day": 4
        },
    ]

    # Two concurrently running semesters: BCA 1st Sem and BCA 3rd Sem
    running_semesters = [
        {
            "semester_number": 1,
            "semester_name": "BCA Semester 1",
            "section_name": "BCA 1st Sem",
            "room_name": "Room 101",
            "subjects": [
                {"name": "C Programming", "code": "CACS101", "weekly_periods": 4, "teacher_name": "Bashanta Pokharel"},
                {"name": "Mathematics I", "code": "CACS102", "weekly_periods": 4, "teacher_name": "Prof. Sita Rai"},
                {"name": "Digital Logic", "code": "CACS103", "weekly_periods": 4, "teacher_name": "Er. Hari Thapa"},
                {"name": "Computer Fundamentals", "code": "CACS104", "weekly_periods": 4, "teacher_name": "Ramesh Joshi"},
            ]
        },
        {
            "semester_number": 3,
            "semester_name": "BCA Semester 3",
            "section_name": "BCA 3rd Sem",
            "room_name": "Room 102",
            "subjects": [
                {"name": "Data Structures & Algorithms", "code": "CACS201", "weekly_periods": 4, "teacher_name": "Bashanta Pokharel"},
                {"name": "Numerical Methods", "code": "CACS202", "weekly_periods": 4, "teacher_name": "Prof. Sita Rai"},
                {"name": "Computer Architecture", "code": "CACS203", "weekly_periods": 4, "teacher_name": "Er. Hari Thapa"},
                {"name": "Database Management System", "code": "CACS204", "weekly_periods": 4, "teacher_name": "Ramesh Joshi"},
            ]
        }
    ]

    result = generate_bca_multi_semester_routine(
        db=db,
        running_semesters=running_semesters,
        teachers_list=teachers,
        days_list=days,
        periods_list=periods,
        day_period_counts=day_period_counts,
        routine_title="BCA Sem 1 & 3 Master Schedule"
    )

    assert result["conflict_count"] == 0
    assert result["total_classes"] == 32 # 16 periods each semester
    assert len(result["semester_routines"]) == 2

    # Check that Bashanta teaches 8 total periods (4 in Sem 1, 4 in Sem 3)
    bashanta_entries = [e for e in result["all_entries"] if e["teacher_name"] == "Bashanta Pokharel"]
    assert len(bashanta_entries) == 8

    # CRITICAL CHECK: Ensure Bashanta has ZERO double-booking across semesters
    bashanta_slots = set()
    for entry in bashanta_entries:
        slot_key = (entry["day_name"], entry["period_name"])
        assert slot_key not in bashanta_slots, f"CLASH! Bashanta double booked on {slot_key}"
        bashanta_slots.add(slot_key)

    # CRITICAL CHECK: Ensure Prof. Sita Rai has ZERO double-booking and only scheduled in morning (10:00 - 01:30)
    sita_entries = [e for e in result["all_entries"] if e["teacher_name"] == "Prof. Sita Rai"]
    assert len(sita_entries) == 8
    sita_slots = set()
    for entry in sita_entries:
        slot_key = (entry["day_name"], entry["period_name"])
        assert slot_key not in sita_slots, f"CLASH! Sita Rai double booked on {slot_key}"
        sita_slots.add(slot_key)
        assert entry["start_time"] in ("10:00 AM", "11:00 AM", "12:30 PM")

    # Verify Database Persistence
    tt = db.query(Timetable).filter(Timetable.id == result["timetable_id"]).first()
    assert tt is not None
    assert len(tt.entries) == 32


def test_demo_teacher_and_single_class_per_day_guarantee(db):
    """
    Test that:
    1. No subject is EVER scheduled more than once per day (0 or 1 class/day).
    2. When a teacher is only available on 2 days, the remaining periods are assigned to a Demo Teacher on other days.
    """
    days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    periods = [
        {"name": "Period 1", "start_time": "10:00 AM", "end_time": "11:00 AM", "type": "Teaching"},
        {"name": "Period 2", "start_time": "11:00 AM", "end_time": "12:00 PM", "type": "Teaching"},
        {"name": "Break", "start_time": "12:00 PM", "end_time": "12:30 PM", "type": "Break"},
        {"name": "Period 3", "start_time": "12:30 PM", "end_time": "01:30 PM", "type": "Teaching"},
        {"name": "Period 4", "start_time": "01:30 PM", "end_time": "02:30 PM", "type": "Teaching"},
    ]

    # Teacher ST is ONLY available on Sunday and Monday (2 days)
    teachers = [
        {
            "name": "Teacher ST",
            "speciality": "Society and Technology",
            "free_time_start": "10:00 AM",
            "free_time_end": "02:30 PM",
            "free_days": ["Sunday", "Monday"],
            "max_classes_per_day": 2
        }
    ]

    # Subject requires 4 weekly periods
    running_semesters = [
        {
            "semester_number": 5,
            "semester_name": "BCA Semester 5",
            "section_name": "BCA 5th Sem",
            "room_name": "Room 501",
            "subjects": [
                {"name": "Society and Technology", "code": "BCA305", "weekly_periods": 4, "teacher_name": "Teacher ST"},
            ]
        }
    ]

    result = generate_bca_multi_semester_routine(
        db=db,
        running_semesters=running_semesters,
        teachers_list=teachers,
        days_list=days,
        periods_list=periods,
        routine_title="BCA Sem 5 Demo Teacher Test"
    )

    assert result["conflict_count"] == 0
    assert len(result["all_entries"]) == 4

    # 1. STRICT CHECK: No day has more than 1 class of Society and Technology!
    day_counts = {}
    for entry in result["all_entries"]:
        d_name = entry["day_name"]
        day_counts[d_name] = day_counts.get(d_name, 0) + 1
        assert day_counts[d_name] == 1, f"Violation: {entry['subject_name']} scheduled {day_counts[d_name]} times on {d_name}!"

    # 2. Check that 2 periods were taught by Teacher ST and 2 periods by Demo Teacher on other days
    st_entries = [e for e in result["all_entries"] if e["teacher_name"] == "Teacher ST"]
    demo_entries = [e for e in result["all_entries"] if "Demo" in e["teacher_name"]]

    assert len(st_entries) == 2
    assert len(demo_entries) == 2
    for e in demo_entries:
        assert e["day_name"] in ("Tuesday", "Wednesday", "Thursday", "Friday")
        assert e["teacher_abbreviation"] == "DEMO"
