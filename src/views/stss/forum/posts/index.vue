<template>
  <div class="forum-posts-page">
    <ForumPageShell
      title="发帖/回帖"
      description="维护课程论坛帖子，支持发帖、编辑、删除、查看详情、附件上传和回复留言的本地 mock 演示。"
      :tags="['课程讨论', '楼层回复', '附件上传', '状态流转']"
      :stats="stats"
      content-title="帖子列表"
      content-description="设置筛选条件后点击筛选。真实接入后对应帖子、回复与附件接口。"
      :data-count="filteredPosts.length"
      empty-description="当前筛选条件下暂无帖子。"
    >
      <template #actions>
        <el-button type="primary" @click="openCreateDialog">创建帖子</el-button>
      </template>

      <template #filters>
        <el-form :model="queryForm" class="filter-form" inline>
          <el-form-item label="关键词">
            <el-input v-model="queryForm.keyword" clearable placeholder="搜索标题、正文或作者" style="width: 260px" />
          </el-form-item>

          <el-form-item label="课程">
            <el-select v-model="queryForm.courseId" clearable placeholder="全部课程" style="width: 170px">
              <el-option v-for="board in mockBoards" :key="board.id" :label="board.courseName" :value="board.courseId" />
            </el-select>
          </el-form-item>

          <el-form-item label="模块">
            <el-select v-model="queryForm.module" clearable placeholder="全部模块" style="width: 170px">
              <el-option label="课程讨论" value="discussion" />
              <el-option label="作业答疑" value="homework" />
              <el-option label="考试说明" value="exam" />
              <el-option label="综合交流" value="general" />
            </el-select>
          </el-form-item>

          <el-form-item label="状态">
            <el-select v-model="queryForm.status" clearable placeholder="全部状态" style="width: 170px">
              <el-option label="已发布" value="published" />
              <el-option label="热门" value="hot" />
              <el-option label="置顶" value="pinned" />
              <el-option label="已隐藏" value="hidden" />
              <el-option label="已删除" value="deleted" />
            </el-select>
          </el-form-item>

          <el-form-item>
            <el-space>
              <el-button type="primary" @click="handleFilter">筛选</el-button>
              <el-button @click="resetQuery">重置</el-button>
            </el-space>
          </el-form-item>
        </el-form>

        <el-alert
          :closable="false"
          show-icon
          title="当前为本地 mock 数据。后续接入时，筛选条件对应 GET /posts 的 keyword、course_id、module、status 等参数。"
          type="info"
        />
      </template>

      <el-table :data="filteredPosts" border>
        <el-table-column label="帖子内容" min-width="300">
          <template #default="{ row }">
            <div class="post-title-cell">
              <span class="post-title">{{ row.title }}</span>
              <el-tag v-if="row.pinned" size="small" type="danger">置顶</el-tag>
              <el-tag v-if="row.status === 'hot'" size="small" type="warning">热门</el-tag>
              <el-tag v-if="getPostAttachments(row.id).length" size="small" type="info">
                附件 {{ getPostAttachments(row.id).length }}
              </el-tag>
            </div>
            <div class="post-content-preview">{{ row.content }}</div>
            <div class="post-meta">{{ row.authorName }} · {{ roleTextMap[row.authorRole] }} · {{ row.createdAt }}</div>
          </template>
        </el-table-column>

        <el-table-column prop="courseName" label="所属课程" min-width="130" />

        <el-table-column label="模块" min-width="110" align="center">
          <template #default="{ row }">
            <el-tag>{{ postModuleTextMap[row.module] }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="状态" min-width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="postStatusTagMap[row.status]">
              {{ postStatusTextMap[row.status] }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="数据" min-width="190">
          <template #default="{ row }">
            <div class="metric-line">浏览 {{ row.viewsCount }} / 回复 {{ row.repliesCount }}</div>
            <div class="metric-line">点赞 {{ row.likesCount }} / 热度 {{ row.hotScore }}</div>
          </template>
        </el-table-column>

        <el-table-column label="附件" min-width="130" align="center">
          <template #default="{ row }">
            <el-tag v-if="getPostAttachments(row.id).length" type="success">
              {{ getPostAttachments(row.id).length }} 个附件
            </el-tag>
            <span v-else class="empty-text">无附件</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="230">
          <template #default="{ row }">
            <el-space>
              <el-button link type="primary" @click="openDetailDrawer(row)">详情</el-button>
              <el-button link @click="openEditDialog(row)">编辑</el-button>
              <el-button link type="warning" @click="handleHide(row)">
                {{ row.status === "hidden" ? "恢复" : "隐藏" }}
              </el-button>
              <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
            </el-space>
          </template>
        </el-table-column>
      </el-table>
    </ForumPageShell>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="760px">
      <el-form :model="postForm" label-width="90px">
        <el-form-item label="所属课程">
          <el-select v-model="postForm.boardId" class="full-width" placeholder="请选择课程论坛">
            <el-option
              v-for="board in mockBoards"
              :key="board.id"
              :label="`${board.courseName} - ${board.title}`"
              :value="board.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="讨论模块">
          <el-select v-model="postForm.module" class="full-width" placeholder="请选择模块">
            <el-option label="课程讨论" value="discussion" />
            <el-option label="作业答疑" value="homework" />
            <el-option label="考试说明" value="exam" />
            <el-option label="综合交流" value="general" />
          </el-select>
        </el-form-item>

        <el-form-item label="帖子标题">
          <el-input v-model="postForm.title" maxlength="80" placeholder="请输入帖子标题" show-word-limit />
        </el-form-item>

        <el-form-item label="帖子正文">
          <el-input
            v-model="postForm.content"
            :rows="7"
            maxlength="800"
            placeholder="请输入帖子正文"
            show-word-limit
            type="textarea"
          />
        </el-form-item>

        <el-form-item label="附件">
          <div class="attachment-uploader">
            <el-upload
              v-model:file-list="postForm.attachments"
              :auto-upload="false"
              :limit="5"
              :on-exceed="handleAttachmentExceed"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg,.zip,.rar,.txt,.md"
              drag
            >
              <el-icon class="attachment-uploader__icon">
                <UploadFilled />
              </el-icon>
              <div class="el-upload__text">将附件拖到此处，或 <em>点击选择文件</em></div>
              <template #tip>
                <div class="el-upload__tip">
                  当前为本地 mock 附件，不会真正上传；后续接入
                  <code>/posts/{post_id}/attachments</code>
                  接口。
                </div>
              </template>
            </el-upload>
          </div>
        </el-form-item>

        <el-form-item label="展示设置">
          <el-checkbox v-model="postForm.pinned">置顶帖子</el-checkbox>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="drawerVisible" size="580px" title="帖子详情与回复">
      <template v-if="currentPost">
        <div class="drawer-post">
          <div class="drawer-title">{{ currentPost.title }}</div>
          <div class="drawer-meta">
            {{ currentPost.courseName }} · {{ postModuleTextMap[currentPost.module] }} · {{ currentPost.authorName }} ·
            {{ roleTextMap[currentPost.authorRole] }}
          </div>
          <p class="drawer-content">{{ currentPost.content }}</p>

          <div class="drawer-metrics">
            <el-tag>浏览 {{ currentPost.viewsCount }}</el-tag>
            <el-tag type="success">回复 {{ currentPost.repliesCount }}</el-tag>
            <el-tag type="warning">点赞 {{ currentPost.likesCount }}</el-tag>
            <el-tag type="danger">热度 {{ currentPost.hotScore }}</el-tag>
          </div>
        </div>

        <el-card class="attachment-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span>帖子附件</span>
              <el-tag size="small" effect="plain">{{ getPostAttachments(currentPost.id).length }} 个</el-tag>
            </div>
          </template>

          <el-empty v-if="getPostAttachments(currentPost.id).length === 0" description="暂无附件" />

          <div v-else class="attachment-list">
            <div v-for="attachment in getPostAttachments(currentPost.id)" :key="attachment.id" class="attachment-item">
              <div class="attachment-item__main">
                <el-icon>
                  <Document />
                </el-icon>
                <div>
                  <div class="attachment-item__name">{{ attachment.fileName }}</div>
                  <div class="attachment-item__meta">
                    {{ formatFileSize(attachment.fileSize) }} · {{ attachment.uploaderName }} · {{ attachment.createdAt }}
                  </div>
                </div>
              </div>
              <el-button link type="primary" @click="previewAttachment(attachment)">预览</el-button>
            </div>
          </div>
        </el-card>

        <el-divider />

        <div class="reply-header">
          <span>回复列表</span>
          <el-tag effect="plain">{{ currentReplies.length }} 条主回复</el-tag>
        </div>

        <el-card class="reply-form-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span>{{ replyForm.parentReplyId ? `回复 #${replyForm.parentFloor}` : "回复帖子" }}</span>
              <el-button v-if="replyForm.parentReplyId" link type="primary" @click="clearReplyTarget">取消楼层回复</el-button>
            </div>
          </template>

          <el-input
            v-model="replyForm.content"
            :rows="3"
            maxlength="300"
            placeholder="请输入回复内容"
            show-word-limit
            type="textarea"
          />

          <div class="reply-form-actions">
            <el-button type="primary" @click="submitReply">发布回复</el-button>
          </div>
        </el-card>

        <el-empty v-if="currentReplies.length === 0" description="暂无回复" />

        <div v-else class="reply-list">
          <div v-for="reply in currentReplies" :key="reply.id" class="reply-item">
            <div class="reply-title">
              <span>#{{ reply.floor }} {{ reply.authorName }}</span>
              <div class="reply-title__actions">
                <el-tag size="small">{{ roleTextMap[reply.authorRole] }}</el-tag>
                <el-button link type="primary" @click="setReplyTarget(reply)">回复</el-button>
              </div>
            </div>
            <div class="reply-content">{{ reply.content }}</div>
            <div class="reply-meta">{{ reply.createdAt }} · 点赞 {{ reply.likesCount }}</div>

            <div v-if="getReplyAttachments(reply.id).length" class="reply-attachments">
              <el-tag v-for="attachment in getReplyAttachments(reply.id)" :key="attachment.id" size="small" type="info">
                {{ attachment.fileName }}
              </el-tag>
            </div>

            <div v-if="reply.children?.length" class="child-replies">
              <div v-for="child in reply.children" :key="child.id" class="child-reply">
                <div class="reply-title">
                  <span>#{{ child.floor }} {{ child.authorName }} 回复 #{{ reply.floor }}</span>
                  <div class="reply-title__actions">
                    <el-tag size="small">{{ roleTextMap[child.authorRole] }}</el-tag>
                    <el-button link type="primary" @click="setReplyTarget(child)">回复</el-button>
                  </div>
                </div>
                <div class="reply-content">{{ child.content }}</div>
                <div class="reply-meta">{{ child.createdAt }} · 点赞 {{ child.likesCount }}</div>

                <div v-if="getReplyAttachments(child.id).length" class="reply-attachments">
                  <el-tag v-for="attachment in getReplyAttachments(child.id)" :key="attachment.id" size="small" type="info">
                    {{ attachment.fileName }}
                  </el-tag>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { Document, UploadFilled } from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import type { UploadUserFile } from "element-plus";
import ForumPageShell from "../components/ForumPageShell.vue";
import {
  mockAttachments,
  mockBoards,
  mockPosts,
  mockReplies,
  postModuleTextMap,
  type ForumAttachmentMock,
  type ForumPostMock,
  type ForumReplyMock,
  type PostModule,
  type PostStatus
} from "../mock";

type DialogMode = "create" | "edit";

interface PostForm {
  id?: number;
  boardId: number | null;
  module: PostModule;
  title: string;
  content: string;
  pinned: boolean;
  attachments: UploadUserFile[];
}

interface PostQueryForm {
  keyword: string;
  courseId: string;
  module: PostModule | "";
  status: PostStatus | "";
}

const createEmptyQuery = (): PostQueryForm => ({
  keyword: "",
  courseId: "",
  module: "",
  status: ""
});

const postStatusTextMap: Record<PostStatus, string> = {
  published: "已发布",
  hot: "热门",
  pinned: "置顶",
  hidden: "已隐藏",
  deleted: "已删除"
};

const postStatusTagMap: Record<PostStatus, "success" | "warning" | "danger" | "info"> = {
  published: "success",
  hot: "warning",
  pinned: "danger",
  hidden: "info",
  deleted: "info"
};

const roleTextMap = {
  student: "学生",
  teacher: "教师",
  admin: "管理员"
};

const posts = ref<ForumPostMock[]>(mockPosts.map(item => ({ ...item })));
const replies = ref<ForumReplyMock[]>(
  mockReplies.map(item => ({ ...item, children: item.children?.map(child => ({ ...child })) }))
);
const attachments = ref<ForumAttachmentMock[]>(mockAttachments.map(item => ({ ...item })));

const queryForm = reactive<PostQueryForm>(createEmptyQuery());
const activeQuery = reactive<PostQueryForm>(createEmptyQuery());

const dialogVisible = ref(false);
const dialogMode = ref<DialogMode>("create");
const drawerVisible = ref(false);
const currentPost = ref<ForumPostMock | null>(null);

const postForm = reactive<PostForm>({
  id: undefined,
  boardId: null,
  module: "discussion",
  title: "",
  content: "",
  pinned: false,
  attachments: []
});

const replyForm = reactive({
  parentReplyId: null as number | null,
  parentFloor: null as number | null,
  content: ""
});

const filteredPosts = computed(() => {
  const keyword = activeQuery.keyword.trim().toLowerCase();

  return posts.value.filter(post => {
    const matchKeyword =
      !keyword ||
      post.title.toLowerCase().includes(keyword) ||
      post.content.toLowerCase().includes(keyword) ||
      post.authorName.toLowerCase().includes(keyword);

    const matchCourse = !activeQuery.courseId || post.courseId === activeQuery.courseId;
    const matchModule = !activeQuery.module || post.module === activeQuery.module;
    const matchStatus = !activeQuery.status || post.status === activeQuery.status;

    return matchKeyword && matchCourse && matchModule && matchStatus;
  });
});

const currentReplies = computed(() => {
  if (!currentPost.value) return [];

  return replies.value.filter(reply => reply.postId === currentPost.value?.id);
});

const stats = computed(() => [
  {
    label: "帖子总数",
    value: posts.value.length,
    help: "课程论坛帖子数量"
  },
  {
    label: "回复总数",
    value: getTotalReplyCount(),
    help: "帖子下的互动回复"
  },
  {
    label: "附件总数",
    value: attachments.value.length,
    help: "帖子与回复附件数量"
  },
  {
    label: "热门帖子",
    value: posts.value.filter(item => item.status === "hot").length,
    help: "热度较高的讨论内容"
  }
]);

const dialogTitle = computed(() => {
  return dialogMode.value === "create" ? "创建帖子" : "编辑帖子";
});

const getCurrentTimeText = () => {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");

  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
};

const getBoardInfo = (boardId: number | null) => {
  return mockBoards.find(board => board.id === boardId);
};

const getPostAttachments = (postId: number) => {
  return attachments.value.filter(item => item.ownerType === "post" && item.ownerId === postId);
};

const getReplyAttachments = (replyId: number) => {
  return attachments.value.filter(item => item.ownerType === "reply" && item.ownerId === replyId);
};

const getTotalReplyCount = () => {
  return replies.value.reduce((sum, reply) => sum + 1 + (reply.children?.length ?? 0), 0);
};

const getMaxFloor = (postId: number) => {
  return replies.value
    .filter(reply => reply.postId === postId)
    .reduce((maxFloor, reply) => Math.max(maxFloor, reply.floor, ...(reply.children?.map(child => child.floor) ?? [])), 0);
};

const toUploadFile = (attachment: ForumAttachmentMock): UploadUserFile => {
  return {
    uid: attachment.id,
    name: attachment.fileName,
    url: attachment.fileUrl,
    size: attachment.fileSize,
    status: "success"
  };
};

const formatFileSize = (size: number) => {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;

  return `${(size / 1024 / 1024).toFixed(1)} MB`;
};

const handleFilter = () => {
  activeQuery.keyword = queryForm.keyword;
  activeQuery.courseId = queryForm.courseId;
  activeQuery.module = queryForm.module;
  activeQuery.status = queryForm.status;
};

const resetQuery = () => {
  Object.assign(queryForm, createEmptyQuery());
  Object.assign(activeQuery, createEmptyQuery());
};

const resetPostForm = () => {
  postForm.id = undefined;
  postForm.boardId = mockBoards[0]?.id ?? null;
  postForm.module = "discussion";
  postForm.title = "";
  postForm.content = "";
  postForm.pinned = false;
  postForm.attachments = [];
};

const resetReplyForm = () => {
  replyForm.parentReplyId = null;
  replyForm.parentFloor = null;
  replyForm.content = "";
};

const fillPostForm = (post: ForumPostMock) => {
  postForm.id = post.id;
  postForm.boardId = post.boardId;
  postForm.module = post.module;
  postForm.title = post.title;
  postForm.content = post.content;
  postForm.pinned = post.pinned;
  postForm.attachments = getPostAttachments(post.id).map(toUploadFile);
};

const openCreateDialog = () => {
  resetPostForm();
  dialogMode.value = "create";
  dialogVisible.value = true;
};

const openEditDialog = (post: ForumPostMock) => {
  fillPostForm(post);
  dialogMode.value = "edit";
  dialogVisible.value = true;
};

const openDetailDrawer = (post: ForumPostMock) => {
  currentPost.value = post;
  resetReplyForm();
  drawerVisible.value = true;
};

const handleAttachmentExceed = () => {
  ElMessage.warning("本地 mock 最多展示 5 个附件");
};

const savePostAttachments = (postId: number) => {
  attachments.value = attachments.value.filter(item => !(item.ownerType === "post" && item.ownerId === postId));

  const now = getCurrentTimeText();
  const savedAttachments = postForm.attachments.map((file, index) => {
    const existingId = typeof file.uid === "number" ? file.uid : Date.now() + index;

    return {
      id: existingId,
      ownerType: "post" as const,
      ownerId: postId,
      fileName: file.name,
      fileUrl: file.url || "#",
      fileSize: file.size || 0,
      mimeType: file.raw?.type || "application/octet-stream",
      uploaderName: "当前用户",
      createdAt: now
    };
  });

  attachments.value.push(...savedAttachments);
};

const handleSubmit = () => {
  const title = postForm.title.trim();
  const content = postForm.content.trim();
  const board = getBoardInfo(postForm.boardId);

  if (!board) {
    ElMessage.warning("请选择所属课程论坛");
    return;
  }

  if (!title) {
    ElMessage.warning("请输入帖子标题");
    return;
  }

  if (!content) {
    ElMessage.warning("请输入帖子正文");
    return;
  }

  if (dialogMode.value === "create") {
    const now = getCurrentTimeText();
    const postId = Date.now();

    posts.value.unshift({
      id: postId,
      boardId: board.id,
      boardName: board.title,
      courseId: board.courseId,
      courseName: board.courseName,
      module: postForm.module,
      title,
      content,
      authorName: "当前用户",
      authorRole: "student",
      status: postForm.pinned ? "pinned" : "published",
      pinned: postForm.pinned,
      viewsCount: 0,
      repliesCount: 0,
      likesCount: 0,
      hotScore: 0,
      createdAt: now,
      updatedAt: now
    });

    savePostAttachments(postId);
    ElMessage.success("帖子已添加到 mock 列表，附件已记录为本地 mock 数据");
  }

  if (dialogMode.value === "edit" && postForm.id) {
    const target = posts.value.find(item => item.id === postForm.id);

    if (target) {
      target.boardId = board.id;
      target.boardName = board.title;
      target.courseId = board.courseId;
      target.courseName = board.courseName;
      target.module = postForm.module;
      target.title = title;
      target.content = content;
      target.pinned = postForm.pinned;
      target.status = postForm.pinned ? "pinned" : target.status === "hidden" ? "hidden" : "published";
      target.updatedAt = getCurrentTimeText();

      savePostAttachments(target.id);
    }

    ElMessage.success("帖子 mock 数据已更新，附件列表已同步");
  }

  dialogVisible.value = false;
};

const handleHide = (post: ForumPostMock) => {
  const willHide = post.status !== "hidden";

  post.status = willHide ? "hidden" : "published";
  post.pinned = false;

  ElMessage.success(`${willHide ? "已隐藏" : "已恢复"}：${post.title}`);
};

const handleDelete = async (post: ForumPostMock) => {
  try {
    await ElMessageBox.confirm(`确认删除帖子“${post.title}”吗？当前只会从本地 mock 列表移除。`, "删除确认", {
      confirmButtonText: "删除",
      cancelButtonText: "取消",
      type: "warning"
    });

    posts.value = posts.value.filter(item => item.id !== post.id);
    replies.value = replies.value.filter(item => item.postId !== post.id);
    attachments.value = attachments.value.filter(item => !(item.ownerType === "post" && item.ownerId === post.id));

    if (currentPost.value?.id === post.id) {
      currentPost.value = null;
      drawerVisible.value = false;
    }

    ElMessage.success("已从 mock 列表删除");
  } catch {
    // 用户取消删除，不需要提示
  }
};

const setReplyTarget = (reply: ForumReplyMock) => {
  replyForm.parentReplyId = reply.id;
  replyForm.parentFloor = reply.floor;
};

const clearReplyTarget = () => {
  replyForm.parentReplyId = null;
  replyForm.parentFloor = null;
};

const appendChildReply = (parentReplyId: number, childReply: ForumReplyMock) => {
  for (const reply of replies.value) {
    if (reply.id === parentReplyId) {
      reply.children = [...(reply.children ?? []), childReply];
      return true;
    }

    const childTarget = reply.children?.find(child => child.id === parentReplyId);

    if (childTarget) {
      reply.children = [...(reply.children ?? []), childReply];
      return true;
    }
  }

  return false;
};

const submitReply = () => {
  if (!currentPost.value) return;

  const content = replyForm.content.trim();

  if (!content) {
    ElMessage.warning("请输入回复内容");
    return;
  }

  const nextFloor = getMaxFloor(currentPost.value.id) + 1;
  const replyId = Date.now();

  const newReply: ForumReplyMock = {
    id: replyId,
    postId: currentPost.value.id,
    parentReplyId: replyForm.parentReplyId,
    floor: nextFloor,
    content,
    authorName: "当前用户",
    authorRole: "student",
    likesCount: 0,
    status: "published",
    createdAt: getCurrentTimeText()
  };

  if (replyForm.parentReplyId) {
    const appended = appendChildReply(replyForm.parentReplyId, newReply);

    if (!appended) {
      replies.value.push(newReply);
    }
  } else {
    replies.value.push(newReply);
  }

  currentPost.value.repliesCount += 1;
  resetReplyForm();
  ElMessage.success("回复已添加到 mock 列表");
};

const previewAttachment = (attachment: ForumAttachmentMock) => {
  ElMessage.info(`当前为 mock 附件，暂不打开真实文件：${attachment.fileName}`);
};
</script>

<style scoped lang="scss">
.forum-posts-page,
.filter-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.filter-form {
  flex-flow: row wrap;
}
.post-title-cell {
  display: flex;
  gap: 6px;
  align-items: center;
}
.post-title {
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.post-content-preview {
  width: 100%;
  margin-top: 6px;
  overflow: hidden;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  text-overflow: ellipsis;
  white-space: nowrap;
}
.post-meta {
  margin-top: 6px;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}
.metric-line {
  line-height: 22px;
  color: var(--el-text-color-secondary);
}
.empty-text {
  color: var(--el-text-color-placeholder);
}
.full-width {
  width: 100%;
}
.attachment-uploader {
  width: 100%;
}
.attachment-uploader__icon {
  margin-bottom: 8px;
  font-size: 32px;
  color: var(--el-color-primary);
}
.drawer-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.drawer-meta {
  margin-top: 8px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.drawer-content {
  margin: 16px 0;
  line-height: 1.8;
  color: var(--el-text-color-regular);
}
.drawer-metrics {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.attachment-card,
.reply-form-card {
  margin-top: 16px;
  border-radius: 10px;
}
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.attachment-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.attachment-item {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
}
.attachment-item__main {
  display: flex;
  gap: 10px;
  align-items: center;
  min-width: 0;
}
.attachment-item__name {
  overflow: hidden;
  font-weight: 600;
  color: var(--el-text-color-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}
.attachment-item__meta {
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.reply-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  font-weight: 600;
}
.reply-form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}
.reply-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.reply-item,
.child-reply {
  padding: 12px;
  background: var(--el-fill-color-blank);
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
}
.child-replies {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 10px;
  margin-left: 20px;
}
.child-reply {
  background: var(--el-fill-color-lighter);
}
.reply-title {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
}
.reply-title__actions {
  display: flex;
  gap: 8px;
  align-items: center;
}
.reply-content {
  margin-top: 8px;
  color: var(--el-text-color-regular);
}
.reply-meta {
  margin-top: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.reply-attachments {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}
</style>
