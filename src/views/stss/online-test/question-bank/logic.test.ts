import { describe, expect, it } from "vitest";
import {
  buildQuestionBankQuery,
  buildQuestionRequest,
  cloneQuestionForEdit,
  createDefaultQuestionForm,
  createEmptyQuestionSearchForm,
  getQuestionFormByType,
  normalizeQuestionOptions,
  shouldMoveToPreviousPageAfterDelete,
  validateQuestionForm
} from "./logic";

describe("online-test question-bank logic", () => {
  it("creates a clean default form for new questions", () => {
    expect(createDefaultQuestionForm()).toEqual({
      id: undefined,
      type: 1,
      stem: "",
      options: ["", "", "", ""],
      answer: "",
      difficulty: 1,
      knowledgePoints: []
    });
  });

  it("creates an empty search form", () => {
    expect(createEmptyQuestionSearchForm()).toEqual({
      keyword: "",
      type: "",
      difficulty: ""
    });
  });

  it("switches form options correctly when the question type changes", () => {
    expect(getQuestionFormByType(1)).toEqual({ answer: "", options: ["", "", "", ""] });
    expect(getQuestionFormByType(2)).toEqual({ answer: "", options: ["正确", "错误"] });
  });

  it("normalizes single-choice options with alphabetic prefixes", () => {
    expect(normalizeQuestionOptions(1, ["需求分析", "B. 概要设计", "详细设计", "编码"])).toEqual([
      "A. 需求分析",
      "B. 概要设计",
      "C. 详细设计",
      "D. 编码"
    ]);
  });

  it("forces judge-question options to true-false labels", () => {
    expect(normalizeQuestionOptions(2, ["A", "B"])).toEqual(["正确", "错误"]);
  });

  it("validates that stem and answer are required before saving", () => {
    const form = createDefaultQuestionForm();
    expect(validateQuestionForm(form)).toBe(false);

    form.stem = "软件生命周期的第一个阶段是？";
    form.answer = "A";
    expect(validateQuestionForm(form)).toBe(true);
  });

  it("builds the question-bank query payload from the online-test filters", () => {
    expect(buildQuestionBankQuery({ keyword: "需求", type: 1, difficulty: "" }, 2, 20, 9001, 101)).toEqual({
      current: 2,
      size: 20,
      teacherId: 9001,
      courseId: 101,
      keyword: "需求",
      type: 1,
      difficulty: undefined
    });
  });

  it("builds the create/update request payload with normalized options", () => {
    const req = buildQuestionRequest(
      {
        id: 8,
        type: 1,
        stem: "以下哪项属于白盒测试？",
        options: ["语句覆盖", "边界值分析", "等价类划分", "因果图"],
        answer: "A",
        difficulty: 2,
        knowledgePoints: ["测试技术"]
      },
      9001,
      101
    );

    expect(req.options).toEqual(["A. 语句覆盖", "B. 边界值分析", "C. 等价类划分", "D. 因果图"]);
    expect(req.teacherId).toBe(9001);
    expect(req.courseId).toBe(101);
  });

  it("fills fallback options when editing a question with missing options", () => {
    expect(cloneQuestionForEdit({ type: 2, stem: "判断题", options: [] }).options).toEqual(["正确", "错误"]);
  });

  it("detects whether deletion should move the table back one page", () => {
    expect(shouldMoveToPreviousPageAfterDelete(1, 3)).toBe(true);
    expect(shouldMoveToPreviousPageAfterDelete(2, 3)).toBe(false);
    expect(shouldMoveToPreviousPageAfterDelete(1, 1)).toBe(false);
  });
});
