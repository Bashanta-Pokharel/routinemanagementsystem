"use client";

import React, { useState, useEffect } from "react";
import { 
  Radio, Clock, Calendar, Maximize2, Minimize2, 
  Printer, ArrowLeft, RefreshCw, Sparkles, Share2, Check
} from "lucide-react";
import Link from "next/link";
import { CampusRoutineSheet } from "@/components/CampusRoutineSheet";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function LiveWatchPage() {
  const [timetable, setTimetable] = useState<any | null>(null);
  const [days, setDays] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<number | string>("");
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadData();
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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
        if (secData && secData.length > 0) {
          setSelectedSectionId(secData[0].id);
        }
      }
    } catch (e) {
      console.error("Failed to load live routine data", e);
    } finally {
      setLoading(false);
    }
  };

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const currentDayName = dayNames[currentTime.getDay()];
  const timeString = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateString = currentTime.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });

  const entries = timetable?.entries || [];
  const filteredEntries = entries.filter((e: any) => {
    if (!selectedSectionId) return true;
    return e.section_id === Number(selectedSectionId);
  });

  const selectedSection = sections.find((s: any) => s.id === Number(selectedSectionId)) || sections[0];

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
  const activeDayObj = days.find((d: any) => d.name.toLowerCase() === currentDayName.toLowerCase());
  const dayPeriods = activeDayObj?.periods || [
    { name: "Period 1", start_time: "11:00 AM", end_time: "12:00 PM", period_type: "Teaching" },
    { name: "Period 2", start_time: "12:00 PM", end_time: "01:00 PM", period_type: "Teaching" },
    { name: "Period 3", start_time: "01:00 PM", end_time: "02:00 PM", period_type: "Teaching" },
    { name: "Interval", start_time: "02:00 PM", end_time: "02:30 PM", period_type: "Break" },
    { name: "Period 4", start_time: "02:30 PM", end_time: "03:30 PM", period_type: "Teaching" },
    { name: "Period 5", start_time: "03:30 PM", end_time: "04:30 PM", period_type: "Teaching" },
  ];

  let currentActivePeriod: any = null;
  let remainingMinutes = 0;

  for (let i = 0; i < dayPeriods.length; i++) {
    const p = dayPeriods[i];
    const sMin = parseTimeToMin(p.start_time);
    const eMin = parseTimeToMin(p.end_time);

    if (currentMinutes >= sMin && currentMinutes < eMin) {
      currentActivePeriod = p;
      remainingMinutes = eMin - currentMinutes;
      break;
    }
  }

  const ongoingClass = currentActivePeriod
    ? filteredEntries.find(
        (e: any) =>
          (e.day_name === currentDayName || e.day_id === activeDayObj?.id) &&
          e.period_id === currentActivePeriod.id
      )
    : null;

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
        isFullscreen ? "p-0" : "p-4 sm:p-6 md:p-8"
      )}
    >
      <div className="mx-auto w-full max-w-6xl flex-1 flex flex-col space-y-4">
        {/* Navigation & Controls Bar */}
        <div className="rounded-2xl border border-zinc-300 bg-white p-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/timetables"
              className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-bold text-zinc-700 hover:bg-zinc-100 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Editor</span>
            </Link>
            <div className="flex items-center gap-2 border-l border-zinc-200 pl-3">
              <span className="flex items-center gap-1.5 rounded-full bg-rose-600 px-2.5 py-0.5 text-xs font-black uppercase text-white animate-pulse">
                <Radio className="h-3 w-3" />
                Live Watch
              </span>
              <span className="text-xs font-bold text-zinc-800 hidden sm:inline">
                Live Class Routine
              </span>
            </div>
          </div>

          {/* Clock & Actions */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2 rounded-xl bg-zinc-900 px-3.5 py-1.5 font-mono text-xs text-white shadow-xs">
              <Clock className="h-3.5 w-3.5 text-emerald-400" />
              <span className="font-bold">{timeString}</span>
              <span className="text-zinc-500">|</span>
              <span className="text-zinc-300">{dateString}</span>
            </div>

            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 rounded-xl border border-zinc-300 bg-white px-3 py-1.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 cursor-pointer"
              title="Copy shareable live watch link"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Share2 className="h-3.5 w-3.5" />}
              <span>{copied ? "Copied!" : "Share"}</span>
            </button>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="flex items-center gap-1.5 rounded-xl border border-zinc-300 bg-white px-3 py-1.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 cursor-pointer"
            >
              {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{isFullscreen ? "Exit" : "Fullscreen"}</span>
            </button>
          </div>
        </div>

        {/* Live Status Highlight Card */}
        <div className="rounded-2xl border border-zinc-300 bg-white p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-900 text-white shrink-0">
              <Clock className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  Current Session &bull; {currentDayName}
                </span>
                {currentActivePeriod && (
                  <span className="rounded bg-emerald-100 px-1.5 py-0.2 text-[9px] font-black text-emerald-800 uppercase">
                    Active ({remainingMinutes} mins left)
                  </span>
                )}
              </div>
              <div className="text-sm font-black text-zinc-900 mt-0.5">
                {ongoingClass ? (
                  <span>
                    {ongoingClass.subject_name} ({ongoingClass.course_type || "TH"}) &mdash; {ongoingClass.teacher_name} ({ongoingClass.room_number || "Room 101"})
                  </span>
                ) : currentActivePeriod?.period_type === "Break" ? (
                  <span className="text-amber-700 font-bold">☕ Interval / Break Time</span>
                ) : (
                  <span className="text-zinc-600">No scheduled lecture ongoing at this exact moment.</span>
                )}
              </div>
            </div>
          </div>

          {/* Section Selector */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-zinc-600">Select Section:</label>
            <select
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(Number(e.target.value))}
              className="rounded-xl border border-zinc-300 bg-zinc-50 px-3.5 py-1.5 text-xs font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-600 cursor-pointer shadow-xs"
            >
              {sections.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.display_name || `${s.program_name || 'BCA'} ${s.semester_name || ''} - Sec ${s.name}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Live Sheet View */}
        {loading ? (
          <div className="rounded-2xl border border-zinc-300 bg-white p-12 text-center text-xs text-zinc-500">
            Loading Live Campus Routine Sheet...
          </div>
        ) : (
          <CampusRoutineSheet
            campusName="Ratna Rajyalaxmi Campus"
            address="Pradarshanimarga, Kathmandu Nepal"
            programName="Bachelors in Computer Applications (BCA)"
            semesterName={selectedSection?.semester_name || "SEMESTER - V"}
            sectionName={selectedSection?.name || "A"}
            roomNumber={selectedSection?.room_name || selectedSection?.room_number || "101"}
            days={days}
            periods={dayPeriods}
            entries={filteredEntries}
            activeDayName={currentDayName}
            activePeriodId={currentActivePeriod?.id}
          />
        )}
      </div>
    </div>
  );
}
