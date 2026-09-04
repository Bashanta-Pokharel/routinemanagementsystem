"use client";

import React, { useState } from "react";
import { 
  Sparkles, X, CheckCircle2, Sliders, Play, 
  Layers, Clock, ShieldCheck, ArrowRight, Trophy, Zap
} from "lucide-react";
import confetti from "canvas-confetti";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface GeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  academicYears: any[];
  onGenerated?: (timetableId: number) => void;
}

export function GeneratorModal({ isOpen, onClose, academicYears, onGenerated }: GeneratorModalProps) {
  const [selectedYearId, setSelectedYearId] = useState<number>(academicYears[0]?.id || 1);
  const [routineName, setRoutineName] = useState<string>("Master Semester Routine");
  const [numSolutions, setNumSolutions] = useState<number>(3);
  const [weights, setWeights] = useState({
    teacher_preference: 6,
    consecutive_classes: 4,
    idle_gaps: 4,
    subject_distribution: 7,
    room_stability: 3,
  });

  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    setResult(null);

    try {
      const res = await api.generateTimetable({
        academic_year_id: selectedYearId,
        name: routineName,
        num_solutions: numSolutions,
        weights: weights,
      });

      setResult(res);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
      if (onGenerated) {
        onGenerated(res.timetable_id);
      }
    } catch (err: any) {
      setError(err.message || "Routine generation failed. Please review constraints.");
    } finally {
      setGenerating(false);
    }
  };

  const handleApplySolution = async (solId: number) => {
    if (!result?.timetable_id) return;
    try {
      await api.applyCandidateSolution(result.timetable_id, solId);
      alert("Applied candidate solution!");
      onClose();
    } catch (e: any) {
      alert("Failed to apply solution: " + e.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Generate Optimized Routine
              </h2>
              <p className="text-xs text-slate-500">
                Google OR-Tools CP-SAT & Dynamic Constraint Optimizer
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Configuration Form */}
        {!result ? (
          <div className="mt-5 space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Routine Title
                </label>
                <input
                  type="text"
                  value={routineName}
                  onChange={(e) => setRoutineName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Fall 2026 Master Routine"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Academic Session
                </label>
                <select
                  value={selectedYearId}
                  onChange={(e) => setSelectedYearId(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {academicYears.map((ay) => (
                    <option key={ay.id} value={ay.id}>
                      {ay.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Soft Constraint Optimization Sliders */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40">
              <div className="flex items-center gap-2 mb-3">
                <Sliders className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Soft Constraints Weight Tuning
                </h4>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between font-medium text-slate-700 dark:text-slate-300 mb-1">
                    <span>Teacher Preferred Slots Reward</span>
                    <span className="font-bold text-blue-600">{weights.teacher_preference}/10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={weights.teacher_preference}
                    onChange={(e) => setWeights({ ...weights, teacher_preference: Number(e.target.value) })}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between font-medium text-slate-700 dark:text-slate-300 mb-1">
                    <span>Subject Weekly Spread / Distribution</span>
                    <span className="font-bold text-blue-600">{weights.subject_distribution}/10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={weights.subject_distribution}
                    onChange={(e) => setWeights({ ...weights, subject_distribution: Number(e.target.value) })}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between font-medium text-slate-700 dark:text-slate-300 mb-1">
                    <span>Minimize Idle Gaps / Holes</span>
                    <span className="font-bold text-blue-600">{weights.idle_gaps}/10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={weights.idle_gaps}
                    onChange={(e) => setWeights({ ...weights, idle_gaps: Number(e.target.value) })}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-300">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={generating}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/25 hover:from-blue-700 hover:to-indigo-700 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
              >
                {generating ? (
                  <>
                    <Zap className="h-4 w-4 animate-spin" />
                    Optimizing CP-SAT Schedule...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 fill-white" />
                    Generate Conflict-Free Routine
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Multi-Solution Results Preview */
          <div className="mt-5 space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-emerald-50 p-3.5 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800/50">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                    Optimal Timetable Generated Successfully!
                  </span>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                    Solved in {result.execution_time_seconds}s &bull; {result.conflict_count} Conflicts &bull; Top Score {result.best_score}%
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Candidate Solutions ({result.solutions?.length || 0})
              </h4>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                {result.solutions?.map((sol: any, idx: number) => (
                  <div
                    key={idx}
                    className={cn(
                      "rounded-xl border p-3 flex flex-col justify-between transition-all",
                      idx === 0
                        ? "border-blue-500 bg-blue-50/50 dark:border-blue-700 dark:bg-blue-950/30 ring-2 ring-blue-500/20"
                        : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                          <Trophy className={cn("h-3.5 w-3.5", idx === 0 ? "text-amber-500" : "text-slate-400")} />
                          Solution #{sol.solution_index}
                        </span>
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {sol.score}%
                        </span>
                      </div>
                      <div className="mt-2 text-[10px] text-slate-500 space-y-0.5">
                        <div>Conflicts: <span className="font-bold text-emerald-600">0</span></div>
                        <div>Classes: {sol.entries_count}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleApplySolution(sol.solution_index)}
                      className="mt-3 w-full rounded-lg bg-slate-900 py-1.5 text-[11px] font-bold text-white hover:bg-blue-600 dark:bg-slate-800 dark:hover:bg-blue-600 transition-colors cursor-pointer"
                    >
                      {idx === 0 ? "Active Best" : "Apply Solution"}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                onClick={onClose}
                className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700 cursor-pointer"
              >
                View Generated Timetable &rarr;
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
