"use client";

import React, { useState, useEffect } from "react";
import { Sliders, Save, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { api } from "@/lib/api";

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
      <div className="space-y-6">
        <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Sliders className="h-5 w-5 text-blue-600" />
              Optimization Rule Weights
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Adjust objective function penalty multipliers used by the CP-SAT solver to balance university priorities.
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm shadow-blue-500/25 hover:bg-blue-700 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : saved ? "Saved ✓" : "Save Rule Weights"}
          </button>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-6">
          <div className="space-y-4">
            {rules.map((rule, idx) => (
              <div
                key={rule.rule_name}
                className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-800/40 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white capitalize">
                      {rule.rule_name.replace(/_/g, " ")}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">{rule.description}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-black text-blue-600 dark:text-blue-400">
                      Weight: {rule.weight} / 10
                    </span>
                    <input
                      type="checkbox"
                      checked={rule.is_enabled}
                      onChange={() => handleToggle(idx)}
                      className="h-4 w-4 accent-blue-600 rounded cursor-pointer"
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
                  className="w-full accent-blue-600 cursor-pointer disabled:opacity-30"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
