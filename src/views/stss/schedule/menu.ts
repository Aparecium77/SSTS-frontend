import { createGroup, createMenu } from "@/views/stss/menu";

// 排课管理组可以在这里维护“排课管理”板块下的细分页面名称、路径和图标。
export const scheduleMenu = (role: "academic_admin" | "teacher" = "academic_admin") => {
  const teacherMenus = [
    createMenu("/schedule/query", "scheduleQuery", "/stss/schedule/query/index", "课表查询"),
    createMenu("/schedule/rules", "scheduleTeacherPreferences", "/stss/schedule/rules/index", "教师排课偏好")
  ];
  const adminMenus = [
    createMenu("/schedule/resources", "scheduleClassrooms", "/stss/schedule/resources/index", "教室管理"),
    createMenu("/schedule/rules", "scheduleTeacherPreferences", "/stss/schedule/rules/index", "教师排课偏好"),
    createMenu("/schedule/auto", "scheduleAuto", "/stss/schedule/auto/index", "自动排课"),
    createMenu("/schedule/manual", "scheduleManual", "/stss/schedule/manual/index", "手工调课"),
    createMenu("/schedule/query", "scheduleQuery", "/stss/schedule/query/index", "课表查询")
  ];

  return createGroup("/schedule", "schedule", "排课管理", role === "teacher" ? teacherMenus : adminMenus, "Calendar");
};
