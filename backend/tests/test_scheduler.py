import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.models.all_models import Base, AcademicYear
from app.api.seed import seed_database
from app.scheduler.input_parser import parse_schedule_problem
from app.scheduler.solver import TimetableSolver
from app.scheduler.validator import TimetableValidator
from app.scheduler.explainer import ScheduleExplainer
from app.schemas.schemas import GenerateTimetableRequest
from app.scheduler.generator import generate_routine

# Setup in-memory SQLite database for testing
@pytest.fixture
def db():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSessionLocal()
    seed_database(session)
    yield session
    session.close()

def test_parse_schedule_problem(db):
    problem = parse_schedule_problem(db)
    assert len(problem.days) == 6  # Sun - Fri
    assert len(problem.sections) >= 6  # BCA 1A, BCA 1B, BCA 3A, CSIT 1A, CSIT 4A, BBA 2A
    assert len(problem.teachers) >= 8
    assert len(problem.rooms) >= 8
    assert len(problem.subjects) >= 15
    assert len(problem.periods) > 20

def test_timetable_solver_and_hard_constraints(db):
    problem = parse_schedule_problem(db)
    solver = TimetableSolver(problem)
    solutions = solver.solve(num_solutions=3, time_limit_seconds=10)
    
    assert len(solutions) >= 1
    best_solution = solutions[0]
    assert best_solution.is_feasible is True
    assert best_solution.total_conflicts == 0
    assert best_solution.score > 70.0
    assert len(best_solution.lessons) > 0

    # Validate using validator
    validator = TimetableValidator(problem)
    val_res = validator.validate_full(best_solution.lessons)
    assert val_res.is_valid is True
    assert val_res.total_conflicts == 0
    assert val_res.teacher_conflicts == 0
    assert val_res.room_conflicts == 0
    assert val_res.section_conflicts == 0

def test_generate_routine_workflow(db):
    ay = db.query(AcademicYear).first()
    assert ay is not None
    
    req = GenerateTimetableRequest(
        academic_year_id=ay.id,
        name="Test Routine 2026",
        num_solutions=3
    )
    result = generate_routine(db, req)
    
    assert "timetable_id" in result
    assert result["solutions_found"] >= 1
    assert result["conflict_count"] == 0
    assert result["best_score"] > 70.0

def test_drag_and_drop_validator(db):
    problem = parse_schedule_problem(db)
    solver = TimetableSolver(problem)
    solutions = solver.solve(num_solutions=1)
    lessons = solutions[0].lessons
    assert len(lessons) > 2

    validator = TimetableValidator(problem)

    # Test moving to non-teaching period (e.g. Break) - should fail
    break_period = next((p for p in problem.periods if p.period_type == "Break"), None)
    if break_period:
        is_allowed, msg, _ = validator.validate_move(lessons, 0, break_period.id)
        assert is_allowed is False
        assert "Break" in msg or "non-teaching" in msg.lower()

def test_schedule_explainer(db):
    problem = parse_schedule_problem(db)
    solver = TimetableSolver(problem)
    solutions = solver.solve(num_solutions=1)
    lesson = solutions[0].lessons[0]

    explainer = ScheduleExplainer(problem)
    exp = explainer.explain_lesson(lesson)
    assert "reasons" in exp
    assert len(exp["reasons"]) >= 3
    assert exp["teacher_name"] != ""
