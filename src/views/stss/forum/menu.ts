import { createGroup, createMenu } from "@/views/stss/menu";

// 论坛交流组可以在这里维护“论坛交流”板块下的细分页面名称、路径和图标。
export const forumMenu = () =>
  createGroup(
    "/forum",
    "forum",
    "论坛交流",
    [
      createMenu("/forum/notices", "forumNotices", "/stss/forum/notices/index", "公告"),
      createMenu("/forum/course-boards", "forumCourseBoards", "/stss/forum/course-boards/index", "课程论坛"),
      createMenu("/forum/posts", "forumPosts", "/stss/forum/posts/index", "发帖/回帖"),
      createMenu("/forum/moderation", "forumModeration", "/stss/forum/moderation/index", "内容审核"),
      createMenu("/forum/search", "forumSearch", "/stss/forum/search/index", "检索")
    ],
    "ChatDotRound"
  );
