export namespace ExamEntry {
  /** 考试状态 */
  export type ExamStatus = "upcoming" | "ongoing" | "ended";

  /** 筛选标签 */
  export type FilterTab = "all" | ExamStatus;

  /** 考试列表项 */
  export interface ExamItem {
    examId: string;
    examName: string;
    paperId: string;
    paperName: string;
    startTime: string;
    endTime: string;
    durationMinutes: number;
    status: ExamStatus;
    totalScore: number;
    /** 学生是否已提交 */
    submitted?: boolean;
    /** 是否有进行中的草稿（可直接继续） */
    hasDraft?: boolean;
    /** 已公布的成绩 */
    score?: number;
    /** 允许答题次数 */
    allowedAttempts: number;
    /** 已提交次数 */
    submittedCount: number;
    /** 成绩是否对学生可见 */
    scoreVisible: boolean;
    /** 答案是否对学生可见 */
    answerVisible: boolean;
  }
}
