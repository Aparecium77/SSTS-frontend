import type { ExamTaking } from "./types";

/* ────── 学生信息 ────── */
export const mockStudentInfo: ExamTaking.StudentInfo = {
  studentId: "STU2024001",
  studentName: "张三",
  className: "软件工程 2024 级 1 班"
};

/* ────── 考试信息映射 ────── */
export const examSessionMap: Record<string, ExamTaking.ExamSession> = {
  "exam-001": {
    examId: "exam-001",
    paperId: "paper-001",
    startedAt: new Date().toISOString(),
    examName: "JavaScript 基础测试",
    durationMinutes: 45,
    totalQuestions: 5
  },
  "exam-002": {
    examId: "exam-002",
    paperId: "paper-002",
    startedAt: new Date().toISOString(),
    examName: "Vue 3 综合测验",
    durationMinutes: 60,
    totalQuestions: 5
  }
};

/* ────── 题目映射 ────── */

/** JavaScript 基础测试（exam-001） */
const jsQuestions: ExamTaking.QuestionItem[] = [
  {
    id: "q-001",
    type: "single",
    stem: "以下哪个选项表示单选题？",
    score: 5,
    difficulty: "easy",
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
    score: 5,
    difficulty: "easy",
    options: [
      { label: "A. element", value: "A" },
      { label: "B. boolean", value: "B" },
      { label: "C. sheet", value: "C" },
      { label: "D. route", value: "D" }
    ],
    analysis: "boolean 是 JavaScript 的基础数据类型之一。"
  },
  {
    id: "q-101",
    type: "judge",
    stem: "JavaScript 支持布尔类型。",
    score: 3,
    difficulty: "easy",
    analysis: "JavaScript 中确实存在 boolean 类型。"
  },
  {
    id: "q-102",
    type: "judge",
    stem: "Vue 3 只能使用选项式 API。",
    score: 3,
    difficulty: "medium",
    analysis: "Vue 3 同时支持组合式 API 和选项式 API。"
  },
  {
    id: "q-103",
    type: "judge",
    stem: "选择题页面和判断题页面可以用同一个答题页承载。",
    score: 3,
    difficulty: "medium",
    analysis: "如果交互流程一致，单页切换题型通常更容易维护。"
  }
];

/** Vue 3 综合测验（exam-002） */
const vueQuestions: ExamTaking.QuestionItem[] = [
  {
    id: "v-001",
    type: "single",
    stem: "Vue 3 的组合式 API 主要通过哪个函数定义响应式数据？",
    score: 10,
    difficulty: "easy",
    options: [
      { label: "A. data()", value: "A" },
      { label: "B. ref() / reactive()", value: "B" },
      { label: "C. computed()", value: "C" },
      { label: "D. watch()", value: "D" }
    ],
    analysis: "ref() 和 reactive() 是 Vue 3 组合式 API 中定义响应式数据的核心函数。"
  },
  {
    id: "v-002",
    type: "single",
    stem: "以下哪个生命周期钩子在 Vue 3 的 setup 语法糖中等价于 onMounted？",
    score: 10,
    difficulty: "medium",
    options: [
      { label: "A. created()", value: "A" },
      { label: "B. mounted()", value: "B" },
      { label: "C. onMounted()", value: "C" },
      { label: "D. setup()", value: "D" }
    ],
    analysis: "在 <script setup> 中，使用 onMounted() 注册 mounted 生命周期回调。"
  },
  {
    id: "v-003",
    type: "single",
    stem: "Vue 3 引入的 Teleport 组件主要用于什么场景？",
    score: 10,
    difficulty: "hard",
    options: [
      { label: "A. 路由跳转", value: "A" },
      { label: "B. 将 DOM 渲染到指定节点", value: "B" },
      { label: "C. 全局状态管理", value: "C" },
      { label: "D. 异步组件加载", value: "D" }
    ],
    analysis: "Teleport 允许将组件内容渲染到 DOM 树中的任意位置，常用于模态框、通知等场景。"
  },
  {
    id: "v-004",
    type: "judge",
    stem: "Vue 3 的 <script setup> 语法糖中，import 的组件无需显式注册即可直接在模板中使用。",
    score: 5,
    difficulty: "easy",
    analysis: "在 <script setup> 中，顶层导入的组件会自动注册，可直接在 <template> 中使用。"
  },
  {
    id: "v-005",
    type: "judge",
    stem: "Vue 3 中，v-if 和 v-for 可以同时用在同一个元素上，没有优先级限制。",
    score: 5,
    difficulty: "medium",
    analysis: "Vue 3 中 v-if 优先级高于 v-for，因此两者不推荐同时使用在同一元素上，应改用 <template> 包装。"
  }
];

export const questionMap: Record<string, ExamTaking.QuestionItem[]> = {
  "exam-001": jsQuestions,
  "exam-002": vueQuestions
};

/* ────── 兼容旧导入 ────── */
export const mockExamSession = examSessionMap["exam-001"];
export const mockAllQuestionList = jsQuestions;
export const mockSingleQuestionList = jsQuestions.filter(q => q.type === "single");
export const mockJudgeQuestionList = jsQuestions.filter(q => q.type === "judge");
