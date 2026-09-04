"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { GeneratorModal } from "./GeneratorModal";
import { api } from "@/lib/api";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [academicYears, setAcademicYears] = useState<any[]>([]);

  useEffect(() => {
    api.getAcademicYears().then((data) => {
      setAcademicYears(data || [{ id: 1, name: "2026/2027 Academic Session" }]);
    }).catch(() => {
      setAcademicYears([{ id: 1, name: "2026/2027 Academic Session" }]);
    });
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <Navbar onOpenGenerator={() => setIsGeneratorOpen(true)} />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 max-w-7xl mx-auto w-full overflow-y-auto">
          {children}
        </main>
      </div>

      <GeneratorModal
        isOpen={isGeneratorOpen}
        onClose={() => setIsGeneratorOpen(false)}
        academicYears={academicYears}
        onGenerated={(newId) => {
          window.location.href = `/timetables?id=${newId}`;
        }}
      />
    </div>
  );
}
