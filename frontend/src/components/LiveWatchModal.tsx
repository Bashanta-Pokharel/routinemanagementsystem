"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Clock, Maximize2, Minimize2, Radio, Calendar, 
  Layers, User, Sparkles, X, ChevronRight, Volume2, ShieldCheck, Share2, Check,
  RotateCcw, Sun, Sunrise, Sunset, PlayCircle
} from "lucide-react";
import { CampusRoutineSheet } from "./CampusRoutineSheet";
import { useCampusInfo } from "@/lib/campusSettings";
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
  const { campusInfo } = useCampusInfo();
  const [mounted, setMounted] = useState(false);
  
  // Shift option: "auto" | "morning" | "day" | "evening"
  const [selectedShift, setSelectedShift] = useState<"auto" | "morning" | "day" | "evening">("auto");

  // Real-time & Custom Date/Time Control
  const [isLiveClock, setIsLiveClock] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [customDateStr, setCustomDateStr] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [customTimeStr, setCustomTimeStr] = useState<string>("07:30");

  const [selectedSectionId, setSelectedSectionId] = useState<string | number>(
    initialSectionId || sections[0]?.id || 1
  );
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Update clock every second when live mode is active
  useEffect(() => {
    if (!isLiveClock) return;
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      setCustomDateStr(now.toISOString().split("T")[0]);
      setCustomTimeStr(`${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`);
    }, 1000);
    return () => clearInterval(timer);
  }, [isLiveClock]);

  // Day computation
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const activeDate = isLiveClock ? currentTime : new Date(`${customDateStr}T${customTimeStr || "12:00"}:00`);
  const currentDayName = isLiveClock 
    ? dayNames[currentTime.getDay()]
    : isNaN(activeDate.getTime()) ? dayNames[new Date().getDay()] : dayNames[activeDate.getDay()];

  const timeString = isLiveClock
    ? currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : activeDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const dateString = isLiveClock
    ? currentTime.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })
    : activeDate.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });

  // Get current section entries
  const entries = timetable?.entries || timetable?.all_entries || [];

  // Available sections extracted from entries or DB sections
  const availableSections = useMemo(() => {
    if (entries && entries.length > 0) {
      const secMap = new Map();
      entries.forEach((e: any) => {
        const secKey = String(e.section_id || e.section_name || "1");
        if (!secMap.has(secKey)) {
          secMap.set(secKey, {
            id: e.section_id,
            name: e.section_name || `Sec ${e.section_id}`,
            semester_name: e.semester_name || `BCA Sem ${e.semester_number || ''}`,
            semester_number: e.semester_number,
            room_name: e.room_number,
            display_name: `${e.program_name || 'BCA'} ${e.semester_name || ''} - Sec ${e.section_name || e.section_id} ${e.room_number ? '(Room ' + e.room_number + ')' : ''}`
          });
        }
      });
      if (secMap.size > 0) return Array.from(secMap.values());
    }
    return sections;
  }, [entries, sections]);

  useEffect(() => {
    if (initialSectionId) {
      setSelectedSectionId(initialSectionId);
    } else if (availableSections && availableSections.length > 0) {
      const exists = availableSections.some((s: any) => 
        s.id === Number(selectedSectionId) || 
        String(s.id) === String(selectedSectionId) || 
        s.name === String(selectedSectionId)
      );
      if (!exists || !selectedSectionId) {
        setSelectedSectionId(availableSections[0].id || availableSections[0].name || "");
      }
    }
  }, [initialSectionId, availableSections, selectedSectionId]);

  const selectedSection = availableSections.find((s: any) => 
    s.id === Number(selectedSectionId) || 
    String(s.id) === String(selectedSectionId) || 
    s.name === String(selectedSectionId)
  ) || availableSections[0] || sections[0];

  const filteredEntries = useMemo(() => {
    if (!selectedSectionId && availableSections.length === 0) return entries;
    const secIdStr = String(selectedSectionId);
    return entries.filter((e: any) => {
      if (e.section_id === Number(selectedSectionId) || String(e.section_id) === secIdStr) return true;
      if (e.section_name && String(e.section_name) === secIdStr) return true;
      if (selectedSection?.semester_name && e.semester_name && e.semester_name === selectedSection.semester_name) return true;
      return false;
    });
  }, [entries, selectedSectionId, selectedSection, availableSections]);

  // Shift Presets
  const morningPeriods = useMemo(() => [
    { name: "Period 1", start_time: "06:30 AM", end_time: "07:15 AM", order_index: 1, period_type: "Teaching" },
    { name: "Period 2", start_time: "07:15 AM", end_time: "08:00 AM", order_index: 2, period_type: "Teaching" },
    { name: "Period 3", start_time: "08:00 AM", end_time: "08:45 AM", order_index: 3, period_type: "Teaching" },
    { name: "Interval", start_time: "08:45 AM", end_time: "09:05 AM", order_index: 4, period_type: "Break" },
    { name: "Period 4", start_time: "09:05 AM", end_time: "09:50 AM", order_index: 5, period_type: "Teaching" },
    { name: "Period 5", start_time: "09:50 AM", end_time: "10:30 AM", order_index: 6, period_type: "Teaching" },
  ], []);

  const dayPeriods = useMemo(() => [
    { name: "Period 1", start_time: "10:45 AM", end_time: "11:30 AM", order_index: 1, period_type: "Teaching" },
    { name: "Period 2", start_time: "11:30 AM", end_time: "12:15 PM", order_index: 2, period_type: "Teaching" },
    { name: "Period 3", start_time: "12:15 PM", end_time: "01:00 PM", order_index: 3, period_type: "Teaching" },
    { name: "Interval", start_time: "01:00 PM", end_time: "01:30 PM", order_index: 4, period_type: "Break" },
    { name: "Period 4", start_time: "01:30 PM", end_time: "02:15 PM", order_index: 5, period_type: "Teaching" },
    { name: "Period 5", start_time: "02:15 PM", end_time: "03:00 PM", order_index: 6, period_type: "Teaching" },
    { name: "Period 6", start_time: "03:00 PM", end_time: "03:45 PM", order_index: 7, period_type: "Teaching" },
  ], []);

  const eveningPeriods = useMemo(() => [
    { name: "Period 1", start_time: "04:00 PM", end_time: "04:45 PM", order_index: 1, period_type: "Teaching" },
    { name: "Period 2", start_time: "04:45 PM", end_time: "05:30 PM", order_index: 2, period_type: "Teaching" },
    { name: "Period 3", start_time: "05:30 PM", end_time: "06:15 PM", order_index: 3, period_type: "Teaching" },
    { name: "Interval", start_time: "06:15 PM", end_time: "06:35 PM", order_index: 4, period_type: "Break" },
    { name: "Period 4", start_time: "06:35 PM", end_time: "07:20 PM", order_index: 5, period_type: "Teaching" },
    { name: "Period 5", start_time: "07:20 PM", end_time: "08:00 PM", order_index: 6, period_type: "Teaching" },
  ], []);

  // Compute display periods according to shift selection or auto-detection
  const displayPeriods = useMemo(() => {
    if (selectedShift === "morning") return morningPeriods;
    if (selectedShift === "day") return dayPeriods;
    if (selectedShift === "evening") return eveningPeriods;

    // Auto detection
    if (entries.length > 0) {
      const firstStart = (entries[0].start_time || "").toUpperCase();
      if (firstStart.includes("06:") || firstStart.includes("07:") || firstStart.includes("08:") || firstStart.includes("09:")) {
        return morningPeriods;
      }
      if (firstStart.includes("10:") || firstStart.includes("11:") || firstStart.includes("12:") || firstStart.includes("01:") || firstStart.includes("02:") || firstStart.includes("03:")) {
        return dayPeriods;
      }
      if (firstStart.includes("04:") || firstStart.includes("05:") || firstStart.includes("06:") || firstStart.includes("07:")) {
        return eveningPeriods;
      }
    }

    if (timetable?.periods && timetable.periods.length > 0) {
      return timetable.periods;
    }

    return morningPeriods;
  }, [selectedShift, timetable, entries, morningPeriods, dayPeriods, eveningPeriods]);

  // Helper to parse time string like "06:30 AM" into minutes from midnight
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

  const activeMinutes = isLiveClock
    ? currentTime.getHours() * 60 + currentTime.getMinutes()
    : (parseInt(customTimeStr.split(":")[0]) || 0) * 60 + (parseInt(customTimeStr.split(":")[1]) || 0);

  const activeDayObj = days.find((d: any) => d.name.toLowerCase() === currentDayName.toLowerCase());

  let currentActivePeriod: any = null;
  let remainingMinutes = 0;

  for (let i = 0; i < displayPeriods.length; i++) {
    const p = displayPeriods[i];
    const sMin = parseTimeToMin(p.start_time);
    const eMin = parseTimeToMin(p.end_time);

    if (activeMinutes >= sMin && activeMinutes < eMin) {
      currentActivePeriod = p;
      remainingMinutes = eMin - activeMinutes;
      break;
    }
  }

  // Find ongoing class entry
  const ongoingClass = useMemo(() => {
    if (!currentDayName) return null;

    const todayClasses = filteredEntries.filter((e: any) => {
      const eDay = (e.day_name || "").trim().toLowerCase();
      return eDay === currentDayName.toLowerCase() || (activeDayObj && e.day_id === activeDayObj.id);
    });

    for (const e of todayClasses) {
      if (e.start_time && e.end_time) {
        const sM = parseTimeToMin(e.start_time);
        const eM = parseTimeToMin(e.end_time);
        if (activeMinutes >= sM && activeMinutes < eM) {
          return e;
        }
      }
    }

    if (currentActivePeriod) {
      const matched = todayClasses.find((e: any) => {
        if (currentActivePeriod.id && e.period_id === currentActivePeriod.id) return true;
        if (currentActivePeriod.name && e.period_name === currentActivePeriod.name) return true;
        if (currentActivePeriod.start_time && e.start_time === currentActivePeriod.start_time) return true;
        const pNum = (currentActivePeriod.name || "").match(/\d+/)?.[0];
        const eNum = (e.period_name || "").match(/\d+/)?.[0];
        if (pNum && eNum && pNum === eNum) return true;
        return false;
      });
      if (matched) return matched;
    }

    return null;
  }, [filteredEntries, currentDayName, activeDayObj, activeMinutes, currentActivePeriod]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomDateStr(e.target.value);
    setIsLiveClock(false);
  };

  const handleDaySelect = (dName: string) => {
    const targetDayIndex = dayNames.indexOf(dName);
    if (targetDayIndex === -1) return;
    const now = new Date();
    const currentDayIndex = now.getDay();
    let diff = targetDayIndex - currentDayIndex;
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() + diff);
    setCustomDateStr(targetDate.toISOString().split("T")[0]);
    setIsLiveClock(false);
  };

  const handleResetToNow = () => {
    const now = new Date();
    setCurrentTime(now);
    setCustomDateStr(now.toISOString().split("T")[0]);
    setCustomTimeStr(`${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`);
    setIsLiveClock(true);
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.origin + "/live-watch");
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };

  if (!isOpen) return null;

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
            <span className={cn(
              "flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-black uppercase tracking-wider text-white transition-all",
              isLiveClock ? "bg-rose-600 animate-pulse" : "bg-amber-600"
            )}>
              <Radio className="h-3 w-3" />
              {isLiveClock ? "LIVE WATCH" : "SIMULATOR"}
            </span>
            <span className="text-sm font-bold text-zinc-100 hidden sm:inline">
              {timetable?.campus_name || campusInfo.campusName} &mdash; Routine Monitor
            </span>
          </div>

          {/* Date Picker, Clock & Actions */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Live Mode Reset */}
            {!isLiveClock && (
              <button
                onClick={handleResetToNow}
                className="flex items-center gap-1 rounded-lg bg-emerald-600 text-white px-2 py-1 text-xs font-bold hover:bg-emerald-700 transition-colors cursor-pointer"
                title="Reset to Real-Time Clock"
              >
                <RotateCcw className="h-3 w-3" />
                Live Now
              </button>
            )}

            {/* Date Input */}
            <div className="flex items-center gap-1.5 rounded-lg bg-zinc-800 px-2 py-1 text-xs font-semibold text-zinc-200 border border-zinc-700">
              <Calendar className="h-3.5 w-3.5 text-zinc-400" />
              <input
                type="date"
                value={customDateStr}
                onChange={handleDateChange}
                className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
                title="Change Routine Date"
              />
            </div>

            {/* Digital Clock */}
            <div className="flex items-center gap-2 bg-zinc-800/90 px-3 py-1 rounded-lg border border-zinc-700 font-mono text-xs text-zinc-200">
              <Clock className={cn("h-3.5 w-3.5", isLiveClock ? "text-emerald-400" : "text-amber-400")} />
              <span className="font-bold" suppressHydrationWarning>
                {mounted ? timeString : "--:--:--"}
              </span>
              <span className="text-zinc-500">|</span>
              <span className="font-sans font-medium" suppressHydrationWarning>
                {mounted ? dateString : "Loading date..."}
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              <button
                onClick={handleShare}
                className="rounded-lg p-1.5 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
                title="Copy Live Watch Link"
              >
                {copiedLink ? <Check className="h-4 w-4 text-emerald-400" /> : <Share2 className="h-4 w-4" />}
              </button>
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="rounded-lg p-1.5 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen View"}
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </button>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-red-500/20 hover:text-red-300 transition-colors cursor-pointer"
                title="Close Live Watch"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Live Status Tracker Banner & Shift Switcher */}
        <div className={cn(
          "border-b px-5 py-3 flex flex-wrap items-center justify-between gap-4 transition-all",
          ongoingClass 
            ? "bg-emerald-50/80 border-emerald-300" 
            : "bg-white border-zinc-200"
        )}>
          <div className="flex items-center gap-3.5">
            <div className={cn(
              "flex h-11 w-11 items-center justify-center rounded-xl text-white font-bold shadow-sm shrink-0",
              ongoingClass ? "bg-emerald-600 animate-pulse" : isLiveClock ? "bg-zinc-900" : "bg-amber-700"
            )}>
              {ongoingClass ? <PlayCircle className="h-6 w-6 text-white" /> : <Clock className="h-5 w-5 text-emerald-400" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  {isLiveClock ? "Real-Time Session" : "Simulated Session"} &bull; {currentDayName}
                </span>
                {ongoingClass ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-[9px] font-black text-white uppercase tracking-wider animate-pulse">
                    <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
                    Live Class Active ({remainingMinutes > 0 ? `${remainingMinutes} mins left` : "Ongoing"})
                  </span>
                ) : currentActivePeriod?.period_type === "Break" || currentActivePeriod?.name?.toLowerCase().includes("interval") ? (
                  <span className="rounded bg-amber-100 px-2 py-0.2 text-[9px] font-bold text-amber-800 uppercase">
                    ☕ Campus Interval / Break
                  </span>
                ) : (
                  <span className="rounded bg-zinc-100 px-2 py-0.2 text-[9px] font-bold text-zinc-600 uppercase">
                    {currentActivePeriod ? `${currentActivePeriod.name}` : "Off-Hours"}
                  </span>
                )}
              </div>

              {/* Ongoing class line */}
              <div className="mt-0.5">
                {ongoingClass ? (
                  <div className="flex flex-wrap items-center gap-x-2 text-xs font-black text-zinc-950">
                    <span>{ongoingClass.subject_name}</span>
                    <span className="rounded bg-emerald-100 px-1 py-0.2 text-[10px] font-bold text-emerald-800">
                      [{ongoingClass.course_type || "TH"}]
                    </span>
                    <span className="text-zinc-700 font-semibold">&bull; Faculty: {ongoingClass.teacher_name} ({ongoingClass.teacher_abbreviation || "TCH"})</span>
                    <span className="text-zinc-600 font-medium">&bull; Room: {ongoingClass.room_number || selectedSection?.room_name || "Room 101"}</span>
                  </div>
                ) : currentActivePeriod?.period_type === "Break" || currentActivePeriod?.name?.toLowerCase().includes("interval") ? (
                  <span className="text-xs text-amber-700 font-bold">☕ Interval / Campus Break ({remainingMinutes} mins remaining)</span>
                ) : (
                  <span className="text-xs text-zinc-600">No active lecture in progress for this section right now.</span>
                )}
              </div>
            </div>
          </div>

          {/* Shift Switcher & Quick Day Switcher & Section Selector */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Shift Selector */}
            <div className="flex items-center gap-1 bg-zinc-100 p-0.5 rounded-lg border border-zinc-200">
              <button
                onClick={() => setSelectedShift("morning")}
                className={cn(
                  "flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-md transition-all cursor-pointer",
                  selectedShift === "morning"
                    ? "bg-zinc-900 text-white shadow-xs"
                    : "text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900"
                )}
                title="Morning Shift (06:30 AM - 10:30 AM)"
              >
                <Sunrise className="h-3 w-3" />
                Morning
              </button>
              <button
                onClick={() => setSelectedShift("day")}
                className={cn(
                  "flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-md transition-all cursor-pointer",
                  selectedShift === "day"
                    ? "bg-zinc-900 text-white shadow-xs"
                    : "text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900"
                )}
                title="Day Shift (10:45 AM - 03:45 PM)"
              >
                <Sun className="h-3 w-3" />
                Day
              </button>
              <button
                onClick={() => setSelectedShift("evening")}
                className={cn(
                  "flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-md transition-all cursor-pointer",
                  selectedShift === "evening"
                    ? "bg-zinc-900 text-white shadow-xs"
                    : "text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900"
                )}
                title="Evening Shift (04:00 PM - 08:00 PM)"
              >
                <Sunset className="h-3 w-3" />
                Evening
              </button>
              <button
                onClick={() => setSelectedShift("auto")}
                className={cn(
                  "px-1.5 py-0.5 text-[9px] font-semibold rounded-md transition-all cursor-pointer",
                  selectedShift === "auto"
                    ? "bg-zinc-700 text-white"
                    : "text-zinc-500 hover:bg-zinc-200"
                )}
                title="Auto-detect from Routine Schedule"
              >
                Auto
              </button>
            </div>

            {/* Quick Day Selector Buttons */}
            <div className="flex items-center gap-1 bg-zinc-100 p-0.5 rounded-lg border border-zinc-200">
              {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((d) => {
                const isSelected = currentDayName.toLowerCase() === d.toLowerCase();
                return (
                  <button
                    key={d}
                    onClick={() => handleDaySelect(d)}
                    className={cn(
                      "px-2 py-0.5 text-[10px] font-bold rounded-md transition-all cursor-pointer",
                      isSelected 
                        ? "bg-zinc-900 text-white shadow-xs" 
                        : "text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900"
                    )}
                  >
                    {d.slice(0, 3)}
                  </button>
                );
              })}
            </div>

            {/* Section Dropdown */}
            <select
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(e.target.value)}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-bold text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-500 cursor-pointer shadow-xs"
            >
              {availableSections.length > 0 ? (
                availableSections.map((s: any) => (
                  <option key={s.id || s.name} value={s.id || s.name}>
                    {s.display_name || `${s.program_name || 'BCA'} ${s.semester_name || ''} - Sec ${s.name || s.id}`}
                  </option>
                ))
              ) : (
                <option value="">Default BCA Section</option>
              )}
            </select>
          </div>
        </div>

        {/* Scrollable Sheet Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          <CampusRoutineSheet
            campusName={timetable?.campus_name || campusInfo.campusName}
            address={timetable?.address || campusInfo.campusAddress}
            programName="Bachelors in Computer Applications (BCA)"
            semesterName={selectedSection?.semester_name || "BCA 1st Sem"}
            sectionName={selectedSection?.name || "A"}
            roomNumber={selectedSection?.room_name || selectedSection?.room_number || "101"}
            title={timetable?.name || campusInfo.routineTitle || "Daily Class Routine"}
            days={days.length > 0 ? days : [
              { id: 1, name: "Sunday" },
              { id: 2, name: "Monday" },
              { id: 3, name: "Tuesday" },
              { id: 4, name: "Wednesday" },
              { id: 5, name: "Thursday" },
              { id: 6, name: "Friday" }
            ]}
            periods={displayPeriods}
            entries={filteredEntries}
            teacherDirectory={timetable?.teacher_directory}
            legend={timetable?.legend}
            activeDayName={currentDayName}
            activePeriodId={currentActivePeriod?.id || currentActivePeriod?.name || (ongoingClass ? ongoingClass.period_name : null)}
          />
        </div>

        {/* Bottom Bar */}
        <div className="bg-zinc-100 border-t border-zinc-200 px-5 py-2.5 flex items-center justify-between text-xs text-zinc-600">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
            <span className="font-semibold text-zinc-800">Live Auto-Sync Active</span>
          </div>
          <span className="text-[11px] text-zinc-500">
            Press ESC or click close to return
          </span>
        </div>
      </div>
    </div>
  );
}
