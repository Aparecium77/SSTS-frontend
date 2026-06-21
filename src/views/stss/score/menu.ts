import { createGroup, createMenu } from "@/views/stss/menu";

// 成绩管理组可以在这里维护“成绩管理”板块下的细分页面名称、路径和图标。
export const scoreMenu = () =>
  createGroup(
    "/score",
    "score",
    "成绩管理",
    [
      createMenu("/score/entry", "scoreEntry", "/stss/score/entry/index", "成绩录入"),
      createMenu("/score/query", "scoreQuery", "/stss/score/query/index", "成绩查询"),
      createMenu("/score/change-request", "scoreChangeRequest", "/stss/score/change-request/index", "改分申请"),
      createMenu("/score/change-approval", "scoreChangeApproval", "/stss/score/change-approval/index", "改分审批"),
      createMenu("/score/credit-progress", "creditProgress", "/stss/score/credit-progress/index", "学分进展"),
      createMenu("/score/personal-analytics", "personalScoreAnalytics", "/stss/score/personal-analytics/index", "个人成绩统计"),
      createMenu("/score/course-analytics", "courseScoreAnalytics", "/stss/score/course-analytics/index", "课程成绩分析")
    ],
    "DataAnalysis"
  );
