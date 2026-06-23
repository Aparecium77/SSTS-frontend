<template>
  <div class="forum-notices-page">
    <ForumPageShell
      v-if="canView"
      title="公告"
      description="查看课程论坛公告，教师和管理员可发布、编辑和删除公告，学生仅查看。"
      :tags="['课程公告', '教师发布', '管理员管理', '置顶展示', '弹窗提醒']"
      :stats="stats"
      content-title="公告列表"
      content-description="可按关键词、课程、状态和展示方式筛选公告。"
      :data-count="filteredNotices.length"
      empty-description="当前筛选条件下暂无公告。"
    >
      <template #actions>
        <el-button v-if="canManageNotice" type="primary" @click="openCreateDialog">发布公告</el-button>
      </template>

      <template #filters>
        <div class="notice-toolbar">
          <el-alert :closable="false" show-icon title="公告发布、编辑和删除由教师或管理员操作；学生只查看公告。" type="info" />

          <el-form :model="queryForm" class="filter-form" inline>
            <el-form-item label="关键词">
              <el-input
                v-model="queryForm.keyword"
                clearable
                placeholder="搜索标题、正文或发布人"
                style="width: 260px"
                @keyup.enter="handleFilter"
              />
            </el-form-item>

            <el-form-item label="课程">
              <el-select v-model="queryForm.courseId" clearable filterable placeholder="全部课程" style="width: 180px">
                <el-option v-for="board in boardOptions" :key="board.id" :label="board.courseName" :value="board.courseId" />
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
                <el-button type="primary" :loading="loading.notices" @click="handleFilter">筛选</el-button>
                <el-button @click="resetQuery">重置</el-button>
                <el-button :loading="loading.boards || loading.notices" @click="reloadPageData">刷新</el-button>
              </el-space>
            </el-form-item>
          </el-form>

          <el-alert v-if="apiMessage" :closable="false" show-icon :title="apiMessage" :type="apiMessageType" />
        </div>
      </template>

      <el-table v-loading="loading.notices" :data="filteredNotices" border>
        <el-table-column label="公告内容" min-width="340">
          <template #default="{ row }">
            <div class="notice-title-cell">
              <span class="notice-title">{{ row.title }}</span>
              <el-tag v-if="row.pinned" size="small" type="danger">置顶</el-tag>
              <el-tag v-if="row.popup" size="small" type="warning">弹窗</el-tag>
            </div>

            <div class="notice-content-preview">{{ row.content }}</div>

            <div class="notice-meta">
              发布人 {{ row.authorName || getUserText(row.authorId) }} · {{ formatTime(row.createdAt) }} · 更新于
              {{ formatTime(row.updatedAt || row.createdAt) }}
            </div>
          </template>
        </el-table-column>

        <el-table-column label="所属课程" min-width="160">
          <template #default="{ row }">
            <div>{{ row.courseName || row.courseId || "未知课程" }}</div>
            <div class="course-subtitle">{{ row.boardName || `板块 #${row.boardId}` }}</div>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="noticeStatusTagMap[row.status]">
              {{ noticeStatusTextMap[row.status] }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="展示设置" width="150" align="center">
          <template #default="{ row }">
            <el-space wrap>
              <el-tag v-if="row.pinned" type="danger" effect="plain">置顶</el-tag>
              <el-tag v-if="row.popup" type="warning" effect="plain">弹窗</el-tag>
              <span v-if="!row.pinned && !row.popup" class="empty-display">普通</span>
            </el-space>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-space>
              <el-button link type="primary" @click="openDetailDrawer(row)">详情</el-button>
              <el-button v-if="canManageNotice" link type="primary" @click="openEditDialog(row)">编辑</el-button>
              <el-button v-if="canManageNotice" link type="warning" @click="togglePopup(row)">
                {{ row.popup ? "取消弹窗" : "设为弹窗" }}
              </el-button>
              <el-button v-if="canManageNotice" link type="danger" @click="deleteNotice(row)">删除</el-button>
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
      title="公告"
      description="当前账号无公告查看权限。"
      :tags="['权限控制']"
      :stats="permissionStats"
      content-title="无权限访问"
      content-description="当前账号不能查看论坛公告。"
      :data-count="0"
      empty-description="无公告权限。"
    >
      <el-result icon="warning" title="无权限访问" sub-title="当前账号没有公告查看权限。" />
    </ForumPageShell>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="720px">
      <el-form ref="noticeFormRef" :model="noticeForm" :rules="noticeRules" label-width="90px">
        <el-form-item label="所属课程" prop="board_id">
          <el-select v-model="noticeForm.board_id" placeholder="请选择课程论坛" style="width: 100%">
            <el-option
              v-for="board in boardOptions"
              :key="board.id"
              :label="`${board.courseName} / ${board.title}`"
              :value="board.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="标题" prop="title">
          <el-input v-model="noticeForm.title" maxlength="80" show-word-limit placeholder="请输入公告标题" />
        </el-form-item>

        <el-form-item label="正文" prop="content">
          <el-input
            v-model="noticeForm.content"
            type="textarea"
            :rows="6"
            maxlength="1000"
            show-word-limit
            placeholder="请输入公告内容"
          />
        </el-form-item>

        <el-form-item label="展示方式">
          <el-space wrap>
            <el-checkbox v-model="noticeForm.pinned">置顶展示</el-checkbox>
            <el-checkbox v-model="noticeForm.popup">进入板块时弹窗提醒</el-checkbox>
          </el-space>
        </el-form-item>

        <el-form-item v-if="editingNotice" label="状态">
          <el-select v-model="noticeForm.status" style="width: 180px">
            <el-option label="已发布" value="published" />
            <el-option label="已隐藏" value="hidden" />
            <el-option label="已删除" value="deleted" />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitNotice">保存</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="drawerVisible" size="560px" title="公告详情">
      <template v-if="currentNotice">
        <div class="drawer-title">{{ currentNotice.title }}</div>
        <div class="drawer-meta">
          {{ currentNotice.courseName || currentNotice.courseId || "未知课程" }} ·
          {{ currentNotice.authorName || getUserText(currentNotice.authorId) }} ·
          {{ formatTime(currentNotice.createdAt) }}
        </div>

        <div class="drawer-tags">
          <el-tag :type="noticeStatusTagMap[currentNotice.status]">
            {{ noticeStatusTextMap[currentNotice.status] }}
          </el-tag>
          <el-tag v-if="currentNotice.pinned" type="danger" effect="plain">置顶</el-tag>
          <el-tag v-if="currentNotice.popup" type="warning" effect="plain">弹窗</el-tag>
        </div>

        <el-divider />

        <div class="drawer-content">{{ currentNotice.content }}</div>

        <el-card v-if="canManageNotice" class="action-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span>公告操作</span>
              <el-tag size="small" effect="plain">教师/管理员权限</el-tag>
            </div>
          </template>

          <el-space wrap>
            <el-button type="primary" @click="openEditDialog(currentNotice)">编辑公告</el-button>
            <el-button type="warning" @click="togglePopup(currentNotice)">
              {{ currentNotice.popup ? "取消弹窗" : "设为弹窗" }}
            </el-button>
            <el-button type="danger" @click="deleteNotice(currentNotice)">删除公告</el-button>
          </el-space>
        </el-card>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { ElMessage, ElMessageBox } from "element-plus";
import ForumPageShell from "../components/ForumPageShell.vue";
import { ForumAPI } from "@/api/modules/forum";
import type { Forum } from "@/api/interface/forum";
import { mockBoards, mockNotices } from "../mock";
import { useForumAuthButtons } from "../auth";

interface BoardView {
  id: number;
  courseId: string;
  courseName: string;
  title: string;
  boardName: string;
  description?: string;
}

interface NoticeView {
  id: number;
  boardId: number;
  boardName?: string;
  courseId: string;
  courseName?: string;
  title: string;
  content: string;
  pinned: boolean;
  popup: boolean;
  status: Forum.NoticeStatus;
  authorId?: number;
  authorName?: string;
  createdAt: string;
  updatedAt?: string | null;
}

interface NoticeQueryForm {
  keyword: string;
  courseId: string;
  status: Forum.NoticeStatus | "";
  displayType: "pinned" | "popup" | "";
}

type ApiMessageType = "success" | "warning" | "error" | "info";

const { BUTTONS } = useForumAuthButtons();
const currentForumUser = computed(() => ForumAPI.getCurrentForumUser());

const noticeStatusTextMap: Record<Forum.NoticeStatus, string> = {
  published: "已发布",
  hidden: "已隐藏",
  deleted: "已删除"
};

const noticeStatusTagMap: Record<Forum.NoticeStatus, "success" | "info" | "danger"> = {
  published: "success",
  hidden: "info",
  deleted: "danger"
};

const loading = reactive({
  boards: false,
  notices: false
});

const submitting = ref(false);
const useMockData = ref(false);
const apiMessage = ref("");
const apiMessageType = ref<ApiMessageType>("info");
const boards = ref<BoardView[]>([]);
const notices = ref<NoticeView[]>([]);
const drawerVisible = ref(false);
const dialogVisible = ref(false);
const currentNotice = ref<NoticeView | null>(null);
const editingNotice = ref<NoticeView | null>(null);
const noticeFormRef = ref<FormInstance>();

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
});

