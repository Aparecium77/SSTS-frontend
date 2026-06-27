export namespace Schedule {
  export type ClassroomType = "LECTURE" | "LAB_PHYSICS" | "LAB_CHEMISTRY" | "LAB_BIOLOGY" | "COMPUTER_LAB" | "GYM";
  export type DayOfWeek = 1 | 2 | 3 | 4 | 5 | 6 | 7;
  export type WeekParity = "ALL" | "ODD" | "EVEN";
  export type ScheduleTaskStatus = "PENDING" | "STARTED" | "PROGRESS" | "SUCCESS" | "FAILURE" | "RETRY" | "REVOKED" | string;

  export interface OptionItem<T = string> {
    label: string;
    value: T;
    description?: string;
  }

  export interface ClassroomSlot {
    day: DayOfWeek;
    slot: number;
  }

  export interface Classroom {
    id: number;
    code: string;
    name: string;
    campus: string;
    building: string;
    capacity: number;
    room_type: ClassroomType;
    available_time: ClassroomSlot[];
    is_active: boolean;
  }

  export interface ClassroomCreate {
    code: string;
    name: string;
    campus: string;
    building: string;
    capacity: number;
    room_type: ClassroomType;
    available_time: ClassroomSlot[];
  }

  export interface ClassroomUpdate {
    name?: string;
    campus?: string;
    building?: string;
    capacity?: number;
    room_type?: ClassroomType;
    available_time?: ClassroomSlot[];
    is_active?: boolean;
  }

  export interface ClassroomImportFailure {
    row: number;
    code?: string | null;
    error: string;
  }

  export interface ClassroomBatchImportResult {
    success: number;
    failed: ClassroomImportFailure[];
  }

  export interface TeacherPreference {
    id: number;
    teacher_id: string;
    semester: string;
    course_id: string | null;
    campus: string | null;
    building: string | null;
    classroom_code: string | null;
    room_type: ClassroomType | null;
    day_of_week: DayOfWeek | null;
    slot_start: number | null;
    slot_end: number | null;
    week_start: number | null;
    week_end: number | null;
    week_parity: WeekParity | null;
    is_negative: boolean;
    created_at: string;
    updated_at: string;
  }

  export interface TeacherPreferenceCreate {
    semester: string;
    course_id?: string | null;
    campus?: string | null;
    building?: string | null;
    classroom_code?: string | null;
    room_type?: ClassroomType | null;
    day_of_week?: DayOfWeek | null;
    slot_start?: number | null;
    slot_end?: number | null;
    week_start?: number | null;
    week_end?: number | null;
    week_parity?: WeekParity | null;
    is_negative: boolean;
  }

  export type TeacherPreferenceUpdate = Partial<TeacherPreferenceCreate>;

  export interface AutoScheduleRequest {
    semester: string;
  }

  export interface AutoScheduleResponse {
    task_id: string;
    semester: string;
  }

  export interface ScheduleStatusResponse {
    task_id: string;
    status: ScheduleTaskStatus;
    progress: number;
    message: string;
    result_summary: Record<string, unknown> | null;
  }

  export interface ScheduleEntry {
    id: number;
    semester: string;
    offering_id: string;
    course_id: string;
    course_code: string | null;
    course_name: string | null;
    teacher_ids: string[];
    classroom_id: number;
    day_of_week: DayOfWeek;
    slot_start: number;
    slot_end: number;
    week_start: number;
    week_end: number;
    week_parity: WeekParity;
  }

  export interface ScheduleEntryQuery {
    semester: string;
    teacher_id?: string;
    course_id?: string;
    offering_id?: string;
  }

  export interface ManualAdjustRequest {
    entry_id: number;
    new_teacher_ids?: string[] | null;
    new_classroom_id?: number | null;
    new_day_of_week?: DayOfWeek | null;
    new_slot_start?: number | null;
    new_slot_end?: number | null;
    new_week_start?: number | null;
    new_week_end?: number | null;
    new_week_parity?: WeekParity | null;
  }

  export interface TeacherTimetable {
    teacher_id: string;
    semester: string;
    week: number | null;
    entries: ScheduleEntry[];
  }
}
