"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Clock, Maximize2, Minimize2, Radio, Calendar, 
  Layers, User, Sparkles, X, ChevronRight, Volume2, ShieldCheck, Share2, Check,
  RotateCcw, Sun, Sunrise, Sunset, PlayCircle, Printer, FileText, FileSpreadsheet
} from "lucide-react";
import { CampusRoutineSheet } from "./CampusRoutineSheet";
import { useCampusInfo } from "@/lib/campusSettings";
import { downloadExportFile } from "@/lib/api";
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

  // Get effective timetable (from prop or cached generated routine)
  const effectiveTimetable = useMemo(() => {
    if (timetable && (timetable.entries?.length || timetable.all_entries?.length || timetable.semester_routines)) {
      return timetable;
    }
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("bca_generated_routine_cache");
        if (cached) return JSON.parse(cached);
      } catch (e) {}
    }
    return timetable;
  }, [timetable]);

  // Get current section entries
  const entries = effectiveTimetable?.entries || effectiveTimetable?.all_entries || [];

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

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadExcel = () => {
    const tid = timetable?.id || timetable?.timetable_id || 1;
    downloadExportFile(tid, "excel", `${timetable?.campus_name || campusInfo.campusName || "Campus"}_Routine.xlsx`);
  };

  const handleDownloadPdf = () => {
    const tid = timetable?.id || timetable?.timetable_id || 1;
    downloadExportFile(tid, "pdf", `${timetable?.campus_name || campusInfo.campusName || "Campus"}_Routine.pdf`);
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
        <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 text-white px-5 py-3.5 border-b border-emerald-800/60 shadow-md">
          <div className="flex items-center gap-3">
            <span className={cn(
              "flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-black uppercase tracking-wider transition-all",
              isLiveClock ? "bg-white text-emerald-950 animate-pulse" : "bg-emerald-800 text-emerald-100 border border-emerald-600/50"
            )}>
              <Radio className="h-3 w-3" />
              {isLiveClock ? "LIVE WATCH" : "SIMULATOR"}
            </span>
            <span className="text-sm font-bold text-emerald-50 hidden sm:inline">
              {timetable?.campus_name || campusInfo.campusName} &mdash; Routine Monitor
            </span>
          </div>

          {/* Date Picker, Clock & Actions */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Live Mode Reset */}
            {!isLiveClock && (
              <button
                onClick={handleResetToNow}
                className="flex items-center gap-1 rounded-lg bg-emerald-100 text-emerald-950 px-2 py-1 text-xs font-bold hover:bg-white transition-colors cursor-pointer"
                title="Reset to Real-Time Clock"
              >
                <RotateCcw className="h-3 w-3" />
                Live Now
              </button>
            )}

            {/* Date Input */}
            <div className="flex items-center gap-1.5 rounded-lg bg-emerald-950/80 px-2 py-1 text-xs font-semibold text-emerald-100 border border-emerald-700/60">
              <Calendar className="h-3.5 w-3.5 text-emerald-400" />
              <input
                type="date"
                value={customDateStr}
                onChange={handleDateChange}
                className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
                title="Change Routine Date"
              />
            </div>

            {/* Digital Clock */}
            <div className="flex items-center gap-2 bg-emerald-950/80 px-3 py-1 rounded-lg border border-emerald-700/60 font-mono text-xs text-emerald-100">
              <Clock className="h-3.5 w-3.5 text-emerald-400" />
              <span className="font-bold" suppressHydrationWarning>
                {mounted ? timeString : "--:--:--"}
              </span>
              <span className="text-emerald-500">|</span>
              <span className="font-sans font-medium" suppressHydrationWarning>
                {mounted ? dateString : "Loading date..."}
              </span>
            </div>

            {/* Actions: Print, PDF, Excel, Share, Fullscreen, Close */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={handlePrint}
                className="flex items-center gap-1 rounded-lg bg-emerald-800/60 hover:bg-emerald-700 px-2 py-1 text-xs font-bold text-emerald-100 transition-colors cursor-pointer border border-emerald-600/40"
                title="Print Routine"
              >
                <Printer className="h-3.5 w-3.5 text-emerald-300" />
                <span className="hidden sm:inline">Print</span>
              </button>
              <button
                onClick={handleDownloadPdf}
                className="flex items-center gap-1 rounded-lg bg-emerald-800/60 hover:bg-emerald-700 px-2 py-1 text-xs font-bold text-emerald-100 transition-colors cursor-pointer border border-emerald-600/40"
                title="Download as PDF"
              >
                <FileText className="h-3.5 w-3.5 text-rose-300" />
                <span className="hidden sm:inline">PDF</span>
              </button>
              <button
                onClick={handleDownloadExcel}
                className="flex items-center gap-1 rounded-lg bg-emerald-800/60 hover:bg-emerald-700 px-2 py-1 text-xs font-bold text-emerald-100 transition-colors cursor-pointer border border-emerald-600/40"
                title="Download as Excel (.xlsx)"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-300" />
                <span className="hidden sm:inline">Excel</span>
              </button>
              <button
                onClick={handleShare}
                className="rounded-lg p-1.5 text-emerald-200 hover:bg-emerald-800 hover:text-white transition-colors cursor-pointer"
                title="Copy Live Watch Link"
              >
                {copiedLink ? <Check className="h-4 w-4 text-white" /> : <Share2 className="h-4 w-4" />}
              </button>
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="rounded-lg p-1.5 text-emerald-200 hover:bg-emerald-800 hover:text-white transition-colors cursor-pointer"
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen View"}
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </button>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-emerald-300 hover:bg-emerald-800 hover:text-white transition-colors cursor-pointer"
                title="Close Live Watch"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Live Status Tracker Banner & Shift Switcher */}
        <div className={cn(
          "border-b px-5 py-3.5 flex flex-wrap items-center justify-between gap-4 transition-all",
          ongoingClass 
            ? "bg-gradient-to-r from-emerald-50/80 via-teal-50/50 to-emerald-50/30 dark:from-emerald-950/40 dark:via-zinc-900 dark:to-zinc-900 border-emerald-200 dark:border-emerald-800/60" 
            : "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800"
        )}>
          <div className="flex items-center gap-3.5">
            <div className={cn(
              "flex h-11 w-11 items-center justify-center rounded-2xl font-bold shadow-md shrink-0",
              ongoingClass ? "bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-700 text-white animate-pulse" : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            )}>
              {ongoingClass ? <PlayCircle className="h-6 w-6" /> : <Clock className="h-5 w-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  {isLiveClock ? "Real-Time Session" : "Simulated Session"} &bull; {currentDayName}
                </span>
                {ongoingClass ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-600 to-teal-700 px-2.5 py-0.5 text-[9px] font-black text-white uppercase tracking-wider shadow-xs animate-pulse">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                    </span>
                    Live Class Active ({remainingMinutes > 0 ? `${remainingMinutes} mins left` : "Ongoing"})
                  </span>
                ) : currentActivePeriod?.period_type === "Break" || currentActivePeriod?.name?.toLowerCase().includes("interval") ? (
                  <span className="rounded-full bg-amber-100 dark:bg-amber-950 px-2.5 py-0.5 text-[9px] font-black text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 uppercase">
                    ☕ Campus Interval / Break
                  </span>
                ) : (
                  <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 text-[9px] font-bold text-zinc-600 dark:text-zinc-300 uppercase">
                    {currentActivePeriod ? `${currentActivePeriod.name}` : "Off-Hours"}
                  </span>
                )}
              </div>

              {/* Ongoing class line */}
              <div className="mt-1">
                {ongoingClass ? (
                  <div className="flex flex-wrap items-center gap-x-2 text-xs font-black text-zinc-950 dark:text-white">
                    <span className="text-emerald-700 dark:text-emerald-300 text-sm font-black">{ongoingClass.subject_name}</span>
                    <span className="rounded-md bg-emerald-100 dark:bg-emerald-950 px-1.5 py-0.5 text-[10px] font-black text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      [{ongoingClass.course_type || "TH"}]
                    </span>
                    <span className="text-zinc-700 dark:text-zinc-300 font-semibold">&bull; Faculty: {ongoingClass.teacher_name} ({ongoingClass.teacher_abbreviation || "TCH"})</span>
                    <span className="text-zinc-600 dark:text-zinc-400 font-medium">&bull; Room: {ongoingClass.room_number || selectedSection?.room_name || "Room 101"}</span>
                  </div>
                ) : currentActivePeriod?.period_type === "Break" || currentActivePeriod?.name?.toLowerCase().includes("interval") ? (
                  <span className="text-xs text-amber-700 dark:text-amber-300 font-bold">☕ Interval / Campus Break ({remainingMinutes} mins remaining)</span>
                ) : (
                  <span className="text-xs text-zinc-600 dark:text-zinc-400">No active lecture in progress for this section right now.</span>
                )}
              </div>
            </div>
          </div>

          {/* Shift Switcher & Quick Day Switcher & Section Selector */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Shift Selector */}
            <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-700">
              <button
                onClick={() => setSelectedShift("morning")}
                className={cn(
                  "flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-md transition-all cursor-pointer",
                  selectedShift === "morning"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-zinc-900"
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
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-zinc-900"
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
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-zinc-900"
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
                    ? "bg-emerald-700 text-white"
                    : "text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                )}
                title="Auto-detect from Routine Schedule"
              >
                Auto
              </button>
            </div>

            {/* Quick Day Selector Buttons */}
            <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-700">
              {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((d) => {
                const isSelected = currentDayName.toLowerCase() === d.toLowerCase();
                return (
                  <button
                    key={d}
                    onClick={() => handleDaySelect(d)}
                    className={cn(
                      "px-2 py-0.5 text-[10px] font-bold rounded-md transition-all cursor-pointer",
                      isSelected 
                        ? "bg-emerald-600 text-white shadow-xs font-bold" 
                        : "text-zinc-600 dark:text-zinc-300 hover:bg-emerald-50 dark:hover:bg-zinc-700 hover:text-emerald-700"
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
              className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs font-bold text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-xs"
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
            activePeriodId={currentActivePeriod?.id || currentActivePeriod?.name || (ongoingClass ? (ongoingClass.period_id || ongoingClass.period_name || ongoingClass.start_time) : null) || currentActivePeriod?.start_time}
          />
        </div>

        {/* Bottom Bar */}
        <div className="bg-zinc-100 border-t border-zinc-200 px-5 py-2.5 flex items-center justify-between text-xs text-zinc-600 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-zinc-900 dark:bg-zinc-100 inline-block" />
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">Live Auto-Sync Active</span>
          </div>
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
            Press ESC or click close to return
          </span>
        </div>
      </div>
    </div>
  );
}
