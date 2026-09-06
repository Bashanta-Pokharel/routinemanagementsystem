"use client";

import React, { useState, useEffect } from "react";
import { 
  Calendar, CheckCircle2, AlertCircle, RefreshCw, 
  Sparkles, Download, Printer, ShieldCheck, HelpCircle, Layers, Eye
} from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { TimetableGrid } from "@/components/TimetableGrid";
import { ExplainModal } from "@/components/ExplainModal";
import { LiveWatchModal } from "@/components/LiveWatchModal";
import { api } from "@/lib/api";

export default function TimetablesPage() {
  const [timetables, setTimetables] = useState<any[]>([]);
  const [selectedTimetableId, setSelectedTimetableId] = useState<number | null>(null);
  const [activeTimetable, setActiveTimetable] = useState<any | null>(null);
  const [days, setDays] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLiveWatchOpen, setIsLiveWatchOpen] = useState(false);

  // Explain modal
  const [explainEntryId, setExplainEntryId] = useState<number | null>(null);

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    if (selectedTimetableId) {
      loadTimetableDetails(selectedTimetableId);
    }
  }, [selectedTimetableId]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [ttList, daysData, secData, tData, rData] = await Promise.all([
        api.getTimetables(),
        api.getWorkingDays(),
        api.getSections(),
        api.getTeachers(),
        api.getRooms(),
      ]);

      setDays(daysData || []);
      setSections(secData || []);
      setTeachers(tData || []);
      setRooms(rData || []);
      setTimetables(ttList || []);

      if (ttList && ttList.length > 0) {
        setSelectedTimetableId(ttList[0].id);
      }
    } catch (e) {
      console.error("Failed to load routine data", e);
    } finally {
      setLoading(false);
    }
  };

  const loadTimetableDetails = async (id: number) => {
    try {
      const data = await api.getTimetable(id);
      setActiveTimetable(data);
    } catch (e) {
      console.error("Failed to load timetable details", e);
    }
  };

  const handlePublish = async () => {
    if (!selectedTimetableId) return;
    try {
      await api.publishTimetable(selectedTimetableId);
      alert("Timetable officially published for faculty and students!");
      loadTimetableDetails(selectedTimetableId);
    } catch (e: any) {
      alert("Failed to publish timetable: " + e.message);
    }
  };

  const handleValidate = async () => {
    if (!selectedTimetableId) return;
    try {
      const res = await api.validateTimetable(selectedTimetableId);
      if (res.is_valid) {
        alert("✓ Timetable Audit Complete: 0 Conflicts Found across all hard constraints!");
      } else {
        alert(`⚠ Audit Notice: ${res.total_conflicts} conflicts detected.`);
      }
      loadTimetableDetails(selectedTimetableId);
    } catch (e: any) {
      alert("Validation failed: " + e.message);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header with Title & Selector */}
        <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
                Master Timetable &amp; Routine Editor
              </h1>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Standard campus layout, live watch streaming, interactive grid, and one-click PDF &amp; Excel exports.
            </p>
          </div>

          {/* Timetable Version Dropdown & Audit Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {timetables.length > 0 && (
              <select
                value={selectedTimetableId || ""}
                onChange={(e) => setSelectedTimetableId(Number(e.target.value))}
                className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-800 shadow-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 cursor-pointer"
              >
                {timetables.map((tt) => (
                  <option key={tt.id} value={tt.id}>
                    {tt.name} (v{tt.version}, Score: {tt.score}%)
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={() => setIsLiveWatchOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 transition-colors cursor-pointer"
            >
              <Eye className="h-4 w-4 text-emerald-600" />
              Live Watch
            </button>

            <button
              onClick={handleValidate}
              className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs font-bold text-zinc-800 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 transition-colors cursor-pointer"
            >
              <ShieldCheck className="h-4 w-4" />
              Audit (0 Conflicts)
            </button>

            <button
              onClick={handlePublish}
              className="flex items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-all cursor-pointer"
            >
              <CheckCircle2 className="h-4 w-4" />
              {activeTimetable?.is_published ? "Published ✓" : "Publish Routine"}
            </button>
          </div>
        </div>

        {/* Timetable Score Banner */}
        {activeTimetable && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
              <span className="text-[10px] font-bold uppercase text-zinc-400">Optimization Score</span>
              <div className="mt-1 text-xl font-bold text-zinc-900 dark:text-white">
                {activeTimetable.score}%
              </div>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
              <span className="text-[10px] font-bold uppercase text-zinc-400">Conflict Count</span>
              <div className="mt-1 text-xl font-bold text-emerald-600 dark:text-emerald-400">
                {activeTimetable.conflict_count || 0}
              </div>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
              <span className="text-[10px] font-bold uppercase text-zinc-400">Total Classes</span>
              <div className="mt-1 text-xl font-bold text-zinc-900 dark:text-white">
                {activeTimetable.entries?.length || 0}
              </div>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
              <span className="text-[10px] font-bold uppercase text-zinc-400">Version Status</span>
              <div className="mt-1 text-xl font-bold text-zinc-900 dark:text-white">
                v{activeTimetable.version} {activeTimetable.is_published ? "(Live)" : "(Draft)"}
              </div>
            </div>
          </div>
        )}

        {/* Interactive Grid View */}
        {loading ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
            Loading timetable matrix...
          </div>
        ) : activeTimetable ? (
          <TimetableGrid
            timetable={activeTimetable}
            days={days}
            sections={sections}
            teachers={teachers}
            rooms={rooms}
            onRefresh={() => selectedTimetableId && loadTimetableDetails(selectedTimetableId)}
            onExplain={(entryId) => setExplainEntryId(entryId)}
          />
        ) : (
          <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
            No timetable found. Click &quot;Generate Routine&quot; to build an optimized schedule.
          </div>
        )}

        {/* Live Watch Modal */}
        {activeTimetable && (
          <LiveWatchModal
            isOpen={isLiveWatchOpen}
            onClose={() => setIsLiveWatchOpen(false)}
            timetable={activeTimetable}
            days={days}
            sections={sections}
            teachers={teachers}
          />
        )}

        {/* Explain Modal */}
        <ExplainModal
          timetableId={selectedTimetableId || 1}
          entryId={explainEntryId}
          onClose={() => setExplainEntryId(null)}
        />
      </div>
    </DashboardLayout>
  );
}
