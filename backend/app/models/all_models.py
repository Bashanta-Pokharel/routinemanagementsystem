from datetime import datetime
from enum import Enum
from typing import List, Optional
from sqlalchemy import (
    Column, Integer, String, Boolean, ForeignKey, Float, Text, Time, DateTime, JSON, UniqueConstraint, Table
)
from sqlalchemy.orm import relationship
from app.core.database import Base

# Association table for teacher subjects
teacher_subjects = Table(
    "teacher_subjects",
    Base.metadata,
    Column("teacher_id", Integer, ForeignKey("teachers.id", ondelete="CASCADE"), primary_key=True),
    Column("subject_id", Integer, ForeignKey("subjects.id", ondelete="CASCADE"), primary_key=True),
)

class UserRole(str, Enum):
    SUPER_ADMIN = "super_admin"
    DEPT_ADMIN = "dept_admin"
    TEACHER = "teacher"
    STUDENT = "student"

class PeriodType(str, Enum):
    TEACHING = "Teaching"
    BREAK = "Break"
    LUNCH = "Lunch"
    FREE = "Free"
    MEETING = "Meeting"
    OTHER = "Other"

class AvailabilityStatus(str, Enum):
    AVAILABLE = "available"
    UNAVAILABLE = "unavailable"
    PREFERRED = "preferred"
    RESTRICTED = "restricted"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default=UserRole.SUPER_ADMIN, nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)
    teacher_id = Column(Integer, ForeignKey("teachers.id", ondelete="SET NULL"), nullable=True)
    section_id = Column(Integer, ForeignKey("sections.id", ondelete="SET NULL"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    department = relationship("Department", back_populates="users")
    teacher = relationship("Teacher", back_populates="user", uselist=False)
    section = relationship("Section", back_populates="students")

class Campus(Base):
    __tablename__ = "campuses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    code = Column(String(50), unique=True, nullable=False)
    address = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    email = Column(String(255), nullable=True)
    website = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    faculties = relationship("Faculty", back_populates="campus", cascade="all, delete-orphan")

class Faculty(Base):
    __tablename__ = "faculties"

    id = Column(Integer, primary_key=True, index=True)
    campus_id = Column(Integer, ForeignKey("campuses.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)  # e.g. Faculty of Science & Technology, Faculty of Management
    code = Column(String(50), nullable=False)
    description = Column(Text, nullable=True)

    campus = relationship("Campus", back_populates="faculties")
    departments = relationship("Department", back_populates="faculty", cascade="all, delete-orphan")

class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    faculty_id = Column(Integer, ForeignKey("faculties.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)  # e.g. Computer Science, Business Administration
    code = Column(String(50), nullable=False)
    head_of_department = Column(String(255), nullable=True)

    faculty = relationship("Faculty", back_populates="departments")
    programs = relationship("Program", back_populates="department", cascade="all, delete-orphan")
    teachers = relationship("Teacher", back_populates="department")
    users = relationship("User", back_populates="department")
    rooms = relationship("Room", back_populates="department")

class Program(Base):
    __tablename__ = "programs"

    id = Column(Integer, primary_key=True, index=True)
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)  # e.g. Bachelor of Computer Applications (BCA), BSc. CSIT
    code = Column(String(50), nullable=False)
    duration_years = Column(Integer, default=4)
    total_semesters = Column(Integer, default=8)

    department = relationship("Department", back_populates="programs")
    semesters = relationship("Semester", back_populates="program", cascade="all, delete-orphan")

class AcademicYear(Base):
    __tablename__ = "academic_years"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)  # e.g. 2026/2027 or 2083 BS
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    is_current = Column(Boolean, default=True)

    timetables = relationship("Timetable", back_populates="academic_year")

class Semester(Base):
    __tablename__ = "semesters"

    id = Column(Integer, primary_key=True, index=True)
    program_id = Column(Integer, ForeignKey("programs.id", ondelete="CASCADE"), nullable=False)
    semester_number = Column(Integer, nullable=False)  # 1 to 8
    name = Column(String(100), nullable=False)  # e.g. "Semester 1", "Semester 6"

    program = relationship("Program", back_populates="semesters")
    sections = relationship("Section", back_populates="semester", cascade="all, delete-orphan")
    subjects = relationship("Subject", back_populates="semester", cascade="all, delete-orphan")

class Section(Base):
    __tablename__ = "sections"

    id = Column(Integer, primary_key=True, index=True)
    semester_id = Column(Integer, ForeignKey("semesters.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)  # e.g. "A", "B", "Section 1"
    student_count = Column(Integer, default=40)

    semester = relationship("Semester", back_populates="sections")
    students = relationship("User", back_populates="section")
    timetable_entries = relationship("TimetableEntry", back_populates="section", cascade="all, delete-orphan")

class RoomType(Base):
    __tablename__ = "room_types"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)  # Classroom, Computer Lab, Electronics Lab, Seminar Hall
    description = Column(Text, nullable=True)

    rooms = relationship("Room", back_populates="room_type")
    subjects = relationship("Subject", back_populates="required_room_type")

class Room(Base):
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True, index=True)
    room_number = Column(String(100), unique=True, nullable=False)  # e.g. "101", "Lab 1", "Seminar Hall A"
    building = Column(String(100), default="Main Block")
    capacity = Column(Integer, default=50, nullable=False)
    room_type_id = Column(Integer, ForeignKey("room_types.id", ondelete="RESTRICT"), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)
    equipment_info = Column(Text, nullable=True)  # e.g. "40 PCs, Projector, AC"
    is_active = Column(Boolean, default=True)

    room_type = relationship("RoomType", back_populates="rooms")
    department = relationship("Department", back_populates="rooms")
    timetable_entries = relationship("TimetableEntry", back_populates="room")

class WorkingDay(Base):
    __tablename__ = "working_days"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)  # Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday
    short_code = Column(String(10), nullable=False)  # SUN, MON, TUE, etc.
    order_index = Column(Integer, nullable=False)  # 0 to 6 for sorting
    is_active = Column(Boolean, default=True)

    periods = relationship("Period", back_populates="day", cascade="all, delete-orphan", order_by="Period.order_index")

class Period(Base):
    __tablename__ = "periods"

    id = Column(Integer, primary_key=True, index=True)
    day_id = Column(Integer, ForeignKey("working_days.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)  # e.g. "Period 1", "Break", "Period 4"
    start_time = Column(String(20), nullable=False)  # "08:00"
    end_time = Column(String(20), nullable=False)  # "09:00"
    order_index = Column(Integer, nullable=False)  # 1, 2, 3...
    period_type = Column(String(50), default=PeriodType.TEACHING, nullable=False)  # Teaching, Break, Lunch, Free, Meeting, Other

    day = relationship("WorkingDay", back_populates="periods")
    timetable_entries = relationship("TimetableEntry", back_populates="period")
    teacher_availabilities = relationship("TeacherAvailability", back_populates="period", cascade="all, delete-orphan")

class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    semester_id = Column(Integer, ForeignKey("semesters.id", ondelete="CASCADE"), nullable=False)
    code = Column(String(50), nullable=False)  # e.g. "CACS101", "CSC109"
    name = Column(String(255), nullable=False)  # e.g. "Computer Graphics", "Web Technology"
    credit_hours = Column(Integer, default=3)
    weekly_periods = Column(Integer, default=4)  # Total weekly periods needed
    lecture_periods = Column(Integer, default=3)
    practical_periods = Column(Integer, default=1)
    required_room_type_id = Column(Integer, ForeignKey("room_types.id", ondelete="RESTRICT"), nullable=False)
    max_classes_per_day = Column(Integer, default=2)
    color_code = Column(String(20), default="#3B82F6")  # Hex color for UI representation

    semester = relationship("Semester", back_populates="subjects")
    required_room_type = relationship("RoomType", back_populates="subjects")
    eligible_teachers = relationship("Teacher", secondary=teacher_subjects, back_populates="eligible_subjects")
    timetable_entries = relationship("TimetableEntry", back_populates="subject")

class Teacher(Base):
    __tablename__ = "teachers"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(String(100), unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    phone = Column(String(50), nullable=True)
    designation = Column(String(100), default="Lecturer")  # Professor, Associate Professor, Assistant Professor, Lecturer
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="CASCADE"), nullable=False)
    max_hours_per_day = Column(Float, default=4.0)
    max_hours_per_week = Column(Float, default=18.0)
    min_hours_per_week = Column(Float, default=6.0)
    is_active = Column(Boolean, default=True)

    department = relationship("Department", back_populates="teachers")
    user = relationship("User", back_populates="teacher", uselist=False)
    eligible_subjects = relationship("Subject", secondary=teacher_subjects, back_populates="eligible_teachers")
    availabilities = relationship("TeacherAvailability", back_populates="teacher", cascade="all, delete-orphan")
    timetable_entries = relationship("TimetableEntry", back_populates="teacher")

class TeacherAvailability(Base):
    __tablename__ = "teacher_availabilities"

    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("teachers.id", ondelete="CASCADE"), nullable=False)
    period_id = Column(Integer, ForeignKey("periods.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(50), default=AvailabilityStatus.AVAILABLE, nullable=False)  # available, unavailable, preferred, restricted

    teacher = relationship("Teacher", back_populates="availabilities")
    period = relationship("Period", back_populates="teacher_availabilities")

    __table_args__ = (UniqueConstraint("teacher_id", "period_id", name="uq_teacher_period_availability"),)

class Timetable(Base):
    __tablename__ = "timetables"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    academic_year_id = Column(Integer, ForeignKey("academic_years.id", ondelete="CASCADE"), nullable=False)
    description = Column(Text, nullable=True)
    version = Column(Integer, default=1)
    is_published = Column(Boolean, default=False)
    score = Column(Float, default=100.0)
    conflict_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    academic_year = relationship("AcademicYear", back_populates="timetables")
    entries = relationship("TimetableEntry", back_populates="timetable", cascade="all, delete-orphan")
    generation_runs = relationship("GenerationRun", back_populates="timetable", cascade="all, delete-orphan")

class TimetableEntry(Base):
    __tablename__ = "timetable_entries"

    id = Column(Integer, primary_key=True, index=True)
    timetable_id = Column(Integer, ForeignKey("timetables.id", ondelete="CASCADE"), nullable=False)
    section_id = Column(Integer, ForeignKey("sections.id", ondelete="CASCADE"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    teacher_id = Column(Integer, ForeignKey("teachers.id", ondelete="CASCADE"), nullable=False)
    room_id = Column(Integer, ForeignKey("rooms.id", ondelete="CASCADE"), nullable=False)
    period_id = Column(Integer, ForeignKey("periods.id", ondelete="CASCADE"), nullable=False)
    is_locked = Column(Boolean, default=False)  # Lock during re-optimization
    explanation = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    timetable = relationship("Timetable", back_populates="entries")
    section = relationship("Section", back_populates="timetable_entries")
    subject = relationship("Subject", back_populates="timetable_entries")
    teacher = relationship("Teacher", back_populates="timetable_entries")
    room = relationship("Room", back_populates="timetable_entries")
    period = relationship("Period", back_populates="timetable_entries")

    __table_args__ = (
        # Ensure proper indexing for rapid schedule lookups
        UniqueConstraint("timetable_id", "section_id", "period_id", name="uq_timetable_section_period"),
    )

class GenerationRun(Base):
    __tablename__ = "generation_runs"

    id = Column(Integer, primary_key=True, index=True)
    timetable_id = Column(Integer, ForeignKey("timetables.id", ondelete="CASCADE"), nullable=False)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    execution_time_seconds = Column(Float, default=0.0)
    total_variables = Column(Integer, default=0)
    total_constraints = Column(Integer, default=0)
    solutions_found = Column(Integer, default=0)
    best_score = Column(Float, default=0.0)
    status = Column(String(50), default="COMPLETED")  # COMPLETED, FAILED, IN_PROGRESS
    summary_stats = Column(JSON, nullable=True)

    timetable = relationship("Timetable", back_populates="generation_runs")
    solutions = relationship("GenerationSolution", back_populates="generation_run", cascade="all, delete-orphan")

class GenerationSolution(Base):
    __tablename__ = "generation_solutions"

    id = Column(Integer, primary_key=True, index=True)
    generation_run_id = Column(Integer, ForeignKey("generation_runs.id", ondelete="CASCADE"), nullable=False)
    solution_index = Column(Integer, nullable=False)  # 1, 2, 3...
    score = Column(Float, nullable=False)
    penalties_breakdown = Column(JSON, nullable=True)
    entries_data = Column(JSON, nullable=False)  # Serialized entries for previewing candidate solutions
    created_at = Column(DateTime, default=datetime.utcnow)

    generation_run = relationship("GenerationRun", back_populates="solutions")

class SchedulingRuleWeight(Base):
    __tablename__ = "scheduling_rule_weights"

    id = Column(Integer, primary_key=True, index=True)
    rule_name = Column(String(100), unique=True, nullable=False)
    description = Column(String(255), nullable=True)
    weight = Column(Integer, default=5, nullable=False)  # 1 to 10
    is_enabled = Column(Boolean, default=True)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    user_email = Column(String(255), nullable=True)
    action = Column(String(100), nullable=False)  # GENERATE_ROUTINE, MOVE_CLASS, SWAP_CLASS, PUBLISH, UPDATE_AVAILABILITY
    entity_type = Column(String(100), nullable=True)
    entity_id = Column(Integer, nullable=True)
    details = Column(JSON, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)  # Null = Broadcast
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String(50), default="INFO")  # INFO, WARNING, SUCCESS, ROUTINE_UPDATE
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class SystemSetting(Base):
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), unique=True, index=True, nullable=False)
    value = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
