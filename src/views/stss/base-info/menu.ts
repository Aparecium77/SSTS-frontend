import { createGroup, createMenu } from "@/views/stss/menu";

// 基础信息管理组可以在这里维护“基础信息管理”板块下的细分页面名称、路径和图标。
export const baseInfoMenu = () =>
  createGroup(
    "/base-info",
    "baseInfo",
    "基础信息管理",
    [
      createMenu("/base-info/users", "baseInfoUsers", "/stss/base-info/users/index", "用户与档案"),
      createMenu("/base-info/resources/course", "baseInfoResourceCourse", "/stss/base-info/resources/course/index", "课程资源"),
      createMenu(
        "/base-info/resources/teacher",
        "baseInfoResourceTeacher",
        "/stss/base-info/resources/teacher/index",
        "教师资源"
      ),
      createMenu(
        "/base-info/resources/classroom",
        "baseInfoResourceClassroom",
        "/stss/base-info/resources/classroom/index",
        "教室资源"
      ),
      createMenu("/base-info/calendar", "baseInfoCalendar", "/stss/base-info/calendar/index", "学期校历"),
      createMenu("/base-info/training-plans", "baseInfoTrainingPlans", "/stss/base-info/training-plans/index", "培养方案"),
      createMenu("/base-info/permissions", "baseInfoPermissions", "/stss/base-info/permissions/index", "权限与回收站")
    ],
    "Management"
  );
