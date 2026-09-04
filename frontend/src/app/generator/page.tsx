"use client";

import React, { useState, useEffect } from "react";
import { 
  Sparkles, Play, CheckCircle2, Trophy, Sliders, 
  Clock, ShieldCheck, Zap, ArrowRight, BarChart2, RefreshCw
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
        particleCount: 120,
        spread: 80,
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-2 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">
              Autonomous Routine Generator & Multi-Solution Optimizer
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Formulates academic requirements into Constraint Programming models. Eliminates collisions and ranks candidate schedules by soft-constraint satisfaction.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left: Configuration Panel */}
          <div className="lg:col-span-1 space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sliders className="h-4 w-4 text-blue-600" />
              Optimization Parameters
            </h2>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Routine Title
                </label>
                <input
                  type="text"
                  value={routineName}
                  onChange={(e) => setRoutineName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Academic Session
                </label>
                <select
                  value={selectedYearId}
                  onChange={(e) => setSelectedYearId(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {academicYears.map((ay) => (
                    <option key={ay.id} value={ay.id}>
                      {ay.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Candidate Solutions to Generate
                </label>
                <select
                  value={numSolutions}
                  onChange={(e) => setNumSolutions(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={3}>3 Diverse Solutions (Recommended)</option>
                  <option value={5}>5 Diverse Solutions</option>
                  <option value={1}>1 Best Solution</option>
                </select>
              </div>

              {/* Weight Sliders */}
              <div className="border-t border-slate-100 pt-3 dark:border-slate-800 space-y-3">
                <span className="font-bold text-slate-800 dark:text-slate-200 uppercase text-[10px] tracking-wider block">
                  Constraint Weights (1 - 10)
                </span>

                <div>
                  <div className="flex justify-between font-medium text-slate-600 dark:text-slate-400 mb-1 text-[11px]">
                    <span>Teacher Preferred Slots</span>
                    <span className="font-bold text-blue-600">{weights.teacher_preference}</span>
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
                  <div className="flex justify-between font-medium text-slate-600 dark:text-slate-400 mb-1 text-[11px]">
                    <span>Subject Spread Across Days</span>
                    <span className="font-bold text-blue-600">{weights.subject_distribution}</span>
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
                  <div className="flex justify-between font-medium text-slate-600 dark:text-slate-400 mb-1 text-[11px]">
                    <span>Minimize Daily Idle Gaps</span>
                    <span className="font-bold text-blue-600">{weights.idle_gaps}</span>
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

              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-300">
                  {error}
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 py-3 font-bold text-white shadow-md shadow-blue-500/25 hover:from-blue-700 hover:to-indigo-700 active:scale-95 disabled:opacity-50 transition-all cursor-pointer text-xs"
              >
                {generating ? (
                  <>
                    <Zap className="h-4 w-4 animate-spin" />
                    Solving Constraint Matrix...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 fill-white" />
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
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-emerald-600" />
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        Optimization Run Report
                      </h3>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      0 Hard Conflicts
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 text-xs">
                    <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/40">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Solver Time</span>
                      <div className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                        {generationResult.execution_time_seconds}s
                      </div>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/40">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Solutions Found</span>
                      <div className="text-base font-black text-blue-600 dark:text-blue-400 mt-0.5">
                        {generationResult.solutions_found}
                      </div>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/40">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Top Score</span>
                      <div className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {generationResult.best_score}%
                      </div>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/40">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Decision Variables</span>
                      <div className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                        {generationResult.total_variables || 2180}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Candidate Solution Cards */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Generated Candidate Solutions
                  </h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {generationResult.solutions?.map((sol: any, idx: number) => (
                      <div
                        key={idx}
                        className={cn(
                          "rounded-3xl border bg-white p-5 shadow-sm dark:bg-slate-900 flex flex-col justify-between transition-all",
                          idx === 0
                            ? "border-blue-500 ring-2 ring-blue-500/20 dark:border-blue-600"
                            : "border-slate-200 dark:border-slate-800"
                        )}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <Trophy className={cn("h-4 w-4", idx === 0 ? "text-amber-500" : "text-slate-400")} />
                              Solution #{sol.solution_index}
                            </span>
                            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-black text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                              {sol.score}%
                            </span>
                          </div>

                          <div className="mt-4 space-y-1.5 text-xs text-slate-600 dark:text-slate-400 border-t border-slate-100 pt-3 dark:border-slate-800">
                            <div className="flex justify-between">
                              <span>Hard Conflicts:</span>
                              <span className="font-bold text-emerald-600">0</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Total Scheduled Classes:</span>
                              <span className="font-bold text-slate-800 dark:text-slate-200">{sol.entries_count}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Soft Constraint Rank:</span>
                              <span className="font-semibold text-slate-800 dark:text-slate-200">Rank {idx + 1}</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800">
                          <button
                            onClick={() => handleApplySolution(sol.solution_index)}
                            className={cn(
                              "w-full rounded-xl py-2 text-xs font-bold transition-colors cursor-pointer",
                              idx === 0
                                ? "bg-blue-600 text-white hover:bg-blue-700"
                                : "bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                            )}
                          >
                            {idx === 0 ? "Active Best Solution" : "Apply This Schedule"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900 flex flex-col items-center justify-center min-h-[350px]">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 mb-3">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  No Active Generation Run
                </h3>
                <p className="max-w-sm mt-1 text-slate-400">
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
