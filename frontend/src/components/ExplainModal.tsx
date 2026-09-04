"use client";

import React, { useState, useEffect } from "react";
import { HelpCircle, X, CheckCircle, Sparkles, User, DoorOpen, Clock, Layers } from "lucide-react";
import { api } from "@/lib/api";

interface ExplainModalProps {
  timetableId: number;
  entryId: number | null;
  onClose: () => void;
}

export function ExplainModal({ timetableId, entryId, onClose }: ExplainModalProps) {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (entryId && timetableId) {
      loadExplanation();
    }
  }, [entryId, timetableId]);

  const loadExplanation = async () => {
    if (!entryId) return;
    setLoading(true);
    try {
      const res = await api.explainEntry(timetableId, entryId);
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!entryId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
              <HelpCircle className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Why was this class scheduled here?
              </h3>
              <span className="text-[10px] text-slate-500">
                Explainable AI Scheduling Analysis
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-8 text-center text-xs text-slate-500">
            Analyzing optimization decision variables...
          </div>
        ) : data ? (
          <div className="mt-4 space-y-4">
            {/* Slot Overview Card */}
            <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-xs">
              <div className="font-bold text-slate-900 dark:text-white text-sm">
                {data.subject_name} ({data.subject_code})
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-slate-400" />
                  <span>{data.teacher_name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <DoorOpen className="h-3.5 w-3.5 text-slate-400" />
                  <span>{data.room_number}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  <span>{data.day_name}, {data.period_name} ({data.time_range})</span>
                </div>
              </div>
            </div>

            {/* List of Satisfied Constraints & Reasons */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Constraint Verification Checklist
              </h4>
              <div className="space-y-1.5">
                {data.reasons?.map((reason: string, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 rounded-lg bg-emerald-50/70 p-2 text-xs text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200 border border-emerald-100 dark:border-emerald-900/30"
                  >
                    <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                    <span>{reason}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={onClose}
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-slate-500">
            No explanation found.
          </div>
        )}
      </div>
    </div>
  );
}
