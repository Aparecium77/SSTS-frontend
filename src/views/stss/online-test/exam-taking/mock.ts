import type { ExamTaking } from "./types";

export const mockExamSession: ExamTaking.ExamSession = {
  examId: "exam-001",
  paperId: "paper-001",
  startedAt: new Date().toISOString(),
  examName: "JavaScript 基础测试",
  durationMinutes: 45,
  totalQuestions: 6
};

export const mockSingleQuestionList: ExamTaking.QuestionItem[] = [
  {
    id: "q-001",
    type: "single",
    stem: "以下哪个选项表示单选题？",
    options: [
      { label: "A. 只能选择一个正确答案", value: "A" },
      { label: "B. 可以选择多个正确答案", value: "B" },
      { label: "C. 必须填写文字答案", value: "C" },
      { label: "D. 不需要作答", value: "D" }
    ],
    analysis: "单选题要求在多个选项中选择唯一正确答案。"
  },
  {
    id: "q-002",
    type: "single",
    stem: "以下哪一项是 JavaScript 的数据类型？",
    options: [
      { label: "A. element", value: "A" },
      { label: "B. boolean", value: "B" },
      { label: "C. sheet", value: "C" },
      { label: "D. route", value: "D" }
    ],
    analysis: "boolean 是 JavaScript 的基础数据类型之一。"
  }
];

export const mockJudgeQuestionList: ExamTaking.QuestionItem[] = [
  {
    id: "q-101",
    type: "judge",
    stem: "JavaScript 支持布尔类型。",
    analysis: "JavaScript 中确实存在 boolean 类型。"
  },
  {
    id: "q-102",
    type: "judge",
    stem: "Vue 3 只能使用选项式 API。",
    analysis: "Vue 3 同时支持组合式 API 和选项式 API。"
  },
  {
    id: "q-103",
    type: "judge",
    stem: "选择题页面和判断题页面可以用同一个答题页承载。",
    analysis: "如果交互流程一致，单页切换题型通常更容易维护。"
  }
];
