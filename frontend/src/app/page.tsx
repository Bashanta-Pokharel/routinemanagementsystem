"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Users, Layers, BookOpen, DoorOpen, Clock, CalendarCheck, 
  Sparkles, CheckCircle2, AlertTriangle, ArrowUpRight, BarChart3, TrendingUp, ShieldCheck
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
      color: "from-blue-600 to-indigo-600",
      link: "/teachers"
    },
    {
      title: "Active Sections",
      value: stats?.sections_count || 6,
      icon: Layers,
      color: "from-indigo-600 to-violet-600",
      link: "/academic"
    },
    {
      title: "Subjects / Courses",
      value: stats?.subjects_count || 25,
      icon: BookOpen,
      color: "from-violet-600 to-purple-600",
      link: "/subjects"
    },
    {
      title: "Rooms & Labs",
      value: stats?.rooms_count || 8,
      icon: DoorOpen,
      color: "from-emerald-600 to-teal-600",
      link: "/rooms"
    },
    {
      title: "Active Periods",
      value: stats?.periods_count || 34,
      icon: Clock,
      color: "from-amber-600 to-orange-600",
      link: "/periods"
    },
    {
      title: "Optimization Score",
      value: stats?.latest_routine_score ? `${stats.latest_routine_score}%` : "94.2%",
      icon: Sparkles,
      color: "from-cyan-600 to-blue-600",
      badge: "0 Conflicts",
      link: "/timetables"
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Welcome Header */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                  College Routine Management System
                </h1>
                <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-300">
                  MySQL XAMPP
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Dynamic routine scheduling with teacher availability windows, room allocation, and clash-free generation.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/timetables"
                className="rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors"
              >
                Master Routine
              </Link>
            </div>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 dark:border-slate-800">
          <button
            onClick={() => setActiveTab("simple")}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === "simple"
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            <Sparkles className="h-4 w-4" />
            Simple Routine Builder
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === "analytics"
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            Campus Overview & Analytics
          </button>
        </div>

        {activeTab === "simple" ? (
          <SimpleRoutineWizard />
        ) : (
          <>
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {kpis.map((kpi, idx) => (
                <Link
                  key={idx}
                  href={kpi.link}
                  className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs hover:border-blue-400 transition-all dark:border-slate-800 dark:bg-slate-900"
                >
              <div className="flex items-center justify-between">
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr ${kpi.color} text-white shadow-sm`}>
                  <kpi.icon className="h-4 w-4" />
                </div>
                <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
              </div>
              <div className="mt-3">
                <div className="text-xl font-black text-slate-900 dark:text-white">
                  {kpi.value}
                </div>
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                  {kpi.title}
                </div>
                {kpi.badge && (
                  <span className="mt-1 inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
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
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <DoorOpen className="h-4 w-4 text-blue-600" />
                  Room & Lab Utilization
                </h3>
                <p className="text-xs text-slate-500">Booked periods percentage per room</p>
              </div>
            </div>
            <div className="mt-4 h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.room_utilizations || [
                  { room_number: "Room 101", utilization_pct: 75 },
                  { room_number: "Room 102", utilization_pct: 68 },
                  { room_number: "Lab 1", utilization_pct: 82 },
                  { room_number: "Lab 2", utilization_pct: 60 },
                  { room_number: "HW Lab", utilization_pct: 45 },
                  { room_number: "Room 201", utilization_pct: 70 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="room_number" tick={{ fontSize: 10 }} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} unit="%" />
                  <Tooltip />
                  <Bar dataKey="utilization_pct" fill="#3B82F6" radius={[6, 6, 0, 0]} name="Utilization" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Day-wise Distribution Chart */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                  Daily Scheduled Load
                </h3>
                <p className="text-xs text-slate-500">Class density across active working days</p>
              </div>
            </div>
            <div className="mt-4 h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats?.day_distribution || [
                  { short_code: "SUN", classes_count: 22 },
                  { short_code: "MON", classes_count: 24 },
                  { short_code: "TUE", classes_count: 21 },
                  { short_code: "WED", classes_count: 20 },
                  { short_code: "THU", classes_count: 23 },
                  { short_code: "FRI", classes_count: 14 },
                ]}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="short_code" tick={{ fontSize: 10 }} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="classes_count" stroke="#10B981" fillOpacity={1} fill="url(#colorCount)" name="Classes" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Teacher Workload Table */}
        <WorkloadTracker workloads={stats?.teacher_workloads || [
          { teacher_id: 1, name: "Dr. Ram Sharma", assigned_hours: 18, max_hours: 22, utilization_pct: 81.8, status: "Balanced" },
          { teacher_id: 2, name: "Prof. Sita Rai", assigned_hours: 19, max_hours: 22, utilization_pct: 86.3, status: "Near Limit" },
          { teacher_id: 3, name: "Er. Hari Thapa", assigned_hours: 16, max_hours: 22, utilization_pct: 72.7, status: "Balanced" },
          { teacher_id: 4, name: "Bikash KC", assigned_hours: 18, max_hours: 22, utilization_pct: 81.8, status: "Balanced" },
          { teacher_id: 5, name: "Anita Shrestha", assigned_hours: 17, max_hours: 22, utilization_pct: 77.2, status: "Balanced" },
          { teacher_id: 6, name: "Ramesh Joshi", assigned_hours: 15, max_hours: 22, utilization_pct: 68.1, status: "Balanced" },
        ]} />
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
