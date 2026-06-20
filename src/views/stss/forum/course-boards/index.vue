<template>
  <div class="forum-course-boards-page">
    <ForumPageShell
      v-if="canView"
      title="课程论坛"
      description="围绕课程帖子、回复和附件进行交流讨论。公告功能请前往“公告”页面查看。"
      :tags="['课程板块', '发帖讨论', '回复留言', '附件交流', '帖子检索']"
      :stats="stats"
      content-title="课程帖子"
      content-description="选择课程论坛板块后查看帖子，也可以通过关键词搜索已发布帖子。"
      :data-count="boardOptions.length"
      empty-description="当前暂无可进入的课程论坛。"
    >
      <template #actions>
        <el-space>
          <el-button :loading="loading.boards || loading.posts" @click="reloadPageData">刷新</el-button>
          <el-button v-if="canCreatePost" type="primary" @click="openCreatePostDialog">发布帖子</el-button>
        </el-space>
      </template>

      <template #filters>
        <div class="forum-toolbar">
          <el-alert :closable="false" show-icon title="公告请在“公告”页面查看；本页面只搜索和展示课程帖子。" type="info" />
          <el-alert v-if="apiMessage" :closable="false" show-icon :title="apiMessage" :type="apiMessageType" />

          <el-form :model="queryForm" class="filter-form" inline>
            <el-form-item label="课程论坛">
              <el-select
                v-model="queryForm.boardId"
                clearable
                filterable
                placeholder="全部课程论坛"
                style="width: 240px"
                @change="handleBoardChange"
              >
                <el-option v-for="board in boardOptions" :key="board.id" :label="board.title" :value="board.id">
                  <span>{{ board.title }}</span>
                  <span class="select-option-extra">{{ board.courseName || board.courseId }}</span>
                </el-option>
              </el-select>
            </el-form-item>

            <el-form-item label="关键词">
              <el-input
                v-model="queryForm.keyword"
                clearable
                placeholder="搜索帖子标题或正文"
                style="width: 280px"
                @keyup.enter="handleSearch"
              />
            </el-form-item>

            <el-form-item label="排序">
              <el-select v-model="queryForm.sortBy" style="width: 150px" @change="handleSearch">
                <el-option label="最新发布" value="created_at" />
                <el-option label="热度优先" value="hot_score" />
              </el-select>
            </el-form-item>

            <el-form-item>
              <el-space>
                <el-button type="primary" :loading="loading.posts" @click="handleSearch">搜索</el-button>
                <el-button @click="resetQuery">重置</el-button>
              </el-space>
            </el-form-item>
          </el-form>
        </div>
      </template>

      <section v-if="currentBoard" class="board-hero">
        <div>
          <div class="board-hero-title">{{ currentBoard.title }}</div>
          <div class="board-hero-meta">
            {{ currentBoard.courseName || currentBoard.courseId || "未关联课程" }}
            <span v-if="currentBoard.description"> · {{ currentBoard.description }}</span>
          </div>
        </div>
        <el-tag :type="currentBoard.status === 'active' ? 'success' : 'info'">
          {{ currentBoard.status === "active" ? "启用中" : "已停用" }}
        </el-tag>
      </section>

      <section class="post-section">
        <div class="section-title-row">
          <div>
            <div class="section-title">课程帖子</div>
            <div class="section-subtitle">有关键词时调用帖子检索接口；无关键词时按课程论坛和模块加载帖子。</div>
          </div>
          <el-tag size="small" effect="plain">{{ posts.length }} 条</el-tag>
        </div>

        <div class="module-tabs">
          <el-tabs v-model="queryForm.module" @tab-change="handleModuleChange">
            <el-tab-pane label="全部" name="" />
            <el-tab-pane label="课程讨论" name="discussion" />
            <el-tab-pane label="作业答疑" name="homework" />
            <el-tab-pane label="考试说明" name="exam" />
            <el-tab-pane label="综合交流" name="general" />
          </el-tabs>
        </div>

        <div v-loading="loading.posts" class="post-list">
          <el-empty v-if="!loading.posts && posts.length === 0" description="当前筛选条件下暂无帖子" />

          <article v-for="post in posts" :key="post.id" class="post-card" @click="openPostDetail(post)">
            <div class="post-main">
              <div class="post-title-row">
                <span class="post-title">{{ post.title }}</span>
                <el-tag v-if="post.pinned" size="small" type="danger">置顶</el-tag>
                <el-tag v-if="post.status === 'hot'" size="small" type="warning">热门</el-tag>
                <el-tag v-if="post.status === 'hidden'" size="small" type="info">已隐藏</el-tag>
              </div>

              <div class="post-content">
                {{ getPostSummary(post) }}
              </div>

              <div class="post-meta">
                <span>{{ getBoardName(post.board_id) }}</span>
                <span>{{ getAuthorName(post.author_name, post.author_id) }}</span>
                <span>{{ postModuleTextMap[post.module] || "综合交流" }}</span>
                <span>{{ formatTime(post.created_at) }}</span>
              </div>
            </div>

            <div class="post-metrics">
              <div>
                <strong>{{ post.replies_count ?? 0 }}</strong>
                <span>回复</span>
              </div>
              <div>
                <strong>{{ post.views_count ?? 0 }}</strong>
                <span>浏览</span>
              </div>
              <div>
                <strong>{{ formatHotScore(post.hot_score) }}</strong>
                <span>热度</span>
              </div>
            </div>
          </article>
        </div>

        <div v-if="pagination.total > pagination.pageSize" class="pagination-row">
          <el-pagination
            background
            layout="prev, pager, next, total"
            :current-page="pagination.page"
            :page-size="pagination.pageSize"
            :total="pagination.total"
            @current-change="handlePageChange"
          />
        </div>
      </section>
    </ForumPageShell>

    <ForumPageShell
      v-else
      title="课程论坛"
      description="当前账号无课程论坛查看权限。"
      :tags="['权限控制']"
      :stats="permissionStats"
      content-title="无权限访问"
      content-description="当前账号不能查看课程论坛。"
      :data-count="0"
      empty-description="无课程论坛权限。"
    >
      <el-result icon="warning" title="无权限访问" sub-title="当前账号没有课程论坛查看权限。" />
    </ForumPageShell>

    <el-dialog v-model="postDialogVisible" title="发布帖子" width="720px">
      <el-form ref="postFormRef" :model="postForm" :rules="postRules" label-width="96px">
        <el-form-item label="课程论坛" prop="board_id">
          <el-select v-model="postForm.board_id" filterable placeholder="请选择课程论坛" style="width: 100%">
            <el-option
              v-for="board in boardOptions"
              :key="board.id"
              :label="`${board.title} / ${board.courseName || board.courseId}`"
              :value="board.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="帖子模块" prop="module">
          <el-select v-model="postForm.module" placeholder="请选择模块" style="width: 100%">
            <el-option label="课程讨论" value="discussion" />
            <el-option label="作业答疑" value="homework" />
            <el-option label="考试说明" value="exam" />
            <el-option label="综合交流" value="general" />
          </el-select>
        </el-form-item>

        <el-form-item label="标题" prop="title">
          <el-input v-model="postForm.title" maxlength="80" placeholder="请输入帖子标题" show-word-limit />
        </el-form-item>

        <el-form-item label="正文" prop="content">
          <el-input
            v-model="postForm.content"
            :rows="8"
            maxlength="2000"
            placeholder="请输入帖子正文，可描述问题、课程内容或讨论主题"
            show-word-limit
            type="textarea"
          />
        </el-form-item>

        <el-form-item label="附件">
          <el-upload v-model:file-list="postFiles" action="#" :auto-upload="false" :limit="5" multiple drag>
            <el-icon class="el-icon--upload">
              <UploadFilled />
            </el-icon>
            <div class="el-upload__text">拖拽文件到此处，或点击选择附件</div>
            <template #tip>
              <div class="el-upload__tip">最多选择 5 个附件，帖子创建成功后自动上传。</div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="postDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting.post" @click="submitPost">发布</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="detailDrawerVisible" size="720px" title="帖子详情">
      <template v-if="currentPost">
        <div class="detail-title-row">
          <div>
            <div class="drawer-title">{{ currentPost.title }}</div>
            <div class="drawer-meta">
              {{ getBoardName(currentPost.board_id) }} · {{ getAuthorName(currentPost.author_name, currentPost.author_id) }} ·
              {{ formatTime(currentPost.created_at) }}
            </div>
          </div>
          <el-tag>{{ postModuleTextMap[currentPost.module] || "综合交流" }}</el-tag>
        </div>

        <p class="drawer-content">{{ currentPost.content }}</p>

        <div class="drawer-metrics">
          <el-tag>浏览 {{ currentPost.views_count ?? 0 }}</el-tag>
          <el-tag type="success">回复 {{ currentPost.replies_count ?? 0 }}</el-tag>
          <el-tag type="warning">热度 {{ formatHotScore(currentPost.hot_score) }}</el-tag>
          <el-tag v-if="currentPost.status === 'hidden'" type="info">已隐藏</el-tag>
        </div>

        <div class="drawer-actions">
          <el-button v-if="canReportContent" type="warning" plain @click="openReportDialog('post', currentPost.id)">
            举报帖子
          </el-button>
          <el-button v-if="canDeleteContent" type="danger" plain @click="handleDeletePost(currentPost)"> 删除帖子 </el-button>
        </div>

        <el-divider />

        <el-card shadow="never" class="detail-card">
          <template #header>
            <div class="card-header">
              <span>附件</span>
              <el-tag size="small" effect="plain">{{ attachments.length }} 个</el-tag>
            </div>
          </template>

          <el-empty v-if="!loading.attachments && attachments.length === 0" description="暂无附件" />

          <div v-else v-loading="loading.attachments" class="attachment-list">
            <div v-for="file in attachments" :key="file.id" class="attachment-item">
              <div>
                <div class="attachment-name">{{ file.file_name }}</div>
                <div class="metric-line">{{ formatFileSize(file.file_size) }} · {{ file.mime_type || "未知类型" }}</div>
              </div>
              <el-space>
                <el-link :href="file.file_url" target="_blank" type="primary">查看</el-link>
                <el-button v-if="canDeleteContent" link type="danger" @click="handleDeleteAttachment(file)"> 删除 </el-button>
              </el-space>
            </div>
          </div>
        </el-card>

        <el-card shadow="never" class="detail-card">
          <template #header>
            <div class="card-header">
              <span>回复留言</span>
              <el-tag size="small" effect="plain">{{ replies.length }} 条</el-tag>
            </div>
          </template>

          <el-empty v-if="!loading.replies && replies.length === 0" description="暂无回复" />

          <div v-else v-loading="loading.replies" class="reply-list">
            <div v-for="reply in replies" :key="reply.id" class="reply-item">
              <div class="reply-header">
                <div>
                  <span class="reply-author">{{ getAuthorName(reply.author_name, reply.author_id) }}</span>
                  <span class="reply-time"> #{{ reply.floor }} · {{ formatTime(reply.created_at) }}</span>
                </div>
                <el-space>
                  <el-button v-if="canReportContent" link type="warning" @click="openReportDialog('reply', reply.id)">
                    举报
                  </el-button>
                  <el-button v-if="canDeleteContent" link type="danger" @click="handleDeleteReply(reply)">删除</el-button>
                </el-space>
              </div>

              <div class="reply-content">{{ reply.content }}</div>

              <div v-if="reply.children?.length" class="reply-children">
                <div v-for="child in reply.children" :key="child.id" class="reply-child">
                  <div class="reply-header child-reply-header">
                    <div>
                      <span class="reply-author">{{ getAuthorName(child.author_name, child.author_id) }}：</span>
                      <span class="reply-time">#{{ child.floor }} · {{ formatTime(child.created_at) }}</span>
                    </div>
                    <el-space>
                      <el-button v-if="canReportContent" link type="warning" @click="openReportDialog('reply', child.id)">
                        举报
                      </el-button>
                      <el-button v-if="canDeleteContent" link type="danger" @click="handleDeleteReply(child)">删除</el-button>
                    </el-space>
                  </div>
                  <div class="reply-content">{{ child.content }}</div>
                </div>
              </div>
            </div>
          </div>

          <template v-if="canReplyPost">
            <el-divider />

            <el-input
              v-model="replyContent"
              :rows="4"
              maxlength="800"
              placeholder="输入回复内容"
              show-word-limit
              type="textarea"
            />
            <div class="reply-action-row">
              <el-button type="primary" :loading="submitting.reply" @click="submitReply">发布回复</el-button>
            </div>
          </template>

          <el-alert
            v-else
            class="readonly-tip"
            :closable="false"
            show-icon
            title="当前账号没有回帖权限，仅可查看课程论坛内容。"
            type="info"
          />
        </el-card>
      </template>
    </el-drawer>

    <el-dialog v-model="reportDialogVisible" title="举报内容" width="520px">
      <el-form :model="reportForm" label-width="80px">
        <el-form-item label="举报对象">
          <el-tag>{{ reportForm.target_type === "post" ? "帖子" : "回复" }} #{{ reportForm.target_id || "-" }}</el-tag>
        </el-form-item>
        <el-form-item label="举报原因">
          <el-input
            v-model="reportForm.reason"
            type="textarea"
            :rows="5"
            maxlength="300"
            show-word-limit
            placeholder="请说明举报原因，例如广告、无关内容、言语不当等"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="reportDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting.report" @click="submitReport">提交举报</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import type { FormInstance, FormRules, UploadUserFile } from "element-plus";