const queryForm = reactive<NoticeQueryForm>({
  keyword: "",
  courseId: "",
  status: "",
  displayType: ""
});

const noticeForm = reactive<Forum.NoticeCreateForm & Forum.NoticeUpdateForm>({
  board_id: 0,
  title: "",
  content: "",
  pinned: false,
  popup: false,
  status: "published"
});

const noticeRules: FormRules = {
  board_id: [{ required: true, message: "请选择课程论坛", trigger: "change" }],
  title: [{ required: true, message: "请输入公告标题", trigger: "blur" }],
  content: [{ required: true, message: "请输入公告内容", trigger: "blur" }]
};

const canView = computed(() => Boolean(BUTTONS.view));

const isNoticeManager = computed(() => {
  const role = String(currentForumUser.value.backend_role || "");
  return role === "teacher" || role === "admin";
});

const canManageNotice = computed(() => canView.value && isNoticeManager.value);

const boardOptions = computed(() => boards.value);

const filteredNotices = computed(() => {
  const keyword = queryForm.keyword.trim().toLowerCase();

  return notices.value.filter(notice => {
    const matchKeyword =
      !keyword ||
      notice.title.toLowerCase().includes(keyword) ||
      notice.content.toLowerCase().includes(keyword) ||
      notice.authorName?.toLowerCase().includes(keyword);

    const matchCourse = !queryForm.courseId || notice.courseId === queryForm.courseId;
    const matchStatus = !queryForm.status || notice.status === queryForm.status;
    const matchDisplay =
      !queryForm.displayType ||
      (queryForm.displayType === "pinned" && notice.pinned) ||
      (queryForm.displayType === "popup" && notice.popup);

    return matchKeyword && matchCourse && matchStatus && matchDisplay;
  });
});

