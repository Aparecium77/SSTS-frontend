<template>
  <div class="forum-course-boards-page">
    <ForumPageShell
      title="课程论坛"
      description="维护课程论坛板块，展示每个课程板块的公告、帖子、回复、附件和活跃度概览。"
      :tags="['课程板块', '公告弹窗', '活跃统计', '状态启停']"
      :stats="stats"
      content-title="课程论坛板块"
      content-description="设置筛选条件后点击筛选。当前为本地 mock 板块数据，后续可对接课程/开课实例论坛板块接口。"
      :data-count="filteredBoards.length"
      empty-description="当前筛选条件下暂无课程论坛板块。"
    >
      <template #actions>
        <el-button v-if="canCreate" type="primary" @click="openCreateDialog">新增板块</el-button>
      </template>

      <template #filters>
        <el-form :model="queryForm" class="filter-form" inline>
          <el-form-item label="关键词">
            <el-input v-model="queryForm.keyword" clearable placeholder="搜索课程、板块或描述" style="width: 260px" />
          </el-form-item>

          <el-form-item label="课程">
            <el-select v-model="queryForm.courseId" clearable placeholder="全部课程" style="width: 180px">
              <el-option v-for="board in boards" :key="board.id" :label="board.courseName" :value="board.courseId" />
            </el-select>
          </el-form-item>

          <el-form-item label="状态">
            <el-select v-model="queryForm.status" clearable placeholder="全部状态" style="width: 160px">
              <el-option label="启用中" value="active" />
              <el-option label="已停用" value="inactive" />
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
          title="当前页面只维护课程论坛板块的前端 mock 展示。学生选课校验、任课教师匹配等跨组逻辑后续由后端与选课/基础信息模块完成。"
          type="info"
        />
      </template>

      <el-table :data="filteredBoards" border>
        <el-table-column label="板块信息" min-width="290">
          <template #default="{ row }">
            <div class="board-title-cell">
              <span class="board-title">{{ row.title }}</span>
              <el-tag v-if="row.popupEnabled" size="small" type="warning">弹窗公告</el-tag>
            </div>
            <div class="board-description">{{ row.description }}</div>
            <div class="board-meta">{{ row.courseName }} · {{ row.courseId }} · 更新于 {{ row.updatedAt }}</div>
          </template>
        </el-table-column>

        <el-table-column label="状态" min-width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'info'">
              {{ row.status === "active" ? "启用中" : "已停用" }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="板块统计" min-width="220">
          <template #default="{ row }">
            <div class="metric-line">公告 {{ getBoardNoticeCount(row.id) }} / 帖子 {{ getBoardPosts(row.id).length }}</div>
            <div class="metric-line">回复 {{ getBoardReplyCount(row.id) }} / 附件 {{ getBoardAttachmentCount(row.id) }}</div>
          </template>
        </el-table-column>

        <el-table-column label="热门内容" min-width="220">
          <template #default="{ row }">
            <template v-if="getBoardTopPost(row.id)">
              <div class="hot-title">{{ getBoardTopPost(row.id)?.title }}</div>
              <div class="metric-line">
                热度 {{ getBoardTopPost(row.id)?.hotScore }} · 回复 {{ getBoardTopPost(row.id)?.repliesCount }}
              </div>
            </template>
            <span v-else class="empty-text">暂无热门帖子</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="230">
          <template #default="{ row }">
            <el-space>
              <el-button link type="primary" @click="openDetailDrawer(row)">详情</el-button>
              <el-button v-if="canEdit" link @click="openEditDialog(row)">编辑</el-button>
              <el-button v-if="canEdit" link type="warning" @click="toggleBoardStatus(row)">
                {{ row.status === "active" ? "停用" : "启用" }}
              </el-button>
            </el-space>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          :background="true"
          :current-page="pageNum"
          :page-size="pageSize"
          :page-sizes="[10, 25, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        ></el-pagination>
      </div>
    </ForumPageShell>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="680px">
      <el-form :model="boardForm" label-width="96px">
        <el-form-item label="课程编号">
          <el-input v-model="boardForm.courseId" placeholder="例如 SE-2026" />
        </el-form-item>

        <el-form-item label="课程名称">
          <el-input v-model="boardForm.courseName" placeholder="例如 软件工程" />
        </el-form-item>

        <el-form-item label="板块名称">
          <el-input v-model="boardForm.title" maxlength="50" placeholder="请输入课程论坛板块名称" show-word-limit />
        </el-form-item>

        <el-form-item label="板块描述">
          <el-input
            v-model="boardForm.description"
            :rows="4"
            maxlength="220"
            placeholder="说明该课程论坛用于公告、答疑、资料共享或小组讨论等"
            show-word-limit
            type="textarea"
          />
        </el-form-item>

        <el-form-item label="板块状态">
          <el-radio-group v-model="boardForm.status">
            <el-radio value="active">启用</el-radio>
            <el-radio value="inactive">停用</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="公告弹窗">
          <el-switch v-model="boardForm.popupEnabled" active-text="启用" inactive-text="关闭" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="drawerVisible" size="620px" title="课程论坛详情">
      <template v-if="currentBoard">
        <div class="drawer-title">{{ currentBoard.title }}</div>
        <div class="drawer-meta">
          {{ currentBoard.courseName }} · {{ currentBoard.courseId }} ·
          {{ currentBoard.status === "active" ? "启用中" : "已停用" }}
        </div>
        <p class="drawer-content">{{ currentBoard.description }}</p>

        <div class="drawer-metrics">
          <el-tag>公告 {{ getBoardNoticeCount(currentBoard.id) }}</el-tag>
          <el-tag type="success">帖子 {{ getBoardPosts(currentBoard.id).length }}</el-tag>
          <el-tag type="warning">回复 {{ getBoardReplyCount(currentBoard.id) }}</el-tag>
          <el-tag type="info">附件 {{ getBoardAttachmentCount(currentBoard.id) }}</el-tag>
        </div>

        <el-divider />

        <el-card shadow="never" class="detail-card">
          <template #header>
            <div class="card-header">
              <span>置顶/弹窗公告</span>
              <el-tag size="small" effect="plain">{{ getBoardNotices(currentBoard.id).length }} 条</el-tag>
            </div>
          </template>

          <el-empty v-if="getBoardNotices(currentBoard.id).length === 0" description="暂无公告" />

          <div v-else class="notice-list">
            <div v-for="notice in getBoardNotices(currentBoard.id)" :key="notice.id" class="notice-item">
              <div>
                <div class="notice-title">
                  {{ notice.title }}
                  <el-tag v-if="notice.pinned" size="small" type="danger">置顶</el-tag>
                  <el-tag v-if="notice.popup" size="small" type="warning">弹窗</el-tag>
                </div>
                <div class="notice-meta">{{ notice.authorName }} · {{ notice.createdAt }}</div>
              </div>
              <el-tag :type="notice.status === 'published' ? 'success' : 'info'">
                {{ notice.status === "published" ? "已发布" : "已隐藏" }}
              </el-tag>
            </div>
          </div>
        </el-card>

        <el-card shadow="never" class="detail-card">
          <template #header>
            <div class="card-header">
              <span>热门帖子 TOP</span>
              <el-tag size="small" effect="plain">{{ getBoardTopPosts(currentBoard.id).length }} 条</el-tag>
            </div>
          </template>

          <el-empty v-if="getBoardTopPosts(currentBoard.id).length === 0" description="暂无热门帖子" />

          <div v-else class="hot-list">
            <div v-for="(post, index) in getBoardTopPosts(currentBoard.id)" :key="post.id" class="hot-item">
              <div class="hot-rank">{{ index + 1 }}</div>
              <div class="hot-main">
                <div class="hot-title">{{ post.title }}</div>
                <div class="metric-line">
                  {{ post.authorName }} · {{ postModuleTextMap[post.module] }} · 浏览 {{ post.viewsCount }} · 回复
                  {{ post.repliesCount }}
                </div>
              </div>
              <el-tag type="warning">热度 {{ post.hotScore }}</el-tag>
            </div>
          </div>
        </el-card>

        <el-card shadow="never" class="detail-card">
          <template #header>
            <div class="card-header">
              <span>用户活跃度概览</span>
              <el-tag size="small" effect="plain">mock 统计</el-tag>
            </div>
          </template>

          <el-empty v-if="getBoardUserActivities(currentBoard.id).length === 0" description="暂无活跃度数据" />

          <el-table v-else :data="getBoardUserActivities(currentBoard.id)" border size="small">
            <el-table-column prop="authorName" label="用户" min-width="110" />
            <el-table-column prop="postCount" label="发帖" width="80" align="center" />
            <el-table-column prop="replyCount" label="回帖" width="80" align="center" />
            <el-table-column prop="activityScore" label="活跃度" width="100" align="center" />
          </el-table>
        </el-card>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import ForumPageShell from "../components/ForumPageShell.vue";
import { useForumAuthButtons } from "../auth";
import {
  mockAttachments,
  mockBoards,
  mockNotices,
  mockPosts,
  mockReplies,
  postModuleTextMap,
  type ForumBoardMock
} from "../mock";

const { BUTTONS } = useForumAuthButtons();
const canCreate = computed(() => BUTTONS.create);
const canEdit = computed(() => BUTTONS.edit);

type DialogMode = "create" | "edit";
type BoardStatus = "active" | "inactive";

interface ForumBoardView extends ForumBoardMock {
  popupEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

interface BoardForm {
  id?: number;
  courseId: string;
  courseName: string;
  title: string;
  description: string;
  status: BoardStatus;
  popupEnabled: boolean;
}

interface BoardQueryForm {
  keyword: string;
  courseId: string;
  status: BoardStatus | "";
}

interface UserActivityView {
  authorName: string;
  postCount: number;
  replyCount: number;
  activityScore: number;
}

const createEmptyQuery = (): BoardQueryForm => ({
  keyword: "",
  courseId: "",
  status: ""
});

const createEmptyBoardForm = (): BoardForm => ({
  id: undefined,
  courseId: "",
  courseName: "",
  title: "",
  description: "",
  status: "active",
  popupEnabled: false
});

const boards = ref<ForumBoardView[]>(
  mockBoards.map((board, index) => ({
    ...board,
    popupEnabled: mockNotices.some(notice => notice.boardId === board.id && notice.popup),
    createdAt: `2026-04-${String(20 + index).padStart(2, "0")} 09:00`,
    updatedAt: `2026-04-${String(24 + index).padStart(2, "0")} 10:00`
  }))
);

const queryForm = reactive<BoardQueryForm>(createEmptyQuery());
const activeQuery = reactive<BoardQueryForm>(createEmptyQuery());
const boardForm = reactive<BoardForm>(createEmptyBoardForm());

const dialogVisible = ref(false);
const dialogMode = ref<DialogMode>("create");
const drawerVisible = ref(false);
const currentBoard = ref<ForumBoardView | null>(null);

const pageNum = ref(1);
const pageSize = ref(10);
const total = ref(0);

const allFilteredBoards = computed(() => {
  const keyword = activeQuery.keyword.trim().toLowerCase();

  return boards.value.filter(board => {
    const matchKeyword =
      !keyword ||
      board.title.toLowerCase().includes(keyword) ||
      board.description.toLowerCase().includes(keyword) ||
      board.courseName.toLowerCase().includes(keyword) ||
      board.courseId.toLowerCase().includes(keyword);

    const matchCourse = !activeQuery.courseId || board.courseId === activeQuery.courseId;
    const matchStatus = !activeQuery.status || board.status === activeQuery.status;

    return matchKeyword && matchCourse && matchStatus;
  });
});

total.value = allFilteredBoards.value.length;

const filteredBoards = computed(() => {
  const start = (pageNum.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return allFilteredBoards.value.slice(start, end);
});

watch(
  [activeQuery, pageNum, pageSize],
  () => {
    total.value = allFilteredBoards.value.length;
    if (pageNum.value > Math.ceil(total.value / pageSize.value) && pageNum.value > 1) {
      pageNum.value = 1;
    }
  },
  { immediate: true }
);

const handleSizeChange = (size: number) => {
  pageSize.value = size;
  pageNum.value = 1;
};

const handleCurrentChange = (currentPage: number) => {
  pageNum.value = currentPage;
};

const stats = computed(() => [
  {
    label: "板块总数",
    value: boards.value.length,
    help: "课程论坛板块数量"
  },
  {
    label: "启用板块",
    value: boards.value.filter(board => board.status === "active").length,
    help: "当前可访问的课程论坛"
  },
  {
    label: "帖子总数",
    value: mockPosts.length,
    help: "所有板块内帖子数量"
  },
  {
    label: "平均热度",
    value: getAverageHotScore(),
    help: "基于 mock 帖子热度"
  }
]);

const dialogTitle = computed(() => {
  return dialogMode.value === "create" ? "新增课程论坛板块" : "编辑课程论坛板块";
});

const getCurrentTimeText = () => {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");

  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
};

const getAverageHotScore = () => {
  if (mockPosts.length === 0) return "0.0";

  const total = mockPosts.reduce((sum, post) => sum + post.hotScore, 0);

  return (total / mockPosts.length).toFixed(1);
};

const handleFilter = () => {
  activeQuery.keyword = queryForm.keyword;
  activeQuery.courseId = queryForm.courseId;
  activeQuery.status = queryForm.status;
};

const resetQuery = () => {
  Object.assign(queryForm, createEmptyQuery());
  Object.assign(activeQuery, createEmptyQuery());
};

const resetBoardForm = () => {
  Object.assign(boardForm, createEmptyBoardForm());
};

const fillBoardForm = (board: ForumBoardView) => {
  boardForm.id = board.id;
  boardForm.courseId = board.courseId;
  boardForm.courseName = board.courseName;
  boardForm.title = board.title;
  boardForm.description = board.description;
  boardForm.status = board.status;
  boardForm.popupEnabled = board.popupEnabled;
};

const openCreateDialog = () => {
  resetBoardForm();
  dialogMode.value = "create";
  dialogVisible.value = true;
};

const openEditDialog = (board: ForumBoardView) => {
  fillBoardForm(board);
  dialogMode.value = "edit";
  dialogVisible.value = true;
};

const openDetailDrawer = (board: ForumBoardView) => {
  currentBoard.value = board;
  drawerVisible.value = true;
};

const handleSubmit = () => {
  const courseId = boardForm.courseId.trim();
  const courseName = boardForm.courseName.trim();
  const title = boardForm.title.trim();
  const description = boardForm.description.trim();

  if (!courseId) {
    ElMessage.warning("请输入课程编号");
    return;
  }

  if (!courseName) {
    ElMessage.warning("请输入课程名称");
    return;
  }

  if (!title) {
    ElMessage.warning("请输入板块名称");
    return;
  }

  if (!description) {
    ElMessage.warning("请输入板块描述");
    return;
  }

  if (dialogMode.value === "create") {
    const now = getCurrentTimeText();

    boards.value.unshift({
      id: Date.now(),
      courseId,
      courseName,
      title,
      description,
      status: boardForm.status,
      popupEnabled: boardForm.popupEnabled,
      createdAt: now,
      updatedAt: now
    });

    ElMessage.success("课程论坛板块已添加到 mock 列表");
  }

  if (dialogMode.value === "edit" && boardForm.id) {
    const target = boards.value.find(board => board.id === boardForm.id);

    if (target) {
      target.courseId = courseId;
      target.courseName = courseName;
      target.title = title;
      target.description = description;
      target.status = boardForm.status;
      target.popupEnabled = boardForm.popupEnabled;
      target.updatedAt = getCurrentTimeText();

      if (currentBoard.value?.id === target.id) {
        currentBoard.value = target;
      }
    }

    ElMessage.success("课程论坛板块 mock 数据已更新");
  }

  dialogVisible.value = false;
};

const toggleBoardStatus = (board: ForumBoardView) => {
  board.status = board.status === "active" ? "inactive" : "active";
  board.updatedAt = getCurrentTimeText();

  ElMessage.success(`${board.title} 已${board.status === "active" ? "启用" : "停用"}`);
};

const getBoardPosts = (boardId: number) => {
  return mockPosts.filter(post => post.boardId === boardId && post.status !== "deleted");
};

const getBoardNotices = (boardId: number) => {
  return mockNotices.filter(notice => notice.boardId === boardId && notice.status !== "deleted");
};

const getBoardNoticeCount = (boardId: number) => {
  return getBoardNotices(boardId).length;
};

const getBoardReplyCount = (boardId: number) => {
  const postIds = getBoardPosts(boardId).map(post => post.id);

  return mockReplies
    .filter(reply => postIds.includes(reply.postId))
    .reduce((sum, reply) => sum + 1 + (reply.children?.length ?? 0), 0);
};

const getBoardAttachmentCount = (boardId: number) => {
  const postIds = getBoardPosts(boardId).map(post => post.id);
  const replyIds = mockReplies
    .filter(reply => postIds.includes(reply.postId))
    .flatMap(reply => [reply.id, ...(reply.children?.map(child => child.id) ?? [])]);

  return mockAttachments.filter(
    attachment =>
      (attachment.ownerType === "post" && postIds.includes(attachment.ownerId)) ||
      (attachment.ownerType === "reply" && replyIds.includes(attachment.ownerId))
  ).length;
};

const getBoardTopPosts = (boardId: number) => {
  return [...getBoardPosts(boardId)].sort((a, b) => b.hotScore - a.hotScore).slice(0, 3);
};

const getBoardTopPost = (boardId: number) => {
  return getBoardTopPosts(boardId)[0];
};

const getBoardUserActivities = (boardId: number): UserActivityView[] => {
  const boardPosts = getBoardPosts(boardId);
  const postIds = boardPosts.map(post => post.id);
  const activityMap = new Map<string, UserActivityView>();

  const ensureActivity = (authorName: string) => {
    if (!activityMap.has(authorName)) {
      activityMap.set(authorName, {
        authorName,
        postCount: 0,
        replyCount: 0,
        activityScore: 0
      });
    }

    return activityMap.get(authorName)!;
  };

  boardPosts.forEach(post => {
    const activity = ensureActivity(post.authorName);

    activity.postCount += 1;
  });

  mockReplies
    .filter(reply => postIds.includes(reply.postId))
    .forEach(reply => {
      const activity = ensureActivity(reply.authorName);

      activity.replyCount += 1;

      reply.children?.forEach(child => {
        const childActivity = ensureActivity(child.authorName);

        childActivity.replyCount += 1;
      });
    });

  return Array.from(activityMap.values())
    .map(activity => ({
      ...activity,
      activityScore: activity.postCount * 10 + activity.replyCount * 4
    }))
    .sort((a, b) => b.activityScore - a.activityScore)
    .slice(0, 5);
};
</script>

<style scoped lang="scss">
.forum-course-boards-page,
.filter-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.filter-form {
  flex-flow: row wrap;
}
.board-title-cell {
  display: flex;
  gap: 8px;
  align-items: center;
}
.board-title {
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.board-description {
  margin-top: 6px;
  line-height: 1.6;
  color: var(--el-text-color-regular);
}
.board-meta {
  margin-top: 6px;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}
.metric-line {
  line-height: 22px;
  color: var(--el-text-color-secondary);
}
.hot-title {
  overflow: hidden;
  font-weight: 600;
  color: var(--el-text-color-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}
.empty-text {
  color: var(--el-text-color-placeholder);
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
.detail-card {
  margin-top: 16px;
  border-radius: 10px;
}
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.notice-list,
.hot-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.notice-item,
.hot-item {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
}
.notice-title {
  display: flex;
  gap: 6px;
  align-items: center;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.notice-meta {
  margin-top: 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.hot-rank {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  font-weight: 700;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  border-radius: 50%;
}
.hot-main {
  flex: 1;
  min-width: 0;
}
</style>
