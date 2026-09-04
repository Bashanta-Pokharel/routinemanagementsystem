from typing import List, Dict, Tuple, Optional, Any
from copy import deepcopy
from app.scheduler.models import ScheduledLesson, ScheduleProblem
from app.scheduler.hard_constraints import validate_all_hard_constraints
from app.schemas.schemas import ValidationResult, ConflictItem

class TimetableValidator:
    """
    Dedicated Validator Engine.
    Used for complete timetable auditing, as well as real-time validation
    for drag-and-drop moves and swaps in the timetable editor.
    """
    def __init__(self, problem: ScheduleProblem):
        self.problem = problem

    def validate_full(self, lessons: List[ScheduledLesson]) -> ValidationResult:
        is_valid, raw_violations = validate_all_hard_constraints(lessons, self.problem)
        
        conflict_items: List[ConflictItem] = []
        counts = {
            "teacher": 0,
            "room": 0,
            "section": 0,
            "availability": 0,
            "capacity": 0,
            "workload": 0,
        }

        for v in raw_violations:
            v_type = v.get("type", "General Conflict")
            c_item = ConflictItem(
                conflict_type=v_type,
                severity=v.get("severity", "ERROR"),
                description=v.get("description", ""),
                details=v.get("details", {}),
                suggested_fix="Try moving this class to an empty teaching period with an available teacher and room."
            )
            conflict_items.append(c_item)
            
            if "Teacher" in v_type:
                counts["teacher"] += 1
            elif "Room" in v_type:
                counts["room"] += 1
            elif "Section" in v_type:
                counts["section"] += 1
            elif "Availability" in v_type:
                counts["availability"] += 1
            elif "Capacity" in v_type or "Room Type" in v_type:
                counts["capacity"] += 1
            elif "Workload" in v_type or "Daily Limit" in v_type:
                counts["workload"] += 1

        return ValidationResult(
            is_valid=is_valid,
            total_conflicts=len(conflict_items),
            conflicts=conflict_items,
            teacher_conflicts=counts["teacher"],
            room_conflicts=counts["room"],
            section_conflicts=counts["section"],
            availability_conflicts=counts["availability"],
            capacity_conflicts=counts["capacity"],
            workload_conflicts=counts["workload"]
        )

    def validate_move(
        self,
        current_lessons: List[ScheduledLesson],
        entry_idx: int,
        target_period_id: int,
        target_room_id: Optional[int] = None
    ) -> Tuple[bool, Optional[str], Optional[ValidationResult]]:
        """
        Simulates moving lesson at entry_idx to target_period_id and target_room_id.
        Returns (is_allowed, error_message, validation_result).
        """
        if entry_idx < 0 or entry_idx >= len(current_lessons):
            return False, "Target lesson entry not found.", None

        target_period = next((p for p in self.problem.periods if p.id == target_period_id), None)
        if not target_period:
            return False, f"Period ID {target_period_id} does not exist.", None
        
        if target_period.period_type != "Teaching":
            return False, f"Cannot move class into {target_period.name} ({target_period.period_type} period).", None

        # Create hypothetical copy
        simulated_lessons = deepcopy(current_lessons)
        moving_lesson = simulated_lessons[entry_idx]
        moving_lesson.period_id = target_period_id
        moving_lesson.day_id = target_period.day_id
        if target_room_id:
            moving_lesson.room_id = target_room_id

        val_result = self.validate_full(simulated_lessons)
        if not val_result.is_valid:
            # First conflict description as reason
            first_err = val_result.conflicts[0].description if val_result.conflicts else "Move causes a schedule conflict."
            return False, first_err, val_result

        return True, "Move allowed.", val_result

    def validate_swap(
        self,
        current_lessons: List[ScheduledLesson],
        entry_a_idx: int,
        entry_b_idx: int
    ) -> Tuple[bool, Optional[str], Optional[ValidationResult]]:
        """
        Simulates swapping two lessons in current_lessons.
        """
        if entry_a_idx < 0 or entry_a_idx >= len(current_lessons):
            return False, "First lesson entry not found.", None
        if entry_b_idx < 0 or entry_b_idx >= len(current_lessons):
            return False, "Second lesson entry not found.", None

        simulated_lessons = deepcopy(current_lessons)
        lesson_a = simulated_lessons[entry_a_idx]
        lesson_b = simulated_lessons[entry_b_idx]

        # Swap period and room
        temp_period_id = lesson_a.period_id
        temp_day_id = lesson_a.day_id
        temp_room_id = lesson_a.room_id

        lesson_a.period_id = lesson_b.period_id
        lesson_a.day_id = lesson_b.day_id
        lesson_a.room_id = lesson_b.room_id

        lesson_b.period_id = temp_period_id
        lesson_b.day_id = temp_day_id
        lesson_b.room_id = temp_room_id

        val_result = self.validate_full(simulated_lessons)
        if not val_result.is_valid:
            first_err = val_result.conflicts[0].description if val_result.conflicts else "Swap causes a schedule conflict."
            return False, first_err, val_result

        return True, "Swap allowed.", val_result
