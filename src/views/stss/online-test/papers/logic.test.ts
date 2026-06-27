import { describe, expect, it } from "vitest";
import {
  buildAutoPaperRequest,
  buildManualPaperRequest,
  buildPublishRequest,
  calculatePaperTotalScore,
  createDefaultPaperForm,
  filterExamPaperList,
  getPaperActions,
  mergeSelectedQuestions
} from "./logic";

describe("online-test papers logic", () => {
  it("creates a default draft form for a new exam paper", () => {
    const form = createDefaultPaperForm();

    expect(form.generateMode).toBe("manual");
    expect(form.allowedAttempts).toBe(1);
    expect(form.autoRules.singleChoiceCount).toBe(4);
  });

  it("filters the exam-paper list by title keyword", () => {
    const list = [{ title: "软件工程期中考试" }, { title: "数据结构小测" }];

    expect(filterExamPaperList(list, "软件")).toEqual([{ title: "软件工程期中考试" }]);
    expect(filterExamPaperList(list, "")).toEqual(list);
  });

  it("calculates total score from manually selected questions", () => {
    expect(
      calculatePaperTotalScore(
        "manual",
        [
          { id: 1, score: 20 },
          { id: 2, score: 30 },
          { id: 3, score: 50 }
        ],
        createDefaultPaperForm().autoRules
      )
    ).toBe(100);
  });

  it("calculates total score from auto-generation rules", () => {
    expect(
      calculatePaperTotalScore("auto", [], {
        singleChoiceCount: 4,
        trueFalseCount: 2,
        singleChoiceScore: 15,
        trueFalseScore: 20,
        targetDifficulty: 2,
        knowledgePoints: []
      })
    ).toBe(100);
  });

  it("builds a manual paper request payload for the online-test backend", () => {
    const form = createDefaultPaperForm();
    form.title = "2026 软件工程期末考试";
    form.totalScore = 100;

    expect(
      buildManualPaperRequest(
        form,
        [
          { id: 10, score: 40 },
          { id: 11, score: 60 }
        ],
        9001,
        101
      )
    ).toEqual({
      teacherId: 9001,
      courseId: 101,
      title: "2026 软件工程期末考试",
      totalScore: 100,
      durationMins: 120,
      passScore: 60,
      allowedAttempts: 1,
      generateMode: "manual",
      questionIds: [10, 11],
      questionScores: [40, 60]
    });
  });

  it("builds an auto paper request payload", () => {
    const form = createDefaultPaperForm();
    form.generateMode = "auto";
    form.title = "自动组卷测试";

    expect(buildAutoPaperRequest(form, 9001, 101).generateMode).toBe("auto");
    expect(buildAutoPaperRequest(form, 9001, 101).autoRules).toEqual(form.autoRules);
  });

  it("builds the publish request with the expected scoring strategy", () => {
    expect(
      buildPublishRequest(9001, 8, [new Date("2026-06-20T08:00:00+08:00"), new Date("2026-06-20T10:00:00+08:00")], 2)
    ).toEqual({
      teacherId: 9001,
      id: 8,
      validStartTime: "2026-06-20T08:00:00.000+08:00",
      validEndTime: "2026-06-20T10:00:00.000+08:00",
      allowedAttempts: 2,
      scoringStrategy: "AUTO_GRADE"
    });
  });

  it("merges selected questions without duplicating existing ones", () => {
    expect(
      mergeSelectedQuestions(
        [
          { id: 1, score: 20 },
          { id: 2, score: 20 }
        ],
        [
          { id: 2, score: 40 },
          { id: 3, score: 0 }
        ]
      )
    ).toEqual([
      { id: 1, score: 20 },
      { id: 2, score: 20 },
      { id: 3, score: 0 }
    ]);
  });

  it("exposes the correct actions for each paper status", () => {
    expect(getPaperActions(0)).toMatchObject({ canEdit: true, canPublish: true, canWithdraw: false, canAnalyze: false });
    expect(getPaperActions(1)).toMatchObject({ canEdit: false, canOpenScore: true, canOpenAnswer: true, canAnalyze: true });
    expect(getPaperActions(2)).toMatchObject({ canEdit: true, canWithdraw: false, canAnalyze: true });
  });
});
