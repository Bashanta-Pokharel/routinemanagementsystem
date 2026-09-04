from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_password_hash
from app.models.all_models import (
    User, UserRole, Campus, Faculty, Department, Program, AcademicYear, Semester, Section,
    RoomType, Room, WorkingDay, Period, PeriodType, Subject, Teacher, TeacherAvailability,
    SchedulingRuleWeight
)

router = APIRouter(prefix="/seed", tags=["Data Seeder"])

def seed_database(db: Session):
    # Check if already seeded
    if db.query(Campus).first():
        return {"status": "info", "message": "Database is already seeded with campus records."}

    # 1. Admin Users
    admin_user = User(
        email="admin@campus.edu",
        hashed_password=get_password_hash("admin123"),
        full_name="Campus Super Admin",
        role=UserRole.SUPER_ADMIN
    )
    db.add(admin_user)

    teacher_user = User(
        email="teacher@campus.edu",
        hashed_password=get_password_hash("teacher123"),
        full_name="Prof. Ram Sharma",
        role=UserRole.TEACHER
    )
    db.add(teacher_user)

    student_user = User(
        email="student@campus.edu",
        hashed_password=get_password_hash("student123"),
        full_name="Aayush Shrestha",
        role=UserRole.STUDENT
    )
    db.add(student_user)

    # 2. Campus & Faculties
    campus = Campus(
        name="Apex College of Science, Tech & Management",
        code="APEX",
        address="Kathmandu, Nepal",
        phone="+977-1-4478900",
        email="info@apexcollege.edu.np",
        website="https://apexcollege.edu.np"
    )
    db.add(campus)
    db.flush()

    fac_scitech = Faculty(campus_id=campus.id, name="Faculty of Science & Technology", code="FST", description="Computing, IT, Data & Engineering")
    fac_mgmt = Faculty(campus_id=campus.id, name="Faculty of Management", code="FOM", description="Business Administration & Finance")
    db.add_all([fac_scitech, fac_mgmt])
    db.flush()

    # 3. Departments
    dept_cs = Department(faculty_id=fac_scitech.id, name="Department of Computer Science & IT", code="CSIT", head_of_department="Dr. Ram Sharma")
    dept_mgmt = Department(faculty_id=fac_mgmt.id, name="Department of Business Studies", code="MGMT", head_of_department="Prof. Sita Rai")
    db.add_all([dept_cs, dept_mgmt])
    db.flush()

    # 4. Programs
    prog_bca = Program(department_id=dept_cs.id, name="Bachelor of Computer Applications (BCA)", code="BCA", duration_years=4, total_semesters=8)
    prog_csit = Program(department_id=dept_cs.id, name="BSc. Computer Science & IT (BSc.CSIT)", code="CSIT", duration_years=4, total_semesters=8)
    prog_bba = Program(department_id=dept_mgmt.id, name="Bachelor of Business Administration (BBA)", code="BBA", duration_years=4, total_semesters=8)
    db.add_all([prog_bca, prog_csit, prog_bba])
    db.flush()

    # 5. Academic Year
    academic_year = AcademicYear(name="2026/2027 Academic Session", is_current=True)
    db.add(academic_year)
    db.flush()

    # 6. Semesters & Sections
    # BCA Sem 1, Sem 3
    bca_sem1 = Semester(program_id=prog_bca.id, semester_number=1, name="Semester 1")
    bca_sem3 = Semester(program_id=prog_bca.id, semester_number=3, name="Semester 3")
    # CSIT Sem 1, Sem 4
    csit_sem1 = Semester(program_id=prog_csit.id, semester_number=1, name="Semester 1")
    csit_sem4 = Semester(program_id=prog_csit.id, semester_number=4, name="Semester 4")
    # BBA Sem 2
    bba_sem2 = Semester(program_id=prog_bba.id, semester_number=2, name="Semester 2")
    db.add_all([bca_sem1, bca_sem3, csit_sem1, csit_sem4, bba_sem2])
    db.flush()

    sec_bca1_a = Section(semester_id=bca_sem1.id, name="A", student_count=40)
    sec_bca1_b = Section(semester_id=bca_sem1.id, name="B", student_count=35)
    sec_bca3_a = Section(semester_id=bca_sem3.id, name="A", student_count=42)
    sec_csit1_a = Section(semester_id=csit_sem1.id, name="A", student_count=38)
    sec_csit4_a = Section(semester_id=csit_sem4.id, name="A", student_count=36)
    sec_bba2_a = Section(semester_id=bba_sem2.id, name="A", student_count=45)
    db.add_all([sec_bca1_a, sec_bca1_b, sec_bca3_a, sec_csit1_a, sec_csit4_a, sec_bba2_a])
    db.flush()

    # 7. Room Types & Rooms
    rt_classroom = RoomType(name="Classroom", description="General theory classroom with projector")
    rt_computer_lab = RoomType(name="Computer Lab", description="High performance workstations and internet")
    rt_electronics_lab = RoomType(name="Electronics Lab", description="Hardware test benches and digital logic kits")
    rt_seminar = RoomType(name="Seminar Hall", description="Large auditorium with presentation equipment")
    db.add_all([rt_classroom, rt_computer_lab, rt_electronics_lab, rt_seminar])
    db.flush()

    r101 = Room(room_number="Room 101", building="Academic Block A", capacity=60, room_type_id=rt_classroom.id, department_id=dept_cs.id)
    r102 = Room(room_number="Room 102", building="Academic Block A", capacity=55, room_type_id=rt_classroom.id, department_id=dept_cs.id)
    r103 = Room(room_number="Room 103", building="Academic Block A", capacity=50, room_type_id=rt_classroom.id, department_id=dept_cs.id)
    r201 = Room(room_number="Room 201", building="Management Block", capacity=65, room_type_id=rt_classroom.id, department_id=dept_mgmt.id)
    r202 = Room(room_number="Room 202", building="Management Block", capacity=50, room_type_id=rt_classroom.id, department_id=dept_mgmt.id)
    lab1 = Room(room_number="Computer Lab 1", building="IT Wing", capacity=45, room_type_id=rt_computer_lab.id, department_id=dept_cs.id, equipment_info="45 Dell Core i7 PCs, Projector")
    lab2 = Room(room_number="Computer Lab 2", building="IT Wing", capacity=40, room_type_id=rt_computer_lab.id, department_id=dept_cs.id, equipment_info="40 Mac Mini M2, Projector")
    lab_elec = Room(room_number="Hardware Lab", building="Engineering Wing", capacity=40, room_type_id=rt_electronics_lab.id, department_id=dept_cs.id)
    db.add_all([r101, r102, r103, r201, r202, lab1, lab2, lab_elec])
    db.flush()

    # 8. Dynamic Working Days & Variable Periods Per Day
    # Sun - Thu: 6 periods (including 1 break)
    # Friday: 4 periods (Demonstrating completely different period count per day!)
    days_data = [
        ("Sunday", "SUN", 0),
        ("Monday", "MON", 1),
        ("Tuesday", "TUE", 2),
        ("Wednesday", "WED", 3),
        ("Thursday", "THU", 4),
        ("Friday", "FRI", 5),
    ]
    created_days = []
    for d_name, d_code, idx in days_data:
        w_day = WorkingDay(name=d_name, short_code=d_code, order_index=idx, is_active=True)
        db.add(w_day)
        db.flush()
        created_days.append(w_day)

    # Standard Timings for Sun - Thu (6 periods)
    regular_periods = [
        ("Period 1", "08:00", "09:00", 1, PeriodType.TEACHING),
        ("Period 2", "09:00", "10:00", 2, PeriodType.TEACHING),
        ("Break", "10:00", "10:30", 3, PeriodType.BREAK),
        ("Period 3", "10:30", "11:30", 4, PeriodType.TEACHING),
        ("Period 4", "11:30", "12:30", 5, PeriodType.TEACHING),
        ("Period 5", "12:30", "01:30", 6, PeriodType.TEACHING),
    ]

    # Friday Timings (Half Day - 4 periods)
    friday_periods = [
        ("Period 1", "08:00", "09:00", 1, PeriodType.TEACHING),
        ("Period 2", "09:00", "10:00", 2, PeriodType.TEACHING),
        ("Break", "10:00", "10:30", 3, PeriodType.BREAK),
        ("Period 3", "10:30", "11:30", 4, PeriodType.TEACHING),
    ]

    all_periods = []
    for day in created_days:
        scheme = friday_periods if day.short_code == "FRI" else regular_periods
        for p_name, start_t, end_t, order_idx, p_type in scheme:
            p = Period(
                day_id=day.id,
                name=p_name,
                start_time=start_t,
                end_time=end_t,
                order_index=order_idx,
                period_type=p_type
            )
            db.add(p)
            db.flush()
            all_periods.append(p)

    # 9. Teachers with Workload Rules & Availabilities
    teachers_data = [
        ("EMP001", "Dr. Ram Sharma", "ram.sharma@apexcollege.edu.np", "Associate Professor", dept_cs.id, 5.0, 20.0),
        ("EMP002", "Prof. Sita Rai", "sita.rai@apexcollege.edu.np", "Professor", dept_mgmt.id, 4.0, 18.0),
        ("EMP003", "Er. Hari Thapa", "hari.thapa@apexcollege.edu.np", "Assistant Professor", dept_cs.id, 5.0, 20.0),
        ("EMP004", "Bikash KC", "bikash.kc@apexcollege.edu.np", "Lecturer", dept_cs.id, 4.0, 18.0),
        ("EMP005", "Anita Shrestha", "anita.shrestha@apexcollege.edu.np", "Assistant Professor", dept_cs.id, 4.0, 16.0),
        ("EMP006", "Ramesh Joshi", "ramesh.joshi@apexcollege.edu.np", "Lecturer", dept_cs.id, 4.0, 18.0),
        ("EMP007", "Pooja Adhikari", "pooja.adhikari@apexcollege.edu.np", "Lecturer", dept_mgmt.id, 4.0, 18.0),
        ("EMP008", "Sandeep Poudel", "sandeep.poudel@apexcollege.edu.np", "Lecturer", dept_cs.id, 4.0, 18.0),
    ]

    created_teachers = []
    for emp_id, name, email, desig, dept_id, max_d, max_w in teachers_data:
        t = Teacher(
            employee_id=emp_id,
            name=name,
            email=email,
            designation=desig,
            department_id=dept_id,
            max_hours_per_day=max_d,
            max_hours_per_week=max_w,
            min_hours_per_week=6.0,
            is_active=True
        )
        db.add(t)
        db.flush()
        created_teachers.append(t)

        # Initialize teacher availability
        for p in all_periods:
            # Set Ram Sharma preferred morning
            status_val = "available"
            if emp_id == "EMP001" and p.start_time in ("08:00", "09:00"):
                status_val = "preferred"
            elif emp_id == "EMP003" and p.day.short_code == "WED" and p.start_time in ("11:30", "12:30"):
                status_val = "unavailable"  # Demo teacher unavailable Wednesday afternoon
            
            avail = TeacherAvailability(
                teacher_id=t.id,
                period_id=p.id,
                status=status_val
            )
            db.add(avail)

    # 10. Subjects / Courses with Credit Hours & Practical Split
    t_ram = created_teachers[0]
    t_sita = created_teachers[1]
    t_hari = created_teachers[2]
    t_bikash = created_teachers[3]
    t_anita = created_teachers[4]
    t_ramesh = created_teachers[5]
    t_pooja = created_teachers[6]
    t_sandeep = created_teachers[7]

    subjects_data = [
        # BCA Sem 1
        ("CACS101", "Computer Fundamentals & Applications", bca_sem1.id, 3, 4, 3, 1, rt_computer_lab.id, "#3B82F6", [t_ramesh, t_sandeep]),
        ("CACS102", "Society and Technology", bca_sem1.id, 3, 3, 3, 0, rt_classroom.id, "#8B5CF6", [t_anita]),
        ("CACS103", "English I", bca_sem1.id, 3, 3, 3, 0, rt_classroom.id, "#EC4899", [t_pooja]),
        ("CACS104", "Mathematics I (Calculus)", bca_sem1.id, 3, 4, 4, 0, rt_classroom.id, "#F59E0B", [t_sita]),
        ("CACS105", "Digital Logic Systems", bca_sem1.id, 3, 4, 3, 1, rt_electronics_lab.id, "#10B981", [t_hari]),

        # BCA Sem 3
        ("CACS201", "Data Structures and Algorithms", bca_sem3.id, 3, 4, 3, 1, rt_computer_lab.id, "#2563EB", [t_ram, t_bikash]),
        ("CACS202", "Probability and Statistics", bca_sem3.id, 3, 3, 3, 0, rt_classroom.id, "#6366F1", [t_sita]),
        ("CACS203", "System Analysis and Design", bca_sem3.id, 3, 3, 3, 0, rt_classroom.id, "#14B8A6", [t_anita]),
        ("CACS204", "Java Programming (OOP)", bca_sem3.id, 3, 4, 2, 2, rt_computer_lab.id, "#059669", [t_bikash, t_ramesh]),
        ("CACS205", "Web Technology I", bca_sem3.id, 3, 4, 2, 2, rt_computer_lab.id, "#D97706", [t_ram, t_sandeep]),

        # CSIT Sem 1
        ("CSC109", "Introduction to Information Technology", csit_sem1.id, 3, 4, 3, 1, rt_computer_lab.id, "#3B82F6", [t_ramesh]),
        ("CSC110", "C Programming", csit_sem1.id, 3, 4, 2, 2, rt_computer_lab.id, "#059669", [t_bikash, t_ram]),
        ("CSC111", "Digital Logic", csit_sem1.id, 3, 4, 3, 1, rt_electronics_lab.id, "#10B981", [t_hari]),
        ("MTH112", "Calculus and Analytical Geometry", csit_sem1.id, 3, 4, 4, 0, rt_classroom.id, "#F59E0B", [t_sita]),
        ("PHY113", "Physics I", csit_sem1.id, 3, 4, 3, 1, rt_classroom.id, "#8B5CF6", [t_anita]),

        # CSIT Sem 4
        ("CSC257", "Theory of Computation", csit_sem4.id, 3, 3, 3, 0, rt_classroom.id, "#6366F1", [t_ram]),
        ("CSC258", "Computer Networks", csit_sem4.id, 3, 4, 3, 1, rt_computer_lab.id, "#2563EB", [t_hari, t_sandeep]),
        ("CSC259", "Operating Systems", csit_sem4.id, 3, 4, 3, 1, rt_computer_lab.id, "#0D9488", [t_bikash]),
        ("CSC260", "Database Management Systems", csit_sem4.id, 3, 4, 2, 2, rt_computer_lab.id, "#D97706", [t_ramesh]),
        ("CSC261", "Artificial Intelligence", csit_sem4.id, 3, 3, 3, 0, rt_classroom.id, "#7C3AED", [t_anita]),

        # BBA Sem 2
        ("BBA106", "Financial Accounting", bba_sem2.id, 3, 4, 4, 0, rt_classroom.id, "#059669", [t_pooja]),
        ("BBA107", "Macroeconomics for Business", bba_sem2.id, 3, 3, 3, 0, rt_classroom.id, "#D97706", [t_sita]),
        ("BBA108", "Business Communication", bba_sem2.id, 3, 3, 3, 0, rt_classroom.id, "#EC4899", [t_pooja]),
        ("BBA109", "Principles of Management", bba_sem2.id, 3, 3, 3, 0, rt_classroom.id, "#6366F1", [t_anita]),
        ("BBA110", "Business Mathematics", bba_sem2.id, 3, 4, 4, 0, rt_classroom.id, "#F59E0B", [t_sita]),
    ]

    for code, name, sem_id, cr, wp, lp, pp, room_t_id, color, eligible_t_list in subjects_data:
        sub = Subject(
            code=code,
            name=name,
            semester_id=sem_id,
            credit_hours=cr,
            weekly_periods=wp,
            lecture_periods=lp,
            practical_periods=pp,
            required_room_type_id=room_t_id,
            max_classes_per_day=2,
            color_code=color,
            eligible_teachers=eligible_t_list
        )
        db.add(sub)

    # 11. Scheduling Rule Weights
    rules = [
        ("teacher_preference", "Reward assigning classes in teacher preferred periods", 5),
        ("consecutive_classes", "Penalize more than 3-4 consecutive periods without a break", 4),
        ("idle_gaps", "Penalize empty gaps/holes between daily periods for teachers or classes", 4),
        ("subject_distribution", "Spread subject periods across different working days", 6),
        ("room_stability", "Minimize switching rooms on the same day for a class", 2)
    ]
    for r_name, r_desc, r_w in rules:
        db.add(SchedulingRuleWeight(rule_name=r_name, description=r_desc, weight=r_w))

    db.commit()
    return {"status": "success", "message": "Campus and college structures seeded successfully."}

@router.post("")
def trigger_seed(db: Session = Depends(get_db)):
    return seed_database(db)
