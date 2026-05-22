<template>
  <SchedulePageShell
    v-model="detailVisible"
    title="手工调课"
    description="用于处理临时调课、冲突检测和审批状态回看，保持与课表查询相同的数据命名和详情结构。"
    :tags="['调课表单', '冲突检测', '审批状态']"
    :stats="stats"
    content-title="调课申请"
    content-description="统一表格展示申请单，详情弹窗承接冲突提示和目标时段确认。"
    :data-count="adjustmentRecords.length"
    empty-description="暂无调课申请记录。"
    dialog-title="调课详情"
  >
    <template #actions>
      <el-button type="primary">发起调课</el-button>
    </template>

    <template #filters>
      <el-alert
        title="当前阶段使用本地 mock 数据模拟冲突检测结果，后续直接接入 detectAdjustmentConflicts 接口壳子。"
        type="success"
        :closable="false"
      />
    </template>

    <el-table :data="adjustmentRecords" border>
      <el-table-column prop="courseName" label="课程" min-width="160" />
      <el-table-column prop="originSlot" label="原课时段" min-width="220" />
      <el-table-column prop="targetSlot" label="目标时段" min-width="220" />
      <el-table-column prop="applicant" label="申请人" min-width="120" />
      <el-table-column prop="status" label="审批状态" min-width="110" />
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
          <el-descriptions-item label="审批状态">{{ currentRecord.status }}</el-descriptions-item>
        </el-descriptions>
        <el-alert
          v-for="item in conflictRecords"
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
import { computed, ref } from "vue";
import type { Schedule } from "@/api/interface/schedule";
import SchedulePageShell from "../components/SchedulePageShell.vue";
import { adjustmentRecords, conflictRecords } from "../mock";

const detailVisible = ref(false);
const currentRecord = ref<Schedule.AdjustmentRecord | null>(null);

const stats = computed(() => [
  { label: "申请总数", value: adjustmentRecords.length, help: "当前周期内的调课申请" },
  { label: "待审批", value: adjustmentRecords.filter(item => item.status === "pending").length, help: "待教务确认" },
  { label: "已通过", value: adjustmentRecords.filter(item => item.status === "approved").length, help: "已调整到目标时段" },
  { label: "冲突提示", value: conflictRecords.length, help: "模拟冲突检测返回条数" }
]);

const openDetail = (record: Schedule.AdjustmentRecord) => {
  currentRecord.value = record;
  detailVisible.value = true;
};
</script>

<style scoped lang="scss">
.detail-stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
