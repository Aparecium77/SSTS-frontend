export namespace ExamTaking {
  /** 题目类型: 0=选择题, 1=判断题 */
  export type QuestionType = 0 | 1;

  /** 答题页三视图状态 */
  export type SubmitState = "answering" | "submitting" | "success";

  /** 难度: 0=简单, 1=中等, 2=困难 */
  export type Difficulty = 0 | 1 | 2;

  export interface QuestionItem {
    id: number;
    type: QuestionType;
    stem: string;
    score: number;
    difficulty: Difficulty;
    /** 选项，选择题时为选项数组，判断题时为空数组 */
    options: string[];
    analysis?: string;
  }

  export interface ExamSession {
    examId: string;
    paperId: string;
    startedAt: string;
    examName: string;
    durationMinutes: number;
    totalQuestions: number;
  }

  export interface StudentInfo {
    studentId: number;
    studentName: string;
    className: string;
  }
}
