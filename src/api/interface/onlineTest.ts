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
/* ────── 题库管理 ────── */
export interface QuestionVO {
  id?: number;
  courseId: number;
  /** 1-单选, 2-判断 (是非题) */
  type: number;
  stem: string;
  options: string[];
  answer: string;
  /** 1-简单, 2-中等, 3-困难 */
  difficulty: number;
  knowledgePoints: string[];
  createTime?: string;
}

export interface AddQuestionReq extends QuestionVO {
  teacherId: number;
}

export interface UpdateQuestionReq extends QuestionVO {
  teacherId: number;
  id: number;
}

export interface DeleteQuestionReq {
  teacherId: number;
  id: number;
  force?: boolean;
}

export interface GetQuestionReq {
  teacherId: number;
  id: number;
}

export interface QueryQuestionBankReq extends PageReq {
  teacherId: number;
  courseId: number;
  type?: number;
  difficulty?: number;
  keyword?: string;
  knowledgePoints?: string[];
}

/* ────── 试卷管理 ────── */
export interface CreateExamPaperReq {
  teacherId: number;
  courseId: number;
  title: string;
  totalScore: number;
  durationMins: number;
  passScore: number;
  allowedAttempts: number;
  generateMode: "manual" | "auto";
  questionIds?: number[];
  questionScores?: number[];
}

export interface UpdateExamPaperReq extends CreateExamPaperReq {
  id: number;
}

export interface AutoRules {
  singleChoiceCount: number;
  trueFalseCount: number;
  singleChoiceScore: number;
  trueFalseScore: number;
  targetDifficulty: number;
  knowledgePoints: string[];
}

export interface GenerateExamPaperReq {
  teacherId: number;
  courseId: number;
  title: string;
  totalScore: number;
  durationMins: number;
  passScore: number;
  allowedAttempts: number;
  generateMode: "auto";
  autoRules: AutoRules;
}

export interface DeleteExamPaperReq {
  teacherId: number;
  id: number;
}

export interface PublishExamPaperReq {
  teacherId: number;
  id: number;
  validStartTime: string;
  validEndTime: string;
  allowedAttempts: number;
  scoringStrategy: string;
}

export interface WithdrawExamPaperReq {
  teacherId: number;
  id: number;
}

export interface QueryExamPapersReq extends PageReq {
  teacherId: number;
  courseId: number;
}

export interface ExamPaperVO {
  id: number;
  courseId: number;
  title: string;
  totalScore: number;
  durationMins: number;
  passScore: number;
  allowedAttempts: number;
  status: number; // 比如：0草稿, 1已发布, 2已撤回
  generateMode: string;
  validStartTime?: string;
  validEndTime?: string;
  scoringStrategy?: string;
  createTime?: string;
}

export interface ActionByIdReq {
  teacherId: number;
  id: number;
}

/* ────── 成绩统计分析 ────── */
export interface ExamStatsVO {
  highestScore: number;
  lowestScore: number;
  averageScore: number;
  standardDeviation: number;
  passRate: number;
  // 具体结构根据后端实际返回调整
  scoreSegments?: Record<string, number>;
  questionStats?: any[];
}
