"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Calendar, Bell, Sparkles, User, CheckCircle2, 
  AlertTriangle, RefreshCw, Layers, Shield, Radio, Clock
} from "lucide-react";
import { api } from "@/lib/api";

interface NavbarProps {
  onOpenGenerator?: () => void;
}

export function Navbar({ onOpenGenerator }: NavbarProps) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [currentUser, setCurrentUser] = useState({
    name: "Dr. Ram Sharma",
    role: "Campus Admin",
    email: "admin@campus.edu"
  });

  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = currentTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  const dateString = currentTime.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await api.getNotifications();
      setNotifications(data || []);
    } catch (e) {
      setNotifications([
        { id: 1, title: "Routine Generated", message: "Master Routine 2026 generated with 0 conflicts.", is_read: false },
        { id: 2, title: "Class Move Allowed", message: "Computer Graphics slot verified and placed.", is_read: true }
      ]);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markNotificationsRead();
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    } catch (e) {
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-zinc-200 bg-white/95 px-6 backdrop-blur transition-all font-sans">
      {/* Brand / Logo */}
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2.5 font-bold text-zinc-900">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-xs">
            <Calendar className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight leading-none text-zinc-900">
              Campus Routine System
            </span>
            <span className="text-[11px] font-medium text-zinc-500">
              Timetable & Schedule Management
            </span>
          </div>
        </Link>
        <div className="hidden sm:flex items-center gap-1.5 ml-3 px-2.5 py-1 rounded-md bg-zinc-100 text-zinc-800 text-xs font-semibold border border-zinc-200">
          <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
          <span>MySQL (XAMPP)</span>
        </div>
      </div>

      {/* Center Live Date & Time Display on Every Page */}
      <div className="flex items-center gap-2.5 rounded-full border border-zinc-200 bg-zinc-50/90 px-4 py-1.5 text-xs shadow-xs dark:border-zinc-800 dark:bg-zinc-900/90">
        <div className="flex items-center gap-1.5 text-zinc-900 font-mono font-bold">
          <Clock className="h-3.5 w-3.5 text-emerald-600 animate-pulse" />
          <span suppressHydrationWarning>{mounted ? timeString : "--:--:--"}</span>
        </div>
        <span className="text-zinc-300 font-light">|</span>
        <div className="flex items-center gap-1.5 text-zinc-600 font-medium font-sans">
          <Calendar className="h-3.5 w-3.5 text-zinc-500" />
          <span suppressHydrationWarning>{mounted ? dateString : "Loading date..."}</span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5">
        <Link
          href="/live-watch"
          className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-colors shadow-xs"
        >
          <Radio className="h-3.5 w-3.5 animate-pulse text-rose-600" />
          <span>Live Watch</span>
        </Link>

        {onOpenGenerator && (
          <button
            onClick={onOpenGenerator}
            className="flex items-center gap-2 rounded-xl bg-zinc-900 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-zinc-800 active:scale-95 transition-all cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Generate Routine</span>
          </button>
        )}

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white ring-2 ring-white animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-zinc-200 bg-white p-3 shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
                <span className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] font-semibold text-zinc-600 hover:text-zinc-900 cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="mt-2 max-h-64 space-y-2 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-6 text-center text-xs text-zinc-400">No notifications yet</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`rounded-xl p-2.5 text-xs transition-colors ${
                        n.is_read
                          ? "bg-zinc-50 text-zinc-600"
                          : "bg-zinc-100 text-zinc-900 font-medium border-l-2 border-zinc-900"
                      }`}
                    >
                      <div className="font-semibold">{n.title}</div>
                      <div className="text-[11px] opacity-80 mt-0.5">{n.message}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Role Card */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-zinc-200">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-white font-bold text-xs">
            RS
          </div>
          <div className="hidden lg:flex flex-col">
            <span className="text-xs font-bold text-zinc-900 leading-tight">
              {currentUser.name}
            </span>
            <span className="text-[10px] font-medium text-emerald-600">
              {currentUser.role}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
