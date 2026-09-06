import io
import re
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from reportlab.lib.pagesizes import letter, landscape
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

from app.core.database import get_db
from app.models.all_models import (
    Timetable, TimetableEntry, GenerationRun, GenerationSolution, Subject, Teacher, Room, Section, Period, WorkingDay, AuditLog, Notification, Campus
)
from app.schemas.schemas import (
    TimetableResponse, TimetableEntryResponse, GenerateTimetableRequest,
    MoveClassRequest, SwapClassRequest, ValidationResult, GenerationRunResponse
)
from app.scheduler.input_parser import parse_schedule_problem
from app.scheduler.generator import generate_routine
from app.scheduler.validator import TimetableValidator
from app.scheduler.explainer import ScheduleExplainer
from app.scheduler.models import ScheduledLesson
from app.scheduler.bca_multi_semester import get_teacher_abbreviation

router = APIRouter(prefix="/timetable", tags=["Timetable & Scheduling"])

@router.get("", response_model=List[TimetableResponse])
def get_timetables(db: Session = Depends(get_db)):
    timetables = db.query(Timetable).order_by(Timetable.id.desc()).all()
    res = []
    for tt in timetables:
        resp = TimetableResponse.from_orm(tt)
        resp.academic_year_name = tt.academic_year.name if tt.academic_year else None
        res.append(resp)
    return res

@router.get("/{id}", response_model=TimetableResponse)
def get_timetable(id: int, db: Session = Depends(get_db)):
    tt = db.query(Timetable).filter(Timetable.id == id).first()
    if not tt:
        raise HTTPException(status_code=404, detail="Timetable not found")

    resp = TimetableResponse.from_orm(tt)
    resp.academic_year_name = tt.academic_year.name if tt.academic_year else None
    
    campus_entity = db.query(Campus).first()
    resp.campus_name = campus_entity.name if campus_entity else "Ratna Rajyalaxmi Campus"
    resp.address = campus_entity.address if campus_entity else "Pradarshanimarga, Kathmandu Nepal"

    # Distinct periods for this specific routine
    tt_period_ids = {e.period_id for e in tt.entries if e.period_id}
    tt_periods = db.query(Period).filter(Period.id.in_(tt_period_ids)).all() if tt_period_ids else []
    
    tt_day_ids = {p.day_id for p in tt_periods if p.day_id}
    break_periods = db.query(Period).filter(Period.day_id.in_(tt_day_ids), Period.period_type != "Teaching").all() if tt_day_ids else []
    
    candidate_periods = tt_periods + break_periods
    if not candidate_periods:
        candidate_periods = db.query(Period).order_by(Period.day_id, Period.order_index).all()

    distinct_periods = []
    seen_period_keys = set()
    for p in sorted(candidate_periods, key=lambda x: x.order_index):
        key = (p.name, p.start_time, p.end_time)
        if key not in seen_period_keys:
            seen_period_keys.add(key)
            distinct_periods.append({
                "id": p.id,
                "name": p.name,
                "start_time": p.start_time,
                "end_time": p.end_time,
                "order_index": p.order_index,
                "period_type": p.period_type
            })
    resp.periods = distinct_periods

    entries_res = []
    for e in tt.entries:
        entry_resp = TimetableEntryResponse.from_orm(e)
        entry_resp.section_name = e.section.name if e.section else None
        entry_resp.program_name = e.section.semester.program.name if (e.section and e.section.semester and e.section.semester.program) else None
        entry_resp.semester_name = e.section.semester.name if (e.section and e.section.semester) else None
        entry_resp.semester_number = e.section.semester.semester_number if (e.section and e.section.semester) else None
        entry_resp.subject_name = e.subject.name if e.subject else None
        entry_resp.subject_code = e.subject.code if e.subject else None
        entry_resp.subject_color = e.subject.color_code if e.subject else "#3B82F6"
        entry_resp.teacher_name = e.teacher.name if e.teacher else None
        entry_resp.teacher_designation = e.teacher.designation if e.teacher else None
        entry_resp.teacher_contact = e.teacher.phone if e.teacher else None
        entry_resp.teacher_abbreviation = get_teacher_abbreviation(e.teacher.name) if e.teacher else "TCH"
        entry_resp.room_number = e.room.room_number if e.room else None
        entry_resp.room_type_name = e.room.room_type.name if (e.room and e.room.room_type) else None
        
        # Course type
        sub_n = (e.subject.name or "").lower() if e.subject else ""
        rm_n = (e.room.room_number or "").lower() if e.room else ""
        if "lab" in sub_n or "practical" in sub_n or "lab" in rm_n:
            entry_resp.course_type = "PR"
        else:
            entry_resp.course_type = "TH"

        if e.period:
            entry_resp.period_name = e.period.name
            entry_resp.start_time = e.period.start_time
            entry_resp.end_time = e.period.end_time
            entry_resp.period_type = e.period.period_type
            entry_resp.order_index = e.period.order_index
            if e.period.day:
                entry_resp.day_id = e.period.day.id
                entry_resp.day_name = e.period.day.name
                entry_resp.day_short_code = e.period.day.short_code

        entries_res.append(entry_resp)

    resp.entries = entries_res
    return resp

