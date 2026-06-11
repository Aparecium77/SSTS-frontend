export namespace ExamTaking {
  export type QuestionType = "single" | "judge";

  /** 答题页三视图状态 */
  export type SubmitState = "answering" | "submitting" | "success";

  export interface OptionItem {
    label: string;
    value: string;
  }

  export type Difficulty = "easy" | "medium" | "hard";

  export interface QuestionItem {
    id: string;
    type: QuestionType;
    stem: string;
    score: number;
    difficulty: Difficulty;
    options?: OptionItem[];
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
    studentId: string;
    studentName: string;
    className: string;
  }
}
