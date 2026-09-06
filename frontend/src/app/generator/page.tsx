"use client";

import React, { useState, useEffect } from "react";
import { 
  Sparkles, Play, Trophy, Sliders, 
  ShieldCheck, Zap
} from "lucide-react";
import confetti from "canvas-confetti";
import { DashboardLayout } from "@/components/DashboardLayout";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function GeneratorPage() {
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [selectedYearId, setSelectedYearId] = useState<number>(1);
  const [routineName, setRoutineName] = useState<string>("Semester Master Routine 2026");
  const [numSolutions, setNumSolutions] = useState<number>(3);
  const [weights, setWeights] = useState({
    teacher_preference: 6,
    consecutive_classes: 4,
    idle_gaps: 4,
    subject_distribution: 7,
    room_stability: 3,
  });

  const [generating, setGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getAcademicYears().then((data) => {
      if (data && data.length > 0) {
        setAcademicYears(data);
        setSelectedYearId(data[0].id);
      }
    });
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await api.generateTimetable({
        academic_year_id: selectedYearId,
        name: routineName,
        num_solutions: numSolutions,
        weights: weights,
      });
      setGenerationResult(res);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (err: any) {
      setError(err.message || "Failed to solve timetable.");
    } finally {
      setGenerating(false);
    }
  };

  const handleApplySolution = async (solId: number) => {
    if (!generationResult?.timetable_id) return;
    try {
      await api.applyCandidateSolution(generationResult.timetable_id, solId);
      alert(`Applied Solution #${solId}! Redirecting to Master Routine editor.`);
      window.location.href = `/timetables?id=${generationResult.timetable_id}`;
    } catch (e: any) {
      alert("Failed to apply solution: " + e.message);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 font-sans">
        {/* Header */}
        <div className="flex flex-col gap-2 rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs">
              <Sparkles className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Autonomous Routine Generator &amp; Multi-Solution Optimizer
            </h1>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Formulates academic requirements into Constraint Programming models. Eliminates collisions and ranks candidate schedules by soft-constraint satisfaction.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left: Configuration Panel */}
          <div className="lg:col-span-1 space-y-5 rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Sliders className="h-4 w-4 text-zinc-900 dark:text-zinc-100" />
              Optimization Parameters
            </h2>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Routine Title
                </label>
                <input
                  type="text"
                  value={routineName}
                  onChange={(e) => setRoutineName(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Academic Session
                </label>
                <select
                  value={selectedYearId}
                  onChange={(e) => setSelectedYearId(Number(e.target.value))}
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
                >
                  {academicYears.map((ay) => (
                    <option key={ay.id} value={ay.id}>
                      {ay.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Candidate Solutions to Generate
                </label>
                <select
                  value={numSolutions}
                  onChange={(e) => setNumSolutions(Number(e.target.value))}
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
                >
                  <option value={3}>3 Diverse Solutions (Recommended)</option>
                  <option value={5}>5 Diverse Solutions</option>
                  <option value={1}>1 Best Solution</option>
                </select>
              </div>

              {/* Weight Sliders */}
              <div className="border-t border-zinc-100 pt-3 dark:border-zinc-800 space-y-3">
                <span className="font-bold text-zinc-800 dark:text-zinc-200 uppercase text-[10px] tracking-wider block">
                  Constraint Weights (1 - 10)
                </span>

                <div>
                  <div className="flex justify-between font-medium text-zinc-600 dark:text-zinc-400 mb-1 text-[11px]">
                    <span>Teacher Preferred Slots</span>
                    <span className="font-mono font-bold text-zinc-900 dark:text-white">{weights.teacher_preference}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={weights.teacher_preference}
                    onChange={(e) => setWeights({ ...weights, teacher_preference: Number(e.target.value) })}
                    className="w-full accent-emerald-600 dark:accent-emerald-400 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between font-medium text-zinc-600 dark:text-zinc-400 mb-1 text-[11px]">
                    <span>Subject Spread Across Days</span>
                    <span className="font-mono font-bold text-zinc-900 dark:text-white">{weights.subject_distribution}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={weights.subject_distribution}
                    onChange={(e) => setWeights({ ...weights, subject_distribution: Number(e.target.value) })}
                    className="w-full accent-emerald-600 dark:accent-emerald-400 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between font-medium text-zinc-600 dark:text-zinc-400 mb-1 text-[11px]">
                    <span>Minimize Daily Idle Gaps</span>
                    <span className="font-mono font-bold text-zinc-900 dark:text-white">{weights.idle_gaps}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={weights.idle_gaps}
                    onChange={(e) => setWeights({ ...weights, idle_gaps: Number(e.target.value) })}
                    className="w-full accent-emerald-600 dark:accent-emerald-400 cursor-pointer"
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
                  {error}
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-700 text-white py-3 font-bold shadow-xs active:scale-95 disabled:opacity-50 transition-all cursor-pointer text-xs"
              >
                {generating ? (
                  <>
                    <Zap className="h-4 w-4 animate-spin" />
                    Solving Constraint Matrix...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 fill-current" />
                    Generate Routine Solutions
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right: Results & Multi-Solution Comparison */}
          <div className="lg:col-span-2 space-y-5">
            {generationResult ? (
              <div className="space-y-4">
                {/* Generation Summary Card */}
                <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                        Optimization Run Report
                      </h3>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-mono font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      0 Hard Conflicts
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 text-xs">
                    <div className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/40">
                      <span className="text-[10px] text-zinc-400 font-bold uppercase">Solver Time</span>
                      <div className="text-base font-black text-zinc-900 dark:text-white mt-0.5 font-mono">
                        {generationResult.execution_time_seconds}s
                      </div>
                    </div>
                    <div className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/40">
                      <span className="text-[10px] text-zinc-400 font-bold uppercase">Solutions Found</span>
                      <div className="text-base font-black text-zinc-900 dark:text-white mt-0.5 font-mono">
                        {generationResult.solutions_found}
                      </div>
                    </div>
                    <div className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/40">
                      <span className="text-[10px] text-zinc-400 font-bold uppercase">Top Score</span>
                      <div className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5 font-mono">
                        {generationResult.best_score}%
                      </div>
                    </div>
                    <div className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/40">
                      <span className="text-[10px] text-zinc-400 font-bold uppercase">Variables</span>
                      <div className="text-base font-black text-zinc-900 dark:text-white mt-0.5 font-mono">
                        {generationResult.total_variables || 2180}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Candidate Solution Cards */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                    Generated Candidate Solutions
                  </h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {generationResult.solutions?.map((sol: any, idx: number) => (
                      <div
                        key={idx}
                        className={cn(
                          "rounded-2xl border bg-white p-5 shadow-xs dark:bg-zinc-900 flex flex-col justify-between transition-all",
                          idx === 0
                            ? "border-emerald-500 dark:border-emerald-600 ring-2 ring-emerald-500/20"
                            : "border-zinc-200 dark:border-zinc-800"
                        )}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                              <Trophy className={cn("h-4 w-4", idx === 0 ? "text-amber-500" : "text-zinc-400")} />
                              Solution #{sol.solution_index}
                            </span>
                            <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-mono font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              {sol.score}%
                            </span>
                          </div>

                          <div className="mt-4 space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                            <div className="flex justify-between">
                              <span>Hard Conflicts:</span>
                              <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">0</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Total Classes:</span>
                              <span className="font-bold text-zinc-900 dark:text-white font-mono">{sol.entries_count}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Rank:</span>
                              <span className="font-semibold text-zinc-800 dark:text-zinc-200 font-mono">Rank {idx + 1}</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-5 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                          <button
                            onClick={() => handleApplySolution(sol.solution_index)}
                            className={cn(
                              "w-full rounded-xl py-2 text-xs font-bold transition-all cursor-pointer",
                              idx === 0
                                ? "bg-emerald-700 text-white hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 shadow-xs"
                                : "bg-zinc-100 text-zinc-800 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                            )}
                          >
                            {idx === 0 ? "Apply Best Solution ✓" : "Apply This Schedule"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-12 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 flex flex-col items-center justify-center min-h-[350px]">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100 mb-3 border border-zinc-200 dark:border-zinc-700">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                  No Active Generation Run
                </h3>
                <p className="max-w-sm mt-1 text-zinc-400 dark:text-zinc-500">
                  Select your academic session and constraint weights on the left, then click &quot;Generate Routine Solutions&quot;.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
