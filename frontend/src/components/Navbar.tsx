"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Calendar, Bell, Sparkles, Sun, Moon,
  Radio, Clock, Database, CheckCircle2, AlertCircle,
  User, Building2, MapPin, Mail, Save, X, Edit3
} from "lucide-react";
import { api } from "@/lib/api";
import { useTheme } from "@/context/ThemeContext";
import { useCampusInfo } from "@/lib/campusSettings";
import { cn } from "@/lib/utils";

interface NavbarProps {
  onOpenGenerator?: () => void;
}

export function Navbar({ onOpenGenerator }: NavbarProps) {
  const { theme, toggleTheme } = useTheme();
  const { campusInfo, updateCampusInfo } = useCampusInfo();

  // Notifications state
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);

  // Database / XAMPP Health Status
  const [dbStatus, setDbStatus] = useState<"online" | "offline" | "checking">("checking");

  // Profile / Campus Edit Modal
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    adminName: campusInfo.adminName || "Dr. Ram Sharma",
    adminRole: campusInfo.adminRole || "Campus Admin",
    adminEmail: campusInfo.adminEmail || "admin@campus.edu",
    campusName: campusInfo.campusName || "Ratna Rajyalaxmi Campus",
    campusAddress: campusInfo.campusAddress || "Pradarshanimarga, Kathmandu Nepal",
    accentTheme: campusInfo.accentTheme || "emerald",
  });
  const [saveSuccessToast, setSaveSuccessToast] = useState(false);

  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [mounted, setMounted] = useState(false);

  // Sync profile form when campusInfo changes
  useEffect(() => {
    setProfileForm({
      adminName: campusInfo.adminName || "Dr. Ram Sharma",
      adminRole: campusInfo.adminRole || "Campus Admin",
      adminEmail: campusInfo.adminEmail || "admin@campus.edu",
      campusName: campusInfo.campusName || "Ratna Rajyalaxmi Campus",
      campusAddress: campusInfo.campusAddress || "Pradarshanimarga, Kathmandu Nepal",
      accentTheme: campusInfo.accentTheme || "emerald",
    });
  }, [campusInfo]);

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Check Database / XAMPP health on mount and periodically
  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 12000);
    return () => clearInterval(interval);
  }, []);

  const checkHealth = async () => {
    try {
      const res = await api.checkHealth();
      if (res && res.status === "online") {
        setDbStatus("online");
      } else {
        setDbStatus("offline");
      }
    } catch (e) {
      setDbStatus("offline");
    }
  };

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
        { id: 2, title: "Class Move Allowed", message: "Slot verified and placed clash-free.", is_read: true }
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

  // Initials calculation
  const getInitials = (name: string) => {
    const parts = name.trim().split(" ").filter(p => !p.toLowerCase().startsWith("dr") && !p.toLowerCase().startsWith("prof"));
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase() || "AD";
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateCampusInfo({
      adminName: profileForm.adminName,
      adminRole: profileForm.adminRole,
      adminEmail: profileForm.adminEmail,
      campusName: profileForm.campusName,
      campusAddress: profileForm.campusAddress,
      accentTheme: profileForm.accentTheme as any,
    });
    setIsProfileModalOpen(false);
    setSaveSuccessToast(true);
    setTimeout(() => setSaveSuccessToast(false), 3500);
  };

  return (
    <>
      <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-zinc-200 bg-white/95 dark:border-zinc-800 dark:bg-zinc-950/95 px-6 backdrop-blur transition-colors font-sans">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-zinc-900 dark:text-white">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-sm">
              <Calendar className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-extrabold tracking-tight leading-none bg-gradient-to-r from-zinc-900 via-emerald-950 to-zinc-900 dark:from-white dark:via-emerald-200 dark:to-white bg-clip-text text-transparent truncate max-w-[220px] sm:max-w-none">
                {campusInfo.campusName || "Campus Routine System"}
              </span>
              <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mt-0.5">
                {campusInfo.campusAddress || "Timetable & Schedule Management"}
              </span>
            </div>
          </Link>

          {/* Live Animated Database / XAMPP Health Indicator */}
          <div className="hidden md:flex items-center ml-2">
            {dbStatus === "online" ? (
              <div 
                className="flex items-center gap-2 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80 px-3 py-1 text-xs font-semibold text-emerald-800 dark:text-emerald-300 shadow-2xs transition-all"
                title="MySQL (XAMPP) Database Connected & Active"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>MySQL (XAMPP) Active</span>
              </div>
            ) : dbStatus === "offline" ? (
              <div 
                className="flex items-center gap-2 rounded-full bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/80 px-3 py-1 text-xs font-semibold text-rose-800 dark:text-rose-300 shadow-2xs animate-pulse transition-all"
                title="MySQL / FastAPI server is offline or unreachable"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                </span>
                <span>MySQL Offline</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-3 py-1 text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                <span className="h-2 w-2 rounded-full bg-zinc-400 inline-block animate-pulse" />
                <span>Checking DB...</span>
              </div>
            )}
          </div>
        </div>

        {/* Center Live Date & Time Display on Every Page */}
        <div className="hidden lg:flex items-center gap-2.5 rounded-full border border-zinc-200/80 bg-zinc-50/90 px-4 py-1.5 text-xs shadow-xs dark:border-zinc-800 dark:bg-zinc-900/90">
          <div className="flex items-center gap-1.5 text-zinc-900 dark:text-zinc-100 font-mono font-bold">
            <Clock className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span suppressHydrationWarning>{mounted ? timeString : "--:--:--"}</span>
          </div>
          <span className="text-zinc-300 dark:text-zinc-700 font-light">|</span>
          <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400 font-medium font-sans">
            <Calendar className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
            <span suppressHydrationWarning>{mounted ? dateString : "Loading date..."}</span>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2.5">
          {/* White / Black Theme Switcher */}
          <button
            onClick={toggleTheme}
            title={theme === "dark" ? "Switch to White Theme" : "Switch to Black Theme"}
            className="flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 px-3 py-1.5 text-xs font-bold text-zinc-900 dark:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all cursor-pointer shadow-xs active:scale-95"
            aria-label="Toggle Theme"
          >
            {mounted && theme === "dark" ? (
              <>
                <Sun className="h-3.5 w-3.5 text-amber-500" />
                <span className="hidden sm:inline">White Mode</span>
              </>
            ) : (
              <>
                <Moon className="h-3.5 w-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Black Mode</span>
              </>
            )}
          </button>

          {/* Vibrant Red/Rose Live Watch Badge */}
          <Link
            href="/live-watch"
            className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-900/60 transition-colors shadow-2xs"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
            </span>
            <span>Live Watch</span>
          </Link>

          {onOpenGenerator && (
            <button
              onClick={onOpenGenerator}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-700 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm active:scale-95 transition-all cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Generate Routine</span>
            </button>
          )}

          {/* Notifications Dropdown with Crisp Red Badge */}
          <div className="relative">
            <button
              onClick={() => setShowNotifs(!showNotifs)}
              className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-rose-600 text-white text-[10px] font-black ring-2 ring-white dark:ring-zinc-900 shadow-sm animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifs && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3.5 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                      Notifications
                    </span>
                    {unreadCount > 0 && (
                      <span className="rounded-full bg-rose-100 dark:bg-rose-950/80 px-1.5 py-0.2 text-[10px] font-bold text-rose-700 dark:text-rose-400">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="mt-2.5 max-h-64 space-y-2 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="py-6 text-center text-xs text-zinc-400">No notifications yet</div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={cn(
                          "rounded-xl p-2.5 text-xs transition-colors",
                          n.is_read
                            ? "bg-zinc-50 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400"
                            : "bg-rose-50/40 dark:bg-rose-950/20 text-zinc-900 dark:text-zinc-100 font-medium border-l-2 border-rose-600 dark:border-rose-500"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold">{n.title}</span>
                          {!n.is_read && (
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-600 shrink-0" />
                          )}
                        </div>
                        <div className="text-[11px] opacity-80 mt-0.5">{n.message}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Interactive User Role Card (Clickable to Edit Dr. Ram Sharma / Campus Info) */}
          <div 
            onClick={() => setIsProfileModalOpen(true)}
            className="flex items-center gap-2.5 pl-2 border-l border-zinc-200 dark:border-zinc-800 cursor-pointer group hover:opacity-90 transition-all"
            title="Click to edit administrator name &amp; campus details"
          >
            <div className="flex h-8.5 w-8.5 items-center justify-center rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-black text-xs shadow-xs group-hover:ring-2 group-hover:ring-emerald-500 transition-all">
              {getInitials(campusInfo.adminName || "Dr. Ram Sharma")}
            </div>
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 leading-tight group-hover:underline flex items-center gap-1">
                {campusInfo.adminName || "Dr. Ram Sharma"}
                <Edit3 className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-600" />
              </span>
              <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
                {campusInfo.adminRole || "Campus Admin"}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Profile & Campus Edit Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-zinc-900 dark:text-white">
                    Edit Administrator &amp; Campus Profile
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Saved permanently in database and synced across your sessions.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="rounded-lg p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              {/* Admin Section */}
              <div className="space-y-3 rounded-xl border border-zinc-200/80 bg-zinc-50/50 p-3.5 dark:border-zinc-800 dark:bg-zinc-800/40">
                <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-emerald-600" /> Administrator Details
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={profileForm.adminName}
                      onChange={(e) => setProfileForm({ ...profileForm, adminName: e.target.value })}
                      placeholder="e.g. Dr. Ram Sharma"
                      className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Role / Designation
                    </label>
                    <input
                      type="text"
                      required
                      value={profileForm.adminRole}
                      onChange={(e) => setProfileForm({ ...profileForm, adminRole: e.target.value })}
                      placeholder="e.g. Campus Admin, Campus Chief"
                      className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={profileForm.adminEmail}
                    onChange={(e) => setProfileForm({ ...profileForm, adminEmail: e.target.value })}
                    placeholder="admin@campus.edu"
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Campus Section */}
              <div className="space-y-3 rounded-xl border border-zinc-200/80 bg-zinc-50/50 p-3.5 dark:border-zinc-800 dark:bg-zinc-800/40">
                <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-teal-600" /> Campus / College Identity
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Campus / University Name
                  </label>
                  <input
                    type="text"
                    required
                    value={profileForm.campusName}
                    onChange={(e) => setProfileForm({ ...profileForm, campusName: e.target.value })}
                    placeholder="e.g. Ratna Rajyalaxmi Campus, Tribhuvan University"
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Campus Location / Address
                  </label>
                  <input
                    type="text"
                    value={profileForm.campusAddress}
                    onChange={(e) => setProfileForm({ ...profileForm, campusAddress: e.target.value })}
                    placeholder="e.g. Pradarshanimarga, Kathmandu Nepal"
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Theme Accent Option */}
              <div className="space-y-2 rounded-xl border border-zinc-200/80 bg-zinc-50/50 p-3.5 dark:border-zinc-800 dark:bg-zinc-800/40">
                <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                  Theme Accent Color
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: "emerald", label: "Dim Emerald", bg: "bg-emerald-600" },
                    { key: "teal", label: "Sage Teal", bg: "bg-teal-600" },
                    { key: "slate", label: "Classic Slate", bg: "bg-zinc-700" },
                  ].map((thm) => (
                    <button
                      type="button"
                      key={thm.key}
                      onClick={() => setProfileForm({ ...profileForm, accentTheme: thm.key as any })}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer",
                        profileForm.accentTheme === thm.key
                          ? "border-emerald-600 bg-emerald-50/80 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-500 ring-1 ring-emerald-500"
                          : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      )}
                    >
                      <span className={cn("h-3 w-3 rounded-full shrink-0", thm.bg)} />
                      <span className="truncate">{thm.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="rounded-xl border border-zinc-200 px-4 py-2 font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 px-5 py-2 font-bold text-white shadow-xs transition-colors cursor-pointer"
                >
                  <Save className="h-4 w-4" /> Save Profile to Database
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {saveSuccessToast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-2xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 px-4 py-3 text-xs font-bold shadow-xl animate-in slide-in-from-top-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 dark:text-emerald-600" />
          <span>Profile &amp; Campus saved to database successfully!</span>
        </div>
      )}
    </>
  );
}
