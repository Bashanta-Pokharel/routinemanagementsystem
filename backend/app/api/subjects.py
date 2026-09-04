from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.all_models import Subject, Teacher, Semester, RoomType, teacher_subjects
from app.schemas.schemas import SubjectCreate, SubjectResponse

router = APIRouter(prefix="/subjects", tags=["Subject Management"])

@router.get("", response_model=List[SubjectResponse])
def get_subjects(semester_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(Subject)
    if semester_id:
        query = query.filter(Subject.semester_id == semester_id)
    subjects = query.all()
    
    res = []
    for s in subjects:
        resp = SubjectResponse.from_orm(s)
        resp.semester_name = s.semester.name if s.semester else None
        resp.program_name = s.semester.program.name if (s.semester and s.semester.program) else None
        resp.required_room_type_name = s.required_room_type.name if s.required_room_type else None
        resp.eligible_teacher_ids = [t.id for t in s.eligible_teachers]
        resp.eligible_teacher_names = [t.name for t in s.eligible_teachers]
        res.append(resp)
    return res

@router.post("", response_model=SubjectResponse)
def create_subject(subject_in: SubjectCreate, db: Session = Depends(get_db)):
    s_data = subject_in.dict(exclude={"eligible_teacher_ids"})
    s = Subject(**s_data)
    
    if subject_in.eligible_teacher_ids:
        teachers = db.query(Teacher).filter(Teacher.id.in_(subject_in.eligible_teacher_ids)).all()
        s.eligible_teachers = teachers

    db.add(s)
    db.commit()
    db.refresh(s)

    resp = SubjectResponse.from_orm(s)
    resp.semester_name = s.semester.name if s.semester else None
    resp.program_name = s.semester.program.name if (s.semester and s.semester.program) else None
    resp.required_room_type_name = s.required_room_type.name if s.required_room_type else None
    resp.eligible_teacher_ids = [t.id for t in s.eligible_teachers]
    resp.eligible_teacher_names = [t.name for t in s.eligible_teachers]
    return resp

@router.put("/{id}", response_model=SubjectResponse)
def update_subject(id: int, subject_in: SubjectCreate, db: Session = Depends(get_db)):
    s = db.query(Subject).filter(Subject.id == id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Subject not found")

    s.semester_id = subject_in.semester_id
    s.code = subject_in.code
    s.name = subject_in.name
    s.credit_hours = subject_in.credit_hours
    s.weekly_periods = subject_in.weekly_periods
    s.lecture_periods = subject_in.lecture_periods
    s.practical_periods = subject_in.practical_periods
    s.required_room_type_id = subject_in.required_room_type_id
    s.max_classes_per_day = subject_in.max_classes_per_day
    s.color_code = subject_in.color_code

    if subject_in.eligible_teacher_ids is not None:
        teachers = db.query(Teacher).filter(Teacher.id.in_(subject_in.eligible_teacher_ids)).all()
        s.eligible_teachers = teachers

    db.commit()
    db.refresh(s)

    resp = SubjectResponse.from_orm(s)
    resp.semester_name = s.semester.name if s.semester else None
    resp.program_name = s.semester.program.name if (s.semester and s.semester.program) else None
    resp.required_room_type_name = s.required_room_type.name if s.required_room_type else None
    resp.eligible_teacher_ids = [t.id for t in s.eligible_teachers]
    resp.eligible_teacher_names = [t.name for t in s.eligible_teachers]
    return resp

@router.delete("/{id}")
def delete_subject(id: int, db: Session = Depends(get_db)):
    s = db.query(Subject).filter(Subject.id == id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Subject not found")
    db.delete(s)
    db.commit()
    return {"status": "success", "message": "Subject deleted"}
