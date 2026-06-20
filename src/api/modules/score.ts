import http from "@/api";
import { GRADE_API } from "@/api/config/servicePort";
import type { ResultData } from "@/api/interface";
import type { Score } from "@/api/interface/score";
import { ResultEnum } from "@/enums/httpEnum";
import { useUserStore } from "@/stores/modules/user";
import { toDownloadBlob } from "@/utils/download";

const SCORE_PREFIX = GRADE_API;
const SCORE_SUCCESS_CODES = new Set([0, 10000]);

export interface ScoreRequestOptions {
  loading?: boolean;
  cancel?: boolean;
  headers?: Record<string, string>;
  [key: string]: unknown;
}

export const getScoreUserId = () => {
  const userStore = useUserStore();
  return userStore.userInfo.userId || userStore.token || "anonymous";
};

export const toScoreBackendRole = (role?: string): Score.BackendRole => {
  if (role === "academic_admin") return "admin";
  if (role === "dean") return "dean";
  if (role === "admin") return "admin";
  if (role === "teacher") return "teacher";
  return "student";
};

export const scoreRequestOptions = (options: ScoreRequestOptions = {}) => {
  const userStore = useUserStore();
  const userInfo = userStore.userInfo;

  return {
    ...options,
    skipCodeCheck: true,
    headers: {
      ...(options.headers ?? {}),
      "X-User-ID": getScoreUserId(),
      "X-User-Role": toScoreBackendRole(userInfo.role),
      "X-User-Name": userInfo.name || ""
    }
  };
};

const adaptScoreResp = <T>(resp: Score.BackendResp<T>): ResultData<T> => {
  if (!SCORE_SUCCESS_CODES.has(resp.code)) {
    return Promise.reject({
      code: String(resp.code),
      msg: resp.message,
      data: resp.data
    }) as never;
  }

  return {
    code: String(ResultEnum.SUCCESS),
    msg: resp.message,
    data: resp.data
  };
};

const scorePath = (url: string) => `${SCORE_PREFIX}${url}`;
const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const PDF_MIME = "application/pdf";

const scoreHttp = {
  async get<T>(url: string, params?: object, options: ScoreRequestOptions = {}) {
    const resp = (await http.get<Score.BackendResp<T>>(
      scorePath(url),
      params,
      scoreRequestOptions(options)
    )) as unknown as Score.BackendResp<T>;
    return adaptScoreResp(resp);
  },
  async post<T>(url: string, body?: object | FormData, options: ScoreRequestOptions = {}) {
    const resp = (await http.post<Score.BackendResp<T>>(
      scorePath(url),
      body,
      scoreRequestOptions(options)
    )) as unknown as Score.BackendResp<T>;
    return adaptScoreResp(resp);
  },
  async postResolved<T>(url: string, body?: object | FormData, options: ScoreRequestOptions = {}) {
    // 响应拦截器已返回 body（{ code, message, data }），不是 AxiosResponse
    const resp = (await http.service.post<Score.BackendResp<T>>(scorePath(url), body, {
      validateStatus: () => true,
      ...scoreRequestOptions(options)
    })) as unknown as Score.BackendResp<T>;
    return adaptScoreResp(resp);
  },
  async put<T>(url: string, body?: object, options: ScoreRequestOptions = {}) {
    const resp = (await http.put<Score.BackendResp<T>>(
      scorePath(url),
      body,
      scoreRequestOptions(options)
    )) as unknown as Score.BackendResp<T>;
    return adaptScoreResp(resp);
  }
};

const scoreDownload = async (url: string, params: object, mimeType: string) => {
  const response = await http.service.get(scorePath(url), {
    params,
    responseType: "blob",
    ...scoreRequestOptions({ loading: true, cancel: false })
  });
  return toDownloadBlob(response, mimeType);
};

const encodePath = (value: string | number) => encodeURIComponent(String(value));

export const getGradeCourses = () => scoreHttp.get<Score.CourseList>("/courses");

export const getCourseStudents = (courseId: string, params: { semester: string }) =>
  scoreHttp.get<Score.CourseStudentList>(`/courses/${encodePath(courseId)}/students`, params);

export const getGradeConfig = (courseId: string, params: { semester: string }) =>
  scoreHttp.get<Score.GradeConfig>(`/courses/${encodePath(courseId)}/grade-config`, params, { cancel: false });

export const saveGradeConfig = (courseId: string, body: Score.SaveGradeConfigReq) =>
  scoreHttp.put<Score.SaveGradeConfigResp>(`/courses/${encodePath(courseId)}/grade-config`, body);

/** 回退单门课流程数据（默认删分项配置；keep_config 仅清成绩与审批） */
export const resetCourseWorkflow = (courseId: string, params: { semester: string; keep_config?: boolean }) => {
  const query = new URLSearchParams({
    semester: params.semester,
    keep_config: params.keep_config ? "true" : "false"
  });
  return scoreHttp.post<Score.CourseWorkflowResetResp>(`/courses/${encodePath(courseId)}/workflow-reset?${query.toString()}`);
};

