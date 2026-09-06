"use client";

import React, { useState } from "react";
import { 
  Sparkles, Plus, Trash2, Clock, Calendar, CheckCircle2, 
  Printer, Download, ArrowRight, User, BookOpen, Layers, Coffee, Zap,
  RotateCcw, ShieldCheck, Check, AlertCircle
} from "lucide-react";
import confetti from "canvas-confetti";
import { fetchApi } from "@/lib/api";
import { cn } from "@/lib/utils";

interface TeacherItem {
  id: string;
  name: string;
  speciality: string;
  free_time_start: string;
  free_time_end: string;
  max_classes_per_day: number;
}

interface SubjectItem {
  id: string;
  name: string;
  code?: string;
  weekly_periods: number;
  teacher_name: string;
}

interface SemesterBlock {
  semester_number: number;
  semester_name: string;
  section_name: string;
  room_name: string;
  is_active: boolean;
  subjects: SubjectItem[];
}

export function SimpleRoutineWizard() {
  // Database reset state
  const [resettingDb, setResettingDb] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  // Routine Meta
  const [routineTitle, setRoutineTitle] = useState("BCA Academic Routine 2026");

  // Step 1: Faculty / Teachers with Specialty and Available Time
  const [teachers, setTeachers] = useState<TeacherItem[]>([
    {
      id: "t1",
      name: "Bashanta",
      speciality: "C Programming, Data Structures, OOP Java",
      free_time_start: "01:00 PM",
      free_time_end: "03:30 PM",
      max_classes_per_day: 4,
    },
    {
      id: "t2",
      name: "Prof. Sita Rai",
      speciality: "Calculus, Numerical Methods, Statistics",
      free_time_start: "10:00 AM",
      free_time_end: "01:30 PM",
      max_classes_per_day: 4,
    },
    {
      id: "t3",
      name: "Er. Hari Thapa",
      speciality: "Digital Logic Systems, Computer Architecture",
      free_time_start: "10:00 AM",
      free_time_end: "03:30 PM",
      max_classes_per_day: 4,
    },
    {
      id: "t4",
      name: "Ramesh Joshi",
      speciality: "Computer Fundamentals, DBMS, Web Tech",
      free_time_start: "10:00 AM",
      free_time_end: "03:30 PM",
      max_classes_per_day: 4,
    },
    {
      id: "t5",
      name: "Anita Shrestha",
      speciality: "Society and Technology, Technical Writing",
      free_time_start: "10:00 AM",
      free_time_end: "03:30 PM",
      max_classes_per_day: 4,
    },
  ]);

  // Step 2 & 3: BCA Semesters (1 to 8) with Subjects
  const [semesters, setSemesters] = useState<SemesterBlock[]>([
    {
      semester_number: 1,
      semester_name: "BCA 1st Semester",
      section_name: "BCA 1st Sem",
      room_name: "Room 101",
      is_active: true,
      subjects: [
        { id: "s1_1", name: "C Programming", code: "CACS101", weekly_periods: 4, teacher_name: "Bashanta" },
        { id: "s1_2", name: "Mathematics I (Calculus)", code: "CACS102", weekly_periods: 4, teacher_name: "Prof. Sita Rai" },
        { id: "s1_3", name: "Digital Logic Systems", code: "CACS103", weekly_periods: 4, teacher_name: "Er. Hari Thapa" },
        { id: "s1_4", name: "Computer Fundamentals", code: "CACS104", weekly_periods: 4, teacher_name: "Ramesh Joshi" },
        { id: "s1_5", name: "Society and Technology", code: "CACS105", weekly_periods: 3, teacher_name: "Anita Shrestha" },
      ]
    },
    {
      semester_number: 2,
      semester_name: "BCA 2nd Semester",
      section_name: "BCA 2nd Sem",
      room_name: "Room 102",
      is_active: false,
      subjects: []
    },
    {
      semester_number: 3,
      semester_name: "BCA 3rd Semester",
      section_name: "BCA 3rd Sem",
      room_name: "Room 103",
      is_active: true,
      subjects: [
        { id: "s3_1", name: "Data Structures & Algorithms", code: "CACS201", weekly_periods: 4, teacher_name: "Bashanta" },
        { id: "s3_2", name: "Numerical Methods", code: "CACS202", weekly_periods: 4, teacher_name: "Prof. Sita Rai" },
        { id: "s3_3", name: "Computer Architecture", code: "CACS203", weekly_periods: 4, teacher_name: "Er. Hari Thapa" },
        { id: "s3_4", name: "Database Management System", code: "CACS204", weekly_periods: 4, teacher_name: "Ramesh Joshi" },
      ]
    },
    {
      semester_number: 4,
      semester_name: "BCA 4th Semester",
      section_name: "BCA 4th Sem",
      room_name: "Room 104",
      is_active: false,
      subjects: []
    },
    {
      semester_number: 5,
      semester_name: "BCA 5th Semester",
      section_name: "BCA 5th Sem",
      room_name: "Room 105",
      is_active: false,
      subjects: []
    },
    {
      semester_number: 6,
      semester_name: "BCA 6th Semester",
      section_name: "BCA 6th Sem",
      room_name: "Room 106",
      is_active: false,
      subjects: []
    },
    {
      semester_number: 7,
      semester_name: "BCA 7th Semester",
      section_name: "BCA 7th Sem",
      room_name: "Room 107",
      is_active: false,
      subjects: []
    },
    {
      semester_number: 8,
      semester_name: "BCA 8th Semester",
      section_name: "BCA 8th Sem",
      room_name: "Room 108",
      is_active: false,
      subjects: []
    }
  ]);

  // Step 4: Days and Periods
  const [selectedDays, setSelectedDays] = useState<string[]>([
    "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"
  ]);

  const [periods, setPeriods] = useState([
    { name: "Period 1", start_time: "10:00 AM", end_time: "11:00 AM", type: "Teaching" },
    { name: "Period 2", start_time: "11:00 AM", end_time: "12:00 PM", type: "Teaching" },
    { name: "Break", start_time: "12:00 PM", end_time: "12:30 PM", type: "Break" },
    { name: "Period 3", start_time: "12:30 PM", end_time: "01:30 PM", type: "Teaching" },
    { name: "Period 4", start_time: "01:30 PM", end_time: "02:30 PM", type: "Teaching" },
    { name: "Period 5", start_time: "02:30 PM", end_time: "03:30 PM", type: "Teaching" },
  ]);

  const [dayPeriodCounts, setDayPeriodCounts] = useState<Record<string, number>>({
    "Sunday": 6,
    "Monday": 6,
    "Tuesday": 6,
    "Wednesday": 6,
    "Thursday": 6,
    "Friday": 4,
    "Saturday": 4,
  });

  // State for generation result
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedRoutine, setGeneratedRoutine] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedSemesterTab, setSelectedSemesterTab] = useState<string>("");
  const [selectedTeacherTab, setSelectedTeacherTab] = useState<string>("");

  const allAvailableDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  // Handlers for Clean Reset
  const handleCleanResetDatabase = async () => {
    if (!confirm("Are you sure you want to delete all previous mock data and start with a clean BCA setup?")) {
      return;
    }
    setResettingDb(true);
    setResetMessage(null);
    try {
      const res = await fetchApi<any>("/seed/clean-reset", { method: "POST" });
      setResetMessage(res.message || "All default data cleared successfully!");
      setTimeout(() => setResetMessage(null), 5000);
    } catch (err: any) {
      alert("Reset failed: " + (err.message || "Unknown error"));
    } finally {
      setResettingDb(false);
    }
  };

  const handleClearAllFields = () => {
    if (!confirm("Clear all teachers and subjects from this form to start from scratch?")) return;
    setTeachers([]);
    setSemesters(semesters.map(s => ({ ...s, subjects: [] })));
    setGeneratedRoutine(null);
  };

  // Teacher Handlers
  const handleAddTeacher = () => {
    const newIdx = teachers.length + 1;
    setTeachers([
      ...teachers,
      {
        id: `t_${Date.now()}`,
        name: `Teacher ${newIdx}`,
        speciality: "Computer Science",
        free_time_start: "10:00 AM",
        free_time_end: "03:30 PM",
        max_classes_per_day: 4,
      }
    ]);
  };

  const handleRemoveTeacher = (id: string) => {
    setTeachers(teachers.filter(t => t.id !== id));
  };

  const handleUpdateTeacher = (id: string, field: keyof TeacherItem, value: any) => {
    setTeachers(teachers.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  // Semester & Subject Handlers
  const toggleSemester = (semNum: number) => {
    setSemesters(semesters.map(s => {
      if (s.semester_number === semNum) {
        return { ...s, is_active: !s.is_active };
      }
      return s;
    }));
  };

  const handleAddSubjectToSemester = (semNum: number) => {
    setSemesters(semesters.map(s => {
      if (s.semester_number === semNum) {
        const subCount = s.subjects.length + 1;
        const defaultTeacher = teachers.length > 0 ? teachers[0].name : "Teacher";
        const newSub: SubjectItem = {
          id: `s_${semNum}_${Date.now()}`,
          name: `Subject ${subCount}`,
          code: `CACS${semNum}0${subCount}`,
          weekly_periods: 4,
          teacher_name: defaultTeacher
        };
        return { ...s, subjects: [...s.subjects, newSub] };
      }
      return s;
    }));
  };

  const handleRemoveSubject = (semNum: number, subId: string) => {
    setSemesters(semesters.map(s => {
      if (s.semester_number === semNum) {
        return { ...s, subjects: s.subjects.filter(sub => sub.id !== subId) };
      }
      return s;
    }));
  };

  const handleUpdateSubject = (semNum: number, subId: string, field: keyof SubjectItem, value: any) => {
    setSemesters(semesters.map(s => {
      if (s.semester_number === semNum) {
        return {
          ...s,
          subjects: s.subjects.map(sub => sub.id === subId ? { ...sub, [field]: value } : sub)
        };
      }
      return s;
    }));
  };

  // Days & Periods Handlers
  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      if (selectedDays.length <= 1) return;
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handlePeriodCountChange = (day: string, count: number) => {
    const validCount = Math.max(1, Math.min(periods.length, count));
    setDayPeriodCounts((prev) => ({
      ...prev,
      [day]: validCount,
    }));
  };

  // Count how many subjects a teacher is assigned to across running semesters
  const getTeacherAssignedCount = (teacherName: string) => {
    let count = 0;
    semesters.filter(s => s.is_active).forEach(s => {
      s.subjects.forEach(sub => {
        if (sub.teacher_name === teacherName) count += sub.weekly_periods;
      });
    });
    return count;
  };

  // Generate BCA Multi-Semester Routine
  const handleCalculateRoutine = async () => {
    const activeSemesters = semesters.filter(s => s.is_active);
    if (activeSemesters.length === 0) {
      alert("Please select at least one running BCA semester.");
      return;
    }

    const totalSubjects = activeSemesters.reduce((acc, s) => acc + s.subjects.length, 0);
    if (totalSubjects === 0) {
      alert("Please add at least one subject to your running semesters.");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const payload = {
        routine_title: routineTitle,
        days: selectedDays,
        periods: periods,
        day_period_counts: dayPeriodCounts,
        teachers: teachers.map(t => ({
          name: t.name,
          speciality: t.speciality,
          free_time_start: t.free_time_start,
          free_time_end: t.free_time_end,
          free_days: selectedDays,
          max_classes_per_day: t.max_classes_per_day
        })),
        running_semesters: activeSemesters.map(s => ({
          semester_number: s.semester_number,
          semester_name: s.semester_name,
          section_name: s.section_name,
          room_name: s.room_name,
          subjects: s.subjects.map(sub => ({
            name: sub.name,
            code: sub.code,
            weekly_periods: sub.weekly_periods,
            teacher_name: sub.teacher_name
          }))
        }))
      };

      const result = await fetchApi<any>("/timetable/bca-routine", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setGeneratedRoutine(result);
      const semKeys = Object.keys(result.semester_routines || {});
      if (semKeys.length > 0) setSelectedSemesterTab(semKeys[0]);
      const tKeys = Object.keys(result.teacher_routines || {});
      if (tKeys.length > 0) setSelectedTeacherTab(tKeys[0]);

      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (err: any) {
      setError(err.message || "Failed to generate routine.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const activeSemesters = semesters.filter(s => s.is_active);

  return (
    <div className="space-y-5">
      {/* Top Banner with Quick Actions */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                BCA Multi-Semester Routine Generator
              </h2>
              <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-300">
                Cross-Semester Clash-Free
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              Configure teachers with their subject speciality and available hours. Run multiple BCA semesters at once &mdash; teachers teaching across multiple semesters will never have conflicting classes.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCleanResetDatabase}
              disabled={resettingDb}
              className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300 cursor-pointer transition-colors"
              title="Delete all previous default and mock data from MySQL"
            >
              <RotateCcw className={cn("h-3.5 w-3.5", resettingDb && "animate-spin")} />
              {resettingDb ? "Clearing..." : "Clean Reset DB"}
            </button>
            <button
              type="button"
              onClick={handleClearAllFields}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
            >
              Clear Form
            </button>
          </div>
        </div>

        {resetMessage && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-50 p-2.5 text-xs font-semibold text-emerald-800 border border-emerald-200 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            {resetMessage}
          </div>
        )}
      </div>

      {/* Routine Configuration Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-6">
        
        {/* Step 1: Faculty / Teachers Management */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-xs">
                1
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Faculty Members, Subject Speciality & Free-Time Windows
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Define teachers and when they are available in the day (e.g. 01:00 PM &ndash; 03:30 PM). A teacher can teach subjects in multiple semesters.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleAddTeacher}
              className="flex items-center gap-1 rounded-lg bg-blue-50 border border-blue-200 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-300 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Teacher
            </button>
          </div>

          <div className="space-y-2">
            {teachers.map((t, idx) => {
              const assignedLoad = getTeacherAssignedCount(t.name);
              return (
                <div
                  key={t.id}
                  className="grid grid-cols-1 gap-2.5 rounded-xl border border-slate-200 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-800/40 sm:grid-cols-12 items-center"
                >
                  {/* Teacher Name: 3 cols */}
                  <div className="sm:col-span-3">
                    <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">
                      Teacher Name ({idx + 1})
                    </label>
                    <input
                      type="text"
                      value={t.name}
                      onChange={(e) => handleUpdateTeacher(t.id, "name", e.target.value)}
                      placeholder="e.g. Bashanta Pokharel"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Speciality: 4 cols */}
                  <div className="sm:col-span-4">
                    <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">
                      Subject Speciality / Skills
                    </label>
                    <input
                      type="text"
                      value={t.speciality}
                      onChange={(e) => handleUpdateTeacher(t.id, "speciality", e.target.value)}
                      placeholder="e.g. C, Java, Data Structures"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Available Time Interval: 4 cols */}
                  <div className="sm:col-span-4">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
                        Free Time Window (From &ndash; To)
                      </label>
                      {assignedLoad > 0 && (
                        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">
                          {assignedLoad} hrs assigned
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={t.free_time_start}
                        onChange={(e) => handleUpdateTeacher(t.id, "free_time_start", e.target.value)}
                        placeholder="10:00 AM"
                        className="w-1/2 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                      />
                      <span className="text-slate-400 text-xs font-bold">&ndash;</span>
                      <input
                        type="text"
                        value={t.free_time_end}
                        onChange={(e) => handleUpdateTeacher(t.id, "free_time_end", e.target.value)}
                        placeholder="03:30 PM"
                        className="w-1/2 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                      />
                    </div>
                  </div>

                  {/* Delete: 1 col */}
                  <div className="sm:col-span-1 flex justify-center pt-3 sm:pt-0">
                    <button
                      type="button"
                      onClick={() => handleRemoveTeacher(t.id)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400 cursor-pointer"
                      title="Delete Teacher"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 2: Running BCA Semesters Selection */}
        <div className="space-y-3">
          <div className="border-b border-slate-100 pb-2 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-xs">
                2
              </span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Select Running BCA Semesters
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Choose which semesters are currently active. All selected semesters will be scheduled together with zero teacher collisions.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {semesters.map((sem) => (
              <button
                key={sem.semester_number}
                type="button"
                onClick={() => toggleSemester(sem.semester_number)}
                className={cn(
                  "flex flex-col items-center justify-center rounded-xl border p-2.5 transition-all text-center cursor-pointer",
                  sem.is_active
                    ? "border-blue-600 bg-blue-50 text-blue-900 font-bold dark:border-blue-500 dark:bg-blue-950/60 dark:text-blue-200 ring-2 ring-blue-500/20"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                )}
              >
                <span className="text-xs font-bold">Sem {sem.semester_number}</span>
                <span className="text-[10px] opacity-70 mt-0.5">
                  {sem.is_active ? `Active (${sem.subjects.length} sub)` : "Inactive"}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Step 3: Semester-Wise Subjects & Teacher Assignment */}
        <div className="space-y-4">
          <div className="border-b border-slate-100 pb-2 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-xs">
                3
              </span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Semester-Wise Subjects & Teacher Assignment
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Add subjects under each running semester and select their assigned teacher.
            </p>
          </div>

          {activeSemesters.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
              No semesters selected. Please select one or more running BCA semesters in Step 2.
            </div>
          ) : (
            <div className="space-y-4">
              {activeSemesters.map((sem) => (
                <div
                  key={sem.semester_number}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-blue-600 px-2 py-0.5 text-xs font-bold text-white">
                        {sem.semester_name}
                      </span>
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                        <span>Room:</span>
                        <input
                          type="text"
                          value={sem.room_name}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSemesters(semesters.map(s => s.semester_number === sem.semester_number ? { ...s, room_name: val } : s));
                          }}
                          placeholder="Room 101"
                          className="w-24 rounded border border-slate-300 bg-white px-2 py-0.5 text-xs font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddSubjectToSemester(sem.semester_number)}
                      className="flex items-center gap-1 rounded-lg bg-blue-50 border border-blue-200 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-300 cursor-pointer self-start sm:self-auto"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Subject to Sem {sem.semester_number}
                    </button>
                  </div>

                  {sem.subjects.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-2">
                      No subjects added yet. Click &quot;Add Subject&quot; above to add courses for {sem.semester_name}.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {sem.subjects.map((sub, sIdx) => {
                        const matchedTeacher = teachers.find(t => t.name === sub.teacher_name);
                        return (
                          <div
                            key={sub.id}
                            className="grid grid-cols-1 gap-2 rounded-lg border border-slate-200 bg-slate-50/70 p-2.5 dark:border-slate-800 dark:bg-slate-800/40 sm:grid-cols-12 items-center"
                          >
                            {/* Subject Name: 4 cols */}
                            <div className="sm:col-span-4">
                              <label className="block text-[9px] font-semibold text-slate-500 dark:text-slate-400 uppercase mb-0.5">
                                Subject Name ({sIdx + 1})
                              </label>
                              <input
                                type="text"
                                value={sub.name}
                                onChange={(e) => handleUpdateSubject(sem.semester_number, sub.id, "name", e.target.value)}
                                placeholder="e.g. C Programming"
                                className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                              />
                            </div>

                            {/* Subject Code: 2 cols */}
                            <div className="sm:col-span-2">
                              <label className="block text-[9px] font-semibold text-slate-500 dark:text-slate-400 uppercase mb-0.5">
                                Code
                              </label>
                              <input
                                type="text"
                                value={sub.code || ""}
                                onChange={(e) => handleUpdateSubject(sem.semester_number, sub.id, "code", e.target.value)}
                                placeholder="CACS101"
                                className="w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                              />
                            </div>

                            {/* Weekly Periods: 2 cols */}
                            <div className="sm:col-span-2">
                              <label className="block text-[9px] font-semibold text-slate-500 dark:text-slate-400 uppercase mb-0.5 text-center">
                                Periods/Wk
                              </label>
                              <input
                                type="number"
                                min="1"
                                max="10"
                                value={sub.weekly_periods}
                                onChange={(e) => handleUpdateSubject(sem.semester_number, sub.id, "weekly_periods", parseInt(e.target.value) || 1)}
                                className="w-full rounded-md border border-slate-300 bg-white px-1.5 py-1 text-xs font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white text-center"
                              />
                            </div>

                            {/* Assigned Teacher: 3 cols */}
                            <div className="sm:col-span-3">
                              <label className="block text-[9px] font-semibold text-slate-500 dark:text-slate-400 uppercase mb-0.5">
                                Assigned Teacher
                              </label>
                              <select
                                value={sub.teacher_name}
                                onChange={(e) => handleUpdateSubject(sem.semester_number, sub.id, "teacher_name", e.target.value)}
                                className="w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                              >
                                {teachers.map((t) => (
                                  <option key={t.id} value={t.name}>
                                    {t.name} ({t.free_time_start} - {t.free_time_end})
                                  </option>
                                ))}
                                {!teachers.some(t => t.name === sub.teacher_name) && (
                                  <option value={sub.teacher_name}>{sub.teacher_name}</option>
                                )}
                              </select>
                              {matchedTeacher && (
                                <span className="block text-[9px] text-slate-400 truncate mt-0.5">
                                  {matchedTeacher.speciality}
                                </span>
                              )}
                            </div>

                            {/* Delete: 1 col */}
                            <div className="sm:col-span-1 flex justify-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveSubject(sem.semester_number, sub.id)}
                                className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400 cursor-pointer"
                                title="Remove Subject"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Step 4: Working Days & Dynamic Daily Periods */}
        <div className="space-y-3">
          <div className="border-b border-slate-100 pb-2 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-xs">
                4
              </span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Working Days & Daily Periods Configuration
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Set which days the campus runs and customize the number of periods on specific days (e.g. 5 periods Sun-Thu, 3 periods on Friday).
            </p>
          </div>

          {/* Active Days */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Active Working Days:
            </label>
            <div className="flex flex-wrap gap-2">
              {allAvailableDays.map((day) => {
                const isSelected = selectedDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer",
                      isSelected
                        ? "bg-blue-600 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400"
                    )}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Periods Template */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {periods.map((p, idx) => (
              <div
                key={idx}
                className={cn(
                  "flex flex-col justify-between rounded-lg border p-2 text-xs",
                  p.type === "Break"
                    ? "border-amber-200 bg-amber-50/80 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
                    : "border-slate-200 bg-slate-50 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                )}
              >
                <div>
                  <div className="font-bold">{p.name}</div>
                  <div className="text-[10px] opacity-80 mt-0.5">
                    {p.start_time} &ndash; {p.end_time}
                  </div>
                </div>
                <span className="mt-1 text-[9px] font-bold uppercase tracking-wider opacity-60">
                  {p.type}
                </span>
              </div>
            ))}
          </div>

          {/* Per-Day Period Adjustment */}
          <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-800/40">
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-2">
              Set Periods Count Per Day (Variable Days):
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {selectedDays.map((day) => {
                const count = dayPeriodCounts[day] || periods.length;
                return (
                  <div
                    key={day}
                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 dark:border-slate-700 dark:bg-slate-800"
                  >
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{day}:</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handlePeriodCountChange(day, count - 1)}
                        className="flex h-5 w-5 items-center justify-center rounded bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer"
                        title="Decrease periods"
                      >
                        -
                      </button>
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400 w-3 text-center">
                        {count}
                      </span>
                      <button
                        type="button"
                        onClick={() => handlePeriodCountChange(day, count + 1)}
                        className="flex h-5 w-5 items-center justify-center rounded bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer"
                        title="Increase periods"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Generate Button */}
        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-800 border border-red-200 dark:bg-red-950/50 dark:border-red-800 dark:text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="button"
          onClick={handleCalculateRoutine}
          disabled={isGenerating}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 text-sm font-bold text-white shadow-md hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 cursor-pointer transition-all"
        >
          <Sparkles className={cn("h-4 w-4", isGenerating && "animate-spin")} />
          {isGenerating ? "Calculating Clash-Free Schedule..." : "⚡ Generate BCA Multi-Semester Routine"}
        </button>
      </div>

      {/* Routine Display Section */}
      {generatedRoutine && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4 print:p-0 print:border-none print:shadow-none">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {generatedRoutine.name || "BCA College Timetable"}
                </h3>
                <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-300">
                  <Check className="h-3 w-3" />
                  0 Conflicts (Clash-Free)
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Optimization Score: {generatedRoutine.score}% &bull; Total Scheduled Classes: {generatedRoutine.total_classes}
              </p>
            </div>
            <div className="flex items-center gap-2 print:hidden">
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer shadow-xs"
              >
                <Printer className="h-3.5 w-3.5" />
                Print Routine
              </button>
              <a
                href={`/api/timetable/${generatedRoutine.timetable_id}/export/excel`}
                download
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 cursor-pointer shadow-xs"
              >
                <Download className="h-3.5 w-3.5" />
                Export Excel
              </a>
            </div>
          </div>

          {/* View Mode Tabs: Semesters vs Teachers */}
          <div className="space-y-4">
            {/* Semester Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 pb-2 dark:border-slate-800 print:hidden">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mr-1">
                Semester View:
              </span>
              {Object.keys(generatedRoutine.semester_routines || {}).map((secName) => (
                <button
                  key={secName}
                  onClick={() => {
                    setSelectedSemesterTab(secName);
                    setSelectedTeacherTab("");
                  }}
                  className={cn(
                    "rounded-lg px-3 py-1 text-xs font-bold transition-colors cursor-pointer",
                    selectedSemesterTab === secName && !selectedTeacherTab
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                  )}
                >
                  {secName}
                </button>
              ))}

              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-3 mr-1">
                Teacher View:
              </span>
              {Object.keys(generatedRoutine.teacher_routines || {}).map((tName) => (
                <button
                  key={tName}
                  onClick={() => {
                    setSelectedTeacherTab(tName);
                    setSelectedSemesterTab("");
                  }}
                  className={cn(
                    "rounded-lg px-3 py-1 text-xs font-bold transition-colors cursor-pointer",
                    selectedTeacherTab === tName
                      ? "bg-purple-600 text-white shadow-xs"
                      : "bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-950/50 dark:text-purple-300"
                  )}
                >
                  {tName}
                </button>
              ))}
            </div>

            {/* Semester Table Display */}
            {selectedSemesterTab && generatedRoutine.semester_routines[selectedSemesterTab] && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Weekly Schedule &mdash; {selectedSemesterTab} ({generatedRoutine.semester_routines[selectedSemesterTab].room_number})
                  </h4>
                  <span className="text-xs text-slate-500">
                    Room: {generatedRoutine.semester_routines[selectedSemesterTab].room_number}
                  </span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-center text-xs border-collapse">
                    <thead>
                      <tr className="bg-blue-600 text-white dark:bg-blue-900">
                        <th className="border border-blue-500 p-2 font-bold w-24">Day</th>
                        {periods.map((p, idx) => (
                          <th key={idx} className="border border-blue-500 p-2 font-bold min-w-[120px]">
                            {p.name}
                            <div className="text-[10px] font-normal opacity-80 mt-0.5">
                              {p.start_time} - {p.end_time}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {generatedRoutine.days.map((day: any) => {
                        const dayActiveCount = dayPeriodCounts[day.name] || periods.length;
                        const secEntries = generatedRoutine.semester_routines[selectedSemesterTab].entries;

                        return (
                          <tr key={day.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td className="border border-slate-200 bg-slate-100 p-2 font-bold text-slate-800 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200">
                              {day.name}
                            </td>
                            {periods.map((p, pIdx) => {
                              if (pIdx >= dayActiveCount) {
                                return (
                                  <td
                                    key={pIdx}
                                    className="border border-slate-200 bg-slate-100/50 p-2 text-slate-400 dark:border-slate-800 dark:bg-slate-800/30"
                                  >
                                    -
                                  </td>
                                );
                              }

                              if (p.type === "Break") {
                                return (
                                  <td
                                    key={pIdx}
                                    className="border border-slate-200 bg-amber-50 p-2 font-bold text-amber-800 dark:border-slate-800 dark:bg-amber-950/30 dark:text-amber-300"
                                  >
                                    [Break]
                                  </td>
                                );
                              }

                              const match = secEntries.find(
                                (e: any) => e.day_name === day.name && e.period_name === p.name
                              );

                              if (match) {
                                return (
                                  <td
                                    key={pIdx}
                                    className="border border-slate-200 p-2 bg-blue-50/70 dark:border-slate-800 dark:bg-blue-950/40"
                                  >
                                    <div className="font-bold text-slate-900 dark:text-white">
                                      {match.subject_name}
                                    </div>
                                    <div className="text-[11px] font-semibold text-blue-700 dark:text-blue-300 mt-0.5">
                                      {match.teacher_name}
                                    </div>
                                    <div className="text-[10px] text-slate-500 dark:text-slate-400">
                                      {match.room_number}
                                    </div>
                                  </td>
                                );
                              }

                              return (
                                <td
                                  key={pIdx}
                                  className="border border-slate-200 p-2 text-slate-400 dark:border-slate-800"
                                >
                                  -
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Teacher Master Schedule Display */}
            {selectedTeacherTab && generatedRoutine.teacher_routines[selectedTeacherTab] && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-purple-900 dark:text-purple-300">
                      Faculty Schedule &mdash; {selectedTeacherTab}
                    </h4>
                    <p className="text-xs text-slate-500">
                      Speciality: {generatedRoutine.teacher_routines[selectedTeacherTab].speciality} &bull; Free Time: {generatedRoutine.teacher_routines[selectedTeacherTab].free_time}
                    </p>
                  </div>
                  <span className="rounded-full bg-purple-50 px-2.5 py-1 text-xs font-bold text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                    Total Classes: {generatedRoutine.teacher_routines[selectedTeacherTab].entries.length} hrs
                  </span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-center text-xs border-collapse">
                    <thead>
                      <tr className="bg-purple-700 text-white dark:bg-purple-900">
                        <th className="border border-purple-600 p-2 font-bold w-24">Day</th>
                        {periods.map((p, idx) => (
                          <th key={idx} className="border border-purple-600 p-2 font-bold min-w-[120px]">
                            {p.name}
                            <div className="text-[10px] font-normal opacity-80 mt-0.5">
                              {p.start_time} - {p.end_time}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {generatedRoutine.days.map((day: any) => {
                        const dayActiveCount = dayPeriodCounts[day.name] || periods.length;
                        const tEntries = generatedRoutine.teacher_routines[selectedTeacherTab].entries;

                        return (
                          <tr key={day.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td className="border border-slate-200 bg-slate-100 p-2 font-bold text-slate-800 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200">
                              {day.name}
                            </td>
                            {periods.map((p, pIdx) => {
                              if (pIdx >= dayActiveCount) {
                                return (
                                  <td
                                    key={pIdx}
                                    className="border border-slate-200 bg-slate-100/50 p-2 text-slate-400 dark:border-slate-800 dark:bg-slate-800/30"
                                  >
                                    -
                                  </td>
                                );
                              }

                              if (p.type === "Break") {
                                return (
                                  <td
                                    key={pIdx}
                                    className="border border-slate-200 bg-amber-50 p-2 font-bold text-amber-800 dark:border-slate-800 dark:bg-amber-950/30 dark:text-amber-300"
                                  >
                                    [Break]
                                  </td>
                                );
                              }

                              const match = tEntries.find(
                                (e: any) => e.day_name === day.name && e.period_name === p.name
                              );

                              if (match) {
                                return (
                                  <td
                                    key={pIdx}
                                    className="border border-slate-200 p-2 bg-purple-50/80 dark:border-slate-800 dark:bg-purple-950/40"
                                  >
                                    <div className="font-bold text-purple-950 dark:text-purple-100">
                                      {match.subject_name}
                                    </div>
                                    <div className="text-[11px] font-semibold text-purple-700 dark:text-purple-300 mt-0.5">
                                      {match.section_name}
                                    </div>
                                    <div className="text-[10px] text-slate-500 dark:text-slate-400">
                                      {match.room_number}
                                    </div>
                                  </td>
                                );
                              }

                              return (
                                <td
                                  key={pIdx}
                                  className="border border-slate-200 p-2 text-emerald-600/70 font-semibold bg-emerald-50/30 dark:border-slate-800 dark:text-emerald-400/70 dark:bg-emerald-950/20"
                                >
                                  [Free]
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
