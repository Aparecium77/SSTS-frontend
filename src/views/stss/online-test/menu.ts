import { createGroup, createMenu } from "@/views/stss/menu";

export const onlineTestMenu = (role: string = "teacher") => {
  const isStudent = role === "student";

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
