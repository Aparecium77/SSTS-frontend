export namespace ExamTaking {
  export type QuestionType = "single" | "judge";

  export interface OptionItem {
    label: string;
    value: string;
  }

  export interface QuestionItem {
    id: string;
    type: QuestionType;
    stem: string;
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
}
