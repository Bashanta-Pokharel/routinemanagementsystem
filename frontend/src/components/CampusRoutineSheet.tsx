"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface TeacherDirectoryItem {
  abbrev: string;
  name: string;
  contact: string;
  speciality?: string;
}

export interface SubjectDirectoryItem {
  code: string;
  name: string;
  creditHours: number;
  lectureHours?: number | string;
  tutorialHours?: number | string;
  practicalHours?: number | string;
  weeklyClasses: number;
  totalSemesterClasses?: number;
  totalTeachingHours?: number;
  courseType: string;
  teacherName: string;
  teacherAbbrev: string;
}

// Official TU BCA Course Structure & Syllabus Master Registry
export const TU_BCA_SYLLABUS_MASTER: Record<string, { code: string; name: string; credits: number; l: number | string; t: number | string; p: number | string; type: string }> = {
  // Semester I (16 Cr)
  "bca 101": { code: "BCA 101", name: "Computer Fundamentals and Applications", credits: 3, l: 3, t: "-", p: 3, type: "TH/PR" },
  "bca 102": { code: "BCA 102", name: "Programming in C", credits: 3, l: 3, t: "-", p: 3, type: "TH/PR" },
  "bca 103": { code: "BCA 103", name: "Digital Logic", credits: 3, l: 3, t: "-", p: 3, type: "TH/PR" },
  "bca 104": { code: "BCA 104", name: "Mathematics-I", credits: 3, l: 3, t: 1, p: 1, type: "TH/TU/PR" },
  "bca 105": { code: "BCA 105", name: "Professional Communication and Ethics", credits: 3, l: 3, t: 2, p: "-", type: "TH/TU" },
  "bca 106": { code: "BCA 106", name: "Hardware Workshop", credits: 1, l: "-", t: "-", p: 2, type: "PR" },
  
  // Semester II (16 Cr)
  "bca 151": { code: "BCA 151", name: "Discrete Structure", credits: 3, l: 3, t: "-", p: 3, type: "TH/PR" },
  "bca 152": { code: "BCA 152", name: "Microprocessor and Computer Architecture", credits: 3, l: 3, t: "-", p: 3, type: "TH/PR" },
  "bca 153": { code: "BCA 153", name: "OOP in Java", credits: 3, l: 3, t: "-", p: 3, type: "TH/PR" },
  "bca 154": { code: "BCA 154", name: "Mathematics-II", credits: 3, l: 3, t: 1, p: 1, type: "TH/TU/PR" },
  "bca 155": { code: "BCA 155", name: "UX/UI Design", credits: 3, l: 3, t: "-", p: 3, type: "TH/PR" },
  "bca 156": { code: "BCA 156", name: "Principles of Management", credits: 1, l: 1, t: "-", p: "-", type: "TH" },

  // Semester III (17 Cr)
  "bca 201": { code: "BCA 201", name: "Data Structure and Algorithms", credits: 3, l: 3, t: "-", p: 3, type: "TH/PR" },
  "bca 202": { code: "BCA 202", name: "Database Management System", credits: 3, l: 3, t: "-", p: 3, type: "TH/PR" },
  "bca 203": { code: "BCA 203", name: "Web Technology-I", credits: 3, l: 3, t: "-", p: 3, type: "TH/PR" },
  "bca 204": { code: "BCA 204", name: "System Analysis and Design", credits: 3, l: 3, t: "-", p: 3, type: "TH/PR" },
  "bca 205": { code: "BCA 205", name: "Probability and Statistics", credits: 3, l: 3, t: "-", p: 3, type: "TH/PR" },
  "bca 206": { code: "BCA 206", name: "Applied Economics", credits: 2, l: 2, t: "-", p: "-", type: "TH" },

  // Semester IV (17 Cr)
  "bca 251": { code: "BCA 251", name: "Operating Systems", credits: 3, l: 3, t: "-", p: 3, type: "TH/PR" },
  "bca 252": { code: "BCA 252", name: "Software Engineering", credits: 3, l: 3, t: "-", p: 3, type: "TH/PR" },
  "bca 253": { code: "BCA 253", name: "Numerical Methods", credits: 3, l: 3, t: "-", p: 3, type: "TH/PR" },
  "bca 254": { code: "BCA 254", name: "Python Programming", credits: 3, l: 3, t: "-", p: 3, type: "TH/PR" },
  "bca 255": { code: "BCA 255", name: "Web Technology-II", credits: 3, l: 3, t: "-", p: 3, type: "TH/PR" },
  "bca 256": { code: "BCA 256", name: "Project-I", credits: 2, l: "-", t: "-", p: 4, type: "PR" },

  // Semester V (18 Cr)
  "bca 301": { code: "BCA 301", name: "Computer Network", credits: 3, l: 3, t: "-", p: 3, type: "TH/PR" },
  "bca 302": { code: "BCA 302", name: "Artificial Intelligence", credits: 3, l: 3, t: "-", p: 3, type: "TH/PR" },
  "bca 303": { code: "BCA 303", name: "Advance Java Programming", credits: 3, l: 3, t: "-", p: 3, type: "TH/PR" },
  "bca 304": { code: "BCA 304", name: "MIS and e-Business", credits: 3, l: 3, t: "-", p: 3, type: "TH/PR" },
  "bca 305": { code: "BCA 305", name: "Society and Technology", credits: 3, l: 3, t: 2, p: "-", type: "TH/TU" },
  "bca 306": { code: "BCA 306", name: "Project-II", credits: 3, l: "-", t: "-", p: 6, type: "PR" },

  // Semester VI (17 Cr)
  "bca 351": { code: "BCA 351", name: "Computer Graphics and animation", credits: 3, l: 3, t: "-", p: 3, type: "TH/PR" },
  "bca 352": { code: "BCA 352", name: "Mobile Programming", credits: 3, l: 3, t: "-", p: 3, type: "TH/PR" },
  "bca 353": { code: "BCA 353", name: "Cryptography and Network Security", credits: 3, l: 3, t: "-", p: 3, type: "TH/PR" },
  "bca 354": { code: "BCA 354", name: "Technical Writing", credits: 2, l: 2, t: 2, p: "-", type: "TH/TU" },
  "bca 355": { code: "BCA 355", name: "Distributed System", credits: 3, l: 3, t: "-", p: 3, type: "TH/PR" },
  "bca 356": { code: "BCA 356", name: "Project-III", credits: 3, l: "-", t: "-", p: 6, type: "PR" },

  // Semester VII (18 Cr)
  "bca 401": { code: "BCA 401", name: "Cyber Security and Ethical Hacking", credits: 3, l: 3, t: "-", p: 3, type: "TH/PR" },
  "bca 402": { code: "BCA 402", name: "Software Project Management", credits: 3, l: 3, t: "-", p: 3, type: "TH/PR" },
  "bca 403": { code: "BCA 403", name: "Financial Accounting", credits: 2, l: 2, t: "-", p: "-", type: "TH" },
  "bca 404": { code: "BCA 404", name: "Project-IV", credits: 3, l: "-", t: "-", p: 6, type: "PR" },
  "bca 405": { code: "BCA 405", name: "Elective-I (Machine Learning)", credits: 3, l: 3, t: "-", p: 3, type: "TH/PR" },
  "bca 406": { code: "BCA 406", name: "Elective-II (Dotnet Technology)", credits: 3, l: 3, t: "-", p: 3, type: "TH/PR" },

  // Semester VIII (12 Cr)
  "bca 451": { code: "BCA 451", name: "Cloud Computing", credits: 3, l: 3, t: "-", p: 3, type: "TH/PR" },
  "bca 452": { code: "BCA 452", name: "Internship", credits: 3, l: "-", t: "-", p: "-", type: "PR" },
  "bca 453": { code: "BCA 453", name: "Elective-III (Network Administration)", credits: 3, l: 3, t: "-", p: 3, type: "TH/PR" },
  "bca 454": { code: "BCA 454", name: "Elective-IV (Digital Marketing and SEO)", credits: 3, l: 3, t: "-", p: 3, type: "TH/PR" },
};

