import { defineStore } from "pinia";
import { UserState } from "@/stores/interface";
import piniaPersistConfig from "@/stores/helper/persist";

const emptyUserState = (): UserState => ({
  token: "",
  refreshToken: "",
  userId: "",
  userInfo: { name: "", role: "" }
});

export const useUserStore = defineStore({
  id: "stss-user",
  state: (): UserState => {
    try {
      const raw = localStorage.getItem("stss-user");
      if (!raw) return emptyUserState();
      const parsed = JSON.parse(raw);
      // 清除旧 mock token 或 role 为空的无效持久化数据
      const isMockToken = typeof parsed.token === "string" && parsed.token.startsWith("token-");
      const hasNoRole = !parsed.userInfo?.role;
      if (isMockToken || hasNoRole) {
        localStorage.removeItem("stss-user");
        return emptyUserState();
      }
      return { ...emptyUserState(), ...parsed, userInfo: { ...emptyUserState().userInfo, ...parsed.userInfo } };
    } catch {
      localStorage.removeItem("stss-user");
    }
    return emptyUserState();
  },
  getters: {},
  actions: {
    setToken(token: string) {
      this.token = token;
    },
    setRefreshToken(refreshToken: string) {
      this.refreshToken = refreshToken;
    },
    setUserId(userId: string) {
      this.userId = userId;
    },
    setUserInfo(userInfo: UserState["userInfo"]) {
      this.userInfo = userInfo;
    },
    resetUserState() {
      Object.assign(this, emptyUserState());
    }
  },
  persist: piniaPersistConfig("stss-user")
});
