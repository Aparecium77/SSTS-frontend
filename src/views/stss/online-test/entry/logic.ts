import type { ExamRecordItem } from "@/api/interface/onlineTest";
import type { ExamEntry } from "./types";

export function resolveExamStatus(
  recordStatus: number | null,
  validStartTime: string,
  validEndTime: string,
  submittedCount: number,
  allowedAttempts: number,
  _scoreVisible: boolean,
  _answerVisible: boolean,
  now: number = Date.now()
): ExamEntry.ExamStatus {
  const startTime = new Date(validStartTime).getTime();
  const endTime = new Date(validEndTime).getTime();

  // 时间优先：先判时间窗口
  if (startTime > now) return "upcoming";
  if (endTime < now) return "ended";

  // 时间窗口内：检查是否可以考试（有草稿 或 还有剩余次数）
  const hasDraft = recordStatus === 0;
  const remaining = allowedAttempts - submittedCount;
  if (hasDraft || remaining > 0) return "ongoing";

  return "ended";
}

export function normalizeExamRecordItem(record: ExamRecordItem, now: number = Date.now()): ExamEntry.ExamItem {
  return {
    examId: `exam-00${record.examId}`,
    examName: record.examTitle,
    paperId: `paper-00${record.examId}`,
    paperName: record.examTitle,
    startTime: record.validStartTime,
    endTime: record.validEndTime,
    durationMinutes: record.durationMins,
    status: resolveExamStatus(
      record.recordStatus,
      record.validStartTime,
      record.validEndTime,
      record.submittedCount ?? 0,
      record.allowedAttempts ?? 1,
      record.scoreVisible ?? false,
      record.answerVisible ?? false,
      now
    ),
    totalScore: record.totalScore,
    submitted: record.recordStatus === 1,
    hasDraft: record.recordStatus === 0,
    allowedAttempts: record.allowedAttempts ?? 1,
    submittedCount: record.submittedCount ?? 0,
    score: record.studentScore ?? undefined,
    scoreVisible: record.scoreVisible ?? false,
    answerVisible: record.answerVisible ?? false
  };
}

export function filterExamList(
  list: ExamEntry.ExamItem[],
  activeFilter: ExamEntry.FilterTab,
  searchKeyword: string
): ExamEntry.ExamItem[] {
  let filtered = list;
  if (activeFilter !== "all") {
    filtered = filtered.filter(item => item.status === activeFilter);
  }

  const keyword = searchKeyword.trim().toLowerCase();
  if (!keyword) {
    return filtered;
  }

  return filtered.filter(item => item.examName.toLowerCase().includes(keyword) || item.paperName.toLowerCase().includes(keyword));
}

export function getTabCounts(list: ExamEntry.ExamItem[]) {
  return {
    all: list.length,
    upcoming: list.filter(item => item.status === "upcoming").length,
    ongoing: list.filter(item => item.status === "ongoing").length,
    ended: list.filter(item => item.status === "ended").length
  };
}

export function formatTimeRange(start: string, end: string): string {
  const formatOne = (iso: string) => {
    const date = new Date(iso);
    const pad = (value: number) => String(value).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  return `${formatOne(start)} — ${formatOne(end)}`;
}
