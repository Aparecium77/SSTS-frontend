<template>
  <div class="change-request-page">
    <section class="request-header">
      <div>
        <p class="eyebrow">成绩管理</p>
        <h2>改分申请</h2>
      </div>
      <el-button :icon="Refresh" :loading="loading" @click="reload">刷新</el-button>
    </section>

    <section class="request-filters">
      <el-select
        v-model="selectedCourseKey"
        placeholder="选择课程与学期"
        clearable
        filterable
        class="filter-control"
        @change="loadRecords"
      >
        <el-option
          v-for="course in courses"
          :key="toCourseKey(course.course_id, course.semester)"
          :label="courseOptionLabel(course)"
          :value="toCourseKey(course.course_id, course.semester)"
        />
      </el-select>
    </section>

    <section class="request-surface">
      <el-alert
        class="surface-alert"
        type="warning"
        :closable="false"
        show-icon
        title="改分申请时机：课程已「提交审批」且教务尚未通过时不能申请；教务审批通过、尚未发布后可对 approved 分项申请。申请后请到「改分审批」标签页处理。"
      />
      <el-table v-loading="loading" :data="candidates" border empty-text="暂无可申请改分的成绩记录">
        <el-table-column prop="student_no" label="学号" min-width="130" />
        <el-table-column prop="student_name" label="姓名" min-width="110" />
        <el-table-column label="成绩项" min-width="170">
          <template #default="{ row }">{{ row.component_type }} / {{ row.component_sub_id }}</template>
        </el-table-column>
        <el-table-column prop="score" label="当前成绩" width="110" />
        <el-table-column prop="result_type" label="结果类型" width="120" />
        <el-table-column prop="updated_at" label="更新时间" min-width="170" show-overflow-tooltip />
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-tag type="success">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="130" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" :icon="EditPen" @click="openDialog(candidateRow(row))">申请改分</el-button>
          </template>
        </el-table-column>
      </el-table>
    </section>

    <el-dialog v-model="dialogVisible" title="提交改分申请" width="520px">
      <el-form :model="form" label-width="88px">
        <el-form-item label="学生">
          <el-input :model-value="activeRecord ? `${activeRecord.student_no} ${activeRecord.student_name}` : ''" disabled />
        </el-form-item>
        <el-form-item label="成绩项">
          <el-input
            :model-value="activeRecord ? `${activeRecord.component_type} / ${activeRecord.component_sub_id}` : ''"
            disabled
          />
        </el-form-item>
        <el-form-item label="原成绩">
          <el-input :model-value="activeRecord?.score ?? ''" disabled />
        </el-form-item>
        <el-form-item label="新成绩">
          <el-input-number v-model="form.new_score" :min="0" :max="100" :precision="1" controls-position="right" />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="form.modify_type">
            <el-option label="成绩更正" value="score_correction" />
            <el-option label="录入错误" value="entry_error" />
            <el-option label="复核调整" value="review_adjustment" />
          </el-select>
        </el-form-item>
        <el-form-item label="原因">
          <el-input v-model="form.reason" type="textarea" :rows="4" maxlength="200" show-word-limit placeholder="说明改分依据" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitRequest">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts" name="scoreChangeRequest">
import { computed, reactive, ref, onMounted } from "vue";
import { EditPen, Refresh } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import type { Score } from "@/api/interface/score";
import { createModifyRequest, getCourseRecords, getGradeCourses, getScoreUserId } from "@/api/modules/score";
import { useUserStore } from "@/stores/modules/user";
import { courseOptionLabel, parseCourseKey, toCourseKey } from "@/views/stss/score/_shared/courseSelection";

type CandidateRecord = {
  id: number;
  grade_record_id: number;
  student_id: string;
  student_no: string;
  student_name: string;
  major: string | null;
  component_type: string;
  component_sub_id: string;
  score: number | null;
  result_type: string;
  status: string;
  is_locked: 0 | 1;
  updated_at: string | null;
};

