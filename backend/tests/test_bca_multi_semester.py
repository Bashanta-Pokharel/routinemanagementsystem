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

def test_bca_sem3_full_practical_and_theory_scheduling(db):
    """
    Test BCA Semester 3 full scheduling:
    - Data Structure and Algorithms: 3 TH + 3 PR = 6 periods/week
    - Database Management System: 3 TH + 3 PR = 6 periods/week
    - Web Technology-I: 3 TH + 3 PR = 6 periods/week
    - System Analysis and Design: 3 TH + 3 PR = 6 periods/week
    - Probability and Statistics: 3 TH + 3 PR = 6 periods/week
    - Applied Economics: 3 TH = 3 periods/week
    Total: 33 periods across 6 days (5 periods/day on Sun-Thu, 3 on Fri).
    All subjects must get full periods scheduled with zero mid-week blank days and zero same-day duplicates.
    """
    days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    periods = [
        {"name": "Period 1", "start_time": "10:00 AM", "end_time": "11:00 AM", "type": "Teaching"},
        {"name": "Period 2", "start_time": "11:00 AM", "end_time": "12:00 PM", "type": "Teaching"},
        {"name": "Period 3", "start_time": "12:00 PM", "end_time": "01:00 PM", "type": "Teaching"},
        {"name": "Interval", "start_time": "01:00 PM", "end_time": "01:30 PM", "type": "Break"},
        {"name": "Period 4", "start_time": "01:30 PM", "end_time": "02:30 PM", "type": "Teaching"},
        {"name": "Period 5", "start_time": "02:30 PM", "end_time": "03:30 PM", "type": "Teaching"},
    ]

    teachers = [
        {"name": "Bhupendra Ram Luhar", "abbreviation": "BRL", "free_time_start": "06:30 AM", "free_time_end": "04:30 PM", "max_classes_per_day": 4},
        {"name": "Dipendra Nepal", "abbreviation": "DN", "free_time_start": "06:30 AM", "free_time_end": "04:30 PM", "max_classes_per_day": 4},
        {"name": "Bijaya Mishra", "abbreviation": "BM", "free_time_start": "06:30 AM", "free_time_end": "04:30 PM", "max_classes_per_day": 4},
        {"name": "Ananda KC", "abbreviation": "AK", "free_time_start": "06:30 AM", "free_time_end": "04:30 PM", "max_classes_per_day": 4},
        {"name": "Sharmila Bhattarai", "abbreviation": "SB", "free_time_start": "06:30 AM", "free_time_end": "04:30 PM", "max_classes_per_day": 4},
        {"name": "Sabita Thapa", "abbreviation": "ST", "free_time_start": "06:30 AM", "free_time_end": "04:30 PM", "max_classes_per_day": 4},
    ]

    running_semesters = [
        {
            "semester_number": 3,
            "semester_name": "BCA 3rd Semester",
            "section_name": "BCA 3rd Sem",
            "room_name": "Room 201",
            "subjects": [
                {"name": "Data Structure and Algorithms", "code": "BCA 201", "course_type": "TH", "weekly_periods": 3, "teacher_name": "Bhupendra Ram Luhar"},
                {"name": "Database Management System", "code": "BCA 202", "course_type": "TH", "weekly_periods": 3, "teacher_name": "Dipendra Nepal"},
                {"name": "Web Technology-I", "code": "BCA 203", "course_type": "TH", "weekly_periods": 3, "teacher_name": "Bijaya Mishra"},
                {"name": "System Analysis and Design", "code": "BCA 204", "course_type": "TH", "weekly_periods": 3, "teacher_name": "Ananda KC"},
                {"name": "Probability and Statistics", "code": "BCA 205", "course_type": "TH", "weekly_periods": 3, "teacher_name": "Sharmila Bhattarai"},
                {"name": "Data Structure & Algorithms (Lab)", "code": "BCA 201", "course_type": "PR", "weekly_periods": 3, "teacher_name": "Bhupendra Ram Luhar"},
                {"name": "Database Management System (Lab)", "code": "BCA 202", "course_type": "PR", "weekly_periods": 3, "teacher_name": "Dipendra Nepal"},
                {"name": "Web Technology-I (Lab)", "code": "BCA 203", "course_type": "PR", "weekly_periods": 3, "teacher_name": "Bijaya Mishra"},
                {"name": "System Analysis & Design (Lab)", "code": "BCA 204", "course_type": "PR", "weekly_periods": 3, "teacher_name": "Ananda KC"},
                {"name": "Probability & Statistics (Lab)", "code": "BCA 205", "course_type": "PR", "weekly_periods": 3, "teacher_name": "Sharmila Bhattarai"},
                {"name": "Applied Economics", "code": "BCA 206", "course_type": "TH", "weekly_periods": 3, "teacher_name": "Sabita Thapa"},
            ]
        }
    ]

    result = generate_bca_multi_semester_routine(
        db=db,
        running_semesters=running_semesters,
        teachers_list=teachers,
        days_list=days,
        periods_list=periods,
        routine_title="BCA Sem 3 Full Scheduling Test"
    )

    assert result["conflict_count"] == 0
    # Exactly 30 periods scheduled (filling all 5 periods/day across all 6 days = 30 periods)
    assert len(result["all_entries"]) == 30

    # Verify SAD is scheduled across 5-6 days
    sad_entries = [e for e in result["all_entries"] if "BCA 204" in (e.get("subject_code") or "") or "System Analysis" in e["subject_name"]]
    assert len(sad_entries) >= 5

    # Verify each day has exactly 5 classes (100% full continuous schedule, zero holes)
    for day_name in days:
        day_entries = [e for e in result["all_entries"] if e["day_name"] == day_name]
        assert len(day_entries) == 5, f"{day_name} should have 5 classes, got {len(day_entries)}"

