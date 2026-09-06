from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field

# ----------------- User & Auth Schemas ----------------- #
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: str = "super_admin"
    department_id: Optional[int] = None
    teacher_id: Optional[int] = None
    section_id: Optional[int] = None
    is_active: bool = True

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# ----------------- Campus Structure Schemas ----------------- #
class CampusBase(BaseModel):
    name: str
    code: str
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None

class CampusCreate(CampusBase):
    pass

class CampusResponse(CampusBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

class FacultyBase(BaseModel):
    campus_id: int
    name: str
    code: str
    description: Optional[str] = None

class FacultyCreate(FacultyBase):
    pass

class FacultyResponse(FacultyBase):
    id: int
    class Config:
        from_attributes = True

class DepartmentBase(BaseModel):
    faculty_id: int
    name: str
    code: str
    head_of_department: Optional[str] = None

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentResponse(DepartmentBase):
    id: int
    faculty_name: Optional[str] = None
    class Config:
        from_attributes = True

class ProgramBase(BaseModel):
    department_id: int
    name: str
    code: str
    duration_years: int = 4
    total_semesters: int = 8

class ProgramCreate(ProgramBase):
    pass

class ProgramResponse(ProgramBase):
    id: int
    department_name: Optional[str] = None
    class Config:
        from_attributes = True

class AcademicYearBase(BaseModel):
    name: str
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    is_current: bool = True

class AcademicYearCreate(AcademicYearBase):
    pass

class AcademicYearResponse(AcademicYearBase):
    id: int
    class Config:
        from_attributes = True

class SemesterBase(BaseModel):
    program_id: int
    semester_number: int
    name: str

class SemesterCreate(SemesterBase):
    pass

class SemesterResponse(SemesterBase):
    id: int
    program_name: Optional[str] = None
    class Config:
        from_attributes = True

class SectionBase(BaseModel):
    semester_id: int
    name: str
    student_count: int = 40

class SectionCreate(SectionBase):
    pass

class SectionResponse(SectionBase):
    id: int
    semester_name: Optional[str] = None
    program_name: Optional[str] = None
    display_name: Optional[str] = None  # e.g. "BCA 1st Sem - Sec A"
    class Config:
        from_attributes = True

# ----------------- Room Schemas ----------------- #
class RoomTypeBase(BaseModel):
    name: str
    description: Optional[str] = None

class RoomTypeCreate(RoomTypeBase):
    pass

class RoomTypeResponse(RoomTypeBase):
    id: int
    class Config:
        from_attributes = True

class RoomBase(BaseModel):
    room_number: str
    building: str = "Main Block"
    capacity: int = 50
    room_type_id: int
    department_id: Optional[int] = None
    equipment_info: Optional[str] = None
    is_active: bool = True

class RoomCreate(RoomBase):
    pass

class RoomResponse(RoomBase):
    id: int
    room_type_name: Optional[str] = None
    department_name: Optional[str] = None
    class Config:
        from_attributes = True

# ----------------- Working Days & Periods ----------------- #
class WorkingDayBase(BaseModel):
    name: str
    short_code: str
    order_index: int
    is_active: bool = True

class WorkingDayCreate(WorkingDayBase):
    pass

class WorkingDayResponse(WorkingDayBase):
    id: int
    periods_count: Optional[int] = 0
    periods: Optional[List['PeriodResponse']] = []
    class Config:
        from_attributes = True

class PeriodBase(BaseModel):
    day_id: int
    name: str
    start_time: str
    end_time: str
    order_index: int
    period_type: str = "Teaching"

class PeriodCreate(PeriodBase):
    pass

class PeriodResponse(PeriodBase):
    id: int
    day_name: Optional[str] = None
    day_short_code: Optional[str] = None
    class Config:
        from_attributes = True

# ----------------- Subject Schemas ----------------- #
class SubjectBase(BaseModel):
    semester_id: int
    code: str
    name: str
    credit_hours: int = 3
    weekly_periods: int = 4
    lecture_periods: int = 3
    practical_periods: int = 1
    required_room_type_id: int
    max_classes_per_day: int = 2
    color_code: str = "#3B82F6"

class SubjectCreate(SubjectBase):
    eligible_teacher_ids: Optional[List[int]] = []

class SubjectResponse(SubjectBase):
    id: int
    semester_name: Optional[str] = None
    program_name: Optional[str] = None
    required_room_type_name: Optional[str] = None
    eligible_teacher_ids: List[int] = []
    eligible_teacher_names: List[str] = []
    class Config:
        from_attributes = True

# ----------------- Teacher & Availability Schemas ----------------- #
class TeacherBase(BaseModel):
    employee_id: str
    name: str
    email: EmailStr
    phone: Optional[str] = None
    designation: str = "Lecturer"
    department_id: int
    max_hours_per_day: float = 4.0
    max_hours_per_week: float = 18.0
    min_hours_per_week: float = 6.0
    is_active: bool = True

class TeacherCreate(TeacherBase):
    eligible_subject_ids: Optional[List[int]] = []

class TeacherResponse(TeacherBase):
    id: int
    department_name: Optional[str] = None
    eligible_subject_ids: List[int] = []
    eligible_subject_names: List[str] = []
    assigned_weekly_hours: Optional[float] = 0.0
    class Config:
        from_attributes = True

class TeacherAvailabilityItem(BaseModel):
    period_id: int
    status: str = "available"  # available, unavailable, preferred, restricted

class TeacherAvailabilityBatchUpdate(BaseModel):
    teacher_id: int
    availabilities: List[TeacherAvailabilityItem]

class TeacherAvailabilityResponse(BaseModel):
    id: int
    teacher_id: int
    period_id: int
    status: str
    day_id: int
    day_name: str
    period_name: str
    start_time: str
    end_time: str
    class Config:
        from_attributes = True

# ----------------- Timetable & Entries Schemas ----------------- #
class TimetableEntryBase(BaseModel):
    section_id: int
    subject_id: int
    teacher_id: int
    room_id: int
    period_id: int
    is_locked: bool = False
    explanation: Optional[str] = None

class TimetableEntryResponse(TimetableEntryBase):
    id: int
    timetable_id: int
    section_name: Optional[str] = None
    program_name: Optional[str] = None
    semester_name: Optional[str] = None
    semester_number: Optional[int] = None
    subject_name: Optional[str] = None
    subject_code: Optional[str] = None
    subject_color: Optional[str] = None
    course_type: Optional[str] = "TH"
    teacher_name: Optional[str] = None
    teacher_designation: Optional[str] = None
    teacher_abbreviation: Optional[str] = None
    teacher_contact: Optional[str] = None
    room_number: Optional[str] = None
    room_type_name: Optional[str] = None
    day_id: Optional[int] = None
    day_name: Optional[str] = None
    day_short_code: Optional[str] = None
    period_name: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    period_type: Optional[str] = None
    order_index: Optional[int] = None
    class Config:
        from_attributes = True

class TimetableResponse(BaseModel):
    id: int
    name: str
    academic_year_id: int
    academic_year_name: Optional[str] = None
    description: Optional[str] = None
    version: int
    is_published: bool
    score: float
    conflict_count: int
    created_at: datetime
    updated_at: datetime
    campus_name: Optional[str] = None
    address: Optional[str] = None
    periods: Optional[List[Dict[str, Any]]] = []
    entries: List[TimetableEntryResponse] = []
    class Config:
        from_attributes = True

class GenerateTimetableRequest(BaseModel):
    academic_year_id: int
    name: Optional[str] = "Auto-Generated College Routine"
    section_ids: Optional[List[int]] = None  # None = All sections
    num_solutions: int = 3
    time_limit_seconds: int = 15
    weights: Optional[Dict[str, int]] = {
        "teacher_preference": 5,
        "consecutive_classes": 4,
        "idle_gaps": 4,
        "subject_distribution": 6,
        "room_stability": 2
    }

class MoveClassRequest(BaseModel):
    timetable_id: int
    entry_id: int
    target_period_id: int
    target_room_id: Optional[int] = None

class SwapClassRequest(BaseModel):
    timetable_id: int
    entry_a_id: int
    entry_b_id: int

class ConflictItem(BaseModel):
    conflict_type: str  # Teacher Clash, Room Clash, Section Clash, Availability, Capacity, Room Type, Workload
    severity: str = "ERROR"  # ERROR, WARNING
    description: str
    affected_entry_ids: List[int] = []
    details: Dict[str, Any] = {}
    suggested_fix: Optional[str] = None

class ValidationResult(BaseModel):
    is_valid: bool
    total_conflicts: int
    conflicts: List[ConflictItem]
    teacher_conflicts: int = 0
    room_conflicts: int = 0
    section_conflicts: int = 0
    availability_conflicts: int = 0
    capacity_conflicts: int = 0
    workload_conflicts: int = 0

class SolutionPreview(BaseModel):
    solution_index: int
    score: float
    conflicts_count: int
    penalties_breakdown: Dict[str, Any] = {}
    entries_count: int

class GenerationRunResponse(BaseModel):
    run_id: int
    timetable_id: int
    execution_time_seconds: float
    total_variables: int
    total_constraints: int
    solutions_found: int
    best_score: float
    solutions: List[SolutionPreview] = []

# ----------------- Dashboard Schemas ----------------- #
class DashboardStats(BaseModel):
    campuses_count: int = 0
    faculties_count: int = 0
    departments_count: int = 0
    programs_count: int = 0
    sections_count: int = 0
    teachers_count: int = 0
    subjects_count: int = 0
    rooms_count: int = 0
    periods_count: int = 0
    active_timetables_count: int = 0
    latest_routine_score: Optional[float] = None
    latest_routine_conflicts: Optional[int] = None
    teacher_workloads: List[Dict[str, Any]] = []
    room_utilizations: List[Dict[str, Any]] = []
    day_distribution: List[Dict[str, Any]] = []
