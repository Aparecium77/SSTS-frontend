export interface QuestionSearchForm {
  keyword: string;
  type: number | "";
  difficulty: number | "";
}

export interface QuestionFormData {
  id?: number;
  type: number;
  stem: string;
  options: string[];
  answer: string;
  difficulty: number;
  knowledgePoints: string[];
}

export function createDefaultQuestionForm(): QuestionFormData {
  return {
    id: undefined,
    type: 1,
    stem: "",
    options: ["", "", "", ""],
    answer: "",
    difficulty: 1,
    knowledgePoints: []
  };
}

export function createEmptyQuestionSearchForm(): QuestionSearchForm {
  return { keyword: "", type: "", difficulty: "" };
}

export function buildQuestionBankQuery(
  searchForm: QuestionSearchForm,
  current: number,
  size: number,
  teacherId: number,
  courseId: number
) {
  return {
    current,
    size,
    teacherId,
    courseId,
    keyword: searchForm.keyword || undefined,
    type: searchForm.type || undefined,
    difficulty: searchForm.difficulty || undefined
  };
}

export function getQuestionFormByType(type: number): Pick<QuestionFormData, "answer" | "options"> {
  return {
    answer: "",
    options: type === 2 ? ["正确", "错误"] : ["", "", "", ""]
  };
}

export function cloneQuestionForEdit(row: Partial<QuestionFormData>): QuestionFormData {
  return {
    id: row.id,
    type: row.type ?? 1,
    stem: row.stem ?? "",
    options: row.options && row.options.length > 0 ? [...row.options] : row.type === 2 ? ["正确", "错误"] : ["", "", "", ""],
    answer: row.answer ?? "",
    difficulty: row.difficulty ?? 1,
    knowledgePoints: [...(row.knowledgePoints ?? [])]
  };
}

export function validateQuestionForm(formData: QuestionFormData): boolean {
  return Boolean(formData.stem && formData.answer);
}

export function normalizeQuestionOptions(type: number, options: string[]): string[] {
  if (type !== 1) {
    return ["正确", "错误"];
  }

  return options.map((opt, idx) => {
    const prefix = `${String.fromCharCode(65 + idx)}. `;
    return opt.startsWith(String.fromCharCode(65 + idx)) ? opt : `${prefix}${opt}`;
  });
}

export function buildQuestionRequest(formData: QuestionFormData, teacherId: number, courseId: number) {
  return {
    teacherId,
    courseId,
    ...formData,
    options: normalizeQuestionOptions(formData.type, formData.options)
  };
}

export function shouldMoveToPreviousPageAfterDelete(rowCount: number, currentPage: number): boolean {
  return rowCount === 1 && currentPage > 1;
}
