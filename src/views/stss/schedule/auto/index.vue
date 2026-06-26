<template>
  <div class="schedule-page-view">
    <SchedulePageShell
      v-model="detailVisible"
      title="自动排课"
      description="输入学期触发排课任务，并通过任务 ID 轮询当前任务进度和结果摘要。"
      :tags="['异步任务', '状态轮询', '结果摘要']"
      :stats="stats"
      content-title="当前任务"
      content-description="后端当前没有任务历史列表，本页只展示最近触发或手动填入的任务。"
      :data-count="currentStatus ? 1 : 0"
      empty-description="尚未触发自动排课任务。"
      dialog-title="结果摘要"
    >
      <template #actions>
        <el-space wrap>
          <el-button :disabled="!taskId" :loading="polling" @click="pollStatus">刷新状态</el-button>
          <el-button type="primary" :loading="submitting" @click="triggerSchedule">触发自动排课</el-button>
        </el-space>
      </template>

      <template #filters>
        <el-form :inline="true" :model="form" class="filter-form">
          <el-form-item label="排课学期" required>
            <el-input v-model="form.semester" placeholder="例如 2026-FALL" clearable style="width: 220px" />
          </el-form-item>
          <el-form-item label="当前任务 ID">
            <el-input
              v-model="taskId"
              clearable
              placeholder="可粘贴 task_id 后刷新"
              style="width: 360px"
              @change="handleTaskIdChange"
            />
          </el-form-item>
        </el-form>
      </template>

      <div v-if="currentStatus" class="task-board">
        <div class="task-card">
          <div class="task-card__header">
            <div>
              <span>Task ID</span>
              <strong>{{ currentStatus.task_id }}</strong>
            </div>
            <el-tag :type="statusTagType" effect="light">{{ currentStatus.status }}</el-tag>
          </div>
          <el-progress :percentage="currentStatus.progress" :stroke-width="14" />
          <p>{{ currentStatus.message || "等待后端返回进度信息。" }}</p>
          <div class="task-card__actions">
            <el-button type="primary" link @click="detailVisible = true">查看摘要</el-button>
          </div>
        </div>

        <el-alert
          v-if="isTerminal"
          :title="currentStatus.status === 'SUCCESS' ? '排课任务已完成' : '排课任务已结束'"
          :description="terminalDescription"
          :type="currentStatus.status === 'SUCCESS' ? 'success' : 'warning'"
          :closable="false"
        />
      </div>

      <template #detail>
        <div v-if="currentStatus" class="detail-stack">
          <el-descriptions :column="1" border>
            <el-descriptions-item label="任务 ID">{{ currentStatus.task_id }}</el-descriptions-item>
            <el-descriptions-item label="状态">{{ currentStatus.status }}</el-descriptions-item>
            <el-descriptions-item label="进度">{{ `${currentStatus.progress}%` }}</el-descriptions-item>
            <el-descriptions-item label="提示">{{ currentStatus.message || "-" }}</el-descriptions-item>
          </el-descriptions>
          <pre class="summary-json">{{ formattedSummary }}</pre>
        </div>
      </template>
    </SchedulePageShell>
  </div>
</template>