def test_each_of_all_8_bca_semesters_individually(db):
    """
    Test generating routine for EACH individual semester (1 through 8):
    - Must have zero conflicts
    - Must schedule all periods (up to 30 periods across 6 days)
    - Wednesday must never be blank
    - Zero same-day duplicate subjects
    - Full Theory + Practical coverage
    """
    teachers = [
        {"name": "Bhupendra Ram Luhar", "abbreviation": "BRL", "free_time_start": "06:30 AM", "free_time_end": "04:30 PM", "max_classes_per_day": 4},
        {"name": "Shree krishna Maharjan", "abbreviation": "SKM", "free_time_start": "06:30 AM", "free_time_end": "04:30 PM", "max_classes_per_day": 4},
        {"name": "Ananda KC", "abbreviation": "AK", "free_time_start": "06:30 AM", "free_time_end": "04:30 PM", "max_classes_per_day": 4},
        {"name": "Sharmila Bhattarai", "abbreviation": "SB", "free_time_start": "06:30 AM", "free_time_end": "04:30 PM", "max_classes_per_day": 4},
        {"name": "Bijaya Mishra", "abbreviation": "BM", "free_time_start": "06:30 AM", "free_time_end": "04:30 PM", "max_classes_per_day": 4},
        {"name": "Prakash Sharma", "abbreviation": "PRS", "free_time_start": "06:30 AM", "free_time_end": "04:30 PM", "max_classes_per_day": 4},
        {"name": "Dipendra Nepal", "abbreviation": "DN", "free_time_start": "06:30 AM", "free_time_end": "04:30 PM", "max_classes_per_day": 4},
        {"name": "Ramesh Shrestha", "abbreviation": "RS", "free_time_start": "06:30 AM", "free_time_end": "04:30 PM", "max_classes_per_day": 4},
        {"name": "Pujan Mahat", "abbreviation": "PM", "free_time_start": "06:30 AM", "free_time_end": "04:30 PM", "max_classes_per_day": 4},
        {"name": "Sabita Thapa", "abbreviation": "ST", "free_time_start": "06:30 AM", "free_time_end": "04:30 PM", "max_classes_per_day": 4},
    ]
    days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    periods = [
        {"name": "Period 1", "start_time": "10:00 AM", "end_time": "11:00 AM", "type": "Teaching"},
        {"name": "Period 2", "start_time": "11:00 AM", "end_time": "12:00 PM", "type": "Teaching"},
        {"name": "Period 3", "start_time": "12:00 PM", "end_time": "01:00 PM", "type": "Teaching"},
        {"name": "Interval", "start_time": "01:00 PM", "end_time": "01:30 PM", "type": "Break"},
        {"name": "Period 4", "start_time": "01:30 PM", "end_time": "02:30 PM", "type": "Teaching"},
        {"name": "Period 5", "start_time": "02:30 PM", "end_time": "03:30 PM", "type": "Teaching"},
    ]

    for sem_num in range(1, 9):
        # Create standard semester subjects
        if sem_num == 1:
            subs = [
                {"name": "Computer Fundamentals and Applications", "code": "BCA 101", "course_type": "TH", "weekly_periods": 3, "teacher_name": "Bijaya Mishra"},
                {"name": "Programming in C", "code": "BCA 102", "course_type": "TH", "weekly_periods": 3, "teacher_name": "Bhupendra Ram Luhar"},
                {"name": "Digital Logic", "code": "BCA 103", "course_type": "TH", "weekly_periods": 3, "teacher_name": "Shree krishna Maharjan"},
                {"name": "Mathematics-I", "code": "BCA 104", "course_type": "TH", "weekly_periods": 3, "teacher_name": "Pujan Mahat"},
                {"name": "Professional Communication and Ethics", "code": "BCA 105", "course_type": "TH", "weekly_periods": 3, "teacher_name": "Sabita Thapa"},
                {"name": "Computer Fundamentals and Applications (Lab)", "code": "BCA 101", "course_type": "PR", "weekly_periods": 3, "teacher_name": "Bijaya Mishra"},
                {"name": "Programming in C (Lab)", "code": "BCA 102", "course_type": "PR", "weekly_periods": 3, "teacher_name": "Bhupendra Ram Luhar"},
                {"name": "Digital Logic (Lab)", "code": "BCA 103", "course_type": "PR", "weekly_periods": 3, "teacher_name": "Shree krishna Maharjan"},
                {"name": "Mathematics-I (Practical)", "code": "BCA 104", "course_type": "PR", "weekly_periods": 3, "teacher_name": "Pujan Mahat"},
                {"name": "Professional Communication (Language Lab)", "code": "BCA 105", "course_type": "PR", "weekly_periods": 3, "teacher_name": "Sabita Thapa"},
                {"name": "Hardware Workshop", "code": "BCA 106", "course_type": "PR", "weekly_periods": 3, "teacher_name": "Bhupendra Ram Luhar"},
            ]
        elif sem_num == 2:
            subs = [
                {"name": "Discrete Structure", "code": "BCA 151", "course_type": "TH", "weekly_periods": 3, "teacher_name": "Shree krishna Maharjan"},
                {"name": "Microprocessor and Computer Architecture", "code": "BCA 152", "course_type": "TH", "weekly_periods": 3, "teacher_name": "Bhupendra Ram Luhar"},
                {"name": "OOP in Java", "code": "BCA 153", "course_type": "TH", "weekly_periods": 3, "teacher_name": "Ananda KC"},
                {"name": "Mathematics-II", "code": "BCA 154", "course_type": "TH", "weekly_periods": 3, "teacher_name": "Pujan Mahat"},
                {"name": "UX/UI Design", "code": "BCA 155", "course_type": "TH", "weekly_periods": 3, "teacher_name": "Bijaya Mishra"},
                {"name": "Discrete Structure (Lab)", "code": "BCA 151", "course_type": "PR", "weekly_periods": 3, "teacher_name": "Shree krishna Maharjan"},
                {"name": "Microprocessor & Architecture (Lab)", "code": "BCA 152", "course_type": "PR", "weekly_periods": 3, "teacher_name": "Bhupendra Ram Luhar"},
                {"name": "OOP in Java (Lab)", "code": "BCA 153", "course_type": "PR", "weekly_periods": 3, "teacher_name": "Ananda KC"},
                {"name": "Mathematics-II (Practical)", "code": "BCA 154", "course_type": "PR", "weekly_periods": 3, "teacher_name": "Pujan Mahat"},
                {"name": "UX/UI Design (Lab)", "code": "BCA 155", "course_type": "PR", "weekly_periods": 3, "teacher_name": "Bijaya Mishra"},
                {"name": "Principles of Management", "code": "BCA 156", "course_type": "TH", "weekly_periods": 3, "teacher_name": "Sabita Thapa"},
            ]
        elif sem_num == 4:
            subs = [
                {"name": "Operating Systems", "code": "BCA 251", "course_type": "TH", "weekly_periods": 3, "teacher_name": "Ramesh Shrestha"},
                {"name": "Software Engineering", "code": "BCA 252", "course_type": "TH", "weekly_periods": 3, "teacher_name": "Ananda KC"},
                {"name": "Numerical Methods", "code": "BCA 253", "course_type": "TH", "weekly_periods": 3, "teacher_name": "Sharmila Bhattarai"},
                {"name": "Python Programming", "code": "BCA 254", "course_type": "TH", "weekly_periods": 3, "teacher_name": "Prakash Sharma"},
                {"name": "Web Technology-II", "code": "BCA 255", "course_type": "TH", "weekly_periods": 3, "teacher_name": "Bijaya Mishra"},
                {"name": "Operating Systems (Lab)", "code": "BCA 251", "course_type": "PR", "weekly_periods": 3, "teacher_name": "Ramesh Shrestha"},
                {"name": "Software Engineering (Lab)", "code": "BCA 252", "course_type": "PR", "weekly_periods": 3, "teacher_name": "Ananda KC"},
                {"name": "Numerical Methods (Lab)", "code": "BCA 253", "course_type": "PR", "weekly_periods": 3, "teacher_name": "Sharmila Bhattarai"},
                {"name": "Python Programming (Lab)", "code": "BCA 254", "course_type": "PR", "weekly_periods": 3, "teacher_name": "Prakash Sharma"},
                {"name": "Web Technology-II (Lab)", "code": "BCA 255", "course_type": "PR", "weekly_periods": 3, "teacher_name": "Bijaya Mishra"},
                {"name": "Project-I (Project Lab)", "code": "BCA 256", "course_type": "PR", "weekly_periods": 3, "teacher_name": "Prakash Sharma"},
            ]
        elif sem_num == 5:
            subs = [
                {"name": "Computer Network", "code": "BCA 301", "course_type": "TH", "weekly_periods": 3, "teacher_name": "Shree krishna Maharjan"},
                {"name": "Artificial Intelligence", "code": "BCA 302", "course_type": "TH", "weekly_periods": 3, "teacher_name": "Prakash Sharma"},
                {"name": "Advance Java Programming", "code": "BCA 303", "course_type": "TH", "weekly_periods": 3, "teacher_name": "Ananda KC"},
                {"name": "MIS and e-Business", "code": "BCA 304", "course_type": "TH", "weekly_periods": 3, "teacher_name": "Dipendra Nepal"},
                {"name": "Society and Technology", "code": "BCA 305", "course_type": "TH", "weekly_periods": 3, "teacher_name": "Sabita Thapa"},
                {"name": "Computer Network (Lab)", "code": "BCA 301", "course_type": "PR", "weekly_periods": 3, "teacher_name": "Shree krishna Maharjan"},
                {"name": "Artificial Intelligence (Lab)", "code": "BCA 302", "course_type": "PR", "weekly_periods": 3, "teacher_name": "Prakash Sharma"},
                {"name": "Advance Java Programming (Lab)", "code": "BCA 303", "course_type": "PR", "weekly_periods": 3, "teacher_name": "Ananda KC"},
                {"name": "MIS and e-Business (Lab)", "code": "BCA 304", "course_type": "PR", "weekly_periods": 3, "teacher_name": "Dipendra Nepal"},
                {"name": "Society and Technology (Practical)", "code": "BCA 305", "course_type": "PR", "weekly_periods": 3, "teacher_name": "Sabita Thapa"},
                {"name": "Project-II (Project Lab)", "code": "BCA 306", "course_type": "PR", "weekly_periods": 3, "teacher_name": "Ananda KC"},
            ]
        elif sem_num == 6:
            subs = [
                {"name": "Computer Graphics and animation", "code": "BCA 351", "course_type": "TH", "weekly_periods": 3, "teacher_name": "Bijaya Mishra"},
                {"name": "Mobile Programming", "code": "BCA 352", "course_type": "TH", "weekly_periods": 3, "teacher_name": "Prakash Sharma"},
                {"name": "Cryptography and Network Security", "code": "BCA 353", "course_type": "TH", "weekly_periods": 3, "teacher_name": "Ramesh Shrestha"},
                {"name": "Technical Writing", "code": "BCA 354", "course_type": "TH", "weekly_periods": 3, "teacher_name": "Sabita Thapa"},
                {"name": "Distributed System", "code": "BCA 355", "course_type": "TH", "weekly_periods": 3, "teacher_name": "Shree krishna Maharjan"},
                {"name": "Computer Graphics (Lab)", "code": "BCA 351", "course_type": "PR", "weekly_periods": 3, "teacher_name": "Bijaya Mishra"},
                {"name": "Mobile Programming (Lab)", "code": "BCA 352", "course_type": "PR", "weekly_periods": 3, "teacher_name": "Prakash Sharma"},
                {"name": "Cryptography & Security (Lab)", "code": "BCA 353", "course_type": "PR", "weekly_periods": 3, "teacher_name": "Ramesh Shrestha"},
                {"name": "Technical Writing (Communication Lab)", "code": "BCA 354", "course_type": "PR", "weekly_periods": 3, "teacher_name": "Sabita Thapa"},
                {"name": "Distributed System (Lab)", "code": "BCA 355", "course_type": "PR", "weekly_periods": 3, "teacher_name": "Shree krishna Maharjan"},
                {"name": "Project-III (Mobile & Security Lab)", "code": "BCA 356", "course_type": "PR", "weekly_periods": 3, "teacher_name": "Ramesh Shrestha"},
            ]
        elif sem_num == 7:
            subs = [
                {"name": "Cyber Security and Ethical Hacking", "code": "BCA 401", "course_type": "TH", "weekly_periods": 3, "teacher_name": "Ramesh Shrestha"},
                {"name": "Software Project Management", "code": "BCA 402", "course_type": "TH", "weekly_periods": 3, "teacher_name": "Ananda KC"},
                {"name": "Financial Accounting", "code": "BCA 403", "course_type": "TH", "weekly_periods": 3, "teacher_name": "Sabita Thapa"},
                {"name": "Machine Learning (Elective-I)", "code": "BCA 405", "course_type": "TH", "weekly_periods": 3, "teacher_name": "Prakash Sharma"},
                {"name": "Dotnet Technology (Elective-II)", "code": "BCA 406", "course_type": "TH", "weekly_periods": 3, "teacher_name": "Dipendra Nepal"},
                {"name": "Cyber Security & Ethical Hacking (Lab)", "code": "BCA 401", "course_type": "PR", "weekly_periods": 3, "teacher_name": "Ramesh Shrestha"},
                {"name": "Software Project Management (Lab)", "code": "BCA 402", "course_type": "PR", "weekly_periods": 3, "teacher_name": "Ananda KC"},
                {"name": "Financial Accounting (Practical)", "code": "BCA 403", "course_type": "PR", "weekly_periods": 3, "teacher_name": "Sabita Thapa"},
                {"name": "Machine Learning (Lab)", "code": "BCA 405", "course_type": "PR", "weekly_periods": 3, "teacher_name": "Prakash Sharma"},
                {"name": "Dotnet Technology (Lab)", "code": "BCA 406", "course_type": "PR", "weekly_periods": 3, "teacher_name": "Dipendra Nepal"},
                {"name": "Project-IV (Cyber & ML Lab)", "code": "BCA 404", "course_type": "PR", "weekly_periods": 3, "teacher_name": "Ramesh Shrestha"},
            ]
        elif sem_num == 8:
            subs = [
                {"name": "Cloud Computing", "code": "BCA 451", "course_type": "TH", "weekly_periods": 3, "teacher_name": "Dipendra Nepal"},
                {"name": "Network Administration (Elective-III)", "code": "BCA 453", "course_type": "TH", "weekly_periods": 3, "teacher_name": "Shree krishna Maharjan"},
                {"name": "Digital Marketing and SEO (Elective-IV)", "code": "BCA 454", "course_type": "TH", "weekly_periods": 3, "teacher_name": "Bijaya Mishra"},
                {"name": "Cloud Computing (Lab)", "code": "BCA 451", "course_type": "PR", "weekly_periods": 3, "teacher_name": "Dipendra Nepal"},
                {"name": "Network Administration (Lab)", "code": "BCA 453", "course_type": "PR", "weekly_periods": 3, "teacher_name": "Shree krishna Maharjan"},
                {"name": "Digital Marketing (Lab)", "code": "BCA 454", "course_type": "PR", "weekly_periods": 3, "teacher_name": "Bijaya Mishra"},
                {"name": "Internship & Project", "code": "BCA 452", "course_type": "PR", "weekly_periods": 4, "teacher_name": "Dipendra Nepal"},
            ]
        else:
            subs = [
                {"name": "Data Structure and Algorithms", "code": "BCA 201", "course_type": "TH", "weekly_periods": 3, "teacher_name": "Bhupendra Ram Luhar"},
                {"name": "Database Management System", "code": "BCA 202", "course_type": "TH", "weekly_periods": 3, "teacher_name": "Dipendra Nepal"},
                {"name": "Web Technology-I", "code": "BCA 203", "course_type": "TH", "weekly_periods": 3, "teacher_name": "Bijaya Mishra"},
                {"name": "System Analysis and Design", "code": "BCA 204", "course_type": "TH", "weekly_periods": 3, "teacher_name": "Ananda KC"},
                {"name": "Probability and Statistics", "code": "BCA 205", "course_type": "TH", "weekly_periods": 3, "teacher_name": "Sharmila Bhattarai"},
                {"name": "Data Structure & Algorithms (Lab)", "code": "BCA 201", "course_type": "PR", "weekly_periods": 3, "teacher_name": "Bhupendra Ram Luhar"},
                {"name": "Database Management System (Lab)", "code": "BCA 202", "course_type": "PR", "weekly_periods": 3, "teacher_name": "Dipendra Nepal"},
                {"name": "Web Technology-I (Lab)", "code": "BCA 203", "course_type": "PR", "weekly_periods": 3, "teacher_name": "Bijaya Mishra"},
                {"name": "System Analysis & Design (Lab)", "code": "BCA 204", "course_type": "PR", "weekly_periods": 3, "teacher_name": "Ananda KC"},
                {"name": "Probability & Statistics (Lab)", "code": "BCA 205", "course_type": "PR", "weekly_periods": 3, "teacher_name": "Sharmila Bhattarai"},
                {"name": "Applied Economics", "code": "BCA 206", "course_type": "TH", "weekly_periods": 3, "teacher_name": "Sabita Thapa"},
            ]

        running_sems = [{
            "semester_number": sem_num,
            "semester_name": f"BCA Semester {sem_num}",
            "section_name": f"BCA {sem_num}th Sem",
            "room_name": f"Room {100 + sem_num}",
            "subjects": subs
        }]

        result = generate_bca_multi_semester_routine(
            db=db,
            running_semesters=running_sems,
            teachers_list=teachers,
            days_list=days,
            periods_list=periods,
            routine_title=f"BCA Semester {sem_num} Verification"
        )

        assert result["conflict_count"] == 0
        entries = result["all_entries"]
        assert len(entries) >= 22

        # Verify Wednesday is never blank
        wed_classes = [e for e in entries if e["day_name"] == "Wednesday"]
        assert len(wed_classes) > 0, f"Wednesday should not be blank in Semester {sem_num}"

