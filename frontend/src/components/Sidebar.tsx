"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  Sparkles,
  Users,
  DoorOpen,
  BookOpen,
  GraduationCap,
  Clock,
  Sliders,
  History,
  CheckCircle,
  Radio,
  FolderTree
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Executive Dashboard", href: "/", icon: LayoutDashboard, color: "text-indigo-600 dark:text-indigo-400" },
  { name: "Live Routine Watch", href: "/live-watch", icon: Radio, badge: "Live", color: "text-rose-600 dark:text-rose-400", badgeColor: "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-800" },
  { name: "Master Routine & Editor", href: "/timetables", icon: CalendarDays, color: "text-blue-600 dark:text-blue-400" },
  { name: "Quick Simple Wizard", href: "/simple-builder", icon: Sparkles, badge: "Easy", color: "text-purple-600 dark:text-purple-400", badgeColor: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/80 dark:text-purple-300 dark:border-purple-800" },
  { name: "Advanced Generator", href: "/generator", icon: Sliders, badge: "CP-SAT", color: "text-amber-600 dark:text-amber-400", badgeColor: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800" },
  { name: "Teachers & Availability", href: "/teachers", icon: Users, color: "text-teal-600 dark:text-teal-400" },
  { name: "Rooms & Labs", href: "/rooms", icon: DoorOpen, color: "text-emerald-600 dark:text-emerald-400" },
  { name: "Subjects & Courses", href: "/subjects", icon: BookOpen, color: "text-rose-600 dark:text-rose-400" },
  { name: "Academic Structure", href: "/academic", icon: FolderTree, color: "text-cyan-600 dark:text-cyan-400" },
  { name: "Working Days & Periods", href: "/periods", icon: Clock, color: "text-orange-600 dark:text-orange-400" },
  { name: "Scheduling Rules", href: "/rules", icon: CheckCircle, color: "text-lime-600 dark:text-lime-400" },
  { name: "Audit & Version History", href: "/audit", icon: History, color: "text-slate-600 dark:text-slate-400" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 shrink-0 border-r border-zinc-200/80 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950 min-h-[calc(100vh-4rem)] flex flex-col justify-between py-4 px-3 font-sans transition-colors">
      <div className="space-y-1">
        <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          Navigation
        </div>
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-all",
                isActive
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm font-bold scale-[1.01]"
                  : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-white"
              )}
            >
              <div className="flex items-center gap-2.5">
                <item.icon
                  className={cn(
                    "h-4 w-4 shrink-0 transition-colors",
                    isActive ? "text-white" : item.color
                  )}
                />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span
                  className={cn(
                    "rounded-md px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider border",
                    isActive
                      ? "bg-white/20 text-white border-white/30"
                      : item.badgeColor || "bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800"
                  )}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Database Status Card */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/60 p-3 space-y-1">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
            MySQL (XAMPP) Connected
          </span>
        </div>
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
          Auto-saves clash-free routines directly to database.
        </p>
      </div>
    </aside>
  );
}
