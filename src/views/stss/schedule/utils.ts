import type { Schedule } from "@/api/interface/schedule";

export const roomTypeOptions: Schedule.OptionItem<Schedule.ClassroomType>[] = [
  { label: "普通教室", value: "LECTURE" },
  { label: "物理实验室", value: "LAB_PHYSICS" },
  { label: "化学实验室", value: "LAB_CHEMISTRY" },
  { label: "生物实验室", value: "LAB_BIOLOGY" },
  { label: "机房", value: "COMPUTER_LAB" },
  { label: "体育场馆", value: "GYM" }
];

export const dayOptions: Schedule.OptionItem<Schedule.DayOfWeek>[] = [
  { label: "周一", value: 1 },
  { label: "周二", value: 2 },
  { label: "周三", value: 3 },
  { label: "周四", value: 4 },
  { label: "周五", value: 5 },
  { label: "周六", value: 6 },
  { label: "周日", value: 7 }
];

export const weekParityOptions: Schedule.OptionItem<Schedule.WeekParity>[] = [
  { label: "每周", value: "ALL" },
  { label: "单周", value: "ODD" },
  { label: "双周", value: "EVEN" }
];

export const sectionOptions = Array.from({ length: 12 }, (_, index) => index + 1);

const roomTypeLabelMap = Object.fromEntries(roomTypeOptions.map(item => [item.value, item.label])) as Record<
  Schedule.ClassroomType,
  string
>;
const dayLabelMap = Object.fromEntries(dayOptions.map(item => [item.value, item.label])) as Record<Schedule.DayOfWeek, string>;
const parityLabelMap = Object.fromEntries(weekParityOptions.map(item => [item.value, item.label])) as Record<
  Schedule.WeekParity,
  string
>;

export const getRoomTypeLabel = (value?: Schedule.ClassroomType | null) => (value ? (roomTypeLabelMap[value] ?? value) : "-");

export const getDayLabel = (value?: Schedule.DayOfWeek | null) => (value ? (dayLabelMap[value] ?? `周${value}`) : "-");

export const getWeekParityLabel = (value?: Schedule.WeekParity | null) => (value ? (parityLabelMap[value] ?? value) : "-");

export const formatWeeks = (start?: number | null, end?: number | null, parity?: Schedule.WeekParity | null) => {
  if (!start || !end) return "-";
  return `${start}-${end}周 / ${getWeekParityLabel(parity ?? "ALL")}`;
};

export const formatSections = (start?: number | null, end?: number | null) => {
  if (!start || !end) return "-";
  return `${start}-${end}节`;
};

export const formatEntryTime = (entry: Schedule.ScheduleEntry) =>
  `${getDayLabel(entry.day_of_week)} ${formatSections(entry.slot_start, entry.slot_end)} ${formatWeeks(
    entry.week_start,
    entry.week_end,
    entry.week_parity
  )}`;

export const formatCourse = (entry: Schedule.ScheduleEntry) => entry.course_name || entry.course_code || entry.course_id;

export const formatTeachers = (teacherIds?: string[] | null) => (teacherIds?.length ? teacherIds.join(", ") : "-");

export const slotKey = (slot: Schedule.ClassroomSlot) => `${slot.day}-${slot.slot}`;

export const parseSlotKey = (value: string): Schedule.ClassroomSlot => {
  const [day, slot] = value.split("-").map(Number);
  return { day: day as Schedule.DayOfWeek, slot };
};

export const activeInWeek = (entry: Schedule.ScheduleEntry, week?: number | null) => {
  if (!week) return true;
  if (entry.week_start > week || entry.week_end < week) return false;
  if (entry.week_parity === "ODD") return week % 2 === 1;
  if (entry.week_parity === "EVEN") return week % 2 === 0;
  return true;
};