import { ElMessage, ElMessageBox } from "element-plus";
import { UploadFilled } from "@element-plus/icons-vue";
import { useAuthStore } from "@/stores/modules/auth";
import ForumPageShell from "../components/ForumPageShell.vue";
import { ForumAPI } from "@/api/modules/forum";
import type { Forum } from "@/api/interface/forum";
import { mockBoards, mockPosts, mockReplies, mockAttachments, postModuleTextMap } from "../mock";
import { useForumAuthButtons } from "../auth";

interface BoardView {
  id: number;
  courseId: string;
  courseName?: string;
  title: string;
  description?: string;
  status: Forum.BoardStatus | string;
  popupEnabled?: boolean;
}

type PostRow = Forum.PostItem & {
  snippet?: string;
  author_name?: string;
  author_role?: string;
};

type ReplyRow = Forum.ReplyItem & {
  author_name?: string;
  author_role?: string;
  children?: ReplyRow[];
};

interface QueryForm {
  boardId?: number;
  keyword: string;
  module: Forum.PostModule | "";
  sortBy: "created_at" | "hot_score";
}

interface PostForm {
  board_id?: number;
  module: Forum.PostModule;
  title: string;
  content: string;
}

type ApiMessageType = "success" | "warning" | "error" | "info";

const { BUTTONS } = useForumAuthButtons();
const authStore = useAuthStore();

