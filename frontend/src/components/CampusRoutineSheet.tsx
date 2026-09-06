"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface TeacherDirectoryItem {
  abbrev: string;
  name: string;
  contact: string;
  speciality?: string;
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
  legend = {
    "TH": "Theory",
    "TU": "Tutorial",
    "PR": "Practical"
  },
  activeDayName,
  activePeriodId,
  className
}: CampusRoutineSheetProps) {
  // Extract unique teachers from entries if teacherDirectory is not explicitly provided
  const directory: TeacherDirectoryItem[] = teacherDirectory.length > 0
    ? teacherDirectory
    : Array.from(
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
                const isInterval = p.period_type && p.period_type !== "Teaching";
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
                    const isInterval = period.period_type && period.period_type !== "Teaching";
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
                      const isBrk = cur.period_type === "Break" || cur.name?.toLowerCase().includes("interval") || cur.name?.toLowerCase().includes("break");
                      if (!isBrk) teachingIndex++;
                    }

                    // Find matching class with multi-strategy matching
                    const dayName = (day.name || day.short_code || "").toString().trim().toLowerCase();
                    const dayId = day.id;

                    const match = entries.find((e: any) => {
                      const eDayName = (e.day_name || e.day_short_code || "").toString().trim().toLowerCase();
                      const matchDay = 
                        (eDayName && dayName && (eDayName === dayName || eDayName.includes(dayName) || dayName.includes(eDayName))) ||
                        (dayId && e.day_id && dayId === e.day_id);
                      
                      if (!matchDay) return false;

                      // 1. Match by period id if present
                      if (period.id && e.period_id && period.id === e.period_id) return true;

                      // 2. Match by exact or normalized start/end time
                      const cleanPStart = (period.start_time || "").replace(/\s+/g, "").toLowerCase();
                      const cleanEStart = (e.start_time || "").replace(/\s+/g, "").toLowerCase();
                      if (cleanPStart && cleanEStart && cleanPStart === cleanEStart) return true;

                      // 3. Match by extracted period number (e.g. "Period 1" matches "Period 1")
                      const pNumMatch = (period.name || "").match(/\d+/);
                      const eNumMatch = (e.period_name || "").match(/\d+/);
                      if (pNumMatch && eNumMatch && pNumMatch[0] === eNumMatch[0]) return true;

                      // 4. Match by period name
                      const cleanPName = (period.name || "").trim().toLowerCase();
                      const cleanEName = (e.period_name || "").trim().toLowerCase();
                      if (cleanPName && cleanEName && (cleanPName === cleanEName || cleanPName.includes(cleanEName) || cleanEName.includes(cleanPName))) return true;

                      // 5. Match by order index
                      if (period.order_index != null && e.order_index != null && Number(period.order_index) === Number(e.order_index)) return true;

                      // 6. Match by teaching period index (1st teaching slot, 2nd teaching slot, etc.)
                      if (e.order_index != null && Number(e.order_index) === teachingIndex) return true;

                      return false;
                    });

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
                          <div className="font-bold text-[11px] leading-tight text-zinc-900">
                            {subName}
                          </div>
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

      {/* 3. Bottom Teacher Directory & Legend Section */}
      <div className="mt-5 grid grid-cols-1 md:grid-cols-12 gap-4 items-start pt-2">
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
