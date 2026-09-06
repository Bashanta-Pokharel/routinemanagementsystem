"use client";

import React from "react";
import { AlertTriangle, CheckCircle2, User, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export interface WorkloadItem {
  teacher_id: number;
  name: string;
  assigned_hours: number;
  max_hours: number;
  utilization_pct: number;
  status: string;
}

export interface WorkloadTrackerProps {
  workloads?: WorkloadItem[];
}

export function WorkloadTracker({ workloads }: WorkloadTrackerProps) {
  const data: WorkloadItem[] = workloads && workloads.length > 0 ? workloads : [
    {
      teacher_id: 1,
      name: "Bhupendra Ram Luhar",
      assigned_hours: 12,
      max_hours: 16,
      utilization_pct: 75,
      status: "OPTIMAL"
    },
    {
      teacher_id: 2,
      name: "Shree krishna Maharjan",
      assigned_hours: 10,
      max_hours: 16,
      utilization_pct: 62,
      status: "OPTIMAL"
    },
    {
      teacher_id: 3,
      name: "Ananda KC",
      assigned_hours: 12,
      max_hours: 16,
      utilization_pct: 75,
      status: "OPTIMAL"
    },
    {
      teacher_id: 4,
      name: "Sharmila Bhattarai",
      assigned_hours: 10,
      max_hours: 16,
      utilization_pct: 62,
      status: "OPTIMAL"
    },
    {
      teacher_id: 5,
      name: "Bijaya Mishra",
      assigned_hours: 10,
      max_hours: 16,
      utilization_pct: 62,
      status: "OPTIMAL"
    }
  ];

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between border-b border-zinc-100 pb-4 dark:border-zinc-800">
        <div>
          <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <Clock className="h-4 w-4 text-zinc-700 dark:text-zinc-300" />
            Faculty Workload &amp; Capacity Tracker
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Weekly scheduled teaching periods against maximum configured limits
          </p>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-zinc-100 text-[11px] font-bold text-zinc-400 uppercase tracking-wider dark:border-zinc-800">
              <th className="py-2.5 px-3">Faculty Member</th>
              <th className="py-2.5 px-3">Assigned / Max</th>
              <th className="py-2.5 px-3">Capacity Utilization</th>
              <th className="py-2.5 px-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {data.map((w) => {
              const isOver = w.assigned_hours > w.max_hours;
              const isNear = w.assigned_hours >= w.max_hours - 2 && !isOver;

              return (
                <tr key={w.teacher_id} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40">
                  <td className="py-3 px-3 font-semibold text-zinc-900 dark:text-white">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-100 text-zinc-800 font-bold text-[10px] dark:bg-zinc-800 dark:text-zinc-200">
                        {w.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                      <span>{w.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 font-medium text-zinc-600 dark:text-zinc-300">
                    {w.assigned_hours} / {w.max_hours} hrs/wk
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-2 w-28 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            isOver ? "bg-red-500" : isNear ? "bg-amber-500" : "bg-emerald-500"
                          )}
                          style={{ width: `${Math.min(100, (w.assigned_hours / w.max_hours) * 100)}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                        {Math.round((w.assigned_hours / w.max_hours) * 100)}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right">
                    {isOver ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-[10px] font-bold text-red-700 dark:bg-red-950/40 dark:text-red-300">
                        <AlertTriangle className="h-3 w-3" /> Overload
                      </span>
                    ) : isNear ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                        Near Capacity
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                        <CheckCircle2 className="h-3 w-3" /> Balanced
                      </span>
                    )}
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
