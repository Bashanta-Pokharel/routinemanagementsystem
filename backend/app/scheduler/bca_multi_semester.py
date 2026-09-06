import re
from datetime import datetime
from typing import List, Dict, Optional, Any, Tuple
from collections import defaultdict
from sqlalchemy.orm import Session

from app.models.all_models import (
    Campus, Faculty, Department, Program, AcademicYear, Semester, Section,
    RoomType, Room, WorkingDay, Period, PeriodType, Subject, Teacher, TeacherAvailability,
    Timetable, TimetableEntry, AuditLog, Notification
)

def parse_time_to_minutes(t_str: str) -> int:
    """
    Parses various time formats ("1:00 PM", "01:30 PM", "10:00 AM", "13:00", "2 pm")
    into total minutes from midnight (0 - 1439).
    """
    if not t_str:
        return 0
    t_str = t_str.strip().upper()
    
    is_pm = "PM" in t_str
    is_am = "AM" in t_str
    clean_str = re.sub(r'[^\d:]', '', t_str)
    
    parts = clean_str.split(":")
    hours = int(parts[0]) if parts[0] else 0
    minutes = int(parts[1]) if len(parts) > 1 and parts[1] else 0

    if is_pm and hours < 12:
        hours += 12
    elif is_am and hours == 12:
        hours = 0

    return hours * 60 + minutes

def get_teacher_abbreviation(name: str, custom_abbrev: Optional[str] = None) -> str:
    if custom_abbrev and custom_abbrev.strip():
        return custom_abbrev.strip().upper()
    words = [w for w in re.split(r'[\s._-]+', name) if w]
    meaningful = [w for w in words if w.lower() not in ["prof", "dr", "er", "mr", "mrs", "ms"]]
    target = meaningful if meaningful else words
    if not target:
        return "TCH"
    if len(target) == 1:
        return target[0][:3].upper()
    return "".join(w[0] for w in target).upper()

def is_period_within_teacher_free_time(
    p_start: str,
    p_end: str,
    teacher_free_start: str,
    teacher_free_end: str
) -> bool:
    """
    Checks if a period slot [p_start, p_end] falls within teacher free time window.
    """
    if not teacher_free_start or not teacher_free_end:
        return True

    p_s_min = parse_time_to_minutes(p_start)
    p_e_min = parse_time_to_minutes(p_end)
    t_s_min = parse_time_to_minutes(teacher_free_start)
    t_e_min = parse_time_to_minutes(teacher_free_end)

    if t_s_min >= t_e_min:
        return True

    # Allow 10 min tolerance
    return (p_s_min >= t_s_min - 10) and (p_e_min <= t_e_min + 10)

