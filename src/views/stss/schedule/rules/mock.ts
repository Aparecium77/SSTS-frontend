import type { Schedule } from "@/api/interface/schedule";

export const ruleCategoryOptions: Schedule.OptionItem[] = [
  { label: "时间规则", value: "time", description: "控制上课时段、周次和禁排时间窗" },
  { label: "教师冲突", value: "teacherConflict", description: "限制教师同一时段重复授课或跨校区冲突" },
  { label: "教室容量", value: "classroomCapacity", description: "校验教室容量、设备标签与课程类型匹配" },
  { label: "连排规则", value: "courseArrangement", description: "约束连续节次、排课密度与碎片化程度" }
];

export const ruleScopeOptions: Schedule.OptionItem[] = [
  { label: "全校公共课", value: "全校公共课" },
  { label: "全校教师", value: "全校教师" },
  { label: "实验类课程", value: "实验类课程" },
  { label: "人工智能学院", value: "人工智能学院" },
  { label: "计算机学院", value: "计算机学院" }
];

export const ruleRecords: Schedule.RuleDetail[] = [
  {
    id: "rule-01",
    category: "time",
    name: "公共课避开周五晚间",
    code: "TIME-001",
    priority: 1,
    status: "enabled",
    scope: "全校公共课",
    updatedAt: "2026-05-21 08:30",
    description: "减少跨校区晚间调度压力，优先将公共课安排在周内白天时段。",
    conditions: [
      { field: "dayOfWeek", operator: "notIn", value: ["5"] },
      { field: "sectionRange", operator: "notIn", value: ["9-10"] }
    ],
    effectSummary: ["降低公共课晚间教室占用", "减少跨校区教师返程冲突", "为临时调课保留夜间冗余"]
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
    description: "教师冲突作为硬约束，遇到重复授课时直接拦截编排。",
    conditions: [
      { field: "teacherId", operator: "uniqueBy", value: "timeSlot" },
      { field: "crossCampusInterval", operator: ">=", value: 40 }
    ],
    effectSummary: ["同一教师同一时间仅允许一门课", "跨校区授课预留通勤时间", "自动排课阶段优先拦截冲突"]
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
    description: "实验课需优先匹配容量和设备达标的机房或实验室。",
    conditions: [
      { field: "courseType", operator: "=", value: "实验课" },
      { field: "classroomCapacity", operator: ">=", value: 40 },
      { field: "classroomTags", operator: "contains", value: ["多媒体"] }
    ],
    effectSummary: ["防止超容量排课", "保证实验课程设备可用", "减少发布后的容量回滚"]
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
    description: "减少课程碎片化，优先生成 2-3 节连排方案。",
    conditions: [
      { field: "department", operator: "=", value: "人工智能学院" },
      { field: "continuousSections", operator: "between", value: "2-3" }
    ],
    effectSummary: ["提升专业课连续授课体验", "降低学生跨楼频次", "为实验课前后衔接留出窗口"]
  },
  {
    id: "rule-05",
    category: "time",
    name: "大一课程上午优先",
    code: "TIME-005",
    priority: 2,
    status: "enabled",
    scope: "计算机学院",
    updatedAt: "2026-05-22 09:10",
    description: "控制低年级基础课程优先安排在上午，提高课堂到课稳定性。",
    conditions: [
      { field: "grade", operator: "=", value: "2025级" },
      { field: "sectionStart", operator: "<=", value: 4 }
    ],
    effectSummary: ["基础课集中在精力更稳定的时段", "减轻晚间教室抢占", "提升教学巡视覆盖效率"]
  }
];
