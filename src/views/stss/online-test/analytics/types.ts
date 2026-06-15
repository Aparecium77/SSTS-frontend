export namespace ExamAnalytics {
  /** 逐题详情 */
  export interface QuestionDetail {
    questionId: number;
    sortOrder: number;
    stem: string;
    options: string[];
    /** 学生提交的答案 */
    studentAnswer: string | null;
    /** 该题得分（成绩未开放时为 null） */
    score: number | null;
    /** 是否正确（成绩未开放时为 null） */
    isCorrect: boolean | null;
    /** 标准答案（答案未开放时为 null） */
    standardAnswer: string | null;
  }

  /** get_exam_record_review 返回的整体结构 */
  export interface ExamReview {
    recordId: number;
    examId: number;
    examTitle: string;
    studentId: number;
    submitTime: string;
    /** 总分（成绩未开放时为 null） */
    totalScore: number | null;
    /** 老师是否开放了成绩 */
    scoreVisible: boolean;
    /** 老师是否开放了答案 */
    answerVisible: boolean;
    questions: QuestionDetail[];
    /** 试卷满分 */
    fullScore: number;
  }
}