const boards = ref<BoardView[]>([]);
const posts = ref<PostRow[]>([]);
const replies = ref<ReplyRow[]>([]);
const attachments = ref<Forum.AttachmentItem[]>([]);
const currentPost = ref<(Forum.ResPostDetail & { author_name?: string }) | null>(null);

const useMockData = ref(false);
const detailDrawerVisible = ref(false);
const postDialogVisible = ref(false);
const reportDialogVisible = ref(false);
const replyContent = ref("");
const postFiles = ref<UploadUserFile[]>([]);
const postFormRef = ref<FormInstance>();
const apiMessage = ref("");
const apiMessageType = ref<ApiMessageType>("info");

const loading = reactive({
  boards: false,
  posts: false,
  replies: false,
  attachments: false
});

const submitting = reactive({
  post: false,
  reply: false,
  report: false
});

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
});

const queryForm = reactive<QueryForm>({
  boardId: undefined,
  keyword: "",
  module: "",
  sortBy: "created_at"
});

const postForm = reactive<PostForm>({
  board_id: undefined,
  module: "discussion",
  title: "",
  content: ""
});

const reportForm = reactive<Forum.ModerationReportCreateForm>({
  target_type: "post",
  target_id: 0,
  reason: ""
});

const postRules: FormRules = {
  board_id: [{ required: true, message: "请选择课程论坛", trigger: "change" }],
  module: [{ required: true, message: "请选择帖子模块", trigger: "change" }],
  title: [{ required: true, message: "请输入帖子标题", trigger: "blur" }],
  content: [{ required: true, message: "请输入帖子正文", trigger: "blur" }]
};

