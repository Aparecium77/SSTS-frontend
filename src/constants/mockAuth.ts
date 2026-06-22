import md5 from "md5";
import type { Login } from "@/api/interface";
import { resolveStudentLogin } from "@/api/modules/score";
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
  /** 成绩模块联调用的真实用户 ID（对应后端 X-User-ID / grade_total.student_id） */
  userId: string;
}

const MOCK_PASSWORD_HASH = md5("123456");
const STUDENT_TOKEN_PREFIX = "token-student-";

/** 常见学号笔误 → 正确学号 */
const STUDENT_LOGIN_ALIASES: Record<string, string> = {
  "20066001": "20266001",
  "20066002": "20266002",
  "20066003": "20266003"
};

const normalizeStudentLoginKey = (raw: string) => {
  const key = raw.trim();
  return STUDENT_LOGIN_ALIASES[key] ?? key;
};

const homeMenu = createMenu("/home/index", "home", "/home/index", "首页", "HomeFilled", { isAffix: true });

const scoreMenuNamesByRole: Record<RoleKey, ScoreMenuName[]> = {
  student: ["scoreQuery", "creditProgress", "personalScoreAnalytics"],
  teacher: ["scoreEntry", "scoreQuery", "scoreChangeRequest", "courseScoreAnalytics"],
  academic_admin: [
    "scoreEntry",
    "scoreQuery",
    "scoreChangeRequest",
    "scoreChangeApproval",
    "scoreAdminGlobal",
    "courseScoreAnalytics"
  ]
};

const scoreMenuForRole = (role: RoleKey) => scoreMenu(scoreMenuNamesByRole[role]);

export const mockUsers: MockUser[] = [
  {
    username: "student",
    passwordHash: MOCK_PASSWORD_HASH,
    name: "联调学生甲（别名）",
    role: "student",
    token: `${STUDENT_TOKEN_PREFIX}SXE001`,
    userId: "SXE001"
  },
  {
    username: "20266001",
    passwordHash: MOCK_PASSWORD_HASH,
    name: "联调学生甲",
    role: "student",
    token: `${STUDENT_TOKEN_PREFIX}SXE001`,
    userId: "SXE001"
  },
  {
    username: "20266002",
    passwordHash: MOCK_PASSWORD_HASH,
    name: "联调学生乙",
    role: "student",
    token: `${STUDENT_TOKEN_PREFIX}SXE002`,
    userId: "SXE002"
  },
  {
    username: "20266003",
    passwordHash: MOCK_PASSWORD_HASH,
    name: "联调学生丙",
    role: "student",
    token: `${STUDENT_TOKEN_PREFIX}SXE003`,
    userId: "SXE003"
  },
  {
    username: "teacher",
    passwordHash: MOCK_PASSWORD_HASH,
    name: "教师用户",
    role: "teacher",
    token: "token-teacher",
    userId: "T001"
  },
  {
    username: "academic_admin",
    passwordHash: MOCK_PASSWORD_HASH,
    name: "教务管理员",
    role: "academic_admin",
    token: "token-academic-admin",
    userId: "A001"
  }
];

const findPresetUser = (loginKey: string) => {
  const normalized = normalizeStudentLoginKey(loginKey);
  return (
    mockUsers.find(user => user.username === loginKey || user.username === normalized) ??
    mockUsers.find(
      user =>
        user.role === "student" &&
        (user.name === loginKey || user.name === normalized || user.name.replace(/（别名）$/, "") === loginKey)
    )
  );
};

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
    scoreAdminGlobal: ["view", "export", "override"],
    courseScoreAnalytics: ["view", "export"]
  }
};

const buildStudentToken = (studentId: string) => `${STUDENT_TOKEN_PREFIX}${studentId}`;

export const getMockUserByToken = (token: string): MockUser | null => {
  const fixed = mockUsers.find(user => user.token === token);
  if (fixed) return fixed;
  if (token.startsWith(STUDENT_TOKEN_PREFIX)) {
    const userId = token.slice(STUDENT_TOKEN_PREFIX.length);
    if (!userId) return null;
    return {
      username: userId,
      passwordHash: "",
      name: `学生 ${userId}`,
      role: "student",
      token,
      userId
    };
  }
  return null;
};

export const mockLogin = async (params: Login.ReqLoginForm) => {
  // LoginForm 提交前已对密码做 md5，勿在此二次哈希
  const passwordHash = (params.password.length === 32 ? params.password : md5(params.password)).toLowerCase();
  if (passwordHash !== MOCK_PASSWORD_HASH.toLowerCase()) {
    return Promise.reject({ code: ResultEnum.ERROR, msg: "密码错误，联调默认密码为 123456", data: null });
  }

  const loginKey = params.username.trim();
  const matchedUser = findPresetUser(loginKey);
  if (matchedUser) {
    return Promise.resolve({
      code: ResultEnum.SUCCESS,
      msg: "登录成功",
      data: {
        access_token: matchedUser.token,
        user_info: {
          name: matchedUser.name,
          role: matchedUser.role,
          user_id: matchedUser.userId
        }
      }
    });
  }

  const rosterLoginKey = normalizeStudentLoginKey(loginKey);
  try {
    const resp = await resolveStudentLogin(rosterLoginKey);
    const profile = resp.data;
    return Promise.resolve({
      code: ResultEnum.SUCCESS,
      msg: "登录成功",
      data: {
        access_token: buildStudentToken(profile.student_id),
        user_info: {
          name: profile.student_name || profile.student_id,
          role: "student",
          user_id: profile.student_id
        }
      }
    });
  } catch (error: any) {
    const isNetwork = error?.message?.includes?.("Network Error");
    const msg = isNetwork
      ? "无法连接成绩服务，请确认后端已启动（端口 8086）"
      : error?.msg ||
        `未找到该学生。请用学号 20266001～20266003、SXE001～003 或姓名「联调学生甲/乙/丙」登录；需先执行 seed_external_import_demo.py 同步名册`;
    return Promise.reject({ code: ResultEnum.ERROR, msg, data: null });
  }
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
