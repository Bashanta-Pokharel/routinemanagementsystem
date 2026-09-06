"use client";

import React, { useState, useEffect } from "react";
import { DoorOpen, Plus, Trash2, Monitor, Edit3, Check, X, AlertCircle, CheckCircle2 } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function RoomsPage() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states for Create & Edit
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<any | null>(null);

  // Inline capacity editing state
  const [editingCapacityId, setEditingCapacityId] = useState<number | null>(null);
  const [inlineCapacity, setInlineCapacity] = useState<number>(50);

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

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

  const showToast = (type: "success" | "error", text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [rData, rtData] = await Promise.all([
        api.getRooms(),
        api.getRoomTypes(),
      ]);
      setRooms(rData || []);
      setRoomTypes(rtData || []);
    } catch (e: any) {
      console.error(e);
      showToast("error", e.message || "Failed to load rooms");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingRoom(null);
    setFormData({
      room_number: "",
      building: "Academic Block A",
      capacity: 50,
      room_type_id: roomTypes[0]?.id || 1,
      equipment_info: "",
      is_active: true,
    });
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (room: any) => {
    setEditingRoom(room);
    setFormData({
      room_number: room.room_number,
      building: room.building || "Academic Block A",
      capacity: room.capacity || 50,
      room_type_id: room.room_type_id || roomTypes[0]?.id || 1,
      equipment_info: room.equipment_info || "",
      is_active: room.is_active ?? true,
    });
    setIsCreateModalOpen(true);
  };

  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingRoom) {
        await api.updateRoom(editingRoom.id, formData);
        showToast("success", `Updated ${formData.room_number} successfully!`);
      } else {
        await api.createRoom(formData);
        showToast("success", `Created ${formData.room_number} successfully!`);
      }
      setIsCreateModalOpen(false);
      setEditingRoom(null);
      loadData();
    } catch (err: any) {
      showToast("error", "Save failed: " + err.message);
    }
  };

  const handleStartInlineEdit = (room: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCapacityId(room.id);
    setInlineCapacity(room.capacity);
  };

  const handleSaveInlineCapacity = async (room: any) => {
    const newCap = Number(inlineCapacity);
    if (isNaN(newCap) || newCap < 1) {
      showToast("error", "Capacity must be at least 1 student");
      setEditingCapacityId(null);
      return;
    }

    try {
      await api.updateRoom(room.id, {
        room_number: room.room_number,
        building: room.building,
        capacity: newCap,
        room_type_id: room.room_type_id,
        department_id: room.department_id,
        equipment_info: room.equipment_info,
        is_active: room.is_active,
      });

      setRooms((prev) =>
        prev.map((r) => (r.id === room.id ? { ...r, capacity: newCap } : r))
      );
      setEditingCapacityId(null);
      showToast("success", `Updated ${room.room_number} capacity to ${newCap}`);
    } catch (err: any) {
      showToast("error", "Failed to update capacity: " + err.message);
      setEditingCapacityId(null);
    }
  };

  const handleQuickStepCapacity = async (room: any, delta: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newCap = Math.max(5, (room.capacity || 50) + delta);
    try {
      await api.updateRoom(room.id, {
        room_number: room.room_number,
        building: room.building,
        capacity: newCap,
        room_type_id: room.room_type_id,
        department_id: room.department_id,
        equipment_info: room.equipment_info,
        is_active: room.is_active,
      });

      setRooms((prev) =>
        prev.map((r) => (r.id === room.id ? { ...r, capacity: newCap } : r))
      );
      showToast("success", `Capacity: ${newCap} students`);
    } catch (err: any) {
      showToast("error", "Failed to adjust capacity: " + err.message);
    }
  };

  const handleDeleteRoom = async (id: number) => {
    if (!confirm("Are you sure you want to deactivate this room?")) return;
    try {
      await api.deleteRoom(id);
      showToast("success", "Room deactivated successfully");
      loadData();
    } catch (err: any) {
      showToast("error", "Failed to delete room: " + err.message);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Toast Notification */}
        {toastMessage && (
          <div
            className={cn(
              "fixed top-4 right-4 z-50 flex items-center gap-2 rounded-2xl px-4 py-3 text-xs font-bold shadow-xl animate-in slide-in-from-top-2",
              toastMessage.type === "success"
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "bg-zinc-800 text-zinc-100 border border-zinc-700"
            )}
          >
            {toastMessage.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            {toastMessage.text}
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
              <DoorOpen className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              Rooms, Labs &amp; Seating Capacity Limits
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Configure classrooms, specialized computer labs, and edit student seating capacities. Click on any capacity tag to edit directly.
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 px-4 py-2.5 text-xs font-bold text-white shadow-xs active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Add Room / Lab
          </button>
        </div>

        {/* Room Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {rooms.map((room) => {
            const isLab = room.room_type_name?.includes("Lab");
            const isInline = editingCapacityId === room.id;

            return (
              <div
                key={room.id}
                className="group rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 flex flex-col justify-between space-y-3 transition-all hover:border-emerald-300 dark:hover:border-emerald-700/80"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold text-sm border border-emerald-200/80 dark:border-emerald-800/80">
                      {isLab ? <Monitor className="h-5 w-5" /> : <DoorOpen className="h-5 w-5" />}
                    </div>

                    {/* Editable Capacity Badge */}
                    {isInline ? (
                      <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg border border-zinc-300 dark:border-zinc-700">
                        <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400 pl-1">Cap:</span>
                        <input
                          type="number"
                          min="1"
                          max="500"
                          value={inlineCapacity}
                          onChange={(e) => setInlineCapacity(Number(e.target.value))}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveInlineCapacity(room);
                            if (e.key === "Escape") setEditingCapacityId(null);
                          }}
                          autoFocus
                          className="w-12 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white font-mono font-bold text-xs px-1 py-0.5 rounded border border-zinc-300 dark:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                        <button
                          onClick={() => handleSaveInlineCapacity(room)}
                          className="p-1 text-emerald-600 dark:text-emerald-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded cursor-pointer"
                          title="Save"
                        >
                          <Check className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => setEditingCapacityId(null)}
                          className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded cursor-pointer"
                          title="Cancel"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => handleQuickStepCapacity(room, -5, e)}
                          className="opacity-0 group-hover:opacity-100 h-5 w-5 flex items-center justify-center rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-bold transition-opacity cursor-pointer"
                          title="Decrease capacity by 5"
                        >
                          -
                        </button>
                        <button
                          onClick={(e) => handleStartInlineEdit(room, e)}
                          className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-mono border border-emerald-200 dark:border-emerald-800 hover:border-emerald-400 cursor-pointer transition-all"
                          title="Click to edit capacity"
                        >
                          Cap: {room.capacity}
                        </button>
                        <button
                          onClick={(e) => handleQuickStepCapacity(room, 5, e)}
                          className="opacity-0 group-hover:opacity-100 h-5 w-5 flex items-center justify-center rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-bold transition-opacity cursor-pointer"
                          title="Increase capacity by 5"
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="mt-3">
                    <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                      {room.room_number}
                    </h3>
                    <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mt-0.5">
                      {room.room_type_name || "Classroom"}
                    </p>
                    <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1">
                      {room.building} &bull; {room.equipment_info || "Standard Projector Setup"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-zinc-100 pt-3 text-xs dark:border-zinc-800">
                  <span className="text-[10px] font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    Operational
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(room)}
                      className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white cursor-pointer transition-colors"
                      title="Edit Room Details & Capacity"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteRoom(room.id)}
                      className="p-1.5 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 cursor-pointer transition-colors"
                      title="Deactivate Room"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal for Create / Edit Room */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-4">
                {editingRoom ? "Edit Room / Facility" : "Add Room / Facility"}
              </h3>
              <form onSubmit={handleSaveRoom} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Room Number / Title (e.g. Room 101, Computer Lab 1)
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.room_number}
                    onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Seating Capacity (Students)
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                      className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Room Type
                    </label>
                    <select
                      value={formData.room_type_id}
                      onChange={(e) => setFormData({ ...formData, room_type_id: Number(e.target.value) })}
                      className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
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
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Building / Location
                  </label>
                  <input
                    type="text"
                    value={formData.building}
                    onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Equipment / Facilities
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 40 PCs, Projector, AC, Digital Logic Kits"
                    value={formData.equipment_info}
                    onChange={(e) => setFormData({ ...formData, equipment_info: e.target.value })}
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreateModalOpen(false);
                      setEditingRoom(null);
                    }}
                    className="rounded-xl border border-zinc-200 px-4 py-2 font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-zinc-900 px-5 py-2 font-bold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 cursor-pointer"
                  >
                    {editingRoom ? "Save Changes" : "Create Room"}
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
