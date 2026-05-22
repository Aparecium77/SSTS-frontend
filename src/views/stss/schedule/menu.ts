import { createGroup, createMenu } from "@/views/stss/menu";

// 排课管理组可以在这里维护“排课管理”板块下的细分页面名称、路径和图标。
export const scheduleMenu = () =>
  createGroup(
    "/schedule",
    "schedule",
    "排课管理",
    [
      createMenu("/schedule/resources", "scheduleResources", "/stss/schedule/resources/index", "教学资源"),
      createMenu("/schedule/rules", "scheduleRules", "/stss/schedule/rules/index", "排课规则"),
      createMenu("/schedule/auto", "scheduleAuto", "/stss/schedule/auto/index", "自动排课"),
      createMenu("/schedule/manual", "scheduleManual", "/stss/schedule/manual/index", "手工调课"),
      createMenu("/schedule/publish", "schedulePublish", "/stss/schedule/publish/index", "课表发布"),
      createMenu("/schedule/query", "scheduleQuery", "/stss/schedule/query/index", "课表查询")
    ],
    "Calendar"
  );
