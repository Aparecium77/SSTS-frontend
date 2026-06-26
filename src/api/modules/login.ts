import type { Login } from "@/api/interface/index";
import { useUserStore } from "@/stores/modules/user";
import { getMockButtonsByToken, getMockMenuByToken } from "@/constants/mockAuth";
import { baseInfoMenu } from "@/views/stss/base-info/menu";
import { scheduleMenu } from "@/views/stss/schedule/menu";
import { courseSelectionMenu } from "@/views/stss/course-selection/menu";
import { forumMenu } from "@/views/stss/forum/menu";
import { onlineTestMenu } from "@/views/stss/online-test/menu";
import { scoreMenu } from "@/views/stss/score/menu";
import { cloneMenuList, createMenu } from "@/views/stss/menu";
import http from "@/api";

type RoleKey = "student" | "teacher" | "academic_admin";
type AuthLoginResponse = {
  access_token: string;
  refresh_token: string;
  user_id: string;
  username: string;
  role: string;
  permissions?: string[];
};

const homeMenu = createMenu("/home/index", "home", "/home/index", "首页", "HomeFilled", { isAffix: true });
const profileMenu = createMenu("/profile", "profile", "/stss/base-info/profile/index", "个人中心", "User");

// 菜单/按钮的 role → 数据映射（与 mockAuth.ts 保持一致，但不需要 token 匹配）
const menuMap: Record<RoleKey, Menu.MenuOptions[]> = {
  student: [homeMenu, profileMenu, courseSelectionMenu(), forumMenu(), onlineTestMenu(), scoreMenu()],
  teacher: [homeMenu, profileMenu, scheduleMenu(), courseSelectionMenu(), forumMenu(), onlineTestMenu(), scoreMenu()],
  academic_admin: [
    homeMenu,
    profileMenu,
    baseInfoMenu(),
    scheduleMenu(),
    courseSelectionMenu(),
    forumMenu(),
    onlineTestMenu(),
    scoreMenu()
  ]
};

const buttonMap: Record<RoleKey, Record<string, string[]>> = {
  student: { home: ["view"] },
  teacher: { home: ["view"] },
  academic_admin: { home: ["view"], baseInfoUsers: ["view", "create", "edit", "delete"] }
};

const roleMap: Record<string, RoleKey> = {
  STUDENT: "student",
  SYS_STUDENT: "student",
  TEACHER: "teacher",
  SYS_TEACHER: "teacher",
  ACADEMIC_ADMIN: "academic_admin",
  SYS_ADMIN: "academic_admin",
  academic_admin: "academic_admin",
  teacher: "teacher",
  student: "student"
};

const normalizeRole = (role = "") => roleMap[role] ?? role;
const unwrapLoginResponse = (res: any) => ((res?.data ?? res) || {}) as AuthLoginResponse;

// 用户登录（走 Gateway /auth/login）
export const loginApi = async (params: Login.ReqLoginForm) => {
  const res = await http.post("/auth/login", params);
  const d = unwrapLoginResponse(res);
  const userStore = useUserStore();
  userStore.setToken(d.access_token);
  userStore.setRefreshToken(d.refresh_token);
  userStore.setUserId(d.user_id || "");
  userStore.setUserInfo({ name: d.username || params.username, role: normalizeRole(d.role) });
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
