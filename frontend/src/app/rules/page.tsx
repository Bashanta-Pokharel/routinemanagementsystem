"use client";

import React, { useState, useEffect } from "react";
import { Sliders, Save, CheckCircle2 } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function RulesPage() {
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    setLoading(true);
    try {
      const data = await api.getRules();
      setRules(data || [
        { rule_name: "teacher_preference", description: "Reward placing classes in teacher preferred slots", weight: 6, is_enabled: true },
        { rule_name: "consecutive_classes", description: "Penalize > 3-4 consecutive class hours without break", weight: 4, is_enabled: true },
        { rule_name: "idle_gaps", description: "Penalize empty gaps/holes between daily periods", weight: 4, is_enabled: true },
        { rule_name: "subject_distribution", description: "Spread subject classes evenly across working days", weight: 7, is_enabled: true },
        { rule_name: "room_stability", description: "Minimize unnecessary classroom hopping for sections", weight: 3, is_enabled: true }
      ]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleWeightChange = (index: number, newWeight: number) => {
    const updated = [...rules];
    updated[index].weight = newWeight;
    setRules(updated);
  };

  const handleToggle = (index: number) => {
    const updated = [...rules];
    updated[index].is_enabled = !updated[index].is_enabled;
    setRules(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateRules(rules);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      alert("Failed to save rules: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 font-sans">
        <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
              <Sliders className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              Optimization Rule Weights
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Adjust objective function penalty multipliers used by the solver to balance campus priorities.
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 px-5 py-2.5 text-xs font-bold text-white shadow-xs active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : saved ? "Saved ✓" : "Save Rule Weights"}
          </button>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 space-y-6">
          <div className="space-y-4">
            {rules.map((rule, idx) => {
              const ruleColors = [
                { accent: "accent-emerald-600 dark:accent-emerald-400", badge: "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800" },
                { accent: "accent-indigo-600 dark:accent-indigo-400", badge: "bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800" },
                { accent: "accent-amber-600 dark:accent-amber-400", badge: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800" },
                { accent: "accent-teal-600 dark:accent-teal-400", badge: "bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800" },
                { accent: "accent-purple-600 dark:accent-purple-400", badge: "bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800" },
              ];
              const curColor = ruleColors[idx % ruleColors.length];

              return (
                <div
                  key={rule.rule_name}
                  className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 dark:border-zinc-800 dark:bg-zinc-800/40 space-y-3 transition-all hover:border-zinc-300 dark:hover:border-zinc-700"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-zinc-900 dark:text-white capitalize">
                        {rule.rule_name.replace(/_/g, " ")}
                      </h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{rule.description}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={cn("text-xs font-mono font-bold px-2.5 py-1 rounded-full border shadow-2xs", curColor.badge)}>
                        Weight: {rule.weight} / 10
                      </span>
                      <input
                        type="checkbox"
                        checked={rule.is_enabled}
                        onChange={() => handleToggle(idx)}
                        className="h-4 w-4 accent-emerald-600 dark:accent-emerald-400 rounded cursor-pointer"
                      />
                    </div>
                  </div>

                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={rule.weight}
                    disabled={!rule.is_enabled}
                    onChange={(e) => handleWeightChange(idx, Number(e.target.value))}
                    className={cn("w-full cursor-pointer disabled:opacity-30", curColor.accent)}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
