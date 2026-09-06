from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.all_models import (
    Campus, Faculty, Department, Program, AcademicYear, Semester, Section
)
from app.schemas.schemas import (
    CampusCreate, CampusResponse,
    FacultyCreate, FacultyResponse,
    DepartmentCreate, DepartmentResponse,
    ProgramCreate, ProgramResponse,
    AcademicYearCreate, AcademicYearResponse,
    SemesterCreate, SemesterResponse,
    SectionCreate, SectionResponse
)

router = APIRouter(prefix="/academic", tags=["Academic Structure"])

# --- Campus Endpoints --- #
@router.get("/campuses", response_model=List[CampusResponse])
def get_campuses(db: Session = Depends(get_db)):
    return db.query(Campus).all()

@router.post("/campuses", response_model=CampusResponse)
def create_campus(campus_in: CampusCreate, db: Session = Depends(get_db)):
    existing = db.query(Campus).filter(Campus.code == campus_in.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Campus code already exists.")
    c = Campus(**campus_in.dict())
    db.add(c)
    db.commit()
    db.refresh(c)
    return c

# --- Faculty Endpoints --- #
@router.get("/faculties", response_model=List[FacultyResponse])
def get_faculties(db: Session = Depends(get_db)):
    return db.query(Faculty).all()

@router.post("/faculties", response_model=FacultyResponse)
def create_faculty(faculty_in: FacultyCreate, db: Session = Depends(get_db)):
    f = Faculty(**faculty_in.dict())
    db.add(f)
    db.commit()
    db.refresh(f)
    return f

# --- Department Endpoints --- #
@router.get("/departments", response_model=List[DepartmentResponse])
def get_departments(db: Session = Depends(get_db)):
    depts = db.query(Department).all()
    res = []
    for d in depts:
        resp = DepartmentResponse.from_orm(d)
        resp.faculty_name = d.faculty.name if d.faculty else None
        res.append(resp)
    return res

@router.post("/departments", response_model=DepartmentResponse)
def create_department(dept_in: DepartmentCreate, db: Session = Depends(get_db)):
    d = Department(**dept_in.dict())
    db.add(d)
    db.commit()
    db.refresh(d)
    resp = DepartmentResponse.from_orm(d)
    resp.faculty_name = d.faculty.name if d.faculty else None
    return resp

# --- Program Endpoints --- #
@router.get("/programs", response_model=List[ProgramResponse])
def get_programs(db: Session = Depends(get_db)):
    progs = db.query(Program).all()
    res = []
    for p in progs:
        resp = ProgramResponse.from_orm(p)
        resp.department_name = p.department.name if p.department else None
        res.append(resp)
    return res

@router.post("/programs", response_model=ProgramResponse)
def create_program(prog_in: ProgramCreate, db: Session = Depends(get_db)):
    p = Program(**prog_in.dict())
    db.add(p)
    db.commit()
    db.refresh(p)
    # Auto create semesters for convenience
    for i in range(1, p.total_semesters + 1):
        sem = Semester(program_id=p.id, semester_number=i, name=f"Semester {i}")
        db.add(sem)
    db.commit()
    resp = ProgramResponse.from_orm(p)
    resp.department_name = p.department.name if p.department else None
    return resp

@router.delete("/programs/{id}")
def delete_program(id: int, db: Session = Depends(get_db)):
    p = db.query(Program).filter(Program.id == id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Program not found")
    db.delete(p)
    db.commit()
    return {"status": "success", "message": "Program deleted"}

# --- Academic Year Endpoints --- #
@router.get("/academic-years", response_model=List[AcademicYearResponse])
def get_academic_years(db: Session = Depends(get_db)):
    return db.query(AcademicYear).all()

@router.post("/academic-years", response_model=AcademicYearResponse)
def create_academic_year(year_in: AcademicYearCreate, db: Session = Depends(get_db)):
    y = AcademicYear(**year_in.dict())
    db.add(y)
    db.commit()
    db.refresh(y)
    return y

# --- Semester Endpoints --- #
@router.get("/semesters", response_model=List[SemesterResponse])
def get_semesters(program_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(Semester)
    if program_id:
        query = query.filter(Semester.program_id == program_id)
    semesters = query.all()
    res = []
    for s in semesters:
        resp = SemesterResponse.from_orm(s)
        resp.program_name = s.program.name if s.program else None
        res.append(resp)
    return res

# --- Section Endpoints --- #
@router.get("/sections", response_model=List[SectionResponse])
def get_sections(semester_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(Section)
    if semester_id:
        query = query.filter(Section.semester_id == semester_id)
    sections = query.all()
    res = []
    for s in sections:
        resp = SectionResponse.from_orm(s)
        resp.semester_name = s.semester.name if s.semester else None
        resp.program_name = s.semester.program.name if (s.semester and s.semester.program) else None
        resp.display_name = f"{resp.program_name} {resp.semester_name} - Sec {s.name}" if resp.program_name else f"Sec {s.name}"
        res.append(resp)
    return res

@router.post("/sections", response_model=SectionResponse)
def create_section(sec_in: SectionCreate, db: Session = Depends(get_db)):
    s = Section(**sec_in.dict())
    db.add(s)
    db.commit()
    db.refresh(s)
    resp = SectionResponse.from_orm(s)
    resp.semester_name = s.semester.name if s.semester else None
    resp.program_name = s.semester.program.name if (s.semester and s.semester.program) else None
    resp.display_name = f"{resp.program_name} {resp.semester_name} - Sec {s.name}" if resp.program_name else f"Sec {s.name}"
    return resp

@router.delete("/sections/{id}")
def delete_section(id: int, db: Session = Depends(get_db)):
    s = db.query(Section).filter(Section.id == id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Section not found")
    db.delete(s)
    db.commit()
    return {"status": "success", "message": "Section deleted"}
