<template>
  <div class="forum-notices-page">
    <ForumPageShell
      title="公告"
      description="维护课程论坛公告，支持置顶、弹窗提醒、状态筛选和本地 mock 演示。"
      :tags="['置顶公告', '弹窗提醒', '教师发布']"
      :stats="stats"
      content-title="公告列表"
      content-description="展示课程公告的标题、所属课程、发布人、状态和展示设置。"
      :data-count="filteredNotices.length"
      empty-description="当前筛选条件下暂无公告。"
    >
      <template #actions>
        <el-button type="primary" @click="openCreateDialog">发布公告</el-button>
      </template>

      <template #filters>
        <el-form :model="queryForm" class="filter-form" inline>
          <el-form-item label="关键词">
            <el-input v-model="queryForm.keyword" clearable placeholder="搜索标题、正文或课程" style="width: 260px" />
          </el-form-item>

          <el-form-item label="状态">
            <el-select v-model="queryForm.status" clearable placeholder="全部状态" style="width: 180px">
              <el-option label="已发布" value="published" />
              <el-option label="已隐藏" value="hidden" />
              <el-option label="已删除" value="deleted" />
            </el-select>
          </el-form-item>

          <el-form-item label="课程">
            <el-select v-model="queryForm.courseId" clearable placeholder="全部课程" style="width: 180px">
              <el-option v-for="board in mockBoards" :key="board.id" :label="board.courseName" :value="board.courseId" />
            </el-select>
          </el-form-item>

          <el-form-item>
            <el-button @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>
      </template>

      <el-table :data="filteredNotices" border>
        <el-table-column label="公告标题" min-width="220">
          <template #default="{ row }">
            <div class="notice-title-cell">
              <span class="notice-title">{{ row.title }}</span>
              <el-tag v-if="row.pinned" size="small" type="danger">置顶</el-tag>
              <el-tag v-if="row.popup" size="small" type="warning">弹窗</el-tag>
            </div>
            <div class="notice-content-preview">{{ row.content }}</div>
          </template>
        </el-table-column>

        <el-table-column prop="courseName" label="所属课程" min-width="130" />
        <el-table-column prop="boardName" label="课程板块" min-width="170" />
        <el-table-column prop="authorName" label="发布人" min-width="100" />

        <el-table-column label="状态" min-width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="statusTagMap[row.status]">
              {{ statusTextMap[row.status] }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="置顶" min-width="90" align="center">
          <template #default="{ row }">
            <el-switch v-model="row.pinned" @change="handleTogglePinned(row)" />
          </template>
        </el-table-column>

        <el-table-column label="弹窗" min-width="90" align="center">
          <template #default="{ row }">
            <el-switch v-model="row.popup" @change="handleTogglePopup(row)" />
          </template>
        </el-table-column>

        <el-table-column prop="createdAt" label="发布时间" min-width="160" />

        <el-table-column label="操作" width="180">
          <template #default="{ row }">
            <el-space>
              <el-button link type="primary" @click="openViewDialog(row)">查看</el-button>
              <el-button link @click="openEditDialog(row)">编辑</el-button>
              <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
            </el-space>
          </template>
        </el-table-column>
      </el-table>
    </ForumPageShell>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="680px">
      <el-form :model="noticeForm" label-width="90px" :disabled="dialogMode === 'view'">
        <el-form-item label="所属课程">
          <el-select v-model="noticeForm.boardId" class="full-width" placeholder="请选择课程论坛">
            <el-option
              v-for="board in mockBoards"
              :key="board.id"
              :label="`${board.courseName} - ${board.title}`"
              :value="board.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="公告标题">
          <el-input v-model="noticeForm.title" maxlength="60" placeholder="请输入公告标题" show-word-limit />
        </el-form-item>

        <el-form-item label="公告正文">
          <el-input
            v-model="noticeForm.content"
            :rows="6"
            maxlength="500"
            placeholder="请输入公告内容"
            show-word-limit
            type="textarea"
          />
        </el-form-item>

        <el-form-item label="公告状态">
          <el-radio-group v-model="noticeForm.status">
            <el-radio-button label="published">已发布</el-radio-button>
            <el-radio-button label="hidden">已隐藏</el-radio-button>
            <el-radio-button label="deleted">已删除</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="展示设置">
          <el-checkbox v-model="noticeForm.pinned">置顶公告</el-checkbox>
          <el-checkbox v-model="noticeForm.popup">进入板块时弹窗提醒</el-checkbox>
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
import { mockBoards, mockNotices, type ForumNoticeMock, type NoticeStatus } from "../mock";

type DialogMode = "create" | "edit" | "view";

interface NoticeForm {
  id?: number;
  boardId: number | null;
  title: string;
  content: string;
  pinned: boolean;
  popup: boolean;
  status: NoticeStatus;
}

const statusTextMap: Record<NoticeStatus, string> = {
  published: "已发布",
  hidden: "已隐藏",
  deleted: "已删除"
};

const statusTagMap: Record<NoticeStatus, "success" | "warning" | "info"> = {
  published: "success",
  hidden: "warning",
  deleted: "info"
};

const notices = ref<ForumNoticeMock[]>(mockNotices.map(item => ({ ...item })));

const queryForm = reactive({
  keyword: "",
  status: "" as NoticeStatus | "",
  courseId: ""
});

const dialogVisible = ref(false);
const dialogMode = ref<DialogMode>("create");

const noticeForm = reactive<NoticeForm>({
  id: undefined,
  boardId: null,
  title: "",
  content: "",
  pinned: false,
  popup: false,
  status: "published"
});

const filteredNotices = computed(() => {
  const keyword = queryForm.keyword.trim().toLowerCase();

  return notices.value.filter(notice => {
    const matchKeyword =
      !keyword ||
      notice.title.toLowerCase().includes(keyword) ||
      notice.content.toLowerCase().includes(keyword) ||
      notice.courseName.toLowerCase().includes(keyword) ||
      notice.boardName.toLowerCase().includes(keyword);

    const matchStatus = !queryForm.status || notice.status === queryForm.status;
    const matchCourse = !queryForm.courseId || notice.courseId === queryForm.courseId;

    return matchKeyword && matchStatus && matchCourse;
  });
});

const stats = computed(() => [
  {
    label: "公告总数",
    value: notices.value.length,
    help: "当前课程论坛公告数量"
  },
  {
    label: "置顶公告",
    value: notices.value.filter(item => item.pinned).length,
    help: "优先展示在板块顶部"
  },
  {
    label: "弹窗提醒",
    value: notices.value.filter(item => item.popup).length,
    help: "进入板块时提醒学生"
  },
  {
    label: "已发布",
    value: notices.value.filter(item => item.status === "published").length,
    help: "当前对用户可见公告"
  }
]);

const dialogTitle = computed(() => {
  if (dialogMode.value === "create") return "发布公告";
  if (dialogMode.value === "edit") return "编辑公告";
  return "查看公告";
});

const resetNoticeForm = () => {
  noticeForm.id = undefined;
  noticeForm.boardId = mockBoards[0]?.id ?? null;
  noticeForm.title = "";
  noticeForm.content = "";
  noticeForm.pinned = false;
  noticeForm.popup = false;
  noticeForm.status = "published";
};

const fillNoticeForm = (notice: ForumNoticeMock) => {
  noticeForm.id = notice.id;
  noticeForm.boardId = notice.boardId;
  noticeForm.title = notice.title;
  noticeForm.content = notice.content;
  noticeForm.pinned = notice.pinned;
  noticeForm.popup = notice.popup;
  noticeForm.status = notice.status;
};

const getBoardInfo = (boardId: number | null) => {
  return mockBoards.find(board => board.id === boardId);
};

const getCurrentTimeText = () => {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");

  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
};

const resetQuery = () => {
  queryForm.keyword = "";
  queryForm.status = "";
  queryForm.courseId = "";
};

const openCreateDialog = () => {
  resetNoticeForm();
  dialogMode.value = "create";
  dialogVisible.value = true;
};

const openEditDialog = (notice: ForumNoticeMock) => {
  fillNoticeForm(notice);
  dialogMode.value = "edit";
  dialogVisible.value = true;
};

const openViewDialog = (notice: ForumNoticeMock) => {
  fillNoticeForm(notice);
  dialogMode.value = "view";
  dialogVisible.value = true;
};

const handleSubmit = () => {
  const title = noticeForm.title.trim();
  const content = noticeForm.content.trim();
  const board = getBoardInfo(noticeForm.boardId);

  if (!board) {
    ElMessage.warning("请选择所属课程论坛");
    return;
  }

  if (!title) {
    ElMessage.warning("请输入公告标题");
    return;
  }

  if (!content) {
    ElMessage.warning("请输入公告正文");
    return;
  }

  if (dialogMode.value === "create") {
    const now = getCurrentTimeText();

    notices.value.unshift({
      id: Date.now(),
      boardId: board.id,
      boardName: board.title,
      courseId: board.courseId,
      courseName: board.courseName,
      title,
      content,
      authorName: "当前教师",
      pinned: noticeForm.pinned,
      popup: noticeForm.popup,
      status: noticeForm.status,
      createdAt: now,
      updatedAt: now
    });

    ElMessage.success("公告已添加到 mock 列表");
  }

  if (dialogMode.value === "edit" && noticeForm.id) {
    const target = notices.value.find(item => item.id === noticeForm.id);

    if (target) {
      target.boardId = board.id;
      target.boardName = board.title;
      target.courseId = board.courseId;
      target.courseName = board.courseName;
      target.title = title;
      target.content = content;
      target.pinned = noticeForm.pinned;
      target.popup = noticeForm.popup;
      target.status = noticeForm.status;
      target.updatedAt = getCurrentTimeText();
    }

    ElMessage.success("公告 mock 数据已更新");
  }

  dialogVisible.value = false;
};

const handleDelete = async (notice: ForumNoticeMock) => {
  try {
    await ElMessageBox.confirm(`确认删除公告“${notice.title}”吗？当前只会从本地 mock 列表移除。`, "删除确认", {
      confirmButtonText: "删除",
      cancelButtonText: "取消",
      type: "warning"
    });

    notices.value = notices.value.filter(item => item.id !== notice.id);
    ElMessage.success("已从 mock 列表删除");
  } catch {
    // 用户取消删除，不需要提示
  }
};

const handleTogglePinned = (notice: ForumNoticeMock) => {
  ElMessage.success(`已${notice.pinned ? "开启" : "取消"}置顶：${notice.title}`);
};

const handleTogglePopup = (notice: ForumNoticeMock) => {
  ElMessage.success(`已${notice.popup ? "开启" : "关闭"}弹窗提醒：${notice.title}`);
};
</script>

<style scoped lang="scss">
.forum-notices-page,
.filter-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.filter-form {
  flex-flow: row wrap;
}
.notice-title-cell {
  display: flex;
  gap: 6px;
  align-items: center;
}
.notice-title {
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.notice-content-preview {
  width: 100%;
  margin-top: 6px;
  overflow: hidden;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  text-overflow: ellipsis;
  white-space: nowrap;
}
.full-width {
  width: 100%;
}
</style>
