import { createGroup, createMenu } from "@/views/stss/menu";

// 论坛交流组维护“论坛交流”板块下的页面入口。
// 菜单层不做强角色隐藏，具体查看与操作权限由各页面内的 auth.ts / BUTTONS 控制。
export const forumMenu = () =>
  createGroup(
    "/forum",
    "forum",
    "论坛交流",
    [
      createMenu("/forum/notices", "forumNotices", "/stss/forum/notices/index", "公告"),
      createMenu("/forum/course-boards", "forumCourseBoards", "/stss/forum/course-boards/index", "课程论坛"),
      createMenu("/forum/posts", "forumPosts", "/stss/forum/posts/index", "我的帖子"),
      createMenu("/forum/moderation", "forumModeration", "/stss/forum/moderation/index", "内容审核")
    ],
    "ChatDotRound"
  );
