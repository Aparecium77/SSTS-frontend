/**
 * 论坛交流组的同学在这里封装论坛交流相关接口。
 * 可继续补充公告、课程论坛、发帖回帖、内容审核、检索等请求方法。
 * 页面中不要直接写 axios，请统一从这个文件导出请求函数。
 */

import { Forum } from "@/api/interface/forum";
import http from "@/api";

export namespace ForumAPI {
  const API_PREFIX = "/api/v1";

  export const getAnnouncementList = (params: Forum.NoticeListQuery) => {
    return http.get<Forum.ResNoticeList>(API_PREFIX + `/announcements`, params);
  };

  export const createAnnouncement = (params: Forum.NoticeCreateForm) => {
    return http.post<Forum.NoticeItem>(API_PREFIX + `/announcements`, params);
  };

  export const updateAnnouncement = (announcement_id: number, params: Forum.NoticeUpdateForm) => {
    return http.put<Forum.NoticeItem>(API_PREFIX + `/announcements/${announcement_id}`, params);
  };

  export const deleteAnnouncement = (announcement_id: number) => {
    return http.delete(API_PREFIX + `/announcements/${announcement_id}`);
  };

  export const toggleAnnouncementPopup = (announcement_id: number) => {
    return http.put<{ popup: boolean }>(API_PREFIX + `/announcements/${announcement_id}/popup_toggle`, {});
  };

  export const getPostList = (params: Forum.PostListQuery) => {
    return http.get<Forum.ResPostList>(API_PREFIX + `/posts`, params);
  };

  export const getPostDetail = (post_id: number) => {
    return http.get<Forum.ResPostDetail>(API_PREFIX + `/posts/${post_id}`);
  };

  export const createPost = (params: Forum.PostCreateForm) => {
    return http.post<Forum.PostItem>(API_PREFIX + `/posts`, params);
  };

  export const updatePost = (post_id: number, params: Forum.PostUpdateForm) => {
    return http.put<Forum.PostItem>(API_PREFIX + `/posts/${post_id}`, params);
  };

  export const deletePost = (post_id: number) => {
    return http.delete(API_PREFIX + `/posts/${post_id}`);
  };

  export const uploadAttachment = (post_id: number, params: FormData) => {
    return http.post<Forum.ResAttachment>(API_PREFIX + `/posts/${post_id}/attachments`, params, {
      headers: { "Content-Type": "multipart/form-data" }
    });
  };

  export const deleteAttachment = (attachment_id: number) => {
    return http.delete(API_PREFIX + `/attachments/${attachment_id}`);
  };

  export const getReplyList = (post_id: number, params?: Forum.ReplyListQuery) => {
    return http.get<Forum.ResReplyList>(API_PREFIX + `/posts/${post_id}/replies`, params);
  };

  export const createReply = (post_id: number, params: Forum.ReplyCreateForm) => {
    return http.post<Forum.ReplyItem>(API_PREFIX + `/posts/${post_id}/replies`, params);
  };

  export const deleteReply = (reply_id: number) => {
    return http.delete(API_PREFIX + `/replies/${reply_id}`);
  };

  export const searchPosts = (params: Forum.SearchPostsQuery) => {
    return http.get<Forum.ResSearchPosts>(API_PREFIX + `/search/posts`, params);
  };

  export const getHotPosts = (params: Forum.HotPostsQuery) => {
    return http.get<Forum.ResHotPosts>(API_PREFIX + `/stats/hot_posts`, params);
  };

  export const getUserActivity = (params: Forum.UserActivityQuery) => {
    return http.get<Forum.ResUserActivity>(API_PREFIX + `/stats/user_activity`, params);
  };

  export const getForumActivity = (params: Forum.ForumActivityQuery) => {
    return http.get<Forum.ResForumActivity>(API_PREFIX + `/internal/forum/activity`, params);
  };

  export const pushActivityBatch = (params: Forum.ActivityBatchForm) => {
    return http.post(API_PREFIX + `/forum/activity-batch`, params);
  };
}
