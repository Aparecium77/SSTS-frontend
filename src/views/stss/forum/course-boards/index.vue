<template>
  <div class="forum-boards-page">
    <ForumPageShell
      title="课程论坛"
      description="展示课程论坛板块概览，汇总公告数、帖子数、回复数和热度数据。"
      :tags="['课程板块', '数据概览', '状态启停']"
      :stats="stats"
      content-title="板块清单"
      content-description="按课程维度展示论坛板块信息，后续可与选课系统和课程数据接口对接。"
      :data-count="filteredBoards.length"
      empty-description="当前筛选条件下暂无课程论坛板块。"
    >
      <template #actions>
        <el-button type="primary" @click="openCreateDialog">新增板块</el-button>
      </template>

      <template #filters>
        <el-form :model="queryForm" class="filter-form" inline>
          <el-form-item label="关键词">
            <el-input v-model="queryForm.keyword" clearable placeholder="搜索课程、板块或描述" style="width: 260px" />
          </el-form-item>

          <el-form-item label="状态">
            <el-select v-model="queryForm.status" clearable placeholder="全部状态" style="width: 160px">
              <el-option label="启用" value="active" />
              <el-option label="停用" value="inactive" />
            </el-select>
          </el-form-item>

          <el-form-item>
            <el-button @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>
      </template>

      <el-row :gutter="16">
        <el-col v-for="board in filteredBoards" :key="board.id" :span="12">
          <el-card class="board-card" shadow="hover">
            <div class="board-header">
              <div>
                <div class="board-title">{{ board.title }}</div>
                <div class="board-subtitle">{{ board.courseId }} · {{ board.courseName }}</div>
              </div>
              <el-tag :type="board.status === 'active' ? 'success' : 'info'">
                {{ board.status === "active" ? "启用" : "停用" }}
              </el-tag>
            </div>

            <p class="board-desc">{{ board.description }}</p>

            <el-row :gutter="12" class="board-metrics">
              <el-col :span="6">
                <div class="metric-box">
                  <div class="metric-value">{{ getBoardNoticeCount(board.id) }}</div>
                  <div class="metric-label">公告</div>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="metric-box">
                  <div class="metric-value">{{ getBoardPostCount(board.id) }}</div>
                  <div class="metric-label">帖子</div>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="metric-box">
                  <div class="metric-value">{{ getBoardReplyCount(board.id) }}</div>
                  <div class="metric-label">回复</div>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="metric-box">
                  <div class="metric-value">{{ getBoardAverageHotScore(board.id) }}</div>
                  <div class="metric-label">平均热度</div>
                </div>
              </el-col>
            </el-row>

            <div class="board-footer">
              <el-button link type="primary" @click="openViewDialog(board)">查看</el-button>
              <el-button link @click="openEditDialog(board)">编辑</el-button>
              <el-button link :type="board.status === 'active' ? 'warning' : 'success'" @click="toggleBoardStatus(board)">
                {{ board.status === "active" ? "停用" : "启用" }}
              </el-button>
              <el-button link type="danger" @click="handleDelete(board)">删除</el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </ForumPageShell>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="640px">
      <el-form :model="boardForm" label-width="90px" :disabled="dialogMode === 'view'">
        <el-form-item label="课程编号">
          <el-input v-model="boardForm.courseId" placeholder="请输入课程编号，如 SE-2026" />
        </el-form-item>

        <el-form-item label="课程名称">
          <el-input v-model="boardForm.courseName" placeholder="请输入课程名称" />
        </el-form-item>

        <el-form-item label="板块标题">
          <el-input v-model="boardForm.title" maxlength="60" placeholder="请输入课程论坛板块标题" show-word-limit />
        </el-form-item>

        <el-form-item label="板块描述">
          <el-input
            v-model="boardForm.description"
            :rows="4"
            maxlength="300"
            placeholder="请输入板块描述"
            show-word-limit
            type="textarea"
          />
        </el-form-item>

        <el-form-item label="状态">
          <el-radio-group v-model="boardForm.status">
            <el-radio-button label="active">启用</el-radio-button>
            <el-radio-button label="inactive">停用</el-radio-button>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">
          {{ dialogMode === "view" ? "关闭" : "取消" }}
        </el-button>
        <el-button v-if="dialogMode !== 'view'" type="primary" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import ForumPageShell from "../components/ForumPageShell.vue";
import { mockBoards, mockNotices, mockPosts, type ForumBoardMock } from "../mock";

type DialogMode = "create" | "edit" | "view";

interface BoardForm {
  id?: number;
  courseId: string;
  courseName: string;
  title: string;
  description: string;
  status: "active" | "inactive";
}

const boards = ref<ForumBoardMock[]>(mockBoards.map(item => ({ ...item })));

const queryForm = reactive({
  keyword: "",
  status: "" as "active" | "inactive" | ""
});

const dialogVisible = ref(false);
const dialogMode = ref<DialogMode>("create");

const boardForm = reactive<BoardForm>({
  id: undefined,
  courseId: "",
  courseName: "",
  title: "",
  description: "",
  status: "active"
});

