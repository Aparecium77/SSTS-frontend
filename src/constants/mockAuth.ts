import { ResultEnum } from "@/enums/httpEnum";
import { baseInfoMenu } from "@/views/stss/base-info/menu";
import { scheduleMenu } from "@/views/stss/schedule/menu";
import { courseSelectionMenu } from "@/views/stss/course-selection/menu";
import { forumMenu } from "@/views/stss/forum/menu";
import { onlineTestMenu } from "@/views/stss/online-test/menu";
import { scoreMenu } from "@/views/stss/score/menu";
import { cloneMenuList, createGroup, createMenu } from "@/views/stss/menu";

type RoleKey = "student" | "teacher" | "academic_admin";

interface MockUser {
  name: string;
  role: RoleKey;
}

const homeMenu = createMenu("/home/index", "home", "/home/index", "首页", "HomeFilled", { isAffix: true });

export const mockUsers: MockUser[] = [
  {
    name: "学生用户",
    role: "student"
  },
  {
    name: "教师用户",
    role: "teacher"
  },
  {
    name: "教务管理员",
    role: "academic_admin"
  }
];

const menuMap: Record<RoleKey, Menu.MenuOptions[]> = {
  student: [homeMenu, courseSelectionMenu("student"), forumMenu(), onlineTestMenu(), scoreMenu()],
  teacher: [
    homeMenu,
    createGroup(
      "/schedule",
      "schedule",
      "排课管理",
      [createMenu("/schedule/query", "scheduleQuery", "/stss/schedule/query/index", "课表查询")],
      "Calendar"
    ),
    courseSelectionMenu("teacher"),
    forumMenu(),
    onlineTestMenu(),
    scoreMenu()
  ],
  academic_admin: [
    homeMenu,
    baseInfoMenu(),
    scheduleMenu(),
    courseSelectionMenu("academic_admin"),
    forumMenu(),
    onlineTestMenu(),
    scoreMenu()
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

const normalizeRole = (role?: string): RoleKey => {
  if (role === "student" || role === "teacher" || role === "academic_admin") return role;
  if (role === "admin" || role === "sys_admin") return "academic_admin";
  return "student";
};

export const getMockMenuByRole = (role?: string) =>
  Promise.resolve({
    code: ResultEnum.SUCCESS,
    msg: "获取菜单成功",
    data: cloneMenuList(menuMap[normalizeRole(role)])
  });

export const getMockButtonsByRole = (role?: string) =>
  Promise.resolve({
    code: ResultEnum.SUCCESS,
    msg: "获取按钮权限成功",
    data: buttonMap[normalizeRole(role)]
  });

export const mockLogout = () =>
  Promise.resolve({
    code: ResultEnum.SUCCESS,
    msg: "退出成功",
    data: null
  });
