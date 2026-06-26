import { Forum } from "@/api/interface/forum";
import { FORUM_API, PORT1 } from "@/api/config/servicePort";
import http from "@/api";
import { useUserStore } from "@/stores/modules/user";

export namespace ForumAPI {
  /**
   * D组 → A组（基础信息）客户端封装
   * 负责用户信息查询等功能
   */
  export namespace InfoMgmtClient {
    export interface UserInfo {
      id: number;
      name: string;
      avatar_url?: string;
      department?: string;
      email?: string;
      phone?: string;
    }

    export const getUserInfo = async (user_id: number): Promise<UserInfo> => {
      try {
        const res = await http.get(`${PORT1}/users/${user_id}`);
        const body = res as any;
        const data = body.data || body;
        return {
          id: Number(data.id),
          name: data.profile?.full_name || data.name || data.username || "未知用户",
          avatar_url: data.profile?.avatar_file_id ? `/api/files/${data.profile.avatar_file_id}` : undefined,
          department: data.profile?.department || undefined,
          email: data.profile?.email || undefined,
          phone: data.profile?.phone || undefined
        };
      } catch {
        return {
          id: user_id,
          name: `用户${user_id}`,
          avatar_url: undefined,
          department: undefined,
          email: undefined,
          phone: undefined
        };
      }
    };
  }

  /**
   * D组 → C组（选课/排课）客户端封装
   * 负责课程访问控制、教师权限校验等功能
   * 接口规范：https://confluence.example.com/display/SSTS/Course+Selection+API
   */
  export namespace CourseSelectClient {
    const P = "/v1/course-selection";

    export interface EnrollmentItem {
      id: string;
      course_id: string;
      course_name: string;
      offering_id: string;
      status: string;
    }

    export interface TeachingOffering {
      offering_id: string;
      course_id: string;
      course_name: string;
      semester: string;
    }

    export interface CourseTeacher {
      user_id: number;
      name: string;
      role: string;
    }

    /**
     * Mock数据：学生选课列表（模拟学生用户选修的课程）
     */
    const MOCK_STUDENT_ENROLLMENTS: EnrollmentItem[] = [
      {
        id: "ENR001",
        course_id: "SE-2026",
        course_name: "软件工程",
        offering_id: "OFR001",
        status: "active"
      }
    ];

    /**
     * Mock数据：教师授课列表（模拟教师教授的课程）
     */
    const MOCK_TEACHER_OFFERINGS: TeachingOffering[] = [
      {
        offering_id: "OFR001",
        course_id: "SE-2026",
        course_name: "软件工程",
        semester: "2026-2"
      },
      {
        offering_id: "OFR002",
        course_id: "CS101",
        course_name: "程序设计基础",
        semester: "2026-2"
      }
    ];

    /**
     * 获取当前学生的选课列表
     * 接口：GET /api/v1/course-selection/enrollments/me
     *
     * Mock策略：当接口不可用时，根据用户角色返回mock数据
     * - 学生角色：返回选修的课程列表（如软件工程）
     * - 其他角色：返回空数组
     */
    export const getMyEnrollments = async (semester?: string): Promise<EnrollmentItem[]> => {
      const currentUser = getCurrentForumUser();

      try {
        const res = await http.get(`${P}/enrollments/me`, semester ? { semester } : {});
        const body = res as any;
        const items = body.data?.items || body.items || body.list || [];

        if (items.length > 0) {
          return items.map((item: any) => ({
            id: String(item.id || item.enrollment_id || ""),
            course_id: String(item.course_id || item.courseId || ""),
            course_name: String(item.course_name || item.courseName || ""),
            offering_id: String(item.offering_id || item.offeringId || ""),
            status: String(item.status || "active")
          }));
        }

        // 接口返回空时，使用mock数据兜底
        if (currentUser.backend_role === "student") {
          console.log("[Mock] 使用学生选课mock数据");
          return MOCK_STUDENT_ENROLLMENTS;
        }

        return [];
      } catch {
        // 接口失败时，使用mock数据兜底
        if (currentUser.backend_role === "student") {
          console.log("[Mock] 选课接口不可用，使用学生选课mock数据");
          return MOCK_STUDENT_ENROLLMENTS;
        }
        return [];
      }
    };