<script setup lang="ts" name="scheduleAuto">
import { computed, onBeforeUnmount, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import type { Schedule } from "@/api/interface/schedule";
import { getScheduleStatus, triggerAutoSchedule } from "@/api/modules/schedule";
import SchedulePageShell from "../components/SchedulePageShell.vue";

const STORAGE_KEY = "stss-schedule-last-task";
const terminalStatuses = new Set(["SUCCESS", "FAILED", "FAILURE", "PARTIAL", "REVOKED"]);

const stored = localStorage.getItem(STORAGE_KEY);
const form = reactive({
  semester: "2026-FALL"
});
const taskId = ref(stored || "");
const currentStatus = ref<Schedule.ScheduleStatusResponse | null>(null);
const submitting = ref(false);
const polling = ref(false);
const detailVisible = ref(false);
let timer: number | undefined;

const isTerminal = computed(() => Boolean(currentStatus.value && terminalStatuses.has(String(currentStatus.value.status))));

const statusTagType = computed<"success" | "warning" | "danger" | "info">(() => {
  const status = String(currentStatus.value?.status ?? "");
  if (status === "SUCCESS") return "success";
  if (status === "FAILED" || status === "FAILURE") return "danger";
  if (status === "PARTIAL") return "warning";
  return "info";
});

const terminalDescription = computed(() => {
  if (!currentStatus.value) return "";
  if (currentStatus.value.status === "SUCCESS") return "可以到课表查询页面查看落库结果。";
  return currentStatus.value.message || "请根据后端返回信息检查基础数据、教师偏好和教室资源。";
});

const stats = computed(() => [
  { label: "当前任务", value: taskId.value ? "1" : "0", help: "本页只追踪当前任务" },
  { label: "执行状态", value: currentStatus.value?.status ?? "-", help: "来自 Celery/Redis 状态接口" },
  { label: "进度", value: currentStatus.value ? `${currentStatus.value.progress}%` : "-", help: "后端返回的进度百分比" },
  { label: "结果摘要", value: currentStatus.value?.result_summary ? "已返回" : "暂无", help: "成功或部分成功时展示" }
]);

const formattedSummary = computed(() => {
  if (!currentStatus.value?.result_summary) return "暂无结果摘要";
  return JSON.stringify(currentStatus.value.result_summary, null, 2);
});

const stopPolling = () => {
  if (timer) window.clearInterval(timer);
  timer = undefined;
};

const startPolling = () => {
  stopPolling();
  timer = window.setInterval(() => {
    if (!isTerminal.value) void pollStatus();
    else stopPolling();
  }, 3000);
};

const pollStatus = async () => {
  if (!taskId.value.trim()) {
    ElMessage.warning("请先触发任务或填写任务 ID");
    return;
  }
  polling.value = true;
  try {
    const { data } = await getScheduleStatus(taskId.value.trim());
    currentStatus.value = data;
    if (isTerminal.value) stopPolling();
  } finally {
    polling.value = false;
  }
};

const triggerSchedule = async () => {
  if (!form.semester.trim()) {
    ElMessage.warning("请输入排课学期");
    return;
  }
  submitting.value = true;
  try {
    const { data } = await triggerAutoSchedule({ semester: form.semester.trim() });
    taskId.value = data.task_id;
    localStorage.setItem(STORAGE_KEY, data.task_id);
    currentStatus.value = {
      task_id: data.task_id,
      status: "PENDING",
      progress: 0,
      message: "任务已提交，等待 worker 执行。",
      result_summary: null
    };
    ElMessage.success("自动排课任务已提交");
    startPolling();
    await pollStatus();
  } finally {
    submitting.value = false;
  }
};

const handleTaskIdChange = () => {
  if (taskId.value.trim()) localStorage.setItem(STORAGE_KEY, taskId.value.trim());
  else localStorage.removeItem(STORAGE_KEY);
};

if (taskId.value) {
  void pollStatus().then(() => {
    if (!isTerminal.value) startPolling();
  });
}

onBeforeUnmount(stopPolling);
</script>

<style scoped lang="scss">
.schedule-page-view,
.detail-stack {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.filter-form {
  display: flex;
  flex-wrap: wrap;
}
.task-board {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.task-card {
  padding: 20px;
  background: #f8fafc;
  border: 1px solid #dbeafe;
  border-radius: 8px;
}
.task-card__header {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 16px;
}
.task-card__header span {
  display: block;
  margin-bottom: 6px;
  font-size: 12px;
  color: #64748b;
}
.task-card__header strong {
  color: #0f172a;
  word-break: break-all;
}
.task-card p {
  margin: 14px 0 0;
  color: #475569;
}
.task-card__actions {
  margin-top: 8px;
}
.summary-json {
  max-height: 360px;
  padding: 16px;
  overflow: auto;
  color: #1f2937;
  white-space: pre-wrap;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}
</style>
