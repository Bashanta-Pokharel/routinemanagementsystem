"use client";

import React, { useState, useEffect } from "react";
import { Clock, Plus, Trash2, Edit3, Copy, Check, Calendar, Sun, Coffee, Users } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function PeriodsPage() {
  const [days, setDays] = useState<any[]>([]);
  const [selectedDayId, setSelectedDayId] = useState<number>(1);
  const [periods, setPeriods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Period modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    day_id: 1,
    name: "Period 1",
    start_time: "08:00",
    end_time: "09:00",
    order_index: 1,
    period_type: "Teaching",
  });

  useEffect(() => {
    loadDays();
  }, []);

  useEffect(() => {
    if (selectedDayId) {
      loadPeriods(selectedDayId);
    }
  }, [selectedDayId]);

  const loadDays = async () => {
    setLoading(true);
    try {
      const data = await api.getWorkingDays();
      setDays(data || []);
      if (data && data.length > 0) {
        setSelectedDayId(data[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadPeriods = async (dayId: number) => {
    try {
      const data = await api.getPeriods(dayId);
      setPeriods(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenCreate = () => {
    setEditingPeriod(null);
    setFormData({
      day_id: selectedDayId,
      name: `Period ${periods.length + 1}`,
      start_time: "08:00",
      end_time: "09:00",
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
      } else {
        await api.createPeriod(formData);
      }
      setIsModalOpen(false);
      loadPeriods(selectedDayId);
    } catch (err: any) {
      alert("Failed to save period: " + err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this period slot?")) return;
    try {
      await api.deletePeriod(id);
      loadPeriods(selectedDayId);
    } catch (err: any) {
      alert("Failed to delete period: " + err.message);
    }
  };

  const handleCloneToOtherDays = async () => {
    const otherDayIds = days.filter((d) => d.id !== selectedDayId).map((d) => d.id);
    if (otherDayIds.length === 0) return;
    if (!confirm(`Clone all periods from active day to the other ${otherDayIds.length} working days?`)) return;

    try {
      await api.cloneDayPeriods(selectedDayId, otherDayIds);
      alert("Cloned period schedule successfully!");
      loadDays();
    } catch (e: any) {
      alert("Failed to clone: " + e.message);
    }
  };

  const currentDay = days.find((d) => d.id === selectedDayId);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Dynamic Working Days & Daily Periods
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Supports arbitrary working days and custom daily period counts (e.g. 6 periods on Sunday vs 4 periods on Friday).
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCloneToOtherDays}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
            >
              <Copy className="h-4 w-4" />
              Clone to Other Days
            </button>
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm shadow-blue-500/25 hover:bg-blue-700 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Add Period Slot
            </button>
          </div>
        </div>

        {/* Working Day Selector Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3 dark:border-slate-800">
          {days.map((day) => (
            <button
              key={day.id}
              onClick={() => setSelectedDayId(day.id)}
              className={cn(
                "flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer",
                selectedDayId === day.id
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/25"
                  : "bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
              )}
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>{day.name}</span>
              <span className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-black",
                selectedDayId === day.id ? "bg-blue-800 text-blue-100" : "bg-slate-100 text-slate-500 dark:bg-slate-800"
              )}>
                {day.periods_count || periods.length} slots
              </span>
            </button>
          ))}
        </div>

        {/* Periods List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Configured Slots for {currentDay?.name} ({periods.length} Periods)
            </h2>
            <span className="text-xs text-slate-500">
              Classes are only scheduled in &quot;Teaching&quot; slots.
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {periods.map((p) => {
              const isTeaching = p.period_type === "Teaching";
              const isBreak = p.period_type === "Break" || p.period_type === "Lunch";

              return (
                <div
                  key={p.id}
                  className={cn(
                    "rounded-3xl border bg-white p-5 shadow-sm dark:bg-slate-900 flex flex-col justify-between space-y-3 transition-all",
                    isBreak
                      ? "border-amber-200 bg-amber-50/40 dark:border-amber-900/40 dark:bg-amber-950/20"
                      : "border-slate-200 dark:border-slate-800"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold",
                        isBreak
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300"
                          : "bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300"
                      )}>
                        {isBreak ? <Coffee className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                          {p.name}
                        </h3>
                        <span className="text-[10px] text-slate-400 font-medium">
                          Slot #{p.order_index}
                        </span>
                      </div>
                    </div>
                    <span className={cn(
                      "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase",
                      isTeaching
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200"
                    )}>
                      {p.period_type}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 border-t border-slate-100 pt-3 dark:border-slate-800">
                    <span className="font-bold tracking-tight text-sm text-slate-900 dark:text-white">
                      {p.start_time} &ndash; {p.end_time}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(p)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                        title="Edit Period"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer"
                        title="Delete Period"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
                {editingPeriod ? "Edit Period Slot" : "Add Period Slot"}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Slot Name / Label (e.g. Period 1, Lunch Break)
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Start Time</label>
                    <input
                      type="text"
                      required
                      placeholder="08:00"
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">End Time</label>
                    <input
                      type="text"
                      required
                      placeholder="09:00"
                      value={formData.end_time}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Order Index</label>
                    <input
                      type="number"
                      required
                      value={formData.order_index}
                      onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Period Type</label>
                    <select
                      value={formData.period_type}
                      onChange={(e) => setFormData({ ...formData, period_type: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    >
                      <option value="Teaching">Teaching (Class Scheduled)</option>
                      <option value="Break">Break / Recess (Protected)</option>
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
                    className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-blue-600 px-5 py-2 font-bold text-white hover:bg-blue-700 cursor-pointer"
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
