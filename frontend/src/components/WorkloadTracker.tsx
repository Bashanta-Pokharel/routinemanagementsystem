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
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-black text-[11px] shadow-2xs">
                        {w.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                      <span>{w.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 font-medium text-zinc-600 dark:text-zinc-300">
                    <span className="font-bold text-zinc-900 dark:text-white">{w.assigned_hours}</span> / {w.max_hours} hrs/wk
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-2.5 w-32 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            isOver 
                              ? "bg-gradient-to-r from-rose-500 to-red-600" 
                              : isNear 
                              ? "bg-gradient-to-r from-amber-400 to-orange-500" 
                              : "bg-gradient-to-r from-emerald-400 to-teal-500"
                          )}
                          style={{ width: `${Math.min(100, (w.assigned_hours / w.max_hours) * 100)}%` }}
                        />
                      </div>
                      <span className={cn(
                        "text-[11px] font-black font-mono",
                        isOver ? "text-rose-600 dark:text-rose-400" : isNear ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"
                      )}>
                        {Math.round((w.assigned_hours / w.max_hours) * 100)}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right">
                    {isOver ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 text-rose-700 px-3 py-1 text-[10px] font-black border border-rose-200 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-800">
                        <AlertTriangle className="h-3 w-3" /> Overload
                      </span>
                    ) : isNear ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-800 px-3 py-1 text-[10px] font-black border border-amber-200 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800">
                        Near Capacity
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 px-3 py-1 text-[10px] font-black border border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800">
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
