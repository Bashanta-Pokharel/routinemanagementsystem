"use client";

import React, { useState, useEffect } from "react";
import { DoorOpen, Plus, Trash2, Edit3, Monitor, Layers } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { api } from "@/lib/api";

export default function RoomsPage() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    room_number: "",
    building: "Academic Block A",
    capacity: 50,
    room_type_id: 1,
    equipment_info: "",
    is_active: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rData, rtData] = await Promise.all([
        api.getRooms(),
        api.getRoomTypes(),
      ]);
      setRooms(rData || []);
      setRoomTypes(rtData || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createRoom(formData);
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      alert("Failed to create room: " + err.message);
    }
  };

  const handleDeleteRoom = async (id: number) => {
    if (!confirm("Are you sure you want to deactivate this room?")) return;
    try {
      await api.deleteRoom(id);
      loadData();
    } catch (err: any) {
      alert("Failed to delete room: " + err.message);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <DoorOpen className="h-5 w-5 text-blue-600" />
              Rooms & Computer Labs
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Configure classrooms, specialized computer labs, hardware testing centers, and student seating capacity limits.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm shadow-blue-500/25 hover:bg-blue-700 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Add Room / Lab
          </button>
        </div>

        {/* Room Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {rooms.map((room) => {
            const isLab = room.room_type_name?.includes("Lab");
            return (
              <div
                key={room.id}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-2xl font-bold text-sm ${
                      isLab
                        ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400"
                        : "bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400"
                    }`}>
                      {isLab ? <Monitor className="h-5 w-5" /> : <DoorOpen className="h-5 w-5" />}
                    </div>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      Cap: {room.capacity}
                    </span>
                  </div>

                  <div className="mt-3">
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      {room.room_number}
                    </h3>
                    <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mt-0.5">
                      {room.room_type_name || "Classroom"}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {room.building} &bull; {room.equipment_info || "Standard Projector Setup"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
                  <span className="text-[10px] font-medium text-emerald-600 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Operational
                  </span>
                  <button
                    onClick={() => handleDeleteRoom(room.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                    title="Deactivate Room"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
                Add Room / Facility
              </h3>
              <form onSubmit={handleCreateRoom} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Room Number / Title (e.g. Room 101, Computer Lab 1)
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.room_number}
                    onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Seating Capacity
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Room Type
                    </label>
                    <select
                      value={formData.room_type_id}
                      onChange={(e) => setFormData({ ...formData, room_type_id: Number(e.target.value) })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    >
                      {roomTypes.map((rt) => (
                        <option key={rt.id} value={rt.id}>
                          {rt.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Equipment / Facilities
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 40 PCs, Projector, AC"
                    value={formData.equipment_info}
                    onChange={(e) => setFormData({ ...formData, equipment_info: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-blue-600 px-5 py-2 font-bold text-white hover:bg-blue-700 cursor-pointer"
                  >
                    Create Room
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
