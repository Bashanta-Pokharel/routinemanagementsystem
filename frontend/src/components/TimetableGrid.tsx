"use client";

import React, { useState } from "react";
import { 
  Calendar, Layers, User, DoorOpen, Clock, AlertCircle, 
  CheckCircle2, Download, Printer, ArrowLeftRight, HelpCircle, Lock, Unlock, Sparkles, Filter
} from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface TimetableGridProps {
  timetable: any;
  days: any[];
  sections: any[];
  teachers: any[];
  rooms: any[];
  onRefresh?: () => void;
  onExplain?: (entryId: number) => void;
}

export function TimetableGrid({
  timetable,
  days,
  sections,
  teachers,
  rooms,
  onRefresh,
  onExplain
}: TimetableGridProps) {
  const [viewMode, setViewMode] = useState<"section" | "teacher" | "room" | "day">("section");
  const [selectedSectionId, setSelectedSectionId] = useState<number>(sections[0]?.id || 1);
  const [selectedTeacherId, setSelectedTeacherId] = useState<number>(teachers[0]?.id || 1);
  const [selectedRoomId, setSelectedRoomId] = useState<number>(rooms[0]?.id || 1);
  const [selectedDayId, setSelectedDayId] = useState<number>(days[0]?.id || 1);

  // Moving / Swapping state
  const [selectedEntry, setSelectedEntry] = useState<any | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const entries = timetable?.entries || [];

  // Filter entries based on active view mode
  const getFilteredEntries = () => {
    switch (viewMode) {
      case "section":
        return entries.filter((e: any) => e.section_id === Number(selectedSectionId));
      case "teacher":
        return entries.filter((e: any) => e.teacher_id === Number(selectedTeacherId));
      case "room":
        return entries.filter((e: any) => e.room_id === Number(selectedRoomId));
      case "day":
        return entries.filter((e: any) => e.day_id === Number(selectedDayId));
      default:
        return entries;
    }
  };

  const filteredEntries = getFilteredEntries();

  // Find max periods on any day to construct table headers
  const maxPeriodCount = Math.max(...days.map((d: any) => d.periods_count || d.periods?.length || 6), 6);

  // Handle slot click (for moving / swapping)
  const handleSlotClick = async (period: any, existingEntry?: any) => {
    if (period.period_type !== "Teaching") {
      setActionMessage({ type: "error", text: `Cannot schedule in ${period.name} (${period.period_type} slot).` });
      setTimeout(() => setActionMessage(null), 4000);
      return;
    }

    // If no entry currently selected, select this one
    if (!selectedEntry) {
      if (existingEntry) {
        setSelectedEntry(existingEntry);
        setActionMessage({
          type: "success",
          text: `Selected ${existingEntry.subject_name || 'Class'}. Click another slot to move or swap.`
        });
      }
      return;
    }

    // If same entry clicked, deselect
    if (selectedEntry.id === existingEntry?.id) {
      setSelectedEntry(null);
      setActionMessage(null);
      return;
    }

    // If empty slot clicked -> MOVE
    if (!existingEntry) {
      setIsProcessing(true);
      try {
        await api.moveClassSlot({
          timetable_id: timetable.id,
          entry_id: selectedEntry.id,
          target_period_id: period.id,
        });
        setActionMessage({ type: "success", text: "✓ Move verified and applied successfully!" });
        setSelectedEntry(null);
        if (onRefresh) onRefresh();
      } catch (err: any) {
        setActionMessage({ type: "error", text: `✗ Move Rejected: ${err.message}` });
      } finally {
        setIsProcessing(false);
        setTimeout(() => setActionMessage(null), 5000);
      }
      return;
    }

    // If another occupied slot clicked -> SWAP
    if (existingEntry) {
      setIsProcessing(true);
      try {
        await api.swapClassSlots({
          timetable_id: timetable.id,
          entry_a_id: selectedEntry.id,
          entry_b_id: existingEntry.id,
        });
        setActionMessage({ type: "success", text: "✓ Classes swapped successfully!" });
        setSelectedEntry(null);
        if (onRefresh) onRefresh();
      } catch (err: any) {
        setActionMessage({ type: "error", text: `✗ Swap Rejected: ${err.message}` });
      } finally {
        setIsProcessing(false);
        setTimeout(() => setActionMessage(null), 5000);
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExcelExport = () => {
    const url = `http://localhost:8000/api/timetable/${timetable.id}/export/excel`;
    window.open(url, "_blank");
  };

  const handlePdfExport = () => {
    const url = `http://localhost:8000/api/timetable/${timetable.id}/export/pdf`;
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-4">
      {/* Top Controls: View Selector & Entity Dropdown */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">View Mode:</span>
          <div className="inline-flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            <button
              onClick={() => { setViewMode("section"); setSelectedEntry(null); }}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer",
                viewMode === "section"
                  ? "bg-white text-blue-600 shadow-sm dark:bg-slate-900 dark:text-blue-400"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
              )}
            >
              <Layers className="h-3.5 w-3.5" />
              Section / Class
            </button>
            <button
              onClick={() => { setViewMode("teacher"); setSelectedEntry(null); }}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer",
                viewMode === "teacher"
                  ? "bg-white text-blue-600 shadow-sm dark:bg-slate-900 dark:text-blue-400"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
              )}
            >
              <User className="h-3.5 w-3.5" />
              Teacher Routine
            </button>
            <button
              onClick={() => { setViewMode("room"); setSelectedEntry(null); }}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer",
                viewMode === "room"
                  ? "bg-white text-blue-600 shadow-sm dark:bg-slate-900 dark:text-blue-400"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
              )}
            >
              <DoorOpen className="h-3.5 w-3.5" />
              Room / Lab
            </button>
            <button
              onClick={() => { setViewMode("day"); setSelectedEntry(null); }}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer",
                viewMode === "day"
                  ? "bg-white text-blue-600 shadow-sm dark:bg-slate-900 dark:text-blue-400"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
              )}
            >
              <Calendar className="h-3.5 w-3.5" />
              Day Master
            </button>
          </div>
        </div>

        {/* Dynamic Selector based on View Mode */}
        <div className="flex flex-wrap items-center gap-3">
          {viewMode === "section" && (
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-slate-500">Select Section:</label>
              <select
                value={selectedSectionId}
                onChange={(e) => setSelectedSectionId(Number(e.target.value))}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {sections.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.display_name || `${s.program_name || 'Program'} ${s.semester_name || ''} - Sec ${s.name}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {viewMode === "teacher" && (
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-slate-500">Select Teacher:</label>
              <select
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(Number(e.target.value))}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {teachers.map((t: any) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.designation})
                  </option>
                ))}
              </select>
            </div>
          )}

          {viewMode === "room" && (
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-slate-500">Select Room:</label>
              <select
                value={selectedRoomId}
                onChange={(e) => setSelectedRoomId(Number(e.target.value))}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {rooms.map((r: any) => (
                  <option key={r.id} value={r.id}>
                    {r.room_number} ({r.room_type_name || 'Classroom'}, Cap: {r.capacity})
                  </option>
                ))}
              </select>
            </div>
          )}

          {viewMode === "day" && (
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-slate-500">Select Day:</label>
              <select
                value={selectedDayId}
                onChange={(e) => setSelectedDayId(Number(e.target.value))}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {days.map((d: any) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.short_code})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Export Actions */}
          <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3 dark:border-slate-800">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
              title="Print Routine"
            >
              <Printer className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Print</span>
            </button>
            <button
              onClick={handlePdfExport}
              className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
              title="Export as PDF"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">PDF</span>
            </button>
            <button
              onClick={handleExcelExport}
              className="flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800/40 dark:bg-emerald-950/40 dark:text-emerald-300 cursor-pointer"
              title="Export as Excel Sheet"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* Action Notification Banner */}
      {actionMessage && (
        <div
          className={cn(
            "flex items-center justify-between rounded-xl px-4 py-3 text-xs font-semibold shadow-sm transition-all animate-in fade-in duration-200",
            actionMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800"
              : "bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800"
          )}
        >
          <div className="flex items-center gap-2">
            {actionMessage.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
            )}
            <span>{actionMessage.text}</span>
          </div>
          {selectedEntry && (
            <button
              onClick={() => { setSelectedEntry(null); setActionMessage(null); }}
              className="underline text-[11px] hover:opacity-80 cursor-pointer"
            >
              Cancel Selection
            </button>
          )}
        </div>
      )}

      {/* Main Timetable Matrix View */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs min-w-[750px]">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 dark:bg-slate-800/60 dark:border-slate-800">
                <th className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300 w-32 border-r border-slate-200 dark:border-slate-800 uppercase tracking-wider text-[11px]">
                  {viewMode === "day" ? "Class / Section" : "Day / Time"}
                </th>
                {Array.from({ length: maxPeriodCount }).map((_, pIdx) => (
                  <th
                    key={pIdx}
                    className="py-3 px-3 font-bold text-slate-700 dark:text-slate-300 text-center border-r border-slate-200 dark:border-slate-800 last:border-r-0"
                  >
                    <div className="text-[11px] text-slate-900 dark:text-slate-100">Period {pIdx + 1}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {days.map((day: any) => {
                const dayPeriods = day.periods || [];
                return (
                  <tr key={day.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    {/* Day Column */}
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white bg-slate-50/70 dark:bg-slate-800/40 border-r border-slate-200 dark:border-slate-800">
                      <div className="flex flex-col">
                        <span className="text-sm font-black">{day.name}</span>
                        <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{day.short_code}</span>
                      </div>
                    </td>

                    {/* Period Slots */}
                    {Array.from({ length: maxPeriodCount }).map((_, pIdx) => {
                      const period = dayPeriods[pIdx];

                      if (!period) {
                        return (
                          <td
                            key={pIdx}
                            className="p-2 text-center bg-slate-100/30 text-slate-400 dark:bg-slate-900/40 border-r border-slate-200 dark:border-slate-800 last:border-r-0"
                          >
                            <span className="text-[10px] text-slate-400">Off</span>
                          </td>
                        );
                      }

                      // Non-Teaching Break slot
                      if (period.period_type !== "Teaching") {
                        return (
                          <td
                            key={period.id}
                            className="p-2 text-center bg-amber-50/60 dark:bg-amber-950/20 border-r border-slate-200 dark:border-slate-800 last:border-r-0"
                          >
                            <div className="flex flex-col items-center justify-center py-2 px-1 text-amber-800 dark:text-amber-300">
                              <span className="text-[11px] font-bold tracking-tight">☕ {period.name}</span>
                              <span className="text-[9px] font-medium opacity-75">{period.start_time} - {period.end_time}</span>
                            </div>
                          </td>
                        );
                      }

                      // Teaching Period: Find matching assigned class
                      const matchEntry = filteredEntries.find((e: any) => e.period_id === period.id);
                      const isSelected = selectedEntry?.id === matchEntry?.id;

                      return (
                        <td
                          key={period.id}
                          onClick={() => handleSlotClick(period, matchEntry)}
                          className={cn(
                            "p-2 align-top border-r border-slate-200 dark:border-slate-800 last:border-r-0 transition-all cursor-pointer relative",
                            selectedEntry && !matchEntry ? "bg-blue-50/50 hover:bg-blue-100/70 dark:bg-blue-950/20 dark:hover:bg-blue-950/40 ring-1 ring-dashed ring-blue-400" : "",
                            isSelected ? "ring-2 ring-blue-600 bg-blue-100/80 dark:bg-blue-950/60" : ""
                          )}
                        >
                          <div className="text-[9px] text-slate-400 font-medium text-right mb-1">
                            {period.start_time} - {period.end_time}
                          </div>

                          {matchEntry ? (
                            <div
                              className={cn(
                                "group relative flex flex-col justify-between rounded-xl p-2.5 text-xs transition-all shadow-sm",
                                matchEntry.room_type_name?.includes("Lab")
                                  ? "bg-emerald-50 text-emerald-950 border border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-100 dark:border-emerald-800/40 hover:border-emerald-400"
                                  : "bg-blue-50 text-blue-950 border border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-100 dark:border-blue-800/40 hover:border-blue-400"
                              )}
                            >
                              {/* Subject Code & Name */}
                              <div className="font-bold text-slate-900 dark:text-white flex items-start justify-between">
                                <span className="truncate pr-1 text-[11px]">{matchEntry.subject_name || matchEntry.subject_code}</span>
                                {matchEntry.room_type_name?.includes("Lab") && (
                                  <span className="shrink-0 px-1 py-0.5 rounded bg-emerald-200/70 text-emerald-800 text-[8px] font-black uppercase dark:bg-emerald-800 dark:text-emerald-100">
                                    LAB
                                  </span>
                                )}
                              </div>

                              {/* Teacher & Room details */}
                              <div className="mt-1 space-y-0.5 text-[10px] text-slate-600 dark:text-slate-300">
                                {viewMode !== "teacher" && (
                                  <div className="flex items-center gap-1 font-medium truncate">
                                    <User className="h-3 w-3 shrink-0 text-slate-400" />
                                    <span>{matchEntry.teacher_name}</span>
                                  </div>
                                )}
                                {viewMode !== "room" && (
                                  <div className="flex items-center gap-1 truncate text-slate-500 dark:text-slate-400">
                                    <DoorOpen className="h-3 w-3 shrink-0 text-slate-400" />
                                    <span>{matchEntry.room_number}</span>
                                  </div>
                                )}
                                {viewMode !== "section" && (
                                  <div className="flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400 truncate">
                                    <Layers className="h-3 w-3 shrink-0" />
                                    <span>Sec {matchEntry.section_name} ({matchEntry.program_name})</span>
                                  </div>
                                )}
                              </div>

                              {/* Explain Slot Button */}
                              {onExplain && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onExplain(matchEntry.id);
                                  }}
                                  className="mt-2 flex items-center justify-center gap-1 rounded bg-white/80 py-1 text-[9px] font-bold text-blue-700 hover:bg-white dark:bg-slate-800/80 dark:text-blue-300 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                                >
                                  <HelpCircle className="h-3 w-3" />
                                  Why here?
                                </button>
                              )}
                            </div>
                          ) : (
                            <div className="flex min-h-[70px] items-center justify-center rounded-lg border border-dashed border-slate-200 text-[10px] text-slate-400 hover:border-blue-400 hover:text-blue-500 dark:border-slate-800 dark:hover:border-slate-700 transition-colors">
                              + Empty
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend & Instructions Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400">
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-bold text-slate-700 dark:text-slate-300">Legend:</span>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-blue-500" />
            <span>Theory / Lecture</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-emerald-500" />
            <span>Lab / Practical</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-amber-500" />
            <span>Break / Recess</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
          <span>💡 Click any card to select, then click another slot to move/swap with real-time constraint validation.</span>
        </div>
      </div>
    </div>
  );
}
