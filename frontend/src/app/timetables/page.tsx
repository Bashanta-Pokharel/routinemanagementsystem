"use client";

import React, { useState, useEffect } from "react";
import { 
  Calendar, CheckCircle2, AlertCircle, RefreshCw, 
  Sparkles, Download, Printer, ShieldCheck, HelpCircle, Layers
} from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { TimetableGrid } from "@/components/TimetableGrid";
import { ExplainModal } from "@/components/ExplainModal";
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
      } else {
        // If no timetable exists yet, generate initial one
        const genRes = await api.generateTimetable({
          academic_year_id: 1,
          name: "Apex College Master Routine",
          num_solutions: 3
        });
        setSelectedTimetableId(genRes.timetable_id);
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
        <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h1 className="text-xl font-black text-slate-900 dark:text-white">
                Master Timetable & Routine Editor
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Dynamic multi-view college routine with constraint validation, drag-and-drop moves, and instant export.
            </p>
          </div>

          {/* Timetable Version Dropdown & Audit Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {timetables.length > 0 && (
              <select
                value={selectedTimetableId || ""}
                onChange={(e) => setSelectedTimetableId(Number(e.target.value))}
                className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {timetables.map((tt) => (
                  <option key={tt.id} value={tt.id}>
                    {tt.name} (v{tt.version}, Score: {tt.score}%)
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={handleValidate}
              className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 dark:border-emerald-800/40 dark:bg-emerald-950/40 dark:text-emerald-300 transition-colors cursor-pointer"
            >
              <ShieldCheck className="h-4 w-4" />
              Audit (0 Conflicts)
            </button>

            <button
              onClick={handlePublish}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm shadow-blue-500/25 hover:bg-blue-700 active:scale-95 transition-all cursor-pointer"
            >
              <CheckCircle2 className="h-4 w-4" />
              {activeTimetable?.is_published ? "Published ✓" : "Publish Routine"}
            </button>
          </div>
        </div>

        {/* Timetable Score Banner */}
        {activeTimetable && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <span className="text-[10px] font-bold uppercase text-slate-400">Optimization Score</span>
              <div className="mt-1 text-lg font-black text-blue-600 dark:text-blue-400">
                {activeTimetable.score}%
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <span className="text-[10px] font-bold uppercase text-slate-400">Conflict Count</span>
              <div className="mt-1 text-lg font-black text-emerald-600 dark:text-emerald-400">
                {activeTimetable.conflict_count || 0}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <span className="text-[10px] font-bold uppercase text-slate-400">Total Classes</span>
              <div className="mt-1 text-lg font-black text-slate-900 dark:text-white">
                {activeTimetable.entries?.length || 0}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <span className="text-[10px] font-bold uppercase text-slate-400">Version Status</span>
              <div className="mt-1 text-lg font-black text-slate-900 dark:text-white">
                v{activeTimetable.version} {activeTimetable.is_published ? "(Live)" : "(Draft)"}
              </div>
            </div>
          </div>
        )}

        {/* Interactive Grid View */}
        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900">
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
          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900">
            No timetable found. Click &quot;Generate Routine&quot; to build an optimized schedule.
          </div>
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
