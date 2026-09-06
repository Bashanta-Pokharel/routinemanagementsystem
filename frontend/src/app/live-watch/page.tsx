"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Radio, Clock, Calendar, Maximize2, Minimize2, 
  Printer, ArrowLeft, RefreshCw, Sparkles, Share2, Check,
  RotateCcw, Sliders, ChevronDown, Sun, Sunrise, Sunset,
  BookOpen, User, Building, PlayCircle
} from "lucide-react";
import Link from "next/link";
import { CampusRoutineSheet } from "@/components/CampusRoutineSheet";
import { useCampusInfo } from "@/lib/campusSettings";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function LiveWatchPage() {
  const { campusInfo } = useCampusInfo();
  const [mounted, setMounted] = useState(false);
  const [timetable, setTimetable] = useState<any | null>(null);
  const [days, setDays] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<number | string>("");
  const [loading, setLoading] = useState(true);
  
  // Shift option: "auto" | "morning" | "day" | "evening"
  const [selectedShift, setSelectedShift] = useState<"auto" | "morning" | "day" | "evening">("auto");

  // Real-time & Custom Date/Time Control
  const [isLiveClock, setIsLiveClock] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [customDateStr, setCustomDateStr] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [customTimeStr, setCustomTimeStr] = useState<string>("07:30"); // HH:MM 24h
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMounted(true);
    loadData();
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

  const loadData = async () => {
    setLoading(true);
    try {
      const [ttList, daysData, secData] = await Promise.all([
        api.getTimetables(),
        api.getWorkingDays(),
        api.getSections(),
      ]);

      setDays(daysData || []);
      setSections(secData || []);

      if (ttList && ttList.length > 0) {
        const fullTt = await api.getTimetable(ttList[0].id);
        setTimetable(fullTt);
        
        // Auto-select section with entries
        if (fullTt.entries && fullTt.entries.length > 0) {
          setSelectedSectionId(fullTt.entries[0].section_id || fullTt.entries[0].section_name || "");
        } else if (secData && secData.length > 0) {
          setSelectedSectionId(secData[0].id);
        }
      }
    } catch (e) {
      console.error("Failed to load live routine data", e);
    } finally {
      setLoading(false);
    }
  };

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

  const entries = timetable?.entries || [];

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

  // Ensure selectedSectionId points to a valid section
  useEffect(() => {
    if (availableSections.length > 0) {
      const exists = availableSections.some((s: any) => 
        s.id === Number(selectedSectionId) || 
        String(s.id) === String(selectedSectionId) || 
        s.name === String(selectedSectionId)
      );
      if (!exists || !selectedSectionId) {
        setSelectedSectionId(availableSections[0].id || availableSections[0].name || "");
      }
    }
  }, [availableSections, selectedSectionId]);

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
    { name: "Period 1", start_time: "10:00 AM", end_time: "11:00 AM", order_index: 1, period_type: "Teaching" },
    { name: "Period 2", start_time: "11:00 AM", end_time: "12:00 PM", order_index: 2, period_type: "Teaching" },
    { name: "Period 3", start_time: "12:00 PM", end_time: "01:00 PM", order_index: 3, period_type: "Teaching" },
    { name: "Interval", start_time: "01:00 PM", end_time: "01:30 PM", order_index: 4, period_type: "Break" },
    { name: "Period 4", start_time: "01:30 PM", end_time: "02:30 PM", order_index: 5, period_type: "Teaching" },
    { name: "Period 5", start_time: "02:30 PM", end_time: "03:30 PM", order_index: 6, period_type: "Teaching" },
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

    // Auto detection from routine entries
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

  // 1. Identify active period
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

  // 2. Identify ongoing class with smart time & slot matching
  const ongoingClass = useMemo(() => {
    if (!currentDayName) return null;

    const todayClasses = filteredEntries.filter((e: any) => {
      const eDay = (e.day_name || "").trim().toLowerCase();
      return eDay === currentDayName.toLowerCase() || (activeDayObj && e.day_id === activeDayObj.id);
    });

    // Check by actual minute window
    for (const e of todayClasses) {
      if (e.start_time && e.end_time) {
        const sM = parseTimeToMin(e.start_time);
        const eM = parseTimeToMin(e.end_time);
        if (activeMinutes >= sM && activeMinutes < eM) {
          return e;
        }
      }
    }

    // Check by active period mapping
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

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <div
      className={cn(
        "min-h-screen bg-zinc-100 text-zinc-900 flex flex-col font-sans transition-all",
        isFullscreen ? "p-0" : "p-3 sm:p-5 md:p-6"
      )}
    >
      <div className="mx-auto w-full max-w-6xl flex-1 flex flex-col space-y-4">
        {/* Navigation & Live Control Header */}
        <div className="rounded-2xl border border-zinc-300 bg-white p-4 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/timetables"
              className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-bold text-zinc-700 hover:bg-zinc-100 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
            <div className="flex items-center gap-2">
              <span className={cn(
                "flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-white transition-all",
                isLiveClock ? "bg-rose-600 animate-pulse" : "bg-amber-600"
              )}>
                <Radio className="h-3 w-3" />
                {isLiveClock ? "LIVE STREAM" : "SIMULATOR"}
              </span>
              <h1 className="text-sm sm:text-base font-bold text-zinc-900">
                {timetable?.campus_name || campusInfo.campusName} &mdash; Routine Watch
              </h1>
            </div>
          </div>

          {/* Interactive Date, Day & Time Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Live Mode Toggle / Reset */}
            {!isLiveClock && (
              <button
                onClick={handleResetToNow}
                className="flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition-colors cursor-pointer shadow-xs"
                title="Reset to Real-Time Clock"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset to Live Now
              </button>
            )}

            {/* Date Picker */}
            <div className="flex items-center gap-1.5 rounded-xl border border-zinc-300 bg-zinc-50 px-2.5 py-1 text-xs font-semibold text-zinc-800 shadow-xs">
              <Calendar className="h-3.5 w-3.5 text-zinc-500" />
              <input
                type="date"
                value={customDateStr}
                onChange={handleDateChange}
                className="bg-transparent text-xs font-bold text-zinc-900 focus:outline-none cursor-pointer"
                title="Change Routine Date"
              />
            </div>

            {/* Time / Clock display with suppression of hydration mismatch */}
            <div className="flex items-center gap-2 bg-zinc-900 text-white px-3.5 py-1.5 rounded-xl text-xs font-mono shadow-xs">
              <Clock className={cn("h-3.5 w-3.5", isLiveClock ? "text-emerald-400" : "text-amber-400")} />
              <span className="font-bold" suppressHydrationWarning>
                {mounted ? timeString : "--:--:--"}
              </span>
              <span className="text-zinc-500">|</span>
              <span className="text-zinc-300 font-sans font-medium" suppressHydrationWarning>
                {mounted ? dateString : "Loading date..."}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleCopyLink}
                className="rounded-xl border border-zinc-200 bg-zinc-50 p-2 text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
                title="Share Live Routine Link"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Share2 className="h-4 w-4" />}
              </button>
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="rounded-xl border border-zinc-200 bg-zinc-50 p-2 text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Display"}
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Live Status Tracker Banner & Ongoing Lecture Box */}
        <div className={cn(
          "rounded-2xl border p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all",
          ongoingClass 
            ? "border-emerald-400 bg-emerald-50/50 shadow-emerald-100" 
            : "border-zinc-300 bg-white"
        )}>
          <div className="flex items-center gap-3.5">
            <div className={cn(
              "flex h-12 w-12 items-center justify-center rounded-2xl text-white shrink-0 shadow-sm",
              ongoingClass ? "bg-emerald-600 animate-pulse" : isLiveClock ? "bg-zinc-900" : "bg-amber-700"
            )}>
              {ongoingClass ? <PlayCircle className="h-7 w-7 text-white" /> : <Clock className="h-6 w-6 text-emerald-400" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">
                  {isLiveClock ? "Real-Time Lecture Status" : "Simulated Lecture Status"} &bull; {currentDayName}
                </span>
                {ongoingClass ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-[9px] font-black text-white uppercase tracking-wider animate-pulse">
                    <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
                    Live Class in Progress ({remainingMinutes > 0 ? `${remainingMinutes} mins left` : "Active"})
                  </span>
                ) : currentActivePeriod?.period_type === "Break" || currentActivePeriod?.name?.toLowerCase().includes("interval") ? (
                  <span className="rounded bg-amber-100 px-2 py-0.5 text-[9px] font-black text-amber-800 uppercase">
                    ☕ Campus Interval / Break
                  </span>
                ) : (
                  <span className="rounded bg-zinc-100 px-2 py-0.5 text-[9px] font-bold text-zinc-600 uppercase">
                    {currentActivePeriod ? `${currentActivePeriod.name} (${currentActivePeriod.start_time} - ${currentActivePeriod.end_time})` : "Off-Hours"}
                  </span>
                )}
              </div>

              {/* Lecture Details */}
              <div className="mt-1">
                {ongoingClass ? (
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="text-base font-black text-zinc-950">
                      {ongoingClass.subject_name}
                    </span>
                    <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                      [{ongoingClass.course_type || "TH"}]
                    </span>
                    <span className="text-xs font-bold text-zinc-700">
                      &bull; Faculty: {ongoingClass.teacher_name} ({ongoingClass.teacher_abbreviation || "TCH"})
                    </span>
                    <span className="text-xs font-semibold text-zinc-600">
                      &bull; Room: {ongoingClass.room_number || selectedSection?.room_name || "Room 101"}
                    </span>
                  </div>
                ) : currentActivePeriod?.period_type === "Break" || currentActivePeriod?.name?.toLowerCase().includes("interval") ? (
                  <span className="text-sm text-amber-800 font-bold">☕ Campus Interval / Break Time ({remainingMinutes} mins remaining)</span>
                ) : (
                  <span className="text-xs font-medium text-zinc-600">No active lecture scheduled for this section at this moment.</span>
                )}
              </div>
            </div>
          </div>

          {/* Shift Switcher + Day Filters + Section Selector */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Shift Selector Tabs */}
            <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl border border-zinc-200">
              <button
                onClick={() => setSelectedShift("morning")}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer",
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
                  "flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer",
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
                  "flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer",
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
                  "flex items-center gap-1 px-2 py-1 text-[10px] font-semibold rounded-lg transition-all cursor-pointer",
                  selectedShift === "auto"
                    ? "bg-zinc-700 text-white"
                    : "text-zinc-500 hover:bg-zinc-200"
                )}
                title="Auto-detect from Routine Schedule"
              >
                Auto
              </button>
            </div>

            {/* Quick Day Filter Buttons */}
            <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl border border-zinc-200">
              {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((d) => {
                const isSelected = currentDayName.toLowerCase() === d.toLowerCase();
                return (
                  <button
                    key={d}
                    onClick={() => handleDaySelect(d)}
                    className={cn(
                      "px-2 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer",
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

            {/* Section Selector */}
            <div className="flex items-center gap-1.5">
              <select
                value={selectedSectionId}
                onChange={(e) => setSelectedSectionId(e.target.value)}
                className="rounded-xl border border-zinc-300 bg-zinc-50 px-3 py-1.5 text-xs font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-600 cursor-pointer shadow-xs"
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
        </div>

        {/* Live Sheet View */}
        {loading ? (
          <div className="rounded-2xl border border-zinc-300 bg-white p-12 text-center text-xs text-zinc-500">
            Loading Live Campus Routine Sheet...
          </div>
        ) : (
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
            activeDayName={currentDayName}
            activePeriodId={currentActivePeriod?.id || currentActivePeriod?.name || (ongoingClass ? ongoingClass.period_name : null)}
          />
        )}
      </div>
    </div>
  );
}