const stats = computed(() => [
  {
    label: "公告总数",
    value: notices.value.length,
    help: "当前可见公告数量"
  },
  {
    label: "置顶公告",
    value: notices.value.filter(item => item.pinned).length,
    help: "优先展示的公告"
  },
  {
    label: "弹窗公告",
    value: notices.value.filter(item => item.popup).length,
    help: "进入板块时弹窗提醒"
  },
  {
    label: "当前权限",
    value: canManageNotice.value ? "可管理" : "仅查看",
    help: "教师和管理员可以发布、编辑和删除公告"
  }
]);

const permissionStats = computed(() => [
  {
    label: "公告权限",
    value: "无",
    help: "当前账号没有公告查看权限"
  }
]);

const dialogTitle = computed(() => (editingNotice.value ? "编辑公告" : "发布公告"));

const setApiMessage = (message: string, type: ApiMessageType = "info") => {
  apiMessage.value = message;
  apiMessageType.value = type;
};

const normalizeBoard = (board: Forum.BoardItem & Record<string, any>): BoardView => {
  return {
    id: board.id,
    courseId: board.course_id || board.courseId || "",
    courseName: board.course_name || board.courseName || board.title || "未知课程",
    title: board.title || board.name || board.course_name || "课程论坛",
    boardName: board.name || board.title || board.course_name || "课程论坛",
    description: board.description
  };
};

