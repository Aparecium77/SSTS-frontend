import { describe, expect, it } from "vitest";
import type { ExamRecordItem } from "@/api/interface/onlineTest";
import { filterExamList, formatTimeRange, getTabCounts, normalizeExamRecordItem, resolveExamStatus } from "./logic";

const fixedNow = new Date("2026-06-19T10:00:00.000Z").getTime();

function buildRecord(overrides: Partial<ExamRecordItem> = {}): ExamRecordItem {
  return {
    examId: 8,
    examTitle: "软件工程期末考试",
    totalScore: 100,
    durationMins: 90,
    validStartTime: "2026-06-19T09:00:00.000Z",
    validEndTime: "2026-06-19T11:00:00.000Z",
    paperStatus: 1,
    recordId: null,
    recordStatus: null,
    studentScore: null,
    submitTime: null,
    allowedAttempts: 1,
    submittedCount: 0,
    scoreVisible: false,
    answerVisible: false,
    ...overrides
  };
}

describe("online-test entry logic", () => {
  it("marks exams as upcoming before the valid start time", () => {
    const status = resolveExamStatus(null, "2026-06-19T12:00:00.000Z", "2026-06-19T13:00:00.000Z", 0, 1, false, false, fixedNow);

    expect(status).toBe("upcoming");
  });

  it("marks exams as ongoing when they are in the valid time window and attempts remain", () => {
    const status = resolveExamStatus(null, "2026-06-19T09:00:00.000Z", "2026-06-19T11:00:00.000Z", 0, 1, false, false, fixedNow);

    expect(status).toBe("ongoing");
  });

  it("marks exams as ended after the valid end time", () => {
    const status = resolveExamStatus(null, "2026-06-19T07:00:00.000Z", "2026-06-19T08:00:00.000Z", 0, 1, false, false, fixedNow);

    expect(status).toBe("ended");
  });

  it("forces multi-attempt exams to ended once answers or scores are opened", () => {
    const status = resolveExamStatus(0, "2026-06-19T09:00:00.000Z", "2026-06-19T11:00:00.000Z", 0, 2, true, false, fixedNow);

    expect(status).toBe("ended");
  });

  it("normalizes API records into the UI model used by the exam entry page", () => {
    const normalized = normalizeExamRecordItem(
      buildRecord({
        examId: 12,
        recordStatus: 0,
        allowedAttempts: 2,
        submittedCount: 1
      }),
      fixedNow
    );

    expect(normalized.examId).toBe("exam-0012");
    expect(normalized.paperId).toBe("paper-0012");
    expect(normalized.hasDraft).toBe(true);
    expect(normalized.status).toBe("ongoing");
  });

  it("filters by tab and keyword within the online-test list only", () => {
    const list = [
      normalizeExamRecordItem(
        buildRecord({ examId: 1, examTitle: "软件工程测试", validStartTime: "2026-06-19T12:00:00.000Z" }),
        fixedNow
      ),
      normalizeExamRecordItem(buildRecord({ examId: 2, examTitle: "数据结构考试" }), fixedNow),
      normalizeExamRecordItem(
        buildRecord({ examId: 3, examTitle: "已结束测验", validEndTime: "2026-06-19T08:00:00.000Z" }),
        fixedNow
      )
    ];

    const filtered = filterExamList(list, "ended", "测验");

    expect(filtered).toHaveLength(1);
    expect(filtered[0].examName).toBe("已结束测验");
  });

  it("computes tab counts for the online-test status tabs", () => {
    const list = [
      normalizeExamRecordItem(buildRecord({ examId: 1, validStartTime: "2026-06-19T12:00:00.000Z" }), fixedNow),
      normalizeExamRecordItem(buildRecord({ examId: 2 }), fixedNow),
      normalizeExamRecordItem(buildRecord({ examId: 3, validEndTime: "2026-06-19T08:00:00.000Z" }), fixedNow)
    ];

    expect(getTabCounts(list)).toEqual({
      all: 3,
      upcoming: 1,
      ongoing: 1,
      ended: 1
    });
  });

  it("formats the exam time range for display", () => {
    expect(formatTimeRange("2026-06-19T09:05:00", "2026-06-19T11:35:00")).toBe("2026-06-19 09:05 — 2026-06-19 11:35");
  });
});
