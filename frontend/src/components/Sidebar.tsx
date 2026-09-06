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
  { name: "Quick Simple Wizard", href: "/simple-builder", icon: Sparkles, badge: "Easy" },
  { name: "Master Routine & Editor", href: "/timetables", icon: CalendarDays },
  { name: "Advanced Generator", href: "/generator", icon: Sliders, badge: "CP-SAT" },
  { name: "Teachers & Availability", href: "/teachers", icon: Users },
  { name: "Rooms & Labs", href: "/rooms", icon: DoorOpen },
  { name: "Subjects & Courses", href: "/subjects", icon: BookOpen },
  { name: "Academic Structure", href: "/academic", icon: FolderTree },
  { name: "Working Days & Periods", href: "/periods", icon: Clock },
  { name: "Scheduling Rules", href: "/rules", icon: CheckCircle },
  { name: "Audit & Version History", href: "/audit", icon: History },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 shrink-0 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 min-h-[calc(100vh-4rem)] flex flex-col justify-between py-4 px-3">
      <div className="space-y-0.5">
        <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Navigation
        </div>
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold transition-colors",
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              )}
            >
              <div className="flex items-center gap-2.5">
                <item.icon
                  className={cn(
                    "h-4 w-4 shrink-0",
                    isActive ? "text-white" : "text-slate-400 group-hover:text-slate-600 dark:text-slate-400"
                  )}
                />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span
                  className={cn(
                    "rounded px-1.5 py-0.5 text-[9px] font-bold",
                    isActive
                      ? "bg-blue-700 text-white"
                      : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
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
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/40">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
            MySQL (XAMPP) Active
          </span>
        </div>
        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
          Auto-saves routines directly to MySQL database.
        </p>
      </div>
    </aside>
  );
}
