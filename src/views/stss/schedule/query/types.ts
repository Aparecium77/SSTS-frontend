import type { Schedule } from "@/api/interface/schedule";

export interface QueryEntryView {
  entry: Schedule.ScheduleEntry;
  course: string;
  teachers: string;
  classroom: string;
  timeText: string;
}