const normalizeMockBoard = (board: (typeof mockBoards)[number]): BoardView => ({
  id: board.id,
  courseId: board.courseId,
  courseName: board.courseName,
  title: board.title,
  boardName: board.title,
  description: board.description
});

const findBoard = (boardId?: number, courseId?: string) => {
  return boards.value.find(board => board.id === boardId || board.courseId === courseId);
};

const normalizeApiNotice = (notice: Forum.NoticeItem & Record<string, any>): NoticeView => {
  const board = findBoard(notice.board_id, notice.course_id);

  return {
    id: notice.id,
    boardId: notice.board_id,
    boardName: board?.boardName,
    courseId: notice.course_id || board?.courseId || "",
    courseName: board?.courseName,
    title: notice.title || "未命名公告",
    content: notice.content || "",
    pinned: Boolean(notice.pinned),
    popup: Boolean(notice.popup),
    status: notice.status || "published",
    authorId: notice.author_id,
    authorName: notice.author_name || notice.authorName,
    createdAt: notice.created_at || "",
    updatedAt: notice.updated_at
  };
};

const normalizeMockNotice = (notice: (typeof mockNotices)[number]): NoticeView => ({
  id: notice.id,
  boardId: notice.boardId,
  boardName: notice.boardName,
  courseId: notice.courseId,
  courseName: notice.courseName,
  title: notice.title,
  content: notice.content,
  pinned: notice.pinned,
  popup: notice.popup,
  status: notice.status,
  authorName: notice.authorName,
  createdAt: notice.createdAt,
  updatedAt: notice.updatedAt
});

const loadBoards = async () => {
  loading.boards = true;

  try {
    const res = await ForumAPI.getBoardList({
      page: 1,
      page_size: 100,
      status: "active"
    });

    let allBoards = (res.data?.items ?? []).map(item => normalizeBoard(item as Forum.BoardItem & Record<string, any>));

    if (allBoards.length === 0) {
      allBoards = mockBoards.map(normalizeMockBoard);
    }

    await filterAccessibleBoards(allBoards);
  } catch (error) {
    console.error("加载课程论坛板块失败：", error);
    const allBoards = mockBoards.map(normalizeMockBoard);
    await filterAccessibleBoards(allBoards);
  } finally {
    loading.boards = false;
  }
};

const filterAccessibleBoards = async (allBoards: BoardView[]) => {
  try {
    const accessibleCourseIds = await ForumAPI.CourseSelectClient.getAccessibleCourseIds();

    if (accessibleCourseIds.length === 0) {
      boards.value = allBoards;
    } else {
      boards.value = allBoards.filter(board => accessibleCourseIds.includes(board.courseId));
    }
  } catch {
    boards.value = allBoards;
  }
};

const loadNotices = async () => {
  if (!canView.value) {
    notices.value = [];
    pagination.total = 0;
    return;
  }

  loading.notices = true;

  let accessibleCourseIds: string[] = [];
  try {
    accessibleCourseIds = await ForumAPI.CourseSelectClient.getAccessibleCourseIds();
  } catch {
    accessibleCourseIds = [];
  }

  try {
    const res = await ForumAPI.getAnnouncementList({
      page: pagination.page,
      page_size: pagination.pageSize,
      course_id: queryForm.courseId || undefined,
      status: queryForm.status || undefined,
      sort_by: "created_at",
      sort_order: "desc"
    });

    let result = (res.data?.items ?? []).map(item => normalizeApiNotice(item as Forum.NoticeItem & Record<string, any>));

    if (accessibleCourseIds.length > 0) {
      result = result.filter(notice => accessibleCourseIds.includes(notice.courseId));
    }

    notices.value = result;
    pagination.total = res.data?.pagination?.total ?? notices.value.length;
    useMockData.value = false;
    setApiMessage("已连接公告接口。", "success");
  } catch (error) {
    console.error("加载公告失败：", error);
    let result = mockNotices.map(normalizeMockNotice).filter(notice => notice.status !== "deleted");

    if (accessibleCourseIds.length > 0) {
      result = result.filter(notice => accessibleCourseIds.includes(notice.courseId));
    }

    notices.value = result;
    pagination.total = notices.value.length;
    useMockData.value = true;
    setApiMessage("公告接口异常，当前使用本地数据兜底。", "warning");
  } finally {
    loading.notices = false;
  }
};

