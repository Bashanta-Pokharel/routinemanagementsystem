from typing import Dict, Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.models.all_models import (
    Campus, Faculty, Department, Program, Section, Teacher, Subject, Room, Period, Timetable, TimetableEntry, WorkingDay
)
from app.schemas.schemas import DashboardStats

router = APIRouter(prefix="/dashboard", tags=["Dashboard & Analytics"])

@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    campuses_c = db.query(Campus).count()
    faculties_c = db.query(Faculty).count()
    depts_c = db.query(Department).count()
    progs_c = db.query(Program).count()
    secs_c = db.query(Section).count()
    teachers_c = db.query(Teacher).filter(Teacher.is_active == True).count()
    subjects_c = db.query(Subject).count()
    rooms_c = db.query(Room).filter(Room.is_active == True).count()
    periods_c = db.query(Period).count()
    active_tts_c = db.query(Timetable).count()

    latest_tt = db.query(Timetable).order_by(Timetable.id.desc()).first()

    teacher_workloads = []
    room_utilizations = []
    day_distribution = []

    if latest_tt:
        # Teacher workloads
        t_counts = db.query(
            Teacher.id, Teacher.name, Teacher.max_hours_per_week, func.count(TimetableEntry.id)
        ).outerjoin(
            TimetableEntry, (TimetableEntry.teacher_id == Teacher.id) & (TimetableEntry.timetable_id == latest_tt.id)
        ).filter(Teacher.is_active == True).group_by(Teacher.id, Teacher.name, Teacher.max_hours_per_week).all()

        for t_id, name, max_w, assigned_c in t_counts:
            assigned = assigned_c or 0
            max_limit = max_w or 18.0
            utilization = round((assigned / max_limit) * 100.0, 1) if max_limit > 0 else 0
            
            status_label = "Balanced"
            if assigned > max_limit:
                status_label = "Overloaded"
            elif assigned >= max_limit - 2:
                status_label = "Near Limit"
            elif assigned < 6:
                status_label = "Underutilized"

            teacher_workloads.append({
                "teacher_id": t_id,
                "name": name,
                "assigned_hours": assigned,
                "max_hours": max_limit,
                "utilization_pct": utilization,
                "status": status_label
            })

        # Room utilizations
        teaching_periods_count = db.query(Period).filter(Period.period_type == "Teaching").count()
        r_counts = db.query(
            Room.id, Room.room_number, Room.capacity, func.count(TimetableEntry.id)
        ).outerjoin(
            TimetableEntry, (TimetableEntry.room_id == Room.id) & (TimetableEntry.timetable_id == latest_tt.id)
        ).filter(Room.is_active == True).group_by(Room.id, Room.room_number, Room.capacity).all()

        for r_id, r_num, cap, booked in r_counts:
            b_count = booked or 0
            pct = round((b_count / max(teaching_periods_count, 1)) * 100.0, 1)
            room_utilizations.append({
                "room_id": r_id,
                "room_number": r_num,
                "capacity": cap,
                "booked_periods": b_count,
                "utilization_pct": pct
            })

        # Day distribution
        days = db.query(WorkingDay).filter(WorkingDay.is_active == True).order_by(WorkingDay.order_index).all()
        for d in days:
            day_p_ids = [p.id for p in d.periods if p.period_type == "Teaching"]
            day_classes_count = db.query(TimetableEntry).filter(
                TimetableEntry.timetable_id == latest_tt.id,
                TimetableEntry.period_id.in_(day_p_ids)
            ).count() if day_p_ids else 0

            day_distribution.append({
                "day_name": d.name,
                "short_code": d.short_code,
                "classes_count": day_classes_count,
                "available_slots": len(day_p_ids)
            })

    return DashboardStats(
        campuses_count=campuses_c,
        faculties_count=faculties_c,
        departments_count=depts_c,
        programs_count=progs_c,
        sections_count=secs_c,
        teachers_count=teachers_c,
        subjects_count=subjects_c,
        rooms_count=rooms_c,
        periods_count=periods_c,
        active_timetables_count=active_tts_c,
        latest_routine_score=latest_tt.score if latest_tt else None,
        latest_routine_conflicts=latest_tt.conflict_count if latest_tt else None,
        teacher_workloads=teacher_workloads,
        room_utilizations=room_utilizations,
        day_distribution=day_distribution
    )
