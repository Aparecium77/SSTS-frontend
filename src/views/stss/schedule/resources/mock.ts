import type { Schedule } from "@/api/interface/schedule";

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

export const resourceTagSuggestions = [
  "Java",
  "算法",
  "多媒体",
  "实验课",
  "核心课",
  "双屏投影",
  "2023级",
  "软件工程",
  "跨院共享",
  "晚间可排"
];

export const resourceStatsSeed: Schedule.ResourceStats = {
  total: 6,
  enabled: 4,
  disabled: 2,
  warningCount: 3
};

export const resourceRecords: Schedule.ResourceRecord[] = [
  {
    id: "res-teacher-01",
    category: "teacher",
    name: "李晨",
    code: "T202301",
    department: "计算机学院",
    status: "enabled",
    ownerName: "教学秘书",
    tags: ["Java", "算法", "晚间可排"],
    updatedAt: "2026-05-18 14:30",
    remark: "周三下午优先安排实验课。"
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
    tags: ["多媒体", "双屏投影"],
    updatedAt: "2026-05-20 09:10",
    remark: "支持双屏投影，适合大班理论课。"
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
    updatedAt: "2026-05-17 18:00",
    remark: "与程序设计基础形成先修关系。"
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
    remark: "本周外出实训，暂停参与调课。"
  },
  {
    id: "res-teacher-02",
    category: "teacher",
    name: "周敏",
    code: "T202318",
    department: "人工智能学院",
    status: "enabled",
    ownerName: "排课专员",
    tags: ["机器学习", "跨院共享"],
    updatedAt: "2026-05-21 11:05",
    remark: "跨院授课频率较高，需优先规避冲突。"
  },
  {
    id: "res-room-02",
    category: "classroom",
    name: "智行楼 B504",
    code: "R-B504",
    department: "人工智能学院",
    status: "disabled",
    ownerName: "实验中心",
    capacity: 40,
    tags: ["实验课", "GPU工作站"],
    updatedAt: "2026-05-19 15:20",
    remark: "设备维护中，预计下周恢复。"
  }
];

const semester: Schedule.SemesterInfo = {
  academicYear: "2025-2026",
  semesterId: "2025-fall",
  semesterName: "2025-2026 学年第一学期",
  startDate: "2025-09-01",
  endDate: "2026-01-16",
  totalWeeks: 20,
  currentWeek: 12
};

export const resourceDetailMap: Record<string, Schedule.ResourceDetail> & { default: Schedule.ResourceDetail } = {
  default: {
    ...resourceRecords[0],
    semester,
    usageRate: 76,
    relatedCourses: ["数据结构", "程序设计基础"]
  },
  "res-teacher-01": {
    ...resourceRecords[0],
    semester,
    usageRate: 82,
    relatedCourses: ["数据结构", "算法设计与分析"]
  },
  "res-room-01": {
    ...resourceRecords[1],
    semester,
    usageRate: 91,
    relatedCourses: ["大学英语", "高等数学", "数据结构"]
  },
  "res-course-01": {
    ...resourceRecords[2],
    semester,
    usageRate: 88,
    relatedCourses: ["数据结构"]
  },
  "res-class-01": {
    ...resourceRecords[3],
    semester,
    usageRate: 64,
    relatedCourses: ["数据结构", "软件工程导论", "操作系统"]
  },
  "res-teacher-02": {
    ...resourceRecords[4],
    semester,
    usageRate: 79,
    relatedCourses: ["机器学习导论", "深度学习基础"]
  },
  "res-room-02": {
    ...resourceRecords[5],
    semester,
    usageRate: 0,
    relatedCourses: ["机器学习实验", "智能系统综合实践"]
  }
};
