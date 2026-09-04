"use client";

import React, { useState, useEffect } from "react";
import { Check, X, Star, Slash, Save, Sparkles, Copy, Sun } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface AvailabilityMatrixProps {
  teacherId: number;
  teacherName: string;
  onSaved?: () => void;
}

export function AvailabilityMatrix({ teacherId, teacherName, onSaved }: AvailabilityMatrixProps) {
  const [days, setDays] = useState<any[]>([]);
  const [availabilities, setAvailabilities] = useState<Record<number, string>>({}); // period_id -> status
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    loadData();
  }, [teacherId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [daysData, availData] = await Promise.all([
        api.getWorkingDays(),
        api.getTeacherAvailability(teacherId)
      ]);
      setDays(daysData || []);
      
      const map: Record<number, string> = {};
      if (availData) {
        availData.forEach((a: any) => {
          map[a.period_id] = a.status;
        });
      }
      setAvailabilities(map);
    } catch (e) {
      console.error("Failed to load teacher availability matrix", e);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = (periodId: number) => {
    const current = availabilities[periodId] || "available";
    let next = "available";
    if (current === "available") next = "preferred";
    else if (current === "preferred") next = "unavailable";
    else if (current === "unavailable") next = "restricted";
    else next = "available";

    setAvailabilities({ ...availabilities, [periodId]: next });
  };

  const setEntireDayStatus = (day: any, status: string) => {
    const nextMap = { ...availabilities };
    (day.periods || []).forEach((p: any) => {
      if (p.period_type === "Teaching") {
        nextMap[p.id] = status;
      }
    });
    setAvailabilities(nextMap);
  };

  const setMorningPreferred = () => {
    const nextMap = { ...availabilities };
    days.forEach((d) => {
      (d.periods || []).forEach((p: any) => {
        if (p.period_type === "Teaching" && (p.start_time.startsWith("08:") || p.start_time.startsWith("09:"))) {
          nextMap[p.id] = "preferred";
        }
      });
    });
    setAvailabilities(nextMap);
  };

  const setAllAvailable = () => {
    const nextMap = { ...availabilities };
    days.forEach((d) => {
      (d.periods || []).forEach((p: any) => {
        if (p.period_type === "Teaching") {
          nextMap[p.id] = "available";
        }
      });
    });
    setAvailabilities(nextMap);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const items = Object.entries(availabilities).map(([pId, status]) => ({
        period_id: Number(pId),
        status,
      }));
      await api.updateTeacherAvailabilityBatch({
        teacher_id: teacherId,
        availabilities: items,
      });
      setSaveSuccess(true);
      if (onSaved) onSaved();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      alert("Failed to save availability");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-500">Loading availability matrix...</div>;
  }

  const maxPeriods = Math.max(...days.map((d: any) => d.periods?.length || 6), 6);

  return (
    <div className="space-y-4">
      {/* Top Header & Bulk Controls */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            Weekly Availability Grid &ndash; {teacherName}
          </h3>
          <p className="text-[11px] text-slate-500">
            Click cells to cycle: Available (✓) → Preferred (★) → Unavailable (✗) → Restricted (⊘)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={setMorningPreferred}
            className="flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100 dark:border-amber-800/40 dark:bg-amber-950/40 dark:text-amber-300 cursor-pointer"
          >
            <Sun className="h-3.5 w-3.5" />
            Prefer Mornings
          </button>
          <button
            onClick={setAllAvailable}
            className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
          >
            Reset All Available
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm shadow-blue-500/25 hover:bg-blue-700 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? "Saving..." : saveSuccess ? "Saved ✓" : "Save Matrix"}
          </button>
        </div>
      </div>

      {/* Availability Matrix Grid */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-center text-xs min-w-[700px]">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 dark:bg-slate-800/60 dark:border-slate-800">
                <th className="py-3 px-4 text-left font-bold text-slate-700 dark:text-slate-300 w-32 border-r border-slate-200 dark:border-slate-800 uppercase tracking-wider text-[11px]">
                  Working Day
                </th>
                {Array.from({ length: maxPeriods }).map((_, idx) => (
                  <th
                    key={idx}
                    className="py-3 px-3 font-bold text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800 last:border-r-0 text-[11px]"
                  >
                    Period {idx + 1}
                  </th>
                ))}
                <th className="py-3 px-3 font-bold text-slate-700 dark:text-slate-300 w-28 text-[11px]">
                  Quick Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {days.map((day: any) => {
                const dayPeriods = day.periods || [];
                return (
                  <tr key={day.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 text-left font-bold text-slate-900 dark:text-white bg-slate-50/70 dark:bg-slate-800/40 border-r border-slate-200 dark:border-slate-800">
                      {day.name}
                    </td>

                    {Array.from({ length: maxPeriods }).map((_, pIdx) => {
                      const period = dayPeriods[pIdx];

                      if (!period) {
                        return (
                          <td
                            key={pIdx}
                            className="p-2 bg-slate-100/30 text-slate-400 dark:bg-slate-900/40 border-r border-slate-200 dark:border-slate-800 last:border-r-0"
                          >
                            <span className="text-[10px]">Off</span>
                          </td>
                        );
                      }

                      if (period.period_type !== "Teaching") {
                        return (
                          <td
                            key={period.id}
                            className="p-2 bg-amber-50/50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border-r border-slate-200 dark:border-slate-800 last:border-r-0 text-[10px] font-semibold"
                          >
                            {period.name}
                          </td>
                        );
                      }

                      const status = availabilities[period.id] || "available";

                      return (
                        <td
                          key={period.id}
                          onClick={() => toggleStatus(period.id)}
                          className="p-2 border-r border-slate-200 dark:border-slate-800 last:border-r-0 cursor-pointer hover:opacity-90 select-none transition-all"
                        >
                          <div
                            className={cn(
                              "flex flex-col items-center justify-center rounded-xl p-2 font-bold transition-all shadow-xs",
                              status === "available" && "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50",
                              status === "preferred" && "bg-amber-50 text-amber-700 border border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-700 ring-1 ring-amber-400/40",
                              status === "unavailable" && "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/50",
                              status === "restricted" && "bg-slate-100 text-slate-600 border border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                            )}
                          >
                            <div className="flex items-center gap-1 text-sm font-black">
                              {status === "available" && <Check className="h-4 w-4 text-emerald-600" />}
                              {status === "preferred" && <Star className="h-4 w-4 text-amber-500 fill-amber-400" />}
                              {status === "unavailable" && <X className="h-4 w-4 text-rose-600" />}
                              {status === "restricted" && <Slash className="h-4 w-4 text-slate-500" />}
                            </div>
                            <span className="mt-0.5 text-[9px] uppercase tracking-wider font-semibold capitalize">
                              {status}
                            </span>
                          </div>
                        </td>
                      );
                    })}

                    {/* Quick Day Actions */}
                    <td className="p-2">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => setEntireDayStatus(day, "available")}
                          className="rounded px-1.5 py-1 text-[10px] font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 cursor-pointer"
                          title="Set entire day Available"
                        >
                          All ✓
                        </button>
                        <button
                          type="button"
                          onClick={() => setEntireDayStatus(day, "unavailable")}
                          className="rounded px-1.5 py-1 text-[10px] font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 cursor-pointer"
                          title="Set entire day Off"
                        >
                          Off ✗
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
