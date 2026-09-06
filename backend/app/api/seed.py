from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_password_hash
from app.models.all_models import (
    User, UserRole, Campus, Faculty, Department, Program, AcademicYear, Semester, Section,
    RoomType, Room, WorkingDay, Period, PeriodType, Subject, Teacher, TeacherAvailability,
    SchedulingRuleWeight, Timetable, TimetableEntry, GenerationRun, GenerationSolution,
    AuditLog, Notification
)

router = APIRouter(prefix="/seed", tags=["Data Seeder"])

def setup_clean_bca_structure(db: Session):
    """
    Sets up clean base structure focused on BCA (Bachelor of Computer Applications):
    - Admin User
    - Campus + Faculty + Department
    - BCA Program with Semesters 1 to 8 and Section A
    - Classrooms & Computer Labs
    - Active Working Days (Sunday - Friday) and Periods
    - NO mock subjects or mock teachers (User will add their own).
    """
    # 1. Admin User
    admin_user = User(
        email="admin@campus.edu",
        hashed_password=get_password_hash("admin123"),
        full_name="Campus Administrator",
        role=UserRole.SUPER_ADMIN
    )
    db.add(admin_user)

    # 2. Campus & Faculty
    campus = Campus(
        name="College of Computer Applications",
        code="CCA",
        address="Kathmandu, Nepal",
        phone="+977-1-4400000",
        email="info@college.edu.np"
    )
    db.add(campus)
    db.flush()

    faculty = Faculty(campus_id=campus.id, name="Faculty of Science & Technology", code="FST")
    db.add(faculty)
    db.flush()

    dept = Department(faculty_id=faculty.id, name="Department of Computer Applications (BCA)", code="BCA_DEPT")
    db.add(dept)
    db.flush()

    # 3. BCA Program with all 8 Semesters
    prog_bca = Program(
        department_id=dept.id,
        name="Bachelor of Computer Applications (BCA)",
        code="BCA",
        duration_years=4,
        total_semesters=8
    )
    db.add(prog_bca)
    db.flush()

    academic_year = AcademicYear(name="2026/2027 Academic Session", is_current=True)
    db.add(academic_year)
    db.flush()

    for sem_num in range(1, 9):
        sem = Semester(
            program_id=prog_bca.id,
            semester_number=sem_num,
            name=f"BCA Semester {sem_num}"
        )
        db.add(sem)
        db.flush()
        
        sec = Section(semester_id=sem.id, name=f"BCA {sem_num}th Sem", student_count=40)
        db.add(sec)

    # 4. Rooms & Labs
    rt_class = RoomType(name="Classroom")
    rt_lab = RoomType(name="Computer Lab")
    db.add_all([rt_class, rt_lab])
    db.flush()

    r1 = Room(room_number="Room 101", capacity=50, room_type_id=rt_class.id, department_id=dept.id)
    r2 = Room(room_number="Room 102", capacity=50, room_type_id=rt_class.id, department_id=dept.id)
    r3 = Room(room_number="Room 103", capacity=50, room_type_id=rt_class.id, department_id=dept.id)
    r4 = Room(room_number="Room 104", capacity=50, room_type_id=rt_class.id, department_id=dept.id)
    lab1 = Room(room_number="Computer Lab 1", capacity=45, room_type_id=rt_lab.id, department_id=dept.id)
    lab2 = Room(room_number="Computer Lab 2", capacity=45, room_type_id=rt_lab.id, department_id=dept.id)
    db.add_all([r1, r2, r3, r4, lab1, lab2])
    db.flush()

    # 5. Working Days & Default Periods (Sun - Thu: 6 periods, Fri: 4 periods)
    days_data = [
        ("Sunday", "SUN", 0),
        ("Monday", "MON", 1),
        ("Tuesday", "TUE", 2),
        ("Wednesday", "WED", 3),
        ("Thursday", "THU", 4),
        ("Friday", "FRI", 5),
    ]

    regular_periods = [
        ("Period 1", "10:00 AM", "11:00 AM", 1, PeriodType.TEACHING),
        ("Period 2", "11:00 AM", "12:00 PM", 2, PeriodType.TEACHING),
        ("Break", "12:00 PM", "12:30 PM", 3, PeriodType.BREAK),
        ("Period 3", "12:30 PM", "01:30 PM", 4, PeriodType.TEACHING),
        ("Period 4", "01:30 PM", "02:30 PM", 5, PeriodType.TEACHING),
        ("Period 5", "02:30 PM", "03:30 PM", 6, PeriodType.TEACHING),
    ]

    friday_periods = [
        ("Period 1", "10:00 AM", "11:00 AM", 1, PeriodType.TEACHING),
        ("Period 2", "11:00 AM", "12:00 PM", 2, PeriodType.TEACHING),
        ("Break", "12:00 PM", "12:30 PM", 3, PeriodType.BREAK),
        ("Period 3", "12:30 PM", "01:30 PM", 4, PeriodType.TEACHING),
        ("Period 4", "01:30 PM", "02:30 PM", 5, PeriodType.TEACHING),
    ]

    for d_name, d_code, idx in days_data:
        w_day = WorkingDay(name=d_name, short_code=d_code, order_index=idx, is_active=True)
        db.add(w_day)
        db.flush()

        scheme = friday_periods if d_code == "FRI" else regular_periods
        for p_name, start_t, end_t, order_idx, p_type in scheme:
            p = Period(
                day_id=w_day.id,
                name=p_name,
                start_time=start_t,
                end_time=end_t,
                order_index=order_idx,
                period_type=p_type
            )
            db.add(p)

    db.commit()

from app.models.all_models import teacher_subjects

def clean_reset_database(db: Session):
    """
    Completely wipes all data from the database and initializes a fresh clean BCA structure.
    """
    db.execute(teacher_subjects.delete())
    db.query(TimetableEntry).delete()
    db.query(GenerationSolution).delete()
    db.query(GenerationRun).delete()
    db.query(Timetable).delete()
    db.query(TeacherAvailability).delete()
    db.query(Subject).delete()
    db.query(Teacher).delete()
    db.query(Period).delete()
    db.query(WorkingDay).delete()
    db.query(Room).delete()
    db.query(RoomType).delete()
    db.query(Section).delete()
    db.query(Semester).delete()
    db.query(Program).delete()
    db.query(Department).delete()
    db.query(Faculty).delete()
    db.query(Campus).delete()
    db.query(AcademicYear).delete()
    db.query(Notification).delete()
    db.query(AuditLog).delete()
    db.query(User).delete()
    db.commit()

    setup_clean_bca_structure(db)
    return {"status": "success", "message": "All default data cleared! Clean BCA structure ready for semester-wise setup."}

def seed_database(db: Session):
    if db.query(Campus).first():
        return {"status": "info", "message": "Database is already initialized."}
    setup_clean_bca_structure(db)
    return {"status": "success", "message": "Clean BCA structure initialized."}

@router.post("/clean-reset")
def trigger_clean_reset(db: Session = Depends(get_db)):
    return clean_reset_database(db)

@router.post("")
def trigger_seed(db: Session = Depends(get_db)):
    return seed_database(db)

