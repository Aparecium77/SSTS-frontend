import { createGroup, createMenu } from "@/views/stss/menu";

// 智能选课组可以在这里维护“选课中心”板块下的细分页面名称、路径和图标。
export const courseSelectionMenu = () =>
  createGroup(
    "/course-selection",
    "courseSelection",
    "选课中心",
    [
      createMenu("/course-selection/study-plans", "studyPlans", "/stss/course-selection/study-plans/index", "培养方案校验"),
      createMenu("/course-selection/search", "courseSearch", "/stss/course-selection/search/index", "课程检索"),
      createMenu("/course-selection/enrollment", "courseEnrollment", "/stss/course-selection/enrollment/index", "选课/退课"),
      createMenu("/course-selection/my-courses", "myEnrollments", "/stss/course-selection/my-courses/index", "我的选课"),
      createMenu("/course-selection/timetable", "myTimetable", "/stss/course-selection/timetable/index", "我的课表"),
      createMenu("/course-selection/ai-advisor", "aiAdvisor", "/stss/course-selection/ai-advisor/index", "AI选课助手"),
      createMenu("/course-selection/roster", "teachingRoster", "/stss/course-selection/roster/index", "任课花名册"),
      createMenu("/course-selection/windows", "courseWindows", "/stss/course-selection/windows/index", "选课窗口配置"),
      createMenu("/course-selection/capacity", "courseCapacity", "/stss/course-selection/capacity/index", "抽签与容量管理"),
      createMenu("/course-selection/monitor", "courseMonitor", "/stss/course-selection/monitor/index", "选课监控")
    ],
    "Reading"
  );