const postButtons = computed(() => authStore.authButtonListGet?.forumPosts || []);

const canView = computed(() => BUTTONS.view !== false);
const canCreatePost = computed(() => Boolean(BUTTONS.create || postButtons.value.includes("create")));
const canReplyPost = computed(() => Boolean(BUTTONS.reply || postButtons.value.includes("reply")));
const canDeleteContent = computed(() => Boolean(BUTTONS.delete || postButtons.value.includes("delete")));
const canReportContent = computed(() => canCreatePost.value || canReplyPost.value);

const boardOptions = computed(() => boards.value);

const currentBoard = computed(() => {
  if (!queryForm.boardId) return boardOptions.value[0] ?? null;
  return boardOptions.value.find(board => board.id === queryForm.boardId) ?? null;
});

const stats = computed(() => [
  {
    label: "课程论坛",
    value: boards.value.length,
    help: "当前可进入的课程论坛板块"
  },
  {
    label: "当前帖子",
    value: posts.value.length,
    help: "当前筛选条件下的帖子数量"
  },
  {
    label: "当前板块",
    value: currentBoard.value?.title || "未选择",
    help: "当前选择的课程论坛"
  },
  {
    label: "当前页码",
    value: pagination.page,
    help: "帖子分页位置"
  }
]);

const permissionStats = computed(() => [
  {
    label: "课程论坛权限",
    value: "无",
    help: "当前账号没有课程论坛查看权限"
  }
]);

const setApiMessage = (message: string, type: ApiMessageType = "info") => {
  apiMessage.value = message;
  apiMessageType.value = type;
};

const normalizeBoard = (board: Forum.BoardItem & Record<string, any>): BoardView => ({
  id: board.id,
  courseId: board.course_id || board.courseId || "",
  courseName: board.course_name || board.courseName || "",
  title: board.title || board.name || board.course_name || "课程论坛",
  description: board.description || "",
  status: board.status || "active",
  popupEnabled: Boolean(board.popup_enabled ?? board.popupEnabled)
});

const normalizeMockBoard = (board: (typeof mockBoards)[number]): BoardView => ({
  id: board.id,
  courseId: board.courseId,
  courseName: board.courseName,
  title: board.title,
  description: board.description,
  status: board.status
});

