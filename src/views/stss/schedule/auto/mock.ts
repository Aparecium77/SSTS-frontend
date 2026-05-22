import type { Schedule } from "@/api/interface/schedule";

export interface AutoTaskView extends Schedule.AutoTaskRecord {
  semesterId: string;
  ruleIds: string[];
  resourceScope: string[];
  preferContinuousCourse: boolean;
  avoidWeekend: boolean;
  note?: string;
  failureReason?: string;
  latestResultId?: string;
}

export interface AutoResultView extends Schedule.AutoTaskResult {
  taskName: string;
  semesterName: string;
  successRate: number;
  conflictBreakdown: Array<{
    label: string;
    count: number;
    level: Schedule.ConflictRecord["level"];
  }>;
  conflicts: Schedule.ConflictRecord[];
}

export const semesterOptions: Schedule.OptionItem[] = [
  { label: "2025-2026 学年第一学期", value: "2025-fall" },
  { label: "2025-2026 学年第二学期", value: "2026-spring" }
];

export const ruleOptions: Schedule.OptionItem[] = [
  { label: "公共课避开周五晚间", value: "rule-01" },
  { label: "教师同一时段不可重复授课", value: "rule-02" },
  { label: "实验课教室容量不低于学生数", value: "rule-03" },
  { label: "专业课优先连排", value: "rule-04" },
  { label: "大一课程上午优先", value: "rule-05" }
];

export const resourceScopeOptions: Schedule.OptionItem[] = [
  { label: "全校资源池", value: "all-campus" },
  { label: "计算机学院", value: "computer-school" },
  { label: "人工智能学院", value: "ai-school" },
  { label: "实验教学中心", value: "lab-center" }
];

export const taskStatusOptions: Schedule.OptionItem[] = [
  { label: "草稿", value: "draft" },
  { label: "排队中", value: "queued" },
  { label: "执行中", value: "running" },
  { label: "已完成", value: "completed" },
  { label: "执行失败", value: "failed" }
];

export const autoTaskRecords: AutoTaskView[] = [
  {
    id: "task-01",
    taskName: "2025 秋季首次排课",
    semesterId: "2025-fall",
    semesterName: "2025-2026 学年第一学期",
    status: "running",
    createdBy: "排课专员",
    createdAt: "2026-05-22 09:00",
    progress: {
      processed: 286,
      total: 420,
      percent: 68
    },
    conflictCount: 9,
    ruleIds: ["rule-01", "rule-02", "rule-03"],
    resourceScope: ["all-campus", "lab-center"],
    preferContinuousCourse: true,
    avoidWeekend: true,
    note: "优先处理实验课和跨校区公共课",
    latestResultId: "result-01"
  },
  {
    id: "task-02",
    taskName: "AI 学院冲突修复重跑",
    semesterId: "2025-fall",
    semesterName: "2025-2026 学年第一学期",
    status: "completed",
    createdBy: "排课专员",
    createdAt: "2026-05-21 15:40",
    progress: {
      processed: 180,
      total: 180,
      percent: 100
    },
    conflictCount: 2,
    ruleIds: ["rule-02", "rule-04"],
    resourceScope: ["ai-school"],
    preferContinuousCourse: true,
    avoidWeekend: false,
    note: "主要针对共授课程的教师冲突",
    latestResultId: "result-02"
  },
  {
    id: "task-03",
    taskName: "计算机学院晚间排课压缩",
    semesterId: "2025-fall",
    semesterName: "2025-2026 学年第一学期",
    status: "failed",
    createdBy: "教务管理员",
    createdAt: "2026-05-20 19:15",
    progress: {
      processed: 96,
      total: 210,
      percent: 46
    },
    conflictCount: 14,
    ruleIds: ["rule-01", "rule-02", "rule-05"],
    resourceScope: ["computer-school"],
    preferContinuousCourse: false,
    avoidWeekend: true,
    note: "尝试压缩周五晚间与周末排课",
    failureReason: "可用大教室容量不足，且教师跨校区约束无法同时满足。",
    latestResultId: "result-03"
  }
];

