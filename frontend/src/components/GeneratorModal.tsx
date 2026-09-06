"use client";

import React, { useState } from "react";
import { 
  Sparkles, X, CheckCircle2, Sliders, Play, 
  Trophy, Zap
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
        particleCount: 80,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150 font-sans">
      <div className="w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 pb-4 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-white">
                Generate Optimized Routine
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Constraint Optimizer &amp; Collision Elimination Engine
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Configuration Form */}
        {!result ? (
          <div className="mt-5 space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Routine Title
                </label>
                <input
                  type="text"
                  value={routineName}
                  onChange={(e) => setRoutineName(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs text-zinc-900 shadow-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  placeholder="e.g. Master Routine 2026"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Academic Session
                </label>
                <select
                  value={selectedYearId}
                  onChange={(e) => setSelectedYearId(Number(e.target.value))}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs text-zinc-900 shadow-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
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
            <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-800/40">
              <div className="flex items-center gap-2 mb-3">
                <Sliders className="h-4 w-4 text-zinc-900 dark:text-white" />
                <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                  Soft Constraints Weight Tuning
                </h4>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    <span>Teacher Preferred Slots Reward</span>
                    <span className="font-mono font-bold text-zinc-900 dark:text-white">{weights.teacher_preference}/10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={weights.teacher_preference}
                    onChange={(e) => setWeights({ ...weights, teacher_preference: Number(e.target.value) })}
                    className="w-full accent-zinc-900 dark:accent-zinc-100 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    <span>Subject Weekly Spread / Distribution</span>
                    <span className="font-mono font-bold text-zinc-900 dark:text-white">{weights.subject_distribution}/10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={weights.subject_distribution}
                    onChange={(e) => setWeights({ ...weights, subject_distribution: Number(e.target.value) })}
                    className="w-full accent-zinc-900 dark:accent-zinc-100 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    <span>Minimize Idle Gaps / Holes</span>
                    <span className="font-mono font-bold text-zinc-900 dark:text-white">{weights.idle_gaps}/10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={weights.idle_gaps}
                    onChange={(e) => setWeights({ ...weights, idle_gaps: Number(e.target.value) })}
                    className="w-full accent-zinc-900 dark:accent-zinc-100 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-zinc-300 bg-zinc-100 p-3 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={generating}
                className="flex items-center gap-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 px-5 py-2.5 text-xs font-bold text-white dark:text-zinc-900 shadow-xs hover:bg-zinc-800 dark:hover:bg-zinc-200 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
              >
                {generating ? (
                  <>
                    <Zap className="h-4 w-4 animate-spin" />
                    Optimizing Schedule...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 fill-current" />
                    Generate Conflict-Free Routine
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Multi-Solution Results Preview */
          <div className="mt-5 space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-zinc-100 dark:bg-zinc-800/80 p-3.5 border border-zinc-200 dark:border-zinc-700">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="h-5 w-5 text-zinc-900 dark:text-white" />
                <div>
                  <span className="text-xs font-bold text-zinc-900 dark:text-white">
                    Optimal Timetable Generated Successfully!
                  </span>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                    Solved in {result.execution_time_seconds}s &bull; {result.conflict_count} Conflicts &bull; Top Score {result.best_score}%
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                Candidate Solutions ({result.solutions?.length || 0})
              </h4>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                {result.solutions?.map((sol: any, idx: number) => (
                  <div
                    key={idx}
                    className={cn(
                      "rounded-xl border p-3 flex flex-col justify-between transition-all",
                      idx === 0
                        ? "border-zinc-900 dark:border-zinc-100 ring-2 ring-zinc-900/20 dark:ring-zinc-100/20 bg-zinc-50 dark:bg-zinc-850"
                        : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1">
                          <Trophy className="h-3.5 w-3.5" />
                          Solution #{sol.solution_index}
                        </span>
                        <span className="rounded-md bg-zinc-100 border border-zinc-200 px-2 py-0.5 text-[10px] font-mono font-bold text-zinc-900 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200">
                          {sol.score}%
                        </span>
                      </div>
                      <div className="mt-2 text-[10px] text-zinc-500 dark:text-zinc-400 space-y-0.5 font-mono">
                        <div>Conflicts: <span className="font-bold text-zinc-900 dark:text-white">0</span></div>
                        <div>Classes: {sol.entries_count}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleApplySolution(sol.solution_index)}
                      className="mt-3 w-full rounded-lg bg-zinc-900 py-1.5 text-[11px] font-bold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-colors cursor-pointer"
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
                className="rounded-xl bg-zinc-900 px-5 py-2 text-xs font-bold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 cursor-pointer"
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
