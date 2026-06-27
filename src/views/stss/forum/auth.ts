import { computed, reactive, watchEffect } from "vue";
import { useRoute } from "vue-router";
import { useAuthStore } from "@/stores/modules/auth";

/**
 * @description 论坛页面按钮权限
 * */
export const useForumAuthButtons = () => {
  const route = useRoute();
  const authStore = useAuthStore();

  const getPageKey = () => {
    const routeName = route.name as string;
    if (routeName) return routeName;
    const path = route.path;
    // 论坛相关页面路径映射
    if (path.includes("/forum/notices")) return "forumNotices";
    if (path.includes("/forum/course-boards")) return "forumCourseBoards";
    if (path.includes("/forum/posts")) return "forumPosts";
    if (path.includes("/forum/moderation")) return "forumModeration";
    if (path.includes("/forum/search")) return "forumSearch";
    return routeName;
  };

  const authButtons = computed(() => {
    const key = getPageKey();
    if (!key || !authStore.authButtonListGet) return [];
    return authStore.authButtonListGet[key] || [];
  });

  // 返回一个 reactive 对象，在 script 和 template 中都能正常工作
  const BUTTONS = reactive<{ [key: string]: boolean }>({});

  // 监听 authButtons 的变化并更新 BUTTONS
  watchEffect(() => {
    const buttons = authButtons.value || [];
    Object.keys(BUTTONS).forEach(key => delete BUTTONS[key]);
    buttons.forEach(item => (BUTTONS[item] = true));
  });

  return {
    BUTTONS
  };
};
