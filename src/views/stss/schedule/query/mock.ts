import type { Schedule } from "@/api/interface/schedule";

export interface QueryDimensionTarget {
  id: string;
  dimension: Schedule.ScheduleDimension;
  label: string;
  subtitle: string;
}

export interface QueryCalendarCell {
  dayOfWeek: number;
  dayLabel: string;
  records: Schedule.ScheduleRecord[];
}

export const querySemesterOptions: Schedule.OptionItem[] = [
  { label: "2025-2026 学年第一学期", value: "2025-fall" },
  { label: "2025-2026 学年第二学期", value: "2026-spring" }
];

export const queryDimensionOptions: Schedule.OptionItem[] = [
  { label: "教师维度", value: "teacher" },
  { label: "学生维度", value: "student" },
  { label: "班级维度", value: "class" },
  { label: "教室维度", value: "classroom" }
];

export const queryDimensionTargets: QueryDimensionTarget[] = [
  { id: "teacher-li", dimension: "teacher", label: "李晨", subtitle: "计算机学院 / 数据结构" },
  { id: "teacher-zhou", dimension: "teacher", label: "周敏", subtitle: "人工智能学院 / 机器学习导论" },
  { id: "student-lin", dimension: "student", label: "林悦", subtitle: "软件工程 2302 班 / 学号 20230021" },
  { id: "class-se2302", dimension: "class", label: "软件工程 2302 班", subtitle: "38 人 / 2023 级" },
  { id: "class-ai2301", dimension: "class", label: "人工智能 2301 班", subtitle: "42 人 / 2023 级" },
  { id: "room-a301", dimension: "classroom", label: "求实楼 A301", subtitle: "120 座 / 多媒体" },
  { id: "room-b502", dimension: "classroom", label: "智行楼 B502", subtitle: "80 座 / AI 专用教室" }
];

export const queryScheduleRecords: Schedule.ScheduleRecord[] = [
  {
    id: "schedule-01",
    semesterId: "2025-fall",
    academicYear: "2025-2026",
    courseName: "数据结构",
    courseCode: "CS2103",
    teacherName: "李晨",
    className: "软件工程 2302 班",
    classroomName: "求实楼 A301",
    studentCount: 38,
    weekText: "1-16 周",
    date: "2026-05-26",
    status: "published",
    timeSlot: {
      dayOfWeek: 1,
      sectionStart: 1,
      sectionEnd: 2,
      weekLabel: "第 12 周",
      timeRange: "08:00-09:35"
    }
  },
  {
    id: "schedule-02",
    semesterId: "2025-fall",
    academicYear: "2025-2026",
    courseName: "机器学习导论",
    courseCode: "AI3201",
    teacherName: "周敏",
    className: "人工智能 2301 班",
    classroomName: "智行楼 B502",
    studentCount: 42,
    weekText: "3-16 周",
    date: "2026-05-27",
    status: "adjusting",
    timeSlot: {
      dayOfWeek: 2,
      sectionStart: 3,
      sectionEnd: 4,
      weekLabel: "第 12 周",
      timeRange: "10:10-11:45"
    }
  },
  {
    id: "schedule-03",
    semesterId: "2025-fall",
    academicYear: "2025-2026",
    courseName: "软件工程项目实训",
    courseCode: "SE3305",
    teacherName: "李晨",
    className: "软件工程 2302 班",
    classroomName: "工程训练中心 204",
    studentCount: 38,
    weekText: "5-16 周",
    date: "2026-05-28",
    status: "published",
    timeSlot: {
      dayOfWeek: 3,
      sectionStart: 5,
      sectionEnd: 6,
      weekLabel: "第 12 周",
      timeRange: "13:30-15:05"
    }
  },
  {
    id: "schedule-04",
    semesterId: "2025-fall",
    academicYear: "2025-2026",
    courseName: "大学英语",
    courseCode: "GE1102",
    teacherName: "陈雅",
    className: "计算机类 2405 班",
    classroomName: "博学楼 C204",
    studentCount: 46,
    weekText: "1-18 周",
    date: "2026-05-29",
    status: "draft",
    timeSlot: {
      dayOfWeek: 4,
      sectionStart: 7,
      sectionEnd: 8,
      weekLabel: "第 12 周",
      timeRange: "15:40-17:15"
    }
  },
  {
    id: "schedule-05",
    semesterId: "2025-fall",
    academicYear: "2025-2026",
    courseName: "离散数学",
    courseCode: "CS1208",
    teacherName: "王骁",
    className: "软件工程 2302 班",
    classroomName: "求实楼 A301",
    studentCount: 38,
    weekText: "1-16 周",
    date: "2026-05-30",
    status: "published",
    timeSlot: {
      dayOfWeek: 5,
      sectionStart: 1,
      sectionEnd: 2,
      weekLabel: "第 12 周",
      timeRange: "08:00-09:35"
    }
  },
  {
    id: "schedule-06",
    semesterId: "2025-fall",
    academicYear: "2025-2026",
    courseName: "深度学习基础",
    courseCode: "AI3302",
    teacherName: "周敏",
    className: "人工智能 2301 班",
    classroomName: "智行楼 B502",
    studentCount: 42,
    weekText: "6-16 周",
    date: "2026-05-30",
    status: "published",
    timeSlot: {
      dayOfWeek: 5,
      sectionStart: 3,
      sectionEnd: 4,
      weekLabel: "第 12 周",
      timeRange: "10:10-11:45"
    }
  }
];

export const queryScheduleDetails: Record<string, Schedule.ScheduleDetail> = {
  "schedule-01": {
    ...queryScheduleRecords[0],
    classCode: "SE2302",
    teacherCode: "T202301",
    classroomCode: "R-A301",
    remark: "核心课优先安排在周初上午。"
  },
  "schedule-02": {
    ...queryScheduleRecords[1],
    classCode: "AI2301",
    teacherCode: "T202188",
    classroomCode: "R-B502",
    remark: "当前存在手工调课申请，等待审批。"
  },
  "schedule-03": {
    ...queryScheduleRecords[2],
    classCode: "SE2302",
    teacherCode: "T202301",
    classroomCode: "LAB-204",
    remark: "实训课连续双节安排。"
  },
  "schedule-04": {
    ...queryScheduleRecords[3],
    classCode: "CS2405",
    teacherCode: "T202077",
    classroomCode: "R-C204",
    remark: "公共课草稿待发布。"
  },
  "schedule-05": {
    ...queryScheduleRecords[4],
    classCode: "SE2302",
    teacherCode: "T202046",
    classroomCode: "R-A301",
    remark: "固定周五上午排课。"
  },
  "schedule-06": {
    ...queryScheduleRecords[5],
    classCode: "AI2301",
    teacherCode: "T202188",
    classroomCode: "R-B502",
    remark: "与机器学习导论共用专用实验环境。"
  }
};

export const queryCalendarDayLabels = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
