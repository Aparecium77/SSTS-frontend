export namespace Forum {
  export type BoardStatus = "active" | "inactive";
  export type NoticeStatus = "published" | "hidden" | "deleted";
  export type PostStatus = "published" | "hot" | "pinned" | "hidden" | "deleted";
  export type PostModule = "discussion" | "homework" | "exam" | "general";
  export type ReplyStatus = "published" | "hidden" | "deleted";
  export type ModerationStatus = "pending" | "approved" | "hidden" | "deleted";
  export type ModerationTargetType = "post" | "reply";
  export type AuthorRole = "student" | "teacher" | "admin";
  export type FrontendRole = "student" | "teacher" | "academic_admin";
  export type SortBy = "relevance" | "created_at" | "hot_score";
  export type SortOrder = "desc" | "asc";
  export type ReplyView = "flat" | "tree";
  export type StatsPeriod = "week" | "month";

  export interface ReqPage {
    page: number;
    page_size: number;
  }

  export interface Pagination {
    total: number;
    page: number;
    page_size: number;
  }

  export interface BoardListQuery extends ReqPage {
    keyword?: string;
    course_id?: string;
    status?: BoardStatus | string;
  }

  export interface BoardCreateForm {
    course_id: string;
    course_name: string;
    offering_id?: string | null;
    title: string;
    description?: string;
    status?: BoardStatus | string;
    popup_enabled?: boolean;
  }

  export interface BoardUpdateForm {
    course_id?: string;
    course_name?: string;
    offering_id?: string | null;
    title?: string;
    description?: string;
    status?: BoardStatus | string;
    popup_enabled?: boolean;
  }

  export interface BoardItem {
    id: number;
    course_id: string;
    course_name: string;
    offering_id?: string | null;
    title: string;
    name: string;
    description: string;
    status: BoardStatus | string;
    popup_enabled: boolean;
    created_at?: string | null;
    updated_at?: string | null;

    courseId?: string;
    courseName?: string;
    offeringId?: string | null;
    popupEnabled?: boolean;
    createdAt?: string | null;
    updatedAt?: string | null;
  }

  export interface ResBoardList {
    items: BoardItem[];
    pagination: Pagination;
  }

  export interface NoticeListQuery extends ReqPage {
    course_id?: string;
    offering_id?: string;
    board_id?: number;
    author_id?: number;
    status?: NoticeStatus;
    start_date?: string;
    end_date?: string;
    sort_by?: "created_at";
    sort_order?: SortOrder;
  }

  export interface NoticeCreateForm {
    board_id: number;
    title: string;
    content: string;
    pinned?: boolean;
    popup?: boolean;
  }

  export interface NoticeUpdateForm {
    board_id?: number;
    title?: string;
    content?: string;
    pinned?: boolean;
    popup?: boolean;
    status?: NoticeStatus;
  }

  export interface NoticeItem {
    id: number;
    board_id: number;
    course_id: string;
    title: string;
    content: string;
    pinned: boolean;
    popup: boolean;
    status: NoticeStatus;
    author_id: number;
    created_at: string;
    updated_at?: string | null;
  }

  export interface ResNoticeList {
    items: NoticeItem[];
    pagination: Pagination;
  }

  export interface PostListQuery extends ReqPage {
    course_id?: string;
    offering_id?: string;
    board_id?: number;
    module?: PostModule;
    author_id?: number;
    status?: PostStatus;
    keyword?: string;
    sort_by?: SortBy;
    sort_order?: SortOrder;
  }

  export interface PostCreateForm {
    board_id: number;
    course_id?: string;
    offering_id?: string;
    module: PostModule;
    title: string;
    content: string;
    pinned?: boolean;
  }

  export interface PostUpdateForm {
    board_id?: number;
    title?: string;
    content?: string;
    module?: PostModule;
    pinned?: boolean;
    status?: PostStatus;
  }

  export interface PostItem {
    id: number;
    board_id: number;
    course_id: string;
    module: PostModule;
    title: string;
    content: string;
    status: PostStatus;
    pinned: boolean;
    views_count: number;
    replies_count: number;
    likes_count: number;
    hot_score: number;
    author_id: number;
    created_at: string;
    updated_at?: string | null;
  }

  export interface ResPostList {
    items: PostItem[];
    pagination: Pagination;
  }

  export interface ResPostDetail extends PostItem {
    board_name?: string;
    author_name?: string;
    author_role?: AuthorRole | string;
  }

  export interface ReplyCreateForm {
    parent_reply_id?: number | null;
    content: string;
  }

  export interface ReplyItem {
    id: number;
    post_id: number;
    floor: number;
    parent_reply_id: number | null;
    content: string;
    author_id: number;
    likes_count: number;
    status: ReplyStatus;
    created_at: string;
    children?: ReplyItem[];
  }

  export interface ReplyListQuery {
    view?: ReplyView;
    page?: number;
    page_size?: number;
    since_floor?: number;
  }

  export interface ResReplyList {
    items: ReplyItem[];
    pagination?: Pagination;
  }

  export interface AttachmentCreateForm {
    file: File;
  }

  export interface AttachmentItem {
    id: number;
    post_id: number;
    file_name: string;
    file_url: string;
    file_size: number;
    mime_type: string;
    uploader_id: number;
    created_at: string;
  }

  export interface ResAttachment extends AttachmentItem {}

  export interface ResAttachmentList {
    items: AttachmentItem[];
  }

  export interface SearchPostsQuery extends ReqPage {
    keyword: string;
    course_id?: string;
    offering_id?: string;
    author_id?: number;
    start_date?: string;
    end_date?: string;
    sort_by?: SortBy;
    sort_order?: SortOrder;
  }

  export interface SearchPostItem {
    id: number;
    title: string;
    snippet?: string;
    course_id: string;
    board_id: number;
    author_id: number;
    created_at: string;
    hot_score: number;
  }

  export interface ResSearchPosts {
    items: SearchPostItem[];
    pagination: Pagination;
  }

  export interface HotPostsQuery {
    course_id?: string;
    offering_id?: string;
    period: StatsPeriod;
    limit?: number;
  }

  export interface HotPostItem {
    id: number;
    title: string;
    course_id: string;
    board_id: number;
    author_id: number;
    replies_count: number;
    likes_count: number;
    hot_score: number;
    created_at: string;
  }

  export interface ResHotPosts {
    items: HotPostItem[];
  }

  export interface UserActivityQuery {
    user_id?: number;
    course_id?: string;
    offering_id?: string;
    period: string;
  }

  export interface UserActivityItem {
    user_id: number;
    course_id: string;
    period_start: string;
    period_end: string;
    post_count: number;
    reply_count: number;
    view_count: number;
    like_count: number;
    activity_score: number;
  }

  export interface ResUserActivity {
    items: UserActivityItem[];
  }

  export interface ForumActivityQuery {
    course_id?: string;
    offering_id?: string;
    period: string;
  }

  export interface ForumActivityItem {
    user_id: number;
    course_id: string;
    period_start: string;
    period_end: string;
    post_count: number;
    reply_count: number;
    view_count: number;
    like_count: number;
    activity_score: number;
  }

  export interface ResForumActivity {
    data: ForumActivityItem[];
  }

  export interface ActivityBatchForm {
    period_start: string;
    period_end: string;
    course_id: string;
    items: {
      user_id: number;
      post_count: number;
      reply_count: number;
      view_count: number;
      like_count: number;
      activity_score: number;
    }[];
  }

  export interface ResActivityBatch {
    outbox_id: number;
    status: string;
  }

  export interface ModerationListQuery extends ReqPage {
    keyword?: string;
    course_name?: string;
    target_type?: ModerationTargetType;
    status?: ModerationStatus;
  }

  export interface ModerationReportCreateForm {
    target_type: ModerationTargetType;
    target_id: number;
    reason: string;
    reporter_name?: string | null;
  }

  export interface ModerationHandleForm {
    status: ModerationStatus;
    reason?: string | null;
  }

  export interface ModerationItem {
    id: number;
    target_type: ModerationTargetType;
    target_id: number;
    title: string;
    content: string;
    course_name: string;
    author_name: string;
    reporter_name: string;
    reason: string;
    status: ModerationStatus;
    created_at: string;
    handled_at?: string | null;
    handler_name?: string | null;

    targetType?: ModerationTargetType;
    targetId?: number;
    courseName?: string;
    authorName?: string;
    reporterName?: string;
    createdAt?: string;
    handledAt?: string | null;
    handlerName?: string | null;
  }

  export interface ResModerationList {
    items: ModerationItem[];
    pagination: Pagination;
  }

  export interface ForumCurrentUser {
    id: number;
    name: string;
    frontend_role: FrontendRole | string;
    backend_role: AuthorRole | string;
  }
}
