"use client";

import React, { useState, useEffect } from "react";
import { 
  Clock, Maximize2, Minimize2, Radio, Calendar, 
  Layers, User, Sparkles, X, ChevronRight, Volume2, ShieldCheck, Share2, Check
} from "lucide-react";
import { CampusRoutineSheet } from "./CampusRoutineSheet";
import { cn } from "@/lib/utils";

interface LiveWatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  timetable: any;
  days: any[];
  sections: any[];
  teachers: any[];
  initialSectionId?: number | string;
}

export function LiveWatchModal({
  isOpen,
  onClose,
  timetable,
  days = [],
  sections = [],
  teachers = [],
  initialSectionId
}: LiveWatchModalProps) {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [selectedSectionId, setSelectedSectionId] = useState<string | number>(
    initialSectionId || sections[0]?.id || 1
  );
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!isOpen) return null;

  // Format today's day name (e.g. "Sunday", "Monday", etc.)
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const currentDayName = dayNames[currentTime.getDay()];

  // Format digital time
  const timeString = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateString = currentTime.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });

  // Get current section entries
  const entries = timetable?.entries || timetable?.all_entries || [];
  const filteredEntries = entries.filter((e: any) => {
    if (!selectedSectionId) return true;
    return e.section_id === Number(selectedSectionId) || e.section_name === String(selectedSectionId);
  });

  const selectedSection = sections.find(
    (s: any) => s.id === Number(selectedSectionId) || s.name === String(selectedSectionId)
  ) || sections[0];

  // Helper to parse time string ("10:00 AM", "01:30 PM", "11:00") into minutes
  const parseTimeToMin = (tStr: string) => {
    if (!tStr) return 0;
    const isPM = tStr.toUpperCase().includes("PM");
    const isAM = tStr.toUpperCase().includes("AM");
    const clean = tStr.replace(/[^\d:]/g, "");
    const [hStr, mStr] = clean.split(":");
    let h = parseInt(hStr) || 0;
    const m = parseInt(mStr) || 0;
    if (isPM && h < 12) h += 12;
    if (isAM && h === 12) h = 0;
    return h * 60 + m;
  };

  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();

  // Find active period for today
  const activeDayObj = days.find((d: any) => d.name.toLowerCase() === currentDayName.toLowerCase());
  const dayPeriods = activeDayObj?.periods || timetable?.day_periods?.[currentDayName] || [
    { name: "Period 1", start_time: "11:00 AM", end_time: "12:00 PM", period_type: "Teaching" },
    { name: "Period 2", start_time: "12:00 PM", end_time: "01:00 PM", period_type: "Teaching" },
    { name: "Period 3", start_time: "01:00 PM", end_time: "02:00 PM", period_type: "Teaching" },
    { name: "Interval", start_time: "02:00 PM", end_time: "02:30 PM", period_type: "Break" },
    { name: "Period 4", start_time: "02:30 PM", end_time: "03:30 PM", period_type: "Teaching" },
    { name: "Period 5", start_time: "03:30 PM", end_time: "04:30 PM", period_type: "Teaching" },
  ];

  let currentActivePeriod: any = null;
  let nextUpcomingPeriod: any = null;
  let remainingMinutes = 0;

  for (let i = 0; i < dayPeriods.length; i++) {
    const p = dayPeriods[i];
    const sMin = parseTimeToMin(p.start_time);
    const eMin = parseTimeToMin(p.end_time);

    if (currentMinutes >= sMin && currentMinutes < eMin) {
      currentActivePeriod = p;
      remainingMinutes = eMin - currentMinutes;
      if (i + 1 < dayPeriods.length) {
        nextUpcomingPeriod = dayPeriods[i + 1];
      }
      break;
    } else if (currentMinutes < sMin && !nextUpcomingPeriod) {
      nextUpcomingPeriod = p;
    }
  }

  // Find ongoing class entry
  const ongoingClass = currentActivePeriod
    ? filteredEntries.find(
        (e: any) =>
          (e.day_name === currentDayName || e.day_id === activeDayObj?.id) &&
          (e.period_id === currentActivePeriod.id || e.period_name === currentActivePeriod.name)
      )
    : null;

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.origin + "/live-watch");
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/80 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div
        className={cn(
          "w-full bg-zinc-100 dark:bg-zinc-950 rounded-2xl border border-zinc-300 shadow-2xl flex flex-col transition-all overflow-hidden",
          isFullscreen ? "fixed inset-0 rounded-none border-none h-screen" : "max-w-6xl max-h-[94vh]"
        )}
      >
        {/* Top Live Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-900 text-white px-5 py-3.5 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 rounded-full bg-rose-600 px-2.5 py-0.5 text-xs font-black uppercase tracking-wider text-white animate-pulse">
              <Radio className="h-3 w-3" />
              Live Watch
            </span>
            <span className="text-sm font-bold text-zinc-100 hidden sm:inline">
              Real-Time Campus Routine Monitor
            </span>
          </div>

          {/* Clock & Date */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-zinc-800/80 px-3 py-1 rounded-lg border border-zinc-700 font-mono text-xs text-zinc-200">
              <Clock className="h-3.5 w-3.5 text-emerald-400" />
              <span className="font-bold">{timeString}</span>
              <span className="text-zinc-500">|</span>
              <span>{dateString}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleShare}
                className="rounded-lg bg-zinc-800 p-1.5 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors cursor-pointer"
                title="Copy Live Watch Link"
              >
                {copiedLink ? <Check className="h-4 w-4 text-emerald-400" /> : <Share2 className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="rounded-lg bg-zinc-800 p-1.5 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors cursor-pointer"
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Mode"}
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg bg-zinc-800 p-1.5 text-zinc-300 hover:bg-rose-600 hover:text-white transition-colors cursor-pointer"
                title="Close Live Watch"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Live Status Banner */}
        <div className="bg-white border-b border-zinc-200 px-5 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 border border-zinc-200 shrink-0 text-zinc-800">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  Current Status &bull; {currentDayName}
                </span>
                {currentActivePeriod && (
                  <span className="rounded bg-emerald-100 px-1.5 py-0.2 text-[9px] font-black text-emerald-800 uppercase">
                    In Session ({remainingMinutes}m left)
                  </span>
                )}
              </div>
              <div className="text-sm font-black text-zinc-900 mt-0.5">
                {ongoingClass ? (
                  <span>
                    {ongoingClass.subject_name} ({ongoingClass.course_type || "TH"}) &mdash; Prof. {ongoingClass.teacher_name} ({ongoingClass.room_number || "Room 101"})
                  </span>
                ) : currentActivePeriod?.period_type === "Break" ? (
                  <span className="text-amber-700">☕ Interval / Campus Break</span>
                ) : (
                  <span className="text-zinc-600">No active lecture in progress right now.</span>
                )}
              </div>
            </div>
          </div>

          {/* Section Selector */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-zinc-600">Switch Class:</label>
            <select
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(e.target.value)}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-bold text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-500 cursor-pointer shadow-xs"
            >
              {sections.map((s: any) => (
                <option key={s.id || s.name} value={s.id || s.name}>
                  {s.display_name || s.name || `Section ${s.id}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Scrollable Sheet Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          <CampusRoutineSheet
            campusName={timetable?.campus_name || "Ratna Rajyalaxmi Campus"}
            address={timetable?.address || "Pradarshanimarga, Kathmandu Nepal"}
            programName="Bachelors in Computer Applications (BCA)"
            semesterName={selectedSection?.semester_name || "SEMESTER - V"}
            sectionName={selectedSection?.name || "A"}
            roomNumber={selectedSection?.room_name || selectedSection?.room_number || "101"}
            days={days}
            periods={dayPeriods}
            entries={filteredEntries}
            teacherDirectory={timetable?.teacher_directory}
            legend={timetable?.legend}
            activeDayName={currentDayName}
            activePeriodId={currentActivePeriod?.id || currentActivePeriod?.name}
          />
        </div>

        {/* Bottom Bar */}
        <div className="bg-zinc-100 border-t border-zinc-200 px-5 py-2.5 flex items-center justify-between text-xs text-zinc-600">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
            <span className="font-semibold text-zinc-800">Live Auto-Sync Active</span>
            <span className="text-zinc-400">&bull; No manual download or refresh required</span>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="text-xs font-bold text-zinc-800 hover:text-zinc-950 underline cursor-pointer"
          >
            Print Campus Routine
          </button>
        </div>
      </div>
    </div>
  );
}
