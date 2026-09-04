"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Calendar, Bell, Sparkles, User, CheckCircle2, 
  AlertTriangle, RefreshCw, Layers, Shield
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
    role: "Super Admin",
    email: "admin@campus.edu"
  });

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await api.getNotifications();
      setNotifications(data || []);
    } catch (e) {
      // Mock fallback notifications if offline
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
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-6 backdrop-blur transition-all dark:border-slate-800 dark:bg-slate-900/95">
      {/* Brand / Logo */}
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2.5 font-bold text-slate-900 dark:text-white">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-500 text-white shadow-md shadow-blue-500/20">
            <Calendar className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-black tracking-tight leading-none bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-300">
              UniSchedule
            </span>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Campus Routine Optimization
            </span>
          </div>
        </Link>
        <div className="hidden md:flex items-center ml-4 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/40">
          Apex College Campus
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {onOpenGenerator && (
          <button
            onClick={onOpenGenerator}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm shadow-blue-500/25 hover:from-blue-700 hover:to-indigo-700 active:scale-95 transition-all cursor-pointer"
          >
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">Generate Routine</span>
          </button>
        )}

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900 animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-800 dark:bg-slate-900 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="mt-2 max-h-64 space-y-2 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400">No notifications yet</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`rounded-lg p-2.5 text-xs transition-colors ${
                        n.is_read
                          ? "bg-slate-50 text-slate-600 dark:bg-slate-800/40 dark:text-slate-400"
                          : "bg-blue-50/70 text-slate-900 font-medium dark:bg-blue-950/40 dark:text-slate-200 border-l-2 border-blue-500"
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
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200 dark:border-slate-800">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700 font-bold text-xs dark:bg-slate-800 dark:text-slate-200">
            RS
          </div>
          <div className="hidden lg:flex flex-col">
            <span className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">
              {currentUser.name}
            </span>
            <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
              {currentUser.role}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
