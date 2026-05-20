import md5 from "md5";
import type { Login } from "@/api/interface";
import { ResultEnum } from "@/enums/httpEnum";

type RoleKey = "student" | "teacher" | "academic_admin";

interface MockUser {
  username: string;
  passwordHash: string;
  name: string;
  role: RoleKey;
  token: string;
}

const baseMeta = {
  isLink: "",
  isHide: false,
  isFull: false,
  isAffix: false,
  isKeepAlive: true
};

const createMenu = (
  path: string,
  name: string,
  component: string,
  title: string,
  icon = "Menu",
  extraMeta: Partial<Menu.MetaProps> = {}
): Menu.MenuOptions => ({
  path,
  name,
  component,
  meta: { ...baseMeta, icon, title, ...extraMeta }
});

const createGroup = (
  path: string,
  name: string,
  title: string,
  children: Menu.MenuOptions[],
  icon = "Menu",
  redirect = children[0]?.path
): Menu.MenuOptions => ({
  path,
  name,
  redirect,
  meta: { ...baseMeta, icon, title },
  children
});

const homeMenu = createMenu("/home/index", "home", "/home/index", "首页", "HomeFilled", { isAffix: true });

const baseInfoMenu = createGroup(
  "/base-info",
  "baseInfo",
  "基础信息管理",
  [
    createMenu("/base-info/users", "baseInfoUsers", "/stss/base-info/users/index", "用户与档案"),
    createMenu("/base-info/resources", "baseInfoResources", "/stss/base-info/resources/index", "课程/教师/教室"),
    createMenu("/base-info/calendar", "baseInfoCalendar", "/stss/base-info/calendar/index", "学期校历"),
    createMenu("/base-info/training-plans", "baseInfoTrainingPlans", "/stss/base-info/training-plans/index", "培养方案"),
    createMenu("/base-info/permissions", "baseInfoPermissions", "/stss/base-info/permissions/index", "权限与回收站")
  ],
  "Management"
);

