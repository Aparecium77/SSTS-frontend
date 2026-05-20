import type { Login } from "@/api/interface/index";
import { useUserStore } from "@/stores/modules/user";
import { getMockButtonsByToken, getMockMenuByToken, mockLogin, mockLogout } from "@/constants/mockAuth";

// 用户登录
export const loginApi = (params: Login.ReqLoginForm) => {
  return mockLogin(params);
};

// 获取菜单列表
export const getAuthMenuListApi = () => {
  const userStore = useUserStore();
  return getMockMenuByToken(userStore.token);
};

// 获取按钮权限
export const getAuthButtonListApi = () => {
  const userStore = useUserStore();
  return getMockButtonsByToken(userStore.token);
};

// 用户退出登录
export const logoutApi = () => {
  return mockLogout();
};
