<template>
  <SchedulePageShell
    v-model="detailVisible"
    title="自动排课"
    description="统一承接自动排课任务配置、执行进度和结果摘要，延续共享状态命名与统计卡样式。"
    :tags="['任务队列', '执行进度', '结果摘要']"
    :stats="stats"
    content-title="任务列表"
    content-description="列表区关注任务状态和进度，详情弹窗展示当前任务摘要与未解决冲突。"
    :data-count="autoTaskRecords.length"
    empty-description="暂无自动排课任务。"
    dialog-title="任务结果"
  >
    <template #actions>
      <el-button type="primary">创建任务</el-button>
    </template>

    <template #filters>
      <el-alert
        title="结果统计与冲突摘要已统一落在 mock.ts，后续可直接接入 createAutoTask、executeAutoTask 和 getAutoTaskResult。"
        type="success"
        :closable="false"
      />
    </template>

    <el-table :data="autoTaskRecords" border>
      <el-table-column prop="taskName" label="任务名称" min-width="180" />
      <el-table-column prop="semesterName" label="学期" min-width="200" />
      <el-table-column prop="createdBy" label="创建人" min-width="120" />
      <el-table-column prop="status" label="状态" min-width="100" />
      <el-table-column label="执行进度" min-width="180">
        <template #default="{ row }">
          <el-progress :percentage="row.progress.percent" :stroke-width="12" />
        </template>
      </el-table-column>
      <el-table-column prop="conflictCount" label="冲突数" min-width="90" />
      <el-table-column label="操作" width="110" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDetail(row)">详情</el-button>
        </template>
      </el-table-column>
    </el-table>

    <template #detail>
      <div class="detail-stack">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="任务名称">{{ currentRecord?.taskName }}</el-descriptions-item>
          <el-descriptions-item label="处理进度">
            {{ `${currentRecord?.progress.processed ?? 0} / ${currentRecord?.progress.total ?? 0}` }}
          </el-descriptions-item>
          <el-descriptions-item label="结果生成时间">{{ autoTaskResult.generatedAt }}</el-descriptions-item>
        </el-descriptions>
        <el-timeline>
          <el-timeline-item v-for="item in autoTaskResult.summary" :key="item" type="primary">
            {{ item }}
          </el-timeline-item>
        </el-timeline>
      </div>
    </template>
  </SchedulePageShell>
</template>

<script setup lang="ts" name="scheduleAuto">
import { computed, ref } from "vue";
import type { Schedule } from "@/api/interface/schedule";
import SchedulePageShell from "../components/SchedulePageShell.vue";
import { autoTaskRecords, autoTaskResult } from "../mock";

const detailVisible = ref(false);
const currentRecord = ref<Schedule.AutoTaskRecord | null>(autoTaskRecords[0] ?? null);

const stats = computed(() => [
  { label: "任务总数", value: autoTaskRecords.length, help: "自动排课执行批次" },
  { label: "运行中", value: autoTaskRecords.filter(item => item.status === "running").length, help: "正在计算的任务" },
  { label: "已完成", value: autoTaskRecords.filter(item => item.status === "completed").length, help: "可回看结果摘要" },
  { label: "未解冲突", value: autoTaskResult.unresolvedConflicts, help: "当前示例任务的剩余冲突" }
]);

const openDetail = (record: Schedule.AutoTaskRecord) => {
  currentRecord.value = record;
  detailVisible.value = true;
};
</script>

<style scoped lang="scss">
.detail-stack {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
