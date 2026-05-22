<template>
  <SchedulePageShell
    v-model="detailVisible"
    title="课表查询"
    description="面向教师、学生、班级和教室提供统一的课表检索、周视图核对与排课详情浏览入口。"
    :tags="['共享筛选区', '本地 Mock', '详情弹窗']"
    :stats="stats"
    content-title="课表结果"
    content-description="采用统一表格样式承载查询结果，后续可平滑切换到周课表或日课表视图。"
    :data-count="filteredRecords.length"
    empty-description="当前筛选条件下没有课表记录。"
    dialog-title="课表详情"
  >
    <template #actions>
      <el-button type="primary">导出课表</el-button>
    </template>

    <template #filters>
      <el-form :inline="true" :model="filters" class="filter-form">
        <el-form-item label="学期">
          <el-select v-model="filters.semesterId" placeholder="选择学期" style="width: 240px">
            <el-option v-for="item in semesterOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="查询维度">
          <el-segmented v-model="filters.dimension" :options="dimensionSegments" />
        </el-form-item>
        <el-form-item label="关键词">
          <el-input v-model="filters.keyword" placeholder="课程 / 教师 / 教室" clearable style="width: 220px" />
        </el-form-item>
      </el-form>
    </template>

    <el-table :data="filteredRecords" border>
      <el-table-column prop="courseName" label="课程" min-width="160" />
      <el-table-column prop="teacherName" label="教师" min-width="120" />
      <el-table-column prop="className" label="班级" min-width="180" />
      <el-table-column prop="classroomName" label="教室" min-width="160" />
      <el-table-column prop="weekText" label="周次" min-width="100" />
      <el-table-column label="节次" min-width="140">
        <template #default="{ row }">
          {{ `周${row.timeSlot.dayOfWeek} ${row.timeSlot.sectionStart}-${row.timeSlot.sectionEnd}节` }}
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" min-width="110" />
      <el-table-column label="操作" width="110" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDetail(row)">详情</el-button>
        </template>
      </el-table-column>
    </el-table>

    <template #detail>
      <el-descriptions v-if="currentRecord" :column="2" border>
        <el-descriptions-item label="课程">{{ currentRecord.courseName }}</el-descriptions-item>
        <el-descriptions-item label="课程编号">{{ currentRecord.courseCode }}</el-descriptions-item>
        <el-descriptions-item label="教师">{{ currentRecord.teacherName }}</el-descriptions-item>
        <el-descriptions-item label="班级">{{ currentRecord.className }}</el-descriptions-item>
        <el-descriptions-item label="教室">{{ currentRecord.classroomName }}</el-descriptions-item>
        <el-descriptions-item label="上课时间">{{ currentRecord.timeSlot.timeRange }}</el-descriptions-item>
        <el-descriptions-item label="日期">{{ currentRecord.date }}</el-descriptions-item>
        <el-descriptions-item label="周次">{{ currentRecord.weekText }}</el-descriptions-item>
      </el-descriptions>
    </template>
  </SchedulePageShell>
</template>

<script setup lang="ts" name="scheduleQuery">
import { computed, ref } from "vue";
import type { Schedule } from "@/api/interface/schedule";
import SchedulePageShell from "../components/SchedulePageShell.vue";
import { dimensionOptions, scheduleRecords, semesterOptions } from "../mock";

const detailVisible = ref(false);
const currentRecord = ref<Schedule.ScheduleRecord | null>(null);
const filters = ref({
  semesterId: semesterOptions[0]?.value ?? "",
  dimension: "teacher",
  keyword: ""
});

const dimensionSegments = dimensionOptions.map(item => ({ label: item.label, value: item.value }));

const filteredRecords = computed(() =>
  scheduleRecords.filter(item => {
    const matchesSemester = !filters.value.semesterId || item.semesterId === filters.value.semesterId;
    const keyword = filters.value.keyword.trim();
    const matchesKeyword =
      !keyword || [item.courseName, item.teacherName, item.className, item.classroomName].some(field => field.includes(keyword));
    return matchesSemester && matchesKeyword;
  })
);

const stats = computed(() => [
  { label: "课表记录", value: filteredRecords.value.length, help: "当前视图命中的记录数" },
  { label: "教师数", value: new Set(filteredRecords.value.map(item => item.teacherName)).size, help: "涉及授课教师" },
  { label: "教室数", value: new Set(filteredRecords.value.map(item => item.classroomName)).size, help: "涉及排课教室" },
  { label: "待调整", value: filteredRecords.value.filter(item => item.status === "adjusting").length, help: "存在调课中的课次" }
]);

const openDetail = (record: Schedule.ScheduleRecord) => {
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
