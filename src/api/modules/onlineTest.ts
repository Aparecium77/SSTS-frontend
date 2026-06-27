/**
 * 在线测试 — API 请求函数。
 * 页面中不要直接写 axios/http，统一从这里导出。
 */
import http from "@/api";
import { ONLINE_TEST_API } from "@/api/config/servicePort";
import type {
  ApiRequestBody,
  PageResult,
  ExamRecordItem,
  ListMyExamRecordsReq,
  ExamPaperStudentVO,
  BeginExamReq,
  BeginExamResponse,
  SaveExamProgressReq,
  SubmitExamReq,
  ExamRecordReviewVO,
  GetExamReviewReq,
  QuestionVO,
  AddQuestionReq,
  UpdateQuestionReq,
  DeleteQuestionReq,
  GetQuestionReq,
  QueryQuestionBankReq,
  CreateExamPaperReq,
  UpdateExamPaperReq,
  GenerateExamPaperReq,
  PublishExamPaperReq,
  QueryExamPapersReq,
  ExamPaperVO,
  ActionByIdReq,
  ExamStatsVO
} from "@/api/interface/onlineTest";

const ACTIONS_URL = `${ONLINE_TEST_API}/actions`;

/** 通用 POST action 请求 */
function postAction<T>(action: string, data: Record<string, unknown>, opts?: { silent?: boolean }): Promise<T> {
  const body: ApiRequestBody = { action, data };
  return http.post<any>(ACTIONS_URL, body, { skipCodeCheck: opts?.silent }).then(res => res.data) as Promise<T>;
}

/** 对已预期可能失败的操作静默处理，不弹全局错误提示 */
function postActionSilent<T>(action: string, data: Record<string, unknown>): Promise<T> {
  return postAction(action, data, { silent: true });
}

/* ────── 考试列表 ────── */

export function listMyExamRecords(params: ListMyExamRecordsReq): Promise<PageResult<ExamRecordItem>> {
  return postActionSilent("list_my_exam_records", params as unknown as Record<string, unknown>);
}

/* ────── 开始考试 ────── */

export function beginExam(params: BeginExamReq): Promise<BeginExamResponse> {
  return postActionSilent("begin_an_exam", {
    studentId: params.studentId,
    id: params.examId
  } as unknown as Record<string, unknown>);
}

/* ────── 保存答题进度 ────── */

export function saveExamProgress(params: SaveExamProgressReq): Promise<{ message: string }> {
  return postAction("save_exam_progress", params as unknown as Record<string, unknown>);
}

/* ────── 交卷 ────── */

export function submitExamAnswers(params: SubmitExamReq): Promise<{ message: string; recordId: number }> {
  return postAction("submit_exam_answers", params as unknown as Record<string, unknown>);
}

/* ────── 查看试卷基本信息 ────── */

export function getExamPaperForStudent(examId: number): Promise<ExamPaperStudentVO> {
  return postAction("get_exam_paper_for_student", { id: examId } as unknown as Record<string, unknown>);
}

/* ────── 成绩分析与作答回顾 ────── */

export function getExamRecordReview(params: GetExamReviewReq): Promise<ExamRecordReviewVO> {
  return postAction("get_exam_record_review", params as unknown as Record<string, unknown>);
}

/* ────── 题库管理 ────── */

export function addQuestion(params: AddQuestionReq): Promise<{ message: string }> {
  return postAction("add_a_question", params as unknown as Record<string, unknown>);
}

export function updateQuestion(params: UpdateQuestionReq): Promise<{ message: string }> {
  return postAction("update_a_question", params as unknown as Record<string, unknown>);
}

export function deleteQuestion(params: DeleteQuestionReq): Promise<{ deleted: boolean }> {
  return postAction("delete_a_question", params as unknown as Record<string, unknown>);
}

export function getQuestion(params: GetQuestionReq): Promise<QuestionVO> {
  return postAction("get_a_question", params as unknown as Record<string, unknown>);
}

export function queryQuestionBank(params: QueryQuestionBankReq): Promise<PageResult<QuestionVO>> {
  return postAction("query_question_bank", params as unknown as Record<string, unknown>);
}

/** Excel 导入题库 (使用原生的 FormData 和特定上传 URL) */
export function importQuestionsByExcel(teacherId: number, file: File): Promise<any> {
  const formData = new FormData();
  formData.append("teacherId", teacherId.toString());
  formData.append("file", file);
  return http.post(`${ONLINE_TEST_API}/actions/question-bank/import`, formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
}

/* ────── 试卷管理 ────── */

export function createExamPaper(params: CreateExamPaperReq): Promise<{ id: number; message: string }> {
  return postAction("create_exam_paper", params as unknown as Record<string, unknown>);
}

export function updateExamPaper(params: UpdateExamPaperReq): Promise<{ message: string }> {
  return postAction("update_exam_paper", params as unknown as Record<string, unknown>);
}

export function generateExamPaper(params: GenerateExamPaperReq): Promise<{ id: number; message: string }> {
  return postAction("generate_exam_paper", params as unknown as Record<string, unknown>);
}

export function deleteExamPaper(params: ActionByIdReq): Promise<{ deleted: boolean }> {
  return postAction("delete_exam_paper", params as unknown as Record<string, unknown>);
}

export function publishExamPaper(params: PublishExamPaperReq): Promise<{ message: string }> {
  return postAction("publish_exam_paper", params as unknown as Record<string, unknown>);
}

export function withdrawExamPaper(params: ActionByIdReq): Promise<{ message: string }> {
  return postAction("withdraw_exam_paper", params as unknown as Record<string, unknown>);
}

export function queryExamPapers(params: QueryExamPapersReq): Promise<PageResult<ExamPaperVO>> {
  return postAction("query_exam_papers", params as unknown as Record<string, unknown>);
}

export function previewExamPaper(params: ActionByIdReq): Promise<ExamPaperStudentVO> {
  return postAction("preview_exam_paper", params as unknown as Record<string, unknown>);
}

/* ────── 成绩权限与统计分析 ────── */

export function openExamScore(params: ActionByIdReq): Promise<{ message: string }> {
  return postAction("open_exam_score", params as unknown as Record<string, unknown>);
}

export function openExamAnswer(params: ActionByIdReq): Promise<{ message: string }> {
  return postAction("open_exam_answer", params as unknown as Record<string, unknown>);
}

export function getExamStats(params: ActionByIdReq): Promise<ExamStatsVO> {
  return postAction("get_exam_stats", params as unknown as Record<string, unknown>);
}

/** 导出成绩 Excel (指定 responseType 为 blob) */
export function exportExamScores(teacherId: number, id: number): Promise<Blob> {
  return http.post(
    `${ONLINE_TEST_API}/actions/exams/export`,
    { teacherId, id },
    { responseType: "blob" }
  ) as unknown as Promise<Blob>;
}
