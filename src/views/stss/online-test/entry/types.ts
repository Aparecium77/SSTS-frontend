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
    /** 已公布的成绩 */
    score?: number;
  }
}
