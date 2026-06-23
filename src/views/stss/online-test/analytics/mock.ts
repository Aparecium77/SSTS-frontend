import type { ExamAnalytics } from "./types";

/** CSS 布局专项测试：成绩 + 答案都已开放 */
export const mockReviewFull: ExamAnalytics.ExamReview = {
  recordId: 301,
  examId: 3,
  examTitle: "CSS 布局专项测试",
  studentId: 2024001,
  submitTime: new Date(Date.now() - 8 * 86_400_000).toISOString(),
  totalScore: 42,
  scoreVisible: true,
  answerVisible: true,
  fullScore: 50,
  questions: [
    {
      questionId: 101,
      sortOrder: 1,
      type: 1,
      stem: "以下哪个 CSS 属性用于控制元素的显示类型？",
      options: ["A. position", "B. display", "C. float", "D. visibility"],
      studentAnswer: "B",
      score: 10,
      isCorrect: true,
      standardAnswer: "B"
    },
    {
      questionId: 102,
      sortOrder: 2,
      type: 1,
      stem: "Flexbox 中，justify-content 属性用于控制什么方向的对齐？",
      options: ["A. 主轴", "B. 交叉轴", "C. 垂直方向", "D. 水平方向"],
      studentAnswer: "A",
      score: 10,
      isCorrect: true,
      standardAnswer: "A"
    },
    {
      questionId: 103,
      sortOrder: 3,
      type: 1,
      stem: "以下哪个不是 CSS 的定位方式？",
      options: ["A. static", "B. relative", "C. absolute", "D. floating"],
      studentAnswer: "D",
      score: 10,
      isCorrect: true,
      standardAnswer: "D"
    },
    {
      questionId: 104,
      sortOrder: 4,
      type: 1,
      stem: "CSS Grid 布局中，fr 单位表示什么？",
      options: ["A. 固定像素", "B. 弹性比例", "C. 百分比", "D. 视口单位"],
      studentAnswer: "A",
      score: 0,
      isCorrect: false,
      standardAnswer: "B"
    },
    {
      questionId: 105,
      sortOrder: 5,
      type: 2,
      stem: "使用 Grid 布局必须搭配 Flex 布局一起使用。",
      options: ["True", "False"],
      studentAnswer: "false",
      score: 12,
      isCorrect: true,
      standardAnswer: "false"
    }
  ]
};

/** 计算机网络期中考试：成绩已开放，答案未开放 */
export const mockReviewScoreOnly: ExamAnalytics.ExamReview = {
  recordId: 401,
  examId: 4,
  examTitle: "计算机网络期中考试",
  studentId: 2024001,
  submitTime: new Date(Date.now() - 5 * 86_400_000).toISOString(),
  totalScore: 88,
  scoreVisible: true,
  answerVisible: false,
  fullScore: 100,
  questions: [
    {
      questionId: 201,
      sortOrder: 1,
      type: 1,
      stem: "TCP 协议工作在 OSI 模型的哪一层？",
      options: ["A. 网络层", "B. 传输层", "C. 应用层", "D. 数据链路层"],
      studentAnswer: "B",
      score: 20,
      isCorrect: true,
      standardAnswer: null
    },
    {
      questionId: 202,
      sortOrder: 2,
      type: 2,
      stem: "HTTP 协议默认使用端口 80。",
      options: ["True", "False"],
      studentAnswer: "true",
      score: 18,
      isCorrect: true,
      standardAnswer: null
    },
    {
      questionId: 203,
      sortOrder: 3,
      type: 1,
      stem: "DNS 协议的主要功能是什么？",
      options: ["A. 文件传输", "B. 域名解析", "C. 邮件发送", "D. 远程登录"],
      studentAnswer: "B",
      score: 20,
      isCorrect: true,
      standardAnswer: null
    },
    {
      questionId: 204,
      sortOrder: 4,
      type: 2,
      stem: "UDP 是一种面向连接的传输协议。",
      options: ["True", "False"],
      studentAnswer: "true",
      score: 0,
      isCorrect: false,
      standardAnswer: null
    },
    {
      questionId: 205,
      sortOrder: 5,
      type: 1,
      stem: "IP 地址 192.168.1.1 属于哪类地址？",
      options: ["A. A 类", "B. B 类", "C. C 类", "D. D 类"],
      studentAnswer: "C",
      score: 30,
      isCorrect: true,
      standardAnswer: null
    }
  ]
};

/** 按 examId 映射（与 entry mock 的 examId 一致） */
export const reviewMap: Record<string, ExamAnalytics.ExamReview> = {
  "exam-003": mockReviewFull,
  "exam-004": mockReviewScoreOnly
};
