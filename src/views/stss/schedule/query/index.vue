<template>
  <SchedulePageShell
    v-model="detailVisible"
    title="课表查询"
    description="面向教师、学生、班级和教室提供统一的课表检索、周视图核对与排课详情浏览入口。"
    :tags="['查询维度切换', '周视图', '详情弹窗']"
    :stats="stats"
    content-title="课表结果"
    content-description="支持维度切换、筛选查询、结果表格和周课表视图。"
    :data-count="filteredRecords.length"
    empty-description="当前筛选条件下没有课表记录。"
    dialog-title="课表详情"
  >
    <template #actions>
      <el-space wrap>
        <el-button @click="resetFilters">重置条件</el-button>
        <el-button type="primary" @click="exportCurrentView">导出课表</el-button>
      </el-space>
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
        <el-form-item label="查询对象">
          <el-select v-model="filters.targetId" placeholder="选择对象" clearable filterable style="width: 280px">
            <el-option v-for="item in currentTargets" :key="item.id" :label="item.label" :value="item.id">
              <div class="target-option">
                <span>{{ item.label }}</span>
                <small>{{ item.subtitle }}</small>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="周次">
          <el-select v-model="filters.weekLabel" placeholder="选择周次" style="width: 160px">
            <el-option v-for="item in weekOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部状态" clearable style="width: 160px">
            <el-option label="草稿" value="draft" />
            <el-option label="已发布" value="published" />
            <el-option label="调课中" value="adjusting" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input v-model="filters.keyword" placeholder="课程 / 教师 / 教室" clearable style="width: 220px" />
        </el-form-item>
      </el-form>
      <div class="view-switch">
        <el-radio-group v-model="viewMode">
          <el-radio-button label="table">列表视图</el-radio-button>
          <el-radio-button label="week">周课表</el-radio-button>
        </el-radio-group>
      </div>
    </template>

    <el-table v-if="viewMode === 'table'" v-loading="loading" :data="filteredRecords" border>
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
    <WeeklyScheduleBoard v-else :cells="calendarCells" :loading="loading" @select="openDetail" />

    <template #detail>
      <div v-if="currentRecordDetail" class="detail-panel">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="课程">{{ currentRecordDetail.courseName }}</el-descriptions-item>
          <el-descriptions-item label="课程编号">{{ currentRecordDetail.courseCode }}</el-descriptions-item>
          <el-descriptions-item label="教师">{{ currentRecordDetail.teacherName }}</el-descriptions-item>
          <el-descriptions-item label="教师编号">{{ currentRecordDetail.teacherCode }}</el-descriptions-item>
          <el-descriptions-item label="班级">{{ currentRecordDetail.className }}</el-descriptions-item>
          <el-descriptions-item label="班级编号">{{ currentRecordDetail.classCode }}</el-descriptions-item>
          <el-descriptions-item label="教室">{{ currentRecordDetail.classroomName }}</el-descriptions-item>
          <el-descriptions-item label="教室编号">{{ currentRecordDetail.classroomCode }}</el-descriptions-item>
          <el-descriptions-item label="日期">{{ currentRecordDetail.date }}</el-descriptions-item>
          <el-descriptions-item label="周次">{{ currentRecordDetail.weekText }}</el-descriptions-item>
          <el-descriptions-item label="节次">
            {{
              `周${currentRecordDetail.timeSlot.dayOfWeek} ${currentRecordDetail.timeSlot.sectionStart}-${currentRecordDetail.timeSlot.sectionEnd}节`
            }}
          </el-descriptions-item>
          <el-descriptions-item label="状态">{{ currentRecordDetail.status }}</el-descriptions-item>
        </el-descriptions>
        <el-alert :title="currentRecordDetail.remark ?? '暂无备注'" type="info" :closable="false" />
      </div>
    </template>
  </SchedulePageShell>
</template>