const scheduleMenu = createGroup(
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

const courseSelectionMenu = createGroup(
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

const forumMenu = createGroup(
  "/forum",
  "forum",
  "论坛交流",
  [
    createMenu("/forum/notices", "forumNotices", "/stss/forum/notices/index", "公告"),
    createMenu("/forum/course-boards", "forumCourseBoards", "/stss/forum/course-boards/index", "课程论坛"),
    createMenu("/forum/posts", "forumPosts", "/stss/forum/posts/index", "发帖/回帖"),
    createMenu("/forum/moderation", "forumModeration", "/stss/forum/moderation/index", "内容审核"),
    createMenu("/forum/search", "forumSearch", "/stss/forum/search/index", "检索")
  ],
  "ChatDotRound"
);

const onlineTestMenu = createGroup(
  "/online-test",
  "onlineTest",
  "在线测试",
  [
    createMenu("/online-test/question-bank", "questionBank", "/stss/online-test/question-bank/index", "题库管理"),
    createMenu("/online-test/papers", "papers", "/stss/online-test/papers/index", "组卷管理"),
    createMenu("/online-test/entry", "examEntry", "/stss/online-test/entry/index", "考试入口"),
    createMenu("/online-test/grading", "examGrading", "/stss/online-test/grading/index", "阅卷与发布"),
    createMenu("/online-test/analytics", "examAnalytics", "/stss/online-test/analytics/index", "测试分析")
  ],
  "EditPen"
);

const scoreMenu = createGroup(
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

export const mockUsers: MockUser[] = [
  {
    username: "student",
    passwordHash: md5("123456"),
    name: "学生用户",
    role: "student",
    token: "token-student"
  },
  {
    username: "teacher",
    passwordHash: md5("123456"),
    name: "教师用户",
    role: "teacher",
    token: "token-teacher"
  },
  {
    username: "academic_admin",
    passwordHash: md5("123456"),
    name: "教务管理员",
    role: "academic_admin",
    token: "token-academic-admin"
  }
];

const menuMap: Record<RoleKey, Menu.MenuOptions[]> = {
  student: [homeMenu, courseSelectionMenu, forumMenu, onlineTestMenu, scoreMenu],
  teacher: [
    homeMenu,
    createGroup(
      "/schedule",
      "schedule",
      "排课管理",
      [createMenu("/schedule/query", "scheduleQuery", "/stss/schedule/query/index", "课表查询")],
      "Calendar"
    ),
    createGroup(
      "/course-selection",
      "courseSelection",
      "选课中心",
      [createMenu("/course-selection/roster", "teachingRoster", "/stss/course-selection/roster/index", "任课花名册")],
      "Reading"
    ),
    forumMenu,
    onlineTestMenu,
    scoreMenu
  ],
  academic_admin: [homeMenu, baseInfoMenu, scheduleMenu, courseSelectionMenu, forumMenu, onlineTestMenu, scoreMenu]
};

const buttonMap: Record<RoleKey, Login.ResAuthButtons> = {
  student: {
    home: ["view"],
    studyPlans: ["view", "save", "validate"],
    courseSearch: ["view", "detail"],
    courseEnrollment: ["add", "drop", "swap"],
    myEnrollments: ["view"],
    myTimetable: ["view", "export"],
    aiAdvisor: ["view", "recommend", "accept"],
    forumNotices: ["view"],
    forumCourseBoards: ["view"],
    forumPosts: ["view", "create", "reply"],
    forumSearch: ["view"],
    examEntry: ["view", "start", "submit"],
    examAnalytics: ["view"],
    scoreQuery: ["view"],
    creditProgress: ["view"],
    personalScoreAnalytics: ["view"]
  },
  teacher: {
    home: ["view"],
    scheduleQuery: ["view", "export"],
    teachingRoster: ["view", "export"],
    forumNotices: ["view"],
    forumCourseBoards: ["view"],
    forumPosts: ["view", "create", "reply"],
    forumSearch: ["view"],
    questionBank: ["view"],
    papers: ["view"],
    examEntry: ["view"],
    examGrading: ["view", "grade", "publish"],
    examAnalytics: ["view", "export"],
    scoreEntry: ["view", "save", "submit", "import"],
    scoreQuery: ["view", "export"],
    scoreChangeRequest: ["view", "create"],
    courseScoreAnalytics: ["view", "export"]
  },
  academic_admin: {
    home: ["view"],
    baseInfoUsers: ["view", "create", "edit", "delete"],
    baseInfoResources: ["view", "create", "edit", "delete"],
    baseInfoCalendar: ["view", "create", "edit", "publish"],
    baseInfoTrainingPlans: ["view", "create", "edit", "publish"],
    baseInfoPermissions: ["view", "edit", "restore"],
    scheduleResources: ["view", "create", "edit"],
    scheduleRules: ["view", "create", "edit"],
    scheduleAuto: ["view", "run"],
    scheduleManual: ["view", "adjust"],
    schedulePublish: ["view", "publish"],
    scheduleQuery: ["view", "export"],
    studyPlans: ["view"],
    courseSearch: ["view", "detail"],
    courseEnrollment: ["view"],
    myEnrollments: ["view"],
    myTimetable: ["view"],
    aiAdvisor: ["view"],
    teachingRoster: ["view", "export"],
    courseWindows: ["view", "create", "edit"],
    courseCapacity: ["view", "draw", "adjust"],
    courseMonitor: ["view"],
    forumNotices: ["view", "create", "edit"],
    forumCourseBoards: ["view"],
    forumPosts: ["view"],
    forumModeration: ["view", "approve", "reject"],
    forumSearch: ["view"],
    questionBank: ["view", "create", "edit"],
    papers: ["view", "create", "edit"],
    examEntry: ["view"],
    examGrading: ["view", "publish"],
    examAnalytics: ["view", "export"],
    scoreEntry: ["view"],
    scoreQuery: ["view", "export"],
    scoreChangeRequest: ["view"],
    scoreChangeApproval: ["view", "approve", "reject"],
    creditProgress: ["view"],
    personalScoreAnalytics: ["view"],
    courseScoreAnalytics: ["view", "export"]
  }
};

export const getMockUserByToken = (token: string) => mockUsers.find(user => user.token === token) ?? null;

export const mockLogin = (params: Login.ReqLoginForm) => {
  const matchedUser = mockUsers.find(user => user.username === params.username && user.passwordHash === params.password);
  if (!matchedUser) {
    return Promise.reject({ code: ResultEnum.ERROR, msg: "用户名或密码错误", data: null });
  }

  return Promise.resolve({
    code: ResultEnum.SUCCESS,
    msg: "登录成功",
    data: {
      access_token: matchedUser.token,
      user_info: {
        name: matchedUser.name,
        role: matchedUser.role
      }
    }
  });
};

export const getMockMenuByToken = (token: string) => {
  const user = getMockUserByToken(token);
  if (!user) return Promise.reject({ code: ResultEnum.OVERDUE, msg: "登录已失效", data: [] });

  return Promise.resolve({
    code: ResultEnum.SUCCESS,
    msg: "获取菜单成功",
    data: menuMap[user.role]
  });
};

export const getMockButtonsByToken = (token: string) => {
  const user = getMockUserByToken(token);
  if (!user) return Promise.reject({ code: ResultEnum.OVERDUE, msg: "登录已失效", data: {} });

  return Promise.resolve({
    code: ResultEnum.SUCCESS,
    msg: "获取按钮权限成功",
    data: buttonMap[user.role]
  });
};

export const mockLogout = () =>
  Promise.resolve({
    code: ResultEnum.SUCCESS,
    msg: "退出成功",
    data: null
  });