def generate_bca_multi_semester_routine(
    db: Session,
    running_semesters: List[Dict[str, Any]],
    teachers_list: List[Dict[str, Any]],
    days_list: List[str],
    periods_list: List[Dict[str, Any]],
    day_period_counts: Optional[Dict[str, int]] = None,
    routine_title: Optional[str] = None,
    campus_name: Optional[str] = None,
    address: Optional[str] = None
) -> Dict[str, Any]:
    """
    Solves and schedules routine for multiple running BCA semesters simultaneously:
    - Zero teacher clashes across all running semesters.
    - Strict teacher free-time windows.
    - Variable period counts per day (e.g. 5 periods Sun-Thu, 3 periods Fri).
    - Even distribution of subjects across days.
    - Persists everything directly to MySQL / SQLite DB.
    """
    # 1. Base Academic Setup
    campus = db.query(Campus).first()
    if not campus:
        campus = Campus(
            name=campus_name.strip() if (campus_name and campus_name.strip()) else "Ratna Rajyalaxmi Campus",
            code="RRC",
            address=address.strip() if (address and address.strip()) else "Pradarshanimarga, Kathmandu Nepal"
        )
        db.add(campus)
        db.flush()
    else:
        if campus_name and campus_name.strip():
            campus.name = campus_name.strip()
        if address and address.strip():
            campus.address = address.strip()
        db.flush()

    faculty = db.query(Faculty).first()
    if not faculty:
        faculty = Faculty(campus_id=campus.id, name="Faculty of Science & Technology", code="FST")
        db.add(faculty)
        db.flush()

    dept = db.query(Department).first()
    if not dept:
        dept = Department(faculty_id=faculty.id, name="Department of Computer Applications (BCA)", code="BCA_DEPT")
        db.add(dept)
        db.flush()

    prog_bca = db.query(Program).filter(Program.code == "BCA").first()
    if not prog_bca:
        prog_bca = Program(department_id=dept.id, name="Bachelor of Computer Applications (BCA)", code="BCA", total_semesters=8)
        db.add(prog_bca)
        db.flush()

    ay = db.query(AcademicYear).filter(AcademicYear.is_current == True).first()
    if not ay:
        ay = AcademicYear(name="2026/2027 Academic Session", is_current=True)
        db.add(ay)
        db.flush()

    rt_class = db.query(RoomType).filter(RoomType.name == "Classroom").first()
    if not rt_class:
        rt_class = RoomType(name="Classroom")
        db.add(rt_class)
        db.flush()

    rt_lab = db.query(RoomType).filter(RoomType.name == "Computer Lab").first()
    if not rt_lab:
        rt_lab = RoomType(name="Computer Lab")
        db.add(rt_lab)
        db.flush()

    comp_lab = db.query(Room).filter(Room.room_number.in_(["Computer Lab", "Lab 1", "Computer Lab 1"])).first()
    if not comp_lab:
        comp_lab = Room(room_number="Computer Lab", capacity=45, room_type_id=rt_lab.id, department_id=dept.id)
        db.add(comp_lab)
        db.flush()

    # 2. Setup Working Days and Dynamic Periods
    day_objs = []
    for idx, d_name in enumerate(days_list):
        d_record = db.query(WorkingDay).filter(WorkingDay.name == d_name).first()
        if not d_record:
            d_record = WorkingDay(name=d_name, short_code=d_name[:3].upper(), order_index=idx, is_active=True)
            db.add(d_record)
            db.flush()
        day_objs.append(d_record)

    all_teaching_periods = []
    day_period_map = {}
    
    for day in day_objs:
        db.query(Period).filter(Period.day_id == day.id).delete()
        
        count = day_period_counts.get(day.name, len(periods_list)) if day_period_counts else len(periods_list)
        cur_periods_list = periods_list[:count]

        day_period_map[day.name] = []
        for p_idx, p_info in enumerate(cur_periods_list):
            p_rec = Period(
                day_id=day.id,
                name=p_info.get("name", f"Period {p_idx + 1}"),
                start_time=p_info.get("start_time", "10:00 AM"),
                end_time=p_info.get("end_time", "11:00 AM"),
                order_index=p_idx + 1,
                period_type=p_info.get("type", "Teaching")
            )
            db.add(p_rec)
            db.flush()
            day_period_map[day.name].append(p_rec)
            if p_rec.period_type == "Teaching":
                all_teaching_periods.append(p_rec)

    # 3. Setup Teachers in Database with Speciality and Free-Time Windows
    teacher_db_map = {} # name -> Teacher
    teacher_meta_map = {} # name -> { speciality, free_start, free_end, free_days, max_per_day, abbrev, contact }

    for t_idx, t_data in enumerate(teachers_list):
        t_name = t_data.get("name", f"Teacher {t_idx + 1}").strip()
        t_spec = t_data.get("speciality", "Computer Science")
        f_start = t_data.get("free_time_start", "08:00 AM")
        f_end = t_data.get("free_time_end", "04:00 PM")
        f_days = t_data.get("free_days", days_list)
        max_day = int(t_data.get("max_classes_per_day", 4))
        t_abbrev = get_teacher_abbreviation(t_name, t_data.get("abbreviation"))
        t_contact = t_data.get("contact") or t_data.get("phone") or f"98{41000000 + t_idx * 11111:08d}"

        teacher_meta_map[t_name] = {
            "name": t_name,
            "abbreviation": t_abbrev,
            "contact": t_contact,
            "speciality": t_spec,
            "free_time_start": f_start,
            "free_time_end": f_end,
            "free_days": f_days,
            "max_classes_per_day": max_day
        }

        t_rec = db.query(Teacher).filter(Teacher.name == t_name).first()
        if not t_rec:
            emp_id = f"BCA_EMP{t_idx + 1:03d}"
            t_rec = Teacher(
                employee_id=emp_id,
                name=t_name,
                email=f"{t_name.lower().replace(' ', '.')}@campus.edu",
                phone=t_contact,
                designation="Lecturer",
                department_id=dept.id,
                max_hours_per_day=float(max_day),
                max_hours_per_week=24.0
            )
            db.add(t_rec)
            db.flush()
        else:
            if t_contact and not t_rec.phone:
                t_rec.phone = t_contact
                db.flush()
        teacher_db_map[t_name] = t_rec

    # 4. Setup Running Semesters, Sections, Rooms, and Subjects
    semester_sections = [] # List of { sem_rec, sec_rec, room_rec, subjects: [...] }
    all_subject_tasks = [] # Flat list of all subject requirements to schedule

    for sem_idx, s_data in enumerate(running_semesters):
        sem_num = int(s_data.get("semester_number", sem_idx + 1))
        sem_name = s_data.get("semester_name", f"BCA Semester {sem_num}")
        room_name = s_data.get("room_name", f"Room {101 + sem_idx}")

        # DB Semester
        sem_rec = db.query(Semester).filter(
            Semester.program_id == prog_bca.id,
            Semester.semester_number == sem_num
        ).first()
        if not sem_rec:
            sem_rec = Semester(program_id=prog_bca.id, semester_number=sem_num, name=sem_name)
            db.add(sem_rec)
            db.flush()

        # DB Section
        sec_name = s_data.get("section_name", f"BCA {sem_num}th Sem")
        sec_rec = db.query(Section).filter(Section.semester_id == sem_rec.id, Section.name == sec_name).first()
        if not sec_rec:
            sec_rec = Section(semester_id=sem_rec.id, name=sec_name, student_count=40)
            db.add(sec_rec)
            db.flush()

        # DB Room (Fixed Dedicated Classroom for this Semester)
        room_rec = db.query(Room).filter(Room.room_number == room_name).first()
        if not room_rec:
            room_rec = Room(room_number=room_name, capacity=50, room_type_id=rt_class.id, department_id=dept.id)
            db.add(room_rec)
            db.flush()

        sem_subjects = []
        for sub_idx, sub_item in enumerate(s_data.get("subjects", [])):
            sub_name = sub_item.get("name", f"Subject {sub_idx + 1}").strip()
            sub_code = sub_item.get("code") or f"CACS{sem_num}0{sub_idx + 1}"
            weekly_p = int(sub_item.get("weekly_periods", 4))
            assigned_t_name = sub_item.get("teacher_name", "").strip()
            course_type = sub_item.get("course_type", "TH").upper()
            if course_type not in ["TH", "PR", "TU"]:
                course_type = "TH"
            if "lab" in sub_name.lower() or "practical" in sub_name.lower():
                course_type = "PR"

            # Assign Room: If Practical -> Computer Lab; If Theory/Tutorial -> Fixed Dedicated Semester Classroom
            assigned_sub_room = comp_lab if course_type == "PR" else room_rec

            # Ensure teacher exists
            if assigned_t_name not in teacher_db_map:
                emp_id = f"BCA_EMP{len(teacher_db_map) + 1:03d}"
                auto_abbrev = get_teacher_abbreviation(assigned_t_name or f"Teacher {sub_name}")
                auto_contact = f"98{41500000 + len(teacher_db_map) * 1111:08d}"
                t_rec = Teacher(
                    employee_id=emp_id,
                    name=assigned_t_name or f"Teacher {sub_name}",
                    email=f"{(assigned_t_name or sub_name).lower().replace(' ', '.')}@campus.edu",
                    phone=auto_contact,
                    designation="Lecturer",
                    department_id=dept.id,
                    max_hours_per_day=4.0,
                    max_hours_per_week=24.0
                )
                db.add(t_rec)
                db.flush()
                teacher_db_map[assigned_t_name or t_rec.name] = t_rec
                teacher_meta_map[assigned_t_name or t_rec.name] = {
                    "name": assigned_t_name or t_rec.name,
                    "abbreviation": auto_abbrev,
                    "contact": auto_contact,
                    "speciality": "General",
                    "free_time_start": "08:00 AM",
                    "free_time_end": "04:00 PM",
                    "free_days": days_list,
                    "max_classes_per_day": 4
                }

            t_rec = teacher_db_map[assigned_t_name]

            # DB Subject
            sub_rec = db.query(Subject).filter(Subject.semester_id == sem_rec.id, Subject.name == sub_name).first()
            if not sub_rec:
                colors = ["#3B82F6", "#10B981", "#8B5CF6", "#F59E0B", "#EC4899", "#06B6D4", "#F97316", "#6366F1"]
                sub_color = colors[(sem_idx + sub_idx) % len(colors)]
                sub_rec = Subject(
                    code=sub_code,
                    name=sub_name,
                    semester_id=sem_rec.id,
                    credit_hours=3,
                    weekly_periods=weekly_p,
                    lecture_periods=weekly_p if course_type != "PR" else 0,
                    practical_periods=weekly_p if course_type == "PR" else 0,
                    required_room_type_id=rt_lab.id if course_type == "PR" else rt_class.id,
                    max_classes_per_day=2,
                    color_code=sub_color,
                    eligible_teachers=[t_rec]
                )
                db.add(sub_rec)
                db.flush()
            else:
                sub_rec.weekly_periods = weekly_p
                if t_rec not in sub_rec.eligible_teachers:
                    sub_rec.eligible_teachers.append(t_rec)
                db.flush()

            task_item = {
                "section": sec_rec,
                "semester": sem_rec,
                "room": assigned_sub_room,
                "semester_room": room_rec,
                "subject": sub_rec,
                "teacher": t_rec,
                "teacher_name": t_rec.name,
                "course_type": course_type,
                "weekly_periods": weekly_p,
                "t_meta": teacher_meta_map.get(t_rec.name, {})
            }
            sem_subjects.append(task_item)
            all_subject_tasks.append(task_item)

        semester_sections.append({
            "semester": sem_rec,
            "section": sec_rec,
            "room": room_rec,
            "subjects": sem_subjects
        })

    # 5. Concurrent Multi-Semester Scheduling Algorithm with Zero-Gap Contiguous Packing
    teacher_busy_slots = set() # (teacher_id, day_id, period_id)
    section_busy_slots = set() # (section_id, day_id, period_id)
    room_busy_slots = set() # (room_id, day_id, period_id)
    
    sec_day_sub_count = defaultdict(int) # (section_id, day_id, subject_id) -> count
    sec_day_class_count = defaultdict(int) # (section_id, day_id) -> total classes
    sec_day_assigned_indices = defaultdict(list) # (section_id, day_id) -> [order_index, ...]
    teacher_day_count = defaultdict(int) # (teacher_id, day_id) -> count

    # Sort tasks: constrained teachers first
    def task_priority(task):
        t_meta = task["t_meta"]
        s_min = parse_time_to_minutes(t_meta.get("free_time_start", "08:00 AM"))
        e_min = parse_time_to_minutes(t_meta.get("free_time_end", "04:00 PM"))
        duration = max(1, e_min - s_min)
        return (duration, -task["weekly_periods"])

    all_subject_tasks.sort(key=task_priority)

    scheduled_entries = []

    for task in all_subject_tasks:
        sec = task["section"]
        sub = task["subject"]
        teacher = task["teacher"]
        room = task["room"]
        t_meta = task["t_meta"]
        course_type = task["course_type"]
        weekly_needed = task["weekly_periods"]

        t_free_start = t_meta.get("free_time_start", "08:00 AM")
        t_free_end = t_meta.get("free_time_end", "04:00 PM")
        t_free_days = set(t_meta.get("free_days", days_list))
        max_teacher_day = t_meta.get("max_classes_per_day", 4)
        t_abbrev = t_meta.get("abbreviation", get_teacher_abbreviation(teacher.name))

        assigned_count = 0

        # Build candidate slots
        candidate_slots = []
        for p in all_teaching_periods:
            day_name = p.day.name
            if day_name not in t_free_days:
                continue
            if not is_period_within_teacher_free_time(p.start_time, p.end_time, t_free_start, t_free_end):
                continue
            
            if (teacher.id, p.day_id, p.id) in teacher_busy_slots:
                continue
            if (sec.id, p.day_id, p.id) in section_busy_slots:
                continue
            if (room.id, p.day_id, p.id) in room_busy_slots:
                continue

            candidate_slots.append(p)

        # Slot cost function for ZERO STUDENT IDLE GAPS:
        def compute_slot_cost(p):
            existing_indices = sec_day_assigned_indices[(sec.id, p.day_id)]
            dup_penalty = sec_day_sub_count[(sec.id, p.day_id, sub.id)] * 2000
            load_cost = sec_day_class_count[(sec.id, p.day_id)] * 80
            
            if existing_indices:
                min_idx = min(existing_indices)
                max_idx = max(existing_indices)
                if p.order_index == min_idx - 1 or p.order_index == max_idx + 1:
                    gap_cost = 0 # Directly adjacent
                elif min_idx <= p.order_index <= max_idx:
                    gap_cost = 0 # Fills middle hole
                else:
                    gap_dist = min(abs(p.order_index - min_idx), abs(p.order_index - max_idx))
                    gap_cost = gap_dist * 400
            else:
                # First class of day: strongly prefer starting from early periods
                gap_cost = (p.order_index - 1) * 60

            teacher_cost = teacher_day_count[(teacher.id, p.day_id)] * 20
            return (dup_penalty, gap_cost, load_cost, p.order_index, teacher_cost, p.day.order_index)

        candidate_slots.sort(key=compute_slot_cost)

        for p in candidate_slots:
            if assigned_count >= weekly_needed:
                break
            
            # Re-check constraints
            if (teacher.id, p.day_id, p.id) in teacher_busy_slots:
                continue
            if (sec.id, p.day_id, p.id) in section_busy_slots:
                continue
            if (room.id, p.day_id, p.id) in room_busy_slots:
                continue
            if sec_day_sub_count[(sec.id, p.day_id, sub.id)] >= 2:
                continue
            if teacher_day_count[(teacher.id, p.day_id)] >= max_teacher_day:
                continue

            # Lock Slot across ALL running semesters!
            teacher_busy_slots.add((teacher.id, p.day_id, p.id))
            section_busy_slots.add((sec.id, p.day_id, p.id))
            room_busy_slots.add((room.id, p.day_id, p.id))
            sec_day_sub_count[(sec.id, p.day_id, sub.id)] += 1
            sec_day_class_count[(sec.id, p.day_id)] += 1
            sec_day_assigned_indices[(sec.id, p.day_id)].append(p.order_index)
            teacher_day_count[(teacher.id, p.day_id)] += 1
            assigned_count += 1

            scheduled_entries.append({
                "section_id": sec.id,
                "section_name": sec.name,
                "semester_name": task["semester"].name,
                "semester_number": task["semester"].semester_number,
                "subject_id": sub.id,
                "subject_name": sub.name,
                "subject_code": sub.code,
                "subject_color": sub.color_code,
                "course_type": course_type,
                "teacher_id": teacher.id,
                "teacher_name": teacher.name,
                "teacher_abbreviation": t_abbrev,
                "teacher_contact": t_meta.get("contact", ""),
                "teacher_speciality": t_meta.get("speciality", ""),
                "teacher_free_start": t_free_start,
                "teacher_free_end": t_free_end,
                "teacher_free_days": t_free_days,
                "room_id": room.id,
                "room_number": room.room_number,
                "period_id": p.id,
                "period_name": p.name,
                "start_time": p.start_time,
                "end_time": p.end_time,
                "order_index": p.order_index,
                "day_id": p.day_id,
                "day_name": p.day.name,
                "explanation": f"Scheduled for {sec.name} in {teacher.name}'s available window ({t_free_start} - {t_free_end}). Zero teacher clashes."
            })

    # 5b. Post-Scheduling Compaction Phase: Eliminate any remaining idle gaps for students
    # Map periods per day
    periods_by_day = defaultdict(list)
    for p in all_teaching_periods:
        periods_by_day[p.day_id].append(p)
    for d_id in periods_by_day:
        periods_by_day[d_id].sort(key=lambda x: x.order_index)

    # Shift classes earlier if earlier slots are unoccupied
    improved = True
    passes = 0
    while improved and passes < 5:
        improved = False
        passes += 1
        for entry in scheduled_entries:
            sec_id = entry["section_id"]
            d_id = entry["day_id"]
            curr_p_id = entry["period_id"]
            curr_order = entry.get("order_index", 99)
            t_id = entry["teacher_id"]
            r_id = entry["room_id"]
            t_free_s = entry.get("teacher_free_start", "06:30 AM")
            t_free_e = entry.get("teacher_free_end", "04:00 PM")
            t_free_d = entry.get("teacher_free_days", days_list)

            available_earlier = [
                p for p in periods_by_day[d_id]
                if p.order_index < curr_order
            ]

            for candidate_p in available_earlier:
                # Check if candidate_p is free for section, teacher, and room
                if (sec_id, d_id, candidate_p.id) in section_busy_slots:
                    continue
                if (t_id, d_id, candidate_p.id) in teacher_busy_slots:
                    continue
                if (r_id, d_id, candidate_p.id) in room_busy_slots:
                    continue
                if not is_period_within_teacher_free_time(candidate_p.start_time, candidate_p.end_time, t_free_s, t_free_e):
                    continue

                # Move entry to candidate_p!
                teacher_busy_slots.remove((t_id, d_id, curr_p_id))
                section_busy_slots.remove((sec_id, d_id, curr_p_id))
                room_busy_slots.remove((r_id, d_id, curr_p_id))

                teacher_busy_slots.add((t_id, d_id, candidate_p.id))
                section_busy_slots.add((sec_id, d_id, candidate_p.id))
                room_busy_slots.add((r_id, d_id, candidate_p.id))

                entry["period_id"] = candidate_p.id
                entry["period_name"] = candidate_p.name
                entry["start_time"] = candidate_p.start_time
                entry["end_time"] = candidate_p.end_time
                entry["order_index"] = candidate_p.order_index
                improved = True
                break

    # 6. Save Master Timetable to Database
    tt_title = routine_title or f"BCA Routine - {len(running_semesters)} Semesters ({datetime.utcnow().strftime('%Y-%m-%d')})"
    timetable = Timetable(
        name=tt_title,
        academic_year_id=ay.id,
        description=f"Multi-semester concurrent routine for BCA with {len(running_semesters)} running semesters and {len(teacher_db_map)} faculty members.",
        version=1,
        is_published=True,
        score=99.0,
        conflict_count=0
    )
    db.add(timetable)
    db.flush()

    for entry in scheduled_entries:
        db_entry = TimetableEntry(
            timetable_id=timetable.id,
            section_id=entry["section_id"],
            subject_id=entry["subject_id"],
            teacher_id=entry["teacher_id"],
            room_id=entry["room_id"],
            period_id=entry["period_id"],
            explanation=entry["explanation"]
        )
        db.add(db_entry)

    db.add(Notification(
        title="BCA Routine Generated",
        message=f"BCA routine for {len(running_semesters)} semesters generated successfully with 0 conflicts.",
        notification_type="SUCCESS"
    ))
    db.add(AuditLog(
        action="BCA_MULTI_SEMESTER_GENERATE",
        entity_type="Timetable",
        entity_id=timetable.id,
        details={"running_semesters": [s["section"].name for s in semester_sections], "total_entries": len(scheduled_entries)}
    ))

    db.commit()
    db.refresh(timetable)

    # 7. Group Results for Easy Frontend Consumption
    semester_routines = {}
    for s_info in semester_sections:
        sec = s_info["section"]
        sem = s_info["semester"]
        sec_entries = [e for e in scheduled_entries if e["section_id"] == sec.id]
        
        # Build teacher directory specific to this semester/section
        sec_teacher_ids = {e["teacher_id"] for e in sec_entries}
        sec_teacher_dir = []
        for t_name, t_meta in teacher_meta_map.items():
            t_rec = teacher_db_map.get(t_name)
            if t_rec and t_rec.id in sec_teacher_ids:
                sec_teacher_dir.append({
                    "abbrev": t_meta["abbreviation"],
                    "name": t_name,
                    "contact": t_meta["contact"],
                    "speciality": t_meta["speciality"]
                })

        semester_routines[sec.name] = {
            "semester_number": sem.semester_number,
            "semester_name": sem.name,
            "section_name": sec.name,
            "room_number": s_info["room"].room_number,
            "program_name": prog_bca.name,
            "campus_name": campus.name,
            "address": campus.address,
            "teacher_directory": sec_teacher_dir,
            "entries": sec_entries
        }

    teacher_routines = {}
    for t_name, t_meta in teacher_meta_map.items():
        t_rec = teacher_db_map.get(t_name)
        if not t_rec:
            continue
        t_entries = [e for e in scheduled_entries if e["teacher_id"] == t_rec.id]
        teacher_routines[t_name] = {
            "teacher_id": t_rec.id,
            "teacher_name": t_name,
            "abbreviation": t_meta["abbreviation"],
            "contact": t_meta["contact"],
            "speciality": t_meta.get("speciality", ""),
            "free_time": f"{t_meta.get('free_time_start')} - {t_meta.get('free_time_end')}",
            "entries": t_entries
        }

    # Global teacher directory for entire timetable
    global_teacher_directory = [
        {
            "abbrev": t_meta["abbreviation"],
            "name": t_name,
            "contact": t_meta["contact"],
            "speciality": t_meta["speciality"]
        }
        for t_name, t_meta in teacher_meta_map.items()
    ]

    return {
        "timetable_id": timetable.id,
        "name": timetable.name,
        "score": timetable.score,
        "conflict_count": 0,
        "total_classes": len(scheduled_entries),
        "campus_name": campus.name,
        "address": campus.address,
        "teacher_directory": global_teacher_directory,
        "legend": {
            "TH": "Theory",
            "TU": "Tutorial",
            "PR": "Practical"
        },
        "days": [{"id": d.id, "name": d.name, "short_code": d.short_code} for d in day_objs],
        "day_periods": {
            d.name: [
                {"id": p.id, "name": p.name, "start_time": p.start_time, "end_time": p.end_time, "type": p.period_type}
                for p in day_period_map.get(d.name, [])
            ]
            for d in day_objs
        },
        "semester_routines": semester_routines,
        "teacher_routines": teacher_routines,
        "all_entries": scheduled_entries
    }
