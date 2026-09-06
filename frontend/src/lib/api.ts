const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    "Content-Type": "application/json",
    ...(options?.headers || {}),
  };

  try {
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: `HTTP error ${res.status}` }));
      let errorMsg = `Request failed with status ${res.status}`;
      if (typeof err.detail === "string") {
        errorMsg = err.detail;
      } else if (Array.isArray(err.detail)) {
        errorMsg = err.detail.map((d: any) => d.msg ? `${d.loc ? d.loc.slice(-1)[0] + ": " : ""}${d.msg}` : JSON.stringify(d)).join("; ");
      } else if (err.message) {
        errorMsg = err.message;
      }
      throw new Error(errorMsg);
    }
    return res.json();
  } catch (error: any) {
    if (error.name === "TypeError" && (error.message.includes("fetch") || error.message.includes("Failed to fetch") || error.message.includes("NetworkError"))) {
      const connErr = new Error("Unable to connect to backend server. Please make sure the FastAPI server is running (uvicorn app.main:app --reload --port 8000).");
      console.error(`API Connection Error on ${endpoint}:`, connErr);
      throw connErr;
    }
    console.error(`API Error on ${endpoint}:`, error);
    throw error;
  }
}

// API Service Functions
export const api = {
  // Auth
  login: (credentials: any) => fetchApi<any>("/auth/login", { method: "POST", body: JSON.stringify(credentials) }),
  getMe: () => fetchApi<any>("/auth/me"),

  // Dashboard
  getDashboardStats: () => fetchApi<any>("/dashboard/stats"),

  // Academic Structure
  getFaculties: () => fetchApi<any[]>("/academic/faculties"),
  createFaculty: (data: any) => fetchApi<any>("/academic/faculties", { method: "POST", body: JSON.stringify(data) }),
  getDepartments: () => fetchApi<any[]>("/academic/departments"),
  createDepartment: (data: any) => fetchApi<any>("/academic/departments", { method: "POST", body: JSON.stringify(data) }),
  getPrograms: () => fetchApi<any[]>("/academic/programs"),
  createProgram: (data: any) => fetchApi<any>("/academic/programs", { method: "POST", body: JSON.stringify(data) }),
  getAcademicYears: () => fetchApi<any[]>("/academic/academic-years"),
  getSemesters: (programId?: number) => fetchApi<any[]>(`/academic/semesters${programId ? `?program_id=${programId}` : ""}`),
  getSections: (semesterId?: number) => fetchApi<any[]>(`/academic/sections${semesterId ? `?semester_id=${semesterId}` : ""}`),
  createSection: (data: any) => fetchApi<any>("/academic/sections", { method: "POST", body: JSON.stringify(data) }),
  deleteSection: (id: number) => fetchApi<any>(`/academic/sections/${id}`, { method: "DELETE" }),

  // Teachers & Availability
  getTeachers: (deptId?: number) => fetchApi<any[]>(`/teachers${deptId ? `?department_id=${deptId}` : ""}`),
  getTeacher: (id: number) => fetchApi<any>(`/teachers/${id}`),
  createTeacher: (data: any) => fetchApi<any>("/teachers", { method: "POST", body: JSON.stringify(data) }),
  updateTeacher: (id: number, data: any) => fetchApi<any>(`/teachers/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteTeacher: (id: number) => fetchApi<any>(`/teachers/${id}`, { method: "DELETE" }),
  getTeacherAvailability: (id: number) => fetchApi<any[]>(`/teachers/${id}/availability`),
  updateTeacherAvailabilityBatch: (data: any) => fetchApi<any>("/teachers/availability/batch", { method: "POST", body: JSON.stringify(data) }),

  // Subjects
  getSubjects: (semesterId?: number) => fetchApi<any[]>(`/subjects${semesterId ? `?semester_id=${semesterId}` : ""}`),
  createSubject: (data: any) => fetchApi<any>("/subjects", { method: "POST", body: JSON.stringify(data) }),
  updateSubject: (id: number, data: any) => fetchApi<any>(`/subjects/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteSubject: (id: number) => fetchApi<any>(`/subjects/${id}`, { method: "DELETE" }),

  // Rooms
  getRooms: (roomTypeId?: number) => fetchApi<any[]>(`/rooms${roomTypeId ? `?room_type_id=${roomTypeId}` : ""}`),
  createRoom: (data: any) => fetchApi<any>("/rooms", { method: "POST", body: JSON.stringify(data) }),
  updateRoom: (id: number, data: any) => fetchApi<any>(`/rooms/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteRoom: (id: number) => fetchApi<any>(`/rooms/${id}`, { method: "DELETE" }),
  getRoomTypes: () => fetchApi<any[]>("/rooms/types"),
  createRoomType: (data: any) => fetchApi<any>("/rooms/types", { method: "POST", body: JSON.stringify(data) }),

  // Working Days & Periods
  getWorkingDays: () => fetchApi<any[]>("/periods/days"),
  createWorkingDay: (data: any) => fetchApi<any>("/periods/days", { method: "POST", body: JSON.stringify(data) }),
  updateWorkingDay: (id: number, data: any) => fetchApi<any>(`/periods/days/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  getPeriods: (dayId?: number) => fetchApi<any[]>(`/periods${dayId ? `?day_id=${dayId}` : ""}`),
  createPeriod: (data: any) => fetchApi<any>("/periods", { method: "POST", body: JSON.stringify(data) }),
  updatePeriod: (id: number, data: any) => fetchApi<any>(`/periods/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deletePeriod: (id: number) => fetchApi<any>(`/periods/${id}`, { method: "DELETE" }),
  cloneDayPeriods: (sourceDayId: number, targetDayIds: number[]) => fetchApi<any>("/periods/clone-day", {
    method: "POST",
    body: JSON.stringify({ source_day_id: sourceDayId, target_day_ids: targetDayIds }),
  }),

  // Timetables & Scheduling
  getTimetables: () => fetchApi<any[]>("/timetable"),
  getTimetable: (id: number) => fetchApi<any>(`/timetable/${id}`),
  generateTimetable: (payload: any) => fetchApi<any>("/timetable/generate", { method: "POST", body: JSON.stringify(payload) }),
  validateTimetable: (timetableId: number) => fetchApi<any>(`/timetable/validate?timetable_id=${timetableId}`, { method: "POST" }),
  moveClassSlot: (payload: any) => fetchApi<any>("/timetable/move", { method: "POST", body: JSON.stringify(payload) }),
  swapClassSlots: (payload: any) => fetchApi<any>("/timetable/swap", { method: "POST", body: JSON.stringify(payload) }),
  explainEntry: (timetableId: number, entryId: number) => fetchApi<any>(`/timetable/${timetableId}/explain/${entryId}`),
  publishTimetable: (id: number) => fetchApi<any>(`/timetable/${id}/publish`, { method: "POST" }),
  applyCandidateSolution: (timetableId: number, solutionId: number) => fetchApi<any>(`/timetable/${timetableId}/apply-solution/${solutionId}`, { method: "POST" }),

  // Rules & Weights
  getRules: () => fetchApi<any[]>("/rules"),
  updateRules: (updates: any[]) => fetchApi<any>("/rules/update", { method: "POST", body: JSON.stringify(updates) }),

  // System & Audit
  getNotifications: () => fetchApi<any[]>("/system/notifications"),
  markNotificationsRead: () => fetchApi<any>("/system/notifications/read-all", { method: "POST" }),
  getAuditLogs: () => fetchApi<any[]>("/system/audit-logs"),
  seedDatabase: () => fetchApi<any>("/seed", { method: "POST" }),
};