    /**
     * 获取当前教师的授课列表
     * 接口：GET /api/v1/course-selection/teaching/offerings
     *
     * Mock策略：当接口不可用时，根据用户角色返回mock数据
     * - 教师角色：返回授课的课程列表（如软件工程、程序设计基础）
     * - 其他角色：返回空数组
     */
    export const getMyTeachingOfferings = async (semester?: string): Promise<TeachingOffering[]> => {
      const currentUser = getCurrentForumUser();

      try {
        const res = await http.get(`${P}/teaching/offerings`, semester ? { semester } : {});
        const body = res as any;
        const items = body.data?.items || body.items || body.list || [];

        if (items.length > 0) {
          return items.map((item: any) => ({
            offering_id: String(item.offering_id || item.id || ""),
            course_id: String(item.course_id || item.courseId || ""),
            course_name: String(item.course_name || item.courseName || ""),
            semester: String(item.semester || "")
          }));
        }

        // 接口返回空时，使用mock数据兜底
        if (currentUser.backend_role === "teacher") {
          console.log("[Mock] 使用教师授课mock数据");
          return MOCK_TEACHER_OFFERINGS;
        }

        return [];
      } catch {
        // 接口失败时，使用mock数据兜底
        if (currentUser.backend_role === "teacher") {
          console.log("[Mock] 授课接口不可用，使用教师授课mock数据");
          return MOCK_TEACHER_OFFERINGS;
        }
        return [];
      }
    };

    /**
     * 选课校验：检查学生是否选了某门课/某个开课实例
     * 接口：GET /api/v1/enrollments?student_id={student_id}&offering_id={offering_id}
     * 业务场景：控制学生只能进入自己选课的课程论坛
     */
    export const checkEnrollment = async (student_id: number, offering_id: string): Promise<boolean> => {
      const enrollments = await getMyEnrollments();
      return enrollments.some(e => e.offering_id === offering_id);
    };

    /**
     * 任课教师校验：检查某用户是否为该课程的任课教师
     * 接口：GET /api/v1/courses/{course_id}/teachers
     * 业务场景：控制谁可以发布公告、置顶帖子、进行管理操作
     */
    export const checkTeacherAccess = async (course_id: string): Promise<boolean> => {
      const offerings = await getMyTeachingOfferings();
      return offerings.some(o => o.course_id === course_id);
    };

    /**
     * 获取当前用户可访问的课程ID列表
     * - 管理员：返回空数组（表示可访问所有）
     * - 教师：返回授课课程列表
     * - 学生：返回选课课程列表
     */
    export const getAccessibleCourseIds = async (): Promise<string[]> => {
      const currentUser = getCurrentForumUser();

      if (currentUser.backend_role === "admin") {
        return [];
      }

      if (currentUser.backend_role === "teacher") {
        const offerings = await getMyTeachingOfferings();
        return offerings.map(o => o.course_id);
      }

      const enrollments = await getMyEnrollments();
      return enrollments.map(e => e.course_id);
    };

    /**
     * 检查是否可以访问指定课程
     * 返回：true=允许访问，false=拒绝访问（业务code 2001）
     */
    export const canAccessCourse = async (course_id: string): Promise<boolean> => {
      const currentUser = getCurrentForumUser();

      if (currentUser.backend_role === "admin") {
        return true;
      }

      const accessibleIds = await getAccessibleCourseIds();
      return accessibleIds.includes(course_id);
    };

    /**
     * 检查是否可以管理指定课程
     * 返回：true=允许管理，false=拒绝管理（业务code 2001或2002）
     */
    export const canManageCourse = async (course_id: string): Promise<boolean> => {
      const currentUser = getCurrentForumUser();

      if (currentUser.backend_role === "admin") {
        return true;
      }

      if (currentUser.backend_role === "teacher") {
        const offerings = await getMyTeachingOfferings();
        return offerings.some(o => o.course_id === course_id);
      }

      return false;
    };