const filteredBoards = computed(() => {
  const keyword = queryForm.keyword.trim().toLowerCase();

  return boards.value.filter(board => {
    const matchKeyword =
      !keyword ||
      board.courseId.toLowerCase().includes(keyword) ||
      board.courseName.toLowerCase().includes(keyword) ||
      board.title.toLowerCase().includes(keyword) ||
      board.description.toLowerCase().includes(keyword);

    const matchStatus = !queryForm.status || board.status === queryForm.status;

    return matchKeyword && matchStatus;
  });
});

const stats = computed(() => [
  {
    label: "板块总数",
    value: boards.value.length,
    help: "课程论坛板块数量"
  },
  {
    label: "启用中",
    value: boards.value.filter(item => item.status === "active").length,
    help: "当前可访问的课程论坛"
  },
  {
    label: "公告总数",
    value: mockNotices.filter(item => item.status !== "deleted").length,
    help: "板块内公告数据"
  },
  {
    label: "帖子总数",
    value: mockPosts.filter(item => item.status !== "deleted").length,
    help: "板块内讨论帖子"
  }
]);

const dialogTitle = computed(() => {
  if (dialogMode.value === "create") return "新增课程论坛板块";
  if (dialogMode.value === "edit") return "编辑课程论坛板块";
  return "查看课程论坛板块";
});

const resetQuery = () => {
  queryForm.keyword = "";
  queryForm.status = "";
};

const resetBoardForm = () => {
  boardForm.id = undefined;
  boardForm.courseId = "";
  boardForm.courseName = "";
  boardForm.title = "";
  boardForm.description = "";
  boardForm.status = "active";
};

const fillBoardForm = (board: ForumBoardMock) => {
  boardForm.id = board.id;
  boardForm.courseId = board.courseId;
  boardForm.courseName = board.courseName;
  boardForm.title = board.title;
  boardForm.description = board.description;
  boardForm.status = board.status;
};

const openCreateDialog = () => {
  resetBoardForm();
  dialogMode.value = "create";
  dialogVisible.value = true;
};

const openEditDialog = (board: ForumBoardMock) => {
  fillBoardForm(board);
  dialogMode.value = "edit";
  dialogVisible.value = true;
};

const openViewDialog = (board: ForumBoardMock) => {
  fillBoardForm(board);
  dialogMode.value = "view";
  dialogVisible.value = true;
};

const getBoardNoticeCount = (boardId: number) => {
  return mockNotices.filter(notice => notice.boardId === boardId && notice.status !== "deleted").length;
};

const getBoardPostCount = (boardId: number) => {
  return mockPosts.filter(post => post.boardId === boardId && post.status !== "deleted").length;
};

const getBoardReplyCount = (boardId: number) => {
  return mockPosts
    .filter(post => post.boardId === boardId && post.status !== "deleted")
    .reduce((sum, post) => sum + post.repliesCount, 0);
};

const getBoardAverageHotScore = (boardId: number) => {
  const boardPosts = mockPosts.filter(post => post.boardId === boardId && post.status !== "deleted");

  if (boardPosts.length === 0) return "0.0";

  const totalScore = boardPosts.reduce((sum, post) => sum + post.hotScore, 0);
  return (totalScore / boardPosts.length).toFixed(1);
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
    ElMessage.warning("请输入板块标题");
    return;
  }

  if (!description) {
    ElMessage.warning("请输入板块描述");
    return;
  }

  if (dialogMode.value === "create") {
    boards.value.unshift({
      id: Date.now(),
      courseId,
      courseName,
      title,
      description,
      status: boardForm.status
    });

    ElMessage.success("课程论坛板块已添加到 mock 列表");
  }

  if (dialogMode.value === "edit" && boardForm.id) {
    const target = boards.value.find(item => item.id === boardForm.id);

    if (target) {
      target.courseId = courseId;
      target.courseName = courseName;
      target.title = title;
      target.description = description;
      target.status = boardForm.status;
    }

    ElMessage.success("课程论坛板块 mock 数据已更新");
  }

  dialogVisible.value = false;
};

const toggleBoardStatus = (board: ForumBoardMock) => {
  board.status = board.status === "active" ? "inactive" : "active";
  ElMessage.success(`${board.status === "active" ? "已启用" : "已停用"}：${board.title}`);
};

const handleDelete = async (board: ForumBoardMock) => {
  try {
    await ElMessageBox.confirm(`确认删除课程论坛板块“${board.title}”吗？当前只会从本地 mock 列表移除。`, "删除确认", {
      confirmButtonText: "删除",
      cancelButtonText: "取消",
      type: "warning"
    });

    boards.value = boards.value.filter(item => item.id !== board.id);
    ElMessage.success("已从 mock 列表删除");
  } catch {
    // 用户取消删除，不需要提示
  }
};
</script>

<style scoped lang="scss">
.forum-boards-page,
.filter-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.filter-form {
  flex-flow: row wrap;
}
.board-card {
  margin-bottom: 16px;
  border-radius: 12px;
}
.board-header {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  justify-content: space-between;
}
.board-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.board-subtitle {
  margin-top: 6px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.board-desc {
  min-height: 44px;
  margin: 14px 0;
  line-height: 1.7;
  color: var(--el-text-color-regular);
}
.board-metrics {
  margin: 10px 0 14px;
}
.metric-box {
  padding: 12px 8px;
  text-align: center;
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
}
.metric-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--el-color-primary);
}
.metric-label {
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.board-footer {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
</style>
