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
  HelpCircle,
  FolderTree
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Executive Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Master Routine & Editor", href: "/timetables", icon: CalendarDays },
  { name: "Routine Generator", href: "/generator", icon: Sparkles, badge: "CP-SAT" },
  { name: "Teachers & Availability", href: "/teachers", icon: Users },
  { name: "Rooms & Labs", href: "/rooms", icon: DoorOpen },
  { name: "Subjects & Courses", href: "/subjects", icon: BookOpen },
  { name: "Academic Structure", href: "/academic", icon: FolderTree },
  { name: "Working Days & Periods", href: "/periods", icon: Clock },
  { name: "Scheduling Rules", href: "/rules", icon: Sliders },
  { name: "Audit & Version History", href: "/audit", icon: History },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/70 min-h-[calc(100vh-4rem)] flex flex-col justify-between py-4 px-3">
      <div className="space-y-1">
        <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Main Navigation
        </div>
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center justify-between rounded-lg px-3 py-2.5 text-xs font-semibold transition-all",
                isActive
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-500/30 dark:bg-blue-600 dark:text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              )}
            >
              <div className="flex items-center gap-2.5">
                <item.icon
                  className={cn(
                    "h-4 w-4 shrink-0 transition-colors",
                    isActive ? "text-white" : "text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300"
                  )}
                />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                    isActive
                      ? "bg-blue-800 text-blue-100"
                      : "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/40"
                  )}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Campus System Status Card */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/50">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20 animate-pulse" />
          <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
            CP-SAT Engine Ready
          </span>
        </div>
        <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400 leading-normal">
          Dynamic multi-day schedule optimization with zero clash guarantee.
        </p>
      </div>
    </aside>
  );
}
