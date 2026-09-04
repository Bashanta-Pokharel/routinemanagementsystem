"use client";

import React, { useState, useEffect } from "react";
import { FolderTree, Plus, Trash2, Layers, GraduationCap, Building2 } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { api } from "@/lib/api";

export default function AcademicStructurePage() {
  const [faculties, setFaculties] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State for new section
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [newSectionData, setNewSectionData] = useState({
    semester_id: 1,
    name: "A",
    student_count: 40,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [fData, dData, pData, sData] = await Promise.all([
        api.getFaculties(),
        api.getDepartments(),
        api.getPrograms(),
        api.getSections(),
      ]);
      setFaculties(fData || []);
      setDepartments(dData || []);
      setPrograms(pData || []);
      setSections(sData || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createSection(newSectionData);
      setIsSectionModalOpen(false);
      loadData();
    } catch (err: any) {
      alert("Failed to create section: " + err.message);
    }
  };

  const handleDeleteSection = async (id: number) => {
    if (!confirm("Are you sure you want to delete this section?")) return;
    try {
      await api.deleteSection(id);
      loadData();
    } catch (err: any) {
      alert("Failed to delete section: " + err.message);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <FolderTree className="h-5 w-5 text-blue-600" />
              Campus Academic Hierarchy
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Manage Faculties, Academic Departments, Programs (BCA, CSIT, BBA), Semesters, and Class Sections.
            </p>
          </div>
          <button
            onClick={() => setIsSectionModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm shadow-blue-500/25 hover:bg-blue-700 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Add Class Section
          </button>
        </div>

        {/* Faculties & Programs Overview Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {programs.map((prog) => (
            <div
              key={prog.id}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 font-bold text-xs dark:bg-blue-950/60 dark:text-blue-300">
                  <GraduationCap className="h-4 w-4" />
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {prog.code}
                </span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{prog.name}</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">{prog.department_name || "Department"}</p>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 border-t border-slate-100 pt-2 dark:border-slate-800">
                <span>Duration: {prog.duration_years} Years</span>
                <span>{prog.total_semesters} Semesters</span>
              </div>
            </div>
          ))}
        </div>

        {/* Sections / Classes Roster */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="h-4 w-4 text-indigo-600" />
                Active Class Sections ({sections.length})
              </h2>
              <p className="text-xs text-slate-500">All registered class cohorts scheduled by the CP-SAT engine</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase tracking-wider dark:bg-slate-800/60 dark:border-slate-800 dark:text-slate-300">
                  <th className="py-3 px-4">Program & Semester</th>
                  <th className="py-3 px-4">Section Name</th>
                  <th className="py-3 px-4">Student Capacity / Cohort Size</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {sections.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      {s.program_name || "Program"} &ndash; {s.semester_name || `Sem ${s.semester_id}`}
                    </td>
                    <td className="py-3 px-4 font-bold text-blue-600 dark:text-blue-400">
                      Section {s.name}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      {s.student_count} Students
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDeleteSection(s.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer"
                        title="Delete Section"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section Modal */}
        {isSectionModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
                Add Class Section
              </h3>
              <form onSubmit={handleCreateSection} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Section Code / Identifier (e.g. A, B, Sec 1)
                  </label>
                  <input
                    type="text"
                    required
                    value={newSectionData.name}
                    onChange={(e) => setNewSectionData({ ...newSectionData, name: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Student Cohort Count
                  </label>
                  <input
                    type="number"
                    required
                    value={newSectionData.student_count}
                    onChange={(e) => setNewSectionData({ ...newSectionData, student_count: parseInt(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsSectionModalOpen(false)}
                    className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-blue-600 px-5 py-2 font-bold text-white hover:bg-blue-700 cursor-pointer"
                  >
                    Create Section
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
