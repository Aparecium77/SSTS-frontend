import { createGroup, createMenu } from "@/views/stss/menu";

export const onlineTestMenu = () => {
  // 💡 安全获取身份的终极绝招：直接读取本地缓存，绝对不会引发框架冲突
  let isStudent = false;
  try {
    // Geeker-Admin 默认将用户信息存在 localStorage 的 "geeker-user" 字段里
    const localData = JSON.parse(localStorage.getItem("geeker-user") || "{}");
    const role = localData?.userInfo?.role;
    // 如果你们后端的学生角色标识是其他的（比如 "Student" 或数字），请在这里修改
    isStudent = role === "student" || role === "Student";
  } catch (error) {
    console.warn("读取身份失败，按默认权限处理");
  }

  return createGroup(
    "/online-test",
    "onlineTest",
    "在线测试",
    [
      // 教师专属：题库管理、组卷管理、成绩分析
      createMenu("/online-test/question-bank", "questionBank", "/stss/online-test/question-bank/index", "题库管理", "List", {
        isHide: isStudent
      }),
      createMenu("/online-test/papers", "papers", "/stss/online-test/papers/index", "组卷管理", "Document", {
        isHide: isStudent
      }),
      createMenu("/online-test/grading", "examGrading", "/stss/online-test/grading/index", "成绩分析", "DataAnalysis", {
        isHide: isStudent
      }),
      // 考试入口
      createMenu("/online-test/entry", "examEntry", "/stss/online-test/entry/index", "考试入口", "Edit", {
        isHide: !isStudent
      }),
      // 始终隐藏的内页：考试答题、测试分析
      createMenu("/online-test/exam-taking", "examTaking", "/stss/online-test/exam-taking/index", "考试答题", "EditPen", {
        isHide: true
      }),
      createMenu("/online-test/analytics", "examAnalytics", "/stss/online-test/analytics/index", "测试分析", "EditPen", {
        isHide: true
      })
    ],
    "EditPen" // 整个大模块的图标
  );
};
