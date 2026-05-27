<template>
  <div class="forum-posts-page">
    <ForumPageShell
      title="发帖/回帖"
      description="维护课程论坛帖子，支持发帖、编辑、删除、查看详情和本地回复 mock 演示。"
      :tags="['课程讨论', '嵌套回复', '状态流转']"
      :stats="stats"
      content-title="帖子列表"
      content-description="展示课程论坛帖子及互动数据，后续可替换为帖子与回复接口返回。"
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
            <el-button @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>
      </template>

      <el-table :data="filteredPosts" border>
        <el-table-column label="帖子内容" min-width="280">
          <template #default="{ row }">
            <div class="post-title-cell">
              <span class="post-title">{{ row.title }}</span>
              <el-tag v-if="row.pinned" size="small" type="danger">置顶</el-tag>
              <el-tag v-if="row.status === 'hot'" size="small" type="warning">热门</el-tag>
            </div>
            <div class="post-content-preview">{{ row.content }}</div>
            <div class="post-meta">{{ row.authorName }} · {{ row.createdAt }}</div>
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

        <el-table-column label="数据" min-width="180">
          <template #default="{ row }">
            <div class="metric-line">浏览 {{ row.viewsCount }} / 回复 {{ row.repliesCount }}</div>
            <div class="metric-line">点赞 {{ row.likesCount }} / 热度 {{ row.hotScore }}</div>
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

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="720px">
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

        <el-form-item label="展示设置">
          <el-checkbox v-model="postForm.pinned">置顶帖子</el-checkbox>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="drawerVisible" size="520px" title="帖子详情与回复">
      <template v-if="currentPost">
        <div class="drawer-post">
          <div class="drawer-title">{{ currentPost.title }}</div>
          <div class="drawer-meta">
            {{ currentPost.courseName }} · {{ postModuleTextMap[currentPost.module] }} · {{ currentPost.authorName }}
          </div>
          <p class="drawer-content">{{ currentPost.content }}</p>

          <div class="drawer-metrics">
            <el-tag>浏览 {{ currentPost.viewsCount }}</el-tag>
            <el-tag type="success">回复 {{ currentPost.repliesCount }}</el-tag>
            <el-tag type="warning">点赞 {{ currentPost.likesCount }}</el-tag>
            <el-tag type="danger">热度 {{ currentPost.hotScore }}</el-tag>
          </div>
        </div>

        <el-divider />

        <div class="reply-header">
          <span>回复列表</span>
          <el-button size="small" type="primary" @click="addMockReply">模拟回复</el-button>
        </div>

        <el-empty v-if="currentReplies.length === 0" description="暂无回复" />

        <div v-else class="reply-list">
          <div v-for="reply in currentReplies" :key="reply.id" class="reply-item">
            <div class="reply-title">
              <span>#{{ reply.floor }} {{ reply.authorName }}</span>
              <el-tag size="small">{{ roleTextMap[reply.authorRole] }}</el-tag>
            </div>
            <div class="reply-content">{{ reply.content }}</div>
            <div class="reply-meta">{{ reply.createdAt }} · 点赞 {{ reply.likesCount }}</div>

            <div v-if="reply.children?.length" class="child-replies">
              <div v-for="child in reply.children" :key="child.id" class="child-reply">
                <div class="reply-title">
                  <span>#{{ child.floor }} {{ child.authorName }} 回复 #{{ reply.floor }}</span>
                  <el-tag size="small">{{ roleTextMap[child.authorRole] }}</el-tag>
                </div>
                <div class="reply-content">{{ child.content }}</div>
                <div class="reply-meta">{{ child.createdAt }} · 点赞 {{ child.likesCount }}</div>
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
import { ElMessage, ElMessageBox } from "element-plus";
import ForumPageShell from "../components/ForumPageShell.vue";
import {
  mockBoards,
  mockPosts,
  mockReplies,
  postModuleTextMap,
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
}

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

const queryForm = reactive({
  keyword: "",
  courseId: "",
  module: "" as PostModule | "",
  status: "" as PostStatus | ""
});

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
  pinned: false
});

const filteredPosts = computed(() => {
  const keyword = queryForm.keyword.trim().toLowerCase();

  return posts.value.filter(post => {
    const matchKeyword =
      !keyword ||
      post.title.toLowerCase().includes(keyword) ||
      post.content.toLowerCase().includes(keyword) ||
      post.authorName.toLowerCase().includes(keyword);

    const matchCourse = !queryForm.courseId || post.courseId === queryForm.courseId;
    const matchModule = !queryForm.module || post.module === queryForm.module;
    const matchStatus = !queryForm.status || post.status === queryForm.status;

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
    value: posts.value.reduce((sum, post) => sum + post.repliesCount, 0),
    help: "帖子下的互动回复"
  },
  {
    label: "热门帖子",
    value: posts.value.filter(item => item.status === "hot").length,
    help: "热度较高的讨论内容"
  },
  {
    label: "已隐藏",
    value: posts.value.filter(item => item.status === "hidden").length,
    help: "管理员处理的内容"
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

const resetQuery = () => {
  queryForm.keyword = "";
  queryForm.courseId = "";
  queryForm.module = "";
  queryForm.status = "";
};

const resetPostForm = () => {
  postForm.id = undefined;
  postForm.boardId = mockBoards[0]?.id ?? null;
  postForm.module = "discussion";
  postForm.title = "";
  postForm.content = "";
  postForm.pinned = false;
};

const fillPostForm = (post: ForumPostMock) => {
  postForm.id = post.id;
  postForm.boardId = post.boardId;
  postForm.module = post.module;
  postForm.title = post.title;
  postForm.content = post.content;
  postForm.pinned = post.pinned;
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
  drawerVisible.value = true;
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

    posts.value.unshift({
      id: Date.now(),
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

    ElMessage.success("帖子已添加到 mock 列表");
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
    }

    ElMessage.success("帖子 mock 数据已更新");
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
    ElMessage.success("已从 mock 列表删除");
  } catch {
    // 用户取消删除，不需要提示
  }
};

const addMockReply = () => {
  if (!currentPost.value) return;

  const nextFloor =
    replies.value
      .filter(reply => reply.postId === currentPost.value?.id)
      .reduce((maxFloor, reply) => Math.max(maxFloor, reply.floor, ...(reply.children?.map(child => child.floor) ?? [])), 0) + 1;

  replies.value.push({
    id: Date.now(),
    postId: currentPost.value.id,
    parentReplyId: null,
    floor: nextFloor,
    content: "这是一条本地 mock 回复，用于演示回帖功能。",
    authorName: "当前用户",
    authorRole: "student",
    likesCount: 0,
    status: "published",
    createdAt: getCurrentTimeText()
  });

  currentPost.value.repliesCount += 1;
  ElMessage.success("已添加一条 mock 回复");
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
.full-width {
  width: 100%;
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
.reply-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  font-weight: 600;
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
.reply-content {
  margin-top: 8px;
  color: var(--el-text-color-regular);
}
.reply-meta {
  margin-top: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>
