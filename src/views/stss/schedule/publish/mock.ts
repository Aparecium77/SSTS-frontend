import type { Schedule } from "@/api/interface/schedule";

export const semesterOptions: Schedule.OptionItem[] = [
  { label: "2025-2026 学年第一学期", value: "2025-fall" },
  { label: "2025-2026 学年第二学期", value: "2026-spring" }
];

export const publishScopeOptions: Schedule.OptionItem[] = [
  { label: "全校", value: "school" },
  { label: "计算机学院", value: "computer" },
  { label: "人工智能学院", value: "ai" },
  { label: "基础教学部", value: "general" }
];

export const publishTargetOptions: Record<string, Schedule.OptionItem[]> = {
  school: [
    { label: "全校教师与学生", value: "all-users" },
    { label: "全校教室资源", value: "all-rooms" }
  ],
  computer: [
    { label: "计算机学院 2023 级", value: "computer-2023" },
    { label: "计算机学院 教师", value: "computer-teachers" }
  ],
  ai: [
    { label: "人工智能学院 2023 级", value: "ai-2023" },
    { label: "人工智能学院 教师", value: "ai-teachers" }
  ],
  general: [
    { label: "基础教学部 公共课", value: "general-course" },
    { label: "基础教学部 教师", value: "general-teachers" }
  ]
};

export const publishRecords: Schedule.PublishRecord[] = [
  {
    id: "publish-01",
    version: "V2026.05.20",
    semesterName: "2025-2026 学年第一学期",
    publishedAt: "2026-05-20 18:30",
    publishedBy: "教务管理员",
    status: "published",
    targetScope: "全校",
    note: "首轮正式发布，覆盖教师端与学生端。"
  },
  {
    id: "publish-02",
    version: "V2026.05.18",
    semesterName: "2025-2026 学年第一学期",
    publishedAt: "2026-05-18 20:10",
    publishedBy: "教务管理员",
    status: "pending",
    targetScope: "计算机学院",
    note: "等待学院排课秘书最终确认。"
  },
  {
    id: "publish-03",
    version: "V2026.05.14",
    semesterName: "2025-2026 学年第一学期",
    publishedAt: "2026-05-14 16:05",
    publishedBy: "教务管理员",
    status: "rolledBack",
    targetScope: "人工智能学院",
    note: "因教师冲突回滚，需重新校验跨院授课安排。"
  }
];