@router.post("/generate")
def generate_timetable_api(request: GenerateTimetableRequest, db: Session = Depends(get_db)):
    try:
        result = generate_routine(db=db, request=request)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

from pydantic import BaseModel
from typing import List, Optional

class SimpleSubjectInput(BaseModel):
    name: str
    weekly_periods: int = 4
    teacher_name: str
    free_time_start: str = "08:00 AM"
    free_time_end: str = "04:00 PM"
    free_days: Optional[List[str]] = None

class SimplePeriodInput(BaseModel):
    name: str
    start_time: str
    end_time: str
    type: str = "Teaching"

class QuickWizardRequest(BaseModel):
    class_name: str = "BCA 1st Sem"
    routine_title: Optional[str] = None
    days: List[str] = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    periods: List[SimplePeriodInput]
    subjects: List[SimpleSubjectInput]
    day_period_counts: Optional[Dict[str, int]] = None
    day_periods: Optional[Dict[str, List[SimplePeriodInput]]] = None

@router.post("/quick-wizard")
def quick_wizard_api(req: QuickWizardRequest, db: Session = Depends(get_db)):
    from app.scheduler.simple_wizard import generate_simple_wizard_routine
    try:
        periods_dict = [p.dict() for p in req.periods]
        subjects_dict = [s.dict() for s in req.subjects]
        for s in subjects_dict:
            if not s.get("free_days"):
                s["free_days"] = req.days

        day_periods_dict = None
        if req.day_periods:
            day_periods_dict = {
                d: [p.dict() for p in plist] for d, plist in req.day_periods.items()
            }

        res = generate_simple_wizard_routine(
            db=db,
            class_name=req.class_name,
            days_list=req.days,
            periods_list=periods_dict,
            subjects_list=subjects_dict,
            routine_title=req.routine_title,
            day_periods=day_periods_dict,
            day_period_counts=req.day_period_counts
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

class BCATeacherInput(BaseModel):
    name: str
    abbreviation: Optional[str] = None
    contact: Optional[str] = None
    phone: Optional[str] = None
    speciality: str = "Computer Science"
    free_time_start: str = "08:00 AM"
    free_time_end: str = "04:00 PM"
    free_days: Optional[List[str]] = None
    max_classes_per_day: int = 4

class BCASubjectInput(BaseModel):
    name: str
    code: Optional[str] = None
    weekly_periods: int = 4
    teacher_name: str
    course_type: Optional[str] = "TH"

class BCASemesterInput(BaseModel):
    semester_number: int
    semester_name: str = "BCA Semester 1"
    section_name: str = "BCA 1st Sem"
    room_name: str = "Room 101"
    subjects: List[BCASubjectInput]

class BCAMultiSemesterRequest(BaseModel):
    routine_title: Optional[str] = None
    campus_name: Optional[str] = None
    address: Optional[str] = None
    days: List[str] = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    periods: List[SimplePeriodInput]
    day_period_counts: Optional[Dict[str, int]] = None
    teachers: List[BCATeacherInput]
    running_semesters: List[BCASemesterInput]

@router.post("/bca-routine")
def generate_bca_routine_api(req: BCAMultiSemesterRequest, db: Session = Depends(get_db)):
    from app.scheduler.bca_multi_semester import generate_bca_multi_semester_routine
    try:
        teachers_dict = [t.model_dump() if hasattr(t, 'model_dump') else t.dict() for t in req.teachers]
        for t in teachers_dict:
            if not t.get("free_days"):
                t["free_days"] = req.days

        semesters_dict = [
            {
                "semester_number": s.semester_number,
                "semester_name": s.semester_name,
                "section_name": s.section_name,
                "room_name": s.room_name,
                "subjects": [sub.model_dump() if hasattr(sub, 'model_dump') else sub.dict() for sub in s.subjects]
            }
            for s in req.running_semesters
        ]

        periods_dict = [p.model_dump() if hasattr(p, 'model_dump') else p.dict() for p in req.periods]

        result = generate_bca_multi_semester_routine(
            db=db,
            running_semesters=semesters_dict,
            teachers_list=teachers_dict,
            days_list=req.days,
            periods_list=periods_dict,
            day_period_counts=req.day_period_counts,
            routine_title=req.routine_title,
            campus_name=req.campus_name,
            address=req.address
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/validate", response_model=ValidationResult)
def validate_timetable_api(timetable_id: int, db: Session = Depends(get_db)):
    tt = db.query(Timetable).filter(Timetable.id == timetable_id).first()
    if not tt:
        raise HTTPException(status_code=404, detail="Timetable not found")

    problem = parse_schedule_problem(db=db)
    validator = TimetableValidator(problem)

    lessons = [
        ScheduledLesson(
            section_id=e.section_id,
            subject_id=e.subject_id,
            teacher_id=e.teacher_id,
            room_id=e.room_id,
            period_id=e.period_id,
            day_id=e.period.day_id if e.period else 1,
            is_locked=e.is_locked
        )
        for e in tt.entries
    ]

    val_res = validator.validate_full(lessons)
    # Update conflict count in timetable
    tt.conflict_count = val_res.total_conflicts
    db.commit()
    return val_res

@router.post("/move")
def move_class_slot(req: MoveClassRequest, db: Session = Depends(get_db)):
    entry = db.query(TimetableEntry).filter(
        TimetableEntry.id == req.entry_id,
        TimetableEntry.timetable_id == req.timetable_id
    ).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Timetable entry not found")

    target_period = db.query(Period).filter(Period.id == req.target_period_id).first()
    if not target_period:
        raise HTTPException(status_code=404, detail="Target period not found")

    target_room_id = req.target_room_id or entry.room_id

    # Build lessons list to simulate
    problem = parse_schedule_problem(db=db)
    validator = TimetableValidator(problem)

    tt = db.query(Timetable).filter(Timetable.id == req.timetable_id).first()
    entries = list(tt.entries)
    entry_idx = next((i for i, e in enumerate(entries) if e.id == req.entry_id), -1)

    lessons = [
        ScheduledLesson(
            section_id=e.section_id,
            subject_id=e.subject_id,
            teacher_id=e.teacher_id,
            room_id=e.room_id,
            period_id=e.period_id,
            day_id=e.period.day_id if e.period else 1
        )
        for e in entries
    ]

    is_allowed, msg, val_res = validator.validate_move(
        lessons, entry_idx, req.target_period_id, target_room_id
    )

    if not is_allowed:
        raise HTTPException(status_code=400, detail=f"Move not allowed: {msg}")

    # Apply move
    old_p_name = entry.period.name if entry.period else ""
    entry.period_id = req.target_period_id
    entry.room_id = target_room_id
    tt.updated_at = db.query(Timetable).filter(Timetable.id == req.timetable_id).first().updated_at
    
    # Audit log
    audit = AuditLog(
        action="MOVE_CLASS",
        entity_type="TimetableEntry",
        entity_id=entry.id,
        details={
            "subject": entry.subject.name if entry.subject else "",
            "old_period": old_p_name,
            "new_period": target_period.name,
            "new_day": target_period.day.name if target_period.day else ""
        }
    )
    db.add(audit)
    db.commit()

    return {"status": "success", "message": "Class moved successfully", "validation": val_res}

@router.post("/swap")
def swap_class_slots(req: SwapClassRequest, db: Session = Depends(get_db)):
    entry_a = db.query(TimetableEntry).filter(
        TimetableEntry.id == req.entry_a_id,
        TimetableEntry.timetable_id == req.timetable_id
    ).first()
    entry_b = db.query(TimetableEntry).filter(
        TimetableEntry.id == req.entry_b_id,
        TimetableEntry.timetable_id == req.timetable_id
    ).first()

    if not entry_a or not entry_b:
        raise HTTPException(status_code=404, detail="One or both timetable entries not found")

    problem = parse_schedule_problem(db=db)
    validator = TimetableValidator(problem)

    tt = db.query(Timetable).filter(Timetable.id == req.timetable_id).first()
    entries = list(tt.entries)
    idx_a = next((i for i, e in enumerate(entries) if e.id == req.entry_a_id), -1)
    idx_b = next((i for i, e in enumerate(entries) if e.id == req.entry_b_id), -1)

    lessons = [
        ScheduledLesson(
            section_id=e.section_id,
            subject_id=e.subject_id,
            teacher_id=e.teacher_id,
            room_id=e.room_id,
            period_id=e.period_id,
            day_id=e.period.day_id if e.period else 1
        )
        for e in entries
    ]

    is_allowed, msg, val_res = validator.validate_swap(lessons, idx_a, idx_b)

    if not is_allowed:
        raise HTTPException(status_code=400, detail=f"Swap not allowed: {msg}")

    # Apply swap
    p_a = entry_a.period_id
    r_a = entry_a.room_id
    entry_a.period_id = entry_b.period_id
    entry_a.room_id = entry_b.room_id
    entry_b.period_id = p_a
    entry_b.room_id = r_a

    db.commit()
    return {"status": "success", "message": "Classes swapped successfully"}

@router.get("/{id}/explain/{entry_id}")
def explain_entry(id: int, entry_id: int, db: Session = Depends(get_db)):
    entry = db.query(TimetableEntry).filter(
        TimetableEntry.id == entry_id,
        TimetableEntry.timetable_id == id
    ).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Timetable entry not found")

    problem = parse_schedule_problem(db=db)
    explainer = ScheduleExplainer(problem)

    lesson = ScheduledLesson(
        section_id=entry.section_id,
        subject_id=entry.subject_id,
        teacher_id=entry.teacher_id,
        room_id=entry.room_id,
        period_id=entry.period_id,
        day_id=entry.period.day_id if entry.period else 1
    )

    explanation = explainer.explain_lesson(lesson)
    return explanation

@router.post("/{id}/publish")
def publish_timetable(id: int, db: Session = Depends(get_db)):
    tt = db.query(Timetable).filter(Timetable.id == id).first()
    if not tt:
        raise HTTPException(status_code=404, detail="Timetable not found")

    tt.is_published = True
    notif = Notification(
        title="Timetable Published",
        message=f"Timetable '{tt.name}' has been officially published and is now active.",
        notification_type="ROUTINE_UPDATE"
    )
    db.add(notif)
    db.commit()
    return {"status": "success", "message": "Timetable published successfully"}

@router.post("/{id}/apply-solution/{solution_id}")
def apply_candidate_solution(id: int, solution_id: int, db: Session = Depends(get_db)):
    tt = db.query(Timetable).filter(Timetable.id == id).first()
    if not tt:
        raise HTTPException(status_code=404, detail="Timetable not found")

    sol = db.query(GenerationSolution).filter(GenerationSolution.id == solution_id).first()
    if not sol:
        raise HTTPException(status_code=404, detail="Candidate solution not found")

    # Clear current entries
    db.query(TimetableEntry).filter(TimetableEntry.timetable_id == id).delete()

    problem = parse_schedule_problem(db=db)
    explainer = ScheduleExplainer(problem)

    for item in sol.entries_data:
        lesson = ScheduledLesson(
            section_id=item["section_id"],
            subject_id=item["subject_id"],
            teacher_id=item["teacher_id"],
            room_id=item["room_id"],
            period_id=item["period_id"],
            day_id=item["day_id"]
        )
        exp = explainer.explain_lesson(lesson)
        entry = TimetableEntry(
            timetable_id=tt.id,
            section_id=lesson.section_id,
            subject_id=lesson.subject_id,
            teacher_id=lesson.teacher_id,
            room_id=lesson.room_id,
            period_id=lesson.period_id,
            explanation=exp.get("summary", "")
        )
        db.add(entry)

    tt.score = sol.score
    tt.version += 1
    db.commit()
    return {"status": "success", "message": f"Applied solution #{sol.solution_index} with score {sol.score}%"}

# --- Export to Excel --- #
@router.get("/{id}/export/excel")
def export_timetable_excel(id: int, section_id: Optional[int] = None, db: Session = Depends(get_db)):
    tt = db.query(Timetable).filter(Timetable.id == id).first()
    if not tt:
        raise HTTPException(status_code=404, detail="Timetable not found")

    campus = db.query(Campus).first()
    campus_name = campus.name if campus else "Ratna Rajyalaxmi Campus"
    campus_addr = campus.address if (campus and campus.address) else "Pradarshanimarga, Kathmandu Nepal"

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Campus Routine"

    title_font = Font(name="Arial", size=13, bold=True)
    sub_font = Font(name="Arial", size=10, bold=True)
    header_font = Font(name="Arial", size=10, bold=True)
    tu_header_font = Font(name="Arial", size=10, bold=True, color="FFFFFF")
    data_font = Font(name="Arial", size=9)
    bold_data_font = Font(name="Arial", size=9, bold=True)
    
    header_fill = PatternFill(start_color="F1F5F9", end_color="F1F5F9", fill_type="solid")
    interval_fill = PatternFill(start_color="F8FAFC", end_color="F8FAFC", fill_type="solid")
    tu_header_fill = PatternFill(start_color="065F46", end_color="065F46", fill_type="solid")
    sub_header_fill = PatternFill(start_color="F1F5F9", end_color="F1F5F9", fill_type="solid")
    
    thin_border_side = Side(border_style="thin", color="000000")
    thin_border = Border(left=thin_border_side, right=thin_border_side, top=thin_border_side, bottom=thin_border_side)
    center_align = Alignment(horizontal="center", vertical="center", wrap_text=True)
    left_align = Alignment(horizontal="left", vertical="center", wrap_text=True)

    days = db.query(WorkingDay).filter(WorkingDay.is_active == True).order_by(WorkingDay.order_index).all()
    all_entries = db.query(TimetableEntry).filter(TimetableEntry.timetable_id == id).all()

    sections = db.query(Section).all()
    if section_id:
        sections = [s for s in sections if s.id == section_id]
    else:
        active_sec_ids = {e.section_id for e in all_entries}
        if active_sec_ids:
            sections = [s for s in sections if s.id in active_sec_ids]

    if not sections:
        sections = db.query(Section).all()[:1]

    # Find max periods count across active days
    max_periods = max([len(d.periods) for d in days], default=6) if days else 6

    current_row = 1
    for sec in sections:
        prog_name = sec.semester.program.name if (sec.semester and sec.semester.program) else "Bachelors in Computer Applications (BCA)"
        sem_name = sec.semester.name if sec.semester else ""
        room_name = ""
        sec_entries = [e for e in all_entries if e.section_id == sec.id]
        if sec_entries and sec_entries[0].room:
            room_name = sec_entries[0].room.room_number

        total_cols = max(max_periods + 1, 10)

        # 1. College Header
        ws.merge_cells(start_row=current_row, start_column=1, end_row=current_row, end_column=total_cols)
        ws.cell(row=current_row, column=1, value=campus_name).font = title_font
        ws.cell(row=current_row, column=1).alignment = center_align
        current_row += 1

        ws.merge_cells(start_row=current_row, start_column=1, end_row=current_row, end_column=total_cols)
        ws.cell(row=current_row, column=1, value=campus_addr).font = sub_font
        ws.cell(row=current_row, column=1).alignment = center_align
        current_row += 1

        ws.merge_cells(start_row=current_row, start_column=1, end_row=current_row, end_column=total_cols)
        ws.cell(row=current_row, column=1, value=f"{prog_name} {sem_name} - Sec {sec.name} {f'Room No- {room_name}' if room_name else ''}").font = sub_font
        ws.cell(row=current_row, column=1).alignment = center_align
        current_row += 1

        ws.merge_cells(start_row=current_row, start_column=1, end_row=current_row, end_column=total_cols)
        ws.cell(row=current_row, column=1, value="DAILY CLASS ROUTINE").font = sub_font
        ws.cell(row=current_row, column=1).alignment = center_align
        current_row += 2

        # 2. Main Routine Table Header
        ws.cell(row=current_row, column=1, value="Day/Time").font = header_font
        ws.cell(row=current_row, column=1).fill = header_fill
        ws.cell(row=current_row, column=1).border = thin_border
        ws.cell(row=current_row, column=1).alignment = center_align

        rep_periods = days[0].periods if days else []
        for p_idx in range(max_periods):
            col = p_idx + 2
            p_label = f"{rep_periods[p_idx].start_time}-{rep_periods[p_idx].end_time}" if p_idx < len(rep_periods) else f"Period {p_idx+1}"
            cell = ws.cell(row=current_row, column=col, value=p_label)
            cell.font = header_font
            cell.fill = header_fill
            cell.border = thin_border
            cell.alignment = center_align

        current_row += 1

        teachers_in_sec = {}
        subject_summary = {}

        for day in days:
            ws.cell(row=current_row, column=1, value=day.name).font = header_font
            ws.cell(row=current_row, column=1).fill = header_fill
            ws.cell(row=current_row, column=1).border = thin_border
            ws.cell(row=current_row, column=1).alignment = center_align

            day_periods = day.periods if day.periods else []
            for p_idx in range(max_periods):
                col = p_idx + 2
                cell = ws.cell(row=current_row, column=col)
                cell.border = thin_border
                cell.alignment = center_align

                if p_idx >= len(day_periods):
                    cell.value = ""
                    continue

                p = day_periods[p_idx]
                if p.period_type != "Teaching":
                    cell.value = "Interval"
                    cell.fill = interval_fill
                    cell.font = Font(name="Arial", size=9, bold=True)
                else:
                    match = next((e for e in all_entries if e.section_id == sec.id and e.period_id == p.id), None)
                    if match:
                        t_name = match.teacher.name if match.teacher else ""
                        words = [w for w in re.split(r'[\s._-]+', t_name) if w and w.lower() not in ["prof", "dr", "er", "mr", "mrs", "ms"]]
                        t_abbrev = "".join(w[0] for w in (words if words else [t_name])).upper() if t_name else "TCH"
                        if match.teacher:
                            teachers_in_sec[t_abbrev] = {
                                "abbrev": t_abbrev,
                                "name": match.teacher.name,
                                "contact": match.teacher.phone or "9841000000"
                            }
                        is_pr = (match.course_type == "PR") or (match.room and "lab" in (match.room.name or "").lower())
                        type_tag = "PR" if is_pr else "LT/TH"
                        sub_name = match.subject.name if match.subject else "Class"
                        cell.value = f"{sub_name}\n[{type_tag}] [{t_abbrev}]"
                        cell.font = data_font

                        # Track subject summary
                        sub_key = f"{sub_name}_{type_tag}"
                        if sub_key not in subject_summary:
                            subject_summary[sub_key] = {
                                "code": match.subject.code if match.subject else "BCA",
                                "name": sub_name,
                                "type": type_tag,
                                "credits": match.subject.credit_hours if match.subject else 3,
                                "weekly": 1,
                                "teacher": t_name,
                                "abbrev": t_abbrev
                            }
                        else:
                            subject_summary[sub_key]["weekly"] += 1
                    else:
                        cell.value = ""

            current_row += 1

        current_row += 1

        # 3. TU Syllabus Course Structure Table
        ws.merge_cells(start_row=current_row, start_column=1, end_row=current_row, end_column=10)
        tu_title_cell = ws.cell(row=current_row, column=1, value="TU SYLLABUS COURSE STRUCTURE & 120-DAY SEMESTER SCHEDULE (120 WORKING DAYS WINDOW)")
        tu_title_cell.font = tu_header_font
        tu_title_cell.fill = tu_header_fill
        tu_title_cell.alignment = left_align
        current_row += 1

        tu_headers = ["Code", "Subject / Course Title", "Nature", "Credit", "LT/TH", "PR", "Weekly", "Sem. Classes", "120-Day Coverage", "Faculty / Instructor"]
        for col_idx, h_text in enumerate(tu_headers, start=1):
            c = ws.cell(row=current_row, column=col_idx, value=h_text)
            c.font = header_font
            c.fill = sub_header_fill
            c.border = thin_border
            c.alignment = center_align if col_idx not in [2, 10] else left_align
        current_row += 1

        for s_info in subject_summary.values():
            credits_val = s_info["credits"]
            sem_classes = 80 if credits_val == 3 else (32 if credits_val <= 2 else 48)
            weekly_p = s_info["weekly"]
            req_weeks = (sem_classes + weekly_p - 1) // max(1, weekly_p)
            req_days = req_weeks * 6

            row_vals = [
                s_info["code"],
                s_info["name"],
                s_info["type"],
                f"{credits_val} Cr",
                3 if s_info["type"] != "PR" else "-",
                3 if s_info["type"] == "PR" else "-",
                f"{weekly_p} P/Wk",
                f"{sem_classes} Cls",
                f"{req_weeks} Wks ({req_days}d) <= 120d",
                f"{s_info['teacher']} [{s_info['abbrev']}]"
            ]

            for col_idx, val in enumerate(row_vals, start=1):
                c = ws.cell(row=current_row, column=col_idx, value=val)
                c.font = data_font
                c.border = thin_border
                c.alignment = center_align if col_idx not in [2, 10] else left_align
            current_row += 1

        current_row += 1

        # 4. Teacher Abbreviation Table & Legend
        ws.cell(row=current_row, column=1, value="Abbrev").font = header_font
        ws.cell(row=current_row, column=1).fill = sub_header_fill
        ws.cell(row=current_row, column=1).border = thin_border
        ws.cell(row=current_row, column=2, value="Name").font = header_font
        ws.cell(row=current_row, column=2).fill = sub_header_fill
        ws.cell(row=current_row, column=2).border = thin_border
        ws.cell(row=current_row, column=3, value="Contact").font = header_font
        ws.cell(row=current_row, column=3).fill = sub_header_fill
        ws.cell(row=current_row, column=3).border = thin_border

        ws.cell(row=current_row, column=5, value="Course Types Legend:").font = bold_data_font
        ws.cell(row=current_row, column=6, value="LT/TH = Lecture / Theory").font = data_font
        current_row += 1

        t_items = list(teachers_in_sec.values())
        for idx, t_info in enumerate(t_items):
            ws.cell(row=current_row, column=1, value=t_info["abbrev"]).border = thin_border
            ws.cell(row=current_row, column=1).alignment = center_align
            ws.cell(row=current_row, column=2, value=t_info["name"]).border = thin_border
            ws.cell(row=current_row, column=3, value=t_info["contact"]).border = thin_border
            if idx == 0:
                ws.cell(row=current_row, column=6, value="PR = Practical / Laboratory").font = data_font
            current_row += 1

        current_row += 3

    for col in ws.columns:
        col_letter = openpyxl.utils.get_column_letter(col[0].column)
        ws.column_dimensions[col_letter].width = 16

    output = io.BytesIO()
    wb.save(output)
    output.seek(0)

    headers = {"Content-Disposition": f"attachment; filename=routine_{id}.xlsx"}
    return Response(content=output.getvalue(), media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", headers=headers)


# --- Export to PDF --- #
@router.get("/{id}/export/pdf")
def export_timetable_pdf(id: int, section_id: Optional[int] = None, db: Session = Depends(get_db)):
    tt = db.query(Timetable).filter(Timetable.id == id).first()
    if not tt:
        raise HTTPException(status_code=404, detail="Timetable not found")

    campus = db.query(Campus).first()
    campus_name = campus.name if campus else "Ratna Rajyalaxmi Campus"
    campus_addr = campus.address if (campus and campus.address) else "Pradarshanimarga, Kathmandu Nepal"

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=landscape(letter), rightMargin=20, leftMargin=20, topMargin=20, bottomMargin=20)
    story = []
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle("CampusTitle", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=13, leading=15, alignment=1)
    sub_style = ParagraphStyle("CampusSub", parent=styles["Normal"], fontName="Helvetica", fontSize=9, leading=12, alignment=1)
    routine_title_style = ParagraphStyle("RoutineTitle", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=10, leading=13, alignment=1)
    tu_header_style = ParagraphStyle("TUHead", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=8, leading=10, textColor=colors.HexColor("#065F46"))

    days = db.query(WorkingDay).filter(WorkingDay.is_active == True).order_by(WorkingDay.order_index).all()
    all_entries = db.query(TimetableEntry).filter(TimetableEntry.timetable_id == id).all()

    sections = db.query(Section).all()
    if section_id:
        sections = [s for s in sections if s.id == section_id]
    else:
        active_sec_ids = {e.section_id for e in all_entries}
        if active_sec_ids:
            sections = [s for s in sections if s.id in active_sec_ids]

    if not sections:
        sections = db.query(Section).all()[:1]

    max_periods = max([len(d.periods) for d in days], default=6) if days else 6

    for sec in sections:
        prog_name = sec.semester.program.name if (sec.semester and sec.semester.program) else "Bachelors in Computer Applications (BCA)"
        sem_name = sec.semester.name if sec.semester else ""
        room_name = ""
        sec_entries = [e for e in all_entries if e.section_id == sec.id]
        if sec_entries and sec_entries[0].room:
            room_name = sec_entries[0].room.room_number

        story.append(Paragraph(f"<b>{campus_name.upper()}</b>", title_style))
        story.append(Paragraph(f"{campus_addr}", sub_style))
        story.append(Paragraph(f"<b>{prog_name} {sem_name} - Sec {sec.name} {f'Room No- {room_name}' if room_name else ''}</b>", sub_style))
        story.append(Paragraph("<b>DAILY CLASS ROUTINE</b>", routine_title_style))
        story.append(Spacer(1, 6))

        # Build table data
        rep_periods = days[0].periods if days else []
        header_row = ["Day/Time"]
        for p_idx in range(max_periods):
            if p_idx < len(rep_periods):
                header_row.append(f"{rep_periods[p_idx].start_time}-{rep_periods[p_idx].end_time}")
            else:
                header_row.append(f"Period {p_idx+1}")

        table_data = [header_row]
        teachers_in_sec = {}
        subject_summary = {}

        for day in days:
            row = [day.name]
            day_periods = day.periods if day.periods else []
            for p_idx in range(max_periods):
                if p_idx >= len(day_periods):
                    row.append("")
                    continue
                p = day_periods[p_idx]
                if p.period_type != "Teaching":
                    row.append("Interval")
                else:
                    match = next((e for e in all_entries if e.section_id == sec.id and e.period_id == p.id), None)
                    if match:
                        t_name = match.teacher.name if match.teacher else ""
                        words = [w for w in re.split(r'[\s._-]+', t_name) if w and w.lower() not in ["prof", "dr", "er", "mr", "mrs", "ms"]]
                        t_abbrev = "".join(w[0] for w in (words if words else [t_name])).upper() if t_name else "TCH"
                        if match.teacher:
                            teachers_in_sec[t_abbrev] = {
                                "abbrev": t_abbrev,
                                "name": match.teacher.name,
                                "contact": match.teacher.phone or "9841000000"
                            }
                        is_pr = (match.course_type == "PR") or (match.room and "lab" in (match.room.name or "").lower())
                        type_tag = "PR" if is_pr else "LT/TH"
                        sub_name = match.subject.name if match.subject else "Class"
                        row.append(f"{sub_name}\n[{type_tag}] [{t_abbrev}]")

                        sub_key = f"{sub_name}_{type_tag}"
                        if sub_key not in subject_summary:
                            subject_summary[sub_key] = {
                                "code": match.subject.code if match.subject else "BCA",
                                "name": sub_name,
                                "type": type_tag,
                                "credits": match.subject.credit_hours if match.subject else 3,
                                "weekly": 1,
                                "teacher": t_name,
                                "abbrev": t_abbrev
                            }
                        else:
                            subject_summary[sub_key]["weekly"] += 1
                    else:
                        row.append("")
            table_data.append(row)

        col_count = len(header_row)
        total_avail_width = 752
        day_col_width = 65
        slot_col_width = (total_avail_width - day_col_width) / max(1, (col_count - 1))
        col_widths = [day_col_width] + [slot_col_width] * (col_count - 1)

        pdf_table = Table(table_data, colWidths=col_widths)
        pdf_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#F1F5F9")),
            ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#F1F5F9")),
            ("TEXTCOLOR", (0, 0), (-1, -1), colors.HexColor("#0F172A")),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 7.5),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#334155")),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
            ("TOPPADDING", (0, 0), (-1, -1), 3),
        ]))
        story.append(pdf_table)
        story.append(Spacer(1, 8))

        # TU Syllabus Structure Table
        story.append(Paragraph("<b>TU SYLLABUS COURSE STRUCTURE &amp; 120-DAY SEMESTER SCHEDULE (120 WORKING DAYS WINDOW)</b>", tu_header_style))
        story.append(Spacer(1, 3))

        tu_pdf_rows = [["Code", "Subject / Course Title", "Nature", "Credit", "LT/TH", "PR", "Weekly", "Sem. Cls", "120-Day Coverage", "Faculty / Instructor"]]
        for s_info in subject_summary.values():
            credits_val = s_info["credits"]
            sem_classes = 80 if credits_val == 3 else (32 if credits_val <= 2 else 48)
            weekly_p = s_info["weekly"]
            req_weeks = (sem_classes + weekly_p - 1) // max(1, weekly_p)
            req_days = req_weeks * 6
            tu_pdf_rows.append([
                s_info["code"],
                s_info["name"][:24],
                s_info["type"],
                f"{credits_val} Cr",
                "3" if s_info["type"] != "PR" else "-",
                "3" if s_info["type"] == "PR" else "-",
                f"{weekly_p} P/Wk",
                f"{sem_classes} Cls",
                f"{req_weeks}W ({req_days}d) <= 120d",
                f"{s_info['teacher']} [{s_info['abbrev']}]"[:25]
            ])

        tu_table = Table(tu_pdf_rows, colWidths=[45, 150, 42, 42, 35, 30, 48, 48, 100, 212])
        tu_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#ECFDF5")),
            ("TEXTCOLOR", (0, 0), (-1, -1), colors.HexColor("#0F172A")),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("ALIGN", (1, 0), (1, -1), "LEFT"),
            ("ALIGN", (9, 0), (9, -1), "LEFT"),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 7),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#64748B")),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
            ("TOPPADDING", (0, 0), (-1, -1), 2),
        ]))
        story.append(tu_table)
        story.append(Spacer(1, 8))

        # Teacher Abbrev & Legend Table
        t_rows = [["Abbrev", "Name", "Contact", "", "Course Types Legend"]]
        t_list = list(teachers_in_sec.values())
        for idx, t_info in enumerate(t_list):
            legend_text = ""
            if idx == 0:
                legend_text = "LT/TH = Lecture / Theory"
            elif idx == 1:
                legend_text = "PR = Practical / Lab"
            t_rows.append([t_info["abbrev"], t_info["name"], t_info["contact"], "", legend_text])

        if len(t_list) == 0:
            t_rows.append(["-", "No faculty assigned", "-", "", "LT/TH = Lecture / Theory, PR = Practical"])

        t_table = Table(t_rows, colWidths=[55, 170, 95, 30, 402])
        t_table.setStyle(TableStyle([
            ("FONTNAME", (0, 0), (2, 0), "Helvetica-Bold"),
            ("FONTNAME", (4, 0), (4, 0), "Helvetica-Bold"),
            ("GRID", (0, 0), (2, -1), 0.5, colors.HexColor("#64748B")),
            ("BACKGROUND", (0, 0), (2, 0), colors.HexColor("#F1F5F9")),
            ("FONTSIZE", (0, 0), (-1, -1), 7.5),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("ALIGN", (0, 0), (0, -1), "CENTER"),
        ]))
        story.append(t_table)
        story.append(Spacer(1, 14))

    doc.build(story)
    buffer.seek(0)
    headers = {"Content-Disposition": f"attachment; filename=routine_{id}.pdf"}
    return Response(content=buffer.getvalue(), media_type="application/pdf", headers=headers)
