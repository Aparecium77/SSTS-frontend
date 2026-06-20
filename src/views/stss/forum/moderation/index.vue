<template>
  <div class="forum-moderation-page">
    <template v-if="!canAccess">
      <el-card class="access-denied-card">
        <div class="access-denied">
          <el-icon size="48" color="#9ca3af">
            <Lock />
          </el-icon>
          <h3>无权限访问</h3>
          <p>当前账号没有内容审核权限，请联系系统管理员。</p>
        </div>
      </el-card>
    </template>
    <ForumPageShell
      v-else
      title="内容审核"
      description="面向论坛管理员的内容处理页面，支持帖子和回复的审核、隐藏、删除、通过与处理原因记录。"
      :tags="['内容管理', '帖子审核', '回复审核', '处理记录']"
      :stats="stats"
      content-title="审核列表"
      content-description="设置筛选条件后点击筛选。当前为本地 mock 审核记录，后续可由帖子/回复状态接口或审核记录接口承载。"
      :data-count="filteredItems.length"
      empty-description="当前筛选条件下暂无审核记录。"
    >
      <template #filters>
        <el-form :model="queryForm" class="filter-form" inline>
          <el-form-item label="关键词">
            <el-input v-model="queryForm.keyword" clearable placeholder="搜索标题、正文、作者或原因" style="width: 280px" />
          </el-form-item>

          <el-form-item label="课程">
            <el-select v-model="queryForm.courseName" clearable placeholder="全部课程" style="width: 180px">
              <el-option v-for="course in courseOptions" :key="course" :label="course" :value="course" />
            </el-select>
          </el-form-item>

          <el-form-item label="对象">
            <el-select v-model="queryForm.targetType" clearable placeholder="全部对象" style="width: 150px">
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
            <el-space>
              <el-button type="primary" @click="handleFilter">筛选</el-button>
              <el-button @click="resetQuery">重置</el-button>
            </el-space>
          </el-form-item>
        </el-form>

        <el-alert
          :closable="false"
          show-icon
          title="当前页面只做审核处理的前端 mock。真实接入时，可由帖子/回复状态更新接口实现隐藏、删除、通过等操作。"
          type="info"
        />
      </template>

      <el-table :data="filteredItems" border>
        <el-table-column label="审核内容" min-width="330">
          <template #default="{ row }">
            <div class="moderation-title-cell">
              <span class="moderation-title">{{ row.title }}</span>
              <el-tag size="small" :type="row.targetType === 'post' ? 'primary' : 'success'">
                {{ row.targetType === "post" ? "帖子" : "回复" }}
              </el-tag>
            </div>
            <div class="moderation-content-preview">{{ row.content }}</div>
            <div class="moderation-meta">{{ row.courseName }} · 作者 {{ row.authorName }} · 举报/来源 {{ row.reporterName }}</div>
          </template>
        </el-table-column>

        <el-table-column label="原因" min-width="210">
          <template #default="{ row }">
            <div class="reason-text">{{ row.reason }}</div>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="moderationStatusTagMap[row.status]">
              {{ moderationStatusTextMap[row.status] }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="时间" min-width="170">
          <template #default="{ row }">
            <div class="metric-line">提交 {{ row.createdAt }}</div>
            <div class="metric-line">处理 {{ row.handledAt || "未处理" }}</div>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="260">
          <template #default="{ row }">
            <el-space>
              <el-button link type="primary" @click="openDetailDrawer(row)">详情</el-button>
              <el-button
                v-if="canApprove"
                link
                type="success"
                :disabled="row.status !== 'pending'"
                @click="openHandleDialog(row, 'approved')"
              >
                通过
              </el-button>
              <el-button
                v-if="canReject"
                link
                type="warning"
                :disabled="row.status === 'hidden'"
                @click="openHandleDialog(row, 'hidden')"
              >
                隐藏
              </el-button>
              <el-button
                v-if="canReject"
                link
                type="danger"
                :disabled="row.status === 'deleted'"
                @click="openHandleDialog(row, 'deleted')"
              >
                删除
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

    <el-dialog v-model="handleDialogVisible" :title="handleDialogTitle" width="620px">
      <template v-if="currentHandleItem">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="处理对象">
            {{ currentHandleItem.targetType === "post" ? "帖子" : "回复" }} #{{ currentHandleItem.targetId }}
          </el-descriptions-item>
          <el-descriptions-item label="标题">
            {{ currentHandleItem.title }}
          </el-descriptions-item>
          <el-descriptions-item label="作者">
            {{ currentHandleItem.authorName }}
          </el-descriptions-item>
          <el-descriptions-item label="原始原因">
            {{ currentHandleItem.reason }}
          </el-descriptions-item>
        </el-descriptions>

        <el-form class="handle-form" :model="handleForm" label-width="90px">
          <el-form-item label="处理说明">
            <el-input
              v-model="handleForm.reason"
              :rows="4"
              maxlength="240"
              placeholder="请输入处理说明，用于记录管理员处理依据"
              show-word-limit
              type="textarea"
            />
          </el-form-item>
        </el-form>
      </template>

      <template #footer>
        <el-button @click="handleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitHandle">确认处理</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="drawerVisible" size="580px" title="审核详情">
      <template v-if="currentItem">
        <div class="drawer-title">{{ currentItem.title }}</div>
        <div class="drawer-meta">
          {{ currentItem.courseName }} · {{ currentItem.targetType === "post" ? "帖子" : "回复" }} · 作者
          {{ currentItem.authorName }}
        </div>

        <div class="drawer-tags">
          <el-tag :type="moderationStatusTagMap[currentItem.status]">
            {{ moderationStatusTextMap[currentItem.status] }}
          </el-tag>
          <el-tag effect="plain">来源：{{ currentItem.reporterName }}</el-tag>
        </div>

        <el-divider />

        <el-descriptions :column="1" border>
          <el-descriptions-item label="内容正文">
            <div class="description-content">{{ currentItem.content }}</div>
          </el-descriptions-item>
          <el-descriptions-item label="审核原因">
            {{ currentItem.reason }}
          </el-descriptions-item>
          <el-descriptions-item label="提交时间">
            {{ currentItem.createdAt }}
          </el-descriptions-item>
          <el-descriptions-item label="处理人">
            {{ currentItem.handlerName || "未处理" }}
          </el-descriptions-item>
          <el-descriptions-item label="处理时间">
            {{ currentItem.handledAt || "未处理" }}
          </el-descriptions-item>
        </el-descriptions>

        <el-card class="action-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span>处理动作</span>
              <el-tag size="small" effect="plain">mock</el-tag>
            </div>
          </template>

          <el-space wrap>
            <el-button
              v-if="canApprove"
              type="success"
              :disabled="currentItem.status !== 'pending'"
              @click="openHandleDialog(currentItem, 'approved')"
            >
              通过
            </el-button>
            <el-button
              v-if="canReject"
              type="warning"
              :disabled="currentItem.status === 'hidden'"
              @click="openHandleDialog(currentItem, 'hidden')"
            >
              隐藏
            </el-button>
            <el-button
              v-if="canReject"
              type="danger"
              :disabled="currentItem.status === 'deleted'"
              @click="openHandleDialog(currentItem, 'deleted')"
            >
              删除
            </el-button>
          </el-space>

          <el-alert
            class="action-tip"
            :closable="false"
            show-icon
            title="真实接入后，隐藏/删除可映射为帖子或回复的 status 更新；通过可记录审核状态。"
            type="info"
          />
        </el-card>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { Lock } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import ForumPageShell from "../components/ForumPageShell.vue";
import { useForumAuthButtons } from "../auth";
import {
  mockModerationItems,
  moderationStatusTextMap,
  type ForumModerationMock,
  type ModerationStatus,
  type ModerationTargetType
} from "../mock";

const { BUTTONS } = useForumAuthButtons();
const canApprove = computed(() => BUTTONS.approve);
const canReject = computed(() => BUTTONS.reject);
const canAccess = computed(() => BUTTONS.approve || BUTTONS.reject);

interface ModerationQueryForm {
  keyword: string;
  courseName: string;
  targetType: ModerationTargetType | "";
  status: ModerationStatus | "";
}

type HandleAction = "approved" | "hidden" | "deleted";

const createEmptyQuery = (): ModerationQueryForm => ({
  keyword: "",
  courseName: "",
  targetType: "",
  status: ""
});

const moderationStatusTagMap: Record<ModerationStatus, "warning" | "success" | "info" | "danger"> = {
  pending: "warning",
  approved: "success",
  hidden: "info",
  deleted: "danger"
};

const items = ref<ForumModerationMock[]>(mockModerationItems.map(item => ({ ...item })));

const queryForm = reactive<ModerationQueryForm>(createEmptyQuery());
const activeQuery = reactive<ModerationQueryForm>(createEmptyQuery());

const drawerVisible = ref(false);
const handleDialogVisible = ref(false);
const currentItem = ref<ForumModerationMock | null>(null);
const currentHandleItem = ref<ForumModerationMock | null>(null);
const handleAction = ref<HandleAction>("approved");
const handleForm = reactive({
  reason: ""
});

const pageNum = ref(1);
const pageSize = ref(10);
const total = ref(0);

const allFilteredItems = computed(() => {
  const keyword = activeQuery.keyword.trim().toLowerCase();

  return items.value.filter(item => {
    const matchKeyword =
      !keyword ||
      item.title.toLowerCase().includes(keyword) ||
      item.content.toLowerCase().includes(keyword) ||
      item.authorName.toLowerCase().includes(keyword) ||
      item.reporterName.toLowerCase().includes(keyword) ||
      item.reason.toLowerCase().includes(keyword);

    const matchCourse = !activeQuery.courseName || item.courseName === activeQuery.courseName;
    const matchTargetType = !activeQuery.targetType || item.targetType === activeQuery.targetType;
    const matchStatus = !activeQuery.status || item.status === activeQuery.status;

    return matchKeyword && matchCourse && matchTargetType && matchStatus;
  });
});

total.value = allFilteredItems.value.length;

const filteredItems = computed(() => {
  const start = (pageNum.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return allFilteredItems.value.slice(start, end);
});

watch(
  [activeQuery, pageNum, pageSize],
  () => {
    total.value = allFilteredItems.value.length;
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

const courseOptions = computed(() => {
  return Array.from(new Set(items.value.map(item => item.courseName)));
});

const stats = computed(() => [
  {
    label: "审核记录",
    value: items.value.length,
    help: "帖子与回复审核总量"
  },
  {
    label: "待处理",
    value: items.value.filter(item => item.status === "pending").length,
    help: "需要管理员处理"
  },
  {
    label: "已隐藏",
    value: items.value.filter(item => item.status === "hidden").length,
    help: "已限制展示的内容"
  },
  {
    label: "已删除",
    value: items.value.filter(item => item.status === "deleted").length,
    help: "已标记删除的内容"
  }
]);

const handleDialogTitle = computed(() => {
  const actionTextMap: Record<HandleAction, string> = {
    approved: "通过审核",
    hidden: "隐藏内容",
    deleted: "删除内容"
  };

  return actionTextMap[handleAction.value];
});

const getCurrentTimeText = () => {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");

  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
};

const handleFilter = () => {
  activeQuery.keyword = queryForm.keyword;
  activeQuery.courseName = queryForm.courseName;
  activeQuery.targetType = queryForm.targetType;
  activeQuery.status = queryForm.status;
};

const resetQuery = () => {
  Object.assign(queryForm, createEmptyQuery());
  Object.assign(activeQuery, createEmptyQuery());
};

const openDetailDrawer = (item: ForumModerationMock) => {
  currentItem.value = item;
  drawerVisible.value = true;
};

const openHandleDialog = (item: ForumModerationMock, action: HandleAction) => {
  currentHandleItem.value = item;
  handleAction.value = action;
  handleForm.reason = getDefaultHandleReason(action);
  handleDialogVisible.value = true;
};

const getDefaultHandleReason = (action: HandleAction) => {
  const reasonMap: Record<HandleAction, string> = {
    approved: "内容未发现明显违规，审核通过。",
    hidden: "内容暂不适合公开展示，已隐藏处理。",
    deleted: "内容违反课程论坛规范，已删除处理。"
  };

  return reasonMap[action];
};

const submitHandle = () => {
  const target = currentHandleItem.value;
  const reason = handleForm.reason.trim();

  if (!target) return;

  if (!reason) {
    ElMessage.warning("请输入处理说明");
    return;
  }

  target.status = handleAction.value;
  target.reason = reason;
  target.handlerName = "管理员";
  target.handledAt = getCurrentTimeText();

  if (currentItem.value?.id === target.id) {
    currentItem.value = target;
  }

  handleDialogVisible.value = false;
  ElMessage.success(`${target.title} 已${moderationStatusTextMap[target.status]}`);
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
.moderation-title-cell {
  display: flex;
  gap: 8px;
  align-items: center;
}
.moderation-title {
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.moderation-content-preview {
  width: 100%;
  margin-top: 6px;
  overflow: hidden;
  line-height: 1.6;
  color: var(--el-text-color-regular);
  text-overflow: ellipsis;
  white-space: nowrap;
}
.moderation-meta {
  margin-top: 6px;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}
.reason-text {
  line-height: 1.6;
  color: var(--el-text-color-regular);
}
.metric-line {
  line-height: 22px;
  color: var(--el-text-color-secondary);
}
.handle-form {
  margin-top: 18px;
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
.description-content {
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
.action-tip {
  margin-top: 14px;
}
</style>
