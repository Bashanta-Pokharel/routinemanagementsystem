"use client";

import React, { useState } from "react";
import { 
  Sparkles, Plus, Trash2, Clock, Calendar, CheckCircle2, 
  Printer, Download, ArrowRight, User, BookOpen, Layers, Coffee, Zap
} from "lucide-react";
import confetti from "canvas-confetti";
import { fetchApi } from "@/lib/api";
import { cn } from "@/lib/utils";

interface SubjectRow {
  id: string;
  name: string;
  weekly_periods: number;
  teacher_name: string;
  free_time_start: string;
  free_time_end: string;
}

export function SimpleRoutineWizard() {
  const [className, setClassName] = useState("BCA 1st Semester");
  const [routineTitle, setRoutineTitle] = useState("BCA 1st Sem Weekly Routine");
  const [selectedDays, setSelectedDays] = useState<string[]>([
    "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"
  ]);

  const [periods, setPeriods] = useState([
    { name: "Period 1", start_time: "10:00 AM", end_time: "11:00 AM", type: "Teaching" },
    { name: "Period 2", start_time: "11:00 AM", end_time: "12:00 PM", type: "Teaching" },
    { name: "Break / Recess", start_time: "12:00 PM", end_time: "12:30 PM", type: "Break" },
    { name: "Period 3", start_time: "12:30 PM", end_time: "01:30 PM", type: "Teaching" },
    { name: "Period 4", start_time: "01:30 PM", end_time: "02:30 PM", type: "Teaching" },
    { name: "Period 5", start_time: "02:30 PM", end_time: "03:30 PM", type: "Teaching" },
  ]);

  const [subjects, setSubjects] = useState<SubjectRow[]>([
    {
      id: "1",
      name: "C Programming",
      weekly_periods: 4,
      teacher_name: "Bashanta",
      free_time_start: "01:00 PM",
      free_time_end: "03:30 PM",
    },
    {
      id: "2",
      name: "Mathematics I (Calculus)",
      weekly_periods: 4,
      teacher_name: "Prof. Sita Rai",
      free_time_start: "10:00 AM",
      free_time_end: "12:00 PM",
    },
    {
      id: "3",
      name: "Digital Logic Systems",
      weekly_periods: 4,
      teacher_name: "Er. Hari Thapa",
      free_time_start: "11:00 AM",
      free_time_end: "01:30 PM",
    },
    {
      id: "4",
      name: "Computer Fundamentals",
      weekly_periods: 4,
      teacher_name: "Ramesh Joshi",
      free_time_start: "10:00 AM",
      free_time_end: "03:30 PM",
    },
    {
      id: "5",
      name: "Society and Technology",
      weekly_periods: 3,
      teacher_name: "Anita Shrestha",
      free_time_start: "10:00 AM",
      free_time_end: "03:30 PM",
    },
    {
      id: "6",
      name: "English I",
      weekly_periods: 3,
      teacher_name: "Pooja Adhikari",
      free_time_start: "10:00 AM",
      free_time_end: "03:30 PM",
    },
  ]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedRoutine, setGeneratedRoutine] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const allAvailableDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      if (selectedDays.length <= 1) return;
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleAddSubject = () => {
    const newId = String(subjects.length + 1);
    setSubjects([
      ...subjects,
      {
        id: newId,
        name: `Subject ${newId}`,
        weekly_periods: 4,
        teacher_name: `Teacher ${newId}`,
        free_time_start: "10:00 AM",
        free_time_end: "03:30 PM",
      },
    ]);
  };

  const handleRemoveSubject = (id: string) => {
    if (subjects.length <= 1) return;
    setSubjects(subjects.filter((s) => s.id !== id));
  };

  const handleUpdateSubject = (id: string, field: keyof SubjectRow, value: any) => {
    setSubjects(
      subjects.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const handleCalculateRoutine = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const payload = {
        class_name: className,
        routine_title: routineTitle,
        days: selectedDays,
        periods: periods,
        subjects: subjects.map((s) => ({
          name: s.name,
          weekly_periods: s.weekly_periods,
          teacher_name: s.teacher_name,
          free_time_start: s.free_time_start,
          free_time_end: s.free_time_end,
          free_days: selectedDays,
        })),
      };

      const result = await fetchApi<any>("/timetable/quick-wizard", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setGeneratedRoutine(result);
      confetti({
        particleCount: 100,
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

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Simple Routine Builder
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              Enter class subjects, weekly periods, and teacher available time intervals (e.g. <i>Bashanta teaches C Programming, free between 01:00 PM – 03:30 PM</i>). The system calculates a conflict-free routine and saves it to MySQL (XAMPP).
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-300">
              MySQL XAMPP Ready
            </span>
          </div>
        </div>
      </div>

      {/* Input Configuration Container */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-5">
        {/* Step 1: Class and Working Days */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2 dark:border-slate-800">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-xs">
              1
            </span>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Class Name & Working Days
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Class / Section Name
              </label>
              <input
                type="text"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="e.g. BCA 1st Semester"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Routine Title
              </label>
              <input
                type="text"
                value={routineTitle}
                onChange={(e) => setRoutineTitle(e.target.value)}
                placeholder="e.g. BCA 1st Sem Weekly Routine"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Active College Days
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
                      "rounded-xl px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer",
                      isSelected
                        ? "bg-blue-600 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400"
                    )}
                  >
                    {day} {isSelected && "✓"}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Step 2: Daily Period Timings */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-xs">
                2
              </span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Daily Period Slots & Timings
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
            {periods.map((p, idx) => (
              <div
                key={idx}
                className={cn(
                  "rounded-2xl border p-3 text-xs flex flex-col justify-between",
                  p.type === "Break"
                    ? "border-amber-200 bg-amber-50/50 dark:border-amber-900/40 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200"
                    : "border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/40 text-slate-900 dark:text-slate-100"
                )}
              >
                <div>
                  <div className="font-bold">{p.name}</div>
                  <div className="text-[11px] opacity-75 mt-0.5">
                    {p.start_time} &ndash; {p.end_time}
                  </div>
                </div>
                <span className="mt-2 text-[9px] font-bold uppercase tracking-wider opacity-60">
                  {p.type}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Step 3: Subjects & Teacher Free Times */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-xs">
                3
              </span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Subjects, Weekly Periods & Teacher Free Time Intervals
              </h3>
            </div>
            <button
              type="button"
              onClick={handleAddSubject}
              className="flex items-center gap-1 rounded-xl bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 dark:bg-blue-950/50 dark:text-blue-300 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Subject
            </button>
          </div>

          <div className="space-y-2.5">
            {subjects.map((s, idx) => (
              <div
                key={s.id}
                className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-800/40 sm:grid-cols-12 items-center"
              >
                <div className="sm:col-span-4">
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Subject Name ({idx + 1})
                  </label>
                  <input
                    type="text"
                    value={s.name}
                    onChange={(e) => handleUpdateSubject(s.id, "name", e.target.value)}
                    placeholder="e.g. C Programming"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Periods / Week
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={s.weekly_periods}
                    onChange={(e) => handleUpdateSubject(s.id, "weekly_periods", parseInt(e.target.value) || 1)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none text-center"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Assigned Teacher
                  </label>
                  <input
                    type="text"
                    value={s.teacher_name}
                    onChange={(e) => handleUpdateSubject(s.id, "teacher_name", e.target.value)}
                    placeholder="e.g. Bashanta"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Teacher Free Hours
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={s.free_time_start}
                      onChange={(e) => handleUpdateSubject(s.id, "free_time_start", e.target.value)}
                      placeholder="01:00 PM"
                      className="w-1/2 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none text-center"
                    />
                    <span className="text-slate-400 text-xs">-</span>
                    <input
                      type="text"
                      value={s.free_time_end}
                      onChange={(e) => handleUpdateSubject(s.id, "free_time_end", e.target.value)}
                      placeholder="03:30 PM"
                      className="w-1/2 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none text-center"
                    />
                  </div>
                </div>

                <div className="sm:col-span-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleRemoveSubject(s.id)}
                    className="rounded-lg p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                    title="Remove Subject"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-300">
            {error}
          </div>
        )}

        {/* Generate Button */}
        <div className="flex justify-end pt-3">
          <button
            type="button"
            onClick={handleCalculateRoutine}
            disabled={isGenerating}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-6 py-3.5 text-xs font-bold text-white shadow-lg shadow-blue-500/25 hover:from-blue-700 hover:to-indigo-700 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
          >
            {isGenerating ? (
              <>
                <Zap className="h-4 w-4 animate-spin" />
                Calculating Teacher Free Time Slots & Routine...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Calculate & Generate Routine (Saved to DB)
              </>
            )}
          </button>
        </div>
      </div>

      {/* Generated Routine Table Result */}
      {generatedRoutine && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Generated Routine for {generatedRoutine.class_name}
                </h3>
              </div>
              <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                ✓ 0 Conflicts &bull; All teacher free hours respected &bull; Saved to Database #{generatedRoutine.timetable_id}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5" />
                Print Routine
              </button>
              <a
                href={`http://localhost:8000/api/timetable/${generatedRoutine.timetable_id}/export/excel`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                Export Excel
              </a>
            </div>
          </div>

          {/* Routine Table Grid */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full border-collapse text-left text-xs min-w-[700px]">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 dark:bg-slate-800/60 dark:border-slate-800">
                  <th className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300 w-32 border-r border-slate-200 dark:border-slate-800 uppercase tracking-wider text-[11px]">
                    Day / Time
                  </th>
                  {periods.map((p, idx) => (
                    <th
                      key={idx}
                      className="py-3 px-3 font-bold text-slate-700 dark:text-slate-300 text-center border-r border-slate-200 dark:border-slate-800 last:border-r-0"
                    >
                      <div className="text-[11px]">{p.name}</div>
                      <div className="text-[9px] font-normal text-slate-400">
                        {p.start_time} - {p.end_time}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {selectedDays.map((dayName) => (
                  <tr key={dayName} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white bg-slate-50/70 dark:bg-slate-800/40 border-r border-slate-200 dark:border-slate-800">
                      {dayName}
                    </td>

                    {periods.map((p, pIdx) => {
                      if (p.type === "Break") {
                        return (
                          <td
                            key={pIdx}
                            className="p-2 text-center bg-amber-50/60 text-amber-800 dark:bg-amber-950/20 dark:text-amber-300 border-r border-slate-200 dark:border-slate-800 last:border-r-0"
                          >
                            <span className="text-[10px] font-bold">☕ {p.name}</span>
                          </td>
                        );
                      }

                      // Find matching scheduled class for this day & period timing
                      const match = (generatedRoutine.entries || []).find(
                        (e: any) => e.day_name === dayName && e.period_name === p.name
                      );

                      return (
                        <td
                          key={pIdx}
                          className="p-2.5 align-top border-r border-slate-200 dark:border-slate-800 last:border-r-0"
                        >
                          {match ? (
                            <div className="rounded-xl border border-blue-200 bg-blue-50/80 p-2 text-xs dark:border-blue-900/40 dark:bg-blue-950/30 shadow-2xs">
                              <div className="font-bold text-slate-900 dark:text-white text-[11px] leading-tight">
                                {match.subject_name}
                              </div>
                              <div className="mt-1 flex items-center gap-1 text-[10px] font-medium text-blue-700 dark:text-blue-300">
                                <User className="h-3 w-3 shrink-0" />
                                <span>{match.teacher_name}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex h-12 items-center justify-center rounded-lg text-[10px] text-slate-300 dark:text-slate-600">
                              - Free -
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
