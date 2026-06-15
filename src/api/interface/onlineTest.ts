/**
 * 在线测试 — 后端 API 对应的 TypeScript 类型。
 * 对齐 STSS-Online-Testing 的 /api/ot/v1/actions 接口。
 */

/* ────── 通用请求体 ────── */
export interface ApiRequestBody<T = Record<string, unknown>> {
  action: string;
  data: T;
}

/* ────── 分页 ────── */
export interface PageReq {
  current: number;
  size: number;
}

export interface PageResult<T> {
  records: T[];
  total: number;
  size: number;
  current: number;
}

/* ────── 考试列表 ────── */
/** list_my_exam_records 返回的列表项（已 join exam_paper） */
export interface ExamRecordItem {
  examId: number;
  examTitle: string;
  totalScore: number;
  durationMins: number;
  validStartTime: string;
  validEndTime: string;
  paperStatus: number;
  /** 记录ID（学生未参加考试时为 null） */
  recordId: number | null;
  /** 0=考试中, 1=已完成, 2=已作废, null=未参加 */
  recordStatus: number | null;
  /** 学生得分（未参加或未评分时为 null） */
  studentScore: number | null;
  submitTime: string | null;
}

export interface ListMyExamRecordsReq {
  studentId: number;
  current?: number;
  size?: number;
}

/* ────── 开始考试（获取试卷） ────── */
export interface ExamPaperStudentVO {
  examId: number;
  title: string;
  durationMins: number;
  questions: ExamPaperQuestionVO[];
}

export interface ExamPaperQuestionVO {
  questionId: number;
  /** 1-单选, 2-判断 */
  type: number;
  score: number;
  stem: string;
  options: string[];
  sortOrder: number;
}

export interface BeginExamReq {
  studentId: number;
  examId: number;
}

export interface BeginExamResponse {
  recordId: number;
  paper: ExamPaperStudentVO;
  wsEndpoint: string | null;
  savedAnswers: Record<string, string>;
  attemptsUsed: number;
  remainingAttempts: number;
}

/* ────── 保存进度 / 交卷 ────── */
export interface AnswerItem {
  questionId: number;
  studentAnswer: string;
}

export interface SaveExamProgressReq {
  studentId: number;
  examId: number;
  answers: AnswerItem[];
}

export interface SubmitExamReq {
  studentId: number;
  examId: number;
  courseId?: number;
  answers: AnswerItem[];
}

/* ────── 成绩分析（作答记录回顾） ────── */
export interface QuestionReviewDetail {
  questionId: number;
  sortOrder: number;
  /** 1-单选, 2-判断 */
  type: number;
  stem: string;
  options: string[];
  studentAnswer: string | null;
  score: number | null;
  isCorrect: boolean | null;
  standardAnswer: string | null;
}

export interface ExamRecordReviewVO {
  recordId: number;
  examId: number;
  examTitle: string;
  studentId: number;
  submitTime: string;
  totalScore: number | null;
  scoreVisible: boolean;
  answerVisible: boolean;
  questions: QuestionReviewDetail[];
}

export interface GetExamReviewReq {
  examId?: number;
  recordId?: number;
  studentId?: number;
  teacherId?: number;
}
