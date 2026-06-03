import md5 from "md5";
import type { Login } from "@/api/interface";
import { ResultEnum } from "@/enums/httpEnum";
import { baseInfoMenu } from "@/views/stss/base-info/menu";
import { scheduleMenu } from "@/views/stss/schedule/menu";
import { courseSelectionMenu } from "@/views/stss/course-selection/menu";
import { forumMenu } from "@/views/stss/forum/menu";
import { onlineTestMenu } from "@/views/stss/online-test/menu";
import { scoreMenu, type ScoreMenuName } from "@/views/stss/score/menu";
import { cloneMenuList, createGroup, createMenu } from "@/views/stss/menu";

type RoleKey = "student" | "teacher" | "academic_admin";

interface MockUser {
  username: string;
  passwordHash: string;
  name: string;
  role: RoleKey;
  token: string;
}

const homeMenu = createMenu("/home/index", "home", "/home/index", "首页", "HomeFilled", { isAffix: true });

const scoreMenuNamesByRole: Record<RoleKey, ScoreMenuName[]> = {
  student: ["scoreQuery", "creditProgress", "personalScoreAnalytics"],
  teacher: ["scoreEntry", "scoreQuery", "scoreChangeRequest", "courseScoreAnalytics"],
  academic_admin: [
    "scoreEntry",
    "scoreQuery",
    "scoreChangeRequest",
    "scoreChangeApproval",
    "creditProgress",
    "personalScoreAnalytics",
    "courseScoreAnalytics"
  ]
};

const scoreMenuForRole = (role: RoleKey) => scoreMenu(scoreMenuNamesByRole[role]);

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
  student: [homeMenu, courseSelectionMenu(), forumMenu(), onlineTestMenu(), scoreMenuForRole("student")],
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
    forumMenu(),
    onlineTestMenu(),
    scoreMenuForRole("teacher")
  ],
  academic_admin: [
    homeMenu,
    baseInfoMenu(),
    scheduleMenu(),
    courseSelectionMenu(),
    forumMenu(),
    onlineTestMenu(),
    scoreMenuForRole("academic_admin")
  ]
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
    data: cloneMenuList(menuMap[user.role])
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
