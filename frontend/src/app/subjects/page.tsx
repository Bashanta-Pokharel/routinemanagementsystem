"use client";

import React, { useState, useEffect } from "react";
import { BookOpen, Plus, Trash2, DoorOpen } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { api } from "@/lib/api";

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    semester_id: 1,
    credit_hours: 3,
    weekly_periods: 4,
    lecture_periods: 3,
    practical_periods: 1,
    required_room_type_id: 1,
    max_classes_per_day: 2,
    color_code: "#09090b",
    eligible_teacher_ids: [] as number[],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sData, rtData, tData, semData] = await Promise.all([
        api.getSubjects(),
        api.getRoomTypes(),
        api.getTeachers(),
        api.getSemesters(),
      ]);
      setSubjects(sData || []);
      setRoomTypes(rtData || []);
      setTeachers(tData || []);
      setSemesters(semData || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createSubject(formData);
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      alert("Failed to save subject: " + err.message);
    }
  };

  const handleDeleteSubject = async (id: number) => {
    if (!confirm("Are you sure you want to delete this course?")) return;
    try {
      await api.deleteSubject(id);
      loadData();
    } catch (err: any) {
      alert("Failed to delete subject: " + err.message);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 font-sans">
        {/* Header */}
        <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-zinc-900 dark:text-white" />
              Course &amp; Subject Curriculum
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Configure weekly credit hours, lecture vs practical period splits, required lab room types, and eligible faculty.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Add Course
          </button>
        </div>

        {/* Subjects Table */}
        <div className="rounded-2xl border border-zinc-200 bg-white shadow-xs overflow-hidden dark:border-zinc-800 dark:bg-zinc-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-zinc-100 border-b border-zinc-200 text-[11px] font-bold text-zinc-700 uppercase tracking-wider dark:bg-zinc-800/80 dark:border-zinc-800 dark:text-zinc-300">
                  <th className="py-3 px-4">Subject &amp; Code</th>
                  <th className="py-3 px-4">Program &amp; Semester</th>
                  <th className="py-3 px-4">Weekly Breakdown</th>
                  <th className="py-3 px-4">Required Room Type</th>
                  <th className="py-3 px-4">Eligible Teachers</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {subjects.map((sub) => (
                  <tr key={sub.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                    <td className="py-3.5 px-4 font-semibold text-zinc-900 dark:text-white">
                      <div className="flex items-center gap-2.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-zinc-900 dark:bg-zinc-100 shrink-0" />
                        <div>
                          <div className="font-bold text-sm text-zinc-900 dark:text-white">
                            {sub.name}
                          </div>
                          <div className="text-[11px] font-mono font-bold text-zinc-600 dark:text-zinc-400">
                            {sub.code}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-zinc-600 dark:text-zinc-300">
                      {sub.program_name || "BCA"} &ndash; {sub.semester_name || `Sem ${sub.semester_id}`}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5 text-[11px]">
                        <div><span className="font-bold text-zinc-900 dark:text-white">{sub.weekly_periods}</span> Total Periods / Week</div>
                        <div className="text-zinc-500 dark:text-zinc-400">
                          {sub.lecture_periods} Lecture + {sub.practical_periods} Lab
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold bg-zinc-100 border border-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200">
                        <DoorOpen className="h-3 w-3" />
                        {sub.required_room_type_name || "Classroom"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {sub.eligible_teacher_names && sub.eligible_teacher_names.length > 0 ? (
                          sub.eligible_teacher_names.map((tName: string, tIdx: number) => (
                            <span
                              key={tIdx}
                              className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700"
                            >
                              {tName}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-zinc-400">Any faculty</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDeleteSubject(sub.id)}
                        className="p-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-white cursor-pointer transition-colors"
                        title="Delete Course"
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

        {/* Create Subject Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 max-h-[90vh] overflow-y-auto">
              <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-4">
                Register New Course / Subject
              </h3>
              <form onSubmit={handleCreateSubject} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Course Code</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. BCA 101"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      className="w-full rounded-xl border border-zinc-200 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Subject Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Digital Logic"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full rounded-xl border border-zinc-200 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Weekly Periods</label>
                    <input
                      type="number"
                      required
                      value={formData.weekly_periods}
                      onChange={(e) => setFormData({ ...formData, weekly_periods: parseInt(e.target.value) })}
                      className="w-full rounded-xl border border-zinc-200 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Lecture Periods</label>
                    <input
                      type="number"
                      required
                      value={formData.lecture_periods}
                      onChange={(e) => setFormData({ ...formData, lecture_periods: parseInt(e.target.value) })}
                      className="w-full rounded-xl border border-zinc-200 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Lab Periods</label>
                    <input
                      type="number"
                      required
                      value={formData.practical_periods}
                      onChange={(e) => setFormData({ ...formData, practical_periods: parseInt(e.target.value) })}
                      className="w-full rounded-xl border border-zinc-200 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Required Room Type</label>
                  <select
                    value={formData.required_room_type_id}
                    onChange={(e) => setFormData({ ...formData, required_room_type_id: Number(e.target.value) })}
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  >
                    {roomTypes.map((rt) => (
                      <option key={rt.id} value={rt.id}>
                        {rt.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-xl border border-zinc-200 px-4 py-2 font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-zinc-900 px-5 py-2 font-bold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 cursor-pointer"
                  >
                    Save Subject
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
