from typing import List, Dict, Tuple, Any
from collections import defaultdict
from app.scheduler.models import (
    ScheduledLesson, ScheduleProblem
)

def evaluate_soft_constraints(
    lessons: List[ScheduledLesson],
    problem: ScheduleProblem
) -> Tuple[float, Dict[str, Any]]:
    """
    Computes soft constraint penalty values and overall score (0 - 100%).
    Weights are configurable dynamically.
    """
    weights = problem.weights
    w_pref = weights.get("teacher_preference", 5)
    w_consec = weights.get("consecutive_classes", 4)
    w_gaps = weights.get("idle_gaps", 4)
    w_dist = weights.get("subject_distribution", 6)
    w_room = weights.get("room_stability", 2)

    teacher_map = {t.id: t for t in problem.teachers}
    period_map = {p.id: p for p in problem.periods}
    day_periods = defaultdict(list)
    for p in problem.periods:
        if p.period_type == "Teaching":
            day_periods[p.day_id].append(p)
    for d_id in day_periods:
        day_periods[d_id].sort(key=lambda p: p.order_index)

    penalties = {
        "teacher_preference_penalty": 0,
        "teacher_preference_matches": 0,
        "consecutive_penalty": 0,
        "idle_gaps_penalty": 0,
        "distribution_penalty": 0,
        "room_hopping_penalty": 0,
    }

    # 1. Teacher Preference
    for l in lessons:
        t = teacher_map.get(l.teacher_id)
        if t:
            status = t.availability_map.get(l.period_id, "available")
            if status == "preferred":
                penalties["teacher_preference_matches"] += 1
            elif status != "preferred":
                # If teacher has other preferred slots available that weren't used
                has_prefs = any(s == "preferred" for s in t.availability_map.values())
                if has_prefs:
                    penalties["teacher_preference_penalty"] += 1 * w_pref

    # 2. Consecutive Classes & Idle Gaps per Day for Teachers & Sections
    # Group lessons by (entity, day_id) -> list of ordered period indices
    teacher_day_periods = defaultdict(list)
    section_day_periods = defaultdict(list)
    section_day_rooms = defaultdict(list)
    sec_sub_days = defaultdict(set)  # (section_id, subject_id) -> set of day_ids

    for l in lessons:
        p = period_map.get(l.period_id)
        if p:
            teacher_day_periods[(l.teacher_id, l.day_id)].append(p.order_index)
            section_day_periods[(l.section_id, l.day_id)].append(p.order_index)
            section_day_rooms[(l.section_id, l.day_id)].append((p.order_index, l.room_id))
            sec_sub_days[(l.section_id, l.subject_id)].add(l.day_id)

    # Check Consecutive > 3 and Gaps for Teachers
    for (t_id, d_id), order_indices in teacher_day_periods.items():
        sorted_indices = sorted(order_indices)
        # Consecutive run check
        run = 1
        for i in range(1, len(sorted_indices)):
            if sorted_indices[i] == sorted_indices[i-1] + 1:
                run += 1
                if run > 3:
                    penalties["consecutive_penalty"] += (run - 3) * w_consec
            else:
                # Hole / gap between classes
                gap = sorted_indices[i] - sorted_indices[i-1] - 1
                if gap > 0:
                    penalties["idle_gaps_penalty"] += gap * w_gaps
                run = 1

    # Check Consecutive > 4 and Gaps for Sections
    for (sec_id, d_id), order_indices in section_day_periods.items():
        sorted_indices = sorted(order_indices)
        run = 1
        for i in range(1, len(sorted_indices)):
            if sorted_indices[i] == sorted_indices[i-1] + 1:
                run += 1
                if run > 4:
                    penalties["consecutive_penalty"] += (run - 4) * w_consec
            else:
                gap = sorted_indices[i] - sorted_indices[i-1] - 1
                if gap > 0:
                    penalties["idle_gaps_penalty"] += gap * w_gaps
                run = 1

    # 3. Subject Distribution across Days
    # Ideal: if subject has N periods, it should ideally be spread across min(N, total_active_days) days
    total_active_days = len(problem.days)
    for (sec_id, sub_id), distinct_days in sec_sub_days.items():
        total_sub_lessons = sum(1 for l in lessons if l.section_id == sec_id and l.subject_id == sub_id)
        ideal_days = min(total_sub_lessons, total_active_days)
        actual_days = len(distinct_days)
        if actual_days < ideal_days:
            penalties["distribution_penalty"] += (ideal_days - actual_days) * w_dist

    # 4. Room Hopping for Sections on same day
    for (sec_id, d_id), room_tuples in section_day_rooms.items():
        sorted_rooms = [r_id for _, r_id in sorted(room_tuples, key=lambda x: x[0])]
        for i in range(1, len(sorted_rooms)):
            if sorted_rooms[i] != sorted_rooms[i-1]:
                penalties["room_hopping_penalty"] += 1 * w_room

    total_penalty = (
        penalties["teacher_preference_penalty"]
        + penalties["consecutive_penalty"]
        + penalties["idle_gaps_penalty"]
        + penalties["distribution_penalty"]
        + penalties["room_hopping_penalty"]
    )

    # Convert total penalty to percentage score (0 - 100%)
    # Base theoretical max penalty scale
    lesson_count = max(len(lessons), 1)
    max_scale = lesson_count * 15.0
    normalized_penalty_ratio = min(total_penalty / max_scale, 1.0)
    score = round(max(0.0, 100.0 - (normalized_penalty_ratio * 100.0)), 1)

    penalties["total_penalty"] = total_penalty
    penalties["score"] = score
    return score, penalties
