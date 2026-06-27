<template>
  <div class="schedule-page-view">
    <SchedulePageShell
      v-model="detailVisible"
      title="教师排课偏好"
      description="教师维护自己的学期排课偏好；管理员也按当前身份提交，不代管任意教师。"
      :tags="['自助维护', '按学期筛选', '偏好/避让']"
      :stats="stats"
      content-title="偏好列表"
      content-description="数据来自 /api/v1/schedule/teacher-preferences。偏好会被自动排课算法读取。"
      :data-count="preferences.length"
      empty-description="当前学期没有教师排课偏好。"
      dialog-title="偏好详情"
    >
      <template #actions>
        <el-space wrap>
          <el-button @click="loadPreferences">刷新</el-button>
          <el-button type="primary" @click="openCreate">新增偏好</el-button>
        </el-space>
      </template>

      <template #filters>
        <el-form :inline="true" :model="filters" class="filter-form">
          <el-form-item label="学期">
            <el-input
              v-model="filters.semester"
              placeholder="例如 2026-FALL"
              clearable
              style="width: 220px"
              @change="loadPreferences"
            />
          </el-form-item>
          <el-form-item label="关键字">
            <el-input v-model="filters.keyword" clearable placeholder="课程 / 校区 / 楼栋 / 教室" style="width: 260px" />
          </el-form-item>
          <el-form-item label="类型">
            <el-select v-model="filters.negative" clearable placeholder="全部" style="width: 140px">
              <el-option label="偏好" value="positive" />
              <el-option label="避让" value="negative" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button @click="resetFilters">重置</el-button>
          </el-form-item>
        </el-form>
      </template>

      <el-table v-loading="loading" :data="preferences" border>
        <el-table-column prop="semester" label="学期" min-width="140" />
        <el-table-column prop="course_id" label="课程 ID" min-width="130">
          <template #default="{ row }">{{ row.course_id || "通用偏好" }}</template>
        </el-table-column>
        <el-table-column label="时间偏好" min-width="210">
          <template #default="{ row }">
            {{ formatPreferenceTime(row) }}
          </template>
        </el-table-column>
        <el-table-column label="地点偏好" min-width="220">
          <template #default="{ row }">
            {{ formatPreferenceLocation(row) }}
          </template>
        </el-table-column>
        <el-table-column label="性质" min-width="100">
          <template #default="{ row }">
            <el-tag :type="row.is_negative ? 'danger' : 'success'" effect="light">
              {{ row.is_negative ? "避让" : "偏好" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="updated_at" label="更新时间" min-width="180" />
        <el-table-column label="操作" width="170" fixed="right">
          <template #default="{ row }">
            <el-space>
              <el-button link type="primary" @click="openDetail(row)">详情</el-button>
              <el-button link @click="openEdit(row)">编辑</el-button>
              <el-button link type="danger" @click="removePreference(row)">删除</el-button>
            </el-space>
          </template>
        </el-table-column>
      </el-table>

      <template #detail>
        <div v-if="currentPreference" class="detail-stack">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="教师 ID">{{ currentPreference.teacher_id }}</el-descriptions-item>
            <el-descriptions-item label="学期">{{ currentPreference.semester }}</el-descriptions-item>
            <el-descriptions-item label="课程 ID">{{ currentPreference.course_id || "通用偏好" }}</el-descriptions-item>
            <el-descriptions-item label="性质">{{ currentPreference.is_negative ? "避让" : "偏好" }}</el-descriptions-item>
            <el-descriptions-item label="校区">{{ currentPreference.campus || "-" }}</el-descriptions-item>
            <el-descriptions-item label="楼栋">{{ currentPreference.building || "-" }}</el-descriptions-item>
            <el-descriptions-item label="教室编号">{{ currentPreference.classroom_code || "-" }}</el-descriptions-item>
            <el-descriptions-item label="教室类型">{{ getRoomTypeLabel(currentPreference.room_type) }}</el-descriptions-item>
            <el-descriptions-item label="星期">{{ getDayLabel(currentPreference.day_of_week) }}</el-descriptions-item>
            <el-descriptions-item label="节次">{{
              formatSections(currentPreference.slot_start, currentPreference.slot_end)
            }}</el-descriptions-item>
            <el-descriptions-item label="周次">{{
              formatWeeks(currentPreference.week_start, currentPreference.week_end, currentPreference.week_parity)
            }}</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ currentPreference.created_at }}</el-descriptions-item>
          </el-descriptions>
        </div>
      </template>
    </SchedulePageShell>

    <el-drawer v-model="formVisible" :title="formMode === 'create' ? '新增教师偏好' : '编辑教师偏好'" size="660px">
      <el-form ref="formRef" :model="formModel" :rules="formRules" label-width="104px" class="preference-form">
        <el-form-item label="学期" prop="semester">
          <el-input v-model="formModel.semester" placeholder="例如 2026-FALL" maxlength="16" />
        </el-form-item>
        <el-form-item label="课程 ID">
          <el-input v-model="formModel.course_id" clearable placeholder="留空表示本学期所有课程" maxlength="32" />
        </el-form-item>
        <el-form-item label="偏好性质">
          <el-radio-group v-model="formModel.is_negative">
            <el-radio-button :label="false">希望这样排</el-radio-button>
            <el-radio-button :label="true">不希望这样排</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="校区">
          <el-input v-model="formModel.campus" clearable maxlength="32" />
        </el-form-item>
        <el-form-item label="楼栋">
          <el-input v-model="formModel.building" clearable maxlength="64" />
        </el-form-item>
        <el-form-item label="教室编号">
          <el-input v-model="formModel.classroom_code" clearable maxlength="32" />
        </el-form-item>
        <el-form-item label="教室类型">
          <el-select v-model="formModel.room_type" clearable placeholder="不限" style="width: 100%">
            <el-option v-for="item in roomTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="星期">
          <el-select v-model="formModel.day_of_week" clearable placeholder="不限" style="width: 100%">
            <el-option v-for="item in dayOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="节次">
          <div class="inline-fields">
            <el-select v-model="formModel.slot_start" clearable placeholder="开始" style="width: 120px">
              <el-option v-for="item in sectionOptions" :key="item" :label="`${item}节`" :value="item" />
            </el-select>
            <span>至</span>
            <el-select v-model="formModel.slot_end" clearable placeholder="结束" style="width: 120px">
              <el-option v-for="item in sectionOptions" :key="item" :label="`${item}节`" :value="item" />
            </el-select>
          </div>
        </el-form-item>
        <el-form-item label="周次">
          <div class="inline-fields">
            <el-input-number v-model="formModel.week_start" :min="1" :max="16" controls-position="right" />
            <span>至</span>
            <el-input-number v-model="formModel.week_end" :min="1" :max="16" controls-position="right" />
          </div>
        </el-form-item>
        <el-form-item label="单双周">
          <el-select v-model="formModel.week_parity" clearable placeholder="不限" style="width: 100%">
            <el-option v-for="item in weekParityOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="drawer-footer">
          <el-button @click="formVisible = false">取消</el-button>
          <el-button type="primary" :loading="saving" @click="submitForm">保存</el-button>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts" name="scheduleTeacherPreferences">
