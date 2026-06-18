<template>
  <div class="forum-notices-page">
    <ForumPageShell
      title="公告"
      description="维护课程论坛公告，支持公告发布、编辑、删除、置顶展示和进入板块弹窗提醒。"
      :tags="['课程公告', '教师发布', '置顶展示', '弹窗提醒']"
      :stats="stats"
      content-title="公告列表"
      content-description="设置筛选条件后点击筛选。真实接入后对应公告列表、发布、更新、删除和弹窗切换接口。"
      :data-count="filteredNotices.length"
      empty-description="当前筛选条件下暂无公告。"
    >
      <template #actions>
        <el-button type="primary" @click="openCreateDialog">发布公告</el-button>
      </template>

      <template #filters>
        <el-form :model="queryForm" class="filter-form" inline>
          <el-form-item label="关键词">
            <el-input v-model="queryForm.keyword" clearable placeholder="搜索标题、正文或发布人" style="width: 260px" />
          </el-form-item>

          <el-form-item label="课程">
            <el-select v-model="queryForm.courseId" clearable placeholder="全部课程" style="width: 180px">
              <el-option v-for="board in mockBoards" :key="board.id" :label="board.courseName" :value="board.courseId" />
            </el-select>
          </el-form-item>

          <el-form-item label="状态">
            <el-select v-model="queryForm.status" clearable placeholder="全部状态" style="width: 160px">
              <el-option label="已发布" value="published" />
              <el-option label="已隐藏" value="hidden" />
              <el-option label="已删除" value="deleted" />
            </el-select>
          </el-form-item>

          <el-form-item label="展示">
            <el-select v-model="queryForm.displayType" clearable placeholder="全部展示" style="width: 160px">
              <el-option label="置顶公告" value="pinned" />
              <el-option label="弹窗公告" value="popup" />
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
          title="当前为本地 mock 数据。真实接入后，发布与修改权限由后端根据任课教师或管理员身份校验。"
          type="info"
        />
      </template>

      <el-table :data="filteredNotices" border>
        <el-table-column label="公告内容" min-width="330">
          <template #default="{ row }">
            <div class="notice-title-cell">
              <span class="notice-title">{{ row.title }}</span>
              <el-tag v-if="row.pinned" size="small" type="danger">置顶</el-tag>
              <el-tag v-if="row.popup" size="small" type="warning">弹窗</el-tag>
            </div>
            <div class="notice-content-preview">{{ row.content }}</div>
            <div class="notice-meta">{{ row.authorName }} · {{ row.createdAt }} · 更新于 {{ row.updatedAt }}</div>
          </template>
        </el-table-column>

        <el-table-column prop="courseName" label="所属课程" min-width="140" />

        <el-table-column label="状态" min-width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="noticeStatusTagMap[row.status]">
              {{ noticeStatusTextMap[row.status] }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="展示方式" min-width="170">
          <template #default="{ row }">
            <div class="display-switches">
              <el-switch
                v-model="row.pinned"
                inline-prompt
                active-text="置顶"
                inactive-text="普通"
                @change="handleTogglePinned(row)"
              />
              <el-switch
                v-model="row.popup"
                inline-prompt
                active-text="弹窗"
                inactive-text="关闭"
                @change="handleTogglePopup(row)"
              />
            </div>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="230">
          <template #default="{ row }">
            <el-space>
              <el-button link type="primary" @click="openDetailDrawer(row)">详情</el-button>
              <el-button link @click="openEditDialog(row)">编辑</el-button>
              <el-button link type="warning" @click="handleToggleStatus(row)">
                {{ row.status === "hidden" ? "发布" : "隐藏" }}
              </el-button>
              <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
            </el-space>
          </template>
        </el-table-column>
      </el-table>
    </ForumPageShell>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="720px">
      <el-form :model="noticeForm" label-width="90px">
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
          <el-input v-model="noticeForm.title" maxlength="80" placeholder="请输入公告标题" show-word-limit />
        </el-form-item>

        <el-form-item label="公告正文">
          <el-input
            v-model="noticeForm.content"
            :rows="7"
            maxlength="800"
            placeholder="请输入公告正文"
            show-word-limit
            type="textarea"
          />
        </el-form-item>

        <el-form-item label="公告状态">
          <el-radio-group v-model="noticeForm.status">
            <el-radio value="published">发布</el-radio>
            <el-radio value="hidden">隐藏</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="展示设置">
          <el-space wrap>
            <el-checkbox v-model="noticeForm.pinned">置顶到板块顶部</el-checkbox>
            <el-checkbox v-model="noticeForm.popup">进入板块时弹窗提醒</el-checkbox>
          </el-space>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="drawerVisible" size="560px" title="公告详情">
      <template v-if="currentNotice">
        <div class="drawer-title">
          {{ currentNotice.title }}
        </div>

        <div class="drawer-meta">
          {{ currentNotice.courseName }} · {{ currentNotice.authorName }} · {{ currentNotice.createdAt }}
        </div>

        <div class="drawer-tags">
          <el-tag :type="noticeStatusTagMap[currentNotice.status]">
            {{ noticeStatusTextMap[currentNotice.status] }}
          </el-tag>
          <el-tag v-if="currentNotice.pinned" type="danger">置顶公告</el-tag>
          <el-tag v-if="currentNotice.popup" type="warning">弹窗提醒</el-tag>
        </div>

        <el-divider />

        <p class="drawer-content">{{ currentNotice.content }}</p>

        <el-card class="preview-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span>学生侧展示预览</span>
              <el-tag size="small" effect="plain">mock</el-tag>
            </div>
          </template>

          <div class="student-preview">
            <div class="student-preview__title">
              <span>{{ currentNotice.title }}</span>
              <el-tag v-if="currentNotice.pinned" size="small" type="danger">置顶</el-tag>
            </div>
            <div class="student-preview__content">{{ currentNotice.content }}</div>
            <div class="student-preview__footer">{{ currentNotice.courseName }} · {{ currentNotice.authorName }}</div>
          </div>

          <el-alert
            v-if="currentNotice.popup"
            class="popup-preview"
            :closable="false"
            show-icon
            title="该公告已启用弹窗提醒，真实接入后可在进入课程论坛时弹出。"
            type="warning"
          />
        </el-card>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import ForumPageShell from "../components/ForumPageShell.vue";
import { mockBoards, mockNotices, type ForumNoticeMock, type NoticeStatus } from "../mock";

type DialogMode = "create" | "edit";
type DisplayType = "pinned" | "popup" | "";

interface NoticeQueryForm {
  keyword: string;
  courseId: string;
  status: NoticeStatus | "";
  displayType: DisplayType;
}

interface NoticeForm {
  id?: number;
  boardId: number | null;
  title: string;
  content: string;
  pinned: boolean;
  popup: boolean;
  status: Exclude<NoticeStatus, "deleted">;
}

const createEmptyQuery = (): NoticeQueryForm => ({
  keyword: "",
  courseId: "",
  status: "",
  displayType: ""
});

const createEmptyNoticeForm = (): NoticeForm => ({
  id: undefined,
  boardId: mockBoards[0]?.id ?? null,
  title: "",
  content: "",
  pinned: false,
  popup: false,
  status: "published"
});

const noticeStatusTextMap: Record<NoticeStatus, string> = {
  published: "已发布",
  hidden: "已隐藏",
  deleted: "已删除"
};

const noticeStatusTagMap: Record<NoticeStatus, "success" | "info" | "danger"> = {
  published: "success",
  hidden: "info",
  deleted: "danger"
};

const notices = ref<ForumNoticeMock[]>(mockNotices.map(item => ({ ...item })));
const queryForm = reactive<NoticeQueryForm>(createEmptyQuery());
const activeQuery = reactive<NoticeQueryForm>(createEmptyQuery());
const noticeForm = reactive<NoticeForm>(createEmptyNoticeForm());

const dialogVisible = ref(false);
const dialogMode = ref<DialogMode>("create");
const drawerVisible = ref(false);
const currentNotice = ref<ForumNoticeMock | null>(null);

const filteredNotices = computed(() => {
  const keyword = activeQuery.keyword.trim().toLowerCase();

  return notices.value.filter(notice => {
    const matchKeyword =
      !keyword ||
      notice.title.toLowerCase().includes(keyword) ||
      notice.content.toLowerCase().includes(keyword) ||
      notice.authorName.toLowerCase().includes(keyword);

    const matchCourse = !activeQuery.courseId || notice.courseId === activeQuery.courseId;
    const matchStatus = !activeQuery.status || notice.status === activeQuery.status;
    const matchDisplay =
      !activeQuery.displayType ||
      (activeQuery.displayType === "pinned" && notice.pinned) ||
      (activeQuery.displayType === "popup" && notice.popup);

    return matchKeyword && matchCourse && matchStatus && matchDisplay;
  });
});

const stats = computed(() => [
  {
    label: "公告总数",
    value: notices.value.length,
    help: "课程论坛公告数量"
  },
  {
    label: "已发布",
    value: notices.value.filter(item => item.status === "published").length,
    help: "学生可见公告"
  },
  {
    label: "置顶公告",
    value: notices.value.filter(item => item.pinned && item.status === "published").length,
    help: "优先展示在板块顶部"
  },
  {
    label: "弹窗公告",
    value: notices.value.filter(item => item.popup && item.status === "published").length,
    help: "进入板块时提醒"
  }
]);

const dialogTitle = computed(() => {
  return dialogMode.value === "create" ? "发布公告" : "编辑公告";
});

const getCurrentTimeText = () => {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");

  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
};

const getBoardInfo = (boardId: number | null) => {
  return mockBoards.find(board => board.id === boardId);
};

const handleFilter = () => {
  activeQuery.keyword = queryForm.keyword;
  activeQuery.courseId = queryForm.courseId;
  activeQuery.status = queryForm.status;
  activeQuery.displayType = queryForm.displayType;
};

const resetQuery = () => {
  Object.assign(queryForm, createEmptyQuery());
  Object.assign(activeQuery, createEmptyQuery());
};

const resetNoticeForm = () => {
  Object.assign(noticeForm, createEmptyNoticeForm());
};

const fillNoticeForm = (notice: ForumNoticeMock) => {
  noticeForm.id = notice.id;
  noticeForm.boardId = notice.boardId;
  noticeForm.title = notice.title;
  noticeForm.content = notice.content;
  noticeForm.pinned = notice.pinned;
  noticeForm.popup = notice.popup;
  noticeForm.status = notice.status === "deleted" ? "hidden" : notice.status;
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

const openDetailDrawer = (notice: ForumNoticeMock) => {
  currentNotice.value = notice;
  drawerVisible.value = true;
};

const handleSubmit = () => {
  const board = getBoardInfo(noticeForm.boardId);
  const title = noticeForm.title.trim();
  const content = noticeForm.content.trim();

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

      if (currentNotice.value?.id === target.id) {
        currentNotice.value = target;
      }
    }

    ElMessage.success("公告 mock 数据已更新");
  }

  dialogVisible.value = false;
};

