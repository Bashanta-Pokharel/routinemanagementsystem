"use client";

import React, { useState, useEffect } from "react";
import { 
  Users, Plus, Mail, Phone, Calendar, Clock, 
  Edit3, Trash2, CheckCircle2, AlertTriangle, Shield, Search
} from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { AvailabilityMatrix } from "@/components/AvailabilityMatrix";
import { api } from "@/lib/api";
import { cn, getTeacherColor } from "@/lib/utils";

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
    } catch (e: any) {
      alert("Error saving teacher: " + e.message);
    }
  };

  const handleDeleteTeacher = async (id: number) => {
    if (!confirm("Are you sure you want to delete this teacher profile?")) return;
    try {
      await api.deleteTeacher(id);
      loadData();
    } catch (e: any) {
      alert("Error deleting teacher: " + e.message);
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
        {/* Page Header */}
        <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-zinc-900 dark:text-white" />
              Teacher & Faculty Roster
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Configure faculty workload rules, assigned subjects, and weekly availability matrices.
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Add Faculty Member
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-3 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <Search className="h-4 w-4 text-zinc-400 ml-1" />
          <input
            type="text"
            placeholder="Search by faculty name, ID, or designation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none dark:text-white"
          />
        </div>

        {/* Teachers Table */}
        <div className="rounded-2xl border border-zinc-200 bg-white shadow-xs overflow-hidden dark:border-zinc-800 dark:bg-zinc-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-zinc-100 border-b border-zinc-200 text-[11px] font-bold text-zinc-700 uppercase tracking-wider dark:bg-zinc-800/80 dark:border-zinc-800 dark:text-zinc-300">
                  <th className="py-3 px-4">Faculty Member</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Workload Limits</th>
                  <th className="py-3 px-4">Assigned Subjects</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {filteredTeachers.map((t) => {
                  const tColor = getTeacherColor(t.name || t.id);
                  return (
                    <tr
                      key={t.id}
                      className={`hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition-colors ${
                        selectedTeacherForAvail?.id === t.id ? "bg-zinc-100/70 dark:bg-zinc-800/60" : ""
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl font-black text-xs shadow-xs", tColor.avatar)}>
                            {t.name.split(" ").filter((w: string) => !["Prof.", "Dr.", "Er.", "Mr.", "Mrs."].includes(w)).map((n: string) => n[0]).join("").slice(0, 2) || "TC"}
                          </div>
                          <div>
                            <div className="font-bold text-zinc-900 dark:text-white text-sm flex items-center gap-1.5">
                              {t.name}
                              <span className={cn("inline-block h-2 w-2 rounded-full", tColor.pill)} />
                            </div>
                            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono font-semibold text-zinc-700 dark:text-zinc-300">{t.employee_id}</span>
                              <span>&bull;</span>
                              <span>{t.designation}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-zinc-700 dark:text-zinc-300">
                        {t.department_name || "Department of Computer Applications (BCA)"}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-[11px] font-medium text-zinc-600 dark:text-zinc-300 space-y-0.5">
                          <div>Max Daily: <span className="font-bold text-zinc-900 dark:text-white">{t.max_hours_per_day} hrs</span></div>
                          <div>Max Weekly: <span className="font-bold text-zinc-900 dark:text-white">{t.max_hours_per_week} hrs</span></div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1.5 max-w-sm">
                          {t.eligible_subject_names && t.eligible_subject_names.length > 0 ? (
                            t.eligible_subject_names.map((subName: string, sIdx: number) => (
                              <span
                                key={sIdx}
                                className={cn("rounded-md border px-2 py-0.5 text-[10px] font-semibold font-mono shadow-2xs", tColor.tag)}
                              >
                                {subName}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] text-zinc-400 italic">All Department Subjects</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedTeacherForAvail(t)}
                            className={cn("flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer shadow-2xs", tColor.badge)}
                          >
                            <Calendar className="h-3.5 w-3.5" />
                            Availability
                          </button>
                          <button
                            onClick={() => handleOpenEdit(t)}
                            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 cursor-pointer"
                            title="Edit Teacher"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTeacher(t.id)}
                            className="rounded-lg p-1.5 text-zinc-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 cursor-pointer"
                            title="Delete Teacher"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Teacher's Availability Matrix Component */}
        {selectedTeacherForAvail && (
          <div className="mt-8 space-y-3">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-zinc-900 dark:bg-zinc-100" />
              <h2 className="text-base font-bold text-zinc-900 dark:text-white">
                Teacher Availability Grid Inspector: {selectedTeacherForAvail.name}
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 max-h-[90vh] overflow-y-auto">
              <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-4">
                {editingTeacher ? "Edit Faculty Profile" : "Register Faculty Member"}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Employee ID</label>
                    <input
                      type="text"
                      required
                      value={formData.employee_id}
                      onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                      className="w-full rounded-xl border border-zinc-200 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full rounded-xl border border-zinc-200 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Email</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full rounded-xl border border-zinc-200 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Designation</label>
                    <select
                      value={formData.designation}
                      onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                      className="w-full rounded-xl border border-zinc-200 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
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
                    <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Max Daily Hours</label>
                    <input
                      type="number"
                      step="0.5"
                      value={formData.max_hours_per_day}
                      onChange={(e) => setFormData({ ...formData, max_hours_per_day: parseFloat(e.target.value) })}
                      className="w-full rounded-xl border border-zinc-200 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Max Weekly Hours</label>
                    <input
                      type="number"
                      step="0.5"
                      value={formData.max_hours_per_week}
                      onChange={(e) => setFormData({ ...formData, max_hours_per_week: parseFloat(e.target.value) })}
                      className="w-full rounded-xl border border-zinc-200 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-xl border border-zinc-200 px-4 py-2 font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-zinc-900 px-5 py-2 font-bold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 cursor-pointer"
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
