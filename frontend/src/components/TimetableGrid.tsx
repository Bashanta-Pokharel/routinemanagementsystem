"use client";

import React, { useState } from "react";
import { 
  Calendar, Layers, User, DoorOpen, Clock, AlertCircle, 
  CheckCircle2, Download, Printer, ArrowLeftRight, HelpCircle, Lock, Unlock, Sparkles, Filter,
  Radio, FileText, LayoutGrid
} from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { CampusRoutineSheet } from "./CampusRoutineSheet";
import { LiveWatchModal } from "./LiveWatchModal";

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
  const [layoutMode, setLayoutMode] = useState<"sheet" | "editor">("sheet");
  const [viewMode, setViewMode] = useState<"section" | "teacher" | "room" | "day">("section");
  const [selectedSectionId, setSelectedSectionId] = useState<number>(sections[0]?.id || 1);
  const [selectedTeacherId, setSelectedTeacherId] = useState<number>(teachers[0]?.id || 1);
  const [selectedRoomId, setSelectedRoomId] = useState<number>(rooms[0]?.id || 1);
  const [selectedDayId, setSelectedDayId] = useState<number>(days[0]?.id || 1);

  // Live Watch modal state
  const [isLiveWatchOpen, setIsLiveWatchOpen] = useState(false);

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
  const selectedSection = sections.find((s: any) => s.id === Number(selectedSectionId)) || sections[0];

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
    <div className="space-y-4 font-sans">
      {/* Top Layout Switcher & Live Watch Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-3.5 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl bg-zinc-100 p-1 border border-zinc-200">
            <button
              onClick={() => setLayoutMode("sheet")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer",
                layoutMode === "sheet"
                  ? "bg-zinc-900 text-white shadow-xs"
                  : "text-zinc-600 hover:text-zinc-900"
              )}
            >
              <FileText className="h-3.5 w-3.5" />
              Campus Sheet Format
            </button>
            <button
              onClick={() => setLayoutMode("editor")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer",
                layoutMode === "editor"
                  ? "bg-zinc-900 text-white shadow-xs"
                  : "text-zinc-600 hover:text-zinc-900"
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Interactive Editor
            </button>
          </div>
        </div>

        {/* Live Watch Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsLiveWatchOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-rose-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-rose-700 active:scale-95 transition-all cursor-pointer animate-pulse"
          >
            <Radio className="h-3.5 w-3.5" />
            <span>Live Watch Routine</span>
          </button>
        </div>
      </div>

      {/* Top Controls: View Selector & Entity Dropdown */}
      <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider mr-1">Filter View:</span>
          <div className="inline-flex rounded-xl bg-zinc-100 p-1 border border-zinc-200">
            <button
              onClick={() => { setViewMode("section"); setSelectedEntry(null); }}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer",
                viewMode === "section"
                  ? "bg-zinc-900 text-white shadow-xs"
                  : "text-zinc-600 hover:text-zinc-900"
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
                  ? "bg-zinc-900 text-white shadow-xs"
                  : "text-zinc-600 hover:text-zinc-900"
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
                  ? "bg-zinc-900 text-white shadow-xs"
                  : "text-zinc-600 hover:text-zinc-900"
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
                  ? "bg-zinc-900 text-white shadow-xs"
                  : "text-zinc-600 hover:text-zinc-900"
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
              <label className="text-xs font-semibold text-zinc-500">Select Section:</label>
              <select
                value={selectedSectionId}
                onChange={(e) => setSelectedSectionId(Number(e.target.value))}
                className="rounded-xl border border-zinc-300 bg-white px-3 py-1.5 text-xs font-bold text-zinc-900 shadow-xs focus:outline-none focus:ring-2 focus:ring-zinc-600 cursor-pointer"
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
              <label className="text-xs font-semibold text-zinc-500">Select Teacher:</label>
              <select
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(Number(e.target.value))}
                className="rounded-xl border border-zinc-300 bg-white px-3 py-1.5 text-xs font-bold text-zinc-900 shadow-xs focus:outline-none focus:ring-2 focus:ring-zinc-600 cursor-pointer"
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
              <label className="text-xs font-semibold text-zinc-500">Select Room:</label>
              <select
                value={selectedRoomId}
                onChange={(e) => setSelectedRoomId(Number(e.target.value))}
                className="rounded-xl border border-zinc-300 bg-white px-3 py-1.5 text-xs font-bold text-zinc-900 shadow-xs focus:outline-none focus:ring-2 focus:ring-zinc-600 cursor-pointer"
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
              <label className="text-xs font-semibold text-zinc-500">Select Day:</label>
              <select
                value={selectedDayId}
                onChange={(e) => setSelectedDayId(Number(e.target.value))}
                className="rounded-xl border border-zinc-300 bg-white px-3 py-1.5 text-xs font-bold text-zinc-900 shadow-xs focus:outline-none focus:ring-2 focus:ring-zinc-600 cursor-pointer"
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
          <div className="flex items-center gap-1.5 border-l border-zinc-200 pl-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1 rounded-xl border border-zinc-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 cursor-pointer"
              title="Print Routine"
            >
              <Printer className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Print</span>
            </button>
            <button
              onClick={handlePdfExport}
              className="flex items-center gap-1 rounded-xl border border-zinc-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 cursor-pointer"
              title="Export as PDF"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">PDF</span>
            </button>
            <button
              onClick={handleExcelExport}
              className="flex items-center gap-1 rounded-xl border border-zinc-300 bg-zinc-50 px-2.5 py-1.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-100 cursor-pointer"
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
            "flex items-center justify-between rounded-xl px-4 py-3 text-xs font-semibold shadow-xs transition-all animate-in fade-in duration-200",
            actionMessage.type === "success"
              ? "bg-zinc-900 text-white"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          )}
        >
          <div className="flex items-center gap-2">
            {actionMessage.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
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

      {/* RENDER MODE 1: Official Campus Routine Sheet */}
      {layoutMode === "sheet" ? (
        <CampusRoutineSheet
          campusName="Ratna Rajyalaxmi Campus"
          address="Pradarshanimarga, Kathmandu Nepal"
          programName="Bachelors in Computer Applications (BCA)"
          semesterName={selectedSection?.semester_name || "SEMESTER - V"}
          sectionName={selectedSection?.name || "A"}
          roomNumber={selectedSection?.room_name || selectedSection?.room_number || "101"}
          days={days}
          periods={days[0]?.periods || []}
          entries={filteredEntries}
          teacherDirectory={timetable?.teacher_directory}
          legend={timetable?.legend}
        />
      ) : (
        /* RENDER MODE 2: Interactive Grid Editor */
        <div className="space-y-4">
          <div className="rounded-2xl border border-zinc-300 bg-white shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs min-w-[750px]">
                <thead>
                  <tr className="bg-zinc-100 border-b border-zinc-300">
                    <th className="py-3 px-4 font-bold text-zinc-900 w-32 border-r border-zinc-300 uppercase tracking-wider text-[11px]">
                      {viewMode === "day" ? "Class / Section" : "Day / Time"}
                    </th>
                    {Array.from({ length: maxPeriodCount }).map((_, pIdx) => (
                      <th
                        key={pIdx}
                        className="py-3 px-3 font-bold text-zinc-900 text-center border-r border-zinc-300 last:border-r-0"
                      >
                        <div className="text-[11px] text-zinc-900">Period {pIdx + 1}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {days.map((day: any) => {
                    const dayPeriods = day.periods || [];
                    return (
                      <tr key={day.id} className="hover:bg-zinc-50/50 transition-colors">
                        {/* Day Column */}
                        <td className="py-3 px-4 font-bold text-zinc-900 bg-zinc-100/70 border-r border-zinc-300">
                          <div className="flex flex-col">
                            <span className="text-sm font-black">{day.name}</span>
                            <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">{day.short_code}</span>
                          </div>
                        </td>

                        {/* Period Slots */}
                        {Array.from({ length: maxPeriodCount }).map((_, pIdx) => {
                          const period = dayPeriods[pIdx];

                          if (!period) {
                            return (
                              <td
                                key={pIdx}
                                className="p-2 text-center bg-zinc-50 text-zinc-400 border-r border-zinc-300 last:border-r-0"
                              >
                                <span className="text-[10px] text-zinc-400">Off</span>
                              </td>
                            );
                          }

                          // Non-Teaching Break slot
                          if (period.period_type !== "Teaching") {
                            return (
                              <td
                                key={period.id}
                                className="p-2 text-center bg-zinc-100 border-r border-zinc-300 last:border-r-0"
                              >
                                <div className="flex flex-col items-center justify-center py-2 px-1 text-zinc-800">
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
                                "p-2 align-top border-r border-zinc-200 last:border-r-0 transition-all cursor-pointer relative",
                                selectedEntry && !matchEntry ? "bg-zinc-100 hover:bg-zinc-200 ring-1 ring-dashed ring-zinc-400" : "",
                                isSelected ? "ring-2 ring-zinc-900 bg-zinc-100" : ""
                              )}
                            >
                              <div className="text-[9px] text-zinc-400 font-medium text-right mb-1">
                                {period.start_time} - {period.end_time}
                              </div>

                              {matchEntry ? (
                                <div
                                  className={cn(
                                    "group relative flex flex-col justify-between rounded-xl p-2.5 text-xs transition-all shadow-2xs border",
                                    matchEntry.room_type_name?.includes("Lab")
                                      ? "bg-zinc-50 text-zinc-900 border-zinc-300 hover:border-zinc-500"
                                      : "bg-white text-zinc-900 border-zinc-300 hover:border-zinc-500"
                                  )}
                                >
                                  {/* Subject Code & Name */}
                                  <div className="font-bold text-zinc-900 flex items-start justify-between">
                                    <span className="truncate pr-1 text-[11px]">{matchEntry.subject_name || matchEntry.subject_code}</span>
                                    {matchEntry.room_type_name?.includes("Lab") && (
                                      <span className="shrink-0 px-1 py-0.5 rounded bg-zinc-200 text-zinc-900 text-[8px] font-black uppercase">
                                        LAB
                                      </span>
                                    )}
                                  </div>

                                  {/* Teacher & Room details */}
                                  <div className="mt-1 space-y-0.5 text-[10px] text-zinc-600">
                                    {viewMode !== "teacher" && (
                                      <div className="flex items-center gap-1 font-medium truncate">
                                        <User className="h-3 w-3 shrink-0 text-zinc-400" />
                                        <span>{matchEntry.teacher_name}</span>
                                      </div>
                                    )}
                                    {viewMode !== "room" && (
                                      <div className="flex items-center gap-1 truncate text-zinc-500">
                                        <DoorOpen className="h-3 w-3 shrink-0 text-zinc-400" />
                                        <span>{matchEntry.room_number}</span>
                                      </div>
                                    )}
                                    {viewMode !== "section" && (
                                      <div className="flex items-center gap-1 font-semibold text-zinc-800 truncate">
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
                                      className="mt-2 flex items-center justify-center gap-1 rounded bg-zinc-100 py-1 text-[9px] font-bold text-zinc-800 hover:bg-zinc-200 border border-zinc-300 transition-colors cursor-pointer"
                                    >
                                      <HelpCircle className="h-3 w-3" />
                                      Why here?
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <div className="flex min-h-[70px] items-center justify-center rounded-lg border border-dashed border-zinc-300 text-[10px] text-zinc-400 hover:border-zinc-600 hover:text-zinc-700 transition-colors">
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
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-600">
            <div className="flex flex-wrap items-center gap-4">
              <span className="font-bold text-zinc-800">Legend:</span>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-zinc-900" />
                <span>Theory / Lecture</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-zinc-400" />
                <span>Lab / Practical</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-zinc-300" />
                <span>Break / Interval</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-zinc-500 font-medium">
              <span>💡 Click any card to select, then click another slot to move/swap with real-time constraint validation.</span>
            </div>
          </div>
        </div>
      )}

      {/* Live Routine Watch Modal */}
      <LiveWatchModal
        isOpen={isLiveWatchOpen}
        onClose={() => setIsLiveWatchOpen(false)}
        timetable={timetable}
        days={days}
        sections={sections}
        teachers={teachers}
        initialSectionId={selectedSectionId}
      />
    </div>
  );
}