export const autoTaskResults: AutoResultView[] = [
  {
    taskId: "task-01",
    taskName: "2025 秋季首次排课",
    semesterName: "2025-2026 学年第一学期",
    arrangedCourses: 286,
    unresolvedConflicts: 9,
    generatedAt: "2026-05-22 09:30",
    summary: ["实验课已优先分配容量匹配教室", "公共课晚间排课比例下降 18%", "教师冲突主要集中在跨院共授课程"],
    successRate: 68,
    conflictBreakdown: [
      { label: "教师时间冲突", count: 4, level: "high" },
      { label: "教室容量不足", count: 3, level: "medium" },
      { label: "连排偏好未满足", count: 2, level: "low" }
    ],
    conflicts: [
      {
        id: "auto-conflict-01",
        level: "high",
        title: "教师时间冲突",
        message: "周敏在周四 1-2 节已有《深度学习基础》安排。",
        relatedEntity: "教师：周敏"
      },
      {
        id: "auto-conflict-02",
        level: "medium",
        title: "教室容量预警",
        message: "智行楼 B504 当前可容纳 40 人，低于班级人数 42 人。",
        relatedEntity: "教室：智行楼 B504"
      },
      {
        id: "auto-conflict-03",
        level: "low",
        title: "连排偏好未命中",
        message: "《数据库系统原理》被拆分为两次单节，未满足 2 节连排偏好。",
        relatedEntity: "课程：数据库系统原理"
      }
    ]
  },
  {
    taskId: "task-02",
    taskName: "AI 学院冲突修复重跑",
    semesterName: "2025-2026 学年第一学期",
    arrangedCourses: 180,
    unresolvedConflicts: 2,
    generatedAt: "2026-05-21 16:10",
    summary: ["教师共授冲突已下降至 2 条", "AI 学院专业课连排率提升至 74%", "机房资源已按实验优先策略分配"],
    successRate: 99,
    conflictBreakdown: [
      { label: "教师时间冲突", count: 1, level: "high" },
      { label: "教室容量不足", count: 1, level: "medium" }
    ],
    conflicts: [
      {
        id: "auto-conflict-04",
        level: "high",
        title: "教师共授冲突",
        message: "赵楠同时参与两门跨院共授课程，候选时段仍有重叠。",
        relatedEntity: "教师：赵楠"
      },
      {
        id: "auto-conflict-05",
        level: "medium",
        title: "实验机房容量不足",
        message: "智算实验室 A204 容量 36，低于班级人数 38。",
        relatedEntity: "教室：智算实验室 A204"
      }
    ]
  },
  {
    taskId: "task-03",
    taskName: "计算机学院晚间排课压缩",
    semesterName: "2025-2026 学年第一学期",
    arrangedCourses: 96,
    unresolvedConflicts: 14,
    generatedAt: "2026-05-20 19:40",
    summary: ["周末排课压缩策略已触发", "晚间大教室资源不足导致大量回退", "教师跨校区约束成为主阻塞项"],
    successRate: 46,
    conflictBreakdown: [
      { label: "教师时间冲突", count: 6, level: "high" },
      { label: "教室容量不足", count: 5, level: "medium" },
      { label: "周末禁排未满足", count: 3, level: "low" }
    ],
    conflicts: [
      {
        id: "auto-conflict-06",
        level: "high",
        title: "跨校区教师排课失败",
        message: "李晨在两校区之间通勤窗口不足 40 分钟。",
        relatedEntity: "教师：李晨"
      },
      {
        id: "auto-conflict-07",
        level: "medium",
        title: "大教室容量不足",
        message: "求实楼 A301 已满，无法承接 120 人公共课。",
        relatedEntity: "教室：求实楼 A301"
      }
    ]
  }
];