export const createComponentConfigsLegacy = (body: Score.LegacyComponentConfigReq) =>
  scoreHttp.post<Score.SaveGradeConfigResp>("/component-configs", body);

export const getGradeRecords = (params: Score.GradeRecordListReq = {}) =>
  scoreHttp.get<Score.GradeRecordList>("/grade-records", params);

export const getGradeSheet = (courseId: string, params: { semester: string; page?: number; page_size?: number }) =>
  scoreHttp.get<Score.GradeSheet>(`/courses/${encodePath(courseId)}/grade-sheet`, params);

export const getCourseRecords = (
  courseId: string,
  params: {
    semester: string;
    student_no?: string;
    student_name?: string;
    min_score?: number;
    max_score?: number;
    status?: string;
    sort_order?: "asc" | "desc";
  }
) => scoreHttp.get<Score.GradeSheet>(`/grade-records/courses/${encodePath(courseId)}/records`, params, { cancel: false });

export const getMyGradeRecords = (courseId: string, params: { semester: string }) =>
  scoreHttp.get<Score.StudentGradeComponentDetail>(`/students/me/grades/${encodePath(courseId)}/records`, params);

export const createGradeRecord = (body: Score.SaveGradeRecordReq) =>
  scoreHttp.post<Score.SaveGradeRecordResp>("/grade-records", body);

export const updateGradeRecord = (recordId: number, body: Score.UpdateGradeRecordReq) =>
  scoreHttp.put<Score.UpdateGradeRecordResp>(`/grade-records/${encodePath(recordId)}`, body);

export const batchCreateGradeRecords = (body: Score.BatchSaveGradeRecordsReq) =>
  scoreHttp.post<Score.BatchResult>("/grade-records/batch", body);

export const importGradeExcel = (file: File, body: Score.ImportGradeExcelReq) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("course_id", body.course_id);
  formData.append("semester", body.semester);
  formData.append("component_config_id", String(body.component_config_id));
  // 校验失败时后端返回 400 + JSON body，需 postResolved 避免 axios 4xx 被当成网络错误
  return scoreHttp.postResolved<Score.BatchResult>("/grade-records/import-excel", formData);
};

export const upsertExternalMappings = (body: Score.ExternalMappingsReq) =>
  scoreHttp.post<Score.ExternalMappingsResp>("/grade-records/external-mappings", body);

export const importExamScores = (body: Score.ImportExternalScoresReq) =>
  scoreHttp.post<Score.ImportExternalScoresResp>("/grade-records/import-exam", body);

export const importForumScores = (body: Score.ImportExternalScoresReq) =>
  scoreHttp.post<Score.ImportExternalScoresResp>("/grade-records/import-forum", body);

export const getGradeRecordLogs = (
  params: {
    course_id?: string;
    operator_id?: string;
    operation_type?: string;
    target_id?: number;
    page?: number;
    page_size?: number;
  } = {}
) => scoreHttp.get<Score.GradeRecordLogList>("/grade-record-logs", params);

export const calculatePreview = (courseId: string, body: Score.CalculateGradeReq) =>
  scoreHttp.post<Score.CalculateGradeResp>(`/courses/${encodePath(courseId)}/grade-calculations`, body);

export const submitCourseGrades = (courseId: string, body: Score.SubmitCourseGradesReq) =>
  scoreHttp.postResolved<Score.Submission>(`/courses/${encodePath(courseId)}/grade-submissions`, body);

export const getGradeSubmissions = (params: { course_id?: string; semester?: string } = {}) =>
  scoreHttp.get<Score.SubmissionList>("/grade-submissions", params);

export const approveSubmission = (submissionId: number, body: Score.ReviewSubmissionReq = {}) =>
  scoreHttp.put<Score.Submission>(`/grade-submissions/${encodePath(submissionId)}/approve`, body);

export const rejectSubmission = (submissionId: number, body: Score.ReviewSubmissionReq = {}) =>
  scoreHttp.put<Score.Submission>(`/grade-submissions/${encodePath(submissionId)}/reject`, body);

export const publishSubmission = (submissionId: number) =>
  scoreHttp.put<Score.PublishSubmissionResp>(`/grade-submissions/${encodePath(submissionId)}/publish`, {});

export const publishTotalsLegacy = (body: Score.PublishTotalsReq) =>
  scoreHttp.post<Score.PublishSubmissionResp>("/grade-submissions/totals/publish", body);

export const createModifyRequest = (body: Score.ModifyRequestReq) =>
  scoreHttp.post<Score.ModifyRequestCreateResp>("/grade-record-modify-requests", body);

export const getModifyRequests = (params: Score.ModifyRequestListReq = {}) =>
  scoreHttp.get<Score.ModifyRequestList>("/grade-record-modify-requests", params);