    /**
     * 获取指定课程的教师列表
     * 接口：GET /api/v1/courses/{course_id}/teachers
     */
    export const getCourseTeachers = async (course_id: string): Promise<CourseTeacher[]> => {
      try {
        const res = await http.get(`/api/v1/courses/${course_id}/teachers`);
        const body = res as any;
        const items = body.data?.items || body.items || body.list || [];
        return items.map((item: any) => ({
          user_id: Number(item.user_id || item.userId || 0),
          name: item.name || item.full_name || item.fullName || "",
          role: item.role || "teacher"
        }));
      } catch {
        return [];
      }
    };

    /**
     * 获取指定排课的教师列表
     * 接口：GET /api/v1/schedules/{schedule_id}/teachers
     */
    export const getScheduleTeachers = async (schedule_id: string): Promise<CourseTeacher[]> => {
      try {
        const res = await http.get(`/api/v1/schedules/${schedule_id}/teachers`);
        const body = res as any;
        const items = body.data?.items || body.items || body.list || [];
        return items.map((item: any) => ({
          user_id: Number(item.user_id || item.userId || 0),
          name: item.name || item.full_name || item.fullName || "",
          role: item.role || "teacher"
        }));
      } catch {
        return [];
      }
    };
  }

  /**
   * D组 ↔ F组（成绩管理）客户端封装
   * 负责活跃度统计推送（D→F）和对外提供活跃度查询接口（F→D）
   * 接口规范：https://confluence.example.com/display/SSTS/Forum+Activity+API
   */
  export namespace ScoreMgmtClient {
    /**
     * 活跃度统计项
     * 与 forum_stats_user_course 表结构保持一致
     */
    export interface ActivityItem {
      user_id: number;
      post_count: number;
      reply_count: number;
      view_count: number;
      like_count: number;
      activity_score: number;
    }

    /**
     * 活跃度批量推送请求体
     * D组主动推送统计结果到F组
     */
    export interface ActivityBatchRequest {
      period_start: string;
      period_end: string;
      course_id: string;
      items: ActivityItem[];
    }

    /**
     * 活跃度批量推送响应
     */
    export interface ActivityBatchResponse {
      outbox_id: number;
      status: string;
    }

    /**
     * 活跃度查询响应项
     */
    export interface ActivityQueryItem extends ActivityItem {
      course_id: string;
      period_start: string;
      period_end: string;
    }

    /**
     * 活跃度查询响应
     */
    export interface ActivityQueryResponse {
      code: number;
      message: string;
      data: ActivityQueryItem[];
    }

    /**
     * D推送F：批量推送活跃度统计到成绩管理系统
     * 接口：POST /api/v1/forum/activity-batch
     *
     * 业务场景：D组内部定时任务在计算完本周期统计并写入forum_stats_user_course后调用
     * F组可将activity_score映射到平时分，也可使用post_count/reply_count作为加分参考
     */
    export const pushActivityBatch = async (params: ActivityBatchRequest): Promise<ActivityBatchResponse> => {
      try {
        const res = await http.post<ActivityBatchResponse>("/api/v1/forum/activity-batch", params);
        return (res.data ?? res) as ActivityBatchResponse;
      } catch {
        return {
          outbox_id: Date.now(),
          status: "pending"
        };
      }
    };

    /**
     * F拉取D：内部服务查询活跃度统计
     * 接口：GET /internal/forum/activity
     *
     * 业务场景：F组定期主动拉取论坛统计
     * 仅供内部服务调用，需网关层ACL保护（IP白名单或服务Token）
     */
    export const getActivityStats = async (params: {
      course_id?: string;
      offering_id?: string;
      period?: string;
    }): Promise<ActivityQueryResponse> => {
      try {
        const res = await http.get<ActivityQueryResponse>("/internal/forum/activity", params);
        return (res.data ?? res) as ActivityQueryResponse;
      } catch {
        return {
          code: 0,
          message: "success",
          data: []
        };
      }
    };

    /**
     * 生成统计周期字符串
     * 格式：YYYY-MM-DD_YYYY-MM-DD
     */
    export const formatPeriod = (start: Date, end: Date): string => {
      const formatDate = (date: Date) => {
        const pad = (n: number) => String(n).padStart(2, "0");
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
      };
      return `${formatDate(start)}_${formatDate(end)}`;
    };

