import { computed } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { useUserStore } from "@/stores/modules/user";

/** 学分进展、个人成绩统计仅学生使用；教务/教师误入时退回首页 */
export const useStudentOnlyPage = () => {
  const router = useRouter();
  const userStore = useUserStore();
  const isStudent = computed(() => userStore.userInfo.role === "student");

  const ensureStudentAccess = () => {
    if (isStudent.value) return true;
    ElMessage.warning("该页面仅对学生开放");
    router.replace("/home/index");
    return false;
  };

  return { isStudent, ensureStudentAccess };
};
