"use client";

import React from "react";
import { cn, getTeacherColor } from "@/lib/utils";

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

// Official TU Syllabus Master Registry (BCA, BSc CSIT, BBA, BBM, BIM, BHM)
export const TU_UNIVERSITY_SYLLABUS_MASTER: Record<string, { code: string; name: string; credits: number; l: number | string; t: number | string; p: number | string; type: string }> = {
  // BCA Semester I (16 Cr)
  "bca 101": { code: "BCA 101", name: "Computer Fundamentals and Applications", credits: 3, l: 3, t: "-", p: 3, type: "TH/PR" },
  "bca 102": { code: "BCA 102", name: "Programming in C", credits: 3, l: 3, t: "-", p: 3, type: "TH/PR" },
  "bca 103": { code: "BCA 103", name: "Digital Logic", credits: 3, l: 3, t: "-", p: 3, type: "TH/PR" },
  "bca 104": { code: "BCA 104", name: "Mathematics-I", credits: 3, l: 3, t: 1, p: 1, type: "TH/TU/PR" },
  "bca 105": { code: "BCA 105", name: "Professional Communication and Ethics", credits: 3, l: 3, t: 2, p: "-", type: "TH/TU" },
  "bca 106": { code: "BCA 106", name: "Hardware Workshop", credits: 1, l: "-", t: "-", p: 2, type: "PR" },
  
  // BCA Semester II (16 Cr)
  "bca 151": { code: "BCA 151", name: "Discrete Structure", credits: 3, l: 3, t: "-", p: 3, type: "TH/PR" },
  "bca 152": { code: "BCA 152", name: "Microprocessor and Computer Architecture", credits: 3, l: 3, t: "-", p: 3, type: "TH/PR" },
  "bca 153": { code: "BCA 153", name: "OOP in Java", credits: 3, l: 3, t: "-", p: 3, type: "TH/PR" },
  "bca 154": { code: "BCA 154", name: "Mathematics-II", credits: 3, l: 3, t: 1, p: 1, type: "TH/TU/PR" },
  "bca 155": { code: "BCA 155", name: "UX/UI Design", credits: 3, l: 3, t: "-", p: 3, type: "TH/PR" },
  "bca 156": { code: "BCA 156", name: "Principles of Management", credits: 1, l: 1, t: "-", p: "-", type: "TH" },

  // BCA Semester III (17 Cr)
  "bca 201": { code: "BCA 201", name: "Data Structure and Algorithms", credits: 3, l: 3, t: "-", p: 3, type: "TH/PR" },
  "bca 202": { code: "BCA 202", name: "Database Management System", credits: 3, l: 3, t: "-", p: 3, type: "TH/PR" },
  "bca 203": { code: "BCA 203", name: "Web Technology-I", credits: 3, l: 3, t: "-", p: 3, type: "TH/PR" },
  "bca 204": { code: "BCA 204", name: "System Analysis and Design", credits: 3, l: 3, t: "-", p: 3, type: "TH/PR" },
  "bca 205": { code: "BCA 205", name: "Probability and Statistics", credits: 3, l: 3, t: "-", p: 3, type: "TH/PR" },
  "bca 206": { code: "BCA 206", name: "Applied Economics", credits: 2, l: 2, t: "-", p: "-", type: "TH" },

  // BCA Semester IV (17 Cr)
  "bca 251": { code: "BCA 251", name: "Operating Systems", credits: 3, l: 3, t: "-", p: 3, type: "TH/PR" },
  "bca 252": { code: "BCA 252", name: "Software Engineering", credits: 3, l: 3, t: "-", p: 3, type: "TH/PR" },
  "bca 253": { code: "BCA 253", name: "Numerical Methods", credits: 3, l: 3, t: "-", p: 3, type: "TH/PR" },
  "bca 254": { code: "BCA 254", name: "Python Programming", credits: 3, l: 3, t: "-", p: 3, type: "TH/PR" },
  "bca 255": { code: "BCA 255", name: "Web Technology-II", credits: 3, l: 3, t: "-", p: 3, type: "TH/PR" },
  "bca 256": { code: "BCA 256", name: "Project-I", credits: 2, l: "-", t: "-", p: 4, type: "PR" },

  // BCA Semester V (18 Cr)
  "bca 301": { code: "BCA 301", name: "Computer Network", credits: 3, l: 3, t: "-", p: 3, type: "TH/PR" },
  "bca 302": { code: "BCA 302", name: "Artificial Intelligence", credits: 3, l: 3, t: "-", p: 3, type: "TH/PR" },
  "bca 303": { code: "BCA 303", name: "Advance Java Programming", credits: 3, l: 3, t: "-", p: 3, type: "TH/PR" },
  "bca 304": { code: "BCA 304", name: "MIS and e-Business", credits: 3, l: 3, t: "-", p: 3, type: "TH/PR" },
  "bca 305": { code: "BCA 305", name: "Society and Technology", credits: 3, l: 3, t: 2, p: "-", type: "TH/TU" },
  "bca 306": { code: "BCA 306", name: "Project-II", credits: 3, l: "-", t: "-", p: 6, type: "PR" },

  // BCA Semester VI (17 Cr)
  "bca 351": { code: "BCA 351", name: "Computer Graphics and animation", credits: 3, l: 3, t: "-", p: 3, type: "TH/PR" },
  "bca 352": { code: "BCA 352", name: "Mobile Programming", credits: 3, l: 3, t: "-", p: 3, type: "TH/PR" },
  "bca 353": { code: "BCA 353", name: "Cryptography and Network Security", credits: 3, l: 3, t: "-", p: 3, type: "TH/PR" },
  "bca 354": { code: "BCA 354", name: "Technical Writing", credits: 2, l: 2, t: 2, p: "-", type: "TH/TU" },
  "bca 355": { code: "BCA 355", name: "Distributed System", credits: 3, l: 3, t: "-", p: 3, type: "TH/PR" },
  "bca 356": { code: "BCA 356", name: "Project-III", credits: 3, l: "-", t: "-", p: 6, type: "PR" },

  // BCA Semester VII (18 Cr)
  "bca 401": { code: "BCA 401", name: "Cyber Security and Ethical Hacking", credits: 3, l: 3, t: "-", p: 3, type: "TH/PR" },
  "bca 402": { code: "BCA 402", name: "Software Project Management", credits: 3, l: 3, t: "-", p: 3, type: "TH/PR" },
  "bca 403": { code: "BCA 403", name: "Financial Accounting", credits: 2, l: 2, t: "-", p: "-", type: "TH" },
  "bca 404": { code: "BCA 404", name: "Project-IV", credits: 3, l: "-", t: "-", p: 6, type: "PR" },
  "bca 405": { code: "BCA 405", name: "Elective-I (Machine Learning)", credits: 3, l: 3, t: "-", p: 3, type: "TH/PR" },
  "bca 406": { code: "BCA 406", name: "Elective-II (Dotnet Technology)", credits: 3, l: 3, t: "-", p: 3, type: "TH/PR" },

  // BCA Semester VIII (12 Cr)
  "bca 451": { code: "BCA 451", name: "Cloud Computing", credits: 3, l: 3, t: "-", p: 3, type: "TH/PR" },
  "bca 452": { code: "BCA 452", name: "Internship", credits: 3, l: "-", t: "-", p: "-", type: "PR" },
  "bca 453": { code: "BCA 453", name: "Elective-III (Network Administration)", credits: 3, l: 3, t: "-", p: 3, type: "TH/PR" },
  "bca 454": { code: "BCA 454", name: "Elective-IV (Digital Marketing and SEO)", credits: 3, l: 3, t: "-", p: 3, type: "TH/PR" },
};