const userStore = useUserStore();
const loading = ref(false);
const submitting = ref(false);
const dialogVisible = ref(false);
const courses = ref<Score.Course[]>([]);
const records = ref<CandidateRecord[]>([]);
const selectedCourseKey = ref("");
const selectedCourseId = computed(() => parseCourseKey(selectedCourseKey.value).courseId);
const selectedSemester = computed(() => parseCourseKey(selectedCourseKey.value).semester);
const activeRecord = ref<CandidateRecord | null>(null);
const form = reactive({
  new_score: null as number | null,
  modify_type: "score_correction",
  reason: ""
});

const candidates = computed(() => records.value.filter(record => record.status === "approved" && record.is_locked === 0));

const candidateRow = (row: unknown) => row as CandidateRecord;

const loadCourses = async () => {
  const resp = await getGradeCourses();
  courses.value = resp.data.courses;
  if (!selectedCourseKey.value && courses.value.length) {
    const first = courses.value[0];
    selectedCourseKey.value = toCourseKey(first.course_id, first.semester);
  }
};

const loadRecords = async () => {
  if (!selectedCourseId.value || !selectedSemester.value) {
    records.value = [];
    return;
  }
  loading.value = true;
  try {
    const resp = await getCourseRecords(selectedCourseId.value, { semester: selectedSemester.value });
    records.value = resp.data.rows.flatMap(row =>
      (row.records ?? row.component_scores ?? []).map(record => ({
        id: Number(record.grade_record_id ?? record.id ?? 0),
        grade_record_id: Number(record.grade_record_id ?? record.id ?? 0),
        student_id: row.student_id,
        student_no: row.student_no,
        student_name: row.student_name,
        major: row.major ?? null,
        component_type: record.component_type,
        component_sub_id: record.component_sub_id,
        score: record.score,
        result_type: "normal",
        status: record.status ?? row.status,
        is_locked: record.is_locked ?? 0,
        updated_at: record.updated_at ?? row.last_modified_at ?? null
      }))
    );
  } finally {
    loading.value = false;
  }
};

const reload = async () => {
  await loadCourses();
  await loadRecords();
};

const openDialog = (record: CandidateRecord) => {
  activeRecord.value = record;
  form.new_score = record.score;
  form.modify_type = "score_correction";
  form.reason = "";
  dialogVisible.value = true;
};

const submitRequest = async () => {
  if (!activeRecord.value) return;
  if (!form.reason.trim()) {
    ElMessage.warning("请填写改分原因");
    return;
  }
  submitting.value = true;
  try {
    await createModifyRequest({
      grade_record_id: activeRecord.value.grade_record_id,
      new_score: form.new_score,
      modify_type: form.modify_type,
      reason: form.reason.trim(),
      applicant_id: getScoreUserId(),
      applicant_name: userStore.userInfo.name || "申请人"
    });
    ElMessage.success("改分申请已提交");
    dialogVisible.value = false;
    await loadRecords();
  } catch (error: any) {
    ElMessage.error(error?.msg || "改分申请提交失败");
  } finally {
    submitting.value = false;
  }
};

onMounted(reload);
</script>

<style scoped lang="scss">
.change-request-page {
  min-height: 100%;
  padding: 18px;
  background: linear-gradient(135deg, rgb(247 248 250 / 96%), rgb(239 244 242 / 92%));
}
.request-header,
.request-filters,
.request-surface {
  background: rgb(255 255 255 / 94%);
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  box-shadow: 0 12px 30px rgb(31 45 61 / 6%);
}
.request-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px;
  h2 {
    margin: 2px 0 0;
    font-size: 24px;
    color: #1f2d3d;
  }
}
.eyebrow {
  margin: 0;
  font-size: 12px;
  font-weight: 700;
  color: #1c846d;
}
.request-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  padding: 12px;
  margin-top: 12px;
}
.filter-control {
  width: 260px;
}
.request-surface {
  padding: 14px;
  margin-top: 12px;
}
.surface-alert {
  margin-bottom: 12px;
}

@media (width <= 900px) {
  .request-header {
    flex-direction: column;
    gap: 14px;
    align-items: flex-start;
  }
  .filter-control {
    width: 100%;
  }
}
</style>
