import type { Schedule } from "@/api/interface/schedule";

export interface ManualCourseOption {
  id: string;
  courseName: string;
  teacherName: string;
  className: string;
  currentSlot: string;
}

export interface ManualPreviewRecord {
  id: string;
  courseName: string;
  beforeSlot: string;
  afterSlot: string;
  classroomName: string;
  effectSummary: string;
}

export interface ManualApprovalOption {
  label: string;
  value: Schedule.AdjustmentStatus | "all";
}

export const manualApprovalOptions: ManualApprovalOption[] = [
  { label: "全部状态", value: "all" },
  { label: "待审批", value: "pending" },
  { label: "已通过", value: "approved" },
  { label: "已驳回", value: "rejected" }
];

export const manualCourseOptions: ManualCourseOption[] = [
  {
    id: "schedule-02",
    courseName: "机器学习导论",
    teacherName: "周敏",
    className: "人工智能 2301 班",
    currentSlot: "周二 3-4 节 / 智行楼 B502"
  },
  {
    id: "schedule-01",
    courseName: "数据结构",
    teacherName: "李晨",
    className: "软件工程 2302 班",
    currentSlot: "周一 1-2 节 / 求实楼 A301"
  },
  {
    id: "schedule-03",
    courseName: "软件工程项目实训",
    teacherName: "李晨",
    className: "软件工程 2302 班",
    currentSlot: "周三 5-6 节 / 工程训练中心 204"
  }
];

export const manualCurrentSchedules: Schedule.ScheduleRecord[] = [
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
  }
];

export const manualAdjustmentRecords: Schedule.AdjustmentRecord[] = [
  {
    id: "adjust-01",
    scheduleId: "schedule-02",
    courseName: "机器学习导论",
    originSlot: "周二 3-4 节 / 智行楼 B502",
    targetSlot: "周四 1-2 节 / 智行楼 B504",
    applicant: "周敏",
    status: "pending",
    submittedAt: "2026-05-21 14:10"
  },
  {
    id: "adjust-02",
    scheduleId: "schedule-01",
    courseName: "数据结构",
    originSlot: "周一 1-2 节 / 求实楼 A301",
    targetSlot: "周三 1-2 节 / 求实楼 A302",
    applicant: "李晨",
    status: "approved",
    submittedAt: "2026-05-19 10:25"
  },
  {
    id: "adjust-03",
    scheduleId: "schedule-03",
    courseName: "软件工程项目实训",
    originSlot: "周三 5-6 节 / 工程训练中心 204",
    targetSlot: "周五 7-8 节 / 工程训练中心 206",
    applicant: "李晨",
    status: "rejected",
    submittedAt: "2026-05-18 15:40"
  }
];

export const manualConflictRecords: Schedule.ConflictRecord[] = [
  {
    id: "conflict-01",
    level: "high",
    title: "教师时间冲突",
    message: "周敏在周四 1-2 节已有《深度学习基础》安排。",
    relatedEntity: "教师：周敏"
  },
  {
    id: "conflict-02",
    level: "medium",
    title: "教室容量预警",
    message: "智行楼 B504 当前可容纳 40 人，低于班级人数 42 人。",
    relatedEntity: "教室：智行楼 B504"
  },
  {
    id: "conflict-03",
    level: "low",
    title: "连排偏好未满足",
    message: "调整后将打散实验课连续排课偏好。",
    relatedEntity: "规则：连排优先"
  }
];

export const manualPreviewRecords: ManualPreviewRecord[] = [
  {
    id: "preview-01",
    courseName: "机器学习导论",
    beforeSlot: "周二 3-4 节 / 智行楼 B502",
    afterSlot: "周四 1-2 节 / 智行楼 B504",
    classroomName: "智行楼 B504",
    effectSummary: "教师冲突需先处理，教室容量存在轻微不足。"
  },
  {
    id: "preview-02",
    courseName: "数据结构",
    beforeSlot: "周一 1-2 节 / 求实楼 A301",
    afterSlot: "周三 1-2 节 / 求实楼 A302",
    classroomName: "求实楼 A302",
    effectSummary: "可避开学院例会时间，无明显冲突。"
  }
];

export const manualDefaultForm: Schedule.AdjustmentForm = {
  scheduleId: "schedule-02",
  reason: "教师参加省级教研活动，申请调整上课时间。",
  targetDate: "2026-05-29",
  targetDayOfWeek: 4,
  targetSectionStart: 1,
  targetSectionEnd: 2,
  targetClassroomId: "room-b504"
};
