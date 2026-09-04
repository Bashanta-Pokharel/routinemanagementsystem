from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.models.all_models import (
    Teacher, TeacherAvailability, Period, WorkingDay, Subject, teacher_subjects, TimetableEntry, Timetable
)
from app.schemas.schemas import (
    TeacherCreate, TeacherResponse, TeacherAvailabilityItem, TeacherAvailabilityBatchUpdate, TeacherAvailabilityResponse
)

router = APIRouter(prefix="/teachers", tags=["Teacher Management"])

@router.get("", response_model=List[TeacherResponse])
def get_teachers(department_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(Teacher).filter(Teacher.is_active == True)
    if department_id:
        query = query.filter(Teacher.department_id == department_id)
    teachers = query.all()
    
    # Calculate assigned weekly hours from latest published or active timetable
    latest_timetable = db.query(Timetable).order_by(Timetable.id.desc()).first()
    tt_teacher_hours = {}
    if latest_timetable:
        counts = db.query(
            TimetableEntry.teacher_id, func.count(TimetableEntry.id)
        ).filter(
            TimetableEntry.timetable_id == latest_timetable.id
        ).group_by(TimetableEntry.teacher_id).all()
        tt_teacher_hours = {t_id: count for t_id, count in counts}

    res = []
    for t in teachers:
        resp = TeacherResponse.from_orm(t)
        resp.department_name = t.department.name if t.department else None
        resp.eligible_subject_ids = [s.id for s in t.eligible_subjects]
        resp.eligible_subject_names = [f"{s.code} - {s.name}" for s in t.eligible_subjects]
        resp.assigned_weekly_hours = float(tt_teacher_hours.get(t.id, 0))
        res.append(resp)
    return res

@router.get("/{id}", response_model=TeacherResponse)
def get_teacher(id: int, db: Session = Depends(get_db)):
    t = db.query(Teacher).filter(Teacher.id == id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Teacher not found")
    resp = TeacherResponse.from_orm(t)
    resp.department_name = t.department.name if t.department else None
    resp.eligible_subject_ids = [s.id for s in t.eligible_subjects]
    resp.eligible_subject_names = [f"{s.code} - {s.name}" for s in t.eligible_subjects]
    return resp

@router.post("", response_model=TeacherResponse)
def create_teacher(teacher_in: TeacherCreate, db: Session = Depends(get_db)):
    existing = db.query(Teacher).filter(Teacher.email == teacher_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Teacher with this email already exists")
    
    t_data = teacher_in.dict(exclude={"eligible_subject_ids"})
    t = Teacher(**t_data)
    
    if teacher_in.eligible_subject_ids:
        subjects = db.query(Subject).filter(Subject.id.in_(teacher_in.eligible_subject_ids)).all()
        t.eligible_subjects = subjects

    db.add(t)
    db.commit()
    db.refresh(t)

    # Automatically initialize default availability for all existing teaching periods as 'available'
    periods = db.query(Period).all()
    for p in periods:
        avail = TeacherAvailability(
            teacher_id=t.id,
            period_id=p.id,
            status="available"
        )
        db.add(avail)
    db.commit()

    resp = TeacherResponse.from_orm(t)
    resp.department_name = t.department.name if t.department else None
    resp.eligible_subject_ids = [s.id for s in t.eligible_subjects]
    resp.eligible_subject_names = [f"{s.code} - {s.name}" for s in t.eligible_subjects]
    return resp

@router.put("/{id}", response_model=TeacherResponse)
def update_teacher(id: int, teacher_in: TeacherCreate, db: Session = Depends(get_db)):
    t = db.query(Teacher).filter(Teacher.id == id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Teacher not found")

    t.employee_id = teacher_in.employee_id
    t.name = teacher_in.name
    t.email = teacher_in.email
    t.phone = teacher_in.phone
    t.designation = teacher_in.designation
    t.department_id = teacher_in.department_id
    t.max_hours_per_day = teacher_in.max_hours_per_day
    t.max_hours_per_week = teacher_in.max_hours_per_week
    t.min_hours_per_week = teacher_in.min_hours_per_week
    t.is_active = teacher_in.is_active

    if teacher_in.eligible_subject_ids is not None:
        subjects = db.query(Subject).filter(Subject.id.in_(teacher_in.eligible_subject_ids)).all()
        t.eligible_subjects = subjects

    db.commit()
    db.refresh(t)

    resp = TeacherResponse.from_orm(t)
    resp.department_name = t.department.name if t.department else None
    resp.eligible_subject_ids = [s.id for s in t.eligible_subjects]
    resp.eligible_subject_names = [f"{s.code} - {s.name}" for s in t.eligible_subjects]
    return resp

@router.delete("/{id}")
def delete_teacher(id: int, db: Session = Depends(get_db)):
    t = db.query(Teacher).filter(Teacher.id == id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Teacher not found")
    t.is_active = False
    db.commit()
    return {"status": "success", "message": "Teacher marked inactive"}

# --- Availability Endpoints --- #
@router.get("/{id}/availability", response_model=List[TeacherAvailabilityResponse])
def get_teacher_availability(id: int, db: Session = Depends(get_db)):
    t = db.query(Teacher).filter(Teacher.id == id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Teacher not found")

    # Fetch all active periods
    active_days = db.query(WorkingDay).filter(WorkingDay.is_active == True).all()
    active_day_ids = [d.id for d in active_days]
    periods = db.query(Period).filter(Period.day_id.in_(active_day_ids)).order_by(Period.day_id, Period.order_index).all()

    # Existing availabilities
    existing_avails = {a.period_id: a for a in t.availabilities}

    result = []
    for p in periods:
        a_record = existing_avails.get(p.id)
        status_val = a_record.status if a_record else "available"
        result.append(TeacherAvailabilityResponse(
            id=a_record.id if a_record else 0,
            teacher_id=t.id,
            period_id=p.id,
            status=status_val,
            day_id=p.day_id,
            day_name=p.day.name if p.day else "",
            period_name=p.name,
            start_time=p.start_time,
            end_time=p.end_time
        ))
    return result

@router.post("/availability/batch")
def batch_update_availability(payload: TeacherAvailabilityBatchUpdate, db: Session = Depends(get_db)):
    t = db.query(Teacher).filter(Teacher.id == payload.teacher_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Teacher not found")

    for item in payload.availabilities:
        record = db.query(TeacherAvailability).filter(
            TeacherAvailability.teacher_id == t.id,
            TeacherAvailability.period_id == item.period_id
        ).first()

        if record:
            record.status = item.status
        else:
            new_record = TeacherAvailability(
                teacher_id=t.id,
                period_id=item.period_id,
                status=item.status
            )
            db.add(new_record)

    db.commit()
    return {"status": "success", "message": f"Updated availability for teacher {t.name}"}
