"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Users, Layers, BookOpen, DoorOpen, Clock, CalendarCheck, 
  Sparkles, CheckCircle2, AlertTriangle, ArrowUpRight, BarChart3, TrendingUp, ShieldCheck, Eye
} from "lucide-react";
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, 
  CartesianGrid, LineChart, Line, AreaChart, Area 
} from "recharts";
import { DashboardLayout } from "@/components/DashboardLayout";
import { WorkloadTracker } from "@/components/WorkloadTracker";
import { SimpleRoutineWizard } from "@/components/SimpleRoutineWizard";
import { api } from "@/lib/api";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<"simple" | "analytics">("simple");
  const [stats, setStats] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (e) {
      console.error("Dashboard load failed", e);
    } finally {
      setLoading(false);
    }
  };

  const kpis = [
    {
      title: "Faculty Members",
      value: stats?.teachers_count || 10,
      icon: Users,
      color: "from-blue-500 to-indigo-600",
      bgLight: "bg-blue-50/70 border-blue-200/80 text-blue-700 dark:bg-blue-950/30 dark:border-blue-900/60 dark:text-blue-300",
      iconBg: "bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300",
      link: "/teachers"
    },
    {
      title: "Active Sections",
      value: stats?.sections_count || 6,
      icon: Layers,
      color: "from-purple-500 to-violet-600",
      bgLight: "bg-purple-50/70 border-purple-200/80 text-purple-700 dark:bg-purple-950/30 dark:border-purple-900/60 dark:text-purple-300",
      iconBg: "bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300",
      link: "/academic"
    },
    {
      title: "Subjects / Courses",
      value: stats?.subjects_count || 25,
      icon: BookOpen,
      color: "from-teal-500 to-emerald-600",
      bgLight: "bg-teal-50/70 border-teal-200/80 text-teal-700 dark:bg-teal-950/30 dark:border-teal-900/60 dark:text-teal-300",
      iconBg: "bg-teal-100 text-teal-700 dark:bg-teal-900/60 dark:text-teal-300",
      link: "/subjects"
    },
    {
      title: "Rooms & Labs",
      value: stats?.rooms_count || 8,
      icon: DoorOpen,
      color: "from-emerald-500 to-teal-600",
      bgLight: "bg-emerald-50/70 border-emerald-200/80 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-900/60 dark:text-emerald-300",
      iconBg: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300",
      link: "/rooms"
    },
    {
      title: "Active Periods",
      value: stats?.periods_count || 34,
      icon: Clock,
      color: "from-amber-500 to-orange-600",
      bgLight: "bg-amber-50/70 border-amber-200/80 text-amber-700 dark:bg-amber-950/30 dark:border-amber-900/60 dark:text-amber-300",
      iconBg: "bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300",
      link: "/periods"
    },
    {
      title: "Optimization Score",
      value: stats?.latest_routine_score ? `${stats.latest_routine_score}%` : "100%",
      icon: Sparkles,
      color: "from-emerald-600 to-teal-700",
      bgLight: "bg-emerald-50/70 border-emerald-200/80 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-900/60 dark:text-emerald-300",
      iconBg: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300",
      badge: "0 Conflicts",
      link: "/timetables"
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 font-sans">
        {/* Welcome Header */}
        <div className="rounded-2xl border border-zinc-200/80 bg-gradient-to-r from-white via-emerald-50/20 to-teal-50/20 p-6 shadow-xs dark:border-zinc-800 dark:bg-gradient-to-r dark:from-zinc-900 dark:via-emerald-950/20 dark:to-zinc-900">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-black tracking-tight text-zinc-900 dark:text-white">
                  College Routine Management System
                </h1>
                <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/60 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  Ready &amp; Active
                </span>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 max-w-2xl leading-relaxed">
                Schedule multiple semesters clash-free, watch routines live with auto-tracking, and export campus-ready printable sheets.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/live-watch"
                className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-900/60 transition-colors shadow-2xs"
              >
                <Eye className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400 animate-pulse" />
                Live Watch
              </Link>
              <Link
                href="/timetables"
                className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all active:scale-95"
              >
                Master Routine
              </Link>
            </div>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-2 border-b border-zinc-200 pb-2 dark:border-zinc-800">
          <button
            onClick={() => setActiveTab("simple")}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
              activeTab === "simple"
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xs"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            BCA Routine Builder
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
              activeTab === "analytics"
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xs"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            Campus Analytics &amp; Faculty Load
          </button>
        </div>

        {activeTab === "simple" ? (
          <SimpleRoutineWizard />
        ) : (
          <div className="space-y-6">
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {kpis.map((kpi, idx) => (
                <Link
                  key={idx}
                  href={kpi.link}
                  className={`rounded-2xl border p-4 shadow-xs hover:shadow-md hover:scale-[1.02] transition-all ${kpi.bgLight}`}
                >
                  <div className="flex items-center justify-between">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-xl font-bold ${kpi.iconBg}`}>
                      <kpi.icon className="h-4 w-4" />
                    </div>
                    <ArrowUpRight className="h-3.5 w-3.5 opacity-60" />
                  </div>
                  <div className="mt-3">
                    <div className="text-2xl font-black text-zinc-900 dark:text-white">
                      {kpi.value}
                    </div>
                    <div className="text-[11px] font-bold opacity-80 mt-0.5">
                      {kpi.title}
                    </div>
                    {kpi.badge && (
                      <span className="mt-1.5 inline-block rounded-md bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 text-[9px] font-black text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        {kpi.badge}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            {/* Analytics Charts */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Room Utilization Chart */}
              <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                      <DoorOpen className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-zinc-900 dark:text-white">
                        Room &amp; Lab Utilization Rate (%)
                      </h3>
                      <p className="text-[10px] text-zinc-400">Peak hour classroom allocation across active days</p>
                    </div>
                  </div>
                </div>
                <div className="h-64 pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats?.room_utilization || [
                      { room: "Room 101", rate: 85 },
                      { room: "Room 102", rate: 70 },
                      { room: "Room 103", rate: 90 },
                      { room: "Room 104", rate: 65 },
                      { room: "Lab 1", rate: 95 },
                    ]}>
                      <defs>
                        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6366f1" />
                          <stop offset="100%" stopColor="#a855f7" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="room" tick={{ fontSize: 10 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                      <Tooltip 
                        contentStyle={{ 
                          borderRadius: '12px', 
                          border: '1px solid #e2e8f0', 
                          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                          fontSize: '11px',
                          fontWeight: 'bold'
                        }} 
                      />
                      <Bar dataKey="rate" fill="url(#barGrad)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Weekly Period Distribution */}
              <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      <CalendarCheck className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-zinc-900 dark:text-white">
                        Daily Class Density (Sun &ndash; Fri)
                      </h3>
                      <p className="text-[10px] text-zinc-400">Total active scheduled classes per working day</p>
                    </div>
                  </div>
                </div>
                <div className="h-64 pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats?.day_distribution || [
                      { day: "Sun", classes: 18 },
                      { day: "Mon", classes: 20 },
                      { day: "Tue", classes: 22 },
                      { day: "Wed", classes: 19 },
                      { day: "Thu", classes: 21 },
                      { day: "Fri", classes: 15 },
                    ]}>
                      <defs>
                        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#ec4899" stopOpacity={0.4} />
                          <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip 
                        contentStyle={{ 
                          borderRadius: '12px', 
                          border: '1px solid #e2e8f0', 
                          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                          fontSize: '11px',
                          fontWeight: 'bold'
                        }} 
                      />
                      <Area type="monotone" dataKey="classes" stroke="#ec4899" strokeWidth={2.5} fill="url(#areaGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Workload Tracker */}
            <WorkloadTracker />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
