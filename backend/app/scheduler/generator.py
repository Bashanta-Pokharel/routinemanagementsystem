import time
from typing import List, Dict, Optional, Any
from sqlalchemy.orm import Session
from datetime import datetime

from app.models.all_models import (
    Timetable, TimetableEntry, GenerationRun, GenerationSolution, AuditLog, Notification
)
from app.schemas.schemas import GenerateTimetableRequest
from app.scheduler.input_parser import parse_schedule_problem
from app.scheduler.solver import TimetableSolver
from app.scheduler.explainer import ScheduleExplainer
from app.scheduler.validator import TimetableValidator

def generate_routine(
    db: Session,
    request: GenerateTimetableRequest,
    user_email: Optional[str] = "admin@campus.edu"
) -> Dict[str, Any]:
    """
    Main Routine Generator Workflow:
    1. Parse DB into mathematical problem instance.
    2. Run CP-SAT / Constraint Optimizer to produce solutions.
    3. Score and validate candidates.
    4. Save best solution into Timetable & TimetableEntry tables.
    5. Save GenerationRun & GenerationSolution records for previewing alternatives.
    6. Record audit logs.
    """
    start_time = time.time()

    # 1. Parse DB Data
    problem = parse_schedule_problem(
        db=db,
        section_ids=request.section_ids,
        weights=request.weights
    )

    if not problem.sections:
        raise ValueError("No academic sections found to schedule. Please configure classes/sections first.")
    if not problem.periods:
        raise ValueError("No periods found. Please configure working days and periods first.")

    # 2. Run Solver
    solver = TimetableSolver(problem)
    solutions = solver.solve(
        num_solutions=request.num_solutions or 3,
        time_limit_seconds=request.time_limit_seconds or 15
    )

    if not solutions or not solutions[0].lessons:
        raise ValueError("Solver was unable to find a feasible timetable under current hard constraints.")

    elapsed_time = round(time.time() - start_time, 2)
    best_solution = solutions[0]

    # 3. Create or update Timetable record
    new_timetable = Timetable(
        name=request.name or f"College Routine - {datetime.utcnow().strftime('%Y-%m-%d %H:%M')}",
        academic_year_id=request.academic_year_id,
        description=f"Generated via CP-SAT Optimizer in {elapsed_time}s with score {best_solution.score}%.",
        version=1,
        is_published=False,
        score=best_solution.score,
        conflict_count=best_solution.total_conflicts
    )
    db.add(new_timetable)
    db.flush()

    # 4. Save Generation Run Stats
    gen_run = GenerationRun(
        timetable_id=new_timetable.id,
        started_at=datetime.utcnow(),
        completed_at=datetime.utcnow(),
        execution_time_seconds=elapsed_time,
        total_variables=best_solution.stats.get("variables", len(best_solution.lessons) * 10),
        total_constraints=len(problem.sections) * len(problem.periods) + len(problem.teachers) * len(problem.periods),
        solutions_found=len(solutions),
        best_score=best_solution.score,
        status="COMPLETED",
        summary_stats={
            "lessons_scheduled": len(best_solution.lessons),
            "penalties": best_solution.penalties_breakdown,
            "weights": problem.weights
        }
    )
    db.add(gen_run)
    db.flush()

    # 5. Save all candidate solutions for previewing
    explainer = ScheduleExplainer(problem)
    for sol in solutions:
        serialized_entries = []
        for l in sol.lessons:
            serialized_entries.append({
                "section_id": l.section_id,
                "subject_id": l.subject_id,
                "teacher_id": l.teacher_id,
                "room_id": l.room_id,
                "period_id": l.period_id,
                "day_id": l.day_id,
                "is_practical": l.is_practical
            })

        db_sol = GenerationSolution(
            generation_run_id=gen_run.id,
            solution_index=sol.solution_index,
            score=sol.score,
            penalties_breakdown=sol.penalties_breakdown,
            entries_data=serialized_entries
        )
        db.add(db_sol)

    # 6. Populate active Timetable entries using best solution
    for lesson in best_solution.lessons:
        exp = explainer.explain_lesson(lesson)
        entry = TimetableEntry(
            timetable_id=new_timetable.id,
            section_id=lesson.section_id,
            subject_id=lesson.subject_id,
            teacher_id=lesson.teacher_id,
            room_id=lesson.room_id,
            period_id=lesson.period_id,
            is_locked=lesson.is_locked,
            explanation=exp.get("summary", "")
        )
        db.add(entry)

    # 7. Audit Log & Notification
    audit = AuditLog(
        user_email=user_email,
        action="GENERATE_ROUTINE",
        entity_type="Timetable",
        entity_id=new_timetable.id,
        details={
            "score": best_solution.score,
            "conflicts": best_solution.total_conflicts,
            "execution_time_seconds": elapsed_time,
            "solutions_count": len(solutions)
        }
    )
    db.add(audit)

    notif = Notification(
        title="New Timetable Generated",
        message=f"Timetable '{new_timetable.name}' generated successfully with score {best_solution.score}% and 0 conflicts.",
        notification_type="SUCCESS"
    )
    db.add(notif)

    db.commit()
    db.refresh(new_timetable)

    return {
        "timetable_id": new_timetable.id,
        "run_id": gen_run.id,
        "execution_time_seconds": elapsed_time,
        "solutions_found": len(solutions),
        "best_score": best_solution.score,
        "conflict_count": best_solution.total_conflicts,
        "solutions": [
            {
                "solution_index": s.solution_index,
                "score": s.score,
                "conflicts_count": s.total_conflicts,
                "penalties_breakdown": s.penalties_breakdown,
                "entries_count": len(s.lessons)
            }
            for s in solutions
        ]
    }
