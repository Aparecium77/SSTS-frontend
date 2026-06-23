export interface GradingExamItem {
  id: number;
  title: string;
  status: number;
}

export interface GradingStatsData {
  maxScore?: number | null;
  minScore?: number | null;
  avgScore?: number | null;
  stdDeviation?: number | null;
}

export function filterAnalyzableExams<T extends GradingExamItem>(list: T[]): T[] {
  return list.filter(item => item.status !== 0);
}

export function formatGradingTime(isoStr: string): string {
  if (!isoStr) return "-";
  return new Date(isoStr).toLocaleString("zh-CN", { hour12: false });
}

export function formatStatValue(value: number | null | undefined, digits: number = 1): string {
  if (value === null || value === undefined) return "-";
  return digits === 0 ? String(value) : value.toFixed(digits);
}

export function buildExportFileName(examList: GradingExamItem[], examId: number | undefined): string {
  const examName = examList.find(item => item.id === examId)?.title || "考试";
  return `${examName}成绩单.xlsx`;
}

export function canExportStats(statsData: unknown): boolean {
  return Boolean(statsData);
}

export function buildReviewRequest(teacherId: number, recordId: number) {
  return { teacherId, recordId };
}
