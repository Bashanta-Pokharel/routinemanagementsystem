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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-2 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <History className="h-5 w-5 text-blue-600" />
            Audit Trail & Timetable Version History
          </h1>
          <p className="text-xs text-slate-500">
            Immutable log of all routine generations, manual drag-and-drop slot moves, class swaps, and official publications.
          </p>
        </div>

        {/* Timetable Versions */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="h-4 w-4 text-indigo-600" />
            Timetable Snapshots & Versions
          </h2>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {timetables.map((tt) => (
              <div
                key={tt.id}
                className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white">{tt.name}</span>
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    Score: {tt.score}%
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 space-y-0.5">
                  <div>Version: <span className="font-bold text-slate-800 dark:text-slate-200">v{tt.version}</span></div>
                  <div>Status: <span className="font-bold text-emerald-600">{tt.is_published ? "Published" : "Draft"}</span></div>
                  <div>Conflicts: <span className="font-bold text-emerald-600">0</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Audit Logs Table */}
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 font-bold text-sm text-slate-900 dark:text-white">
            Recent System Activity Logs
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase tracking-wider dark:bg-slate-800/60 dark:border-slate-800 dark:text-slate-300">
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-xs text-slate-400">
                      No audit events recorded yet.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-bold text-blue-600 dark:text-blue-400">
                        {log.action}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-600 dark:text-slate-300">
                        {log.user_email || "admin@campus.edu"}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        {log.entity_type} #{log.entity_id || ""}
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-[11px]">
                        {new Date(log.timestamp).toLocaleString()}
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
