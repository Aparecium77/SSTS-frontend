import router from "@/routers/index";
import { LOGIN_URL } from "@/config";
import { RouteRecordRaw } from "vue-router";
import { ElNotification } from "element-plus";
import { useUserStore } from "@/stores/modules/user";
import { useAuthStore } from "@/stores/modules/auth";

const modules = import.meta.glob("@/views/**/*.vue");
const placeholderComponent = modules["/src/views/stss/placeholder/index.vue"];

export const initDynamicRouter = async () => {
  const userStore = useUserStore();
  const authStore = useAuthStore();

  try {
    await authStore.getAuthMenuList();
    await authStore.getAuthButtonList();

    if (!authStore.authMenuListGet.length) {
      ElNotification({
        title: "无权限访问",
        message: "当前账号无任何菜单权限，请联系系统管理员！",
        type: "warning",
        duration: 3000
      });
      userStore.resetUserState();
      router.replace(LOGIN_URL);
      return Promise.reject("No permission");
    }

    authStore.flatMenuListGet.forEach(item => {
      item.children && delete item.children;
      if (item.component && typeof item.component == "string") {
        item.component = modules["/src/views" + item.component + ".vue"] ?? placeholderComponent;
      }
      if (item.meta.isFull) {
        router.addRoute(item as unknown as RouteRecordRaw);
      } else {
        router.addRoute("layout", item as unknown as RouteRecordRaw);
      }
    });
  } catch (error) {
    userStore.resetUserState();
    router.replace(LOGIN_URL);
    return Promise.reject(error);
  }
};
