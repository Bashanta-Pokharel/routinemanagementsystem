"use client";

import React, { useState, useEffect } from "react";
import { 
  FolderTree, Plus, Trash2, Layers, GraduationCap, Building2, 
  Clock, BookOpen, Sparkles, Check, AlertCircle, X, CheckCircle2
} from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { api } from "@/lib/api";

export default function AcademicStructurePage() {
  const [faculties, setFaculties] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State for new Program / Course
  const [isProgramModalOpen, setIsProgramModalOpen] = useState(false);
  const [newProgramData, setNewProgramData] = useState({
    name: "Bachelor of Business Administration (BBA)",
    code: "BBA",
    department_id: 1,
    duration_years: 4,
    total_semesters: 8,
    total_credits: 120,
  });

  // Modal State for new section
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [newSectionData, setNewSectionData] = useState({
    semester_id: 1,
    name: "A",
    student_count: 40,
  });

  // Action message
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const showNotification = (type: "success" | "error", text: string) => {
    setActionMessage({ type, text });
    setTimeout(() => setActionMessage(null), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [fData, dData, pData, semData, sData] = await Promise.all([
        api.getFaculties(),
        api.getDepartments(),
        api.getPrograms(),
        api.getSemesters(),
        api.getSections(),
      ]);
      setFaculties(fData || []);
      setDepartments(dData || []);
      setPrograms(pData || []);
      setSemesters(semData || []);
      setSections(sData || []);

      if (dData && dData.length > 0 && !newProgramData.department_id) {
        setNewProgramData((prev) => ({ ...prev, department_id: dData[0].id }));
      }
      if (semData && semData.length > 0) {
        setNewSectionData((prev) => ({ ...prev, semester_id: semData[0].id }));
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let deptId = newProgramData.department_id;
      if (!deptId && departments.length > 0) {
        deptId = departments[0].id;
      } else if (!deptId && faculties.length > 0) {
        const newDept = await api.createDepartment({
          faculty_id: faculties[0].id,
          name: `Department of ${newProgramData.code}`,
          code: `${newProgramData.code}_DEPT`
        });
        deptId = newDept.id;
      } else if (!deptId) {
        const newFac = await api.createFaculty({
          campus_id: 1,
          name: "Faculty of Management & Technology",
          code: "FMT"
        });
        const newDept = await api.createDepartment({
          faculty_id: newFac.id,
          name: `Department of ${newProgramData.code}`,
          code: `${newProgramData.code}_DEPT`
        });
        deptId = newDept.id;
      }

      await api.createProgram({
        department_id: Number(deptId),
        name: newProgramData.name,
        code: newProgramData.code.toUpperCase(),
        duration_years: Number(newProgramData.duration_years),
        total_semesters: Number(newProgramData.total_semesters),
      });

      setIsProgramModalOpen(false);
      showNotification("success", `Created ${newProgramData.code} program with ${newProgramData.total_semesters} auto-generated semesters!`);
      loadData();
    } catch (err: any) {
      showNotification("error", "Failed to create program: " + err.message);
    }
  };

  const handleDeleteProgram = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete the course "${name}" and all its semesters/sections?`)) return;
    try {
      await api.deleteProgram(id);
      showNotification("success", `Course "${name}" deleted.`);
      loadData();
    } catch (err: any) {
      showNotification("error", "Failed to delete program: " + err.message);
    }
  };

  const handleCreateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createSection({
        semester_id: Number(newSectionData.semester_id),
        name: newSectionData.name,
        student_count: Number(newSectionData.student_count),
      });
      setIsSectionModalOpen(false);
      showNotification("success", `Class Section ${newSectionData.name} created.`);
      loadData();
    } catch (err: any) {
      showNotification("error", "Failed to create section: " + err.message);
    }
  };

  const handleDeleteSection = async (id: number) => {
    if (!confirm("Are you sure you want to delete this section?")) return;
    try {
      await api.deleteSection(id);
      showNotification("success", "Section deleted.");
      loadData();
    } catch (err: any) {
      showNotification("error", "Failed to delete section: " + err.message);
    }
  };

  const applyPreset = (name: string, code: string, duration: number, semesters: number, credits: number) => {
    setNewProgramData({
      ...newProgramData,
      name,
      code,
      duration_years: duration,
      total_semesters: semesters,
      total_credits: credits,
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Toast Notification */}
        {actionMessage && (
          <div
            className={`fixed top-4 right-4 z-50 flex items-center gap-2 rounded-2xl px-4 py-3 text-xs font-bold text-white shadow-xl animate-in slide-in-from-top-2 ${
              actionMessage.type === "success" ? "bg-emerald-600" : "bg-rose-600"
            }`}
          >
            {actionMessage.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            {actionMessage.text}
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col gap-4 rounded-3xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
              <FolderTree className="h-5 w-5 text-zinc-900 dark:text-zinc-100" />
              Campus Academic Hierarchy & Course Management
            </h1>
            <p className="text-xs text-zinc-500 mt-1">
              Add and manage academic courses (BCA, BBA, BBM, BHM, CSIT), semester structures, credit hours, and active class cohorts.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsProgramModalOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-zinc-800 active:scale-95 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Add New Course / Program
            </button>
            <button
              onClick={() => setIsSectionModalOpen(true)}
              className="flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-xs font-bold text-zinc-800 shadow-xs hover:bg-zinc-50 active:scale-95 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Add Class Section
            </button>
          </div>
        </div>

        {/* Courses & Programs Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-zinc-700 dark:text-zinc-300" />
              Registered Campus Degree Programs & Courses ({programs.length})
            </h2>
            <span className="text-xs text-zinc-500">Supports 3-Year & 4-Year Bachelor Degrees</span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {programs.map((prog) => {
              const progSections = sections.filter((s) => s.program_name === prog.name || (s.semester_name && s.semester_name.includes(prog.code)));
              return (
                <div
                  key={prog.id}
                  className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 space-y-3 hover:border-zinc-400 dark:hover:border-zinc-700 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100 text-zinc-900 font-black text-xs dark:bg-zinc-800 dark:text-zinc-100">
                        {prog.code}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-[10px] font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                          {prog.duration_years} Years
                        </span>
                        {programs.length > 1 && (
                          <button
                            onClick={() => handleDeleteProgram(prog.id, prog.name)}
                            className="p-1 text-zinc-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Delete Program"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-zinc-900 dark:text-white">{prog.name}</h3>
                      <p className="text-[11px] text-zinc-500 mt-0.5">{prog.department_name || "Department of Computer / Management"}</p>
                    </div>
                  </div>

                  <div className="border-t border-zinc-100 pt-3 dark:border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                      <span>Total Semesters:</span>
                      <span className="font-bold text-zinc-900 dark:text-white">{prog.total_semesters} Semesters</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                      <span>Total Credits:</span>
                      <span className="font-bold text-zinc-900 dark:text-white">{prog.duration_years === 3 ? "120" : "126 - 138"} Cr.</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                      <span>Active Cohorts:</span>
                      <span className="font-bold text-zinc-900 dark:text-white">{progSections.length} Sections</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sections / Classes Roster */}
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Layers className="h-4 w-4 text-zinc-700 dark:text-zinc-300" />
                Active Class Sections & Cohorts ({sections.length})
              </h2>
              <p className="text-xs text-zinc-500">All registered class cohorts scheduled by the CP-SAT engine</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-zinc-100/80 border-b border-zinc-200 text-[11px] font-bold text-zinc-700 uppercase tracking-wider dark:bg-zinc-800/60 dark:border-zinc-800 dark:text-zinc-300">
                  <th className="py-3 px-4">Program & Semester</th>
                  <th className="py-3 px-4">Section Name</th>
                  <th className="py-3 px-4">Student Capacity / Cohort Size</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {sections.map((s) => (
                  <tr key={s.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                    <td className="py-3 px-4 font-semibold text-zinc-900 dark:text-white">
                      {s.program_name || "Program"} &ndash; {s.semester_name || `Sem ${s.semester_id}`}
                    </td>
                    <td className="py-3 px-4 font-bold text-zinc-900 dark:text-zinc-100">
                      Section {s.name}
                    </td>
                    <td className="py-3 px-4 text-zinc-600 dark:text-zinc-300">
                      {s.student_count} Students
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDeleteSection(s.id)}
                        className="p-1 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer transition-colors"
                        title="Delete Section"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {sections.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-zinc-400 italic">
                      No active class sections registered yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Add New Course / Program */}
        {isProgramModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-lg rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 space-y-5 animate-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-zinc-900 dark:text-zinc-100" />
                    Add Academic Course / Degree Program
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Configure a new course (BBA, BBM, BHM, CSIT) with semester breakdown.
                  </p>
                </div>
                <button
                  onClick={() => setIsProgramModalOpen(false)}
                  className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Quick Presets */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                  Quick Course Presets:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => applyPreset("Bachelor of Business Administration (BBA)", "BBA", 4, 8, 120)}
                    className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[11px] font-semibold text-zinc-800 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 cursor-pointer"
                  >
                    + BBA (4 Yrs / 8 Sem)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset("Bachelor of Business Management (BBM)", "BBM", 4, 8, 120)}
                    className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[11px] font-semibold text-zinc-800 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 cursor-pointer"
                  >
                    + BBM (4 Yrs / 8 Sem)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset("Bachelor of Hotel Management (BHM)", "BHM", 4, 8, 126)}
                    className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[11px] font-semibold text-zinc-800 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 cursor-pointer"
                  >
                    + BHM (4 Yrs / 8 Sem)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset("Bachelor of Information Management (BIM)", "BIM", 4, 8, 126)}
                    className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[11px] font-semibold text-zinc-800 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 cursor-pointer"
                  >
                    + BIM (4 Yrs / 8 Sem)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset("B.Sc. Computer Science & IT (BSc CSIT)", "CSIT", 4, 8, 126)}
                    className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[11px] font-semibold text-zinc-800 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 cursor-pointer"
                  >
                    + BSc CSIT (4 Yrs / 8 Sem)
                  </button>
                </div>
              </div>

              <form onSubmit={handleCreateProgram} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Course / Program Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newProgramData.name}
                    onChange={(e) => setNewProgramData({ ...newProgramData, name: e.target.value })}
                    placeholder="e.g. Bachelor of Business Administration (BBA)"
                    className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      Program Code
                    </label>
                    <input
                      type="text"
                      required
                      value={newProgramData.code}
                      onChange={(e) => setNewProgramData({ ...newProgramData, code: e.target.value.toUpperCase() })}
                      placeholder="e.g. BBA, BBM, BHM"
                      className="w-full rounded-xl border border-zinc-300 px-3 py-2 font-mono font-bold text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      Academic Department
                    </label>
                    <select
                      value={newProgramData.department_id}
                      onChange={(e) => setNewProgramData({ ...newProgramData, department_id: Number(e.target.value) })}
                      className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
                    >
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                      {departments.length === 0 && <option value={1}>General Academic Department</option>}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      Duration (Years)
                    </label>
                    <select
                      value={newProgramData.duration_years}
                      onChange={(e) => {
                        const dur = Number(e.target.value);
                        setNewProgramData({
                          ...newProgramData,
                          duration_years: dur,
                          total_semesters: dur * 2,
                        });
                      }}
                      className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
                    >
                      <option value={2}>2 Years</option>
                      <option value={3}>3 Years</option>
                      <option value={4}>4 Years</option>
                      <option value={5}>5 Years</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      Total Semesters
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={12}
                      required
                      value={newProgramData.total_semesters}
                      onChange={(e) => setNewProgramData({ ...newProgramData, total_semesters: parseInt(e.target.value) })}
                      className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      Credit Hours
                    </label>
                    <input
                      type="number"
                      required
                      value={newProgramData.total_credits}
                      onChange={(e) => setNewProgramData({ ...newProgramData, total_credits: parseInt(e.target.value) })}
                      className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setIsProgramModalOpen(false)}
                    className="rounded-xl border border-zinc-300 px-4 py-2 font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-zinc-900 px-5 py-2 font-bold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 cursor-pointer"
                  >
                    Create Degree Program
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Add Class Section */}
        {isSectionModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 space-y-4 animate-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
                <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Layers className="h-5 w-5 text-zinc-900 dark:text-zinc-100" />
                  Add Class Section
                </h3>
                <button
                  onClick={() => setIsSectionModalOpen(false)}
                  className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateSection} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Select Program & Semester
                  </label>
                  <select
                    value={newSectionData.semester_id}
                    onChange={(e) => setNewSectionData({ ...newSectionData, semester_id: Number(e.target.value) })}
                    className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  >
                    {semesters.map((sem) => (
                      <option key={sem.id} value={sem.id}>
                        {sem.program_name || "Program"} &ndash; {sem.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      Section Identifier
                    </label>
                    <input
                      type="text"
                      required
                      value={newSectionData.name}
                      onChange={(e) => setNewSectionData({ ...newSectionData, name: e.target.value })}
                      placeholder="e.g. A, B, Sec 1"
                      className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      Student Capacity
                    </label>
                    <input
                      type="number"
                      required
                      value={newSectionData.student_count}
                      onChange={(e) => setNewSectionData({ ...newSectionData, student_count: parseInt(e.target.value) })}
                      className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setIsSectionModalOpen(false)}
                    className="rounded-xl border border-zinc-300 px-4 py-2 font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-zinc-900 px-5 py-2 font-bold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 cursor-pointer"
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
