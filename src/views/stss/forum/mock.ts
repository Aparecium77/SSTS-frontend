export type NoticeStatus = "published" | "hidden" | "deleted";

export interface ForumBoardMock {
  id: number;
  courseId: string;
  courseName: string;
  title: string;
  description: string;
  status: "active" | "inactive";
}

export interface ForumNoticeMock {
  id: number;
  boardId: number;
  boardName: string;
  courseId: string;
  courseName: string;
  title: string;
  content: string;
  authorName: string;
  pinned: boolean;
  popup: boolean;
  status: NoticeStatus;
  createdAt: string;
  updatedAt: string;
}

export const mockBoards: ForumBoardMock[] = [
  {
    id: 10,
    courseId: "SE-2026",
    courseName: "软件工程",
    title: "软件工程课程论坛",
    description: "用于发布课程公告、项目讨论、作业答疑和小组交流。",
    status: "active"
  },
  {
    id: 11,
    courseId: "CS101",
    courseName: "程序设计基础",
    title: "程序设计基础课程论坛",
    description: "用于课程通知、答疑讨论和资料共享。",
    status: "active"
  }
];

export const mockNotices: ForumNoticeMock[] = [
  {
    id: 1001,
    boardId: 10,
    boardName: "软件工程课程论坛",
    courseId: "SE-2026",
    courseName: "软件工程",
    title: "项目展示材料提交提醒",
    content: "请各小组在本周日前提交展示材料、需求分析和设计说明文档。提交后请组长在群内确认。",
    authorName: "刘老师",
    pinned: true,
    popup: true,
    status: "published",
    createdAt: "2026-04-24 10:00",
    updatedAt: "2026-04-24 10:00"
  },
  {
    id: 1002,
    boardId: 10,
    boardName: "软件工程课程论坛",
    courseId: "SE-2026",
    courseName: "软件工程",
    title: "论坛交流子系统接口对齐说明",
    content: "前后端可先按公告、帖子、回复、搜索、统计几个模块进行 mock 和字段对齐，后续再接入真实接口。",
    authorName: "助教",
    pinned: false,
    popup: false,
    status: "published",
    createdAt: "2026-04-25 18:30",
    updatedAt: "2026-04-25 18:30"
  },
  {
    id: 1003,
    boardId: 11,
    boardName: "程序设计基础课程论坛",
    courseId: "CS101",
    courseName: "程序设计基础",
    title: "实验课安排调整",
    content: "本周实验课时间调整到周五下午，请同学们提前检查开发环境。",
    authorName: "王老师",
    pinned: false,
    popup: true,
    status: "hidden",
    createdAt: "2026-04-26 09:15",
    updatedAt: "2026-04-26 11:20"
  }
];

export type PostStatus = "published" | "hot" | "pinned" | "hidden" | "deleted";
export type PostModule = "discussion" | "homework" | "exam" | "general";