<script setup lang="ts" name="scheduleQuery">
import { computed, onMounted, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import type { Schedule } from "@/api/interface/schedule";
import SchedulePageShell from "../components/SchedulePageShell.vue";
import WeeklyScheduleBoard from "./components/WeeklyScheduleBoard.vue";
import {
  getQueryCalendarCells,
  getQueryDimensionOptions,
  getQueryRecordDetail,
  getQueryRecords,
  getQuerySemesterOptions,
  getQueryTargetsByDimension,
  type QueryPageFilters
} from "./service";

const detailVisible = ref(false);
const loading = ref(false);
const semesterOptions = ref<Schedule.OptionItem[]>([]);
const dimensionOptions = ref<Schedule.OptionItem[]>([]);
const currentTargets = ref<
  {
    id: string;
    dimension: Schedule.ScheduleDimension;
    label: string;
    subtitle: string;
  }[]
>([]);
const filteredRecords = ref<Schedule.ScheduleRecord[]>([]);
const calendarCells = ref<
  {
    dayOfWeek: number;
    dayLabel: string;
    records: Schedule.ScheduleRecord[];
  }[]
>([]);
const currentRecordDetail = ref<Schedule.ScheduleDetail | null>(null);
const viewMode = ref<"table" | "week">("table");
const filters = ref<QueryPageFilters>({
  semesterId: "2025-fall",
  dimension: "teacher",
  targetId: "",
  weekLabel: "第 12 周",
  status: "" as "" | Schedule.RecordStatus,
  keyword: ""
});

const weekOptions = ["第 10 周", "第 11 周", "第 12 周", "第 13 周", "第 14 周"];

const dimensionSegments = computed(() => dimensionOptions.value.map(item => ({ label: item.label, value: item.value })));

const loadTargets = async () => {
  currentTargets.value = await getQueryTargetsByDimension(filters.value.dimension);
};

const loadRecords = async () => {
  loading.value = true;
  try {
    filteredRecords.value = await getQueryRecords(filters.value);
    calendarCells.value = await getQueryCalendarCells(filteredRecords.value);
  } finally {
    loading.value = false;
  }
};

const stats = computed(() => [
  { label: "课表记录", value: filteredRecords.value.length, help: "当前视图命中的记录数" },
  { label: "教师数", value: new Set(filteredRecords.value.map(item => item.teacherName)).size, help: "涉及授课教师" },
  { label: "教室数", value: new Set(filteredRecords.value.map(item => item.classroomName)).size, help: "涉及排课教室" },
  { label: "待调整", value: filteredRecords.value.filter(item => item.status === "adjusting").length, help: "存在调课中的课次" }
]);

const loadDetail = async (id: string) => {
  currentRecordDetail.value = await getQueryRecordDetail(id);
};

const resetFilters = async () => {
  filters.value = {
    semesterId: semesterOptions.value[0]?.value ?? "2025-fall",
    dimension: "teacher",
    targetId: "",
    weekLabel: "第 12 周",
    status: "",
    keyword: ""
  };
  await loadTargets();
  await loadRecords();
};

const exportCurrentView = () => {
  ElMessage.success(`已按 ${viewMode.value === "table" ? "列表视图" : "周课表视图"} 生成导出任务。`);
};

const openDetail = async (record: Schedule.ScheduleRecord) => {
  await loadDetail(record.id);
  detailVisible.value = true;
};

watch(
  () => filters.value.dimension,
  async () => {
    filters.value.targetId = "";
    await loadTargets();
    await loadRecords();
  }
);

watch(
  () => [filters.value.semesterId, filters.value.targetId, filters.value.weekLabel, filters.value.status, filters.value.keyword],
  async () => {
    await loadRecords();
  }
);

onMounted(async () => {
  semesterOptions.value = await getQuerySemesterOptions();
  dimensionOptions.value = await getQueryDimensionOptions();
  await loadTargets();
  await loadRecords();
});
</script>

<style scoped lang="scss">
.filter-form {
  display: flex;
  flex-wrap: wrap;
}
.target-option {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.target-option small {
  color: #64748b;
}
.view-switch {
  margin-top: 8px;
}
.detail-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