const normalizePost = (post: (Forum.PostItem | Forum.SearchPostItem) & Record<string, any>): PostRow => {
  const board = boards.value.find(item => item.id === post.board_id);

  return {
    id: post.id,
    board_id: post.board_id,
    course_id: post.course_id || board?.courseId || "",
    module: post.module || "general",
    title: post.title || "未命名帖子",
    content: post.content || post.snippet || "",
    snippet: post.snippet,
    status: post.status || "published",
    pinned: Boolean(post.pinned),
    views_count: Number(post.views_count ?? 0),
    replies_count: Number(post.replies_count ?? 0),
    likes_count: Number(post.likes_count ?? 0),
    hot_score: Number(post.hot_score ?? 0),
    author_id: Number(post.author_id ?? 0),
    author_name: post.author_name || post.authorName,
    author_role: post.author_role || post.authorRole,
    created_at: post.created_at || "",
    updated_at: post.updated_at
  };
};

const normalizeMockPost = (post: (typeof mockPosts)[number]): PostRow => ({
  id: post.id,
  board_id: post.boardId,
  course_id: post.courseId,
  module: post.module,
  title: post.title,
  content: post.content,
  status: post.status,
  pinned: post.pinned,
  views_count: post.viewsCount,
  replies_count: post.repliesCount,
  likes_count: post.likesCount,
  hot_score: post.hotScore,
  author_id: 0,
  author_name: post.authorName,
  author_role: post.authorRole,
  created_at: post.createdAt,
  updated_at: post.updatedAt
});

const normalizeMockReply = (reply: any): ReplyRow => ({
  id: reply.id,
  post_id: reply.postId,
  floor: reply.floor,
  parent_reply_id: reply.parentReplyId,
  content: reply.content,
  author_id: 0,
  author_name: reply.authorName,
  author_role: reply.authorRole,
  likes_count: reply.likesCount,
  status: reply.status,
  created_at: reply.createdAt,
  children: reply.children?.map((child: any) => normalizeMockReply(child))
});

const normalizeMockAttachment = (file: (typeof mockAttachments)[number]): Forum.AttachmentItem => ({
  id: file.id,
  post_id: file.ownerId,
  file_name: file.fileName,
  file_url: file.fileUrl,
  file_size: file.fileSize,
  mime_type: file.mimeType,
  uploader_id: 0,
  created_at: file.createdAt
});

const loadBoards = async () => {
  loading.boards = true;

  try {
    const res = await ForumAPI.getBoardList({
      page: 1,
      page_size: 100,
      status: "active"
    });

    boards.value = (res.data?.items ?? []).map(item => normalizeBoard(item as Forum.BoardItem & Record<string, any>));

    if (boards.value.length === 0) {
      boards.value = mockBoards.map(normalizeMockBoard);
      useMockData.value = true;
    } else {
      useMockData.value = false;
    }
  } catch (error) {
    console.error("加载课程论坛板块失败：", error);
    boards.value = mockBoards.map(normalizeMockBoard);
    useMockData.value = true;
    setApiMessage("课程论坛板块接口异常，当前使用本地板块数据兜底。", "warning");
  } finally {
    loading.boards = false;
  }
};

const loadPosts = async () => {
  if (!canView.value) {
    posts.value = [];
    pagination.total = 0;
    return;
  }

  loading.posts = true;

  try {
    const board = queryForm.boardId ? boards.value.find(item => item.id === queryForm.boardId) : undefined;
    const keyword = queryForm.keyword.trim();

    if (keyword) {
      const res = await ForumAPI.searchPosts({
        page: pagination.page,
        page_size: pagination.pageSize,
        keyword,
        course_id: board?.courseId,
        sort_by: queryForm.sortBy,
        sort_order: "desc"
      });

      posts.value = (res.data?.items ?? []).map(item => normalizePost(item as Forum.SearchPostItem & Record<string, any>));
      pagination.total = res.data?.pagination?.total ?? posts.value.length;
    } else {
      const res = await ForumAPI.getPostList({
        page: pagination.page,
        page_size: pagination.pageSize,
        board_id: queryForm.boardId,
        module: queryForm.module || undefined,
        status: undefined,
        sort_by: queryForm.sortBy,
        sort_order: "desc"
      });

      posts.value = (res.data?.items ?? []).map(item => normalizePost(item as Forum.PostItem & Record<string, any>));
      pagination.total = res.data?.pagination?.total ?? posts.value.length;
    }

    setApiMessage("已连接课程论坛接口。", "success");
  } catch (error) {
    console.error("加载帖子失败：", error);
    const keyword = queryForm.keyword.trim().toLowerCase();

    posts.value = mockPosts.map(normalizeMockPost).filter(post => {
      const matchBoard = !queryForm.boardId || post.board_id === queryForm.boardId;
      const matchModule = !queryForm.module || post.module === queryForm.module;
      const matchKeyword = !keyword || post.title.toLowerCase().includes(keyword) || post.content.toLowerCase().includes(keyword);
      const visible = post.status !== "deleted";
      return matchBoard && matchModule && matchKeyword && visible;
    });

    pagination.total = posts.value.length;
    useMockData.value = true;
    setApiMessage("帖子接口异常，当前使用本地帖子数据兜底。", "warning");
  } finally {
    loading.posts = false;
  }
};

