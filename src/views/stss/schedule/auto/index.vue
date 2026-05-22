<template>
  <div class="schedule-page-view">
    <SchedulePageShell
      v-model="detailVisible"
      title="自动排课"
      description="统一承接自动排课任务配置、执行进度、结果统计与冲突摘要，后续可直接切换到自动排课接口。"
      :tags="['任务配置', '执行进度', '冲突结果']"
      :stats="stats"
      content-title="任务队列"
      content-description="列表区聚焦任务状态、执行进度和失败提示，详情弹窗承接结果统计与冲突清单。"
      :data-count="taskRecords.length"
      empty-description="当前筛选条件下暂无自动排课任务。"
      dialog-title="任务结果"
    >
      <template #actions>
        <div class="header-actions">
          <el-button :loading="loading" @click="loadTasks">刷新任务</el-button>
          <el-button type="primary" @click="openCreate">创建任务</el-button>
        </div>
      </template>

      <template #filters>
        <el-form :inline="true" :model="filters" class="filter-form">
          <el-form-item label="学期">
            <el-select v-model="filters.semesterId" clearable placeholder="全部学期" style="width: 240px" @change="loadTasks">
              <el-option v-for="item in semesterOptionItems" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="任务状态">
            <el-select v-model="filters.status" clearable placeholder="全部状态" style="width: 160px" @change="loadTasks">
              <el-option v-for="item in statusOptionItems" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="关键词">
            <el-input
              v-model="filters.keyword"
              clearable
              placeholder="任务名称 / 创建人 / 备注"
              style="width: 240px"
              @change="loadTasks"
            />
          </el-form-item>
        </el-form>
      </template>

      <div class="overview-grid">
        <article v-for="item in resultCards" :key="item.label" class="overview-card">
          <span class="overview-card__label">{{ item.label }}</span>
          <strong class="overview-card__value">{{ item.value }}</strong>
          <p>{{ item.help }}</p>
        </article>
      </div>

      <el-table v-loading="loading" :data="taskRecords" border>
        <el-table-column prop="taskName" label="任务名称" min-width="190" />
        <el-table-column prop="semesterName" label="学期" min-width="200" />
        <el-table-column prop="createdBy" label="创建人" min-width="110" />
        <el-table-column label="状态" min-width="110">
          <template #default="{ row }">
            <el-tag :type="getTaskStatusTagType(row.status)" effect="light">
              {{ getTaskStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="执行进度" min-width="220">
          <template #default="{ row }">
            <div class="progress-cell">
              <el-progress :percentage="row.progress.percent" :stroke-width="12" />
              <span>{{ `${row.progress.processed} / ${row.progress.total}` }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="conflictCount" label="冲突数" min-width="90" />
        <el-table-column label="失败提示" min-width="240" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.failureReason ?? "-" }}
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" min-width="160" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-space>
              <el-button link type="primary" @click="openDetail(row)">详情</el-button>
              <el-button v-if="row.status === 'draft' || row.status === 'failed'" link type="success" @click="executeTask(row)">
                {{ row.status === "failed" ? "重试" : "执行" }}
              </el-button>
            </el-space>
          </template>
        </el-table-column>
      </el-table>

      <template #detail>
        <div v-if="currentTask && currentResult" class="detail-stack">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="任务名称">{{ currentTask.taskName }}</el-descriptions-item>
            <el-descriptions-item label="学期">{{ currentTask.semesterName }}</el-descriptions-item>
            <el-descriptions-item label="执行状态">{{ getTaskStatusLabel(currentTask.status) }}</el-descriptions-item>
            <el-descriptions-item label="结果生成时间">{{ currentResult.generatedAt }}</el-descriptions-item>
            <el-descriptions-item label="排课完成率">{{ `${currentResult.successRate}%` }}</el-descriptions-item>
            <el-descriptions-item label="未解冲突">{{ currentResult.unresolvedConflicts }}</el-descriptions-item>
          </el-descriptions>

          <div class="result-grid">
            <article class="result-card">
              <span>已排课程</span>
              <strong>{{ currentResult.arrangedCourses }}</strong>
            </article>
            <article class="result-card">
              <span>规则数量</span>
              <strong>{{ currentTask.ruleIds.length }}</strong>
            </article>
            <article class="result-card">
              <span>资源范围</span>
              <strong>{{ currentTask.resourceScope.length }}</strong>
            </article>
          </div>

          <div class="detail-panel">
            <h4>结果摘要</h4>
            <el-timeline>
              <el-timeline-item v-for="item in currentResult.summary" :key="item" type="primary">
                {{ item }}
              </el-timeline-item>
            </el-timeline>
          </div>

          <div class="detail-panel">
            <h4>冲突统计</h4>
            <div class="conflict-grid">
              <article v-for="item in currentResult.conflictBreakdown" :key="item.label" class="conflict-card">
                <el-tag :type="getConflictTagType(item.level)" effect="light">{{ item.label }}</el-tag>
                <strong>{{ item.count }}</strong>
              </article>
            </div>
          </div>

          <div class="detail-panel">
            <h4>冲突清单</h4>
            <el-alert
              v-for="item in currentResult.conflicts"
              :key="item.id"
              :title="item.title"
              :description="`${item.message} · ${item.relatedEntity}`"
              :type="item.level === 'high' ? 'error' : item.level === 'medium' ? 'warning' : 'info'"
              :closable="false"
            />
          </div>

          <el-alert
            v-if="currentTask.failureReason"
            title="失败提示"
            :description="currentTask.failureReason"
            type="error"
            :closable="false"
          />
        </div>
      </template>
    </SchedulePageShell>

    <el-drawer v-model="formVisible" title="创建自动排课任务" size="640px">
      <el-form ref="formRef" :model="formModel" :rules="formRules" label-width="108px" class="task-form">
        <el-form-item label="任务名称" prop="taskName">
          <el-input v-model="formModel.taskName" maxlength="40" show-word-limit placeholder="例如：2025 秋季首次排课" />
        </el-form-item>
        <el-form-item label="学期" prop="semesterId">
          <el-select v-model="formModel.semesterId" placeholder="选择学期">
            <el-option v-for="item in semesterOptionItems" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="规则集" prop="ruleIds">
          <el-select v-model="formModel.ruleIds" multiple collapse-tags collapse-tags-tooltip placeholder="选择参与排课的规则">
            <el-option v-for="item in ruleOptionItems" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="资源范围" prop="resourceScope">
          <el-checkbox-group v-model="formModel.resourceScope" class="checkbox-grid">
            <el-checkbox v-for="item in resourceScopeOptionItems" :key="item.value" :label="item.value">
              {{ item.label }}
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="排课偏好">
          <div class="switch-group">
            <el-switch v-model="formModel.preferContinuousCourse" inline-prompt active-text="连排优先" inactive-text="普通策略" />
            <el-switch v-model="formModel.avoidWeekend" inline-prompt active-text="规避周末" inactive-text="允许周末" />
          </div>
        </el-form-item>
        <el-form-item label="任务备注">
          <el-input v-model="formModel.note" type="textarea" :rows="3" maxlength="120" show-word-limit />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="drawer-footer">
          <el-button @click="formVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm">保存任务</el-button>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts" name="scheduleAuto">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import type { FormInstance, FormRules } from "element-plus";
import type { Schedule } from "@/api/interface/schedule";
import SchedulePageShell from "../components/SchedulePageShell.vue";
import type { AutoTaskFilters } from "./service";
import type { AutoResultView, AutoTaskView } from "./mock";
import {
  createAutoTaskDraft,
  executeAutoTaskById,
  fetchAutoBootstraps,
  fetchAutoTaskResult,
  fetchAutoTasks,
  getConflictTagType,
  getTaskStatusLabel,
  getTaskStatusTagType
} from "./service";

const loading = ref(false);
const detailVisible = ref(false);
const formVisible = ref(false);
const formRef = ref<FormInstance>();
const taskRecords = ref<AutoTaskView[]>([]);
const currentTask = ref<AutoTaskView | null>(null);
const currentResult = ref<AutoResultView | null>(null);
const semesterOptionItems = ref<Schedule.OptionItem[]>([]);
const ruleOptionItems = ref<Schedule.OptionItem[]>([]);
const resourceScopeOptionItems = ref<Schedule.OptionItem[]>([]);
const statusOptionItems = ref<Schedule.OptionItem[]>([]);

const filters = reactive<AutoTaskFilters>({
  status: "",
  semesterId: "",
  keyword: ""
});

const createEmptyForm = () => ({
  taskName: "",
  semesterId: "",
  ruleIds: [] as string[],
  resourceScope: [] as string[],
  preferContinuousCourse: true,
  avoidWeekend: true,
  note: ""
});

const formModel = reactive(createEmptyForm());

const formRules: FormRules<typeof formModel> = {
  taskName: [{ required: true, message: "请输入任务名称", trigger: "blur" }],
  semesterId: [{ required: true, message: "请选择学期", trigger: "change" }],
  ruleIds: [{ required: true, message: "请至少选择一条规则", trigger: "change" }],
  resourceScope: [{ required: true, message: "请至少选择一个资源范围", trigger: "change" }]
};

const stats = computed(() => {
  const failedCount = taskRecords.value.filter(item => item.status === "failed").length;
  const runningCount = taskRecords.value.filter(item => item.status === "running").length;
  const completedCount = taskRecords.value.filter(item => item.status === "completed").length;
  const unresolvedConflicts = taskRecords.value.reduce((sum, item) => sum + item.conflictCount, 0);
  return [
    { label: "任务总数", value: taskRecords.value.length, help: "自动排课执行批次" },
    { label: "运行中", value: runningCount, help: "正在计算的任务" },
    { label: "已完成", value: completedCount, help: "可回看结果摘要" },
    { label: "失败任务", value: failedCount, help: "需要重试或调整规则" },
    { label: "累计冲突", value: unresolvedConflicts, help: "当前列表中的未解冲突总量" }
  ];
});

const resultCards = computed(() => {
  const latest = currentResult.value;
  if (!latest) {
    return [
      { label: "最新完成率", value: "-", help: "打开任务详情后查看结果统计" },
      { label: "已排课程", value: "-", help: "根据任务执行结果实时更新" },
      { label: "未解冲突", value: "-", help: "根据冲突清单回看阻塞点" }
    ];
  }

  return [
    { label: "最新完成率", value: `${latest.successRate}%`, help: latest.taskName },
    { label: "已排课程", value: latest.arrangedCourses, help: latest.semesterName },
    { label: "未解冲突", value: latest.unresolvedConflicts, help: "详情内可查看冲突拆分" }
  ];
});

const loadBootstraps = async () => {
  const bootstrap = await fetchAutoBootstraps();
  semesterOptionItems.value = bootstrap.semesterOptions;
  ruleOptionItems.value = bootstrap.ruleOptions;
  resourceScopeOptionItems.value = bootstrap.resourceScopeOptions;
  statusOptionItems.value = bootstrap.statusOptions;
};

const loadTasks = async () => {
  loading.value = true;
  try {
    taskRecords.value = await fetchAutoTasks(filters);
  } finally {
    loading.value = false;
  }
};

const openDetail = async (task: AutoTaskView) => {
  currentTask.value = task;
  currentResult.value = await fetchAutoTaskResult(task.id);
  detailVisible.value = true;
};

const resetForm = () => {
  Object.assign(formModel, createEmptyForm());
};

const openCreate = () => {
  resetForm();
  formVisible.value = true;
};

const submitForm = async () => {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  const semesterName = semesterOptionItems.value.find(item => item.value === formModel.semesterId)?.label ?? "";
  await createAutoTaskDraft({
    taskName: formModel.taskName.trim(),
    semesterId: formModel.semesterId,
    semesterName,
    ruleIds: [...formModel.ruleIds],
    resourceScope: [...formModel.resourceScope],
    preferContinuousCourse: formModel.preferContinuousCourse,
    avoidWeekend: formModel.avoidWeekend,
    note: formModel.note.trim()
  });

  formVisible.value = false;
  await loadTasks();
  ElMessage.success("自动排课任务已创建");
};

const executeTask = async (task: AutoTaskView) => {
  await executeAutoTaskById(task.id);
  await loadTasks();
  const latest = taskRecords.value.find(item => item.id === task.id);
  if (latest) {
    currentTask.value = latest;
    currentResult.value = await fetchAutoTaskResult(latest.id);
  }
  ElMessage.success(task.status === "failed" ? "任务已重新进入队列" : "任务已开始执行");
};

onMounted(async () => {
  await loadBootstraps();
  await loadTasks();
  if (taskRecords.value[0]) {
    currentTask.value = taskRecords.value[0];
    currentResult.value = await fetchAutoTaskResult(taskRecords.value[0].id);
  }
});
</script>

<style scoped lang="scss">
.schedule-page-view,
.header-actions,
.filter-form {
  display: flex;
  flex-wrap: wrap;
}
.header-actions {
  gap: 12px;
}
.overview-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 18px;
}
.overview-card {
  padding: 16px 18px;
  background: linear-gradient(180deg, #fbfcfe 0%, #f2f7ff 100%);
  border: 1px solid #d8e5f8;
  border-radius: 12px;
}
.overview-card__label {
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  color: #64748b;
}
.overview-card__value {
  display: block;
  margin-bottom: 6px;
  font-size: 24px;
  color: #0f172a;
}
.overview-card p {
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
  color: #64748b;
}
.progress-cell {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.detail-stack {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.detail-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.detail-panel h4 {
  margin: 0;
  font-size: 15px;
  color: #1f2937;
}
.result-grid,
.conflict-grid {
  display: grid;
  gap: 12px;
}
.result-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
.conflict-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
.result-card,
.conflict-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 16px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
}
.result-card span {
  font-size: 13px;
  color: #64748b;
}
.result-card strong,
.conflict-card strong {
  font-size: 22px;
  color: #111827;
}
.task-form {
  padding-right: 12px;
}
.checkbox-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 12px;
}
.switch-group {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}
.drawer-footer {
  display: flex;
  justify-content: flex-end;
}

@media (width <= 1200px) {
  .overview-grid,
  .result-grid,
  .conflict-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (width <= 768px) {
  .overview-grid,
  .result-grid,
  .conflict-grid,
  .checkbox-grid {
    grid-template-columns: 1fr;
  }
}
</style>
