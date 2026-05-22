<template>
  <SchedulePageShell
    v-model="detailVisible"
    title="课表发布"
    description="负责课表版本发布、目标范围确认与回滚记录管理，统一承接发布状态和版本号命名。"
    :tags="['版本管理', '发布确认', '回滚记录']"
    :stats="stats"
    content-title="发布记录"
    content-description="统一列表展示发布时间、发布状态和目标范围，详情弹窗用于二次确认或回滚说明。"
    :data-count="publishRecords.length"
    empty-description="暂无课表发布记录。"
    dialog-title="发布详情"
  >
    <template #actions>
      <el-button type="primary">发布新版本</el-button>
    </template>

    <template #filters>
      <el-alert
        title="当前页面采用统一列表 + 详情模式，后续将发布确认弹窗复用到 createPublishRecord 和 rollbackPublishRecord。"
        type="info"
        :closable="false"
      />
    </template>

    <el-table :data="publishRecords" border>
      <el-table-column prop="version" label="版本号" min-width="150" />
      <el-table-column prop="semesterName" label="学期" min-width="200" />
      <el-table-column prop="targetScope" label="发布范围" min-width="120" />
      <el-table-column prop="publishedBy" label="发布人" min-width="120" />
      <el-table-column prop="publishedAt" label="发布时间" min-width="170" />
      <el-table-column prop="status" label="状态" min-width="110" />
      <el-table-column label="操作" width="110" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDetail(row)">详情</el-button>
        </template>
      </el-table-column>
    </el-table>

    <template #detail>
      <el-descriptions v-if="currentRecord" :column="1" border>
        <el-descriptions-item label="版本号">{{ currentRecord.version }}</el-descriptions-item>
        <el-descriptions-item label="学期">{{ currentRecord.semesterName }}</el-descriptions-item>
        <el-descriptions-item label="发布范围">{{ currentRecord.targetScope }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ currentRecord.status }}</el-descriptions-item>
        <el-descriptions-item label="备注">{{ currentRecord.note ?? "无" }}</el-descriptions-item>
      </el-descriptions>
    </template>
  </SchedulePageShell>
</template>

<script setup lang="ts" name="schedulePublish">
import { computed, ref } from "vue";
import type { Schedule } from "@/api/interface/schedule";
import SchedulePageShell from "../components/SchedulePageShell.vue";
import { publishRecords } from "../mock";

const detailVisible = ref(false);
const currentRecord = ref<Schedule.PublishRecord | null>(null);

const stats = computed(() => [
  { label: "版本数", value: publishRecords.length, help: "保留发布和回滚历史" },
  { label: "已发布", value: publishRecords.filter(item => item.status === "published").length, help: "当前有效版本" },
  { label: "已回滚", value: publishRecords.filter(item => item.status === "rolledBack").length, help: "用于追踪回滚原因" },
  { label: "全校发布", value: publishRecords.filter(item => item.targetScope === "全校").length, help: "全量发布次数" }
]);

const openDetail = (record: Schedule.PublishRecord) => {
  currentRecord.value = record;
  detailVisible.value = true;
};
</script>