import { computed, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import type { FormInstance, FormRules } from "element-plus";
import type { Schedule } from "@/api/interface/schedule";
import {
  createTeacherPreference,
  deleteTeacherPreference,
  getTeacherPreferences,
  updateTeacherPreference
} from "@/api/modules/schedule";
import SchedulePageShell from "../components/SchedulePageShell.vue";
import {
  dayOptions,
  formatSections,
  formatWeeks,
  getDayLabel,
  getRoomTypeLabel,
  roomTypeOptions,
  sectionOptions,
  weekParityOptions
} from "../utils";

type PreferenceForm = Schedule.TeacherPreferenceCreate;

const loading = ref(false);
const saving = ref(false);
const detailVisible = ref(false);
const formVisible = ref(false);
const formMode = ref<"create" | "edit">("create");
const formRef = ref<FormInstance>();
const preferencesRaw = ref<Schedule.TeacherPreference[]>([]);
const currentPreference = ref<Schedule.TeacherPreference | null>(null);
const editingId = ref<number | null>(null);

const filters = reactive({
  semester: "2026-FALL",
  keyword: "",
  negative: "" as "" | "positive" | "negative"
});

const createEmptyForm = (): PreferenceForm => ({
  semester: filters.semester || "2026-FALL",
  course_id: null,
  campus: null,
  building: null,
  classroom_code: null,
  room_type: null,
  day_of_week: null,
  slot_start: null,
  slot_end: null,
  week_start: 1,
  week_end: 16,
  week_parity: "ALL",
  is_negative: false
});

const formModel = reactive<PreferenceForm>(createEmptyForm());

const formRules: FormRules<PreferenceForm> = {
  semester: [{ required: true, message: "请输入学期", trigger: "blur" }]
};

const preferences = computed(() => {
  const keyword = filters.keyword.trim().toLowerCase();
  return preferencesRaw.value.filter(item => {
    const matchKeyword =
      !keyword ||
      [item.course_id, item.campus, item.building, item.classroom_code, item.room_type]
        .filter(Boolean)
        .some(value => String(value).toLowerCase().includes(keyword));
    const matchNegative =
      !filters.negative ||
      (filters.negative === "positive" && !item.is_negative) ||
      (filters.negative === "negative" && item.is_negative);
    return matchKeyword && matchNegative;
  });
});

const stats = computed(() => [
  { label: "偏好总数", value: preferences.value.length, help: "当前筛选结果" },
  { label: "希望这样排", value: preferences.value.filter(item => !item.is_negative).length, help: "正向偏好数量" },
  { label: "不希望这样排", value: preferences.value.filter(item => item.is_negative).length, help: "避让约束数量" },
  { label: "指定课程", value: preferences.value.filter(item => item.course_id).length, help: "绑定具体课程 ID" }
]);

const normalizePayload = (payload: PreferenceForm): PreferenceForm => ({
  ...payload,
  course_id: payload.course_id || null,
  campus: payload.campus || null,
  building: payload.building || null,
  classroom_code: payload.classroom_code || null,
  room_type: payload.room_type || null,
  day_of_week: payload.day_of_week || null,
  slot_start: payload.slot_start || null,
  slot_end: payload.slot_end || null,
  week_start: payload.week_start || null,
  week_end: payload.week_end || null,
  week_parity: payload.week_parity || null
});

const formatPreferenceTime = (item: Schedule.TeacherPreference) => {
  const day = getDayLabel(item.day_of_week);
  const sections = formatSections(item.slot_start, item.slot_end);
  const weeks = formatWeeks(item.week_start, item.week_end, item.week_parity);
  return [day, sections, weeks].filter(value => value !== "-").join(" / ") || "-";
};

const formatPreferenceLocation = (item: Schedule.TeacherPreference) => {
  return (
    [item.campus, item.building, item.classroom_code, getRoomTypeLabel(item.room_type)]
      .filter(value => value && value !== "-")
      .join(" / ") || "-"
  );
};

const loadPreferences = async () => {
  loading.value = true;
  try {
    const { data } = await getTeacherPreferences({ semester: filters.semester || undefined, limit: 1000 });
    preferencesRaw.value = data;
  } finally {
    loading.value = false;
  }
};

const resetFilters = async () => {
  filters.semester = "2026-FALL";
  filters.keyword = "";
  filters.negative = "";
  await loadPreferences();
};

const resetForm = () => {
  Object.assign(formModel, createEmptyForm());
  editingId.value = null;
};

const openCreate = () => {
  formMode.value = "create";
  resetForm();
  formVisible.value = true;
};

const openEdit = (record: Schedule.TeacherPreference) => {
  formMode.value = "edit";
  editingId.value = record.id;
  Object.assign(formModel, {
    semester: record.semester,
    course_id: record.course_id,
    campus: record.campus,
    building: record.building,
    classroom_code: record.classroom_code,
    room_type: record.room_type,
    day_of_week: record.day_of_week,
    slot_start: record.slot_start,
    slot_end: record.slot_end,
    week_start: record.week_start,
    week_end: record.week_end,
    week_parity: record.week_parity,
    is_negative: record.is_negative
  });
  formVisible.value = true;
};

const openDetail = (record: Schedule.TeacherPreference) => {
  currentPreference.value = record;
  detailVisible.value = true;
};

const removePreference = async (record: Schedule.TeacherPreference) => {
  await ElMessageBox.confirm("确认删除这条教师排课偏好？", "删除偏好", { type: "warning" });
  await deleteTeacherPreference(record.id);
  ElMessage.success("偏好已删除");
  await loadPreferences();
};

const submitForm = async () => {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  if (formModel.slot_start && formModel.slot_end && formModel.slot_start > formModel.slot_end) {
    ElMessage.error("节次开始不能晚于结束");
    return;
  }
  if (formModel.week_start && formModel.week_end && formModel.week_start > formModel.week_end) {
    ElMessage.error("周次开始不能晚于结束");
    return;
  }

  saving.value = true;
  try {
    const payload = normalizePayload({ ...formModel });
    if (formMode.value === "edit" && editingId.value) {
      await updateTeacherPreference(editingId.value, payload);
      ElMessage.success("偏好已更新");
    } else {
      await createTeacherPreference(payload);
      ElMessage.success("偏好已新增");
    }
    filters.semester = formModel.semester;
    formVisible.value = false;
    await loadPreferences();
  } finally {
    saving.value = false;
  }
};

loadPreferences();
</script>

<style scoped lang="scss">
.schedule-page-view,
.detail-stack {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.filter-form {
  display: flex;
  flex-wrap: wrap;
}
.preference-form {
  padding-right: 12px;
}
.inline-fields {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}
.drawer-footer {
  display: flex;
  justify-content: flex-end;
}
</style>
