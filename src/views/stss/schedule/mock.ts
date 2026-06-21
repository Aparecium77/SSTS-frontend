import type { Schedule } from "@/api/interface/schedule";

export const semesterOptions: Schedule.OptionItem[] = [
  { label: "2025-2026 学年第一学期", value: "2025-fall" },
  { label: "2025-2026 学年第二学期", value: "2026-spring" }
];

export const departmentOptions: Schedule.OptionItem[] = [
  { label: "计算机学院", value: "computer" },
  { label: "人工智能学院", value: "ai" },
  { label: "基础教学部", value: "general" }
];

export const resourceCategoryOptions: Schedule.OptionItem[] = [
  { label: "教师资源", value: "teacher" },
  { label: "教室资源", value: "classroom" },
  { label: "课程资源", value: "course" },
  { label: "班级资源", value: "class" }
];

export const ruleCategoryOptions: Schedule.OptionItem[] = [
  { label: "时间规则", value: "time" },
  { label: "教师冲突", value: "teacherConflict" },
  { label: "教室容量", value: "classroomCapacity" },
  { label: "连排规则", value: "courseArrangement" }
];

export const dimensionOptions: Schedule.OptionItem[] = [
  { label: "教师维度", value: "teacher" },
  { label: "学生维度", value: "student" },
  { label: "班级维度", value: "class" },
  { label: "教室维度", value: "classroom" }
];

export const resourceRecords: Schedule.ResourceRecord[] = [
  {
    id: "res-teacher-01",
    category: "teacher",
    name: "李晨",
    code: "T202301",
    department: "计算机学院",
    status: "enabled",
    ownerName: "教学秘书",
    tags: ["Java", "算法"],
    updatedAt: "2026-05-18 14:30",
    remark: "周三下午优先排实验课"
  },
  {
    id: "res-room-01",
    category: "classroom",
    name: "求实楼 A301",
    code: "R-A301",
    department: "基础教学部",
    status: "enabled",
    ownerName: "教务处",
    capacity: 120,
    tags: ["多媒体", "阶梯教室"],
    updatedAt: "2026-05-20 09:10",
    remark: "支持双屏投影"
  },
  {
    id: "res-course-01",
    category: "course",
    name: "数据结构",
    code: "CS2103",
    department: "计算机学院",
    status: "enabled",
    ownerName: "课程负责人",
    tags: ["核心课", "48学时"],
    updatedAt: "2026-05-17 18:00"
  },
  {
    id: "res-class-01",
    category: "class",
    name: "软件工程 2302 班",
    code: "SE2302",
    department: "计算机学院",
    status: "disabled",
    ownerName: "辅导员",
    capacity: 38,
    tags: ["2023级", "软件工程"],
    updatedAt: "2026-05-16 10:45",
    remark: "本周外出实训"
  }
];

export const ruleRecords: Schedule.RuleRecord[] = [
  {
    id: "rule-01",
    category: "time",
    name: "公共课避开周五晚间",
    code: "TIME-001",
    priority: 1,
    status: "enabled",
    scope: "全校公共课",
    updatedAt: "2026-05-21 08:30",
    description: "减少跨校区晚间调度压力"
  },
  {
    id: "rule-02",
    category: "teacherConflict",
    name: "教师同一时段不可重复授课",
    code: "TEACHER-002",
    priority: 1,
    status: "enabled",
    scope: "全校教师",
    updatedAt: "2026-05-19 16:20",
    description: "教师冲突为硬约束"
  },
  {
    id: "rule-03",
    category: "classroomCapacity",
    name: "实验课教室容量不低于学生数",
    code: "ROOM-003",
    priority: 2,
    status: "enabled",
    scope: "实验类课程",
    updatedAt: "2026-05-18 13:15",
    description: "防止超容量排课"
  },
  {
    id: "rule-04",
    category: "courseArrangement",
    name: "专业课优先连排",
    code: "COURSE-004",
    priority: 3,
    status: "disabled",
    scope: "人工智能学院",
    updatedAt: "2026-05-16 09:50",
    description: "减少课程碎片化"
  }
];

export const scheduleRecords: Schedule.ScheduleRecord[] = [
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
  }
];

export const adjustmentRecords: Schedule.AdjustmentRecord[] = [
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
  }
];

export const conflictRecords: Schedule.ConflictRecord[] = [
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
  }
];

export const publishRecords: Schedule.PublishRecord[] = [
  {
    id: "publish-01",
    version: "V2026.05.20",
    semesterName: "2025-2026 学年第一学期",
    publishedAt: "2026-05-20 18:30",
    publishedBy: "教务管理员",
    status: "published",
    targetScope: "全校"
  },
  {
    id: "publish-02",
    version: "V2026.05.14",
    semesterName: "2025-2026 学年第一学期",
    publishedAt: "2026-05-14 16:05",
    publishedBy: "教务管理员",
    status: "rolledBack",
    targetScope: "计算机学院",
    note: "因教师冲突回滚"
  }
];

export const autoTaskRecords: Schedule.AutoTaskRecord[] = [
  {
    id: "task-01",
    taskName: "2025 秋季首次排课",
    semesterName: "2025-2026 学年第一学期",
    status: "running",
    createdBy: "排课专员",
    createdAt: "2026-05-22 09:00",
    progress: {
      processed: 286,
      total: 420,
      percent: 68
    },
    conflictCount: 9
  },
  {
    id: "task-02",
    taskName: "AI 学院冲突修复重跑",
    semesterName: "2025-2026 学年第一学期",
    status: "completed",
    createdBy: "排课专员",
    createdAt: "2026-05-21 15:40",
    progress: {
      processed: 180,
      total: 180,
      percent: 100
    },
    conflictCount: 2
  }
];

export const autoTaskResult: Schedule.AutoTaskResult = {
  taskId: "task-01",
  arrangedCourses: 286,
  unresolvedConflicts: 9,
  generatedAt: "2026-05-22 09:30",
  summary: ["实验课已优先分配容量匹配教室", "公共课晚间排课比例下降 18%", "教师冲突主要集中在跨院共授课程"]
};
