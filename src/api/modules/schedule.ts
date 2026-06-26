import { SCHEDULE_API } from "@/api/config/servicePort";
import type { Schedule } from "@/api/interface/schedule";
import http from "@/api";
import { useUserStore } from "@/stores/modules/user";

const scheduleHeaders = () => {
  const userStore = useUserStore();
  const roleMap: Record<string, string> = {
    academic_admin: "ACADEMIC_ADMIN",
    teacher: "TEACHER",
    student: "STUDENT"
  };
  const userId = userStore.userInfo.userId || userStore.token || "anonymous";
  const role = roleMap[userStore.userInfo.role] ?? userStore.userInfo.role ?? "";

  return {
    headers: {
      "X-User-Id": userId,
      "X-User-ID": userId,
      "X-User-Role": role,
      "X-User-Name": encodeURIComponent(userStore.userInfo.name || "")
    }
  };
};

export const getClassrooms = (params?: { skip?: number; limit?: number }) => {
  return http.get<Schedule.Classroom[]>(`${SCHEDULE_API}/classrooms`, params, scheduleHeaders());
};

export const createClassroom = (params: Schedule.ClassroomCreate) => {
  return http.post<Schedule.Classroom>(`${SCHEDULE_API}/classrooms`, params, scheduleHeaders());
};

export const updateClassroom = (id: number, params: Schedule.ClassroomUpdate) => {
  return http.service.patch(`${SCHEDULE_API}/classrooms/${id}`, params, scheduleHeaders());
};

export const deleteClassroom = (id: number) => {
  return http.delete<null>(`${SCHEDULE_API}/classrooms/${id}`, undefined, scheduleHeaders());
};

export const batchImportClassrooms = (file: File, overwrite = false) => {
  const formData = new FormData();
  formData.append("file", file);
  return http.post<Schedule.ClassroomBatchImportResult>(
    `${SCHEDULE_API}/classrooms/batch-import?overwrite=${overwrite}`,
    formData,
    {
      ...scheduleHeaders(),
      loading: true
    }
  );
};

export const getTeacherPreferences = (params?: { semester?: string; skip?: number; limit?: number }) => {
  return http.get<Schedule.TeacherPreference[]>(`${SCHEDULE_API}/teacher-preferences`, params, scheduleHeaders());
};

export const createTeacherPreference = (params: Schedule.TeacherPreferenceCreate) => {
  return http.post<Schedule.TeacherPreference>(`${SCHEDULE_API}/teacher-preferences`, params, scheduleHeaders());
};

export const updateTeacherPreference = (id: number, params: Schedule.TeacherPreferenceUpdate) => {
  return http.service.patch(`${SCHEDULE_API}/teacher-preferences/${id}`, params, scheduleHeaders());
};

export const deleteTeacherPreference = (id: number) => {
  return http.delete<null>(`${SCHEDULE_API}/teacher-preferences/${id}`, undefined, scheduleHeaders());
};

export const triggerAutoSchedule = (params: Schedule.AutoScheduleRequest) => {
  return http.post<Schedule.AutoScheduleResponse>(`${SCHEDULE_API}/auto-schedule`, params, scheduleHeaders());
};

export const getScheduleStatus = (taskId: string) => {
  return http.get<Schedule.ScheduleStatusResponse>(`${SCHEDULE_API}/schedule-status/${taskId}`, undefined, {
    ...scheduleHeaders(),
    loading: false,
    cancel: false
  });
};

export const getScheduleEntries = (params: Schedule.ScheduleEntryQuery) => {
  return http.get<Schedule.ScheduleEntry[]>(`${SCHEDULE_API}/entries`, params, scheduleHeaders());
};

export const manualAdjustSchedule = (params: Schedule.ManualAdjustRequest) => {
  return http.post<Schedule.ScheduleEntry>(`${SCHEDULE_API}/manual-adjust`, params, scheduleHeaders());
};

export const getTeacherTimetable = (teacherId: string, params: { semester: string; week?: number }) => {
  return http.get<Schedule.TeacherTimetable>(`${SCHEDULE_API}/teachers/${teacherId}/timetable`, params, scheduleHeaders());
};
