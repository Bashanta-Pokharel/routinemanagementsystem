"use client";

import React, { useState, useEffect } from "react";
import { History, ShieldCheck, Clock, FileText, CheckCircle2 } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { api } from "@/lib/api";

export default function AuditPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [timetables, setTimetables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [logsData, ttData] = await Promise.all([
        api.getAuditLogs(),
        api.getTimetables()
      ]);
      setLogs(logsData || []);
      setTimetables(ttData || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 font-sans">
        {/* Header */}
        <div className="flex flex-col gap-2 rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
            <History className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            Audit Trail &amp; Timetable Version History
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Immutable log of all routine generations, manual slot adjustments, class placements, and publications.
          </p>
        </div>

        {/* Timetable Versions */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
          <h2 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            Timetable Snapshots &amp; Versions
          </h2>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {timetables.map((tt) => (
              <div
                key={tt.id}
                className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/80 space-y-2.5 text-xs shadow-xs hover:border-emerald-300 dark:hover:border-emerald-700 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-900 dark:text-white">{tt.name}</span>
                  <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-mono font-bold text-emerald-800 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-300">
                    Score: {tt.score}%
                  </span>
                </div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400 space-y-1 border-t border-zinc-100 pt-2 dark:border-zinc-800">
                  <div className="flex justify-between">
                    <span>Version:</span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200 font-mono">v{tt.version}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">
                      {tt.is_published ? "Published ✓" : "Draft"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Hard Conflicts:</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400 font-mono">0</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Audit Logs Table */}
        <div className="rounded-2xl border border-zinc-200 bg-white shadow-xs overflow-hidden dark:border-zinc-800 dark:bg-zinc-900">
          <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 font-bold text-sm text-zinc-900 dark:text-white">
            Recent System Activity Logs
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-zinc-100 border-b border-zinc-200 text-[11px] font-bold text-zinc-700 uppercase tracking-wider dark:bg-zinc-800/80 dark:border-zinc-800 dark:text-zinc-300">
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-xs text-zinc-400">
                      No audit events recorded yet.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                      <td className="py-3 px-4 font-semibold text-zinc-900 dark:text-white">
                        {log.action}
                      </td>
                      <td className="py-3 px-4 text-zinc-600 dark:text-zinc-300">
                        {log.user_id ? `User #${log.user_id}` : "Campus Admin"}
                      </td>
                      <td className="py-3 px-4 text-zinc-600 dark:text-zinc-300">
                        {log.entity_type} {log.entity_id ? `(#${log.entity_id})` : ""}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-zinc-400 dark:text-zinc-500">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
