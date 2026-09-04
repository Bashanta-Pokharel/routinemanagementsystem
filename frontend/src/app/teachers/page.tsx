"use client";

import React, { useState, useEffect } from "react";
import { 
  Users, Plus, Mail, Phone, Calendar, Clock, 
  Edit3, Trash2, CheckCircle2, AlertTriangle, Shield, Search
} from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { AvailabilityMatrix } from "@/components/AvailabilityMatrix";
import { api } from "@/lib/api";

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedTeacherForAvail, setSelectedTeacherForAvail] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Form modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    employee_id: "",
    name: "",
    email: "",
    phone: "",
    designation: "Lecturer",
    department_id: 1,
    max_hours_per_day: 5.0,
    max_hours_per_week: 22.0,
    min_hours_per_week: 6.0,
    eligible_subject_ids: [] as number[],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tList, deptList, subList] = await Promise.all([
        api.getTeachers(),
        api.getDepartments(),
        api.getSubjects(),
      ]);
      setTeachers(tList || []);
      setDepartments(deptList || []);
      setSubjects(subList || []);
      if (tList && tList.length > 0 && !selectedTeacherForAvail) {
        setSelectedTeacherForAvail(tList[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingTeacher(null);
    setFormData({
      employee_id: `EMP${String(teachers.length + 1).padStart(3, "0")}`,
      name: "",
      email: "",
      phone: "",
      designation: "Lecturer",
      department_id: departments[0]?.id || 1,
      max_hours_per_day: 5.0,
      max_hours_per_week: 22.0,
      min_hours_per_week: 6.0,
      eligible_subject_ids: [],
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (t: any) => {
    setEditingTeacher(t);
    setFormData({
      employee_id: t.employee_id,
      name: t.name,
      email: t.email,
      phone: t.phone || "",
      designation: t.designation,
      department_id: t.department_id,
      max_hours_per_day: t.max_hours_per_day,
      max_hours_per_week: t.max_hours_per_week,
      min_hours_per_week: t.min_hours_per_week,
      eligible_subject_ids: t.eligible_subject_ids || [],
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTeacher) {
        await api.updateTeacher(editingTeacher.id, formData);
      } else {
        await api.createTeacher(formData);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      alert("Failed to save teacher: " + err.message);
    }
  };

  const filteredTeachers = teachers.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.employee_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.designation.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Teacher & Faculty Roster
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Configure faculty workload rules, assigned subjects, and weekly availability matrices.
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm shadow-blue-500/25 hover:bg-blue-700 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Add Faculty Member
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <Search className="h-4 w-4 text-slate-400 ml-1" />
          <input
            type="text"
            placeholder="Search by faculty name, ID, or designation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-white"
          />
        </div>

        {/* Teachers Table */}
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase tracking-wider dark:bg-slate-800/60 dark:border-slate-800 dark:text-slate-300">
                  <th className="py-3 px-4">Faculty Member</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Workload Limits</th>
                  <th className="py-3 px-4">Assigned Subjects</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredTeachers.map((t) => (
                  <tr
                    key={t.id}
                    className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors ${
                      selectedTeacherForAvail?.id === t.id ? "bg-blue-50/40 dark:bg-blue-950/30" : ""
                    }`}
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs shadow-xs">
                          {t.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white text-sm">
                            {t.name}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <span className="font-semibold text-blue-600 dark:text-blue-400">{t.employee_id}</span>
                            <span>&bull;</span>
                            <span>{t.designation}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-600 dark:text-slate-300">
                      {t.department_name || "Computer Science"}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-[11px] font-medium text-slate-600 dark:text-slate-300 space-y-0.5">
                        <div>Max Daily: <span className="font-bold text-slate-900 dark:text-white">{t.max_hours_per_day} hrs</span></div>
                        <div>Max Weekly: <span className="font-bold text-slate-900 dark:text-white">{t.max_hours_per_week} hrs</span></div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {t.eligible_subject_names && t.eligible_subject_names.length > 0 ? (
                          t.eligible_subject_names.map((subName: string, sIdx: number) => (
                            <span
                              key={sIdx}
                              className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                            >
                              {subName}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-slate-400">All Dept Subjects</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedTeacherForAvail(t)}
                          className="flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 transition-colors cursor-pointer"
                        >
                          <Calendar className="h-3.5 w-3.5" />
                          Availability
                        </button>
                        <button
                          onClick={() => handleOpenEdit(t)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 cursor-pointer"
                          title="Edit Teacher"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Teacher's Availability Matrix Component */}
        {selectedTeacherForAvail && (
          <div className="mt-8 space-y-3">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-blue-600 animate-pulse" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Teacher Availability Grid Inspector
              </h2>
            </div>
            <AvailabilityMatrix
              teacherId={selectedTeacherForAvail.id}
              teacherName={selectedTeacherForAvail.name}
              onSaved={loadData}
            />
          </div>
        )}

        {/* Add/Edit Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 max-h-[90vh] overflow-y-auto">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
                {editingTeacher ? "Edit Faculty Profile" : "Register Faculty Member"}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Employee ID</label>
                    <input
                      type="text"
                      required
                      value={formData.employee_id}
                      onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Email</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Designation</label>
                    <select
                      value={formData.designation}
                      onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    >
                      <option value="Professor">Professor</option>
                      <option value="Associate Professor">Associate Professor</option>
                      <option value="Assistant Professor">Assistant Professor</option>
                      <option value="Lecturer">Lecturer</option>
                      <option value="Teaching Assistant">Teaching Assistant</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Max Daily Hours</label>
                    <input
                      type="number"
                      step="0.5"
                      value={formData.max_hours_per_day}
                      onChange={(e) => setFormData({ ...formData, max_hours_per_day: parseFloat(e.target.value) })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Max Weekly Hours</label>
                    <input
                      type="number"
                      step="0.5"
                      value={formData.max_hours_per_week}
                      onChange={(e) => setFormData({ ...formData, max_hours_per_week: parseFloat(e.target.value) })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-blue-600 px-5 py-2 font-bold text-white hover:bg-blue-700 cursor-pointer"
                  >
                    Save Profile
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
