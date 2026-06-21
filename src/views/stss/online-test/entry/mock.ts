import type { ExamEntry } from "./types";

const now = Date.now();
const hour = 3600_000;
const day = 86_400_000;

export const mockExamList: ExamEntry.ExamItem[] = [
  {
    examId: "exam-001",
    examName: "JavaScript 基础测试",
    paperId: "paper-001",
    paperName: "JS 基础卷 A",
    startTime: new Date(now - 2 * day).toISOString(),
    endTime: new Date(now + 5 * day).toISOString(),
    durationMinutes: 45,
    status: "ongoing",
    totalScore: 100,
    allowedAttempts: 1,
    submittedCount: 0,
    scoreVisible: false,
    answerVisible: false
  },
  {
    examId: "exam-002",
    examName: "Vue 3 综合测验",
    paperId: "paper-002",
    paperName: "Vue 综合卷 B",
    startTime: new Date(now - 1 * day).toISOString(),
    endTime: new Date(now + 6 * day).toISOString(),
    durationMinutes: 60,
    status: "ongoing",
    totalScore: 100,
    allowedAttempts: 2,
    submittedCount: 0,
    scoreVisible: false,
    answerVisible: false
  },
  {
    examId: "exam-003",
    examName: "CSS 布局专项测试",
    paperId: "paper-003",
    paperName: "CSS 布局卷",
    startTime: new Date(now - 10 * day).toISOString(),
    endTime: new Date(now - 8 * day).toISOString(),
    durationMinutes: 30,
    status: "ended",
    totalScore: 50,
    submitted: true,
    score: 42,
    allowedAttempts: 1,
    submittedCount: 1,
    scoreVisible: true,
    answerVisible: true
  },
  {
    examId: "exam-004",
    examName: "计算机网络期中考试",
    paperId: "paper-004",
    paperName: "计网期中卷 A",
    startTime: new Date(now - 7 * day).toISOString(),
    endTime: new Date(now - 5 * day).toISOString(),
    durationMinutes: 90,
    status: "ended",
    totalScore: 100,
    submitted: true,
    score: 88,
    allowedAttempts: 1,
    submittedCount: 1,
    scoreVisible: true,
    answerVisible: true
  },
  {
    examId: "exam-005",
    examName: "数据结构与算法测验",
    paperId: "paper-005",
    paperName: "DS 测验卷",
    startTime: new Date(now + 1 * hour).toISOString(),
    endTime: new Date(now + 3 * hour).toISOString(),
    durationMinutes: 120,
    status: "upcoming",
    totalScore: 150,
    allowedAttempts: 1,
    submittedCount: 0,
    scoreVisible: false,
    answerVisible: false
  },
  {
    examId: "exam-006",
    examName: "操作系统期末测试",
    paperId: "paper-006",
    paperName: "OS 期末卷",
    startTime: new Date(now - 14 * day).toISOString(),
    endTime: new Date(now - 12 * day).toISOString(),
    durationMinutes: 120,
    status: "ended",
    totalScore: 100,
    submitted: false,
    allowedAttempts: 1,
    submittedCount: 0,
    scoreVisible: false,
    answerVisible: false
  }
];
