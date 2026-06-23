import type { Login } from "@/api/interface/index";
import { useUserStore } from "@/stores/modules/user";
import { getMockButtonsByRole, getMockMenuByRole } from "@/constants/mockAuth";

const gatewayBase = () => {
  const base = ((import.meta.env as any).VITE_API_URL || "").replace(/\/$/, "");
  return base.endsWith("/api") ? base.slice(0, -4) : base;
};

// 用户登录
export const loginApi = (params: Login.ReqLoginForm) => {
  return fetch(`${gatewayBase()}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(params)
  }).then(async res => {
    const payload = await res.json();
    if (!res.ok || (payload.code && payload.code !== 0 && payload.code !== 200)) {
      return Promise.reject(payload);
    }
    return payload;
  });
};

// 获取菜单列表
export const getAuthMenuListApi = () => {
  const userStore = useUserStore();
  return getMockMenuByRole(userStore.userInfo.role);
};

// 获取按钮权限
export const getAuthButtonListApi = () => {
  const userStore = useUserStore();
  return getMockButtonsByRole(userStore.userInfo.role);
};

// 用户退出登录
export const logoutApi = () => {
  const userStore = useUserStore();
  return fetch(`${gatewayBase()}/auth/logout`, {
    method: "POST",
    headers: { Authorization: `Bearer ${userStore.token}` },
    credentials: "include"
  }).then(() => ({ code: 200, msg: "退出成功", data: null }));
};
