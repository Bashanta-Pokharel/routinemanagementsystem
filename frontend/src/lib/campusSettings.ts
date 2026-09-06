"use client";

import { useState, useEffect } from "react";

export interface CampusInfo {
  campusName: string;
  campusAddress: string;
  routineTitle: string;
}

const STORAGE_KEY = "campus_info";

export const DEFAULT_CAMPUS_INFO: CampusInfo = {
  campusName: "Ratna Rajyalaxmi Campus",
  campusAddress: "Pradarshanimarga, Kathmandu Nepal",
  routineTitle: "BCA Academic Routine 2026",
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
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("campus_info_updated", { detail: updated }));
    return updated;
  } catch (e) {
    return { ...DEFAULT_CAMPUS_INFO, ...info };
  }
}

export function useCampusInfo() {
  const [campusInfo, setCampusInfo] = useState<CampusInfo>(DEFAULT_CAMPUS_INFO);

  useEffect(() => {
    // Initial load from storage
    setCampusInfo(getStoredCampusInfo());

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
