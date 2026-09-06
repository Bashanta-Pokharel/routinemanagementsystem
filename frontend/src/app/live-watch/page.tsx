"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Radio, Clock, Calendar, Maximize2, Minimize2, 
  ArrowLeft, Share2, Check,
  RotateCcw, Sun, Sunrise, Sunset,
  PlayCircle, Printer, FileText, FileSpreadsheet
} from "lucide-react";
import Link from "next/link";
import { CampusRoutineSheet } from "@/components/CampusRoutineSheet";
import { useCampusInfo } from "@/lib/campusSettings";
import { api, downloadExportFile } from "@/lib/api";
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
  const [customTimeStr, setCustomTimeStr] = useState<string>("10:30");
  
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
        
        if (fullTt.entries && fullTt.entries.length > 0) {
          setSelectedSectionId(fullTt.entries[0].section_id || fullTt.entries[0].section_name || "");
        } else if (secData && secData.length > 0) {
          setSelectedSectionId(secData[0].id);
        }
      } else if (typeof window !== "undefined") {
        const cached = localStorage.getItem("bca_generated_routine_cache");
        if (cached) {
          const parsed = JSON.parse(cached);
          setTimetable(parsed);
          const entries = parsed.entries || parsed.all_entries || [];
          if (entries.length > 0) {
            setSelectedSectionId(entries[0].section_id || entries[0].section_name || "");
          }
        }
      }
    } catch (e) {
      console.error("Failed to load live routine data", e);
      if (typeof window !== "undefined") {
        try {
          const cached = localStorage.getItem("bca_generated_routine_cache");
          if (cached) {
            const parsed = JSON.parse(cached);
            setTimetable(parsed);
          }
        } catch (err) {}
      }
    } finally {
      setLoading(false);
    }
  };

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

  const handleDaySelect = (dayName: string) => {
    setIsLiveClock(false);
    const targetDayIndex = dayNames.findIndex((d) => d.toLowerCase() === dayName.toLowerCase());
    if (targetDayIndex !== -1) {
      const d = new Date(activeDate);
      const currentDayIndex = d.getDay();
      const diff = targetDayIndex - currentDayIndex;
      d.setDate(d.getDate() + diff);
      setCustomDateStr(d.toISOString().split("T")[0]);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsLiveClock(false);
    setCustomDateStr(e.target.value);
  };

  const handleResetToNow = () => {
    const now = new Date();
    setIsLiveClock(true);
    setCurrentTime(now);
    setCustomDateStr(now.toISOString().split("T")[0]);
    setCustomTimeStr(`${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`);
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const activeDayObj = useMemo(() => {
    return (
      days.find((d) => d.name?.toLowerCase() === currentDayName.toLowerCase()) ||
      days[0] ||
      null
    );
  }, [days, currentDayName]);

  const rawPeriods = useMemo(() => {
    if (activeDayObj && activeDayObj.periods && activeDayObj.periods.length > 0) {
      return [...activeDayObj.periods].sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
    }
    return [
      { id: 1, name: "Period 1", start_time: "10:00 AM", end_time: "11:00 AM", period_type: "Teaching" },
      { id: 2, name: "Period 2", start_time: "11:00 AM", end_time: "12:00 PM", period_type: "Teaching" },
      { id: 3, name: "Period 3", start_time: "12:00 PM", end_time: "01:00 PM", period_type: "Teaching" },
      { id: 4, name: "Interval", start_time: "01:00 PM", end_time: "01:30 PM", period_type: "Break" },
      { id: 5, name: "Period 4", start_time: "01:30 PM", end_time: "02:30 PM", period_type: "Teaching" },
      { id: 6, name: "Period 5", start_time: "02:30 PM", end_time: "03:30 PM", period_type: "Teaching" },
    ];
  }, [activeDayObj]);

  const displayPeriods = rawPeriods;

  const availableSections = useMemo(() => {
    if (timetable?.entries && timetable.entries.length > 0) {
      const map = new Map();
      timetable.entries.forEach((e: any) => {
        const key = e.section_id || e.section_name;
        if (key && !map.has(key)) {
          map.set(key, {
            id: e.section_id || key,
            name: e.section_name || key,
            semester_name: e.semester_name || "BCA",
            program_name: e.program_name || "BCA",
            display_name: `${e.program_name || 'BCA'} ${e.semester_name || ''} - Sec ${e.section_name || key}`,
            room_name: e.room_number || "101",
          });
        }
      });
      return Array.from(map.values());
    }
    return sections;
  }, [timetable, sections]);

  const selectedSection = useMemo(() => {
    return (
      availableSections.find(
        (s) => String(s.id) === String(selectedSectionId) || s.name === selectedSectionId
      ) || availableSections[0] || null
    );
  }, [availableSections, selectedSectionId]);

  const filteredEntries = useMemo(() => {
    if (!timetable?.entries) return [];
    if (!selectedSection) return timetable.entries;
    return timetable.entries.filter((e: any) => {
      const matchId = selectedSection.id && e.section_id && String(e.section_id) === String(selectedSection.id);
      const matchName = selectedSection.name && e.section_name && String(e.section_name).toLowerCase() === String(selectedSection.name).toLowerCase();
      return matchId || matchName;
    });
  }, [timetable, selectedSection]);

  const { currentActivePeriod, ongoingClass, remainingMinutes } = useMemo(() => {
    const parseTimeToMinutes = (tStr: string) => {
      if (!tStr) return 0;
      const clean = tStr.trim().toLowerCase();
      const isPM = clean.includes("pm");
      const isAM = clean.includes("am");
      const parts = clean.replace(/[apm\s]/g, "").split(":");
      let hrs = parseInt(parts[0], 10) || 0;
      const mins = parseInt(parts[1], 10) || 0;
      if (isPM && hrs < 12) hrs += 12;
      if (isAM && hrs === 12) hrs = 0;
      return hrs * 60 + mins;
    };

    const curHours = isLiveClock ? currentTime.getHours() : parseInt(customTimeStr.split(":")[0], 10) || 0;
    const curMinutes = isLiveClock ? currentTime.getMinutes() : parseInt(customTimeStr.split(":")[1], 10) || 0;
    const nowMinutes = curHours * 60 + curMinutes;

    let foundPeriod: any = null;
    let foundEntry: any = null;
    let remMins = 0;

    for (const p of displayPeriods) {
      const pStart = parseTimeToMinutes(p.start_time);
      const pEnd = parseTimeToMinutes(p.end_time);

      if (nowMinutes >= pStart && nowMinutes < pEnd) {
        foundPeriod = p;
        remMins = pEnd - nowMinutes;

        const pStartStr = (p.start_time || "").replace(/\s+/g, "").toLowerCase();

        foundEntry = filteredEntries.find((e: any) => {
          const eDay = (e.day_name || e.day_short_code || "").toLowerCase();
          const curD = currentDayName.toLowerCase();
          const matchDay = eDay === curD || eDay.includes(curD) || curD.includes(eDay) || (activeDayObj && e.day_id === activeDayObj.id);

          const eStartStr = (e.start_time || "").replace(/\s+/g, "").toLowerCase();
          const matchPeriod = 
            (e.period_id && p.id && e.period_id === p.id) ||
            (pStartStr && eStartStr && pStartStr === eStartStr) ||
            (e.period_name && p.name && e.period_name.toLowerCase() === p.name.toLowerCase());

          return matchDay && matchPeriod;
        });
        break;
      }
    }

    return {
      currentActivePeriod: foundPeriod,
      ongoingClass: foundEntry,
      remainingMinutes: remMins,
    };
  }, [isLiveClock, currentTime, customTimeStr, displayPeriods, filteredEntries, currentDayName, activeDayObj]);

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

  return (
    <div
      className={cn(
        "min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans transition-colors",
        isFullscreen ? "p-0" : "p-3 sm:p-5 md:p-6"
      )}
    >
      <div className="mx-auto w-full max-w-6xl flex-1 flex flex-col space-y-4">
        {/* Navigation & Live Control Header */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/timetables"
              className="flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
            <div className="flex items-center gap-2">
              <span className={cn(
                "flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-mono font-bold uppercase tracking-wider shadow-xs",
                isLiveClock 
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white animate-pulse" 
                  : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700"
              )}>
                <Radio className="h-3 w-3" />
                {isLiveClock ? "LIVE STREAM" : "SIMULATOR"}
              </span>
              <h1 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white">
                {timetable?.campus_name || campusInfo.campusName} &mdash; Routine Watch
              </h1>
            </div>
          </div>

          {/* Interactive Date, Day & Time Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {!isLiveClock && (
              <button
                onClick={handleResetToNow}
                className="flex items-center gap-1.5 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1.5 text-xs font-bold text-emerald-900 dark:text-emerald-200 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors cursor-pointer shadow-xs"
                title="Reset to Real-Time Clock"
              >
                <RotateCcw className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                Reset to Live Now
              </button>
            )}

            {/* Date Picker */}
            <div className="flex items-center gap-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-2.5 py-1 text-xs font-semibold text-zinc-800 dark:text-zinc-200 shadow-xs">
              <Calendar className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <input
                type="date"
                value={customDateStr}
                onChange={handleDateChange}
                className="bg-transparent text-xs font-bold text-zinc-900 dark:text-white focus:outline-none cursor-pointer"
                title="Change Routine Date"
              />
            </div>

            {/* Time / Clock display */}
            <div className="flex items-center gap-2 bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 text-white px-3.5 py-1.5 rounded-xl text-xs font-mono shadow-sm border border-emerald-600/30">
              <Clock className="h-3.5 w-3.5 text-emerald-300" />
              <span className="font-bold text-emerald-50" suppressHydrationWarning>
                {mounted ? timeString : "--:--:--"}
              </span>
              <span className="text-emerald-400/60">|</span>
              <span className="font-sans font-medium text-emerald-100" suppressHydrationWarning>
                {mounted ? dateString : "Loading date..."}
              </span>
            </div>

            {/* Action Buttons: Print, PDF, Excel, Share, Fullscreen */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-2.5 py-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-emerald-50 dark:hover:bg-zinc-700 hover:text-emerald-700 dark:hover:text-white transition-colors cursor-pointer shadow-xs"
                title="Print Routine"
              >
                <Printer className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden sm:inline">Print</span>
              </button>
              <button
                onClick={handleDownloadPdf}
                className="flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-2.5 py-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-emerald-50 dark:hover:bg-zinc-700 hover:text-emerald-700 dark:hover:text-white transition-colors cursor-pointer shadow-xs"
                title="Download as PDF"
              >
                <FileText className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                <span className="hidden sm:inline">PDF</span>
              </button>
              <button
                onClick={handleDownloadExcel}
                className="flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-2.5 py-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-emerald-50 dark:hover:bg-zinc-700 hover:text-emerald-700 dark:hover:text-white transition-colors cursor-pointer shadow-xs"
                title="Download as Excel (.xlsx)"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden sm:inline">Excel</span>
              </button>
              <button
                onClick={handleCopyLink}
                className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 p-2 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer shadow-xs"
                title="Share Live Routine Link"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> : <Share2 className="h-4 w-4" />}
              </button>
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 p-2 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer shadow-xs"
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Display"}
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Live Status Tracker Banner */}
        <div className={cn(
          "rounded-2xl border p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all",
          ongoingClass 
            ? "bg-gradient-to-r from-emerald-50/90 via-teal-50/60 to-emerald-50/40 dark:from-emerald-950/40 dark:via-zinc-900 dark:to-zinc-900 border-emerald-300 dark:border-emerald-800/60 shadow-sm" 
            : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
        )}>
          <div className="flex items-center gap-3.5">
            <div className={cn(
              "flex h-12 w-12 items-center justify-center rounded-2xl text-white shrink-0 shadow-xs transition-all",
              ongoingClass 
                ? "bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-700 animate-pulse ring-2 ring-emerald-500/40 shadow-emerald-500/20" 
                : "bg-gradient-to-tr from-emerald-700 to-teal-800 text-emerald-100"
            )}>
              {ongoingClass ? <PlayCircle className="h-6 w-6" /> : <Clock className="h-6 w-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                  {isLiveClock ? "Real-Time Status" : "Simulator Status"} &bull; {currentDayName}
                </span>
                {ongoingClass ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-600 to-teal-700 text-white px-2.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider shadow-xs animate-pulse">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                    </span>
                    Class Active ({remainingMinutes > 0 ? `${remainingMinutes}m left` : "Active"})
                  </span>
                ) : (
                  <span className="rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 text-[9px] font-mono font-bold uppercase">
                    {currentActivePeriod ? `${currentActivePeriod.name} (${currentActivePeriod.start_time} - ${currentActivePeriod.end_time})` : "Off-Hours"}
                  </span>
                )}
              </div>

              {/* Lecture Details */}
              <div className="mt-1">
                {ongoingClass ? (
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="text-base font-bold text-emerald-950 dark:text-emerald-100">
                      {ongoingClass.subject_name}
                    </span>
                    <span className="rounded bg-emerald-100 dark:bg-emerald-900/60 px-1.5 py-0.5 text-[10px] font-mono font-bold text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800">
                      [{ongoingClass.course_type || "TH"}]
                    </span>
                    <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      &bull; Faculty: {ongoingClass.teacher_name} ({ongoingClass.teacher_abbreviation || "TCH"})
                    </span>
                    <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      &bull; Room: {ongoingClass.room_number || selectedSection?.room_name || "Room 101"}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">No active lecture scheduled for this section at this moment.</span>
                )}
              </div>
            </div>
          </div>

          {/* Shift Switcher + Day Filters + Section Selector */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Quick Day Filter Buttons */}
            <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl border border-zinc-200 dark:border-zinc-700">
              {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((d) => {
                const isSelected = currentDayName.toLowerCase() === d.toLowerCase();
                return (
                  <button
                    key={d}
                    onClick={() => handleDaySelect(d)}
                    className={cn(
                      "px-2 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer",
                      isSelected 
                        ? "bg-emerald-600 text-white shadow-xs font-bold ring-1 ring-emerald-700" 
                        : "text-zinc-600 dark:text-zinc-400 hover:bg-emerald-50 dark:hover:bg-zinc-700 hover:text-emerald-700 dark:hover:text-white"
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
                className="rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs font-bold text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-xs"
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
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-12 text-center text-xs text-zinc-500">
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
            activePeriodId={currentActivePeriod?.id || currentActivePeriod?.name || (ongoingClass ? (ongoingClass.period_id || ongoingClass.period_name || ongoingClass.start_time) : null) || currentActivePeriod?.start_time}
          />
        )}
      </div>
    </div>
  );
}
