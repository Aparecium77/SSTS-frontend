<template>
  <div class="forum-my-posts-page">
    <ForumPageShell
      v-if="canUseMyPosts"
      title="我的帖子"
      description="查看、检索和管理自己发布过的课程论坛帖子。"
      :tags="['我的发布', '帖子管理', '回复查看', '附件查看']"
      :stats="stats"
      content-title="我的帖子列表"
      content-description="按课程、模块、状态和关键词筛选当前账号发布的帖子。"
      :data-count="posts.length"
      empty-description="当前账号暂未发布帖子。"
    >
      <template #actions>
        <el-space>
          <el-button :loading="loading.boards || loading.posts" @click="reloadPageData">刷新</el-button>
          <el-button type="primary" @click="goCreateHint">去课程论坛发帖</el-button>
        </el-space>
      </template>

      <template #filters>
        <div class="my-posts-toolbar">
          <el-alert
            :closable="false"
            show-icon
            :title="`当前论坛用户：${currentUser.name}（ID: ${currentUser.id}，角色: ${currentUser.backend_role}）`"
            type="info"
          />

          <el-alert v-if="apiMessage" :closable="false" show-icon :title="apiMessage" :type="apiMessageType" />

          <el-form :model="queryForm" class="filter-form" inline>
            <el-form-item label="课程论坛">
              <el-select v-model="queryForm.boardId" clearable filterable placeholder="全部课程论坛" style="width: 220px">
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
                placeholder="搜索我的帖子标题或正文"
                style="width: 260px"
                @keyup.enter="handleFilter"
              />
            </el-form-item>

            <el-form-item label="模块">
              <el-select v-model="queryForm.module" clearable placeholder="全部模块" style="width: 150px">
                <el-option label="课程讨论" value="discussion" />
                <el-option label="作业答疑" value="homework" />
                <el-option label="考试说明" value="exam" />
                <el-option label="综合交流" value="general" />
              </el-select>
            </el-form-item>

            <el-form-item label="状态">
              <el-select v-model="queryForm.status" clearable placeholder="全部状态" style="width: 150px">
                <el-option label="已发布" value="published" />
                <el-option label="热门" value="hot" />
                <el-option label="置顶" value="pinned" />
                <el-option label="已隐藏" value="hidden" />
                <el-option label="已删除" value="deleted" />
              </el-select>
            </el-form-item>

            <el-form-item label="排序">
              <el-select v-model="queryForm.sortBy" style="width: 150px">
                <el-option label="最新发布" value="created_at" />
                <el-option label="热度优先" value="hot_score" />
              </el-select>
            </el-form-item>

            <el-form-item>
              <el-space>
                <el-button type="primary" :loading="loading.posts" @click="handleFilter">筛选</el-button>
                <el-button @click="resetQuery">重置</el-button>
              </el-space>
            </el-form-item>
          </el-form>
        </div>
      </template>

      <el-table v-loading="loading.posts" :data="posts" border>
        <el-table-column label="帖子内容" min-width="360">
          <template #default="{ row }">
            <div class="post-title-row">
              <span class="post-title">{{ row.title }}</span>
              <el-tag v-if="row.pinned" size="small" type="danger">置顶</el-tag>
              <el-tag v-if="row.status === 'hot'" size="small" type="warning">热门</el-tag>
              <el-tag v-if="row.status === 'hidden'" size="small" type="info">已隐藏</el-tag>
              <el-tag v-if="row.status === 'deleted'" size="small" type="danger">已删除</el-tag>
            </div>

            <div class="post-preview">{{ row.content }}</div>

            <div class="post-meta">
              {{ getBoardName(row.board_id) }} · {{ postModuleTextMap[row.module] || "综合交流" }} ·
              {{ formatTime(row.created_at) }}
            </div>
          </template>
        </el-table-column>

        <el-table-column label="互动数据" width="210">
          <template #default="{ row }">
            <div class="metrics-row">
              <span>浏览 {{ row.views_count ?? 0 }}</span>
              <span>回复 {{ row.replies_count ?? 0 }}</span>
              <span>热度 {{ formatHotScore(row.hot_score) }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="postStatusTagMap[row.status] || 'info'">
              {{ postStatusTextMap[row.status] || row.status }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="更新时间" width="160">
          <template #default="{ row }">
            {{ formatTime(row.updated_at || row.created_at) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <el-space wrap>
              <el-button link type="primary" @click="openPostDetail(row)">详情</el-button>
              <el-button v-if="canEditOwnPost(row)" link type="primary" @click="openEditPostDialog(row)"> 编辑 </el-button>
              <el-button v-if="canDeleteOwnPost(row)" link type="danger" @click="deletePost(row)"> 删除 </el-button>
            </el-space>
          </template>
        </el-table-column>
      </el-table>

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
    </ForumPageShell>

    <ForumPageShell
      v-else
      title="我的帖子"
      description="当前账号无我的帖子页面权限。"
      :tags="['权限控制']"
      :stats="permissionStats"
      content-title="无权限访问"
      content-description="当前账号不能查看或管理个人帖子。"
      :data-count="0"
      empty-description="无我的帖子权限。"
    >
      <el-result icon="warning" title="无权限访问" sub-title="当前账号没有我的帖子页面权限。" />
    </ForumPageShell>

    <el-drawer v-model="detailDrawerVisible" size="720px" title="帖子详情">
      <template v-if="currentPost">
        <div class="drawer-title-row">
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
          <el-tag :type="postStatusTagMap[currentPost.status] || 'info'">
            {{ postStatusTextMap[currentPost.status] || currentPost.status }}
          </el-tag>
        </div>

        <div class="drawer-actions">
          <el-button v-if="canEditOwnPost(currentPost)" type="primary" plain @click="openEditPostDialog(currentPost)">
            编辑帖子
          </el-button>
          <el-button v-if="canDeleteOwnPost(currentPost)" type="danger" plain @click="deletePost(currentPost)">
            删除帖子
          </el-button>
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
                <el-button v-if="canDeleteOwnPost(currentPost)" link type="danger" @click="deleteAttachment(file)">
                  删除
                </el-button>
              </el-space>
            </div>
          </div>
        </el-card>

        <el-card shadow="never" class="detail-card">
          <template #header>
            <div class="card-header">
              <span>回复</span>
              <el-tag size="small" effect="plain">{{ countReplies(replies) }} 条</el-tag>
            </div>
          </template>

          <el-empty v-if="!loading.replies && replies.length === 0" description="暂无回复" />

          <div v-else v-loading="loading.replies" class="reply-list">
            <div v-for="reply in replies" :key="reply.id" class="reply-item">
              <div class="reply-header">
                <div>
                  <span class="reply-author">{{ getAuthorName(reply.author_name, reply.author_id) }}</span>
                  <span class="reply-time">#{{ reply.floor }} · {{ formatTime(reply.created_at) }}</span>
                </div>
                <el-button v-if="canDeleteReply(reply)" link type="danger" @click="deleteReply(reply)">删除</el-button>
              </div>

              <div class="reply-content">{{ reply.content }}</div>

              <div v-if="reply.children?.length" class="reply-children">
                <div v-for="child in reply.children" :key="child.id" class="reply-child">
                  <div class="reply-header">
                    <div>
                      <span class="reply-author">{{ getAuthorName(child.author_name, child.author_id) }}</span>
                      <span class="reply-time">#{{ child.floor }} · {{ formatTime(child.created_at) }}</span>
                    </div>
                    <el-button v-if="canDeleteReply(child)" link type="danger" @click="deleteReply(child)">删除</el-button>
                  </div>
                  <div class="reply-content">{{ child.content }}</div>
                </div>
              </div>
            </div>
          </div>

          <template v-if="canReply">
            <el-divider />

            <el-input
              v-model="replyContent"
              :rows="4"
              maxlength="800"
              placeholder="给自己的帖子补充回复或说明"
              show-word-limit
              type="textarea"
            />

            <div class="reply-action-row">
              <el-button type="primary" :loading="submitting.reply" @click="submitReply">发布回复</el-button>
            </div>
          </template>
        </el-card>
      </template>
    </el-drawer>

    <el-dialog v-model="editDialogVisible" title="编辑帖子" width="720px">
      <el-form ref="postFormRef" :model="postForm" :rules="postRules" label-width="90px">
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

        <el-form-item label="模块" prop="module">
          <el-select v-model="postForm.module" placeholder="请选择模块" style="width: 100%">
            <el-option label="课程讨论" value="discussion" />
            <el-option label="作业答疑" value="homework" />
            <el-option label="考试说明" value="exam" />
            <el-option label="综合交流" value="general" />
          </el-select>
        </el-form-item>

        <el-form-item label="标题" prop="title">
          <el-input v-model="postForm.title" maxlength="80" show-word-limit placeholder="请输入帖子标题" />
        </el-form-item>

        <el-form-item label="正文" prop="content">
          <el-input
            v-model="postForm.content"
            type="textarea"
            :rows="8"
            maxlength="2000"
            show-word-limit
            placeholder="请输入帖子正文"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting.post" @click="submitEditPost">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { ElMessage, ElMessageBox } from "element-plus";
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
}

type PostRow = Forum.PostItem & {
  author_name?: string;
  author_role?: string;
  board_name?: string;
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
  status: Forum.PostStatus | "";
  sortBy: "created_at" | "hot_score";
}

interface PostForm {
  id?: number;
  board_id?: number;
  module: Forum.PostModule;
  title: string;
  content: string;
}

type ApiMessageType = "success" | "warning" | "error" | "info";

const { BUTTONS } = useForumAuthButtons();
const currentUser = ForumAPI.getCurrentForumUser();

const boards = ref<BoardView[]>([]);
const posts = ref<PostRow[]>([]);
const replies = ref<ReplyRow[]>([]);
const attachments = ref<Forum.AttachmentItem[]>([]);
const currentPost = ref<PostRow | null>(null);
const editingPost = ref<PostRow | null>(null);
const postFormRef = ref<FormInstance>();
const detailDrawerVisible = ref(false);
const editDialogVisible = ref(false);
const replyContent = ref("");
const useMockData = ref(false);
const apiMessage = ref("");
const apiMessageType = ref<ApiMessageType>("info");

const loading = reactive({
  boards: false,
  posts: false,
  detail: false,
  replies: false,
  attachments: false
});

const submitting = reactive({
  post: false,
  reply: false
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
  status: "",
  sortBy: "created_at"
});

const postForm = reactive<PostForm>({
  id: undefined,
  board_id: undefined,
  module: "discussion",
  title: "",
  content: ""
});

const postRules: FormRules = {
  board_id: [{ required: true, message: "请选择课程论坛", trigger: "change" }],
  module: [{ required: true, message: "请选择模块", trigger: "change" }],
  title: [{ required: true, message: "请输入帖子标题", trigger: "blur" }],
  content: [{ required: true, message: "请输入帖子正文", trigger: "blur" }]
};

const postStatusTextMap: Record<Forum.PostStatus, string> = {
  published: "已发布",
  hot: "热门",
  pinned: "置顶",
  hidden: "已隐藏",
  deleted: "已删除"
};

const postStatusTagMap: Record<Forum.PostStatus, "success" | "warning" | "danger" | "info"> = {
  published: "success",
  hot: "warning",
  pinned: "danger",
  hidden: "info",
  deleted: "danger"
};

const canView = computed(() => Boolean(BUTTONS.view));
const canReply = computed(() => Boolean(BUTTONS.reply));
const canUseMyPosts = computed(() => canView.value && Boolean(BUTTONS.create || BUTTONS.reply || BUTTONS.edit || BUTTONS.delete));

const boardOptions = computed(() => boards.value);

const stats = computed(() => [
  {
    label: "我的帖子",
    value: posts.value.length,
    help: "当前筛选条件下的个人帖子数量"
  },
  {
    label: "已发布",
    value: posts.value.filter(item => item.status === "published" || item.status === "hot" || item.status === "pinned").length,
    help: "正常展示的帖子"
  },
  {
    label: "总回复",
    value: posts.value.reduce((sum, item) => sum + Number(item.replies_count || 0), 0),
    help: "当前列表帖子收到的回复数"
  },
  {
    label: "当前用户",
    value: `#${currentUser.id}`,
    help: currentUser.name
  }
]);

const permissionStats = computed(() => [
  {
    label: "我的帖子权限",
    value: "无",
    help: "当前账号没有我的帖子页面权限"
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
  status: board.status || "active"
});

const normalizeMockBoard = (board: (typeof mockBoards)[number]): BoardView => ({
  id: board.id,
  courseId: board.courseId,
  courseName: board.courseName,
  title: board.title,
  description: board.description,
  status: board.status
});

const normalizePost = (post: (Forum.PostItem | Forum.ResPostDetail) & Record<string, any>): PostRow => ({
  id: post.id,
  board_id: post.board_id,
  course_id: post.course_id || "",
  module: post.module || "general",
  title: post.title || "未命名帖子",
  content: post.content || "",
  status: post.status || "published",
  pinned: Boolean(post.pinned),
  views_count: Number(post.views_count ?? 0),
  replies_count: Number(post.replies_count ?? 0),
  likes_count: Number(post.likes_count ?? 0),
  hot_score: Number(post.hot_score ?? 0),
  author_id: Number(post.author_id ?? 0),
  author_name: post.author_name || post.authorName,
  author_role: post.author_role || post.authorRole,
  board_name: post.board_name || post.boardName,
  created_at: post.created_at || "",
  updated_at: post.updated_at
});

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
  author_id: currentUser.id,
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
  author_id: currentUser.id,
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
  uploader_id: currentUser.id,
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
    }
  } catch (error) {
    console.error("加载课程论坛板块失败：", error);
    boards.value = mockBoards.map(normalizeMockBoard);
  } finally {
    loading.boards = false;
  }
};

const loadMyPosts = async () => {
  if (!canUseMyPosts.value) {
    posts.value = [];
    pagination.total = 0;
    return;
  }

  loading.posts = true;

  try {
    const res = await ForumAPI.getMyPostList({
      page: pagination.page,
      page_size: pagination.pageSize,
      board_id: queryForm.boardId,
      module: queryForm.module || undefined,
      status: queryForm.status || undefined,
      keyword: queryForm.keyword.trim() || undefined,
      sort_by: queryForm.sortBy,
      sort_order: "desc"
    });

    posts.value = (res.data?.items ?? []).map(item => normalizePost(item as Forum.PostItem & Record<string, any>));
    pagination.total = res.data?.pagination?.total ?? posts.value.length;
    useMockData.value = false;
    setApiMessage("已连接我的帖子接口。", "success");
  } catch (error) {
    console.error("加载我的帖子失败：", error);

    const keyword = queryForm.keyword.trim().toLowerCase();
    const currentRole = String(currentUser.backend_role || "");

    posts.value = mockPosts.map(normalizeMockPost).filter(post => {
      const matchOwner =
        post.author_id === currentUser.id ||
        post.author_name === currentUser.name ||
        String(post.author_role || "").includes(currentRole);

      const matchBoard = !queryForm.boardId || post.board_id === queryForm.boardId;
      const matchModule = !queryForm.module || post.module === queryForm.module;
      const matchStatus = !queryForm.status || post.status === queryForm.status;
      const matchKeyword = !keyword || post.title.toLowerCase().includes(keyword) || post.content.toLowerCase().includes(keyword);

      return matchOwner && matchBoard && matchModule && matchStatus && matchKeyword;
    });

    pagination.total = posts.value.length;
    useMockData.value = true;
    setApiMessage("我的帖子接口异常，当前使用本地数据兜底。", "warning");
  } finally {
    loading.posts = false;
  }
};

const reloadPageData = async () => {
  await loadBoards();
  await loadMyPosts();
};

const handleFilter = async () => {
  pagination.page = 1;
  await loadMyPosts();
};

const resetQuery = async () => {
  queryForm.boardId = undefined;
  queryForm.keyword = "";
  queryForm.module = "";
  queryForm.status = "";
  queryForm.sortBy = "created_at";
  pagination.page = 1;
  await loadMyPosts();
};

const handlePageChange = async (page: number) => {
  pagination.page = page;
  await loadMyPosts();
};

const openPostDetail = async (post: PostRow) => {
  currentPost.value = post;
  detailDrawerVisible.value = true;

  await Promise.all([loadPostDetail(post.id), loadAttachments(post.id), loadReplies(post.id)]);
};

const loadPostDetail = async (postId: number) => {
  loading.detail = true;

  try {
    if (useMockData.value) return;

    const res = await ForumAPI.getPostDetail(postId);
    currentPost.value = normalizePost(res.data as Forum.ResPostDetail & Record<string, any>);
  } catch (error) {
    console.error("加载帖子详情失败：", error);
  } finally {
    loading.detail = false;
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
    attachments.value = [];
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
    replies.value = [];
  } finally {
    loading.replies = false;
  }
};

const openEditPostDialog = (post: PostRow) => {
  if (!canEditOwnPost(post)) return;

  editingPost.value = post;
  postForm.id = post.id;
  postForm.board_id = post.board_id;
  postForm.module = post.module;
  postForm.title = post.title;
  postForm.content = post.content;
  editDialogVisible.value = true;
};

const submitEditPost = async () => {
  if (!postFormRef.value || !editingPost.value) return;

  await postFormRef.value.validate(async valid => {
    if (!valid || !editingPost.value) return;

    submitting.post = true;

    try {
      if (useMockData.value) {
        updateLocalPost(editingPost.value.id, {
          board_id: Number(postForm.board_id),
          module: postForm.module,
          title: postForm.title,
          content: postForm.content,
          updated_at: getCurrentTimeText()
        });

        editDialogVisible.value = false;
        ElMessage.success("帖子已更新");
        return;
      }

      const res = await ForumAPI.updatePost(editingPost.value.id, {
        board_id: Number(postForm.board_id),
        module: postForm.module,
        title: postForm.title,
        content: postForm.content
      });

      const updated = normalizePost(res.data as Forum.PostItem & Record<string, any>);
      updateLocalPost(updated.id, updated);

      editDialogVisible.value = false;
      ElMessage.success("帖子已更新");
      await loadMyPosts();
    } catch (error) {
      console.error("更新帖子失败：", error);
      ElMessage.error("更新失败，请检查帖子编辑接口或权限");
    } finally {
      submitting.post = false;
    }
  });
};

const deletePost = async (post: PostRow) => {
  if (!canDeleteOwnPost(post)) return;

  try {
    await ElMessageBox.confirm(`确认删除帖子「${post.title}」吗？`, "删除帖子", {
      type: "warning",
      confirmButtonText: "确认删除",
      cancelButtonText: "取消"
    });

    if (useMockData.value) {
      posts.value = posts.value.filter(item => item.id !== post.id);
      if (currentPost.value?.id === post.id) {
        detailDrawerVisible.value = false;
      }
      pagination.total = Math.max(0, pagination.total - 1);
      ElMessage.success("帖子已删除");
      return;
    }

    await ForumAPI.deletePost(post.id);
    posts.value = posts.value.filter(item => item.id !== post.id);

    if (currentPost.value?.id === post.id) {
      detailDrawerVisible.value = false;
    }

    pagination.total = Math.max(0, pagination.total - 1);
    ElMessage.success("帖子已删除");
  } catch (error) {
    if (error !== "cancel") {
      console.error("删除帖子失败：", error);
      ElMessage.error("删除失败，请检查删除权限");
    }
  }
};

const deleteAttachment = async (file: Forum.AttachmentItem) => {
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
        floor: countReplies(replies.value) + 1,
        parent_reply_id: null,
        content: replyContent.value.trim(),
        author_id: currentUser.id,
        author_name: currentUser.name,
        likes_count: 0,
        status: "published",
        created_at: getCurrentTimeText()
      };

      replies.value.push(newReply);
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
    await loadMyPosts();
  } catch (error) {
    console.error("发布回复失败：", error);
    ElMessage.error("回复失败，请检查回复接口或权限");
  } finally {
    submitting.reply = false;
  }
};

