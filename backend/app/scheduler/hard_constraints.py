from typing import List, Dict, Tuple, Set, Optional
from collections import defaultdict
from app.scheduler.models import (
    ScheduledLesson, ScheduleProblem, ProblemTeacher, ProblemRoom, ProblemSubject, ProblemSection, ProblemPeriod
)

def validate_all_hard_constraints(
    lessons: List[ScheduledLesson],
    problem: ScheduleProblem
) -> Tuple[bool, List[Dict[str, any]]]:
    """
    Validates a proposed schedule against all hard constraints.
    Returns (is_valid, list_of_violations).
    """
    violations = []
    
    period_map = {p.id: p for p in problem.periods}
    teacher_map = {t.id: t for t in problem.teachers}
    room_map = {r.id: r for r in problem.rooms}
    subject_map = {s.id: s for s in problem.subjects}
    section_map = {sec.id: sec for sec in problem.sections}

    # 1. Non-Teaching Period Protection
    for l in lessons:
        period = period_map.get(l.period_id)
        if not period or period.period_type != "Teaching":
            violations.append({
                "type": "Non-Teaching Period",
                "severity": "ERROR",
                "description": f"Class scheduled in non-teaching period '{period.name if period else l.period_id}' ({period.period_type if period else 'Unknown'}).",
                "details": {"period_id": l.period_id, "section_id": l.section_id}
            })

    # 2. Teacher Double Booking (Clash)
    teacher_period_usage = defaultdict(list)
    for l in lessons:
        teacher_period_usage[(l.teacher_id, l.period_id)].append(l)
    
    for (teacher_id, period_id), booked_lessons in teacher_period_usage.items():
        if len(booked_lessons) > 1:
            t = teacher_map.get(teacher_id)
            p = period_map.get(period_id)
            violations.append({
                "type": "Teacher Conflict",
                "severity": "ERROR",
                "description": f"Teacher {t.name if t else teacher_id} is double-booked at period {p.name if p else period_id}.",
                "details": {
                    "teacher_id": teacher_id,
                    "period_id": period_id,
                    "conflicting_sections": [l.section_id for l in booked_lessons],
                    "conflicting_subjects": [l.subject_id for l in booked_lessons]
                }
            })

    # 3. Section Double Booking (Clash)
    section_period_usage = defaultdict(list)
    for l in lessons:
        section_period_usage[(l.section_id, l.period_id)].append(l)

    for (section_id, period_id), booked_lessons in section_period_usage.items():
        if len(booked_lessons) > 1:
            sec = section_map.get(section_id)
            p = period_map.get(period_id)
            violations.append({
                "type": "Section Conflict",
                "severity": "ERROR",
                "description": f"Section {sec.name if sec else section_id} has multiple classes scheduled at period {p.name if p else period_id}.",
                "details": {
                    "section_id": section_id,
                    "period_id": period_id,
                    "conflicting_subjects": [l.subject_id for l in booked_lessons]
                }
            })

    # 4. Room Double Booking (Clash)
    room_period_usage = defaultdict(list)
    for l in lessons:
        room_period_usage[(l.room_id, l.period_id)].append(l)

    for (room_id, period_id), booked_lessons in room_period_usage.items():
        if len(booked_lessons) > 1:
            r = room_map.get(room_id)
            p = period_map.get(period_id)
            violations.append({
                "type": "Room Conflict",
                "severity": "ERROR",
                "description": f"Room {r.room_number if r else room_id} is assigned to multiple classes at period {p.name if p else period_id}.",
                "details": {
                    "room_id": room_id,
                    "period_id": period_id,
                    "conflicting_sections": [l.section_id for l in booked_lessons]
                }
            })

    # 5. Teacher Availability
    for l in lessons:
        t = teacher_map.get(l.teacher_id)
        if t and t.availability_map.get(l.period_id) in ("unavailable", "restricted"):
            p = period_map.get(l.period_id)
            violations.append({
                "type": "Availability Conflict",
                "severity": "ERROR",
                "description": f"Teacher {t.name} is marked {t.availability_map.get(l.period_id)} for period {p.name if p else l.period_id}.",
                "details": {"teacher_id": l.teacher_id, "period_id": l.period_id, "status": t.availability_map.get(l.period_id)}
            })

    # 6. Room Capacity & Type Compatibility
    for l in lessons:
        r = room_map.get(l.room_id)
        sub = subject_map.get(l.subject_id)
        sec = section_map.get(l.section_id)
        if r and sub and sec:
            # Capacity check
            if r.capacity < sec.student_count:
                violations.append({
                    "type": "Capacity Conflict",
                    "severity": "ERROR",
                    "description": f"Room {r.room_number} (capacity: {r.capacity}) is too small for Section {sec.name} ({sec.student_count} students).",
                    "details": {"room_id": r.id, "room_capacity": r.capacity, "section_students": sec.student_count}
                })
            # Room Type check
            if sub.required_room_type_id != r.room_type_id:
                violations.append({
                    "type": "Room Type Conflict",
                    "severity": "ERROR",
                    "description": f"Subject '{sub.name}' requires {sub.required_room_type_id} but assigned Room {r.room_number} is {r.room_type_name}.",
                    "details": {"subject_id": sub.id, "required_room_type_id": sub.required_room_type_id, "actual_room_type_id": r.room_type_id}
                })

    # 7. Teacher Daily & Weekly Workload Limits
    teacher_daily_counts = defaultdict(int)  # (teacher_id, day_id) -> count
    teacher_weekly_counts = defaultdict(int)  # teacher_id -> count
    for l in lessons:
        teacher_daily_counts[(l.teacher_id, l.day_id)] += 1
        teacher_weekly_counts[l.teacher_id] += 1

    for (teacher_id, day_id), count in teacher_daily_counts.items():
        t = teacher_map.get(teacher_id)
        if t and count > t.max_hours_per_day:
            violations.append({
                "type": "Workload Conflict",
                "severity": "ERROR",
                "description": f"Teacher {t.name} exceeds daily maximum ({count} periods assigned, max allowed is {t.max_hours_per_day}).",
                "details": {"teacher_id": teacher_id, "day_id": day_id, "assigned_hours": count, "max_allowed": t.max_hours_per_day}
            })

    for teacher_id, count in teacher_weekly_counts.items():
        t = teacher_map.get(teacher_id)
        if t and count > t.max_hours_per_week:
            violations.append({
                "type": "Workload Conflict",
                "severity": "ERROR",
                "description": f"Teacher {t.name} exceeds weekly maximum ({count} periods assigned, max allowed is {t.max_hours_per_week}).",
                "details": {"teacher_id": teacher_id, "assigned_hours": count, "max_allowed": t.max_hours_per_week}
            })

    # 8. Subject Daily Class Limit for Section
    sec_sub_day_counts = defaultdict(int)  # (section_id, subject_id, day_id) -> count
    for l in lessons:
        sec_sub_day_counts[(l.section_id, l.subject_id, l.day_id)] += 1

    for (section_id, subject_id, day_id), count in sec_sub_day_counts.items():
        sub = subject_map.get(subject_id)
        sec = section_map.get(section_id)
        if sub and count > sub.max_classes_per_day:
            violations.append({
                "type": "Subject Daily Limit Conflict",
                "severity": "ERROR",
                "description": f"Section {sec.name if sec else section_id} has {count} classes of '{sub.name}' in a single day (max allowed is {sub.max_classes_per_day}).",
                "details": {"section_id": section_id, "subject_id": subject_id, "day_id": day_id, "count": count, "max": sub.max_classes_per_day}
            })

    is_valid = len(violations) == 0
    return is_valid, violations
