<template>
  <div class="forum-moderation-page">
    <ForumPageShell
      title="内容审核"
      description="处理被举报或系统标记的帖子与回复，支持通过、隐藏、删除和记录审核原因。"
      :tags="['违规处理', '审核记录', '状态追踪']"
      :stats="stats"
      content-title="审核记录"
      content-description="展示待处理与已处理的内容审核记录，后续可替换为后端审核接口。"
      :data-count="filteredItems.length"
      empty-description="当前筛选条件下暂无审核记录。"
    >
      <template #filters>
        <el-form :model="queryForm" class="filter-form" inline>
          <el-form-item label="关键词">
            <el-input v-model="queryForm.keyword" clearable placeholder="搜索标题、正文、作者或原因" style="width: 280px" />
          </el-form-item>

          <el-form-item label="对象">
            <el-select v-model="queryForm.targetType" clearable placeholder="全部对象" style="width: 160px">
              <el-option label="帖子" value="post" />
              <el-option label="回复" value="reply" />
            </el-select>
          </el-form-item>

          <el-form-item label="状态">
            <el-select v-model="queryForm.status" clearable placeholder="全部状态" style="width: 160px">
              <el-option label="待处理" value="pending" />
              <el-option label="已通过" value="approved" />
              <el-option label="已隐藏" value="hidden" />
              <el-option label="已删除" value="deleted" />
            </el-select>
          </el-form-item>

          <el-form-item>
            <el-button @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>
      </template>

      <el-table :data="filteredItems" border>
        <el-table-column label="审核内容" min-width="280">
          <template #default="{ row }">
            <div class="content-title-cell">
              <span class="content-title">{{ row.title }}</span>
              <el-tag size="small" :type="row.targetType === 'post' ? 'primary' : 'success'">
                {{ row.targetType === "post" ? "帖子" : "回复" }}
              </el-tag>
            </div>
            <div class="content-preview">{{ row.content }}</div>
            <div class="content-meta">{{ row.courseName }} · 作者：{{ row.authorName }} · 举报人：{{ row.reporterName }}</div>
          </template>
        </el-table-column>

        <el-table-column prop="reason" label="审核原因" min-width="180" />

        <el-table-column label="状态" min-width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="statusTagMap[row.status]">
              {{ moderationStatusTextMap[row.status] }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="createdAt" label="提交时间" min-width="160" />

        <el-table-column label="处理信息" min-width="170">
          <template #default="{ row }">
            <div v-if="row.handledAt" class="handle-info">
              <div>{{ row.handlerName || "管理员" }}</div>
              <div>{{ row.handledAt }}</div>
            </div>
            <span v-else class="pending-text">尚未处理</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="230">
          <template #default="{ row }">
            <el-space>
              <el-button link type="primary" @click="openDetailDialog(row)">详情</el-button>
              <el-button link type="success" @click="handleApprove(row)">通过</el-button>
              <el-button link type="warning" @click="openHandleDialog(row, 'hidden')">隐藏</el-button>
              <el-button link type="danger" @click="openHandleDialog(row, 'deleted')">删除</el-button>
            </el-space>
          </template>
        </el-table-column>
      </el-table>
    </ForumPageShell>

    <el-dialog v-model="detailVisible" title="审核详情" width="680px">
      <template v-if="currentItem">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="对象类型">
            {{ currentItem.targetType === "post" ? "帖子" : "回复" }}
          </el-descriptions-item>
          <el-descriptions-item label="当前状态">
            {{ moderationStatusTextMap[currentItem.status] }}
          </el-descriptions-item>
          <el-descriptions-item label="所属课程">
            {{ currentItem.courseName }}
          </el-descriptions-item>
          <el-descriptions-item label="作者">
            {{ currentItem.authorName }}
          </el-descriptions-item>
          <el-descriptions-item label="举报人">
            {{ currentItem.reporterName }}
          </el-descriptions-item>
          <el-descriptions-item label="提交时间">
            {{ currentItem.createdAt }}
          </el-descriptions-item>
          <el-descriptions-item label="审核原因" :span="2">
            {{ currentItem.reason }}
          </el-descriptions-item>
          <el-descriptions-item label="内容标题" :span="2">
            {{ currentItem.title }}
          </el-descriptions-item>
          <el-descriptions-item label="内容正文" :span="2">
            {{ currentItem.content }}
          </el-descriptions-item>
        </el-descriptions>
      </template>

      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="handleVisible" :title="handleDialogTitle" width="560px">
      <el-form :model="handleForm" label-width="90px">
        <el-form-item label="处理对象">
          <el-input :model-value="currentItem?.title" disabled />
        </el-form-item>

        <el-form-item label="处理原因">
          <el-input
            v-model="handleForm.reason"
            :rows="4"
            maxlength="300"
            placeholder="请输入审核处理原因"
            show-word-limit
            type="textarea"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="handleVisible = false">取消</el-button>
        <el-button :type="handleAction === 'hidden' ? 'warning' : 'danger'" @click="submitHandle">
          确认{{ handleAction === "hidden" ? "隐藏" : "删除" }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import ForumPageShell from "../components/ForumPageShell.vue";
import {
  mockModerationItems,
  moderationStatusTextMap,
  type ForumModerationMock,
  type ModerationStatus,
  type ModerationTargetType
} from "../mock";

const statusTagMap: Record<ModerationStatus, "success" | "warning" | "danger" | "info"> = {
  pending: "warning",
  approved: "success",
  hidden: "info",
  deleted: "danger"
};

const moderationItems = ref<ForumModerationMock[]>(mockModerationItems.map(item => ({ ...item })));

const queryForm = reactive({
  keyword: "",
  targetType: "" as ModerationTargetType | "",
  status: "" as ModerationStatus | ""
});

const detailVisible = ref(false);
const handleVisible = ref(false);
const currentItem = ref<ForumModerationMock | null>(null);
const handleAction = ref<"hidden" | "deleted">("hidden");

const handleForm = reactive({
  reason: ""
});

const filteredItems = computed(() => {
  const keyword = queryForm.keyword.trim().toLowerCase();

  return moderationItems.value.filter(item => {
    const matchKeyword =
      !keyword ||
      item.title.toLowerCase().includes(keyword) ||
      item.content.toLowerCase().includes(keyword) ||
      item.authorName.toLowerCase().includes(keyword) ||
      item.reporterName.toLowerCase().includes(keyword) ||
      item.reason.toLowerCase().includes(keyword);

    const matchTargetType = !queryForm.targetType || item.targetType === queryForm.targetType;
    const matchStatus = !queryForm.status || item.status === queryForm.status;

    return matchKeyword && matchTargetType && matchStatus;
  });
});

const stats = computed(() => [
  {
    label: "审核总数",
    value: moderationItems.value.length,
    help: "当前审核记录数量"
  },
  {
    label: "待处理",
    value: getStatusCount("pending"),
    help: "需要管理员处理"
  },
  {
    label: "已通过",
    value: getStatusCount("approved"),
    help: "确认无需处理的内容"
  },
  {
    label: "已隐藏",
    value: getStatusCount("hidden"),
    help: "已从公开视图移除"
  }
]);

const handleDialogTitle = computed(() => {
  return handleAction.value === "hidden" ? "隐藏内容" : "删除内容";
});

const getCurrentTimeText = () => {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");

  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
};

const getStatusCount = (status: ModerationStatus) => {
  return moderationItems.value.filter(item => item.status === status).length;
};

const resetQuery = () => {
  queryForm.keyword = "";
  queryForm.targetType = "";
  queryForm.status = "";
};

const openDetailDialog = (item: ForumModerationMock) => {
  currentItem.value = item;
  detailVisible.value = true;
};

const handleApprove = (item: ForumModerationMock) => {
  item.status = "approved";
  item.handledAt = getCurrentTimeText();
  item.handlerName = "管理员";
  ElMessage.success(`已通过审核：${item.title}`);
};

const openHandleDialog = (item: ForumModerationMock, action: "hidden" | "deleted") => {
  currentItem.value = item;
  handleAction.value = action;
  handleForm.reason = action === "hidden" ? "内容不符合课程论坛讨论规范，已隐藏处理。" : "内容严重违规，已删除处理。";
  handleVisible.value = true;
};

const submitHandle = () => {
  if (!currentItem.value) return;

  const reason = handleForm.reason.trim();

  if (!reason) {
    ElMessage.warning("请输入处理原因");
    return;
  }

  currentItem.value.status = handleAction.value;
  currentItem.value.reason = reason;
  currentItem.value.handledAt = getCurrentTimeText();
  currentItem.value.handlerName = "管理员";

  ElMessage.success(`${handleAction.value === "hidden" ? "已隐藏" : "已删除"}：${currentItem.value.title}`);
  handleVisible.value = false;
};
</script>

<style scoped lang="scss">
.forum-moderation-page,
.filter-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.filter-form {
  flex-flow: row wrap;
}
.content-title-cell {
  display: flex;
  gap: 6px;
  align-items: center;
}
.content-title {
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.content-preview {
  width: 100%;
  margin-top: 6px;
  overflow: hidden;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  text-overflow: ellipsis;
  white-space: nowrap;
}
.content-meta {
  margin-top: 6px;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}
.handle-info {
  line-height: 22px;
  color: var(--el-text-color-secondary);
}
.pending-text {
  color: var(--el-color-warning);
}
</style>