const handleTogglePinned = (notice: ForumNoticeMock) => {
  notice.updatedAt = getCurrentTimeText();

  ElMessage.success(`${notice.title} 已${notice.pinned ? "设为置顶" : "取消置顶"}`);
};

const handleTogglePopup = (notice: ForumNoticeMock) => {
  notice.updatedAt = getCurrentTimeText();

  ElMessage.success(`${notice.title} 已${notice.popup ? "启用弹窗" : "关闭弹窗"}`);
};

const handleToggleStatus = (notice: ForumNoticeMock) => {
  if (notice.status === "deleted") {
    ElMessage.warning("已删除公告不能直接恢复，请重新发布公告");
    return;
  }

  notice.status = notice.status === "hidden" ? "published" : "hidden";
  notice.updatedAt = getCurrentTimeText();

  ElMessage.success(`${notice.title} 已${notice.status === "published" ? "发布" : "隐藏"}`);
};

const handleDelete = async (notice: ForumNoticeMock) => {
  try {
    await ElMessageBox.confirm(`确认删除公告“${notice.title}”吗？当前只会标记为已删除。`, "删除确认", {
      confirmButtonText: "删除",
      cancelButtonText: "取消",
      type: "warning"
    });

    notice.status = "deleted";
    notice.pinned = false;
    notice.popup = false;
    notice.updatedAt = getCurrentTimeText();

    if (currentNotice.value?.id === notice.id) {
      currentNotice.value = notice;
    }

    ElMessage.success("公告已标记为删除");
  } catch {
    // 用户取消删除，不需要提示
  }
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
  gap: 8px;
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
  line-height: 1.6;
  color: var(--el-text-color-regular);
  text-overflow: ellipsis;
  white-space: nowrap;
}
.notice-meta {
  margin-top: 6px;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}
.display-switches {
  display: flex;
  flex-direction: column;
  gap: 8px;
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
.drawer-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}
.drawer-content {
  line-height: 1.9;
  color: var(--el-text-color-regular);
  white-space: pre-wrap;
}
.preview-card {
  margin-top: 18px;
  border-radius: 10px;
}
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.student-preview {
  padding: 14px;
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-light);
  border-radius: 10px;
}
.student-preview__title {
  display: flex;
  gap: 8px;
  align-items: center;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.student-preview__content {
  margin-top: 10px;
  line-height: 1.8;
  color: var(--el-text-color-regular);
}
.student-preview__footer {
  margin-top: 10px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.popup-preview {
  margin-top: 14px;
}
</style>
