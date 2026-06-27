import dayjs from "dayjs";

export interface PaperQuestion {
  id: number;
  score: number;
  title?: string;
  stem?: string;
}

export interface AutoRules {
  singleChoiceCount: number;
  trueFalseCount: number;
  singleChoiceScore: number;
  trueFalseScore: number;
  targetDifficulty: number;
  knowledgePoints: string[];
}

export interface PaperFormData {
  id?: number;
  title: string;
  durationMins: number;
  totalScore: number;
  passScore: number;
  generateMode: "manual" | "auto";
  allowedAttempts: number;
  autoRules: AutoRules;
}

export function createDefaultPaperForm(): PaperFormData {
  return {
    id: undefined,
    title: "",
    durationMins: 120,
    totalScore: 100,
    passScore: 60,
    generateMode: "manual",
    allowedAttempts: 1,
    autoRules: {
      singleChoiceCount: 4,
      trueFalseCount: 2,
      singleChoiceScore: 20,
      trueFalseScore: 10,
      targetDifficulty: 1,
      knowledgePoints: []
    }
  };
}

export function filterExamPaperList<T extends { title?: string }>(list: T[], keyword: string): T[] {
  if (!keyword) return list;
  return list.filter(item => (item.title ?? "").includes(keyword));
}

export function calculatePaperTotalScore(
  generateMode: "manual" | "auto",
  selectedQuestions: PaperQuestion[],
  autoRules: AutoRules
): number {
  if (generateMode === "manual") {
    return selectedQuestions.reduce((sum, question) => sum + (question.score || 0), 0);
  }

  return autoRules.singleChoiceCount * autoRules.singleChoiceScore + autoRules.trueFalseCount * autoRules.trueFalseScore;
}

export function buildManualPaperRequest(
  formData: PaperFormData,
  selectedQuestions: PaperQuestion[],
  teacherId: number,
  courseId: number
) {
  return {
    teacherId,
    courseId,
    title: formData.title,
    totalScore: formData.totalScore,
    durationMins: formData.durationMins,
    passScore: formData.passScore,
    allowedAttempts: formData.allowedAttempts,
    generateMode: "manual" as const,
    questionIds: selectedQuestions.map(question => question.id),
    questionScores: selectedQuestions.map(question => question.score)
  };
}

export function buildAutoPaperRequest(formData: PaperFormData, teacherId: number, courseId: number) {
  return {
    teacherId,
    courseId,
    title: formData.title,
    totalScore: formData.totalScore,
    durationMins: formData.durationMins,
    passScore: formData.passScore,
    allowedAttempts: formData.allowedAttempts,
    generateMode: "auto" as const,
    autoRules: formData.autoRules
  };
}

function formatPublishTime(value: string | Date): string {
  return dayjs(value).format("YYYY-MM-DDTHH:mm:ss.SSSZ");
}

export function buildPublishRequest(
  teacherId: number,
  id: number,
  publishTimeRange: [string | Date, string | Date],
  allowedAttempts: number
) {
  return {
    teacherId,
    id,
    validStartTime: formatPublishTime(publishTimeRange[0]),
    validEndTime: formatPublishTime(publishTimeRange[1]),
    allowedAttempts,
    scoringStrategy: "AUTO_GRADE"
  };
}

export function mergeSelectedQuestions(selectedQuestions: PaperQuestion[], tempSelection: PaperQuestion[]): PaperQuestion[] {
  const existingIds = new Set(selectedQuestions.map(question => question.id));
  const newItems = tempSelection
    .filter(question => !existingIds.has(question.id))
    .map(question => ({ ...question, score: question.score ?? 10 }));
  return [...selectedQuestions, ...newItems];
}

export function getPaperActions(status: number) {
  return {
    canEdit: status === 0 || status === 2,
    canDelete: status === 0 || status === 2,
    canPublish: status === 0 || status === 2,
    canWithdraw: status === 1,
    canOpenScore: status === 1,
    canOpenAnswer: status === 1,
    canAnalyze: status === 1 || status === 2
  };
}
