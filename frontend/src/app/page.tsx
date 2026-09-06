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
      link: "/teachers"
    },
    {
      title: "Active Sections",
      value: stats?.sections_count || 6,
      icon: Layers,
      link: "/academic"
    },
    {
      title: "Subjects / Courses",
      value: stats?.subjects_count || 25,
      icon: BookOpen,
      link: "/subjects"
    },
    {
      title: "Rooms & Labs",
      value: stats?.rooms_count || 8,
      icon: DoorOpen,
      link: "/rooms"
    },
    {
      title: "Active Periods",
      value: stats?.periods_count || 34,
      icon: Clock,
      link: "/periods"
    },
    {
      title: "Optimization Score",
      value: stats?.latest_routine_score ? `${stats.latest_routine_score}%` : "100%",
      icon: Sparkles,
      badge: "0 Conflicts",
      link: "/timetables"
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
                  College Routine Management System
                </h1>
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300">
                  Ready &amp; Active
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-2xl leading-relaxed">
                Schedule multiple semesters clash-free, watch routines live with auto-tracking, and export campus-ready printable sheets.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/live-watch"
                className="flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 transition-colors"
              >
                <Eye className="h-3.5 w-3.5 text-emerald-600" />
                Live Watch
              </Link>
              <Link
                href="/timetables"
                className="rounded-lg bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-colors"
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
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
              activeTab === "simple"
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            BCA Routine Builder
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
              activeTab === "analytics"
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs"
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
                  className="rounded-xl border border-zinc-200 bg-white p-3.5 shadow-xs hover:border-zinc-400 transition-all dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                      <kpi.icon className="h-4 w-4" />
                    </div>
                    <ArrowUpRight className="h-3.5 w-3.5 text-zinc-400" />
                  </div>
                  <div className="mt-2.5">
                    <div className="text-xl font-bold text-zinc-900 dark:text-white">
                      {kpi.value}
                    </div>
                    <div className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mt-0.5">
                      {kpi.title}
                    </div>
                    {kpi.badge && (
                      <span className="mt-1 inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
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
                    <DoorOpen className="h-4 w-4 text-zinc-600" />
                    <h3 className="text-xs font-bold text-zinc-900 dark:text-white">
                      Room &amp; Lab Utilization Rate (%)
                    </h3>
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
                      <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                      <XAxis dataKey="room" tick={{ fontSize: 10 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="rate" fill="#18181b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Weekly Period Distribution */}
              <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    <CalendarCheck className="h-4 w-4 text-zinc-600" />
                    <h3 className="text-xs font-bold text-zinc-900 dark:text-white">
                      Daily Class Density (Sun &ndash; Fri)
                    </h3>
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
                      <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                      <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Area type="monotone" dataKey="classes" stroke="#27272a" fill="#e4e4e7" />
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
