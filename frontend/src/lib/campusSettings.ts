"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";

export type AccentTheme = "emerald" | "teal" | "indigo" | "slate" | "amber";

export interface CampusInfo {
  campusName: string;
  campusAddress: string;
  routineTitle: string;
  adminName: string;
  adminRole: string;
  adminEmail: string;
  accentTheme?: AccentTheme;
}

const STORAGE_KEY = "campus_info";

export const DEFAULT_CAMPUS_INFO: CampusInfo = {
  campusName: "Ratna Rajyalaxmi Campus",
  campusAddress: "Pradarshanimarga, Kathmandu Nepal",
  routineTitle: "BCA Academic Routine 2026",
  adminName: "Dr. Ram Sharma",
  adminRole: "Campus Admin",
  adminEmail: "admin@campus.edu",
  accentTheme: "emerald",
};

export function getStoredCampusInfo(): CampusInfo {
  if (typeof window === "undefined") {
    return DEFAULT_CAMPUS_INFO;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CAMPUS_INFO;
    const parsed = JSON.parse(raw);
    return {
      campusName: parsed.campusName || DEFAULT_CAMPUS_INFO.campusName,
      campusAddress: parsed.campusAddress || DEFAULT_CAMPUS_INFO.campusAddress,
      routineTitle: parsed.routineTitle || DEFAULT_CAMPUS_INFO.routineTitle,
      adminName: parsed.adminName || DEFAULT_CAMPUS_INFO.adminName,
      adminRole: parsed.adminRole || DEFAULT_CAMPUS_INFO.adminRole,
      adminEmail: parsed.adminEmail || DEFAULT_CAMPUS_INFO.adminEmail,
      accentTheme: (parsed.accentTheme as AccentTheme) || DEFAULT_CAMPUS_INFO.accentTheme,
    };
  } catch (e) {
    return DEFAULT_CAMPUS_INFO;
  }
}

export function saveStoredCampusInfo(info: Partial<CampusInfo>): CampusInfo {
  if (typeof window === "undefined") {
    return { ...DEFAULT_CAMPUS_INFO, ...info };
  }
  try {
    const current = getStoredCampusInfo();
    const updated: CampusInfo = {
      campusName: info.campusName !== undefined ? info.campusName : current.campusName,
      campusAddress: info.campusAddress !== undefined ? info.campusAddress : current.campusAddress,
      routineTitle: info.routineTitle !== undefined ? info.routineTitle : current.routineTitle,
      adminName: info.adminName !== undefined ? info.adminName : current.adminName,
      adminRole: info.adminRole !== undefined ? info.adminRole : current.adminRole,
      adminEmail: info.adminEmail !== undefined ? info.adminEmail : current.adminEmail,
      accentTheme: (info.accentTheme !== undefined ? info.accentTheme : current.accentTheme) as AccentTheme,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("campus_info_updated", { detail: updated }));

    // Persist to MySQL Backend via API in the background
    api.updateSettings({
      campusName: updated.campusName,
      campusAddress: updated.campusAddress,
      routineTitle: updated.routineTitle,
      adminName: updated.adminName,
      adminRole: updated.adminRole,
      adminEmail: updated.adminEmail,
      accentTheme: updated.accentTheme,
      campus_name: updated.campusName,
      campus_address: updated.campusAddress,
      routine_title: updated.routineTitle,
      admin_name: updated.adminName,
      admin_role: updated.adminRole,
      admin_email: updated.adminEmail,
      accent_theme: updated.accentTheme,
    }).catch((err) => {
      console.warn("Could not sync settings to backend database:", err);
    });

    return updated;
  } catch (e) {
    return { ...DEFAULT_CAMPUS_INFO, ...info };
  }
}

export function useCampusInfo() {
  const [campusInfo, setCampusInfo] = useState<CampusInfo>(DEFAULT_CAMPUS_INFO);

  useEffect(() => {
    // Initial load from local storage
    const local = getStoredCampusInfo();
    setCampusInfo(local);

    // Fetch latest persisted settings from MySQL Backend API
    api.getSettings()
      .then((res: any) => {
        const dbData = res?.data || res;
        if (dbData && (dbData.campusName || dbData.campus_name || dbData.adminName || dbData.admin_name)) {
          const merged: CampusInfo = {
            campusName: dbData.campusName || dbData.campus_name || local.campusName,
            campusAddress: dbData.campusAddress || dbData.campus_address || local.campusAddress,
            routineTitle: dbData.routineTitle || dbData.routine_title || local.routineTitle,
            adminName: dbData.adminName || dbData.admin_name || local.adminName,
            adminRole: dbData.adminRole || dbData.admin_role || local.adminRole,
            adminEmail: dbData.adminEmail || dbData.admin_email || local.adminEmail,
            accentTheme: (dbData.accentTheme || dbData.accent_theme || dbData.themeAccent || local.accentTheme || "emerald") as AccentTheme,
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
          setCampusInfo(merged);
        }
      })
      .catch((err) => {
        // Fallback silently to localStorage
      });

    const handleUpdate = (e: any) => {
      if (e?.detail) {
        setCampusInfo(e.detail);
      } else {
        setCampusInfo(getStoredCampusInfo());
      }
    };

    window.addEventListener("campus_info_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener("campus_info_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const updateCampusInfo = (info: Partial<CampusInfo>) => {
    const next = saveStoredCampusInfo(info);
    setCampusInfo(next);
  };

  return { campusInfo, updateCampusInfo };
}
