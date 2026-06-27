<template>
  <SchedulePageShell
    v-model="detailVisible"
    title="课表查询"
    description="按学期查询排课结果，支持教师、课程和开课班过滤，并提供列表与周视图。"
    :tags="['真实课表条目', '周视图', '详情弹窗']"
    :stats="stats"
    content-title="课表结果"
    content-description="数据来自 /api/v1/schedule/entries；教师个人课表可使用教师 ID 与周次筛选。"
    :data-count="entryViews.length"
    empty-description="当前筛选条件下没有课表记录。"
    dialog-title="课表详情"
  >
    <template #actions>
      <el-space wrap>
        <el-button @click="resetFilters">重置条件</el-button>
        <el-button type="primary" :loading="loading" @click="loadEntries">查询</el-button>
      </el-space>
    </template>

    <template #filters>
      <el-form :inline="true" :model="filters" class="filter-form">
        <el-form-item label="学期" required>
          <el-input v-model="filters.semester" placeholder="例如 2026-FALL" clearable style="width: 220px" />
        </el-form-item>
        <el-form-item label="教师 ID">
          <el-input v-model="filters.teacher_id" clearable placeholder="例如 T001" style="width: 180px" />
        </el-form-item>
        <el-form-item label="课程 ID">
          <el-input v-model="filters.course_id" clearable placeholder="课程 ID" style="width: 180px" />
        </el-form-item>
        <el-form-item label="开课班 ID">
          <el-input v-model="filters.offering_id" clearable placeholder="开课班 ID" style="width: 180px" />
        </el-form-item>
        <el-form-item label="周次">
          <el-input-number v-model="filters.week" :min="1" :max="16" controls-position="right" />
        </el-form-item>
      </el-form>
      <div class="view-switch">
        <el-radio-group v-model="viewMode">
          <el-radio-button label="table">列表视图</el-radio-button>
          <el-radio-button label="week">周视图</el-radio-button>
        </el-radio-group>
      </div>
    </template>

    <el-table v-if="viewMode === 'table'" v-loading="loading" :data="entryViews" border>
      <el-table-column prop="course" label="课程" min-width="170" />
      <el-table-column label="课程 ID" min-width="120">
        <template #default="{ row }">{{ row.entry.course_id }}</template>
      </el-table-column>
      <el-table-column prop="teachers" label="教师" min-width="150" />
      <el-table-column label="开课班" min-width="140">
        <template #default="{ row }">{{ row.entry.offering_id }}</template>
      </el-table-column>
      <el-table-column prop="classroom" label="教室" min-width="160" />
      <el-table-column prop="timeText" label="时间" min-width="240" />
      <el-table-column label="操作" width="100" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDetail(row)">详情</el-button>
        </template>
      </el-table-column>
    </el-table>
    <WeeklyScheduleBoard v-else :cells="calendarCells" :loading="loading" @select="openDetail" />

    <template #detail>
      <div v-if="currentEntry" class="detail-panel">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="条目 ID">{{ currentEntry.entry.id }}</el-descriptions-item>
          <el-descriptions-item label="学期">{{ currentEntry.entry.semester }}</el-descriptions-item>
          <el-descriptions-item label="课程">{{ currentEntry.course }}</el-descriptions-item>
          <el-descriptions-item label="课程 ID">{{ currentEntry.entry.course_id }}</el-descriptions-item>
          <el-descriptions-item label="课程编号">{{ currentEntry.entry.course_code || "-" }}</el-descriptions-item>
          <el-descriptions-item label="开课班 ID">{{ currentEntry.entry.offering_id }}</el-descriptions-item>
          <el-descriptions-item label="教师 IDs">{{ currentEntry.teachers }}</el-descriptions-item>
          <el-descriptions-item label="教室">{{ currentEntry.classroom }}</el-descriptions-item>
          <el-descriptions-item label="教室 ID">{{ currentEntry.entry.classroom_id }}</el-descriptions-item>
          <el-descriptions-item label="星期">{{ getDayLabel(currentEntry.entry.day_of_week) }}</el-descriptions-item>
          <el-descriptions-item label="节次">{{
            formatSections(currentEntry.entry.slot_start, currentEntry.entry.slot_end)
          }}</el-descriptions-item>
          <el-descriptions-item label="周次">
            {{ formatWeeks(currentEntry.entry.week_start, currentEntry.entry.week_end, currentEntry.entry.week_parity) }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </template>
  </SchedulePageShell>
</template>

<script setup lang="ts" name="scheduleQuery">
import { computed, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import type { Schedule } from "@/api/interface/schedule";
import { getClassrooms, getScheduleEntries } from "@/api/modules/schedule";
import SchedulePageShell from "../components/SchedulePageShell.vue";
import WeeklyScheduleBoard from "./components/WeeklyScheduleBoard.vue";
import type { QueryEntryView } from "./types";
import {
  activeInWeek,
  dayOptions,
  formatCourse,
  formatEntryTime,
  formatSections,
  formatTeachers,
  formatWeeks,
  getDayLabel
} from "../utils";

const loading = ref(false);
const detailVisible = ref(false);
const viewMode = ref<"table" | "week">("table");
const entries = ref<Schedule.ScheduleEntry[]>([]);
const classrooms = ref<Schedule.Classroom[]>([]);
const currentEntry = ref<QueryEntryView | null>(null);

const filters = reactive<{
  semester: string;
  teacher_id: string;
  course_id: string;
  offering_id: string;
  week: number | undefined;
}>({
  semester: "2026-FALL",
  teacher_id: "",
  course_id: "",
  offering_id: "",
  week: undefined
});

const classroomMap = computed(() => new Map(classrooms.value.map(item => [item.id, item])));

const toView = (entry: Schedule.ScheduleEntry): QueryEntryView => {
  const classroom = classroomMap.value.get(entry.classroom_id);
  return {
    entry,
    course: formatCourse(entry),
    teachers: formatTeachers(entry.teacher_ids),
    classroom: classroom ? `${classroom.name}（${classroom.code}）` : `教室 ID ${entry.classroom_id}`,
    timeText: formatEntryTime(entry)
  };
};

const entryViews = computed(() => entries.value.filter(entry => activeInWeek(entry, filters.week)).map(toView));

const calendarCells = computed(() =>
  dayOptions.map(day => ({
    dayOfWeek: day.value,
    dayLabel: day.label,
    records: entryViews.value.filter(item => item.entry.day_of_week === day.value)
  }))
);

const stats = computed(() => [
  { label: "课表记录", value: entryViews.value.length, help: "当前筛选命中的条目" },
  { label: "教师数", value: new Set(entryViews.value.flatMap(item => item.entry.teacher_ids)).size, help: "涉及教师 ID 数量" },
  { label: "教室数", value: new Set(entryViews.value.map(item => item.entry.classroom_id)).size, help: "涉及教室数量" },
  { label: "课程数", value: new Set(entryViews.value.map(item => item.entry.course_id)).size, help: "涉及课程数量" }
]);

const loadClassroomLookup = async () => {
  const { data } = await getClassrooms({ limit: 1000 });
  classrooms.value = data;
};

const loadEntries = async () => {
  if (!filters.semester.trim()) {
    ElMessage.warning("请输入学期");
    return;
  }
  loading.value = true;
  try {
    const { data } = await getScheduleEntries({
      semester: filters.semester.trim(),
      teacher_id: filters.teacher_id.trim() || undefined,
      course_id: filters.course_id.trim() || undefined,
      offering_id: filters.offering_id.trim() || undefined
    });
    entries.value = data;
  } finally {
    loading.value = false;
  }
};

const resetFilters = async () => {
  filters.semester = "2026-FALL";
  filters.teacher_id = "";
  filters.course_id = "";
  filters.offering_id = "";
  filters.week = undefined;
  await loadEntries();
};

const openDetail = (record: QueryEntryView) => {
  currentEntry.value = record;
  detailVisible.value = true;
};

void loadClassroomLookup().finally(loadEntries);
</script>

<style scoped lang="scss">
.filter-form {
  display: flex;
  flex-wrap: wrap;
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
