"use client";

import React from "react";
import { AlertTriangle, CheckCircle2, User, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkloadItem {
  teacher_id: number;
  name: string;
  assigned_hours: number;
  max_hours: number;
  utilization_pct: number;
  status: string;
}

interface WorkloadTrackerProps {
  workloads: WorkloadItem[];
}

export function WorkloadTracker({ workloads }: WorkloadTrackerProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            Teacher Workload Distribution
          </h3>
          <p className="text-xs text-slate-500">
            Weekly teaching hours vs individual configured maximum hours
          </p>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider dark:border-slate-800">
              <th className="py-2.5 px-3">Faculty Member</th>
              <th className="py-2.5 px-3">Weekly Hours</th>
              <th className="py-2.5 px-3">Capacity Utilization</th>
              <th className="py-2.5 px-3 text-right">Workload Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {workloads.map((w) => {
              const isOver = w.assigned_hours > w.max_hours;
              const isNear = w.assigned_hours >= w.max_hours - 2 && !isOver;

              return (
                <tr key={w.teacher_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-blue-600 font-bold text-[10px] dark:bg-blue-950/50 dark:text-blue-300">
                        {w.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                      <span>{w.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 font-medium text-slate-600 dark:text-slate-300">
                    <span className="font-bold text-slate-900 dark:text-white">{w.assigned_hours}</span> / {w.max_hours} hrs
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-32 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            isOver ? "bg-rose-500" : isNear ? "bg-amber-500" : "bg-blue-600"
                          )}
                          style={{ width: `${Math.min(w.utilization_pct, 100)}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-semibold text-slate-500">{w.utilization_pct}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold",
                        isOver
                          ? "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-900"
                          : isNear
                          ? "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-900"
                          : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900"
                      )}
                    >
                      {isOver ? (
                        <>
                          <AlertTriangle className="h-3 w-3" />
                          Overloaded
                        </>
                      ) : isNear ? (
                        <>
                          <AlertTriangle className="h-3 w-3" />
                          Near Limit
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-3 w-3" />
                          Balanced
                        </>
                      )}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
