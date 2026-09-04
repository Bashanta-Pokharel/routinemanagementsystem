# UniSchedule - Smart University & College Timetable & Routine Management System

A modern, responsive, full-featured **University and College Routine Management & Optimization System** built with **FastAPI**, **Next.js (TypeScript + Tailwind CSS)**, and a **Constraint Optimization / CP-SAT Scheduling Engine**.

---

## Key Features

1. **Quick Simple Routine Builder (Fast & Direct)**:
   - Input class name (e.g. *BCA 1st Semester*), active working days, and period timing intervals.
   - Add subjects, periods/week (e.g., 6 subjects, 4 periods/week each).
   - Enter assigned teachers and their exact daily free time windows (e.g., *Bashanta teaches C Programming, free 1:00 PM – 3:30 PM*).
   - Instant calculation: matches intervals, places classes conflict-free, saves directly to the SQLite database, and provides 1-click Print and Excel export.

2. **100% Dynamic Timetable Structure**:
   - No hard-coded days, periods, start/end times, faculties, rooms, or teachers.
   - Supports custom working days (e.g. Sunday–Friday) and varying period counts per day (e.g. 6 periods on Sunday–Thursday, 4 periods on Friday half-day).
   - Dedicated period types: `Teaching`, `Break`, `Lunch`, `Meeting`, `Free`.

3. **Core Constraint Programming Optimization Engine**:
   - Mathematical model with boolean decision variables $X(s, sub, t, r, p) \in \{0, 1\}$.
   - Strictly enforces **Hard Constraints**:
     - No teacher clashes (double booking)
     - No class/section clashes
     - No room clashes
     - Teacher availability & non-teaching period protection
     - Room capacity and type matching (e.g., Computer Lab for practicals)
     - Teacher maximum daily and weekly workload limits
     - Subject daily class limits
   - Optimizes **Soft Constraints** with configurable weights:
     - Teacher preferred teaching hours
     - Avoiding consecutive class fatigue (> 3-4 consecutive hours)
     - Minimizing idle gaps / holes in daily schedules
     - Distributing subject classes across different days
     - Minimizing room hopping

4. **Multi-Solution Generation & Scoring**:
   - Generates multiple diverse candidate routines ranked by score (0–100%).
   - One-click solution comparison and application.

5. **Interactive Timetable Editor & Drag-and-Drop**:
   - Switchable views: **Section / Class View**, **Teacher Routine View**, **Room & Lab View**, **Day Master View**.
   - Click-to-move & Swap with real-time constraint validation and clash rejection explanations.
   - Explainable AI inspector: *"Why was this class scheduled here?"*.

6. **Teacher Availability & Workload Dashboard**:
   - Weekly Day $\times$ Period availability matrix with quick toggles (Available ✓, Preferred ★, Unavailable ✗, Restricted ⊘).
   - Real-time faculty workload tracking vs configured limits.

7. **Export & Reports**:
   - Instant PDF export with styled landscape tables.
   - Excel spreadsheet (.xlsx) export.
   - Print-ready format.

---

## Technology Stack

- **Backend**: Python, FastAPI, SQLAlchemy 2.0, Pydantic v2, Alembic, SQLite / PostgreSQL, ReportLab, OpenPyXL.
- **Scheduling**: Google OR-Tools CP-SAT + Standalone Forward-Checking Constraint Optimizer.
- **Frontend**: Next.js (App Router), React 19, TypeScript, Tailwind CSS v4, Lucide React, Recharts, Canvas Confetti.

---

## Quick Start Guide

### 1. Start the Backend API

```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

The backend starts at `http://localhost:8000`. Automatic OpenAPI docs are available at `http://localhost:8000/docs`. Initial realistic college dataset is automatically seeded on first launch into `timetable.db` (SQLite).

### 2. Start the Frontend Application

```bash
cd frontend
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## Running Automated Tests

```bash
cd backend
source venv/bin/activate
PYTHONPATH=. pytest tests/ -v
```

All 13 scheduler unit, Simple Wizard time interval, and API integration tests will run and verify zero conflicts.