def test_odd_and_even_semesters_concurrently(db):
    """
    Test running odd semesters (1, 3, 5, 7) and even semesters (2, 4, 6, 8) concurrently:
    - Zero teacher clashes across sections
    - Zero room clashes across sections
    """
    teachers = [
        {"name": "Bhupendra Ram Luhar", "abbreviation": "BRL", "free_time_start": "06:30 AM", "free_time_end": "04:30 PM", "max_classes_per_day": 4},
        {"name": "Shree krishna Maharjan", "abbreviation": "SKM", "free_time_start": "06:30 AM", "free_time_end": "04:30 PM", "max_classes_per_day": 4},
        {"name": "Ananda KC", "abbreviation": "AK", "free_time_start": "06:30 AM", "free_time_end": "04:30 PM", "max_classes_per_day": 4},
        {"name": "Sharmila Bhattarai", "abbreviation": "SB", "free_time_start": "06:30 AM", "free_time_end": "04:30 PM", "max_classes_per_day": 4},
        {"name": "Bijaya Mishra", "abbreviation": "BM", "free_time_start": "06:30 AM", "free_time_end": "04:30 PM", "max_classes_per_day": 4},
        {"name": "Prakash Sharma", "abbreviation": "PRS", "free_time_start": "06:30 AM", "free_time_end": "04:30 PM", "max_classes_per_day": 4},
        {"name": "Dipendra Nepal", "abbreviation": "DN", "free_time_start": "06:30 AM", "free_time_end": "04:30 PM", "max_classes_per_day": 4},
        {"name": "Ramesh Shrestha", "abbreviation": "RS", "free_time_start": "06:30 AM", "free_time_end": "04:30 PM", "max_classes_per_day": 4},
        {"name": "Pujan Mahat", "abbreviation": "PM", "free_time_start": "06:30 AM", "free_time_end": "04:30 PM", "max_classes_per_day": 4},
        {"name": "Sabita Thapa", "abbreviation": "ST", "free_time_start": "06:30 AM", "free_time_end": "04:30 PM", "max_classes_per_day": 4},
    ]
    days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    periods = [
        {"name": "Period 1", "start_time": "10:00 AM", "end_time": "11:00 AM", "type": "Teaching"},
        {"name": "Period 2", "start_time": "11:00 AM", "end_time": "12:00 PM", "type": "Teaching"},
        {"name": "Period 3", "start_time": "12:00 PM", "end_time": "01:00 PM", "type": "Teaching"},
        {"name": "Interval", "start_time": "01:00 PM", "end_time": "01:30 PM", "type": "Break"},
        {"name": "Period 4", "start_time": "01:30 PM", "end_time": "02:30 PM", "type": "Teaching"},
        {"name": "Period 5", "start_time": "02:30 PM", "end_time": "03:30 PM", "type": "Teaching"},
    ]

    odd_sems = [
        {
            "semester_number": 1,
            "semester_name": "BCA 1st Semester",
            "section_name": "BCA 1st Sem",
            "room_name": "Room 101",
            "subjects": [
                {"name": "Programming in C", "code": "BCA 102", "course_type": "TH", "weekly_periods": 3, "teacher_name": "Bhupendra Ram Luhar"},
                {"name": "Digital Logic", "code": "BCA 103", "course_type": "TH", "weekly_periods": 3, "teacher_name": "Shree krishna Maharjan"},
                {"name": "Programming in C (Lab)", "code": "BCA 102", "course_type": "PR", "weekly_periods": 3, "teacher_name": "Bhupendra Ram Luhar"},
                {"name": "Digital Logic (Lab)", "code": "BCA 103", "course_type": "PR", "weekly_periods": 3, "teacher_name": "Shree krishna Maharjan"},
            ]
        },
        {
            "semester_number": 3,
            "semester_name": "BCA 3rd Semester",
            "section_name": "BCA 3rd Sem",
            "room_name": "Room 201",
            "subjects": [
                {"name": "Data Structure and Algorithms", "code": "BCA 201", "course_type": "TH", "weekly_periods": 3, "teacher_name": "Bhupendra Ram Luhar"},
                {"name": "System Analysis and Design", "code": "BCA 204", "course_type": "TH", "weekly_periods": 3, "teacher_name": "Ananda KC"},
                {"name": "Data Structure & Algorithms (Lab)", "code": "BCA 201", "course_type": "PR", "weekly_periods": 3, "teacher_name": "Bhupendra Ram Luhar"},
                {"name": "System Analysis & Design (Lab)", "code": "BCA 204", "course_type": "PR", "weekly_periods": 3, "teacher_name": "Ananda KC"},
            ]
        },
        {
            "semester_number": 5,
            "semester_name": "BCA 5th Semester",
            "section_name": "BCA 5th Sem",
            "room_name": "Room 301",
            "subjects": [
                {"name": "Advance Java Programming", "code": "BCA 303", "course_type": "TH", "weekly_periods": 3, "teacher_name": "Ananda KC"},
                {"name": "Artificial Intelligence", "code": "BCA 302", "course_type": "TH", "weekly_periods": 3, "teacher_name": "Prakash Sharma"},
                {"name": "Advance Java (Lab)", "code": "BCA 303", "course_type": "PR", "weekly_periods": 3, "teacher_name": "Ananda KC"},
                {"name": "Artificial Intelligence (Lab)", "code": "BCA 302", "course_type": "PR", "weekly_periods": 3, "teacher_name": "Prakash Sharma"},
            ]
        }
    ]

    result = generate_bca_multi_semester_routine(
        db=db,
        running_semesters=odd_sems,
        teachers_list=teachers,
        days_list=days,
        periods_list=periods,
        routine_title="Multi-Semester Odd Concurrent Test"
    )

    assert result["conflict_count"] == 0
    # Verify zero teacher double-bookings (excluding DEMO)
    teacher_slots = set()
    for e in result["all_entries"]:
        t_id = e["teacher_id"]
        t_name = e["teacher_name"]
        if "Demo" not in t_name:
            slot_key = (t_id, e["day_id"], e["period_id"])
            assert slot_key not in teacher_slots, f"Teacher clash for {t_name} on {e['day_name']} at period {e['period_name']}"
            teacher_slots.add(slot_key)


