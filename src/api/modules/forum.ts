import { Forum } from "@/api/interface/forum";
import { FORUM_API } from "@/api/config/servicePort";
import http from "@/api";
import { useUserStore } from "@/stores/modules/user";

export namespace ForumAPI {
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
