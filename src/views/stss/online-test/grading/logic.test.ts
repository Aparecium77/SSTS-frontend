import { describe, expect, it } from "vitest";
import {
  buildExportFileName,
  buildReviewRequest,
  canExportStats,
  filterAnalyzableExams,
  formatGradingTime,
  formatStatValue
} from "./logic";

describe("online-test grading logic", () => {
  it("filters out draft exams so only analyzable papers remain", () => {
    expect(
      filterAnalyzableExams([
        { id: 1, title: "草稿试卷", status: 0 },
        { id: 2, title: "已发布考试", status: 1 },
        { id: 3, title: "已撤回考试", status: 2 }
      ])
    ).toEqual([
      { id: 2, title: "已发布考试", status: 1 },
      { id: 3, title: "已撤回考试", status: 2 }
    ]);
  });

  it("formats grading timestamps for display", () => {
    expect(formatGradingTime("")).toBe("-");
    expect(formatGradingTime("2026-06-19T10:30:00")).toContain("2026/6/19");
  });

  it("formats stats values with fallback placeholders", () => {
    expect(formatStatValue(undefined)).toBe("-");
    expect(formatStatValue(null)).toBe("-");
    expect(formatStatValue(88.888)).toBe("88.9");
    expect(formatStatValue(95, 0)).toBe("95");
  });

  it("builds the export file name from the selected exam", () => {
    expect(
      buildExportFileName(
        [
          { id: 8, title: "软件工程期末考试", status: 1 },
          { id: 9, title: "数据结构测试", status: 2 }
        ],
        8
      )
    ).toBe("软件工程期末考试成绩单.xlsx");

    expect(buildExportFileName([], undefined)).toBe("考试成绩单.xlsx");
  });

  it("checks whether stats are available for export or publish actions", () => {
    expect(canExportStats(null)).toBe(false);
    expect(canExportStats(undefined)).toBe(false);
    expect(canExportStats({ avgScore: 80 })).toBe(true);
  });

  it("builds the review request payload for answer-sheet lookup", () => {
    expect(buildReviewRequest(9001, 10086)).toEqual({ teacherId: 9001, recordId: 10086 });
  });
});
