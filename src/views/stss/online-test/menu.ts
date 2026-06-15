import { createGroup, createMenu } from "@/views/stss/menu";

// 在线测试组可以在这里维护“在线测试”板块下的细分页面名称、路径和图标。
export const onlineTestMenu = () =>
  createGroup(
    "/online-test",
    "onlineTest",
    "在线测试",
    [
      createMenu("/online-test/question-bank", "questionBank", "/stss/online-test/question-bank/index", "题库管理"),
      createMenu("/online-test/papers", "papers", "/stss/online-test/papers/index", "组卷管理"),
      createMenu("/online-test/entry", "examEntry", "/stss/online-test/entry/index", "考试入口"),
      createMenu("/online-test/exam-taking", "examTaking", "/stss/online-test/exam-taking/index", "考试答题", "EditPen", {
        isHide: true
      }),

      createMenu("/online-test/grading", "examGrading", "/stss/online-test/grading/index", "阅卷与发布"),
      createMenu("/online-test/analytics", "examAnalytics", "/stss/online-test/analytics/index", "测试分析", "EditPen", {
        isHide: true
      })
    ],
    "EditPen"
  );
