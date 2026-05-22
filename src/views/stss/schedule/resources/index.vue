<template>
  <SchedulePageShell
    v-model="detailVisible"
    title="教学资源"
    description="统一管理教师、教室、课程与班级资源，为后续排课规则和自动排课任务提供基础数据。"
    :tags="['分类切换', '资源列表', '状态展示']"
    :stats="stats"
    content-title="资源清单"
    content-description="统一表格区承载资源台账，并保留详情交互作为后续编辑表单入口。"
    :data-count="filteredRecords.length"
    empty-description="当前筛选条件下没有资源数据。"
    dialog-title="资源详情"
  >
    <template #actions>
      <el-button type="primary">新增资源</el-button>
    </template>

    <template #filters>
      <el-form :inline="true" :model="filters" class="filter-form">
        <el-form-item label="资源分类">
          <el-segmented v-model="filters.category" :options="categorySegments" />
        </el-form-item>
        <el-form-item label="所属部门">
          <el-select v-model="filters.department" placeholder="选择部门" clearable style="width: 220px">
            <el-option v-for="item in departmentOptions" :key="item.value" :label="item.label" :value="item.label" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input v-model="filters.keyword" placeholder="资源名称 / 编号" clearable style="width: 220px" />
        </el-form-item>
      </el-form>
    </template>

    <el-table :data="filteredRecords" border>
      <el-table-column prop="name" label="资源名称" min-width="170" />
      <el-table-column prop="code" label="资源编号" min-width="120" />
      <el-table-column prop="department" label="所属部门" min-width="140" />
      <el-table-column prop="ownerName" label="维护人" min-width="120" />
      <el-table-column label="标签" min-width="180">
        <template #default="{ row }">
          <el-space wrap>
            <el-tag v-for="tag in row.tags" :key="tag" size="small" effect="plain">{{ tag }}</el-tag>
          </el-space>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" min-width="100" />
      <el-table-column prop="updatedAt" label="更新时间" min-width="160" />
      <el-table-column label="操作" width="110" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDetail(row)">详情</el-button>
        </template>
      </el-table-column>
    </el-table>

    <template #detail>
      <el-descriptions v-if="currentRecord" :column="2" border>
        <el-descriptions-item label="资源名称">{{ currentRecord.name }}</el-descriptions-item>
        <el-descriptions-item label="资源编号">{{ currentRecord.code }}</el-descriptions-item>
        <el-descriptions-item label="分类">{{ currentRecord.category }}</el-descriptions-item>
        <el-descriptions-item label="部门">{{ currentRecord.department }}</el-descriptions-item>
        <el-descriptions-item label="维护人">{{ currentRecord.ownerName }}</el-descriptions-item>
        <el-descriptions-item label="容量">{{ currentRecord.capacity ?? "-" }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ currentRecord.status }}</el-descriptions-item>
        <el-descriptions-item label="备注">{{ currentRecord.remark ?? "-" }}</el-descriptions-item>
      </el-descriptions>
    </template>
  </SchedulePageShell>
</template>

<script setup lang="ts" name="scheduleResources">
import { computed, ref } from "vue";
import type { Schedule } from "@/api/interface/schedule";
import SchedulePageShell from "../components/SchedulePageShell.vue";
import { departmentOptions, resourceCategoryOptions, resourceRecords } from "../mock";

const detailVisible = ref(false);
const currentRecord = ref<Schedule.ResourceRecord | null>(null);
const filters = ref({
  category: "teacher",
  department: "",
  keyword: ""
});

const categorySegments = resourceCategoryOptions.map(item => ({ label: item.label, value: item.value }));

const filteredRecords = computed(() =>
  resourceRecords.filter(item => {
    const matchesCategory = !filters.value.category || item.category === filters.value.category;
    const matchesDepartment = !filters.value.department || item.department === filters.value.department;
    const keyword = filters.value.keyword.trim();
    const matchesKeyword = !keyword || [item.name, item.code].some(field => field.includes(keyword));
    return matchesCategory && matchesDepartment && matchesKeyword;
  })
);

const stats = computed(() => [
  { label: "资源总数", value: resourceRecords.length, help: "教师、教室、课程、班级统一纳管" },
  { label: "启用中", value: resourceRecords.filter(item => item.status === "enabled").length, help: "可参与排课" },
  { label: "停用中", value: resourceRecords.filter(item => item.status === "disabled").length, help: "暂不参与编排" },
  { label: "当前列表", value: filteredRecords.value.length, help: "符合筛选条件的资源" }
]);

const openDetail = (record: Schedule.ResourceRecord) => {
  currentRecord.value = record;
  detailVisible.value = true;
};
</script>

<style scoped lang="scss">
.filter-form {
  display: flex;
  flex-wrap: wrap;
}
</style>
