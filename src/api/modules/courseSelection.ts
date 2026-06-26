/**
 * 选课中心组接口封装。页面统一从这里调用，不直接写 axios。
 * 统一走 Gateway 路由前缀 /api/v1/course-selection。页面层不感知后端切换。
 */
import http from "@/api";
import { CourseSelection } from "@/api/interface/courseSelection";
import { useUserStore } from "@/stores/modules/user";

const P = "/api/v1/course-selection";

interface CourseSelectionEnvelope<T> {
  code: number;
  msg?: string;
  message?: string;
  data: T;
}

const requestCourseSelection = async <T>(
  path: string,
  init: RequestInit = {},
  options: { successCodes?: number[] } = {}
): Promise<CourseSelectionEnvelope<T>> => {
  const base = (import.meta.env as any).VITE_API_URL || "";
  const userStore = useUserStore();
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (userStore.token) {
    headers.set("Authorization", `Bearer ${userStore.token}`);
    headers.set("x-access-token", userStore.token);
  }

  const res = await fetch(`${base}${P}${path}`, {
    credentials: "include",
    ...init,
    headers
  });
  const payload = (await res.json()) as CourseSelectionEnvelope<T>;
  const successCodes = options.successCodes ?? [0, 200];
  if (!res.ok || (payload.code && !successCodes.includes(payload.code))) {
    throw {
      code: payload.code,
      msg: payload.msg || payload.message,
      data: payload.data
    };
  }
  return payload;
};

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
export const enrollApi = (params: CourseSelection.EnrollReq, options: { queueAsSuccess?: boolean } = {}) =>
  requestCourseSelection<CourseSelection.EnrollResult | CourseSelection.QueuePosition>(
    "/enrollments",
    {
      method: "POST",
      body: JSON.stringify(params)
    },
    { successCodes: options.queueAsSuccess ? [0, 200, 30201] : undefined }
  );
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
export const sendAiMessageApi = (
  conversationId: string,
  params: CourseSelection.AiMessageReq,
  callbacks: {
    onDelta: (text: string) => void;
    onToolCall: (name: string, args: string) => void;
    onDone: (msgId: string, offerings: string[]) => void;
  }
): Promise<void> => {
  const base = (import.meta.env as any).VITE_API_URL || "";
  const userStore = useUserStore();
  const headers = new Headers({ "Content-Type": "application/json" });
  if (userStore.token) {
    headers.set("Authorization", `Bearer ${userStore.token}`);
    headers.set("x-access-token", userStore.token);
  }
  return fetch(`${base}${P}/ai/conversations/${conversationId}/messages`, {
    method: "POST",
    headers,
    credentials: "include",
    body: JSON.stringify(params)
  }).then(async res => {
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let eventType = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("event: ")) {
          eventType = line.slice(7).trim();
        } else if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (eventType === "delta") {
            const parsed: CourseSelection.AiDeltaEvent = JSON.parse(data);
            callbacks.onDelta(parsed.content);
          } else if (eventType === "tool_call") {
            const parsed: CourseSelection.AiToolCallEvent = JSON.parse(data);
            callbacks.onToolCall(parsed.name, parsed.arguments);
          } else if (eventType === "done") {
            const parsed: CourseSelection.AiDoneEvent = JSON.parse(data);
            callbacks.onDone(parsed.message_id || parsed.conversation_id || conversationId, parsed.offerings || []);
          }
          eventType = "";
        }
      }
    }
  });
};

// ---------------- 教师：花名册 ----------------
export const getTeachingOfferingsApi = (semester: string) =>
  http.get<{ list: CourseSelection.TeachingOffering[] }>(`${P}/teaching/offerings`, { semester });
export const getTeachingRosterApi = (offeringId: string, includeDropped = false) =>
  http.get<CourseSelection.Roster>(`${P}/teaching/offerings/${offeringId}/roster`, { include_dropped: includeDropped });

// ---------------- 教务：窗口 / 抽签 / 容量 / 限流 / 监控 ----------------
export const setWindowApi = (params: CourseSelection.WindowReq) => http.post(`${P}/admin/windows`, params);
export const listWindowsApi = (semester?: string) =>
  http.get<{ list: CourseSelection.WindowReq[] }>(`${P}/admin/windows`, semester ? { semester } : {});
export const getDashboardApi = () => http.get<CourseSelection.Dashboard>(`${P}/admin/dashboard`);
export const triggerLotteryApi = (params: CourseSelection.LotteryRunReq) =>
  http.post<CourseSelection.LotteryRun>(`${P}/admin/lottery/runs`, params);
export const getLotteryRunApi = (runId: string) => http.get<CourseSelection.LotteryRun>(`${P}/admin/lottery/runs/${runId}`);
export const adjustCapacityApi = (offeringId: string, params: CourseSelection.CapacityAdjustReq) =>
  http.post(`${P}/admin/capacity/${offeringId}`, params);
export const proxyEnrollApi = (params: CourseSelection.ProxyEnrollReq) =>
  http.post<CourseSelection.EnrollResult>(`${P}/admin/proxy-enroll`, params);
export const updateThrottleApi = (params: CourseSelection.ThrottleReq) => http.post(`${P}/admin/throttle`, params);