const reloadPageData = async () => {
  await loadBoards();

  if (!queryForm.boardId && boards.value.length > 0) {
    queryForm.boardId = boards.value[0].id;
  }

  await loadPosts();
};

const handleSearch = async () => {
  pagination.page = 1;
  await loadPosts();
};

const resetQuery = async () => {
  queryForm.boardId = boards.value[0]?.id;
  queryForm.keyword = "";
  queryForm.module = "";
  queryForm.sortBy = "created_at";
  pagination.page = 1;
  await loadPosts();
};

const handleBoardChange = async () => {
  pagination.page = 1;
  await loadPosts();
};

const handleModuleChange = async () => {
  pagination.page = 1;
  await loadPosts();
};

const handlePageChange = async (page: number) => {
  pagination.page = page;
  await loadPosts();
};

const openCreatePostDialog = () => {
  if (!canCreatePost.value) return;

  postForm.board_id = queryForm.boardId || boards.value[0]?.id;
  postForm.module = "discussion";
  postForm.title = "";
  postForm.content = "";
  postFiles.value = [];
  postDialogVisible.value = true;
};

const submitPost = async () => {
  if (!postFormRef.value) return;

  await postFormRef.value.validate(async valid => {
    if (!valid) return;

    submitting.post = true;

    try {
      if (useMockData.value) {
        submitMockPost();
        return;
      }

      const created = await ForumAPI.createPost({
        board_id: Number(postForm.board_id),
        module: postForm.module,
        title: postForm.title,
        content: postForm.content
      });

      const postId = created.data.id;

      for (const file of postFiles.value) {
        if (!file.raw) continue;
        const formData = new FormData();
        formData.append("file", file.raw);
        await ForumAPI.uploadAttachment(postId, formData);
      }

      ElMessage.success("帖子已发布");
      postDialogVisible.value = false;
      await loadPosts();
    } catch (error) {
      console.error("发布帖子失败：", error);
      ElMessage.error("发布失败，请检查发帖接口或权限");
    } finally {
      submitting.post = false;
    }
  });
};

const submitMockPost = () => {
  const board = boards.value.find(item => item.id === postForm.board_id);
  const now = getCurrentTimeText();

  posts.value = [
    {
      id: Date.now(),
      board_id: Number(postForm.board_id),
      course_id: board?.courseId || "",
      module: postForm.module,
      title: postForm.title,
      content: postForm.content,
      status: "published",
      pinned: false,
      views_count: 0,
      replies_count: 0,
      likes_count: 0,
      hot_score: 0,
      author_id: 0,
      author_name: "当前用户",
      created_at: now,
      updated_at: now
    },
    ...posts.value
  ];

  pagination.total += 1;
  postDialogVisible.value = false;
  submitting.post = false;
  ElMessage.success("帖子已发布");
};

const openPostDetail = async (post: PostRow) => {
  detailDrawerVisible.value = true;
  currentPost.value = {
    ...post,
    board_name: getBoardName(post.board_id),
    author_name: post.author_name
  };

  await Promise.all([loadPostDetail(post.id), loadAttachments(post.id), loadReplies(post.id)]);
};

const loadPostDetail = async (postId: number) => {
  if (useMockData.value) return;

  try {
    const res = await ForumAPI.getPostDetail(postId);
    currentPost.value = {
      ...res.data,
      author_name: res.data.author_name
    };
  } catch (error) {
    console.error("加载帖子详情失败：", error);
  }
};

const loadAttachments = async (postId: number) => {
  loading.attachments = true;

  try {
    if (useMockData.value) {
      attachments.value = mockAttachments
        .filter(file => file.ownerType === "post" && file.ownerId === postId)
        .map(normalizeMockAttachment);
      return;
    }

    const res = await ForumAPI.getAttachmentList(postId);
    attachments.value = res.data?.items ?? [];
  } catch (error) {
    console.error("加载附件失败：", error);
    attachments.value = mockAttachments
      .filter(file => file.ownerType === "post" && file.ownerId === postId)
      .map(normalizeMockAttachment);
  } finally {
    loading.attachments = false;
  }
};

