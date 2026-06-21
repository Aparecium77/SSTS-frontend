<template>
  <SchedulePageShell
    v-model="detailVisible"
    title="手工调课"
    description="用于处理临时调课、冲突检测和审批状态回看。"
    :tags="['调课表单', '冲突检测', '审批状态']"
    :stats="stats"
    content-title="调课申请"
    content-description="当前阶段已补齐当前课表、课程选择、调课表单、冲突预警、调课预览和审批记录。"
    :data-count="adjustmentRecords.length"
    empty-description="暂无调课申请记录。"
    dialog-title="调课详情"
  >
    <template #actions>
      <el-space wrap>
        <el-button @click="resetForm">重置表单</el-button>
        <el-button type="primary" @click="submitAdjustment">提交调课</el-button>
      </el-space>
    </template>

    <template #filters>
      <div class="manual-layout">
        <section class="manual-panel">
          <div class="panel-header">
            <div>
              <h4>当前课表</h4>
              <p>用于快速锁定需要调课的课程安排。</p>
            </div>
          </div>
          <ManualScheduleBoard :records="currentSchedules" @select="handleScheduleSelect" />
        </section>

        <section class="manual-panel">
          <div class="panel-header">
            <div>
              <h4>调课申请表单</h4>
              <p>先选择课程，再填写目标时段和教室，随后执行冲突检测。</p>
            </div>
          </div>

          <el-form label-width="100px" class="manual-form">
            <el-form-item label="待调课程">
              <el-select
                v-model="form.scheduleId"
                placeholder="选择课程"
                filterable
                style="width: 100%"
                @change="handleCourseChange"
              >
                <el-option v-for="item in courseOptions" :key="item.id" :label="item.courseName" :value="item.id">
                  <div class="option-card">
                    <span>{{ `${item.courseName} / ${item.teacherName}` }}</span>
                    <small>{{ item.currentSlot }}</small>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="调课原因">
              <el-input v-model="form.reason" type="textarea" :rows="3" placeholder="请输入调课原因" />
            </el-form-item>
            <el-form-item label="目标日期">
              <el-date-picker v-model="form.targetDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
            <el-form-item label="目标星期">
              <el-select v-model="form.targetDayOfWeek" style="width: 100%">
                <el-option v-for="day in dayOptions" :key="day.value" :label="day.label" :value="day.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="目标节次">
              <div class="inline-fields">
                <el-input-number v-model="form.targetSectionStart" :min="1" :max="10" />
                <span>至</span>
                <el-input-number v-model="form.targetSectionEnd" :min="1" :max="10" />
              </div>
            </el-form-item>
            <el-form-item label="目标教室">
              <el-input v-model="form.targetClassroomId" placeholder="输入目标教室编号或名称" />
            </el-form-item>
            <el-form-item>
              <el-space wrap>
                <el-button type="warning" @click="detectConflicts">冲突检测</el-button>
                <el-button @click="loadPreview">生成预览</el-button>
              </el-space>
            </el-form-item>
          </el-form>
        </section>
      </div>

      <div class="manual-layout">
        <section class="manual-panel">
          <div class="panel-header">
            <div>
              <h4>冲突检测结果</h4>
              <p>展示当前调课方案的冲突检测结果。</p>
            </div>
          </div>
          <el-empty v-if="!conflicts.length" description="当前方案未发现冲突" />
          <div v-else class="alert-stack">
            <el-alert
              v-for="item in conflicts"
              :key="item.id"
              :title="item.title"
              :description="`${item.relatedEntity}：${item.message}`"
              :type="item.level === 'high' ? 'error' : item.level === 'medium' ? 'warning' : 'info'"
              :closable="false"
            />
          </div>
        </section>

        <section class="manual-panel">
          <div class="panel-header">
            <div>
              <h4>调课后预览</h4>
              <p>用于对比原时段和目标时段，辅助审批判断。</p>
            </div>
          </div>
          <el-table :data="previewRecords" border>
            <el-table-column prop="courseName" label="课程" min-width="140" />
            <el-table-column prop="beforeSlot" label="调整前" min-width="210" />
            <el-table-column prop="afterSlot" label="调整后" min-width="210" />
            <el-table-column prop="effectSummary" label="影响说明" min-width="220" />
          </el-table>
        </section>
      </div>

      <section class="manual-panel">
        <div class="panel-header panel-header--inline">
          <div>
            <h4>审批记录</h4>
            <p>统一列表展示调课申请的提交、审批与结果回看。</p>
          </div>
          <el-form :inline="true" class="record-filters">
            <el-form-item label="状态">
              <el-select v-model="recordFilters.status" style="width: 140px">
                <el-option v-for="item in approvalOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="关键词">
              <el-input v-model="recordFilters.keyword" placeholder="课程 / 申请人" clearable style="width: 220px" />
            </el-form-item>
          </el-form>
        </div>
      </section>
    </template>

    <el-table :data="adjustmentRecords" border>
      <el-table-column prop="courseName" label="课程" min-width="160" />
      <el-table-column prop="originSlot" label="原课时段" min-width="220" />
      <el-table-column prop="targetSlot" label="目标时段" min-width="220" />
      <el-table-column prop="applicant" label="申请人" min-width="120" />
      <el-table-column label="审批状态" min-width="110">
        <template #default="{ row }">
          <el-tag :type="statusTagMap[row.status]">
            {{ statusLabelMap[row.status] }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="submittedAt" label="提交时间" min-width="160" />
      <el-table-column label="操作" width="110" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDetail(row)">详情</el-button>
        </template>
      </el-table-column>
    </el-table>

    <template #detail>
      <div v-if="currentRecord" class="detail-stack">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="课程">{{ currentRecord.courseName }}</el-descriptions-item>
          <el-descriptions-item label="原课时段">{{ currentRecord.originSlot }}</el-descriptions-item>
          <el-descriptions-item label="目标时段">{{ currentRecord.targetSlot }}</el-descriptions-item>
          <el-descriptions-item label="审批状态">{{ statusLabelMap[currentRecord.status] }}</el-descriptions-item>
        </el-descriptions>
        <el-alert
          v-for="item in conflicts"
          :key="item.id"
          :title="item.title"
          :description="`${item.relatedEntity}：${item.message}`"
          :type="item.level === 'high' ? 'error' : item.level === 'medium' ? 'warning' : 'info'"
          :closable="false"
        />
      </div>
    </template>
  </SchedulePageShell>
</template>

<script setup lang="ts" name="scheduleManual">
import { computed, onMounted, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import type { Schedule } from "@/api/interface/schedule";
import SchedulePageShell from "../components/SchedulePageShell.vue";
import ManualScheduleBoard from "./components/ManualScheduleBoard.vue";
import type { ManualCourseOption, ManualPreviewRecord } from "./mock";
import {
  getManualAdjustmentRecords,
  getManualApprovalOptions,
  getManualConflicts,
  getManualCourseOptions,
  getManualCurrentSchedules,
  getManualDefaultForm,
  getManualPreviewRecords,
  submitManualAdjustment,
  type ManualPageFilters
} from "./service";

const detailVisible = ref(false);
const approvalOptions = ref<{ label: string; value: Schedule.AdjustmentStatus | "all" }[]>([]);
const courseOptions = ref<ManualCourseOption[]>([]);
const currentSchedules = ref<Schedule.ScheduleRecord[]>([]);
const adjustmentRecords = ref<Schedule.AdjustmentRecord[]>([]);
const conflicts = ref<Schedule.ConflictRecord[]>([]);
const previewRecords = ref<ManualPreviewRecord[]>([]);
const form = ref<Schedule.AdjustmentForm>({
  scheduleId: "",
  reason: "",
  targetDate: "",
  targetDayOfWeek: 1,
  targetSectionStart: 1,
  targetSectionEnd: 2,
  targetClassroomId: ""
});
const dayOptions = [
  { label: "周一", value: 1 },
  { label: "周二", value: 2 },
  { label: "周三", value: 3 },
  { label: "周四", value: 4 },
  { label: "周五", value: 5 },
  { label: "周六", value: 6 },
  { label: "周日", value: 7 }
] as const;
const recordFilters = ref<ManualPageFilters>({
  keyword: "",
  status: "all"
});
const currentRecord = ref<Schedule.AdjustmentRecord | null>(null);

const statusTagMap: Record<Schedule.AdjustmentStatus, "warning" | "success" | "danger"> = {
  pending: "warning",
  approved: "success",
  rejected: "danger"
};

const statusLabelMap: Record<Schedule.AdjustmentStatus, string> = {
  pending: "待审批",
  approved: "已通过",
  rejected: "已驳回"
};

const loadAdjustmentRecords = async () => {
  adjustmentRecords.value = await getManualAdjustmentRecords(recordFilters.value);
};

const loadPreview = async () => {
  previewRecords.value = await getManualPreviewRecords(form.value.scheduleId);
};

const detectConflicts = async () => {
  conflicts.value = await getManualConflicts(form.value);
  ElMessage.success(conflicts.value.length ? "已返回冲突检测结果。" : "当前调课方案未发现冲突。");
};

const handleScheduleSelect = async (record: Schedule.ScheduleRecord) => {
  form.value.scheduleId = record.id;
  await loadPreview();
};

const handleCourseChange = async (scheduleId: string) => {
  form.value.scheduleId = scheduleId;
  await loadPreview();
};

const resetForm = async () => {
  form.value = await getManualDefaultForm();
  conflicts.value = [];
  await loadPreview();
};

const submitAdjustment = async () => {
  const result = await submitManualAdjustment(form.value);
  ElMessage.success(result.message);
  await loadAdjustmentRecords();
};

const stats = computed(() => [
  { label: "申请总数", value: adjustmentRecords.value.length, help: "当前周期内的调课申请" },
  { label: "待审批", value: adjustmentRecords.value.filter(item => item.status === "pending").length, help: "待教务确认" },
  { label: "已通过", value: adjustmentRecords.value.filter(item => item.status === "approved").length, help: "已调整到目标时段" },
  { label: "冲突提示", value: conflicts.value.length, help: "当前方案冲突检测结果" }
]);

const openDetail = (record: Schedule.AdjustmentRecord) => {
  currentRecord.value = record;
  detailVisible.value = true;
};

watch(
  () => [recordFilters.value.keyword, recordFilters.value.status],
  async () => {
    await loadAdjustmentRecords();
  }
);

onMounted(async () => {
  approvalOptions.value = await getManualApprovalOptions();
  courseOptions.value = await getManualCourseOptions();
  currentSchedules.value = await getManualCurrentSchedules();
  form.value = await getManualDefaultForm();
  await loadAdjustmentRecords();
  await loadPreview();
});
</script>

<style scoped lang="scss">
.manual-layout {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}
.manual-panel {
  padding: 20px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
}
.panel-header {
  margin-bottom: 16px;
}
.panel-header--inline {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  justify-content: space-between;
}
.panel-header h4 {
  margin: 0 0 6px;
  font-size: 17px;
  color: #0f172a;
}
.panel-header p {
  margin: 0;
  color: #64748b;
}
.manual-form {
  margin-top: 8px;
}
.inline-fields {
  display: flex;
  gap: 12px;
  align-items: center;
}
.option-card {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.option-card small {
  color: #64748b;
}
.alert-stack,
.detail-stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.record-filters {
  flex-wrap: wrap;
}

@media (width <= 1100px) {
  .manual-layout {
    grid-template-columns: 1fr;
  }
  .panel-header--inline {
    flex-direction: column;
  }
}
</style>
