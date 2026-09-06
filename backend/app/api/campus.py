from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.all_models import (
    Campus, Faculty, Department, Program, AcademicYear, Semester, Section, SystemSetting, User
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

# --- System & Campus Global Settings (Persisted in DB) --- #
@router.get("/settings")
def get_campus_settings(db: Session = Depends(get_db)):
    """
    Get all persisted campus, admin profile, and theme settings from database.
    """
    settings_rows = db.query(SystemSetting).all()
    res = {
        "campusName": "Ratna Rajyalaxmi Campus",
        "campusAddress": "Pradarshanimarga, Kathmandu Nepal",
        "routineTitle": "BCA Academic Routine 2026",
        "adminName": "Dr. Ram Sharma",
        "adminRole": "Campus Admin",
        "adminEmail": "admin@campus.edu",
        "accentTheme": "emerald",
        "themeAccent": "emerald",
        "campus_name": "Ratna Rajyalaxmi Campus",
        "campus_address": "Pradarshanimarga, Kathmandu Nepal",
        "routine_title": "BCA Academic Routine 2026",
        "admin_name": "Dr. Ram Sharma",
        "admin_role": "Campus Admin",
        "admin_email": "admin@campus.edu",
        "accent_theme": "emerald",
    }
    for row in settings_rows:
        if row.value is not None:
            res[row.key] = row.value
            if row.key == "campusName":
                res["campus_name"] = row.value
            elif row.key == "campus_name":
                res["campusName"] = row.value
            elif row.key == "campusAddress":
                res["campus_address"] = row.value
            elif row.key == "campus_address":
                res["campusAddress"] = row.value
            elif row.key == "adminName":
                res["admin_name"] = row.value
            elif row.key == "admin_name":
                res["adminName"] = row.value
            elif row.key == "adminRole":
                res["admin_role"] = row.value
            elif row.key == "admin_role":
                res["adminRole"] = row.value
            elif row.key == "adminEmail":
                res["admin_email"] = row.value
            elif row.key == "admin_email":
                res["adminEmail"] = row.value
            elif row.key == "routineTitle":
                res["routine_title"] = row.value
            elif row.key == "routine_title":
                res["routineTitle"] = row.value
            elif row.key in ["accentTheme", "accent_theme", "themeAccent"]:
                res["accentTheme"] = row.value
                res["accent_theme"] = row.value
                res["themeAccent"] = row.value

    # Fallback/Sync with Campus table
    c = db.query(Campus).first()
    if c:
        if "campusName" not in [r.key for r in settings_rows]:
            res["campusName"] = c.name
            res["campus_name"] = c.name
        if "campusAddress" not in [r.key for r in settings_rows] and c.address:
            res["campusAddress"] = c.address
            res["campus_address"] = c.address

    # Fallback/Sync with User table for admin
    admin_user = db.query(User).filter((User.role == "super_admin") | (User.email == "admin@campus.edu")).first()
    if admin_user:
        if "adminName" not in [r.key for r in settings_rows]:
            res["adminName"] = admin_user.full_name
            res["admin_name"] = admin_user.full_name
        if "adminEmail" not in [r.key for r in settings_rows]:
            res["adminEmail"] = admin_user.email
            res["admin_email"] = admin_user.email

    return {
        "status": "success",
        "data": res,
        **res
    }

@router.put("/settings")
def update_campus_settings(payload: dict, db: Session = Depends(get_db)):
    """
    Persist campus, admin profile, and theme settings directly to database.
    """
    key_mapping = {
        "campus_name": "campusName",
        "campusName": "campusName",
        "campus_address": "campusAddress",
        "campusAddress": "campusAddress",
        "routine_title": "routineTitle",
        "routineTitle": "routineTitle",
        "admin_name": "adminName",
        "adminName": "adminName",
        "admin_role": "adminRole",
        "adminRole": "adminRole",
        "admin_email": "adminEmail",
        "adminEmail": "adminEmail",
        "accent_theme": "accentTheme",
        "accentTheme": "accentTheme",
        "themeAccent": "accentTheme",
    }
    for k, v in payload.items():
        if k in key_mapping and v is not None:
            canonical_key = key_mapping[k]
            setting = db.query(SystemSetting).filter(SystemSetting.key == canonical_key).first()
            if setting:
                setting.value = str(v)
            else:
                setting = SystemSetting(key=canonical_key, value=str(v))
                db.add(setting)

    # Sync Campus record
    c_name = payload.get("campusName") or payload.get("campus_name")
    c_addr = payload.get("campusAddress") or payload.get("campus_address")
    if c_name or c_addr:
        c = db.query(Campus).first()
        if not c and c_name:
            c = Campus(name=str(c_name), code="CAMPUS_MAIN", address=str(c_addr or ""))
            db.add(c)
        elif c:
            if c_name:
                c.name = str(c_name)
            if c_addr is not None:
                c.address = str(c_addr)

    # Sync User record for admin
    a_name = payload.get("adminName") or payload.get("admin_name")
    a_email = payload.get("adminEmail") or payload.get("admin_email")
    if a_name or a_email:
        admin_user = db.query(User).filter((User.role == "super_admin") | (User.email == "admin@campus.edu")).first()
        if admin_user:
            if a_name:
                admin_user.full_name = str(a_name)
            if a_email:
                admin_user.email = str(a_email)

    db.commit()
    return get_campus_settings(db)
