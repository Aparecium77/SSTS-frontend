/**
 * 选课中心组接口封装。页面统一从这里调用，不直接写 axios。
 * baseURL = VITE_API_URL(/api)，后端路由前缀 /api/course-selection/v1，故此处路径以
 * /course-selection/v1 开头。联调阶段只改本文件即可，页面层不感知后端切换。
 */
import http from "@/api";
import { CourseSelection } from "@/api/interface/courseSelection";

const P = "/course-selection/v1";

// ---------------- 学生：培养方案 ----------------
export const getMyStudyPlanApi = () => http.get<CourseSelection.StudyPlan | null>(`${P}/study-plans/me`);
export const saveMyStudyPlanApi = (params: CourseSelection.SavePlanReq) =>
  http.put<CourseSelection.PlanValidationResult>(`${P}/study-plans/me`, params);
export const validateMyStudyPlanApi = (params: CourseSelection.SavePlanReq) =>
  http.post<CourseSelection.PlanValidationResult>(`${P}/study-plans/me/validate`, params);
export const deletePlanItemApi = (planItemId: string) => http.delete(`${P}/study-plans/me/items/${planItemId}`);

// ---------------- 学生：课程检索 ----------------
export const searchCoursesApi = (params: CourseSelection.SearchQuery) =>
  http.get<CourseSelection.SearchResult>(`${P}/courses/search`, params);
export const getOfferingApi = (offeringId: string) => http.get<CourseSelection.OfferingDetail>(`${P}/offerings/${offeringId}`);
export const getOfferingConflictsApi = (offeringId: string) =>
  http.get<CourseSelection.ConflictResult>(`${P}/offerings/${offeringId}/conflicts`, { student_id: "me" });

// ---------------- 学生：选课操作 ----------------
export const enrollApi = (params: CourseSelection.EnrollReq) =>
  http.post<CourseSelection.EnrollResult>(`${P}/enrollments`, params);
export const dropEnrollmentApi = (enrollmentId: string) => http.delete(`${P}/enrollments/${enrollmentId}`);
export const swapEnrollmentApi = (params: CourseSelection.SwapReq) =>
  http.post<CourseSelection.EnrollResult>(`${P}/enrollments/swap`, params);
export const getMyEnrollmentsApi = (semester: string, status?: string) =>
  http.get<CourseSelection.EnrollmentList>(`${P}/enrollments/me`, { semester, status });
export const getQueuePositionApi = (offeringId: string) =>
  http.get<CourseSelection.QueuePosition>(`${P}/enrollments/me/queue-position`, { offering_id: offeringId });
export const getMyTimetableApi = (semester: string) =>
  http.get<CourseSelection.Timetable>(`${P}/enrollments/me/timetable`, { semester });

// ---------------- 学生：AI 助手 ----------------
export const recommendApi = (params: CourseSelection.RecommendReq) =>
  http.post<CourseSelection.RecommendResult>(`${P}/ai/recommendations`, params);
export const acceptRecommendationApi = (recId: string) =>
  http.post<CourseSelection.AcceptResult>(`${P}/ai/recommendations/${recId}/accept`);
export const newAiConversationApi = () => http.post<{ conversation_id: string }>(`${P}/ai/conversations`);

// ---------------- 教师：花名册 ----------------
export const getTeachingOfferingsApi = (semester: string) =>
  http.get<{ list: CourseSelection.TeachingOffering[] }>(`${P}/teaching/offerings`, { semester });
export const getTeachingRosterApi = (offeringId: string, includeDropped = false) =>
  http.get<CourseSelection.Roster>(`${P}/teaching/offerings/${offeringId}/roster`, { include_dropped: includeDropped });

// ---------------- 教务：窗口 / 抽签 / 容量 / 限流 / 监控 ----------------
export const setWindowApi = (params: CourseSelection.WindowReq) => http.post(`${P}/admin/windows`, params);
export const getDashboardApi = () => http.get<CourseSelection.Dashboard>(`${P}/admin/dashboard`);
export const triggerLotteryApi = (params: CourseSelection.LotteryRunReq) =>
  http.post<CourseSelection.LotteryRun>(`${P}/admin/lottery/runs`, params);
export const getLotteryRunApi = (runId: string) => http.get<CourseSelection.LotteryRun>(`${P}/admin/lottery/runs/${runId}`);
export const adjustCapacityApi = (offeringId: string, params: CourseSelection.CapacityAdjustReq) =>
  http.post(`${P}/admin/capacity/${offeringId}`, params);
export const updateThrottleApi = (params: CourseSelection.ThrottleReq) => http.post(`${P}/admin/throttle`, params);
