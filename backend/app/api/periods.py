from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.all_models import WorkingDay, Period, Teacher, TeacherAvailability
from app.schemas.schemas import WorkingDayCreate, WorkingDayResponse, PeriodCreate, PeriodResponse

router = APIRouter(prefix="/periods", tags=["Working Days & Periods"])

# --- Working Days --- #
@router.get("/days", response_model=List[WorkingDayResponse])
def get_working_days(db: Session = Depends(get_db)):
    days = db.query(WorkingDay).order_by(WorkingDay.order_index).all()
    res = []
    for d in days:
        resp = WorkingDayResponse.from_orm(d)
        resp.periods_count = len(d.periods)
        resp.periods = [PeriodResponse.from_orm(p) for p in sorted(d.periods, key=lambda x: x.order_index)]
        res.append(resp)
    return res

@router.post("/days", response_model=WorkingDayResponse)
def create_working_day(day_in: WorkingDayCreate, db: Session = Depends(get_db)):
    existing = db.query(WorkingDay).filter(WorkingDay.name == day_in.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Day with this name already exists")
    d = WorkingDay(**day_in.dict())
    db.add(d)
    db.commit()
    db.refresh(d)
    resp = WorkingDayResponse.from_orm(d)
    resp.periods_count = 0
    return resp

@router.put("/days/{id}", response_model=WorkingDayResponse)
def update_working_day(id: int, day_in: WorkingDayCreate, db: Session = Depends(get_db)):
    d = db.query(WorkingDay).filter(WorkingDay.id == id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Working day not found")
    d.name = day_in.name
    d.short_code = day_in.short_code
    d.order_index = day_in.order_index
    d.is_active = day_in.is_active
    db.commit()
    db.refresh(d)
    resp = WorkingDayResponse.from_orm(d)
    resp.periods_count = len(d.periods)
    return resp

# --- Periods --- #
@router.get("", response_model=List[PeriodResponse])
def get_periods(day_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(Period)
    if day_id:
        query = query.filter(Period.day_id == day_id)
    periods = query.order_by(Period.day_id, Period.order_index).all()
    res = []
    for p in periods:
        resp = PeriodResponse.from_orm(p)
        resp.day_name = p.day.name if p.day else None
        resp.day_short_code = p.day.short_code if p.day else None
        res.append(resp)
    return res

@router.post("", response_model=PeriodResponse)
def create_period(period_in: PeriodCreate, db: Session = Depends(get_db)):
    p = Period(**period_in.dict())
    db.add(p)
    db.commit()
    db.refresh(p)

    # Initialize teacher availability for this new period
    teachers = db.query(Teacher).all()
    for t in teachers:
        avail = TeacherAvailability(
            teacher_id=t.id,
            period_id=p.id,
            status="available"
        )
        db.add(avail)
    db.commit()

    resp = PeriodResponse.from_orm(p)
    resp.day_name = p.day.name if p.day else None
    resp.day_short_code = p.day.short_code if p.day else None
    return resp

@router.put("/{id}", response_model=PeriodResponse)
def update_period(id: int, period_in: PeriodCreate, db: Session = Depends(get_db)):
    p = db.query(Period).filter(Period.id == id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Period not found")
    p.day_id = period_in.day_id
    p.name = period_in.name
    p.start_time = period_in.start_time
    p.end_time = period_in.end_time
    p.order_index = period_in.order_index
    p.period_type = period_in.period_type
    db.commit()
    db.refresh(p)

    resp = PeriodResponse.from_orm(p)
    resp.day_name = p.day.name if p.day else None
    resp.day_short_code = p.day.short_code if p.day else None
    return resp

@router.delete("/{id}")
def delete_period(id: int, db: Session = Depends(get_db)):
    p = db.query(Period).filter(Period.id == id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Period not found")
    db.delete(p)
    db.commit()
    return {"status": "success", "message": "Period deleted"}

@router.post("/clone-day")
def clone_day_periods(source_day_id: int, target_day_ids: List[int], db: Session = Depends(get_db)):
    source_periods = db.query(Period).filter(Period.day_id == source_day_id).all()
    if not source_periods:
        raise HTTPException(status_code=400, detail="Source day has no periods to clone.")

    created_count = 0
    for target_day_id in target_day_ids:
        # Delete existing periods on target day
        db.query(Period).filter(Period.day_id == target_day_id).delete()
        for sp in source_periods:
            np = Period(
                day_id=target_day_id,
                name=sp.name,
                start_time=sp.start_time,
                end_time=sp.end_time,
                order_index=sp.order_index,
                period_type=sp.period_type
            )
            db.add(np)
            db.flush()
            # Initialize teacher availabilities
            teachers = db.query(Teacher).all()
            for t in teachers:
                db.add(TeacherAvailability(teacher_id=t.id, period_id=np.id, status="available"))
            created_count += 1

    db.commit()
    return {"status": "success", "message": f"Cloned {len(source_periods)} periods across {len(target_day_ids)} days."}

@router.post("/apply-shift")
def apply_shift_preset(payload: dict, db: Session = Depends(get_db)):
    """
    Apply standard Morning, Day, or Evening shift period templates to selected day or all days.
    """
    shift = payload.get("shift", "morning").lower()
    day_id = payload.get("day_id")
    apply_all = payload.get("apply_all", False)

    presets = {
        "morning": [
            {"name": "Period 1", "start_time": "06:30 AM", "end_time": "07:15 AM", "order_index": 1, "period_type": "Teaching"},
            {"name": "Period 2", "start_time": "07:15 AM", "end_time": "08:00 AM", "order_index": 2, "period_type": "Teaching"},
            {"name": "Period 3", "start_time": "08:00 AM", "end_time": "08:45 AM", "order_index": 3, "period_type": "Teaching"},
            {"name": "Interval", "start_time": "08:45 AM", "end_time": "09:05 AM", "order_index": 4, "period_type": "Break"},
            {"name": "Period 4", "start_time": "09:05 AM", "end_time": "09:50 AM", "order_index": 5, "period_type": "Teaching"},
            {"name": "Period 5", "start_time": "09:50 AM", "end_time": "10:30 AM", "order_index": 6, "period_type": "Teaching"},
        ],
        "day": [
            {"name": "Period 1", "start_time": "10:00 AM", "end_time": "11:00 AM", "order_index": 1, "period_type": "Teaching"},
            {"name": "Period 2", "start_time": "11:00 AM", "end_time": "12:00 PM", "order_index": 2, "period_type": "Teaching"},
            {"name": "Period 3", "start_time": "12:00 PM", "end_time": "01:00 PM", "order_index": 3, "period_type": "Teaching"},
            {"name": "Interval", "start_time": "01:00 PM", "end_time": "01:30 PM", "order_index": 4, "period_type": "Break"},
            {"name": "Period 4", "start_time": "01:30 PM", "end_time": "02:30 PM", "order_index": 5, "period_type": "Teaching"},
            {"name": "Period 5", "start_time": "02:30 PM", "end_time": "03:30 PM", "order_index": 6, "period_type": "Teaching"},
        ],
        "evening": [
            {"name": "Period 1", "start_time": "04:00 PM", "end_time": "04:45 PM", "order_index": 1, "period_type": "Teaching"},
            {"name": "Period 2", "start_time": "04:45 PM", "end_time": "05:30 PM", "order_index": 2, "period_type": "Teaching"},
            {"name": "Period 3", "start_time": "05:30 PM", "end_time": "06:15 PM", "order_index": 3, "period_type": "Teaching"},
            {"name": "Interval", "start_time": "06:15 PM", "end_time": "06:35 PM", "order_index": 4, "period_type": "Break"},
            {"name": "Period 4", "start_time": "06:35 PM", "end_time": "07:20 PM", "order_index": 5, "period_type": "Teaching"},
            {"name": "Period 5", "start_time": "07:20 PM", "end_time": "08:05 PM", "order_index": 6, "period_type": "Teaching"},
        ]
    }

    template = presets.get(shift, presets["morning"])

    if apply_all:
        days = db.query(WorkingDay).filter(WorkingDay.is_active == True).all()
        target_day_ids = [d.id for d in days]
    elif day_id:
        target_day_ids = [int(day_id)]
    else:
        days = db.query(WorkingDay).filter(WorkingDay.is_active == True).all()
        target_day_ids = [d.id for d in days]

    for d_id in target_day_ids:
        # Clear existing periods for this day
        db.query(Period).filter(Period.day_id == d_id).delete()
        for p_data in template:
            np = Period(
                day_id=d_id,
                name=p_data["name"],
                start_time=p_data["start_time"],
                end_time=p_data["end_time"],
                order_index=p_data["order_index"],
                period_type=p_data["period_type"]
            )
            db.add(np)
            db.flush()
            teachers = db.query(Teacher).all()
            for t in teachers:
                db.add(TeacherAvailability(teacher_id=t.id, period_id=np.id, status="available"))

    db.commit()
    return {"status": "success", "message": f"Applied {shift.capitalize()} Shift template across {len(target_day_ids)} days."}

