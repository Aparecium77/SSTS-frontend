export namespace ExamTaking {
  /** 题目类型: 1=选择题, 2=判断题 */
  export type QuestionType = 1 | 2;

  /** 答题页三视图状态 */
  export type SubmitState = "answering" | "submitting" | "success";

  /** 难度: 1=简单, 2=中等, 3=困难 */
  export type Difficulty = 1 | 2 | 3;

  export interface QuestionItem {
    id: number;
    type: QuestionType;
    stem: string;
    score: number;
    difficulty: Difficulty;
    /** 选项，选择题为 A/B/C/D 格式，判断题为 ["True", "False"] */
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