const loadReplies = async (postId: number) => {
  loading.replies = true;

  try {
    if (useMockData.value) {
      replies.value = mockReplies.filter(reply => reply.postId === postId).map(normalizeMockReply);
      return;
    }

    const res = await ForumAPI.getReplyList(postId, {
      view: "tree",
      page: 1,
      page_size: 100
    });

    replies.value = (res.data?.items ?? []) as ReplyRow[];
  } catch (error) {
    console.error("加载回复失败：", error);
    replies.value = mockReplies.filter(reply => reply.postId === postId).map(normalizeMockReply);
  } finally {
    loading.replies = false;
  }
};

const submitReply = async () => {
  if (!currentPost.value || !replyContent.value.trim()) {
    ElMessage.warning("请输入回复内容");
    return;
  }

  submitting.reply = true;

  try {
    if (useMockData.value) {
      const newReply: ReplyRow = {
        id: Date.now(),
        post_id: currentPost.value.id,
        floor: replies.value.length + 1,
        parent_reply_id: null,
        content: replyContent.value.trim(),
        author_id: 0,
        author_name: "当前用户",
        likes_count: 0,
        status: "published",
        created_at: getCurrentTimeText()
      };

      replies.value.push(newReply);
      currentPost.value.replies_count = Number(currentPost.value.replies_count || 0) + 1;
      replyContent.value = "";
      ElMessage.success("回复已发布");
      return;
    }

    await ForumAPI.createReply(currentPost.value.id, {
      parent_reply_id: null,
      content: replyContent.value.trim()
    });

    replyContent.value = "";
    ElMessage.success("回复已发布");
    await loadReplies(currentPost.value.id);
    await loadPosts();
  } catch (error) {
    console.error("发布回复失败：", error);
    ElMessage.error("回复失败，请检查回复接口或权限");
  } finally {
    submitting.reply = false;
  }
};

const handleDeletePost = async (post: PostRow | Forum.ResPostDetail) => {
  try {
    await ElMessageBox.confirm(`确认删除帖子「${post.title}」吗？`, "删除帖子", {
      type: "warning",
      confirmButtonText: "确认删除",
      cancelButtonText: "取消"
    });

    if (useMockData.value) {
      posts.value = posts.value.filter(item => item.id !== post.id);
      detailDrawerVisible.value = false;
      ElMessage.success("帖子已删除");
      return;
    }

    await ForumAPI.deletePost(post.id);
    detailDrawerVisible.value = false;
    ElMessage.success("帖子已删除");
    await loadPosts();
  } catch (error) {
    if (error !== "cancel") {
      console.error("删除帖子失败：", error);
      ElMessage.error("删除失败，请检查权限");
    }
  }
};

const handleDeleteReply = async (reply: ReplyRow) => {
  try {
    await ElMessageBox.confirm("确认删除这条回复吗？", "删除回复", {
      type: "warning",
      confirmButtonText: "确认删除",
      cancelButtonText: "取消"
    });

    if (useMockData.value) {
      removeReplyFromTree(reply.id);
      ElMessage.success("回复已删除");
      return;
    }

    await ForumAPI.deleteReply(reply.id);
    ElMessage.success("回复已删除");

    if (currentPost.value) {
      await loadReplies(currentPost.value.id);
      await loadPosts();
    }
  } catch (error) {
    if (error !== "cancel") {
      console.error("删除回复失败：", error);
      ElMessage.error("删除失败，请检查权限");
    }
  }
};

const handleDeleteAttachment = async (file: Forum.AttachmentItem) => {
  try {
    await ElMessageBox.confirm(`确认删除附件「${file.file_name}」吗？`, "删除附件", {
      type: "warning",
      confirmButtonText: "确认删除",
      cancelButtonText: "取消"
    });

    if (useMockData.value) {
      attachments.value = attachments.value.filter(item => item.id !== file.id);
      ElMessage.success("附件已删除");
      return;
    }

    await ForumAPI.deleteAttachment(file.id);
    attachments.value = attachments.value.filter(item => item.id !== file.id);
    ElMessage.success("附件已删除");
  } catch (error) {
    if (error !== "cancel") {
      console.error("删除附件失败：", error);
      ElMessage.error("删除失败，请检查附件权限");
    }
  }
};

const removeReplyFromTree = (replyId: number) => {
  const remove = (list: ReplyRow[]): ReplyRow[] => {
    return list
      .filter(item => item.id !== replyId)
      .map(item => ({
        ...item,
        children: item.children ? remove(item.children) : []
      }));
  };

  replies.value = remove(replies.value);
};

const openReportDialog = (targetType: Forum.ModerationTargetType, targetId: number) => {
  reportForm.target_type = targetType;
  reportForm.target_id = targetId;
  reportForm.reason = "";
  reportDialogVisible.value = true;
};

