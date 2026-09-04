from typing import List, Optional, Dict
from sqlalchemy.orm import Session
from app.models.all_models import (
    WorkingDay, Period, Room, RoomType, Subject, Teacher, TeacherAvailability, Section, Semester, Program, TimetableEntry
)
from app.scheduler.models import (
    ScheduleProblem, ProblemDay, ProblemPeriod, ProblemRoom, ProblemSubject, ProblemTeacher, ProblemSection, ScheduledLesson
)

def parse_schedule_problem(
    db: Session,
    section_ids: Optional[List[int]] = None,
    weights: Optional[Dict[str, int]] = None,
    locked_timetable_id: Optional[int] = None
) -> ScheduleProblem:
    """
    Collect all dynamic data from database and construct the ScheduleProblem object.
    Never relies on fixed 6 days or 7 periods. Fully dynamic.
    """
    # 1. Fetch active days in sorted order
    db_days = db.query(WorkingDay).filter(WorkingDay.is_active == True).order_by(WorkingDay.order_index).all()
    active_day_ids = {d.id for d in db_days}
    
    problem_days = [
        ProblemDay(
            id=d.id,
            name=d.name,
            short_code=d.short_code,
            order_index=d.order_index,
            is_active=d.is_active
        )
        for d in db_days
    ]

    # 2. Fetch periods belonging to active days
    db_periods = db.query(Period).filter(Period.day_id.in_(active_day_ids)).order_by(Period.day_id, Period.order_index).all()
    problem_periods = [
        ProblemPeriod(
            id=p.id,
            day_id=p.day_id,
            name=p.name,
            start_time=p.start_time,
            end_time=p.end_time,
            order_index=p.order_index,
            period_type=p.period_type
        )
        for p in db_periods
    ]

    # 3. Fetch active rooms
    db_rooms = db.query(Room).filter(Room.is_active == True).all()
    problem_rooms = [
        ProblemRoom(
            id=r.id,
            room_number=r.room_number,
            room_type_id=r.room_type_id,
            room_type_name=r.room_type.name if r.room_type else "Classroom",
            capacity=r.capacity,
            building=r.building,
            is_active=r.is_active
        )
        for r in db_rooms
    ]

    # 4. Fetch sections (optionally filtered)
    section_query = db.query(Section)
    if section_ids:
        section_query = section_query.filter(Section.id.in_(section_ids))
    db_sections = section_query.all()

    # Collect semester IDs of active sections to load relevant subjects
    active_semester_ids = {s.semester_id for s in db_sections}

    # 5. Fetch subjects for these semesters
    db_subjects = db.query(Subject).filter(Subject.semester_id.in_(active_semester_ids)).all()
    problem_subjects = []
    for sub in db_subjects:
        eligible_t_ids = [t.id for t in sub.eligible_teachers if t.is_active]
        problem_subjects.append(
            ProblemSubject(
                id=sub.id,
                semester_id=sub.semester_id,
                code=sub.code,
                name=sub.name,
                credit_hours=sub.credit_hours,
                weekly_periods=sub.weekly_periods,
                lecture_periods=sub.lecture_periods,
                practical_periods=sub.practical_periods,
                required_room_type_id=sub.required_room_type_id,
                max_classes_per_day=sub.max_classes_per_day,
                color_code=sub.color_code,
                eligible_teacher_ids=eligible_t_ids
            )
        )

    # 6. Map subjects per section
    problem_sections = []
    for s in db_sections:
        sub_ids = [sub.id for sub in problem_subjects if sub.semester_id == s.semester_id]
        prog_name = s.semester.program.name if s.semester and s.semester.program else "Program"
        sem_name = s.semester.name if s.semester else f"Sem {s.semester_id}"
        problem_sections.append(
            ProblemSection(
                id=s.id,
                semester_id=s.semester_id,
                program_name=prog_name,
                semester_name=sem_name,
                name=s.name,
                student_count=s.student_count,
                subject_ids=sub_ids
            )
        )

    # 7. Fetch active teachers and their availabilities
    db_teachers = db.query(Teacher).filter(Teacher.is_active == True).all()
    problem_teachers = []
    for t in db_teachers:
        avail_map = {a.period_id: a.status for a in t.availabilities}
        eligible_sub_ids = [s.id for s in t.eligible_subjects]
        problem_teachers.append(
            ProblemTeacher(
                id=t.id,
                employee_id=t.employee_id,
                name=t.name,
                email=t.email,
                designation=t.designation,
                department_id=t.department_id,
                max_hours_per_day=t.max_hours_per_day,
                max_hours_per_week=t.max_hours_per_week,
                min_hours_per_week=t.min_hours_per_week,
                eligible_subject_ids=eligible_sub_ids,
                availability_map=avail_map
            )
        )

    # 8. Locked lessons if any
    locked_lessons = []
    if locked_timetable_id:
        locked_entries = db.query(TimetableEntry).filter(
            TimetableEntry.timetable_id == locked_timetable_id,
            TimetableEntry.is_locked == True
        ).all()
        for le in locked_entries:
            locked_lessons.append(
                ScheduledLesson(
                    section_id=le.section_id,
                    subject_id=le.subject_id,
                    teacher_id=le.teacher_id,
                    room_id=le.room_id,
                    period_id=le.period_id,
                    day_id=le.period.day_id if le.period else 1,
                    is_locked=True
                )
            )

    default_weights = {
        "teacher_preference": 5,
        "consecutive_classes": 4,
        "idle_gaps": 4,
        "subject_distribution": 6,
        "room_stability": 2
    }
    if weights:
        default_weights.update(weights)

    return ScheduleProblem(
        days=problem_days,
        periods=problem_periods,
        rooms=problem_rooms,
        subjects=problem_subjects,
        teachers=problem_teachers,
        sections=problem_sections,
        weights=default_weights,
        locked_lessons=locked_lessons
    )