const reloadPageData = async () => {
  await loadBoards();

  if (!noticeForm.board_id && boardOptions.value.length > 0) {
    noticeForm.board_id = boardOptions.value[0].id;
  }

  await loadNotices();
};

const handleFilter = async () => {
  pagination.page = 1;
  await loadNotices();
};

const resetQuery = async () => {
  queryForm.keyword = "";
  queryForm.courseId = "";
  queryForm.status = "";
  queryForm.displayType = "";
  pagination.page = 1;
  await loadNotices();
};

const handlePageChange = async (page: number) => {
  pagination.page = page;
  await loadNotices();
};

const openDetailDrawer = (notice: NoticeView) => {
  currentNotice.value = notice;
  drawerVisible.value = true;
};

const resetNoticeForm = () => {
  const firstBoardId = boardOptions.value[0]?.id ?? 0;

  noticeForm.board_id = firstBoardId;
  noticeForm.title = "";
  noticeForm.content = "";
  noticeForm.pinned = false;
  noticeForm.popup = false;
  noticeForm.status = "published";
};

const openCreateDialog = () => {
  if (!canManageNotice.value) return;

  editingNotice.value = null;
  resetNoticeForm();
  dialogVisible.value = true;
};

const openEditDialog = (notice: NoticeView) => {
  if (!canManageNotice.value) return;

  editingNotice.value = notice;
  noticeForm.board_id = notice.boardId;
  noticeForm.title = notice.title;
  noticeForm.content = notice.content;
  noticeForm.pinned = notice.pinned;
  noticeForm.popup = notice.popup;
  noticeForm.status = notice.status;
  dialogVisible.value = true;
};

const submitNotice = async () => {
  if (!noticeFormRef.value || !canManageNotice.value) return;

  await noticeFormRef.value.validate(async valid => {
    if (!valid) return;

    submitting.value = true;

    try {
      if (useMockData.value) {
        submitMockNotice();
        return;
      }

      if (editingNotice.value) {
        const res = await ForumAPI.updateAnnouncement(editingNotice.value.id, {
          board_id: noticeForm.board_id,
          title: noticeForm.title,
          content: noticeForm.content,
          pinned: noticeForm.pinned,
          popup: noticeForm.popup,
          status: noticeForm.status
        });

        const updated = normalizeApiNotice(res.data as Forum.NoticeItem & Record<string, any>);
        updateLocalNotice(updated.id, updated);
        ElMessage.success("公告已更新");
      } else {
        const res = await ForumAPI.createAnnouncement({
          board_id: noticeForm.board_id,
          title: noticeForm.title || "",
          content: noticeForm.content || "",
          pinned: noticeForm.pinned,
          popup: noticeForm.popup
        });

        const created = normalizeApiNotice(res.data as Forum.NoticeItem & Record<string, any>);
        notices.value = [created, ...notices.value];
        pagination.total += 1;
        ElMessage.success("公告已发布");
      }

      dialogVisible.value = false;
      await loadNotices();
    } catch (error) {
      console.error("保存公告失败：", error);
      ElMessage.error("保存失败，请检查公告接口或教师/管理员权限");
    } finally {
      submitting.value = false;
    }
  });
};