const submitReport = async () => {
  if (!reportForm.reason.trim()) {
    ElMessage.warning("请填写举报原因");
    return;
  }

  submitting.report = true;

  try {
    if (!useMockData.value) {
      await ForumAPI.createModerationReport({
        target_type: reportForm.target_type,
        target_id: reportForm.target_id,
        reason: reportForm.reason.trim()
      });
    }

    ElMessage.success("举报已提交，等待管理员审核");
    reportDialogVisible.value = false;
  } catch (error) {
    console.error("提交举报失败：", error);
    ElMessage.error("举报失败，请检查审核举报接口");
  } finally {
    submitting.report = false;
  }
};

const getBoardName = (boardId?: number) => {
  const board = boards.value.find(item => item.id === boardId);
  return board?.title || `板块 #${boardId || "-"}`;
};

const getAuthorName = (name?: string, id?: number) => {
  return name || (id ? `用户 #${id}` : "未知用户");
};

const getPostSummary = (post: PostRow) => {
  return post.snippet || post.content || "暂无内容摘要";
};

const formatHotScore = (value?: number) => {
  return Number(value || 0).toFixed(1);
};

const formatTime = (time?: string | null) => {
  if (!time) return "未知时间";
  return time.replace("T", " ").slice(0, 16);
};

const formatFileSize = (size?: number) => {
  const value = Number(size || 0);

  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
};

const getCurrentTimeText = () => {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");

  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
};

onMounted(() => {
  reloadPageData();
});
</script>

<style scoped lang="scss">
.forum-course-boards-page,
.forum-toolbar {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.filter-form {
  display: flex;
  flex-flow: row wrap;
}
.select-option-extra {
  float: right;
  margin-left: 24px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.board-hero {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px;
  margin-bottom: 18px;
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-light);
  border-radius: 12px;
}
.board-hero-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}
.board-hero-meta {
  margin-top: 6px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}
.post-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.section-title-row {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  justify-content: space-between;
}
.section-title {
  font-size: 17px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}
.section-subtitle {
  margin-top: 6px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.module-tabs {
  margin-top: -4px;
}
.post-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 160px;
}
.post-card {
  display: flex;
  gap: 16px;
  align-items: stretch;
  justify-content: space-between;
  padding: 16px 18px;
  cursor: pointer;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: 12px;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}
.post-card:hover {
  border-color: var(--el-color-primary-light-5);
  box-shadow: var(--el-box-shadow-light);
  transform: translateY(-1px);
}
.post-main {
  min-width: 0;
}
.post-title-row {
  display: flex;
  gap: 8px;
  align-items: center;
}
.post-title {
  overflow: hidden;
  font-weight: 700;
  color: var(--el-text-color-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}
.post-content {
  display: -webkit-box;
  margin-top: 8px;
  overflow: hidden;
  line-height: 1.6;
  color: var(--el-text-color-regular);
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.post-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.post-metrics {
  display: grid;
  grid-template-columns: repeat(3, 64px);
  gap: 8px;
  align-items: center;
  text-align: center;
}
.post-metrics strong {
  display: block;
  font-size: 18px;
  color: var(--el-text-color-primary);
}
.post-metrics span {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.pagination-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}
.detail-title-row {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  justify-content: space-between;
}
.drawer-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}
.drawer-meta {
  margin-top: 8px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.drawer-content {
  margin: 18px 0 0;
  line-height: 1.8;
  white-space: pre-wrap;
}
.drawer-metrics,
.drawer-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
}
.detail-card {
  margin-top: 16px;
  border-radius: 12px;
}
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.attachment-list,
.reply-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.attachment-item {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  background: var(--el-fill-color-lighter);
  border-radius: 10px;
}
.attachment-name {
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.metric-line {
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.reply-item {
  padding: 14px 16px;
  background: var(--el-fill-color-lighter);
  border-radius: 10px;
}
.reply-header,
.child-reply-header {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
}
.reply-author {
  font-weight: 700;
  color: var(--el-text-color-primary);
}
.reply-time {
  margin-left: 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.reply-content {
  margin-top: 8px;
  line-height: 1.7;
  white-space: pre-wrap;
}
.reply-children {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-left: 14px;
  margin-top: 12px;
  border-left: 3px solid var(--el-border-color);
}
.reply-child {
  padding: 10px 12px;
  background: var(--el-bg-color);
  border-radius: 8px;
}
.reply-action-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}
.readonly-tip {
  margin-top: 14px;
}

@media (width <= 900px) {
  .post-card,
  .board-hero,
  .detail-title-row,
  .attachment-item {
    flex-direction: column;
    align-items: flex-start;
  }
  .post-metrics {
    grid-template-columns: repeat(3, 1fr);
    width: 100%;
  }
}
</style>
