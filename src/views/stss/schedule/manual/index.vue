<template>
  <SchedulePageShell
    v-model="detailVisible"
    title="手工调课"
    description="选择已有课表条目，提交换教师、换教室、换星期、换节次或换周次的手工调整。"
    :tags="['基础校验', '直接保存', '以后端结果为准']"
    :stats="stats"
    content-title="可调课表"
    content-description="后端当前不做冲突校验，前端只做基础表单校验；实际排课结果以保存后的查询结果为准。"
    :data-count="entryViews.length"
    empty-description="当前学期没有可调课表条目。"
    dialog-title="调课结果"
  >
    <template #actions>
      <el-space wrap>
        <el-button @click="resetForm">重置表单</el-button>
        <el-button :loading="loading" @click="loadEntries">刷新课表</el-button>
        <el-button type="primary" :loading="saving" @click="submitAdjustment">保存调课</el-button>
      </el-space>
    </template>

    <template #filters>
      <el-alert
        title="当前版本不提供服务端冲突检测，提交后请回到课表查询页确认最终落库结果。"
        type="info"
        :closable="false"
        show-icon
      />
      <div class="manual-layout">
        <section class="manual-panel">
          <div class="panel-header">
            <h4>查询课表</h4>
          </div>
          <el-form label-width="96px" class="manual-form">
            <el-form-item label="学期" required>
              <el-input v-model="filters.semester" placeholder="例如 2026-FALL" />
            </el-form-item>
            <el-form-item label="教师 ID">
              <el-input v-model="filters.teacher_id" clearable />
            </el-form-item>
            <el-form-item label="课程 ID">
              <el-input v-model="filters.course_id" clearable />
            </el-form-item>
            <el-form-item label="开课班 ID">
              <el-input v-model="filters.offering_id" clearable />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="loading" @click="loadEntries">查询</el-button>
            </el-form-item>
          </el-form>
        </section>

        <section class="manual-panel">
          <div class="panel-header">
            <h4>调课目标</h4>
          </div>
          <el-form label-width="110px" class="manual-form">
            <el-form-item label="课表条目" required>
              <el-select
                v-model="form.entry_id"
                filterable
                placeholder="选择待调整条目"
                style="width: 100%"
                @change="handleEntryChange"
              >
                <el-option
                  v-for="item in entryViews"
                  :key="item.entry.id"
                  :label="`${item.course} / ${item.timeText}`"
                  :value="item.entry.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="新教师 IDs">
              <el-input v-model="teacherIdsText" clearable placeholder="多个教师用英文逗号分隔；留空不调整" />
            </el-form-item>
            <el-form-item label="新教室">
              <el-select v-model="form.new_classroom_id" clearable filterable placeholder="不调整" style="width: 100%">
                <el-option
                  v-for="room in activeClassrooms"
                  :key="room.id"
                  :label="`${room.name}（${room.code} / ${room.capacity}人）`"
                  :value="room.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="新星期">
              <el-select v-model="form.new_day_of_week" clearable placeholder="不调整" style="width: 100%">
                <el-option v-for="item in dayOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="新节次">
              <div class="inline-fields">
                <el-select v-model="form.new_slot_start" clearable placeholder="开始" style="width: 120px">
                  <el-option v-for="item in sectionOptions" :key="item" :label="`${item}节`" :value="item" />
                </el-select>
                <span>至</span>
                <el-select v-model="form.new_slot_end" clearable placeholder="结束" style="width: 120px">
                  <el-option v-for="item in sectionOptions" :key="item" :label="`${item}节`" :value="item" />
                </el-select>
              </div>
            </el-form-item>
            <el-form-item label="新周次">
              <div class="inline-fields">
                <el-input-number v-model="form.new_week_start" :min="1" :max="16" controls-position="right" />
                <span>至</span>
                <el-input-number v-model="form.new_week_end" :min="1" :max="16" controls-position="right" />
              </div>
            </el-form-item>
            <el-form-item label="单双周">
              <el-select v-model="form.new_week_parity" clearable placeholder="不调整" style="width: 100%">
                <el-option v-for="item in weekParityOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-form>
        </section>
      </div>

      <section class="manual-panel">
        <div class="panel-header">
          <h4>当前课表</h4>
        </div>
        <ManualScheduleBoard :records="entryViews" @select="selectEntry" />
      </section>
    </template>

    <el-table v-loading="loading" :data="entryViews" border>
      <el-table-column prop="course" label="课程" min-width="170" />
      <el-table-column prop="teachers" label="教师 IDs" min-width="150" />
      <el-table-column label="开课班" min-width="130">
        <template #default="{ row }">{{ row.entry.offering_id }}</template>
      </el-table-column>
      <el-table-column prop="classroom" label="教室" min-width="160" />
      <el-table-column prop="timeText" label="时间" min-width="240" />
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="selectEntry(row)">选择调课</el-button>
        </template>
      </el-table-column>
    </el-table>

    <template #detail>
      <div v-if="adjustedEntry" class="detail-stack">
        <el-alert title="调课已保存，请以课表查询结果为准。" type="success" :closable="false" />
        <el-descriptions :column="2" border>
          <el-descriptions-item label="条目 ID">{{ adjustedEntry.id }}</el-descriptions-item>
          <el-descriptions-item label="课程">{{ formatCourse(adjustedEntry) }}</el-descriptions-item>
          <el-descriptions-item label="教师 IDs">{{ formatTeachers(adjustedEntry.teacher_ids) }}</el-descriptions-item>
          <el-descriptions-item label="教室 ID">{{ adjustedEntry.classroom_id }}</el-descriptions-item>
          <el-descriptions-item label="星期">{{ getDayLabel(adjustedEntry.day_of_week) }}</el-descriptions-item>
          <el-descriptions-item label="节次">{{
            formatSections(adjustedEntry.slot_start, adjustedEntry.slot_end)
          }}</el-descriptions-item>
          <el-descriptions-item label="周次">{{
            formatWeeks(adjustedEntry.week_start, adjustedEntry.week_end, adjustedEntry.week_parity)
          }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </template>
  </SchedulePageShell>
</template>

<script setup lang="ts" name="scheduleManual">
import { computed, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import type { Schedule } from "@/api/interface/schedule";
import { getClassrooms, getScheduleEntries, manualAdjustSchedule } from "@/api/modules/schedule";
import SchedulePageShell from "../components/SchedulePageShell.vue";
import ManualScheduleBoard from "./components/ManualScheduleBoard.vue";
import type { QueryEntryView } from "../query/types";
import {
  dayOptions,
  formatCourse,
  formatEntryTime,
  formatSections,
  formatTeachers,
  formatWeeks,
  getDayLabel,
  sectionOptions,
  weekParityOptions
} from "../utils";

const loading = ref(false);
const saving = ref(false);
const detailVisible = ref(false);
const entries = ref<Schedule.ScheduleEntry[]>([]);
const classrooms = ref<Schedule.Classroom[]>([]);
const teacherIdsText = ref("");
const adjustedEntry = ref<Schedule.ScheduleEntry | null>(null);

const filters = reactive({
  semester: "2026-FALL",
  teacher_id: "",
  course_id: "",
  offering_id: ""
});

const emptyForm = (): Schedule.ManualAdjustRequest => ({
  entry_id: 0,
  new_teacher_ids: null,
  new_classroom_id: null,
  new_day_of_week: null,
  new_slot_start: null,
  new_slot_end: null,
  new_week_start: null,
  new_week_end: null,
  new_week_parity: null
});

const form = reactive<Schedule.ManualAdjustRequest>(emptyForm());

const classroomMap = computed(() => new Map(classrooms.value.map(item => [item.id, item])));
const activeClassrooms = computed(() => classrooms.value.filter(item => item.is_active));

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

const entryViews = computed(() => entries.value.map(toView));

const stats = computed(() => [
  { label: "可调条目", value: entryViews.value.length, help: "当前查询结果数量" },
  { label: "启用教室", value: activeClassrooms.value.length, help: "可作为目标教室" },
  { label: "已选条目", value: form.entry_id || "-", help: "当前调课目标" },
  { label: "保存结果", value: adjustedEntry.value ? "已保存" : "待提交", help: "以后端返回为准" }
]);

const loadClassrooms = async () => {
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

const resetForm = () => {
  Object.assign(form, emptyForm());
  teacherIdsText.value = "";
  adjustedEntry.value = null;
};

const selectEntry = (record: QueryEntryView) => {
  resetForm();
  form.entry_id = record.entry.id;
  teacherIdsText.value = record.entry.teacher_ids.join(", ");
  ElMessage.success(`已选择 ${record.course}`);
};

const handleEntryChange = () => {
  const selected = entries.value.find(item => item.id === form.entry_id);
  teacherIdsText.value = selected?.teacher_ids.join(", ") ?? "";
};

const validateForm = () => {
  if (!form.entry_id) {
    ElMessage.warning("请选择待调整课表条目");
    return false;
  }
  if (form.new_slot_start && form.new_slot_end && form.new_slot_start > form.new_slot_end) {
    ElMessage.error("新节次开始不能晚于结束");
    return false;
  }
  if (form.new_week_start && form.new_week_end && form.new_week_start > form.new_week_end) {
    ElMessage.error("新周次开始不能晚于结束");
    return false;
  }
  return true;
};

const submitAdjustment = async () => {
  if (!validateForm()) return;

  const teacherIds = teacherIdsText.value
    .split(",")
    .map(item => item.trim())
    .filter(Boolean);

  saving.value = true;
  try {
    const payload: Schedule.ManualAdjustRequest = {
      entry_id: form.entry_id,
      new_teacher_ids: teacherIds.length ? teacherIds : null,
      new_classroom_id: form.new_classroom_id || null,
      new_day_of_week: form.new_day_of_week || null,
      new_slot_start: form.new_slot_start || null,
      new_slot_end: form.new_slot_end || null,
      new_week_start: form.new_week_start || null,
      new_week_end: form.new_week_end || null,
      new_week_parity: form.new_week_parity || null
    };
    const { data } = await manualAdjustSchedule(payload);
    adjustedEntry.value = data;
    detailVisible.value = true;
    ElMessage.success("调课已保存");
    await loadEntries();
  } finally {
    saving.value = false;
  }
};

void loadClassrooms().finally(loadEntries);
</script>

<style scoped lang="scss">
.manual-layout {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin: 16px 0;
}
.manual-panel {
  padding: 18px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}
.panel-header {
  margin-bottom: 14px;
}
.panel-header h4 {
  margin: 0;
  font-size: 16px;
  color: #0f172a;
}
.manual-form {
  margin-top: 8px;
}
.inline-fields {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}
.detail-stack {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

@media (width <= 1100px) {
  .manual-layout {
    grid-template-columns: 1fr;
  }
}
</style>