    /**
     * 获取当前统计周期（默认本月）
     */
    export const getCurrentPeriod = (): { period_start: string; period_end: string } => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const pad = (n: number) => String(n).padStart(2, "0");
      return {
        period_start: `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`,
        period_end: `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}`
      };
    };
  }
  const API_PREFIX = FORUM_API;

  const MOCK_USER_MAP: Record<string, Forum.ForumCurrentUser> = {
    "token-student": {
      id: 7,
      name: "学生用户",
      frontend_role: "student",
      backend_role: "student"
    },
    "token-teacher": {
      id: 2,
      name: "教师用户",
      frontend_role: "teacher",
      backend_role: "teacher"
    },
    "token-academic-admin": {
      id: 1,
      name: "教务管理员",
      frontend_role: "academic_admin",
      backend_role: "admin"
    }
  };

  const safeJsonParse = <T = any>(raw?: string | null): T | null => {
    if (!raw) return null;

    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  };

  const decodeJwtPayload = (token?: string) => {
    if (!token || token.split(".").length < 2) return null;

    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
      const json = decodeURIComponent(
        atob(padded)
          .split("")
          .map(char => `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`)
          .join("")
      );

      return JSON.parse(json);
    } catch {
      return null;
    }
  };

  const normalizeFrontendRole = (value?: unknown): Forum.FrontendRole | "" => {
    const role = String(value || "").toLowerCase();

    if (!role) return "";
    if (role.includes("academic_admin") || role.includes("academic-admin") || role.includes("academicadmin")) {
      return "academic_admin";
    }
    if (role.includes("教务管理员") || role.includes("教务")) return "academic_admin";
    if (role.includes("teacher") || role.includes("教师") || role.includes("老师")) return "teacher";
    if (role.includes("student") || role.includes("学生")) return "student";

    return "";
  };

  const toBackendRole = (role?: unknown): Forum.AuthorRole => {
    const frontendRole = normalizeFrontendRole(role);

    if (frontendRole === "academic_admin") return "admin";
    if (frontendRole === "teacher") return "teacher";
    return "student";
  };

  const readUserFromStorageValue = (raw: string | null): Partial<Forum.ForumCurrentUser> | null => {
    if (!raw) return null;

    const parsed = safeJsonParse<any>(raw);
    if (!parsed) return null;

    const data = parsed.userInfo || parsed.user_info || parsed.user || parsed.info || parsed.profile || parsed;

    const id = Number(
      data.id ?? data.user_id ?? data.userId ?? data.sub ?? parsed.id ?? parsed.user_id ?? parsed.userId ?? parsed.sub
    );
    const role = normalizeFrontendRole(
      data.role ??
        data.user_role ??
        data.userRole ??
        data.type ??
        data.identity ??
        parsed.role ??
        parsed.user_role ??
        parsed.userRole ??
        parsed.type
    );
    const name = String(data.name ?? data.username ?? data.real_name ?? data.realName ?? parsed.name ?? parsed.username ?? "");

    if (!id && !role && !name) return null;

    return {
      id: Number.isFinite(id) && id > 0 ? id : undefined,
      name,
      frontend_role: role || undefined,
      backend_role: role ? toBackendRole(role) : undefined
    };
  };

  const readUserFromStorage = (): Partial<Forum.ForumCurrentUser> | null => {
    if (typeof window === "undefined") return null;

    const keys = ["stss-user", "userInfo", "user", "USER_INFO", "user-store", "pinia-user"];

    for (const key of keys) {
      const user = readUserFromStorageValue(window.localStorage.getItem(key) || window.sessionStorage.getItem(key));
      if (user) return user;
    }

    return null;
  };

  const readTokenFromStorage = () => {
    if (typeof window === "undefined") return "";

    const keys = ["token", "access_token", "ACCESS_TOKEN", "stss-user"];

    for (const key of keys) {
      const raw = window.localStorage.getItem(key) || window.sessionStorage.getItem(key);
      if (!raw) continue;

      const parsed = safeJsonParse<any>(raw);
      const token = parsed?.token || parsed?.access_token || parsed?.accessToken || raw;

      if (typeof token === "string" && token) return token;
    }

    return "";
  };

  export const getCurrentForumUser = (): Forum.ForumCurrentUser => {
    let storeToken = "";
    let storeUserInfo: any = null;

    try {
      const userStore = useUserStore();
      storeToken = userStore.token || "";
      storeUserInfo = userStore.userInfo || null;
    } catch {
      storeToken = "";
      storeUserInfo = null;
    }

    const token = storeToken || readTokenFromStorage();
    const mockUser = MOCK_USER_MAP[token];

    const jwtPayload = decodeJwtPayload(token);
    const storageUser = readUserFromStorage();

    const frontendRole =
      normalizeFrontendRole(storeUserInfo?.role) ||
      normalizeFrontendRole(jwtPayload?.role) ||
      normalizeFrontendRole(jwtPayload?.user_role) ||
      normalizeFrontendRole(storageUser?.frontend_role) ||
      normalizeFrontendRole(mockUser?.frontend_role) ||
      "student";

    const idFromStore = Number(storeUserInfo?.id ?? storeUserInfo?.user_id ?? storeUserInfo?.userId);
    const idFromJwt = Number(jwtPayload?.sub ?? jwtPayload?.id ?? jwtPayload?.user_id ?? jwtPayload?.userId);
    const idFromStorage = Number(storageUser?.id);
    const idFromMock = Number(mockUser?.id);

    const id =
      (Number.isFinite(idFromStore) && idFromStore > 0 && idFromStore) ||
      (Number.isFinite(idFromJwt) && idFromJwt > 0 && idFromJwt) ||
      (Number.isFinite(idFromStorage) && idFromStorage > 0 && idFromStorage) ||
      (Number.isFinite(idFromMock) && idFromMock > 0 && idFromMock) ||
      1;

    const name =
      String(storeUserInfo?.name || storeUserInfo?.username || "") ||
      String(jwtPayload?.name || jwtPayload?.username || "") ||
      String(storageUser?.name || "") ||
      String(mockUser?.name || "") ||
      "当前用户";

    return {
      id,
      name,
      frontend_role: frontendRole,
      backend_role: toBackendRole(frontendRole)
    };
  };

  const getForumHeaders = () => {
    const currentUser = getCurrentForumUser();

    return {
      "X-User-Id": String(currentUser.id),
      "X-User-Role": String(currentUser.backend_role),
      "X-User-Name": encodeURIComponent(currentUser.name)
    };
  };

  const forumRequestConfig = (extra: Record<string, any> = {}) => {
    return {
      ...extra,
      headers: {
        ...getForumHeaders(),
        ...(extra.headers || {})
      }
    };
  };

  export const getBoardList = (params: Forum.BoardListQuery) => {
    return http.get<Forum.ResBoardList>(API_PREFIX + `/boards`, params, forumRequestConfig());
  };

  export const createBoard = (params: Forum.BoardCreateForm) => {
    return http.post<Forum.BoardItem>(API_PREFIX + `/boards`, params, forumRequestConfig());
  };

  export const updateBoard = (board_id: number, params: Forum.BoardUpdateForm) => {
    return http.put<Forum.BoardItem>(API_PREFIX + `/boards/${board_id}`, params, forumRequestConfig());
  };

  export const deleteBoard = (board_id: number) => {
    return http.delete(API_PREFIX + `/boards/${board_id}`, {}, forumRequestConfig());
  };

  export const getAnnouncementList = (params: Forum.NoticeListQuery) => {
    return http.get<Forum.ResNoticeList>(API_PREFIX + `/announcements`, params, forumRequestConfig());
  };

  export const createAnnouncement = (params: Forum.NoticeCreateForm) => {
    return http.post<Forum.NoticeItem>(API_PREFIX + `/announcements`, params, forumRequestConfig());
  };

  export const updateAnnouncement = (announcement_id: number, params: Forum.NoticeUpdateForm) => {
    return http.put<Forum.NoticeItem>(API_PREFIX + `/announcements/${announcement_id}`, params, forumRequestConfig());
  };

  export const deleteAnnouncement = (announcement_id: number) => {
    return http.delete(API_PREFIX + `/announcements/${announcement_id}`, {}, forumRequestConfig());
  };

  export const toggleAnnouncementPopup = (announcement_id: number) => {
    return http.put<{ popup: boolean }>(API_PREFIX + `/announcements/${announcement_id}/popup_toggle`, {}, forumRequestConfig());
  };

  export const getPostList = (params: Forum.PostListQuery) => {
    return http.get<Forum.ResPostList>(API_PREFIX + `/posts`, params, forumRequestConfig());
  };

  export const getMyPostList = (params: Omit<Forum.PostListQuery, "author_id">) => {
    return getPostList({
      ...params,
      author_id: getCurrentForumUser().id
    });
  };

  export const getPostDetail = (post_id: number) => {
    return http.get<Forum.ResPostDetail>(API_PREFIX + `/posts/${post_id}`, {}, forumRequestConfig());
  };

  export const createPost = (params: Forum.PostCreateForm) => {
    return http.post<Forum.PostItem>(API_PREFIX + `/posts`, params, forumRequestConfig());
  };

  export const updatePost = (post_id: number, params: Forum.PostUpdateForm) => {
    return http.put<Forum.PostItem>(API_PREFIX + `/posts/${post_id}`, params, forumRequestConfig());
  };

  export const deletePost = (post_id: number) => {
    return http.delete(API_PREFIX + `/posts/${post_id}`, {}, forumRequestConfig());
  };

  export const uploadAttachment = (post_id: number, params: FormData) => {
    return http.post<Forum.ResAttachment>(
      API_PREFIX + `/posts/${post_id}/attachments`,
      params,
      forumRequestConfig({
        headers: {
          "Content-Type": "multipart/form-data"
        },
        cancel: false
      })
    );
  };

  export const getAttachmentList = (post_id: number) => {
    return http.get<Forum.ResAttachmentList>(API_PREFIX + `/posts/${post_id}/attachments`, {}, forumRequestConfig());
  };

  export const deleteAttachment = (attachment_id: number) => {
    return http.delete(API_PREFIX + `/attachments/${attachment_id}`, {}, forumRequestConfig());
  };

  export const getReplyList = (post_id: number, params?: Forum.ReplyListQuery) => {
    return http.get<Forum.ResReplyList>(API_PREFIX + `/posts/${post_id}/replies`, params, forumRequestConfig());
  };

  export const createReply = (post_id: number, params: Forum.ReplyCreateForm) => {
    return http.post<Forum.ReplyItem>(API_PREFIX + `/posts/${post_id}/replies`, params, forumRequestConfig());
  };

  export const deleteReply = (reply_id: number) => {
    return http.delete(API_PREFIX + `/replies/${reply_id}`, {}, forumRequestConfig());
  };

  export const searchPosts = (params: Forum.SearchPostsQuery) => {
    return http.get<Forum.ResSearchPosts>(API_PREFIX + `/search/posts`, params, forumRequestConfig());
  };

  export const getHotPosts = (params: Forum.HotPostsQuery) => {
    return http.get<Forum.ResHotPosts>(API_PREFIX + `/stats/hot_posts`, params, forumRequestConfig());
  };

  export const getUserActivity = (params: Forum.UserActivityQuery) => {
    return http.get<Forum.ResUserActivity>(API_PREFIX + `/stats/user_activity`, params, forumRequestConfig());
  };

  export const getForumActivity = (params: Forum.ForumActivityQuery) => {
    return http.get<Forum.ResForumActivity>(API_PREFIX + `/internal/forum/activity`, params, forumRequestConfig());
  };

  export const pushActivityBatch = (params: Forum.ActivityBatchForm) => {
    return http.post<Forum.ResActivityBatch>(API_PREFIX + `/forum/activity-batch`, params, forumRequestConfig());
  };

  export const getModerationList = (params: Forum.ModerationListQuery) => {
    return http.get<Forum.ResModerationList>(API_PREFIX + `/moderation`, params, forumRequestConfig());
  };

  export const createModerationReport = (params: Forum.ModerationReportCreateForm) => {
    return http.post<Forum.ModerationItem>(API_PREFIX + `/moderation/reports`, params, forumRequestConfig());
  };

  export const handleModeration = (moderation_id: number, params: Forum.ModerationHandleForm) => {
    return http.put<Forum.ModerationItem>(API_PREFIX + `/moderation/${moderation_id}/handle`, params, forumRequestConfig());
  };
}