const deleteReply = async (reply: ReplyRow) => {
  if (!canDeleteReply(reply)) return;

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
      await loadMyPosts();
    }
  } catch (error) {
    if (error !== "cancel") {
      console.error("删除回复失败：", error);
      ElMessage.error("删除失败，请检查回复删除权限");
    }
  }
};

const updateLocalPost = (id: number, patch: Partial<PostRow>) => {
  posts.value = posts.value.map(item => (item.id === id ? { ...item, ...patch } : item));

  if (currentPost.value?.id === id) {
    currentPost.value = { ...currentPost.value, ...patch };
  }

  if (editingPost.value?.id === id) {
    editingPost.value = { ...editingPost.value, ...patch };
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

const canEditOwnPost = (post?: PostRow | null) => {
  if (!post) return false;
  return post.author_id === currentUser.id && post.status !== "deleted";
};

const canDeleteOwnPost = (post?: PostRow | null) => {
  if (!post) return false;
  return post.author_id === currentUser.id && post.status !== "deleted";
};

const canDeleteReply = (reply: ReplyRow) => {
  return reply.author_id === currentUser.id || Boolean(BUTTONS.delete);
};

const countReplies = (items: ReplyRow[]) => {
  return items.reduce((sum, item) => sum + 1 + countReplies(item.children || []), 0);
};

const goCreateHint = () => {
  ElMessage.info("请到“课程论坛”页面选择课程后发布帖子。");
};

const getBoardName = (boardId?: number) => {
  const board = boards.value.find(item => item.id === boardId);
  return board?.title || `板块 #${boardId || "-"}`;
};

const getAuthorName = (name?: string, id?: number) => {
  return name || (id ? `用户 #${id}` : "未知用户");
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
.forum-my-posts-page,
.my-posts-toolbar {
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
.post-preview {
  display: -webkit-box;
  margin-top: 8px;
  overflow: hidden;
  line-height: 1.6;
  color: var(--el-text-color-regular);
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.post-meta {
  margin-top: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.metrics-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.pagination-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
.drawer-title-row {
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
.reply-header {
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

@media (width <= 900px) {
  .drawer-title-row,
  .attachment-item,
  .reply-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
