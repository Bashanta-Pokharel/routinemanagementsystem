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
  { name: "Executive Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Live Routine Watch", href: "/live-watch", icon: Radio, badge: "Live" },
  { name: "Master Routine & Editor", href: "/timetables", icon: CalendarDays },
  { name: "Quick Simple Wizard", href: "/simple-builder", icon: Sparkles, badge: "Easy" },
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
    <aside className="w-60 shrink-0 border-r border-zinc-200 bg-white min-h-[calc(100vh-4rem)] flex flex-col justify-between py-4 px-3 font-sans">
      <div className="space-y-1">
        <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-zinc-400">
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
                  ? "bg-zinc-900 text-white shadow-xs"
                  : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
              )}
            >
              <div className="flex items-center gap-2.5">
                <item.icon
                  className={cn(
                    "h-4 w-4 shrink-0 transition-colors",
                    isActive
                      ? "text-white"
                      : item.badge === "Live"
                      ? "text-rose-500 animate-pulse"
                      : "text-zinc-400 group-hover:text-zinc-700"
                  )}
                />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span
                  className={cn(
                    "rounded px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider",
                    item.badge === "Live"
                      ? "bg-rose-600 text-white animate-pulse"
                      : isActive
                      ? "bg-zinc-800 text-zinc-200"
                      : "bg-zinc-100 text-zinc-600 border border-zinc-200"
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
      <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-3">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-xs font-bold text-zinc-800">
            MySQL (XAMPP) Active
          </span>
        </div>
        <p className="mt-1 text-[11px] text-zinc-500">
          Auto-saves routines directly to MySQL database.
        </p>
      </div>
    </aside>
  );
}
