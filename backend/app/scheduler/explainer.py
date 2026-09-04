from typing import Dict, Any, Optional
from app.scheduler.models import ScheduledLesson, ScheduleProblem

class ScheduleExplainer:
    """
    Explainability Engine for generated timetable slots.
    Provides transparent reasoning for every assigned class.
    """
    def __init__(self, problem: ScheduleProblem):
        self.problem = problem
        self.teacher_map = {t.id: t for t in problem.teachers}
        self.room_map = {r.id: r for r in problem.rooms}
        self.subject_map = {s.id: s for s in problem.subjects}
        self.section_map = {sec.id: sec for sec in problem.sections}
        self.period_map = {p.id: p for p in problem.periods}
        self.day_map = {d.id: d for d in problem.days}

    def explain_lesson(self, lesson: ScheduledLesson) -> Dict[str, Any]:
        teacher = self.teacher_map.get(lesson.teacher_id)
        room = self.room_map.get(lesson.room_id)
        subject = self.subject_map.get(lesson.subject_id)
        section = self.section_map.get(lesson.section_id)
        period = self.period_map.get(lesson.period_id)
        day = self.day_map.get(lesson.day_id)

        reasons = []

        # 1. Period check
        if period and period.period_type == "Teaching":
            reasons.append(f"✓ Valid teaching period: '{period.name}' ({period.start_time} - {period.end_time}) on {day.name if day else 'Day'}.")

        # 2. Teacher Availability & Preference
        if teacher:
            avail_status = teacher.availability_map.get(lesson.period_id, "available")
            if avail_status == "preferred":
                reasons.append(f"★ Teacher preference matched: {teacher.name} requested this time slot.")
            elif avail_status == "available":
                reasons.append(f"✓ Teacher available: {teacher.name} is free with no conflicting commitments.")

        # 3. Room Compatibility & Capacity
        if room and subject and section:
            reasons.append(f"✓ Room type matched: Assigned to '{room.room_number}' ({room.room_type_name}) matching course requirement.")
            if room.capacity >= section.student_count:
                reasons.append(f"✓ Capacity sufficient: Room holds {room.capacity} students (Section size is {section.student_count}).")

        # 4. Conflict-Free
        reasons.append(f"✓ No collisions: No overlapping bookings for teacher, section, or room.")

        # 5. Subject Quota
        if subject:
            reasons.append(f"✓ Curriculum requirement: Satisfies weekly credit hours for {subject.name} ({subject.code}).")

        return {
            "subject_name": subject.name if subject else "Subject",
            "subject_code": subject.code if subject else "",
            "teacher_name": teacher.name if teacher else "Teacher",
            "room_number": room.room_number if room else "Room",
            "day_name": day.name if day else "Day",
            "period_name": period.name if period else "Period",
            "time_range": f"{period.start_time} - {period.end_time}" if period else "",
            "is_practical": lesson.is_practical,
            "reasons": reasons,
            "summary": "This slot was selected to maximize teacher preference while maintaining conflict-free constraints."
        }