export const approveModifyRequest = (requestId: number, body: Score.ReviewModifyRequestReq = {}) =>
  scoreHttp.put<Score.ModifyRequestReviewResp>(`/grade-record-modify-requests/${encodePath(requestId)}/approve`, body);

export const rejectModifyRequest = (requestId: number, body: Score.ReviewModifyRequestReq = {}) =>
  scoreHttp.put<Score.ModifyRequestReviewResp>(`/grade-record-modify-requests/${encodePath(requestId)}/reject`, body);

export const getModifyRequestLogs = (requestId: number) =>
  scoreHttp.get<Score.ModifyRequestLogList>(`/grade-record-modify-requests/${encodePath(requestId)}/logs`);

/** 登录前按学号或 student_id 查名册（Mock 登录与正式网关均可复用） */
export const resolveStudentLogin = (login: string) =>
  scoreHttp.get<Score.StudentLoginResolve>("/students/login-resolve", { login }, { loading: false, cancel: false });

export const getMyGrades = (params: { semester?: string } = {}) =>
  scoreHttp.get<Score.StudentGradeList>("/students/me/grades", params);

export const getMyCredits = () => scoreHttp.get<Score.CreditProgress>("/students/me/credits");

export const getMyStatistics = () => scoreHttp.get<Score.StudentStatistics>("/students/me/statistics");

export const getStudentGrades = (studentId: string, params: { semester?: string } = {}) =>
  scoreHttp.get<Score.StudentGradeList>(`/students/${encodePath(studentId)}/grades`, params);

export const getStudentStatistics = (studentId: string) =>
  scoreHttp.get<Score.StudentStatistics>(`/students/${encodePath(studentId)}/statistics`);

export const getStudentGpa = (studentId: string) => scoreHttp.get<Score.StudentGpa>(`/students/${encodePath(studentId)}/gpa`);

export const getSemesterGpa = (studentId: string) =>
  scoreHttp.get<Score.SemesterGpa[]>(`/students/${encodePath(studentId)}/semester-gpa`);

export const refreshGpa = (body: Score.RefreshGpaReq) => scoreHttp.post<Score.RefreshGpaResp>("/gpa-refresh", body);

export const getCourseAnalysis = (courseId: string, params: { semester: string }) =>
  scoreHttp.get<Score.CourseAnalysis>(`/courses/${encodePath(courseId)}/analysis`, params);

export const syncRoster = (body: Score.SyncRosterReq) => scoreHttp.post<Score.SyncRosterResp>("/sync-roster", body);

export const exportCourseAnalysis = (courseId: string, params: { semester: string; format?: "xlsx" | "pdf" }) =>
  scoreDownload(
    `/courses/${encodePath(courseId)}/analysis/export`,
    { ...params, format: params.format ?? "xlsx" },
    params.format === "pdf" ? PDF_MIME : XLSX_MIME
  );

export const queryAdminGradeRecords = (
  params: {
    course_id?: string;
    semester?: string;
    student_id?: string;
    student_no?: string;
    major?: string;
    college?: string;
    grade?: string;
  } = {}
) => scoreHttp.get<Score.AdminGradeQueryList>("/admin/grade-query/records", params);

export const queryAdminStudentArchive = (studentId: string) =>
  scoreHttp.get<Score.AdminStudentArchive>(`/admin/grade-query/student/${encodePath(studentId)}`);

export const queryAdminCourseComparison = (
  params: {
    semester?: string;
    major?: string;
    college?: string;
    grade?: string;
  } = {}
) => scoreHttp.get<Score.AdminCourseComparisonList>("/admin/grade-query/course-comparison", params);

export const exportAdminGradeQuery = (
  params: {
    course_id?: string;
    semester?: string;
    student_id?: string;
    student_no?: string;
    major?: string;
    college?: string;
    grade?: string;
  } = {}
) => scoreDownload("/admin/grade-query/export", params, XLSX_MIME);

export const adminCreateGradeRecord = (body: Score.AdminCreateGradeRecordReq) =>
  scoreHttp.post<Score.AdminCreateGradeRecordResp>("/admin/grade-records", body);

export const adminOverrideGradeRecord = (recordId: number, body: Score.AdminOverrideGradeRecordReq) =>
  scoreHttp.post<Score.AdminOverrideGradeRecordResp>(`/admin/grade-records/${encodePath(recordId)}/override`, body);

export const exportGradeRecords = (params: {
  course_id: string;
  semester: string;
  format?: "excel" | "xlsx" | "pdf";
  student_no?: string;
  student_name?: string;
  min_score?: number;
  max_score?: number;
  status?: string;
  sort_order?: "asc" | "desc";
}) => scoreDownload("/grade-records/export", params, params.format === "pdf" ? PDF_MIME : XLSX_MIME);