interface CampusRoutineSheetProps {
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
  legend?: any;
  activeDayName?: string | null;
  activePeriodId?: number | string | null;
  className?: string;
}

export function CampusRoutineSheet({
  campusName = "Ratna Rajyalaxmi Campus",
  address = "Pradarshanimarga, Kathmandu Nepal",
  programName = "Bachelors in Computer Applications (BCA)",
  semesterName = "BCA 1st Sem",
  sectionName = "A",
  roomNumber = "101",
  title = "DAILY CLASS ROUTINE",
  days = [],
  periods = [],
  entries = [],
  teacherDirectory,
  subjectDirectory,
  activeDayName,
  activePeriodId,
  className,
}: CampusRoutineSheetProps) {
  // Auto-generate faculty directory from entries if not provided
  const directory: TeacherDirectoryItem[] =
    teacherDirectory && teacherDirectory.length > 0
      ? teacherDirectory
      : Array.from(
          (() => {
            const map = new Map<string, TeacherDirectoryItem>();
            entries.forEach((e: any) => {
              if (e.teacher_name && e.teacher_name.trim() !== "") {
                const name = e.teacher_name.trim();
                const abbrev =
                  e.teacher_abbreviation ||
                  name
                    .split(" ")
                    .filter((w: string) => !["Prof.", "Dr.", "Er.", "Mr.", "Mrs."].includes(w))
                    .map((w: string) => w[0])
                    .join("")
                    .toUpperCase() ||
                  "TCH";
                const contact = e.teacher_phone || e.teacher_contact || "98XXXXXXXX";
                if (!map.has(abbrev)) {
                  map.set(abbrev, { abbrev, name, contact });
                }
              }
            });
            return map;
          })().values()
        );

  // Auto-generate subject table from entries & TU syllabus
  const subjects: SubjectDirectoryItem[] =
    subjectDirectory && subjectDirectory.length > 0
      ? subjectDirectory
      : Array.from(
          (() => {
            const map = new Map<string, SubjectDirectoryItem>();

            for (const e of entries) {
              const rawName = e.subject_name || e.subject_code || "Unknown";
              const cleanName = rawName.replace(/\s*\((Lab|Practical|Tutorial|Case Study|AI & Java Lab|Mobile & Security Lab|Cyber & ML Lab)\)/i, "").trim();
              const cType = e.course_type || (e.room_type_name?.includes("Lab") || (e.room_number && e.room_number.toLowerCase().includes("lab")) ? "PR" : "TH");
              const key = `${cleanName}_${cType}`;

              const subLower = cleanName.toLowerCase();
              const codeLower = (e.subject_code || "").toLowerCase();
              const tuInfo = TU_UNIVERSITY_SYLLABUS_MASTER[codeLower] || TU_UNIVERSITY_SYLLABUS_MASTER[subLower];

              const code = e.subject_code || tuInfo?.code || cleanName.slice(0, 7).toUpperCase();
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

              if (!map.has(key)) {
                const creditsNum = Number(tuInfo?.credits || e.credit_hours || 3);
                const lHours = tuInfo?.l ?? 3;
                const tHours = tuInfo?.t ?? "-";
                const pHours = tuInfo?.p ?? (cType === "PR" ? 3 : "-");
                const natureType = tuInfo?.type || (pHours !== "-" ? "TH/PR" : (tHours !== "-" ? "TH/TU" : cType));

                let totalSemesterClasses = 48;
                let totalTeachingHours = 48;
                if (creditsNum === 3) {
                  totalSemesterClasses = 80;
                  totalTeachingHours = 80;
                } else if (creditsNum <= 2) {
                  totalSemesterClasses = 32;
                  totalTeachingHours = 32;
                }

                map.set(key, {
                  code: code,
                  name: cleanName,
                  creditHours: creditsNum,
                  lectureHours: lHours,
                  tutorialHours: tHours,
                  practicalHours: pHours,
                  weeklyClasses: 1,
                  totalSemesterClasses: totalSemesterClasses,
                  totalTeachingHours: totalTeachingHours,
                  courseType: natureType,
                  teacherName: e.teacher_name || "-",
                  teacherAbbrev: abbrev
                });
              } else {
                const existing = map.get(key)!;
                existing.weeklyClasses += 1;
                if (e.teacher_name && (!existing.teacherName || existing.teacherName === "-")) {
                  existing.teacherName = e.teacher_name;
                  existing.teacherAbbrev = abbrev;
                }
              }
            }

            return map;
          })().values()
        );

  const totalCredits = subjects.reduce((sum, s) => sum + s.creditHours, 0);
  const totalClasses = entries.length;
  const totalSemesterClassesSum = subjects.reduce((sum, s) => sum + (s.totalSemesterClasses || 48), 0);
  const totalSemesterHoursSum = subjects.reduce((sum, s) => sum + (s.totalTeachingHours || 48), 0);

  return (
    <div
      className={cn(
        "w-full rounded-2xl border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 sm:p-8 text-zinc-900 dark:text-zinc-100 shadow-xs print:p-0 print:border-none print:shadow-none print:bg-white print:text-black font-sans transition-colors",
        className
      )}
    >
      {/* 1. Official College Header */}
      <div className="text-center space-y-0.5 pb-4 border-b border-zinc-200 dark:border-zinc-800 print:border-black">
        <h2 className="text-lg sm:text-xl font-black tracking-tight text-zinc-900 dark:text-white print:text-black uppercase">
          {campusName}
        </h2>
        <p className="text-xs sm:text-sm font-medium text-zinc-600 dark:text-zinc-400 print:text-zinc-800">
          {address}
        </p>
        <p className="text-xs sm:text-sm font-bold text-zinc-800 dark:text-zinc-200 print:text-black pt-0.5">
          {programName} {semesterName} {sectionName ? `Sec ${sectionName}` : ""} {roomNumber ? `Room No- ${roomNumber}` : ""}
        </p>
        <div className="inline-block mt-1 px-3 py-0.5 rounded text-xs font-bold tracking-wider uppercase bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-700 print:bg-transparent print:border-black print:text-black">
          {title}
        </div>
      </div>

      {/* 2. Main Timetable Matrix */}
      <div className="mt-5 overflow-x-auto">
        <table className="w-full border-collapse border border-zinc-400 dark:border-zinc-700 print:border-black text-center text-xs">
          <thead>
            <tr className="bg-zinc-100 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100 border-b border-zinc-400 dark:border-zinc-700 print:bg-zinc-100 print:text-black print:border-black">
              <th className="border border-zinc-400 dark:border-zinc-700 print:border-black py-2.5 px-3 font-bold text-left w-24 sm:w-28 text-[11px] uppercase tracking-wider">
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
                      "border border-zinc-400 dark:border-zinc-700 print:border-black py-2.5 px-2 font-bold min-w-[110px] text-[11px]",
                      isInterval ? "w-10 sm:w-12 bg-zinc-200/50 dark:bg-zinc-800/40 text-zinc-700 dark:text-zinc-400" : "bg-zinc-100 dark:bg-zinc-800/60"
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
              const isToday = Boolean(
                activeDayName && 
                (activeDayName.toLowerCase() === day.name.toLowerCase() || 
                 activeDayName.toLowerCase() === day.short_code?.toLowerCase() ||
                 (day.id && String(activeDayName) === String(day.id)))
              );
              const usedEntryIdsForDay = new Set<string | number>();

              return (
                <tr
                  key={day.id || day.name}
                  className={cn(
                    "border-b border-zinc-400 dark:border-zinc-700 print:border-black transition-all group/row",
                    isToday 
                      ? "bg-emerald-50/60 dark:bg-emerald-950/40 ring-1 ring-inset ring-emerald-500/40 shadow-2xs" 
                      : "hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20"
                  )}
                >
                  {/* Day Column */}
                  <td className={cn(
                    "border border-zinc-400 dark:border-zinc-700 print:border-black py-3 px-3 font-bold text-left transition-colors",
                    isToday 
                      ? "bg-emerald-100/90 dark:bg-emerald-900/60 text-emerald-950 dark:text-emerald-100 font-extrabold border-l-4 border-l-emerald-600 dark:border-l-emerald-400" 
                      : "bg-zinc-100 dark:bg-zinc-800/90 text-zinc-900 dark:text-zinc-100 group-hover/row:bg-emerald-50/50"
                  )}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black">{day.name}</span>
                      {isToday && (
                        <span className="flex h-2 w-2 relative" title="Active Selected Day">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                        </span>
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
                    
                    const cleanPId = String(period.id || "").toLowerCase();
                    const cleanPName = String(period.name || "").toLowerCase();
                    const cleanPStart = (period.start_time || "").replace(/\s+/g, "").toLowerCase();
                    const cleanAct = String(activePeriodId || "").replace(/\s+/g, "").toLowerCase();

                    const isCurrentLiveSlot = isToday && Boolean(
                      activePeriodId && (
                        cleanAct === cleanPId ||
                        cleanAct === cleanPName ||
                        (cleanPStart && cleanAct.includes(cleanPStart)) ||
                        (cleanPName && cleanAct.includes(cleanPName))
                      )
                    );

                    if (isInterval) {
                      return (
                        <td
                          key={pIdx}
                          className={cn(
                            "border border-zinc-400 dark:border-zinc-700 print:border-black text-zinc-700 dark:text-zinc-400 print:text-black py-2 px-1 text-center font-bold tracking-widest text-[11px] transition-colors",
                            isCurrentLiveSlot
                              ? "bg-amber-100/90 dark:bg-amber-950/60 ring-2 ring-inset ring-amber-500 font-extrabold"
                              : isToday
                                ? "bg-emerald-100/40 dark:bg-emerald-950/30"
                                : "bg-zinc-100/50 dark:bg-zinc-800/30"
                          )}
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
                          {isCurrentLiveSlot && (
                            <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-amber-600 text-white text-[7.5px] font-black uppercase tracking-wider">
                              BREAK NOW
                            </span>
                          )}
                        </td>
                      );
                    }

                    // Multi-strategy class matching
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

                      if (period.id && e.period_id && period.id === e.period_id) return true;
                      const cleanEStart = (e.start_time || "").replace(/\s+/g, "").toLowerCase();
                      if (cleanPStart && cleanEStart && cleanPStart === cleanEStart) return true;

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
                            "border border-zinc-400 dark:border-zinc-700 print:border-black p-2 text-zinc-400 dark:text-zinc-600 transition-colors",
                            isCurrentLiveSlot 
                              ? "bg-rose-50/70 dark:bg-rose-950/40 ring-2 ring-inset ring-rose-500" 
                              : isToday 
                                ? "bg-emerald-50/30 dark:bg-emerald-950/20" 
                                : "bg-white dark:bg-zinc-900"
                          )}
                        >
                          <span className="text-[11px] text-zinc-300 dark:text-zinc-700">-</span>
                          {isCurrentLiveSlot && (
                            <span className="block mt-1 text-[8px] font-bold text-rose-600 uppercase">
                              Free Slot
                            </span>
                          )}
                        </td>
                      );
                    }

                    const rawSubName = match.subject_name || match.subject_code || "Class";
                    const cleanSubName = rawSubName.replace(/\s*\((Lab|Practical|Tutorial|Case Study|AI & Java Lab|Mobile & Security Lab|Cyber & ML Lab)\)/i, "").trim();
                    const subCode = match.subject_code;
                    const cType = match.course_type || (match.room_type_name?.includes("Lab") || (match.room_number && match.room_number.toLowerCase().includes("lab")) ? "PR" : "TH");
                    const displayTag = cType === "PR" ? "PR" : "LT/TH";
                    const roomName = match.room_number || (cType === "PR" ? "Comp Lab" : "");
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

                    const teacherTheme = getTeacherColor(match.teacher_name || tAbbrev || match.teacher_id);

                    return (
                      <td
                        key={pIdx}
                        className={cn(
                          "border border-zinc-400 dark:border-zinc-700 print:border-black p-2 align-middle transition-all relative",
                          isCurrentLiveSlot
                            ? "bg-rose-50/90 dark:bg-rose-950/60 ring-2 ring-inset ring-rose-500 shadow-md font-semibold"
                            : isToday
                              ? "bg-emerald-50/40 dark:bg-emerald-950/25"
                              : "bg-white dark:bg-zinc-900"
                        )}
                      >
                        <div className="flex flex-col items-center justify-center gap-0.5">
                          <div className="font-bold text-[11px] leading-tight text-zinc-900 dark:text-zinc-100 print:text-black text-center">
                            {cleanSubName}
                          </div>
                          {subCode && subCode.trim() !== cleanSubName.trim() && (
                            <div className="text-[9.5px] font-mono font-semibold text-zinc-600 dark:text-zinc-400 print:text-zinc-700 text-center">
                              [{subCode}]
                            </div>
                          )}
                          <div className="flex items-center justify-center flex-wrap gap-1 text-[10px] font-semibold text-zinc-700 dark:text-zinc-300 print:text-black mt-0.5">
                            <span className="font-mono text-zinc-600 dark:text-zinc-400">[{displayTag}]</span>
                            <span className={cn("px-1 py-0.2 rounded border font-mono font-bold text-[9.5px]", teacherTheme.tag)}>
                              [{tAbbrev}]
                            </span>
                            {cType === "PR" && roomName && (
                              <span className="block text-[9px] font-medium text-zinc-500 dark:text-zinc-400">
                                [{roomName}]
                              </span>
                            )}
                          </div>
                          {isCurrentLiveSlot && (
                            <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-rose-600 text-white text-[8px] font-black uppercase tracking-wider shadow-sm animate-pulse">
                              <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
                              ONGOING CLASS
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
      <div className="mt-5 border border-emerald-300/80 dark:border-emerald-800/80 print:border-black rounded-lg overflow-hidden shadow-2xs">
        <div className="bg-emerald-900/95 dark:bg-emerald-950 text-emerald-50 print:bg-zinc-100 print:text-black print:border-b print:border-black px-3.5 py-2.5 flex flex-wrap items-center justify-between text-xs font-bold gap-2">
          <div className="flex items-center gap-2">
            <span className="uppercase tracking-wider font-extrabold text-white print:text-black">
              TU Syllabus Course Structure &amp; 120-Day Semester Schedule
            </span>
            <span className="rounded bg-emerald-800/80 dark:bg-emerald-900 print:bg-white print:text-black px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-emerald-100 border border-emerald-700/70 print:border-black">
              120 Working Days Window
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-emerald-100 print:text-black">
            <span>Total Credits: {totalCredits} Cr</span>
            <span className="text-emerald-400/60 print:text-zinc-400">|</span>
            <span>Weekly: {totalClasses} Periods</span>
            <span className="text-emerald-400/60 print:text-zinc-400">|</span>
            <span>Sem Total: {totalSemesterClassesSum} Classes ({totalSemesterHoursSum} Hrs)</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-zinc-100 dark:bg-zinc-800/80 border-b border-zinc-400 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-[11px] font-bold print:border-black print:text-black">
                <th className="border-r border-zinc-400 dark:border-zinc-700 print:border-black py-1.5 px-2.5 w-20">Code</th>
                <th className="border-r border-zinc-400 dark:border-zinc-700 print:border-black py-1.5 px-2.5">Subject / Course Title</th>
                <th className="border-r border-zinc-400 dark:border-zinc-700 print:border-black py-1.5 px-2 w-16 text-center">Nature</th>
                <th className="border-r border-zinc-400 dark:border-zinc-700 print:border-black py-1.5 px-2 w-14 text-center">Credit</th>
                <th className="border-r border-zinc-400 dark:border-zinc-700 print:border-black py-1.5 px-1.5 w-14 text-center">LT/TH</th>
                <th className="border-r border-zinc-400 dark:border-zinc-700 print:border-black py-1.5 px-1.5 w-12 text-center">PR</th>
                <th className="border-r border-zinc-400 dark:border-zinc-700 print:border-black py-1.5 px-2 w-20 text-center">Weekly</th>
                <th className="border-r border-zinc-400 dark:border-zinc-700 print:border-black py-1.5 px-2.5 w-28 text-center">Sem. Classes</th>
                <th className="border-r border-zinc-400 dark:border-zinc-700 print:border-black py-1.5 px-2.5 w-32 text-center">120-Day Coverage</th>
                <th className="py-1.5 px-2.5">Faculty / Instructor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 print:divide-black">
              {subjects.map((sub, idx) => {
                const weeklyP = sub.weeklyClasses || 3;
                const requiredWeeks = Math.ceil((sub.totalSemesterClasses || 48) / Math.max(1, weeklyP));
                const workingDaysNeeded = requiredWeeks * 6;
                const isWithin120Days = workingDaysNeeded <= 120;
                const displayNature = sub.courseType?.replace("TH", "LT/TH") || "LT/TH";

                return (
                  <tr key={idx} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40">
                    <td className="border-r border-zinc-300 dark:border-zinc-700 py-1.5 px-2.5 font-mono font-bold text-zinc-900 dark:text-zinc-100">
                      {sub.code}
                    </td>
                    <td className="border-r border-zinc-300 dark:border-zinc-700 py-1.5 px-2.5 font-semibold text-zinc-900 dark:text-zinc-100">
                      {sub.name}
                    </td>
                    <td className="border-r border-zinc-300 dark:border-zinc-700 py-1.5 px-2 text-center">
                      <span className="inline-block px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 font-mono">
                        {displayNature}
                      </span>
                    </td>
                    <td className="border-r border-zinc-300 dark:border-zinc-700 py-1.5 px-2 text-center font-bold font-mono text-zinc-900 dark:text-zinc-100">
                      {sub.creditHours} Cr
                    </td>
                    <td className="border-r border-zinc-300 dark:border-zinc-700 py-1.5 px-1.5 text-center font-mono text-zinc-700 dark:text-zinc-300">
                      {sub.lectureHours ?? "-"}
                    </td>
                    <td className="border-r border-zinc-300 dark:border-zinc-700 py-1.5 px-1.5 text-center font-mono text-zinc-700 dark:text-zinc-300">
                      {sub.practicalHours ?? "-"}
                    </td>
                    <td className="border-r border-zinc-300 dark:border-zinc-700 py-1.5 px-2 text-center font-semibold text-zinc-700 dark:text-zinc-300 font-mono">
                      {sub.weeklyClasses} P/Wk
                    </td>
                    <td className="border-r border-zinc-300 dark:border-zinc-700 py-1.5 px-2.5 text-center font-mono text-zinc-900 dark:text-zinc-100 font-bold">
                      {sub.totalSemesterClasses} Cls <span className="text-[10px] font-normal text-zinc-500">({sub.totalTeachingHours}h)</span>
                    </td>
                    <td className="border-r border-zinc-300 dark:border-zinc-700 py-1.5 px-2.5 text-center font-mono text-[11px] font-semibold text-zinc-900 dark:text-zinc-100">
                      {requiredWeeks} Wks ({workingDaysNeeded}d) &le; 120d
                    </td>
                    <td className="py-1.5 px-2.5 text-zinc-800 dark:text-zinc-200">
                      {(() => {
                        const tColor = getTeacherColor(sub.teacherName || sub.teacherAbbrev);
                        return (
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-zinc-900 dark:text-zinc-100">{sub.teacherName}</span>
                            <span className={cn("inline-block px-1.5 py-0.2 rounded text-[9.5px] font-bold font-mono border", tColor.tag)}>
                              [{sub.teacherAbbrev}]
                            </span>
                          </div>
                        );
                      })()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {subjects.length > 0 && (
              <tfoot>
                <tr className="bg-zinc-100 dark:bg-zinc-800/90 border-t-2 border-zinc-400 dark:border-zinc-600 font-bold text-[11px] text-zinc-900 dark:text-zinc-100">
                  <td colSpan={3} className="py-1.5 px-2.5 text-right uppercase tracking-wider">
                    Total Semester Requirements:
                  </td>
                  <td className="py-1.5 px-2 text-center font-mono font-bold">
                    {totalCredits} Cr
                  </td>
                  <td colSpan={2} className="py-1.5 px-1.5 text-center font-mono text-zinc-600 dark:text-zinc-400 text-[10px]">
                    LT/TH &amp; PR
                  </td>
                  <td className="py-1.5 px-2 text-center font-mono font-bold">
                    {totalClasses} P/Wk
                  </td>
                  <td className="py-1.5 px-2.5 text-center font-mono font-bold">
                    {totalSemesterClassesSum} Classes ({totalSemesterHoursSum}h)
                  </td>
                  <td className="py-1.5 px-2.5 text-center font-mono font-bold text-[10px]">
                    &le; 120 Working Days
                  </td>
                  <td className="py-1.5 px-2.5 text-zinc-600 dark:text-zinc-400 font-medium italic">
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
          <table className="w-full border-collapse border border-zinc-400 dark:border-zinc-700 print:border-black text-left text-xs">
            <thead>
              <tr className="bg-zinc-100 dark:bg-zinc-800/80 border-b border-zinc-400 dark:border-zinc-700 print:border-black">
                <th className="border border-zinc-400 dark:border-zinc-700 print:border-black py-1.5 px-3 font-bold text-zinc-900 dark:text-zinc-100 w-28 text-[11px]">
                  Abbrev
                </th>
                <th className="border border-zinc-400 dark:border-zinc-700 print:border-black py-1.5 px-3 font-bold text-zinc-900 dark:text-zinc-100 text-[11px]">
                  Name
                </th>
                <th className="border border-zinc-400 dark:border-zinc-700 print:border-black py-1.5 px-3 font-bold text-zinc-900 dark:text-zinc-100 w-36 text-[11px]">
                  Contact
                </th>
              </tr>
            </thead>
            <tbody>
              {directory.map((t, idx) => {
                const tColor = getTeacherColor(t.name || t.abbrev);
                return (
                  <tr key={idx} className="border-b border-zinc-400 dark:border-zinc-700 print:border-black hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                    <td className="border border-zinc-400 dark:border-zinc-700 print:border-black py-1.5 px-3 font-bold">
                      <div className="flex items-center gap-2">
                        <span className={cn("h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-black shrink-0", tColor.avatar)}>
                          {(t.name || t.abbrev)[0]}
                        </span>
                        <span className={cn("px-1.5 py-0.2 rounded border font-mono font-bold text-[10px]", tColor.tag)}>
                          [{t.abbrev}]
                        </span>
                      </div>
                    </td>
                    <td className="border border-zinc-400 dark:border-zinc-700 print:border-black py-1.5 px-3 font-semibold text-zinc-900 dark:text-zinc-100">
                      {t.name}
                    </td>
                    <td className="border border-zinc-400 dark:border-zinc-700 print:border-black py-1.5 px-3 font-mono text-[11px] text-zinc-700 dark:text-zinc-300">
                      {t.contact}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Legend Box */}
        <div className="md:col-span-4 rounded-lg border border-zinc-400 dark:border-zinc-700 bg-zinc-50/80 dark:bg-zinc-900 p-3.5 space-y-2 text-xs">
          <div className="font-bold text-zinc-900 dark:text-white text-[11px] uppercase tracking-wider border-b border-zinc-200 dark:border-zinc-800 pb-1">
            Course Types Legend
          </div>
          <div className="space-y-1.5 text-[11px] text-zinc-800 dark:text-zinc-300">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100 bg-zinc-200 dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-300 dark:border-zinc-700">
                LT/TH
              </span>
              <span>= Lecture / Theory</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100 bg-zinc-200 dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-300 dark:border-zinc-700">
                PR
              </span>
              <span>= Practical / Laboratory</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
