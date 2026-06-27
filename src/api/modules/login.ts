import type { Login } from "@/api/interface/index";
import { useUserStore } from "@/stores/modules/user";
import { getMockButtonsByToken, getMockMenuByToken } from "@/constants/mockAuth";
import { baseInfoMenu } from "@/views/stss/base-info/menu";
import { scheduleMenu } from "@/views/stss/schedule/menu";
import { courseSelectionMenu } from "@/views/stss/course-selection/menu";
import { forumMenu } from "@/views/stss/forum/menu";
import { onlineTestMenu } from "@/views/stss/online-test/menu";
import { scoreMenu, type ScoreMenuName } from "@/views/stss/score/menu";
import { cloneMenuList, createMenu } from "@/views/stss/menu";
import http from "@/api";

type RoleKey = "student" | "teacher" | "academic_admin";
type AuthLoginResponse = {
  access_token: string;
  refresh_token?: string;
  user_id?: string;
  username?: string;
  role?: string;
  permissions?: string[];
  user_info?: {
    user_id?: string;
    id?: string | number;
    username?: string;
    name?: string;
    role?: string;
  };
};

const homeMenu = createMenu("/home/index", "home", "/home/index", "首页", "HomeFilled", { isAffix: true });
const profileMenu = createMenu("/profile", "profile", "/stss/base-info/profile/index", "个人中心", "User");
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

// 菜单/按钮的 role → 数据映射（与 mockAuth.ts 保持一致，但不需要 token 匹配）
const menuMap: Record<RoleKey, Menu.MenuOptions[]> = {
  student: [
    homeMenu,
    profileMenu,
    courseSelectionMenu("student"),
    forumMenu(),
    onlineTestMenu("student"),
    scoreMenuForRole("student")
  ],
  teacher: [
    homeMenu,
    profileMenu,
    scheduleMenu(),
    courseSelectionMenu("teacher"),
    forumMenu(),
    onlineTestMenu("teacher"),
    scoreMenuForRole("teacher")
  ],
  academic_admin: [
    homeMenu,
    profileMenu,
    baseInfoMenu(),
    scheduleMenu(),
    courseSelectionMenu("academic_admin"),
    forumMenu(),
    onlineTestMenu("teacher"),
    scoreMenuForRole("academic_admin")
  ]
};

const buttonMap: Record<RoleKey, Record<string, string[]>> = {
  student: { home: ["view"] },
  teacher: { home: ["view"] },
  academic_admin: {
    home: ["view"],
    baseInfoUsers: ["view", "create", "edit", "delete"],
    baseInfoResourceCourse: ["view", "create", "edit", "delete"],
    baseInfoResourceTeacher: ["view", "create", "edit", "delete"],
    baseInfoResourceClassroom: ["view", "create", "edit", "delete"],
    baseInfoCalendar: ["view", "create", "edit", "publish", "delete"],
    baseInfoTrainingPlans: ["view", "create", "edit", "publish", "delete"],
    baseInfoPermissions: ["view", "edit", "restore", "delete"]
  }
};

const roleMap: Record<string, RoleKey> = {
  STUDENT: "student",
  SYS_STUDENT: "student",
  TEACHER: "teacher",
  SYS_TEACHER: "teacher",
  ADMIN: "academic_admin",
  DEAN: "academic_admin",
  ACADEMIC_ADMIN: "academic_admin",
  SYS_ADMIN: "academic_admin",
  admin: "academic_admin",
  dean: "academic_admin",
  academic_admin: "academic_admin",
  teacher: "teacher",
  student: "student"
};

const normalizeRole = (role = "", username = "") => {
  const rawRole = String(role || "").trim();
  const direct = roleMap[rawRole] ?? roleMap[rawRole.toUpperCase()] ?? roleMap[rawRole.toLowerCase()];
  if (direct) return direct;
  const loginKey = String(username || "")
    .trim()
    .toLowerCase();
  if (loginKey === "student" || /^20\d+$/.test(loginKey)) return "student";
  if (loginKey === "teacher") return "teacher";
  if (loginKey === "academic_admin" || loginKey === "admin") return "academic_admin";
  return rawRole;
};
const unwrapLoginResponse = (res: any) => ((res?.data ?? res) || {}) as AuthLoginResponse;

// 用户登录（走 Gateway /auth/login）
export const loginApi = async (params: Login.ReqLoginForm) => {
  const res = await http.post("/auth/login", params);
  const d = unwrapLoginResponse(res);
  const userStore = useUserStore();
  const userId = String(d.user_id ?? d.user_info?.user_id ?? d.user_info?.id ?? "");
  const username = d.username || d.user_info?.username || d.user_info?.name || params.username;
  const role = normalizeRole(d.role || d.user_info?.role || "", username);
  userStore.setToken(d.access_token);
  userStore.setRefreshToken(d.refresh_token || "");
  userStore.setUserId(userId);
  userStore.setUserInfo({ name: username, role, userId });
  return res;
};

// 获取菜单列表（Gateway token 无法匹配 mock 用户，直接用 store 里的 role 查菜单）
export const getAuthMenuListApi = () => {
  const userStore = useUserStore();
  const role = userStore.userInfo.role as RoleKey;
  if (role && menuMap[role]) {
    return Promise.resolve({ code: 0, msg: "获取菜单成功", data: cloneMenuList(menuMap[role]) });
  }
  return getMockMenuByToken(userStore.token);
};

// 获取按钮权限
export const getAuthButtonListApi = () => {
  const userStore = useUserStore();
  const role = userStore.userInfo.role as RoleKey;
  if (role && buttonMap[role]) {
    return Promise.resolve({ code: 0, msg: "获取按钮权限成功", data: buttonMap[role] });
  }
  return getMockButtonsByToken(userStore.token);
};

// 用户退出登录（Gateway /auth/logout 不强制要求 body）
export const logoutApi = async () => {
  const userStore = useUserStore();
  try {
    if (userStore.refreshToken) {
      await http.post("/auth/logout", { refresh_token: userStore.refreshToken });
    }
  } catch {
    // 忽略 logout 接口错误，本地始终清除登录态
  }
};
