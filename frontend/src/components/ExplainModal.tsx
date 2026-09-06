"use client";

import React, { useState, useEffect } from "react";
import { HelpCircle, X, CheckCircle, User, DoorOpen, Clock } from "lucide-react";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150 font-sans">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700">
              <HelpCircle className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                Why was this class scheduled here?
              </h3>
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                Constraint Engine Decision Analysis
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:hover:text-white cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-8 text-center text-xs text-zinc-500">
            Analyzing optimization decision variables...
          </div>
        ) : data ? (
          <div className="mt-4 space-y-4">
            {/* Slot Overview Card */}
            <div className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 text-xs">
              <div className="font-bold text-zinc-900 dark:text-white text-sm">
                {data.subject_name} ({data.subject_code})
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-zinc-600 dark:text-zinc-300">
                <div className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-zinc-400" />
                  <span>{data.teacher_name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <DoorOpen className="h-3.5 w-3.5 text-zinc-400" />
                  <span>{data.room_number}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-zinc-400" />
                  <span>{data.day_name}, {data.period_name} ({data.time_range})</span>
                </div>
              </div>
            </div>

            {/* List of Satisfied Constraints & Reasons */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                Constraint Verification Checklist
              </h4>
              <div className="space-y-1.5">
                {data.reasons?.map((reason: string, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 p-2 text-xs text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700"
                  >
                    <CheckCircle className="h-4 w-4 shrink-0 text-zinc-900 dark:text-zinc-100 mt-0.5" />
                    <span>{reason}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={onClose}
                className="rounded-xl bg-zinc-900 px-4 py-2 text-xs font-bold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-zinc-500">
            No explanation found.
          </div>
        )}
      </div>
    </div>
  );
}
