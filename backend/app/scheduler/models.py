from dataclasses import dataclass, field
from typing import List, Dict, Set, Optional, Any

@dataclass
class ProblemDay:
    id: int
    name: str
    short_code: str
    order_index: int
    is_active: bool = True

@dataclass
class ProblemPeriod:
    id: int
    day_id: int
    name: str
    start_time: str
    end_time: str
    order_index: int
    period_type: str = "Teaching"  # Teaching, Break, Lunch, Free, Meeting, Other

@dataclass
class ProblemRoom:
    id: int
    room_number: str
    room_type_id: int
    room_type_name: str
    capacity: int
    building: str = "Main Block"
    is_active: bool = True

@dataclass
class ProblemSubject:
    id: int
    semester_id: int
    code: str
    name: str
    credit_hours: int
    weekly_periods: int
    lecture_periods: int
    practical_periods: int
    required_room_type_id: int
    max_classes_per_day: int = 2
    color_code: str = "#3B82F6"
    eligible_teacher_ids: List[int] = field(default_factory=list)

@dataclass
class ProblemTeacher:
    id: int
    employee_id: str
    name: str
    email: str
    designation: str
    department_id: int
    max_hours_per_day: float = 4.0
    max_hours_per_week: float = 18.0
    min_hours_per_week: float = 6.0
    eligible_subject_ids: List[int] = field(default_factory=list)
    # Map of period_id -> status ('available', 'unavailable', 'preferred', 'restricted')
    availability_map: Dict[int, str] = field(default_factory=dict)

@dataclass
class ProblemSection:
    id: int
    semester_id: int
    program_name: str
    semester_name: str
    name: str
    student_count: int
    subject_ids: List[int] = field(default_factory=list)

@dataclass
class ScheduledLesson:
    section_id: int
    subject_id: int
    teacher_id: int
    room_id: int
    period_id: int
    day_id: int
    is_practical: bool = False
    is_locked: bool = False
    explanation: Optional[str] = None

@dataclass
class ScheduleSolution:
    solution_index: int
    lessons: List[ScheduledLesson]
    score: float
    is_feasible: bool
    total_conflicts: int
    penalties_breakdown: Dict[str, Any] = field(default_factory=dict)
    stats: Dict[str, Any] = field(default_factory=dict)

@dataclass
class ScheduleProblem:
    days: List[ProblemDay]
    periods: List[ProblemPeriod]
    rooms: List[ProblemRoom]
    subjects: List[ProblemSubject]
    teachers: List[ProblemTeacher]
    sections: List[ProblemSection]
    weights: Dict[str, int] = field(default_factory=lambda: {
        "teacher_preference": 5,
        "consecutive_classes": 4,
        "idle_gaps": 4,
        "subject_distribution": 6,
        "room_stability": 2
    })
    locked_lessons: List[ScheduledLesson] = field(default_factory=list)
