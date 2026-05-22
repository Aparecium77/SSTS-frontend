<template>
  <SchedulePageShell
    v-model="detailVisible"
    title="排课规则"
    description="集中配置时间约束、教师冲突、教室容量和连排策略，为排课执行和调课审批建立统一规则口径。"
    :tags="['规则分类', '优先级', '启停状态']"
    :stats="stats"
    content-title="规则列表"
    content-description="统一展示规则优先级、影响范围和启停状态，详情弹窗承接规则条件预览。"
    :data-count="filteredRecords.length"
    empty-description="当前筛选条件下没有规则记录。"
    dialog-title="规则详情"
  >
    <template #actions>
      <el-button type="primary">新增规则</el-button>
    </template>

    <template #filters>
      <el-form :inline="true" :model="filters" class="filter-form">
        <el-form-item label="规则分类">
          <el-segmented v-model="filters.category" :options="categorySegments" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部状态" clearable style="width: 160px">
            <el-option label="启用" value="enabled" />
            <el-option label="停用" value="disabled" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input v-model="filters.keyword" placeholder="规则名称 / 编号" clearable style="width: 220px" />
        </el-form-item>
      </el-form>
    </template>

    <el-table :data="filteredRecords" border>
      <el-table-column prop="name" label="规则名称" min-width="180" />
      <el-table-column prop="code" label="规则编号" min-width="120" />
      <el-table-column prop="scope" label="作用范围" min-width="180" />
      <el-table-column prop="priority" label="优先级" min-width="90" />
      <el-table-column prop="status" label="状态" min-width="90" />
      <el-table-column prop="updatedAt" label="更新时间" min-width="160" />
      <el-table-column label="操作" width="110" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDetail(row)">详情</el-button>
        </template>
      </el-table-column>
    </el-table>

    <template #detail>
      <div v-if="currentRecord" class="detail-stack">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="规则名称">{{ currentRecord.name }}</el-descriptions-item>
          <el-descriptions-item label="规则编号">{{ currentRecord.code }}</el-descriptions-item>
          <el-descriptions-item label="分类">{{ currentRecord.category }}</el-descriptions-item>
          <el-descriptions-item label="优先级">{{ currentRecord.priority }}</el-descriptions-item>
          <el-descriptions-item label="作用范围">{{ currentRecord.scope }}</el-descriptions-item>
          <el-descriptions-item label="状态">{{ currentRecord.status }}</el-descriptions-item>
        </el-descriptions>
        <el-alert :title="currentRecord.description" type="info" :closable="false" />
      </div>
    </template>
  </SchedulePageShell>
</template>

<script setup lang="ts" name="scheduleRules">
import { computed, ref } from "vue";
import type { Schedule } from "@/api/interface/schedule";
import SchedulePageShell from "../components/SchedulePageShell.vue";
import { ruleCategoryOptions, ruleRecords } from "../mock";

const detailVisible = ref(false);
const currentRecord = ref<Schedule.RuleRecord | null>(null);
const filters = ref({
  category: "time",
  status: "",
  keyword: ""
});

const categorySegments = ruleCategoryOptions.map(item => ({ label: item.label, value: item.value }));

const filteredRecords = computed(() =>
  ruleRecords.filter(item => {
    const matchesCategory = !filters.value.category || item.category === filters.value.category;
    const matchesStatus = !filters.value.status || item.status === filters.value.status;
    const keyword = filters.value.keyword.trim();
    const matchesKeyword = !keyword || [item.name, item.code].some(field => field.includes(keyword));
    return matchesCategory && matchesStatus && matchesKeyword;
  })
);

const stats = computed(() => [
  { label: "规则总数", value: ruleRecords.length, help: "统一沉淀排课约束规则" },
  { label: "启用规则", value: ruleRecords.filter(item => item.status === "enabled").length, help: "当前参与排课计算" },
  { label: "高优先级", value: ruleRecords.filter(item => item.priority === 1).length, help: "硬约束或必须满足" },
  { label: "当前列表", value: filteredRecords.value.length, help: "符合筛选条件的规则" }
]);

const openDetail = (record: Schedule.RuleRecord) => {
  currentRecord.value = record;
  detailVisible.value = true;
};
</script>

<style scoped lang="scss">
.filter-form {
  display: flex;
  flex-wrap: wrap;
}
.detail-stack {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
