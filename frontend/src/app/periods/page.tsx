"use client";

import React, { useState, useEffect } from "react";
import { 
  Clock, Plus, Trash2, Edit3, Copy, Calendar, Coffee,
  Sunrise, Sun, Sunset, Check, Sparkles, CheckCircle2, AlertCircle, Save
} from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function PeriodsPage() {
  const [days, setDays] = useState<any[]>([]);
  const [selectedDayId, setSelectedDayId] = useState<number>(1);
  const [periods, setPeriods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [applyingShift, setApplyingShift] = useState<string | null>(null);

  // Active shift preset state: morning | day | evening
  const [activeShiftPreset, setActiveShiftPreset] = useState<"morning" | "day" | "evening">("morning");

  // Inline editing state: periodId -> { start_time, end_time, name }
  const [inlineEditingId, setInlineEditingId] = useState<number | null>(null);
  const [inlineTimes, setInlineTimes] = useState<{ start_time: string; end_time: string; name: string }>({
    start_time: "",
    end_time: "",
    name: ""
  });

  // Period modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<any | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [formData, setFormData] = useState({
    day_id: 1,
    name: "Period 1",
    start_time: "06:30 AM",
    end_time: "07:15 AM",
    order_index: 1,
    period_type: "Teaching",
  });

  const shiftDetails = [
    {
      id: "morning" as const,
      label: "Morning Shift",
      icon: Sunrise,
      time: "06:30 AM – 10:30 AM",
      desc: "5 Teaching Periods (45 min) + 20m Interval",
      gradient: "bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border-amber-200 hover:border-amber-400 dark:border-amber-900/60 dark:bg-amber-950/20",
      activeStyle: "bg-gradient-to-br from-amber-500 via-orange-600 to-amber-700 text-white shadow-lg border-amber-400",
      iconColor: "text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/60",
      badgeColor: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
      slots: [
        { name: "Period 1", start: "06:30 AM", end: "07:15 AM", type: "Teaching" },
        { name: "Period 2", start: "07:15 AM", end: "08:00 AM", type: "Teaching" },
        { name: "Period 3", start: "08:00 AM", end: "08:45 AM", type: "Teaching" },
        { name: "Interval", start: "08:45 AM", end: "09:05 AM", type: "Break" },
        { name: "Period 4", start: "09:05 AM", end: "09:50 AM", type: "Teaching" },
        { name: "Period 5", start: "09:50 AM", end: "10:30 AM", type: "Teaching" },
      ]
    },
    {
      id: "day" as const,
      label: "Day Shift",
      icon: Sun,
      time: "10:00 AM – 03:30 PM",
      desc: "5 Teaching Periods (60 min) + 30m Lunch",
      gradient: "bg-gradient-to-br from-sky-500/10 via-blue-500/5 to-transparent border-sky-200 hover:border-sky-400 dark:border-sky-900/60 dark:bg-sky-950/20",
      activeStyle: "bg-gradient-to-br from-sky-600 via-blue-600 to-indigo-700 text-white shadow-lg border-sky-400",
      iconColor: "text-sky-600 dark:text-sky-400 bg-sky-100 dark:bg-sky-900/60",
      badgeColor: "bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800",
      slots: [
        { name: "Period 1", start: "10:00 AM", end: "11:00 AM", type: "Teaching" },
        { name: "Period 2", start: "11:00 AM", end: "12:00 PM", type: "Teaching" },
        { name: "Period 3", start: "12:00 PM", end: "01:00 PM", type: "Teaching" },
        { name: "Interval", start: "01:00 PM", end: "01:30 PM", type: "Break" },
        { name: "Period 4", start: "01:30 PM", end: "02:30 PM", type: "Teaching" },
        { name: "Period 5", start: "02:30 PM", end: "03:30 PM", type: "Teaching" },
      ]
    },
    {
      id: "evening" as const,
      label: "Evening Shift",
      icon: Sunset,
      time: "04:00 PM – 08:05 PM",
      desc: "5 Teaching Periods (45 min) + 20m Interval",
      gradient: "bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent border-indigo-200 hover:border-indigo-400 dark:border-indigo-900/60 dark:bg-indigo-950/20",
      activeStyle: "bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 text-white shadow-lg border-indigo-400",
      iconColor: "text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/60",
      badgeColor: "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800",
      slots: [
        { name: "Period 1", start: "04:00 PM", end: "04:45 PM", type: "Teaching" },
        { name: "Period 2", start: "04:45 PM", end: "05:30 PM", type: "Teaching" },
        { name: "Period 3", start: "05:30 PM", end: "06:15 PM", type: "Teaching" },
        { name: "Interval", start: "06:15 PM", end: "06:35 PM", type: "Break" },
        { name: "Period 4", start: "06:35 PM", end: "07:20 PM", type: "Teaching" },
        { name: "Period 5", start: "07:20 PM", end: "08:05 PM", type: "Teaching" },
      ]
    }
  ];

  useEffect(() => {
    loadDays();
  }, []);

  useEffect(() => {
    if (selectedDayId) {
      loadPeriods(selectedDayId);
    }
  }, [selectedDayId]);

  const showToast = (type: "success" | "error", text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadDays = async () => {
    setLoading(true);
    try {
      const data = await api.getWorkingDays();
      setDays(data || []);
      if (data && data.length > 0) {
        setSelectedDayId(data[0].id);
      }
    } catch (e: any) {
      console.error(e);
      showToast("error", e.message || "Failed to load working days");
    } finally {
      setLoading(false);
    }
  };

  const loadPeriods = async (dayId: number) => {
    try {
      const data = await api.getPeriods(dayId);
      setPeriods(data || []);

      // Auto-detect shift preset from first period
      if (data && data.length > 0) {
        const firstStart = (data[0].start_time || "").toUpperCase();
        if (firstStart.includes("06:") || firstStart.includes("07:") || firstStart.includes("08:") || firstStart.includes("09:")) {
          setActiveShiftPreset("morning");
        } else if (firstStart.includes("10:") || firstStart.includes("11:") || firstStart.includes("12:") || firstStart.includes("01:") || firstStart.includes("02:") || firstStart.includes("03:")) {
          setActiveShiftPreset("day");
        } else if (firstStart.includes("04:") || firstStart.includes("05:") || firstStart.includes("06:") || firstStart.includes("07:")) {
          setActiveShiftPreset("evening");
        }
      }
    } catch (e: any) {
      console.error(e);
    }
  };

  // Instant Shift Switch Handler
  const handleApplyShiftPreset = async (shiftId: "morning" | "day" | "evening", applyAll: boolean) => {
    setApplyingShift(shiftId);
    try {
      const res = await api.applyShiftPreset(shiftId, selectedDayId, applyAll);
      setActiveShiftPreset(shiftId);
      const shiftName = shiftId.charAt(0).toUpperCase() + shiftId.slice(1);
      const targetText = applyAll ? "All Days" : (currentDay?.name || "Active Day");
      showToast("success", `✓ Applied ${shiftName} Shift to ${targetText}!`);
      await loadPeriods(selectedDayId);
      await loadDays();
    } catch (err: any) {
      showToast("error", "Failed to apply shift: " + err.message);
    } finally {
      setApplyingShift(null);
    }
  };

  const handleStartInlineEdit = (p: any) => {
    setInlineEditingId(p.id);
    setInlineTimes({
      start_time: p.start_time,
      end_time: p.end_time,
      name: p.name
    });
  };

  const handleSaveInlineEdit = async (p: any) => {
    try {
      await api.updatePeriod(p.id, {
        day_id: p.day_id,
        name: inlineTimes.name || p.name,
        start_time: inlineTimes.start_time,
        end_time: inlineTimes.end_time,
        order_index: p.order_index,
        period_type: p.period_type
      });
      showToast("success", `Updated ${inlineTimes.name || p.name} time slot!`);
      setInlineEditingId(null);
      loadPeriods(selectedDayId);
    } catch (err: any) {
      showToast("error", "Failed to update slot time: " + err.message);
    }
  };

  const handleOpenCreate = () => {
    setEditingPeriod(null);
    const activeShift = shiftDetails.find(s => s.id === activeShiftPreset) || shiftDetails[0];
    const nextSlotIndex = periods.length;
    const defaultSlot = activeShift.slots[nextSlotIndex % activeShift.slots.length];

    setFormData({
      day_id: selectedDayId,
      name: `Period ${periods.length + 1}`,
      start_time: defaultSlot?.start || "08:00 AM",
      end_time: defaultSlot?.end || "08:45 AM",
      order_index: periods.length + 1,
      period_type: "Teaching",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: any) => {
    setEditingPeriod(p);
    setFormData({
      day_id: p.day_id,
      name: p.name,
      start_time: p.start_time,
      end_time: p.end_time,
      order_index: p.order_index,
      period_type: p.period_type,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPeriod) {
        await api.updatePeriod(editingPeriod.id, formData);
        showToast("success", `Updated ${formData.name} successfully!`);
      } else {
        await api.createPeriod(formData);
        showToast("success", `Created ${formData.name} successfully!`);
      }
      setIsModalOpen(false);
      loadPeriods(selectedDayId);
      loadDays();
    } catch (err: any) {
      showToast("error", "Failed to save period: " + err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this period slot?")) return;
    try {
      await api.deletePeriod(id);
      showToast("success", "Period deleted successfully");
      loadPeriods(selectedDayId);
      loadDays();
    } catch (err: any) {
      showToast("error", "Failed to delete period: " + err.message);
    }
  };

  const handleCloneToOtherDays = async () => {
    const otherDayIds = days.filter((d) => d.id !== selectedDayId).map((d) => d.id);
    if (otherDayIds.length === 0) return;
    if (!confirm(`Clone all periods from active day to the other ${otherDayIds.length} working days?`)) return;

    try {
      await api.cloneDayPeriods(selectedDayId, otherDayIds);
      showToast("success", "Cloned period schedule across all days!");
      loadDays();
    } catch (e: any) {
      showToast("error", "Failed to clone: " + e.message);
    }
  };

  const currentDay = days.find((d) => d.id === selectedDayId);

  return (
    <DashboardLayout>
      <div className="space-y-6 font-sans">
        {/* Toast Notification */}
        {toastMessage && (
          <div
            className={cn(
              "fixed top-4 right-4 z-50 flex items-center gap-2 rounded-2xl px-4 py-3 text-xs font-bold shadow-xl animate-in slide-in-from-top-2",
              toastMessage.type === "success"
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "bg-zinc-800 text-zinc-100 border border-zinc-700"
            )}
          >
            {toastMessage.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            {toastMessage.text}
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
              <Clock className="h-5 w-5 text-zinc-900 dark:text-white" />
              Dynamic Working Days, Shifts &amp; Daily Periods
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Supports Morning, Day, and Evening shifts. Period timings dynamically adapt when you switch shifts.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCloneToOtherDays}
              className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 cursor-pointer transition-colors shadow-xs"
            >
              <Copy className="h-4 w-4" />
              Clone to Other Days
            </button>
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Add Period Slot
            </button>
          </div>
        </div>

        {/* Campus Shift Presets (Morning, Day, Evening) */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-3 dark:border-zinc-800">
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-zinc-700 dark:text-zinc-300" />
                Campus Shift Presets (Morning, Day, Evening)
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Click any shift preset to dynamically update Period 1, Period 2, etc. for {currentDay?.name || "active day"} or all working days.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleApplyShiftPreset(activeShiftPreset, false)}
                disabled={!!applyingShift}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-bold text-zinc-800 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 cursor-pointer transition-colors"
                title={`Apply ${activeShiftPreset.toUpperCase()} to ${currentDay?.name}`}
              >
                Apply to {currentDay?.name || "Active Day"}
              </button>
              <button
                onClick={() => handleApplyShiftPreset(activeShiftPreset, true)}
                disabled={!!applyingShift}
                className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 cursor-pointer transition-colors shadow-xs"
                title={`Apply ${activeShiftPreset.toUpperCase()} across all active working days`}
              >
                Apply to All Days
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {shiftDetails.map((shift) => {
              const Icon = shift.icon;
              const isSelected = activeShiftPreset === shift.id;

              return (
                <div
                  key={shift.id}
                  onClick={() => {
                    setActiveShiftPreset(shift.id);
                    handleApplyShiftPreset(shift.id, false);
                  }}
                  className={cn(
                    "rounded-2xl border p-4.5 cursor-pointer transition-all flex flex-col justify-between space-y-3 relative group",
                    isSelected
                      ? shift.activeStyle
                      : shift.gradient
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-xl font-bold text-sm shadow-2xs",
                        isSelected 
                          ? "bg-white/20 text-white backdrop-blur-xs" 
                          : shift.iconColor
                      )}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className={cn("font-black text-sm", !isSelected && "text-zinc-900 dark:text-white")}>
                            {shift.label}
                          </h3>
                          {isSelected && (
                            <span className="rounded-full px-2 py-0.2 text-[9px] font-black uppercase tracking-wider bg-white/25 text-white">
                              Active
                            </span>
                          )}
                        </div>
                        <p className={cn("text-xs font-mono font-semibold mt-0.5", isSelected ? "text-white/90" : "text-zinc-600 dark:text-zinc-400")}>
                          {shift.time}
                        </p>
                      </div>
                    </div>
                    {isSelected && <Check className="h-5 w-5 shrink-0 text-white" />}
                  </div>

                  {/* Slot preview overview */}
                  <div className={cn(
                    "rounded-xl p-2.5 space-y-1 text-[11px] font-mono",
                    isSelected ? "bg-black/15 text-white/95" : "bg-white/90 dark:bg-zinc-900/90 border border-zinc-200/70 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300"
                  )}>
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider opacity-75 pb-1 border-b border-current/10">
                      <span>Dynamic Period Times</span>
                      <span>{shift.slots.length} Slots</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 pt-1 text-[10px]">
                      <div><strong>P1:</strong> {shift.slots[0].start} – {shift.slots[0].end}</div>
                      <div><strong>P2:</strong> {shift.slots[1].start} – {shift.slots[1].end}</div>
                      <div><strong>P3:</strong> {shift.slots[2].start} – {shift.slots[2].end}</div>
                      <div><strong>Break:</strong> {shift.slots[3].start} – {shift.slots[3].end}</div>
                      <div><strong>P4:</strong> {shift.slots[4].start} – {shift.slots[4].end}</div>
                      <div><strong>P5:</strong> {shift.slots[5].start} – {shift.slots[5].end}</div>
                    </div>
                  </div>

                  <p className={cn("text-[11px] leading-snug font-medium", isSelected ? "text-white/90" : "text-zinc-600 dark:text-zinc-400")}>
                    {shift.desc}
                  </p>

                  <div className="pt-2 border-t border-current/10 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                      Click to Apply Now
                    </span>
                    <span className="text-[11px] font-bold underline">
                      Switch to {shift.label.split(" ")[0]} &rarr;
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Working Day Selector Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-zinc-200 pb-3 dark:border-zinc-800">
          {days.map((day) => (
            <button
              key={day.id}
              onClick={() => setSelectedDayId(day.id)}
              className={cn(
                "flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer",
                selectedDayId === day.id
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-white"
              )}
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>{day.name}</span>
              <span className={cn(
                "rounded-md px-1.5 py-0.5 text-[10px] font-mono font-bold",
                selectedDayId === day.id 
                  ? "bg-zinc-800 text-zinc-200 dark:bg-zinc-200 dark:text-zinc-800" 
                  : "bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300"
              )}>
                {day.periods_count || periods.length} slots
              </span>
            </button>
          ))}
        </div>

        {/* Periods List */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <span>Configured Slots for {currentDay?.name} ({periods.length} Periods)</span>
                <span className="rounded-full px-2 py-0.5 text-[10px] font-black uppercase bg-zinc-100 border border-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200">
                  {activeShiftPreset.toUpperCase()} SHIFT
                </span>
              </h2>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                Period 1, Period 2, etc. dynamically adapt when shifts are changed. You can also adjust times directly inline.
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {periods.map((p) => {
              const isBreak = p.period_type === "Break" || p.period_type === "Lunch";
              const isInlineEditing = inlineEditingId === p.id;

              return (
                <div
                  key={p.id}
                  className={cn(
                    "rounded-2xl border bg-white p-5 shadow-xs dark:bg-zinc-900 flex flex-col justify-between space-y-3 transition-all",
                    isBreak
                      ? "border-zinc-300 bg-zinc-50/60 dark:border-zinc-700 dark:bg-zinc-800/40"
                      : "border-zinc-200 dark:border-zinc-800"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 text-xs font-bold">
                        {isBreak ? <Coffee className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                      </div>
                      <div>
                        {isInlineEditing ? (
                          <input
                            type="text"
                            value={inlineTimes.name}
                            onChange={(e) => setInlineTimes({ ...inlineTimes, name: e.target.value })}
                            className="font-bold text-xs rounded-md border border-zinc-300 px-2 py-0.5 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                          />
                        ) : (
                          <h3 className="font-bold text-sm text-zinc-900 dark:text-white">
                            {p.name}
                          </h3>
                        )}
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium font-mono">
                          Slot #{p.order_index}
                        </span>
                      </div>
                    </div>
                    <span className="rounded-md px-2 py-0.5 text-[10px] font-bold uppercase bg-zinc-100 border border-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200 font-mono">
                      {p.period_type}
                    </span>
                  </div>

                  {/* Period Time Slot */}
                  <div className="border-t border-zinc-100 pt-3 dark:border-zinc-800">
                    {isInlineEditing ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-zinc-400 font-semibold block">Start</label>
                            <input
                              type="text"
                              value={inlineTimes.start_time}
                              onChange={(e) => setInlineTimes({ ...inlineTimes, start_time: e.target.value })}
                              placeholder="06:30 AM"
                              className="w-full text-xs font-mono font-bold rounded-lg border border-zinc-300 p-1.5 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-zinc-400 font-semibold block">End</label>
                            <input
                              type="text"
                              value={inlineTimes.end_time}
                              onChange={(e) => setInlineTimes({ ...inlineTimes, end_time: e.target.value })}
                              placeholder="07:15 AM"
                              className="w-full text-xs font-mono font-bold rounded-lg border border-zinc-300 p-1.5 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-1.5 pt-1">
                          <button
                            onClick={() => setInlineEditingId(null)}
                            className="px-2 py-1 text-[11px] rounded-lg border border-zinc-300 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveInlineEdit(p)}
                            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900"
                          >
                            <Save className="h-3 w-3" /> Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-300">
                        <span 
                          onClick={() => handleStartInlineEdit(p)}
                          className="font-mono font-bold tracking-tight text-xs text-zinc-900 dark:text-white cursor-pointer hover:underline"
                          title="Click to quickly adjust time"
                        >
                          {p.start_time} &ndash; {p.end_time}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleStartInlineEdit(p)}
                            className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white cursor-pointer transition-colors"
                            title="Quick Edit Time Slot"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white cursor-pointer transition-colors"
                            title="Delete Period"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-4">
                {editingPeriod ? "Edit Period Slot" : "Add Period Slot"}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Slot Name / Label (e.g. Period 1, Interval)
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Start Time</label>
                    <input
                      type="text"
                      required
                      placeholder="06:30 AM"
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                      className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">End Time</label>
                    <input
                      type="text"
                      required
                      placeholder="07:15 AM"
                      value={formData.end_time}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                      className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Order Index</label>
                    <input
                      type="number"
                      required
                      value={formData.order_index}
                      onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 1 })}
                      className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Period Type</label>
                    <select
                      value={formData.period_type}
                      onChange={(e) => setFormData({ ...formData, period_type: e.target.value })}
                      className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
                    >
                      <option value="Teaching">Teaching (Class Scheduled)</option>
                      <option value="Break">Break / Interval (Protected)</option>
                      <option value="Lunch">Lunch (Protected)</option>
                      <option value="Meeting">Meeting</option>
                      <option value="Free">Free</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-xl border border-zinc-200 px-4 py-2 font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-zinc-900 px-5 py-2 font-bold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 cursor-pointer"
                  >
                    Save Slot
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
