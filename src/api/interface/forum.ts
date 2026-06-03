/**
 * 论坛交流组的同学在这里补充论坛交流相关类型。
 * 建议把公告、帖子、回复、审核记录、检索条件等类型定义在这里。
 */
export namespace Forum {
  export type NoticeStatus = "published" | "hidden" | "deleted";
  export type PostStatus = "published" | "hot" | "pinned" | "hidden" | "deleted";
  export type PostModule = "discussion" | "homework" | "exam" | "general";
  export type ReplyStatus = "published" | "hidden" | "deleted";
  export type ModerationStatus = "pending" | "approved" | "hidden" | "deleted";
  export type ModerationTargetType = "post" | "reply";
  export type AuthorRole = "student" | "teacher" | "admin";
  export type SortBy = "relevance" | "created_at" | "hot_score";
  export type SortOrder = "desc" | "asc";
  export type ReplyView = "flat" | "tree";
  export type StatsPeriod = "week" | "month";

  export interface ReqPage {
    page: number;
    page_size: number;
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
    updated_at?: string;
  }

  export interface ResNoticeList {
    items: NoticeItem[];
    pagination: {
      total: number;
      page: number;
      page_size: number;
    };
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
    updated_at?: string;
  }

  export interface ResPostList {
    items: PostItem[];
    pagination: {
      total: number;
      page: number;
      page_size: number;
    };
  }

  export interface ResPostDetail extends PostItem {
    board_name?: string;
    author_name?: string;
    author_role?: AuthorRole;
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
    pagination?: {
      total: number;
      page: number;
      page_size: number;
    };
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
    pagination: {
      total: number;
      page: number;
      page_size: number;
    };
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

  export interface ResAttachment {
    id: number;
    post_id: number;
    file_name: string;
    file_url: string;
    file_size: number;
    mime_type: string;
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

  export interface ForumActivityQuery {
    course_id?: string;
    offering_id?: string;
    period: string;
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
}
