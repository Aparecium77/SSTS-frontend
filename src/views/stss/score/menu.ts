import { createGroup, createMenu } from "@/views/stss/menu";

export type ScoreMenuName =
  | "scoreEntry"
  | "scoreQuery"
  | "scoreChangeRequest"
  | "scoreChangeApproval"
  | "creditProgress"
  | "personalScoreAnalytics"
  | "courseScoreAnalytics";

const scoreMenuItems: Record<ScoreMenuName, Menu.MenuOptions> = {
  scoreEntry: createMenu("/score/entry", "scoreEntry", "/stss/score/entry/index", "成绩录入"),
  scoreQuery: createMenu("/score/query", "scoreQuery", "/stss/score/query/index", "成绩查询"),
  scoreChangeRequest: createMenu("/score/change-request", "scoreChangeRequest", "/stss/score/change-request/index", "改分申请"),
  scoreChangeApproval: createMenu(
    "/score/change-approval",
    "scoreChangeApproval",
    "/stss/score/change-approval/index",
    "改分审批"
  ),
  creditProgress: createMenu("/score/credit-progress", "creditProgress", "/stss/score/credit-progress/index", "学分进展"),
  personalScoreAnalytics: createMenu(
    "/score/personal-analytics",
    "personalScoreAnalytics",
    "/stss/score/personal-analytics/index",
    "个人成绩统计"
  ),
  courseScoreAnalytics: createMenu(
    "/score/course-analytics",
    "courseScoreAnalytics",
    "/stss/score/course-analytics/index",
    "课程成绩分析"
  )
};

const allScoreMenuNames = Object.keys(scoreMenuItems) as ScoreMenuName[];

export const scoreMenu = (visibleMenuNames: ScoreMenuName[] = allScoreMenuNames) =>
  createGroup(
    "/score",
    "score",
    "成绩管理",
    visibleMenuNames.map(name => scoreMenuItems[name]),
    "DataAnalysis"
  );