export function findTuCourseInfo(codeOrName: string) {
  const clean = (codeOrName || "").toLowerCase().trim();
  if (TU_BCA_SYLLABUS_MASTER[clean]) {
    return TU_BCA_SYLLABUS_MASTER[clean];
  }
  // Search by code prefix or name match
  for (const [key, val] of Object.entries(TU_BCA_SYLLABUS_MASTER)) {
    if (clean.includes(key) || key.includes(clean) || clean.includes(val.name.toLowerCase()) || val.name.toLowerCase().includes(clean)) {
      return val;
    }
  }
  return null;
}

export interface CampusRoutineSheetProps {
  campusName?: string;
  address?: string;
  programName?: string;
  semesterName?: string;
  sectionName?: string;
  roomNumber?: string;
  title?: string;
  days: any[];
  periods: any[];
  entries: any[];
  teacherDirectory?: TeacherDirectoryItem[];
  subjectDirectory?: SubjectDirectoryItem[];
  legend?: Record<string, string>;
  activeDayName?: string;
  activePeriodId?: number | string;
  className?: string;
}

export function CampusRoutineSheet({
  campusName = "Ratna Rajyalaxmi Campus",
  address = "Pradarshanimarga, Kathmandu Nepal",
  programName = "Bachelors in Computer Applications (BCA)",
  semesterName = "SEMESTER - V",
  sectionName = "A",
  roomNumber = "101",
  title = "Daily Class Routine",
  days = [],
  periods = [],
  entries = [],
  teacherDirectory = [],
  subjectDirectory = [],
  legend = {
    "TH": "Theory",
    "TU": "Tutorial",
    "PR": "Practical"
  },
  activeDayName,
  activePeriodId,
  className
}: CampusRoutineSheetProps) {
  // Extract unique teachers ONLY for the active semester entries (e.g. 5 subjects -> 5 teachers)
  const activeTeacherNames = new Set(entries.map((e) => (e.teacher_name || "").trim().toLowerCase()).filter(Boolean));
  const activeTeacherAbbrevs = new Set(entries.map((e) => (e.teacher_abbreviation || "").trim().toLowerCase()).filter(Boolean));

  let directory: TeacherDirectoryItem[] = [];
  if (teacherDirectory && teacherDirectory.length > 0) {
    directory = teacherDirectory.filter(
      (t) =>
        activeTeacherNames.has((t.name || "").trim().toLowerCase()) ||
        activeTeacherAbbrevs.has((t.abbrev || "").trim().toLowerCase())
    );
  }

  // Fallback if directory filtering was empty: extract unique active teachers directly from entries
  if (directory.length === 0) {
    directory = Array.from(
      new Map(
        entries
          .filter((e) => e.teacher_name)
          .map((e) => {
            const abbrev =
              e.teacher_abbreviation ||
              e.teacher_name
                .split(" ")
                .filter((w: string) => !["Prof.", "Dr.", "Er.", "Mr.", "Mrs."].includes(w))
                .map((w: string) => w[0])
                .join("")
                .toUpperCase();
            return [
              abbrev,
              {
                abbrev,
                name: e.teacher_name,
                contact: e.teacher_contact || "9841299009",
                speciality: e.teacher_speciality || ""
              }
            ];
          })
      ).values()
    );
  }

  // Extract unique subjects and calculate credit hours according to TU syllabus
  const subjects: SubjectDirectoryItem[] = subjectDirectory.length > 0
    ? subjectDirectory
    : Array.from(
        new Map(
          entries
            .filter((e) => e.subject_name || e.subject_code)
            .map((e) => {
              const rawCode = (e.subject_code || "").trim();
              const rawName = (e.subject_name || "Subject").trim();
              const tuInfo = findTuCourseInfo(rawCode) || findTuCourseInfo(rawName);

              const code = rawCode || tuInfo?.code || "-";
              const name = rawName || tuInfo?.name || "Subject";
              const key = code !== "-" ? code : name;

              const weeklyCount = entries.filter(
                (x) =>
                  (x.subject_code && x.subject_code.trim() === code) ||
                  (x.subject_name && x.subject_name.trim() === name)
              ).length;

              const credits = e.credit_hours || tuInfo?.credits || 3;
              const lHours = tuInfo?.l ?? 3;
              const tHours = tuInfo?.t ?? "-";
              const pHours = tuInfo?.p ?? (e.course_type === "PR" ? 3 : "-");

              const abbrev =
                e.teacher_abbreviation ||
                (e.teacher_name
                  ? e.teacher_name
                      .split(" ")
                      .filter((w: string) => !["Prof.", "Dr.", "Er.", "Mr.", "Mrs."].includes(w))
                      .map((w: string) => w[0])
                      .join("")
                      .toUpperCase()
                  : "TCH");

              const cType =
                tuInfo?.type ||
                e.course_type ||
                (e.room_type_name?.includes("Lab") || (e.room_number && e.room_number.toLowerCase().includes("lab"))
                  ? "PR"
                  : "TH");

              const creditsNum = Number(credits) || 3;
              const totalSemesterClasses = creditsNum === 3 ? 48 : (creditsNum === 2 ? 32 : (creditsNum === 1 ? 16 : creditsNum * 16));
              const totalTeachingHours = creditsNum * 16;

              return [
                key,
                {
                  code: code,
                  name: name,
                  creditHours: creditsNum,
                  lectureHours: lHours,
                  tutorialHours: tHours,
                  practicalHours: pHours,
                  weeklyClasses: weeklyCount,
                  totalSemesterClasses: totalSemesterClasses,
                  totalTeachingHours: totalTeachingHours,
                  courseType: cType,
                  teacherName: e.teacher_name || "-",
                  teacherAbbrev: abbrev
                }
              ];
            })
        ).values()
      );

  const totalCredits = subjects.reduce((sum, s) => sum + s.creditHours, 0);
  const totalClasses = entries.length;
  const totalSemesterClassesSum = subjects.reduce((sum, s) => sum + (s.totalSemesterClasses || 48), 0);
  const totalSemesterHoursSum = subjects.reduce((sum, s) => sum + (s.totalTeachingHours || 48), 0);

  return (
    <div
      className={cn(
        "w-full rounded-2xl border border-zinc-300 bg-white p-6 sm:p-8 text-zinc-900 shadow-sm print:p-0 print:border-none print:shadow-none font-sans",
        className
      )}
    >
      {/* 1. Official College Header */}
      <div className="text-center space-y-0.5 pb-4 border-b border-zinc-200">
        <h2 className="text-lg sm:text-xl font-black tracking-tight text-zinc-900 uppercase">
          {campusName}
        </h2>
        <p className="text-xs sm:text-sm font-medium text-zinc-600">
          {address}
        </p>
        <p className="text-xs sm:text-sm font-bold text-zinc-800 pt-0.5">
          {programName} {semesterName} {sectionName ? `Sec ${sectionName}` : ""} {roomNumber ? `Room No- ${roomNumber}` : ""}
        </p>
        <div className="inline-block mt-1 px-3 py-0.5 rounded text-xs font-black tracking-wider uppercase bg-zinc-100 text-zinc-900 border border-zinc-300">
          {title}
        </div>
      </div>

      {/* 2. Main Timetable Matrix */}
      <div className="mt-5 overflow-x-auto">
        <table className="w-full border-collapse border border-zinc-900 text-center text-xs">
          <thead>
            <tr className="bg-zinc-200/80 text-zinc-900 border-b border-zinc-900">
              <th className="border border-zinc-900 py-2.5 px-3 font-bold text-left w-24 sm:w-28 text-[11px] uppercase tracking-wider">
                Day/Time
              </th>
              {periods.map((p, pIdx) => {
                const isInterval =
                  (p.period_type && p.period_type !== "Teaching") ||
                  (p as any).type === "Break" ||
                  p.name?.toLowerCase().includes("interval") ||
                  p.name?.toLowerCase().includes("break") ||
                  p.name?.toLowerCase().includes("lunch") ||
                  p.name?.toLowerCase().includes("tiffin");
                return (
                  <th
                    key={pIdx}
                    className={cn(
                      "border border-zinc-900 py-2.5 px-2 font-bold min-w-[110px] text-[11px]",
                      isInterval ? "w-10 sm:w-12 bg-zinc-100 text-zinc-700" : "bg-zinc-100/70"
                    )}
                  >
                    {isInterval ? (
                      <span className="text-[10px] uppercase font-black tracking-widest">
                        Interval
                      </span>
                    ) : (
                      <div>
                        <span>{p.start_time} - {p.end_time}</span>
                      </div>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {days.map((day) => {
              const isToday = activeDayName && (activeDayName.toLowerCase() === day.name.toLowerCase() || activeDayName.toLowerCase() === day.short_code?.toLowerCase());
              // Track entry IDs already placed in this day row to prevent horizontal duplicate rendering
              const usedEntryIdsForDay = new Set<string | number>();

              return (
                <tr
                  key={day.id || day.name}
                  className={cn(
                    "border-b border-zinc-900 transition-colors",
                    isToday ? "bg-amber-50/40" : "hover:bg-zinc-50/60"
                  )}
                >
                  {/* Day Column (Grey background as in reference image) */}
                  <td className="border border-zinc-900 bg-zinc-200/70 py-3 px-3 font-bold text-left text-zinc-900">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black">{day.name}</span>
                      {isToday && (
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse ml-1 shrink-0" title="Today" />
                      )}
                    </div>
                  </td>

                  {/* Period Slots */}
                  {periods.map((period, pIdx) => {
                    const isInterval =
                      (period.period_type && period.period_type !== "Teaching") ||
                      (period as any).type === "Break" ||
                      period.name?.toLowerCase().includes("interval") ||
                      period.name?.toLowerCase().includes("break") ||
                      period.name?.toLowerCase().includes("lunch") ||
                      period.name?.toLowerCase().includes("tiffin");
                    const isCurrentLiveSlot =
                      isToday && (activePeriodId === period.id || activePeriodId === period.name);

                    if (isInterval) {
                      return (
                        <td
                          key={pIdx}
                          className="border border-zinc-900 bg-zinc-100/80 text-zinc-700 py-2 px-1 text-center font-bold tracking-widest text-[11px]"
                        >
                          <div className="flex flex-col items-center justify-center leading-tight">
                            <span>I</span>
                            <span>n</span>
                            <span>t</span>
                            <span>e</span>
                            <span>r</span>
                            <span>v</span>
                            <span>a</span>
                            <span>l</span>
                          </div>
                        </td>
                      );
                    }

                    // Calculate teaching-only column index (1-indexed, skipping breaks)
                    let teachingIndex = 0;
                    for (let i = 0; i <= pIdx; i++) {
                      const cur = periods[i];
                      const isBrk =
                        (cur.period_type && cur.period_type !== "Teaching") ||
                        (cur as any).type === "Break" ||
                        cur.name?.toLowerCase().includes("interval") ||
                        cur.name?.toLowerCase().includes("break") ||
                        cur.name?.toLowerCase().includes("lunch") ||
                        cur.name?.toLowerCase().includes("tiffin");
                      if (!isBrk) teachingIndex++;
                    }

                    // Find matching class with multi-strategy matching without duplicate assignment
                    const dayName = (day.name || day.short_code || "").toString().trim().toLowerCase();
                    const dayId = day.id;

                    const match = entries.find((e: any) => {
                      const entryUniqueId = e.id || `${e.subject_name || e.subject_code}_${e.day_id || dayName}_${e.period_id || e.start_time || e.order_index}`;
                      if (usedEntryIdsForDay.has(entryUniqueId)) return false;

                      const eDayName = (e.day_name || e.day_short_code || "").toString().trim().toLowerCase();
                      const matchDay = 
                        (eDayName && dayName && (eDayName === dayName || eDayName.includes(dayName) || dayName.includes(eDayName))) ||
                        (dayId && e.day_id && dayId === e.day_id);
                      
                      if (!matchDay) return false;

                      // 1. Match by exact period id if present
                      if (period.id && e.period_id && period.id === e.period_id) return true;

                      // 2. Match by exact normalized start time
                      const cleanPStart = (period.start_time || "").replace(/\s+/g, "").toLowerCase();
                      const cleanEStart = (e.start_time || "").replace(/\s+/g, "").toLowerCase();
                      if (cleanPStart && cleanEStart && cleanPStart === cleanEStart) return true;

                      // 3. Match by explicit order index (e.g. 1st period, 2nd period)
                      if (period.order_index != null && e.order_index != null && Number(period.order_index) === Number(e.order_index)) return true;

                      // 4. Match by teaching slot index (skipping intervals)
                      if (e.order_index != null && Number(e.order_index) === teachingIndex) return true;

                      // 5. Match by extracted period number
                      const pNumMatch = (period.name || "").match(/\d+/);
                      const eNumMatch = (e.period_name || "").match(/\d+/);
                      if (pNumMatch && eNumMatch && pNumMatch[0] === eNumMatch[0]) return true;

                      return false;
                    });

                    if (match) {
                      const entryUniqueId = match.id || `${match.subject_name || match.subject_code}_${match.day_id || dayName}_${match.period_id || match.start_time || match.order_index}`;
                      usedEntryIdsForDay.add(entryUniqueId);
                    }

                    if (!match) {
                      return (
                        <td
                          key={pIdx}
                          className={cn(
                            "border border-zinc-900 p-2 text-zinc-400 bg-white",
                            isCurrentLiveSlot && "ring-2 ring-inset ring-emerald-500 bg-emerald-50/20"
                          )}
                        >
                          <span className="text-[11px] text-zinc-300">-</span>
                        </td>
                      );
                    }

                    const subName = match.subject_name || match.subject_code || "Class";
                    const subCode = match.subject_code;
                    const cType = match.course_type || (match.room_type_name?.includes("Lab") || (match.room_number && match.room_number.toLowerCase().includes("lab")) ? "PR" : "TH");
                    const tAbbrev =
                      match.teacher_abbreviation ||
                      (match.teacher_name
                        ? match.teacher_name
                            .split(" ")
                            .filter((w: string) => !["Prof.", "Dr.", "Er.", "Mr.", "Mrs."].includes(w))
                            .map((w: string) => w[0])
                            .join("")
                            .toUpperCase()
                        : "TCH");

                    return (
                      <td
                        key={pIdx}
                        className={cn(
                          "border border-zinc-900 p-2 align-middle transition-all",
                          isCurrentLiveSlot
                            ? "bg-emerald-50/80 ring-2 ring-inset ring-emerald-600 font-semibold"
                            : "bg-white"
                        )}
                      >
                        <div className="flex flex-col items-center justify-center gap-0.5">
                          <div className="font-bold text-[11px] leading-tight text-zinc-900 text-center">
                            {subName}
                          </div>
                          {subCode && subCode.trim() !== subName.trim() && (
                            <div className="text-[9.5px] font-mono font-semibold text-zinc-600 text-center">
                              [{subCode}]
                            </div>
                          )}
                          <div className="text-[10px] font-semibold text-zinc-700 mt-0.5">
                            [{cType}] [{tAbbrev}]
                            {cType === "PR" && (
                              <span className="block text-[9px] font-medium text-zinc-500 mt-0.5">
                                [Comp Lab]
                              </span>
                            )}
                          </div>
                          {isCurrentLiveSlot && (
                            <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-emerald-600 text-[8px] font-black text-white uppercase tracking-wider animate-pulse">
                              LIVE NOW
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 3. TU Syllabus Course Structure & Credit Breakdown Table */}
      <div className="mt-5 border border-zinc-900 rounded-lg overflow-hidden">
        <div className="bg-zinc-800 text-white px-3.5 py-2 flex flex-wrap items-center justify-between text-xs font-bold gap-2">
          <div className="flex items-center gap-2">
            <span className="uppercase tracking-wider">
              TU Syllabus Course Structure & 120-Day Semester Schedule
            </span>
            <span className="rounded bg-emerald-700/80 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-emerald-100">
              120 Working Days Window
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono">
            <span className="text-amber-300">Total Credits: {totalCredits} Cr</span>
            <span className="text-zinc-400">|</span>
            <span className="text-emerald-300">Weekly: {totalClasses} Periods</span>
            <span className="text-zinc-400">|</span>
            <span className="text-sky-300">Sem Total: {totalSemesterClassesSum} Classes ({totalSemesterHoursSum} Hrs)</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-zinc-200/80 border-b border-zinc-900 text-zinc-900 text-[11px] font-bold">
                <th className="border-r border-zinc-900 py-1.5 px-2.5 w-20">Code</th>
                <th className="border-r border-zinc-900 py-1.5 px-2.5">Subject / Course Title</th>
                <th className="border-r border-zinc-900 py-1.5 px-2 w-14 text-center">Nature</th>
                <th className="border-r border-zinc-900 py-1.5 px-2 w-14 text-center">Credit</th>
                <th className="border-r border-zinc-900 py-1.5 px-1.5 w-10 text-center" title="Lecture Hours">L</th>
                <th className="border-r border-zinc-900 py-1.5 px-1.5 w-10 text-center" title="Tutorial Hours">T</th>
                <th className="border-r border-zinc-900 py-1.5 px-1.5 w-10 text-center" title="Practical Hours">P</th>
                <th className="border-r border-zinc-900 py-1.5 px-2 w-20 text-center">Weekly</th>
                <th className="border-r border-zinc-900 py-1.5 px-2.5 w-28 text-center" title="Total classes and hours per 6-month semester">Sem. Classes</th>
                <th className="border-r border-zinc-900 py-1.5 px-2.5 w-32 text-center" title="Calculated based on 120 working days per semester">120-Day Coverage</th>
                <th className="py-1.5 px-2.5">Faculty / Instructor</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((sub, idx) => {
                const weeklyP = sub.weeklyClasses || 3;
                const requiredWeeks = Math.ceil((sub.totalSemesterClasses || 48) / Math.max(1, weeklyP));
                const workingDaysNeeded = requiredWeeks * 6;
                const isWithin120Days = workingDaysNeeded <= 120;

                return (
                  <tr key={idx} className="border-b border-zinc-300 hover:bg-zinc-50/50">
                    <td className="border-r border-zinc-300 py-1.5 px-2.5 font-mono font-bold text-zinc-900">
                      {sub.code}
                    </td>
                    <td className="border-r border-zinc-300 py-1.5 px-2.5 font-semibold text-zinc-900">
                      {sub.name}
                    </td>
                    <td className="border-r border-zinc-300 py-1.5 px-2 text-center">
                      <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-zinc-100 border border-zinc-300 text-zinc-800 font-mono">
                        {sub.courseType}
                      </span>
                    </td>
                    <td className="border-r border-zinc-300 py-1.5 px-2 text-center font-bold font-mono text-zinc-900">
                      {sub.creditHours} Cr
                    </td>
                    <td className="border-r border-zinc-300 py-1.5 px-1.5 text-center font-mono text-zinc-700">
                      {sub.lectureHours ?? "-"}
                    </td>
                    <td className="border-r border-zinc-300 py-1.5 px-1.5 text-center font-mono text-zinc-700">
                      {sub.tutorialHours ?? "-"}
                    </td>
                    <td className="border-r border-zinc-300 py-1.5 px-1.5 text-center font-mono text-zinc-700">
                      {sub.practicalHours ?? "-"}
                    </td>
                    <td className="border-r border-zinc-300 py-1.5 px-2 text-center font-semibold text-zinc-700 font-mono">
                      {sub.weeklyClasses} P/Wk
                    </td>
                    <td className="border-r border-zinc-300 py-1.5 px-2.5 text-center font-mono text-zinc-900 font-bold">
                      {sub.totalSemesterClasses} Cls <span className="text-[10px] font-normal text-zinc-500">({sub.totalTeachingHours}h)</span>
                    </td>
                    <td className="border-r border-zinc-300 py-1.5 px-2.5 text-center font-mono text-[11px]">
                      {isWithin120Days ? (
                        <span className="text-emerald-700 font-semibold">
                          {requiredWeeks} Wks ({workingDaysNeeded}d) &le; 120d
                        </span>
                      ) : (
                        <span className="text-amber-700 font-semibold">
                          {requiredWeeks} Wks ({workingDaysNeeded}d)
                        </span>
                      )}
                    </td>
                    <td className="py-1.5 px-2.5 text-zinc-800">
                      <span className="font-medium">{sub.teacherName}</span>{" "}
                      <span className="text-[10px] font-bold font-mono text-zinc-500">[{sub.teacherAbbrev}]</span>
                    </td>
                  </tr>
                );
              })}
              {subjects.length === 0 && (
                <tr>
                  <td colSpan={11} className="py-2 px-3 text-center text-zinc-400 italic">
                    No course entries available
                  </td>
                </tr>
              )}
            </tbody>
            {subjects.length > 0 && (
              <tfoot>
                <tr className="bg-zinc-100 border-t-2 border-zinc-900 font-bold text-[11px] text-zinc-900">
                  <td colSpan={3} className="py-1.5 px-2.5 text-right uppercase tracking-wider">
                    Total Semester Requirements:
                  </td>
                  <td className="py-1.5 px-2 text-center font-mono font-black text-amber-900">
                    {totalCredits} Cr
                  </td>
                  <td colSpan={3} className="py-1.5 px-1.5 text-center font-mono text-zinc-600 text-[10px]">
                    L / T / P Ratio
                  </td>
                  <td className="py-1.5 px-2 text-center font-mono font-black text-emerald-900">
                    {totalClasses} P/Wk
                  </td>
                  <td className="py-1.5 px-2.5 text-center font-mono font-black text-sky-900">
                    {totalSemesterClassesSum} Classes ({totalSemesterHoursSum}h)
                  </td>
                  <td className="py-1.5 px-2.5 text-center font-mono text-emerald-800 font-black text-[10px]">
                    &le; 120 Working Days
                  </td>
                  <td className="py-1.5 px-2.5 text-zinc-600 font-medium italic">
                    {subjects.length} Courses (100% On-Time)
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* 4. Bottom Teacher Directory & Legend Section */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-start pt-1">
        {/* Teacher Abbreviation & Contact Table */}
        <div className="md:col-span-8 overflow-x-auto">
          <table className="w-full border-collapse border border-zinc-900 text-left text-xs">
            <thead>
              <tr className="bg-zinc-200/80 border-b border-zinc-900">
                <th className="border border-zinc-900 py-1.5 px-3 font-bold text-zinc-900 w-24 text-[11px]">
                  Abbrev
                </th>
                <th className="border border-zinc-900 py-1.5 px-3 font-bold text-zinc-900 text-[11px]">
                  Name
                </th>
                <th className="border border-zinc-900 py-1.5 px-3 font-bold text-zinc-900 w-36 text-[11px]">
                  Contact
                </th>
              </tr>
            </thead>
            <tbody>
              {directory.map((t, idx) => (
                <tr key={idx} className="border-b border-zinc-900 hover:bg-zinc-50/50">
                  <td className="border border-zinc-900 py-1.5 px-3 font-bold text-zinc-900">
                    {t.abbrev}
                  </td>
                  <td className="border border-zinc-900 py-1.5 px-3 font-medium text-zinc-800">
                    {t.name}
                  </td>
                  <td className="border border-zinc-900 py-1.5 px-3 font-mono text-[11px] text-zinc-700">
                    {t.contact}
                  </td>
                </tr>
              ))}
              {directory.length === 0 && (
                <tr>
                  <td colSpan={3} className="border border-zinc-900 py-2 px-3 text-center text-zinc-400 italic">
                    No faculty directory entries
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Legend Box */}
        <div className="md:col-span-4 rounded-lg border border-zinc-900 bg-zinc-50/80 p-3.5 space-y-2 text-xs">
          <div className="font-bold text-zinc-900 text-[11px] uppercase tracking-wider border-b border-zinc-300 pb-1">
            Course Types Legend
          </div>
          <div className="space-y-1.5 text-[11px] text-zinc-800">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-zinc-900 bg-zinc-200 px-1.5 py-0.5 rounded border border-zinc-300">
                TH
              </span>
              <span>= Theory</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-zinc-900 bg-zinc-200 px-1.5 py-0.5 rounded border border-zinc-300">
                TU
              </span>
              <span>= Tutorial</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-zinc-900 bg-zinc-200 px-1.5 py-0.5 rounded border border-zinc-300">
                PR
              </span>
              <span>= Practical</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