export interface ForumPostMock {
  id: number;
  boardId: number;
  boardName: string;
  courseId: string;
  courseName: string;
  module: PostModule;
  title: string;
  content: string;
  authorName: string;
  authorRole: "student" | "teacher" | "admin";
  status: PostStatus;
  pinned: boolean;
  viewsCount: number;
  repliesCount: number;
  likesCount: number;
  hotScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface ForumReplyMock {
  id: number;
  postId: number;
  parentReplyId: number | null;
  floor: number;
  content: string;
  authorName: string;
  authorRole: "student" | "teacher" | "admin";
  likesCount: number;
  status: "published" | "hidden" | "deleted";
  createdAt: string;
  children?: ForumReplyMock[];
}

export const postModuleTextMap: Record<PostModule, string> = {
  discussion: "课程讨论",
  homework: "作业答疑",
  exam: "考试说明",
  general: "综合交流"
};

export const mockPosts: ForumPostMock[] = [
  {
    id: 201,
    boardId: 10,
    boardName: "软件工程课程论坛",
    courseId: "SE-2026",
    courseName: "软件工程",
    module: "discussion",
    title: "关于论坛交流子系统接口字段的疑问",
    content: "公告、帖子、回复和搜索模块的字段是否都按照现有 API 文档来设计？分页格式是否统一为 items + pagination？",
    authorName: "张同学",
    authorRole: "student",
    status: "hot",
    pinned: false,
    viewsCount: 236,
    repliesCount: 5,
    likesCount: 18,
    hotScore: 92.5,
    createdAt: "2026-04-26 14:20",
    updatedAt: "2026-04-26 16:10"
  },
  {
    id: 202,
    boardId: 10,
    boardName: "软件工程课程论坛",
    courseId: "SE-2026",
    courseName: "软件工程",
    module: "homework",
    title: "小组展示材料需要包含哪些 UML 图？",
    content: "目前已经有用例图、类图、状态图和数据流图，是否还需要补充顺序图或部署图？",
    authorName: "李同学",
    authorRole: "student",
    status: "published",
    pinned: false,
    viewsCount: 128,
    repliesCount: 3,
    likesCount: 9,
    hotScore: 64.2,
    createdAt: "2026-04-25 20:45",
    updatedAt: "2026-04-25 21:30"
  },
  {
    id: 203,
    boardId: 11,
    boardName: "程序设计基础课程论坛",
    courseId: "CS101",
    courseName: "程序设计基础",
    module: "exam",
    title: "期末复习资料汇总",
    content: "这里整理课程重点、历年题型和常见编程错误，欢迎同学们在回复区补充。",
    authorName: "王老师",
    authorRole: "teacher",
    status: "pinned",
    pinned: true,
    viewsCount: 412,
    repliesCount: 8,
    likesCount: 35,
    hotScore: 96.8,
    createdAt: "2026-04-24 09:00",
    updatedAt: "2026-04-24 09:00"
  },
  {
    id: 204,
    boardId: 10,
    boardName: "软件工程课程论坛",
    courseId: "SE-2026",
    courseName: "软件工程",
    module: "general",
    title: "无关广告测试帖",
    content: "该帖子用于模拟管理员隐藏违规内容的效果。",
    authorName: "匿名用户",
    authorRole: "student",
    status: "hidden",
    pinned: false,
    viewsCount: 18,
    repliesCount: 0,
    likesCount: 0,
    hotScore: 2.1,
    createdAt: "2026-04-23 12:10",
    updatedAt: "2026-04-23 12:30"
  }
];

export const mockReplies: ForumReplyMock[] = [
  {
    id: 301,
    postId: 201,
    parentReplyId: null,
    floor: 1,
    content: "前端可以先按文档字段 mock，后续真实接口确定后再统一对齐。",
    authorName: "助教",
    authorRole: "teacher",
    likesCount: 6,
    status: "published",
    createdAt: "2026-04-26 14:35",
    children: [
      {
        id: 302,
        postId: 201,
        parentReplyId: 301,
        floor: 2,
        content: "明白了，那页面层先不要直接写死接口路径。",
        authorName: "张同学",
        authorRole: "student",
        likesCount: 2,
        status: "published",
        createdAt: "2026-04-26 14:42"
      }
    ]
  },
  {
    id: 303,
    postId: 201,
    parentReplyId: null,
    floor: 3,
    content: "分页建议先按 items + pagination 设计，后端如果变更再调整接口层。",
    authorName: "刘老师",
    authorRole: "teacher",
    likesCount: 8,
    status: "published",
    createdAt: "2026-04-26 15:00"
  },
  {
    id: 304,
    postId: 202,
    parentReplyId: null,
    floor: 1,
    content: "顺序图可以作为补充，不一定每个场景都画，重点是核心流程清楚。",
    authorName: "王同学",
    authorRole: "student",
    likesCount: 3,
    status: "published",
    createdAt: "2026-04-25 21:00"
  }
];

export type ModerationStatus = "pending" | "approved" | "hidden" | "deleted";
export type ModerationTargetType = "post" | "reply";

export interface ForumModerationMock {
  id: number;
  targetType: ModerationTargetType;
  targetId: number;
  title: string;
  content: string;
  courseName: string;
  authorName: string;
  reporterName: string;
  reason: string;
  status: ModerationStatus;
  createdAt: string;
  handledAt?: string;
  handlerName?: string;
}

export const moderationStatusTextMap: Record<ModerationStatus, string> = {
  pending: "待处理",
  approved: "已通过",
  hidden: "已隐藏",
  deleted: "已删除"
};

export const mockModerationItems: ForumModerationMock[] = [
  {
    id: 401,
    targetType: "post",
    targetId: 204,
    title: "无关广告测试帖",
    content: "该帖子用于模拟管理员隐藏违规内容的效果。",
    courseName: "软件工程",
    authorName: "匿名用户",
    reporterName: "张同学",
    reason: "疑似无关广告内容",
    status: "pending",
    createdAt: "2026-04-23 12:20"
  },
  {
    id: 402,
    targetType: "reply",
    targetId: 302,
    title: "回复内容审核",
    content: "明白了，那页面层先不要直接写死接口路径。",
    courseName: "软件工程",
    authorName: "张同学",
    reporterName: "助教",
    reason: "测试审核流程，确认回复可被单独处理",
    status: "approved",
    createdAt: "2026-04-24 09:30",
    handledAt: "2026-04-24 10:00",
    handlerName: "管理员"
  },
  {
    id: 403,
    targetType: "post",
    targetId: 201,
    title: "关于论坛交流子系统接口字段的疑问",
    content: "公告、帖子、回复和搜索模块的字段是否都按照现有 API 文档来设计？分页格式是否统一为 items + pagination？",
    courseName: "软件工程",
    authorName: "张同学",
    reporterName: "李同学",
    reason: "内容本身无违规，仅用于演示审核通过状态",
    status: "approved",
    createdAt: "2026-04-26 16:30",
    handledAt: "2026-04-26 17:00",
    handlerName: "管理员"
  },
  {
    id: 404,
    targetType: "reply",
    targetId: 304,
    title: "回复内容审核",
    content: "顺序图可以作为补充，不一定每个场景都画，重点是核心流程清楚。",
    courseName: "软件工程",
    authorName: "王同学",
    reporterName: "系统检测",
    reason: "模拟自动检测命中敏感词后的人工复核",
    status: "hidden",
    createdAt: "2026-04-25 21:10",
    handledAt: "2026-04-25 21:30",
    handlerName: "管理员"
  }
];
