import io
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
    Timetable, TimetableEntry, GenerationRun, GenerationSolution, Subject, Teacher, Room, Section, Period, WorkingDay, AuditLog, Notification
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
    
    entries_res = []
    for e in tt.entries:
        entry_resp = TimetableEntryResponse.from_orm(e)
        entry_resp.section_name = e.section.name if e.section else None
        entry_resp.program_name = e.section.semester.program.name if (e.section and e.section.semester and e.section.semester.program) else None
        entry_resp.subject_name = e.subject.name if e.subject else None
        entry_resp.subject_code = e.subject.code if e.subject else None
        entry_resp.subject_color = e.subject.color_code if e.subject else "#3B82F6"
        entry_resp.teacher_name = e.teacher.name if e.teacher else None
        entry_resp.teacher_designation = e.teacher.designation if e.teacher else None
        entry_resp.room_number = e.room.room_number if e.room else None
        entry_resp.room_type_name = e.room.room_type.name if (e.room and e.room.room_type) else None
        
        if e.period:
            entry_resp.period_name = e.period.name
            entry_resp.start_time = e.period.start_time
            entry_resp.end_time = e.period.end_time
            entry_resp.period_type = e.period.period_type
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

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Routine Schedule"

    # Title styling
    title_font = Font(name="Arial", size=16, bold=True, color="1E3A8A")
    header_font = Font(name="Arial", size=11, bold=True, color="FFFFFF")
    header_fill = PatternFill(start_color="1E40AF", end_color="1E40AF", fill_type="solid")
    break_fill = PatternFill(start_color="FEF3C7", end_color="FEF3C7", fill_type="solid")
    cell_alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)

    ws.merge_cells("A1:G1")
    ws["A1"] = f"{tt.name} - Master College Routine"
    ws["A1"].font = title_font
    ws["A1"].alignment = Alignment(horizontal="center", vertical="center")
    ws.row_dimensions[1].height = 30

    # Fetch active days and periods
    days = db.query(WorkingDay).filter(WorkingDay.is_active == True).order_by(WorkingDay.order_index).all()
    
    current_row = 3
    query = db.query(TimetableEntry).filter(TimetableEntry.timetable_id == id)
    if section_id:
        query = query.filter(TimetableEntry.section_id == section_id)
    all_entries = query.all()

    # Organize entries by (section_id, period_id)
    sections = db.query(Section).all()
    if section_id:
        sections = [s for s in sections if s.id == section_id]

    for sec in sections:
        ws.cell(row=current_row, column=1, value=f"Class/Section: {sec.semester.program.name if sec.semester and sec.semester.program else ''} {sec.name}").font = Font(bold=True, size=12)
        current_row += 1

        # Table Header: Days along top or Periods
        ws.cell(row=current_row, column=1, value="Day / Period").font = header_font
        ws.cell(row=current_row, column=1).fill = header_fill
        ws.cell(row=current_row, column=1).alignment = cell_alignment

        # Maximum periods across days
        max_periods = max([len(d.periods) for d in days], default=6)
        for p_idx in range(1, max_periods + 1):
            col = p_idx + 1
            cell = ws.cell(row=current_row, column=col, value=f"Period {p_idx}")
            cell.font = header_font
            cell.fill = header_fill
            cell.alignment = cell_alignment

        current_row += 1

        for day in days:
            ws.cell(row=current_row, column=1, value=day.name).font = Font(bold=True)
            ws.cell(row=current_row, column=1).alignment = cell_alignment
            
            for p_idx, p in enumerate(day.periods):
                col = p_idx + 2
                cell = ws.cell(row=current_row, column=col)
                if p.period_type != "Teaching":
                    cell.value = f"[{p.name}]"
                    cell.fill = break_fill
                else:
                    # Find scheduled entry
                    match = next((e for e in all_entries if e.section_id == sec.id and e.period_id == p.id), None)
                    if match:
                        cell.value = f"{match.subject.code}\n{match.teacher.name if match.teacher else ''}\n({match.room.room_number if match.room else ''})"
                    else:
                        cell.value = "-"
                cell.alignment = cell_alignment

            current_row += 1
        current_row += 2

    # Adjust column widths
    for col in ws.columns:
        max_len = max(len(str(cell.value or '')) for cell in col)
        col_letter = openpyxl.utils.get_column_letter(col[0].column)
        ws.column_dimensions[col_letter].width = max(max_len + 4, 14)

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

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=landscape(letter), rightMargin=30, leftMargin=30, topMargin=30, bottomMargin=30)
    story = []
    styles = getSampleStyleSheet()

    # Title
    title_style = ParagraphStyle("TitleStyle", parent=styles["Heading1"], fontName="Helvetica-Bold", fontSize=18, textColor=colors.HexColor("#1E3A8A"), alignment=1)
    story.append(Paragraph(f"<b>{tt.name}</b>", title_style))
    story.append(Paragraph(f"Score: {tt.score}% | Version {tt.version} | Conflicts: {tt.conflict_count}", styles["Normal"]))
    story.append(Spacer(1, 15))

    days = db.query(WorkingDay).filter(WorkingDay.is_active == True).order_by(WorkingDay.order_index).all()
    sections = db.query(Section).all()
    if section_id:
        sections = [s for s in sections if s.id == section_id]

    all_entries = db.query(TimetableEntry).filter(TimetableEntry.timetable_id == id).all()

    for sec in sections:
        sec_title = f"Class: {sec.semester.program.name if sec.semester and sec.semester.program else ''} {sec.name}"
        story.append(Paragraph(f"<b>{sec_title}</b>", styles["Heading2"]))
        story.append(Spacer(1, 6))

        # Build table data
        max_p = max([len(d.periods) for d in days], default=6)
        table_data = [["Day"] + [f"Period {i+1}" for i in range(max_p)]]

        for day in days:
            row = [day.name]
            for p_idx in range(max_p):
                if p_idx < len(day.periods):
                    p = day.periods[p_idx]
                    if p.period_type != "Teaching":
                        row.append(f"[{p.name}]")
                    else:
                        match = next((e for e in all_entries if e.section_id == sec.id and e.period_id == p.id), None)
                        if match:
                            row.append(f"{match.subject.code}\n{match.teacher.name if match.teacher else ''}\n({match.room.room_number if match.room else ''})")
                        else:
                            row.append("-")
                else:
                    row.append("")
            table_data.append(row)

        pdf_table = Table(table_data)
        pdf_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1E40AF")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, 0), 10),
            ("BOTTOMPADDING", (0, 0), (-1, 0), 6),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
            ("FONTSIZE", (0, 1), (-1, -1), 8),
        ]))
        story.append(pdf_table)
        story.append(Spacer(1, 20))

    doc.build(story)
    buffer.seek(0)
    headers = {"Content-Disposition": f"attachment; filename=routine_{id}.pdf"}
    return Response(content=buffer.getvalue(), media_type="application/pdf", headers=headers)