const submitMockNotice = () => {
  const board = findBoard(noticeForm.board_id);
  const now = getCurrentTimeText();

  if (editingNotice.value) {
    updateLocalNotice(editingNotice.value.id, {
      ...editingNotice.value,
      boardId: noticeForm.board_id || editingNotice.value.boardId,
      boardName: board?.boardName || editingNotice.value.boardName,
      courseId: board?.courseId || editingNotice.value.courseId,
      courseName: board?.courseName || editingNotice.value.courseName,
      title: noticeForm.title || "",
      content: noticeForm.content || "",
      pinned: Boolean(noticeForm.pinned),
      popup: Boolean(noticeForm.popup),
      status: (noticeForm.status as Forum.NoticeStatus) || "published",
      authorId: currentForumUser.value.id,
      authorName: currentForumUser.value.name,
      updatedAt: now
    });

    ElMessage.success("公告已更新");
  } else {
    notices.value = [
      {
        id: Date.now(),
        boardId: noticeForm.board_id || 0,
        boardName: board?.boardName,
        courseId: board?.courseId || "",
        courseName: board?.courseName || "未知课程",
        title: noticeForm.title || "",
        content: noticeForm.content || "",
        pinned: Boolean(noticeForm.pinned),
        popup: Boolean(noticeForm.popup),
        status: "published",
        authorId: currentForumUser.value.id,
        authorName: currentForumUser.value.name,
        createdAt: now,
        updatedAt: now
      },
      ...notices.value
    ];
    pagination.total += 1;
    ElMessage.success("公告已发布");
  }

  dialogVisible.value = false;
  submitting.value = false;
};

const updateLocalNotice = (id: number, patch: Partial<NoticeView>) => {
  notices.value = notices.value.map(item => (item.id === id ? { ...item, ...patch } : item));

  if (currentNotice.value?.id === id) {
    currentNotice.value = { ...currentNotice.value, ...patch };
  }
};

const togglePopup = async (notice: NoticeView) => {
  if (!canManageNotice.value) return;

  try {
    if (useMockData.value) {
      updateLocalNotice(notice.id, { popup: !notice.popup, updatedAt: getCurrentTimeText() });
      ElMessage.success(notice.popup ? "已取消弹窗提醒" : "已设为弹窗提醒");
      return;
    }

    const res = await ForumAPI.toggleAnnouncementPopup(notice.id);
    updateLocalNotice(notice.id, {
      popup: res.data?.popup ?? !notice.popup,
      updatedAt: getCurrentTimeText()
    });
    ElMessage.success(notice.popup ? "已取消弹窗提醒" : "已设为弹窗提醒");
  } catch (error) {
    console.error("切换弹窗失败：", error);
    ElMessage.error("操作失败，请检查公告弹窗接口或教师/管理员权限");
  }
};

const deleteNotice = async (notice: NoticeView) => {
  if (!canManageNotice.value) return;

  try {
    await ElMessageBox.confirm(`确认删除公告「${notice.title}」吗？`, "删除公告", {
      type: "warning",
      confirmButtonText: "确认删除",
      cancelButtonText: "取消"
    });

    if (useMockData.value) {
      notices.value = notices.value.filter(item => item.id !== notice.id);
      pagination.total = Math.max(0, pagination.total - 1);

      if (currentNotice.value?.id === notice.id) {
        drawerVisible.value = false;
      }

      ElMessage.success("公告已删除");
      return;
    }

    await ForumAPI.deleteAnnouncement(notice.id);
    notices.value = notices.value.filter(item => item.id !== notice.id);
    pagination.total = Math.max(0, pagination.total - 1);

    if (currentNotice.value?.id === notice.id) {
      drawerVisible.value = false;
    }

    ElMessage.success("公告已删除");
  } catch (error) {
    if (error !== "cancel") {
      console.error("删除公告失败：", error);
      ElMessage.error("删除失败，请检查公告删除接口或教师/管理员权限");
    }
  }
};

const getCurrentTimeText = () => {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");

  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
};

const getUserText = (id?: number) => {
  return id ? `用户 #${id}` : "未知用户";
};

const formatTime = (time?: string | null) => {
  if (!time) return "未知时间";

  return time.replace("T", " ").slice(0, 16);
};

onMounted(() => {
  reloadPageData();
});
</script>

<style scoped lang="scss">
.forum-notices-page,
.notice-toolbar {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.filter-form {
  display: flex;
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
.notice-meta,
.course-subtitle {
  margin-top: 6px;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}
.empty-display {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.pagination-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
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
  line-height: 1.8;
  white-space: pre-wrap;
}
.action-card {
  margin-top: 16px;
  border-radius: 10px;
}
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>
