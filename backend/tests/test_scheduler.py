import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.models.all_models import Base, AcademicYear, Semester, Section, Subject, Teacher, Room, RoomType, Period, WorkingDay, Department
from app.api.seed import setup_clean_bca_structure
from app.scheduler.input_parser import parse_schedule_problem
from app.scheduler.solver import TimetableSolver
from app.scheduler.validator import TimetableValidator
from app.scheduler.explainer import ScheduleExplainer
from app.schemas.schemas import GenerateTimetableRequest
from app.scheduler.generator import generate_routine

def seed_scheduler_test_data(db):
    setup_clean_bca_structure(db)
    dept = db.query(Department).first()
    sem1 = db.query(Semester).filter(Semester.semester_number == 1).first()
    rt = db.query(RoomType).first()
    
    # Add teachers
    t1 = Teacher(employee_id="T001", name="Bashanta", email="b@campus.edu", department_id=dept.id, max_hours_per_day=4.0, max_hours_per_week=20.0)
    t2 = Teacher(employee_id="T002", name="Sita", email="s@campus.edu", department_id=dept.id, max_hours_per_day=4.0, max_hours_per_week=20.0)
    db.add_all([t1, t2])
    db.flush()

    # Add subjects
    s1 = Subject(code="CACS101", name="C Programming", semester_id=sem1.id, required_room_type_id=rt.id, weekly_periods=4, eligible_teachers=[t1])
    s2 = Subject(code="CACS102", name="Mathematics I", semester_id=sem1.id, required_room_type_id=rt.id, weekly_periods=4, eligible_teachers=[t2])
    db.add_all([s1, s2])
    db.commit()

@pytest.fixture
def db():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSessionLocal()
    seed_scheduler_test_data(session)
    yield session
    session.close()

def test_parse_schedule_problem(db):
    problem = parse_schedule_problem(db)
    assert len(problem.days) == 6
    assert len(problem.sections) >= 8
    assert len(problem.teachers) >= 2
    assert len(problem.rooms) >= 6
    assert len(problem.subjects) >= 2

def test_timetable_solver_and_hard_constraints(db):
    problem = parse_schedule_problem(db)
    solver = TimetableSolver(problem)
    solutions = solver.solve(num_solutions=1, time_limit_seconds=5)
    
    assert len(solutions) >= 1
    best_solution = solutions[0]
    assert best_solution.is_feasible is True
    assert best_solution.total_conflicts == 0
    assert len(best_solution.lessons) > 0

    validator = TimetableValidator(problem)
    val_res = validator.validate_full(best_solution.lessons)
    assert val_res.is_valid is True
    assert val_res.total_conflicts == 0

def test_generate_routine_workflow(db):
    ay = db.query(AcademicYear).first()
    assert ay is not None
    
    req = GenerateTimetableRequest(
        academic_year_id=ay.id,
        name="Test Routine 2026",
        num_solutions=1
    )
    result = generate_routine(db, req)
    
    assert "timetable_id" in result
    assert result["solutions_found"] >= 1
    assert result["conflict_count"] == 0

def test_schedule_explainer(db):
    problem = parse_schedule_problem(db)
    solver = TimetableSolver(problem)
    solutions = solver.solve(num_solutions=1)
    lesson = solutions[0].lessons[0]

    explainer = ScheduleExplainer(problem)
    exp = explainer.explain_lesson(lesson)
    assert "reasons" in exp
    assert len(exp["reasons"]) >= 1
