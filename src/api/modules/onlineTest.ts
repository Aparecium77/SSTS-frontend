/**
 * 在线测试 — API 请求函数。
 * 页面中不要直接写 axios/http，统一从这里导出。
 */
import http from "@/api";
import type {
  ApiRequestBody,
  BeginExamReq,
  BeginExamResponse,
  ExamPaperStudentVO,
  ExamRecordItem,
  ExamRecordReviewVO,
  GetExamReviewReq,
  ListMyExamRecordsReq,
  PageResult,
  SaveExamProgressReq,
  SubmitExamReq
} from "@/api/interface/onlineTest";

const ACTIONS_URL = "/api/ot/v1/actions";

/** 通用 POST action 请求 */
function postAction<T>(action: string, data: Record<string, unknown>, opts?: { silent?: boolean }): Promise<T> {
  const body: ApiRequestBody = { action, data };
  return http.post<{ data: T }>(ACTIONS_URL, body, { skipCodeCheck: opts?.silent }).then(res => res.data);
}

/** 对已预期可能失败的操作静默处理，不弹全局错误提示 */
function postActionSilent<T>(action: string, data: Record<string, unknown>): Promise<T> {
  return postAction(action, data, { silent: true });
}

/* ────── 考试列表 ────── */

export function listMyExamRecords(params: ListMyExamRecordsReq): Promise<PageResult<ExamRecordItem>> {
  return postAction("list_my_exam_records", params as unknown as Record<string, unknown>);
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
