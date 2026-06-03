<template>
  <div class="score-query-page">
    <section class="query-header">
      <div>
        <p class="eyebrow">成绩管理</p>
        <h2>成绩查询</h2>
      </div>
      <el-button :icon="Refresh" :loading="loading" @click="reload">刷新</el-button>
    </section>

    <section v-if="isStudent" class="query-surface">
      <div class="surface-head">
        <h3>我的已发布成绩</h3>
        <el-select
          v-model="studentSemester"
          placeholder="全部学期"
          clearable
          filterable
          class="semester-filter"
          @change="loadMyGrades"
        >
          <el-option v-for="semester in studentSemesters" :key="semester" :label="semester" :value="semester" />
        </el-select>
      </div>
      <el-alert
        class="surface-alert"
        type="info"
        :closable="false"
        show-icon
        title="当前后端会返回课程名、考核方式、课程类别等摘要字段，但不返回分项成绩明细。"
      />
      <el-table v-loading="loading" :data="studentGrades" border empty-text="暂无已发布成绩">
        <el-table-column prop="course_id" label="课程号" min-width="140" />
        <el-table-column prop="course_name" label="课程名" min-width="180" show-overflow-tooltip />
        <el-table-column prop="semester" label="学期" min-width="140" />
        <el-table-column prop="assessment_method" label="考核方式" min-width="140" show-overflow-tooltip>
          <template #default="{ row }">{{ row.assessment_method || "-" }}</template>
        </el-table-column>
        <el-table-column prop="category" label="课程类别" min-width="130" show-overflow-tooltip>
          <template #default="{ row }">{{ row.category || "-" }}</template>
        </el-table-column>
        <el-table-column prop="total_score" label="总评" width="110" />
        <el-table-column prop="gpa" label="GPA" width="110" />
        <el-table-column prop="credit" label="学分" width="100">
          <template #default="{ row }">{{ row.credit ?? "-" }}</template>
        </el-table-column>
        <el-table-column prop="grade_level" label="等级" width="100">
          <template #default="{ row }">{{ row.grade_level || "-" }}</template>
        </el-table-column>
      </el-table>
    </section>

    <section v-else class="query-surface">
      <div class="surface-head">
        <div>
          <h3>课程成绩明细</h3>
          <p class="surface-subtitle">使用后端聚合成绩单，支持分页、导出和审计日志查看。</p>
        </div>
        <div class="teacher-filters">
          <el-select
            v-model="selectedCourseId"
            placeholder="选择课程"
            clearable
            filterable
            class="filter-control"
            @change="handleCourseChange"
          >
            <el-option
              v-for="course in courses"
              :key="`${course.course_id}-${course.semester}`"
              :label="courseLabel(course)"
              :value="course.course_id"
            />
          </el-select>
          <el-select
            v-model="selectedSemester"
            placeholder="选择学期"
            clearable
            filterable
            class="filter-control"
            @change="loadCourseGrades"
          >
            <el-option v-for="semester in teacherSemesters" :key="semester" :label="semester" :value="semester" />
          </el-select>
          <el-button :disabled="!selectedCourseId || !selectedSemester" :loading="exporting" @click="handleExport">
            导出成绩
          </el-button>
          <el-button :disabled="!selectedCourseId" @click="openAuditDialog">审计日志</el-button>
        </div>
      </div>
      <el-alert
        class="surface-alert"
        type="info"
        :closable="false"
        show-icon
        :title="gradeSheet?.edition ? `当前展示的是 ${gradeSheet.edition}` : '请选择课程和学期后查看聚合成绩单。'"
      />
      <el-table v-loading="loading" :data="courseRows" border empty-text="请选择课程和学期">
        <el-table-column prop="student_no" label="学号" min-width="130" fixed />
        <el-table-column prop="student_name" label="姓名" min-width="110" fixed />
        <el-table-column prop="major" label="专业" min-width="140" show-overflow-tooltip />
        <el-table-column v-for="component in components" :key="component.id" min-width="150">
          <template #header>
            <div class="component-head">
              <span>{{ component.component_type }} / {{ component.component_sub_id }}</span>
              <small>{{ component.weight }}%</small>
            </div>
          </template>
          <template #default="{ row }">
            {{ getSheetScore(row, component.id) ?? "-" }}
          </template>
        </el-table-column>
        <el-table-column prop="total_score" label="总评" min-width="100" align="center">
          <template #default="{ row }">{{ row.total_score ?? "-" }}</template>
        </el-table-column>
        <el-table-column prop="gpa" label="GPA" min-width="90" align="center">
          <template #default="{ row }">{{ row.gpa ?? "-" }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" min-width="100" align="center" />
        <el-table-column prop="last_modified_at" label="最后更新时间" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">{{ row.last_modified_at || "-" }}</template>
        </el-table-column>
      </el-table>
      <el-pagination
        v-if="gradeSheet?.total"
        class="query-pagination"
        layout="prev, pager, next, sizes, total"
        :total="gradeSheet.total"
        :current-page="page"
        :page-size="pageSize"
        :page-sizes="[10, 20, 50]"
        @current-change="handlePageChange"
        @size-change="handlePageSizeChange"
      />
    </section>

    <el-dialog v-model="auditDialogVisible" title="成绩审计日志" width="900px">
      <el-table v-loading="auditLoading" :data="auditLogs" border empty-text="暂无审计日志">
        <el-table-column prop="operator_name" label="操作人" min-width="120" />
        <el-table-column prop="operator_role" label="角色" min-width="100" />
        <el-table-column prop="operation_type" label="动作" min-width="150" />
        <el-table-column prop="target_id" label="记录 ID" min-width="100" />
        <el-table-column prop="before_value" label="修改前" min-width="180" show-overflow-tooltip />
        <el-table-column prop="after_value" label="修改后" min-width="180" show-overflow-tooltip />
        <el-table-column prop="created_at" label="时间" min-width="170" show-overflow-tooltip />
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup lang="ts" name="scoreQuery">
import { computed, onMounted, ref } from "vue";
import { Refresh } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import type { Score } from "@/api/interface/score";
import { exportGradeRecords, getGradeRecordLogs, getGradeSheet, getGradeCourses, getMyGrades } from "@/api/modules/score";
import { useUserStore } from "@/stores/modules/user";

const userStore = useUserStore();
const loading = ref(false);
const exporting = ref(false);
const auditLoading = ref(false);
const auditDialogVisible = ref(false);
const studentSemester = ref("");
const studentGrades = ref<Score.StudentGrade[]>([]);
const courses = ref<Score.Course[]>([]);
const selectedCourseId = ref("");
const selectedSemester = ref("");
const components = ref<Score.GradeComponent[]>([]);
const gradeSheet = ref<Score.GradeSheet | null>(null);
const courseRows = ref<Score.GradeSheetRow[]>([]);
const auditLogs = ref<Score.GradeRecordLog[]>([]);
const page = ref(1);
const pageSize = ref(20);

const isStudent = computed(() => userStore.userInfo.role === "student");
const studentSemesters = computed(() => Array.from(new Set(studentGrades.value.map(item => item.semester))));
const teacherSemesters = computed(() => {
  const semesters = courses.value
    .filter(course => !selectedCourseId.value || course.course_id === selectedCourseId.value)
    .map(course => course.semester);
  return Array.from(new Set(semesters));
});

const courseLabel = (course: Score.Course) => `${course.course_name || course.course_id} · ${course.semester}`;

const getSheetScore = (row: Score.GradeSheetRow, componentId: number) => {
  const record = (row.records ?? row.component_scores ?? []).find(item => item.component_config_id === componentId);
  return record?.score ?? null;
};

const loadMyGrades = async () => {
  loading.value = true;
  try {
    const resp = await getMyGrades({ semester: studentSemester.value || undefined });
    studentGrades.value = resp.data.grades;
  } finally {
    loading.value = false;
  }
};

const loadCourses = async () => {
  const resp = await getGradeCourses();
  courses.value = resp.data.courses;
};

const loadCourseGrades = async () => {
  if (!selectedCourseId.value || !selectedSemester.value) return;
  loading.value = true;
  try {
    const resp = await getGradeSheet(selectedCourseId.value, {
      semester: selectedSemester.value,
      page: page.value,
      page_size: pageSize.value
    });
    gradeSheet.value = resp.data;
    components.value = resp.data.components;
    courseRows.value = resp.data.rows;
  } finally {
    loading.value = false;
  }
};

const handleCourseChange = () => {
  const matched = courses.value.find(course => course.course_id === selectedCourseId.value);
  selectedSemester.value = matched?.semester || "";
  page.value = 1;
  loadCourseGrades();
};

const handlePageChange = (nextPage: number) => {
  page.value = nextPage;
  loadCourseGrades();
};

const handlePageSizeChange = (nextSize: number) => {
  pageSize.value = nextSize;
  page.value = 1;
  loadCourseGrades();
};

const handleExport = async () => {
  if (!selectedCourseId.value || !selectedSemester.value) return;
  exporting.value = true;
  try {
    const resp = await exportGradeRecords({
      course_id: selectedCourseId.value,
      semester: selectedSemester.value,
      format: "xlsx"
    });
    const blob = new Blob([resp.data], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${selectedCourseId.value}-${selectedSemester.value}-成绩单.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
    ElMessage.success("导出已开始。");
  } finally {
    exporting.value = false;
  }
};

const openAuditDialog = async () => {
  if (!selectedCourseId.value) return;
  auditDialogVisible.value = true;
  auditLoading.value = true;
  try {
    const resp = await getGradeRecordLogs({
      course_id: selectedCourseId.value,
      page: 1,
      page_size: 50
    });
    auditLogs.value = resp.data.logs;
  } finally {
    auditLoading.value = false;
  }
};

const reload = async () => {
  if (isStudent.value) await loadMyGrades();
  else {
    loading.value = true;
    try {
      await loadCourses();
      await loadCourseGrades();
    } finally {
      loading.value = false;
    }
  }
};

onMounted(reload);
</script>

<style scoped lang="scss">
.score-query-page {
  min-height: 100%;
  padding: 18px;
  background: linear-gradient(135deg, rgb(247 248 250 / 96%), rgb(239 244 242 / 92%));
}
.query-header,
.query-surface {
  background: rgb(255 255 255 / 94%);
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  box-shadow: 0 12px 30px rgb(31 45 61 / 6%);
}
.query-header,
.surface-head {
  display: flex;
  gap: 14px;
  align-items: center;
  justify-content: space-between;
}
.query-header {
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
.query-surface {
  padding: 14px;
  margin-top: 12px;
}
.surface-head {
  margin-bottom: 12px;
  h3 {
    margin: 0;
    font-size: 18px;
  }
}
.surface-alert {
  margin-bottom: 12px;
}
.teacher-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.filter-control,
.semester-filter {
  width: 240px;
}
.component-head {
  display: grid;
  gap: 2px;
  small {
    color: var(--el-text-color-secondary);
  }
}

@media (width <= 900px) {
  .query-header,
  .surface-head {
    flex-direction: column;
    align-items: flex-start;
  }
  .filter-control,
  .semester-filter {
    width: 100%;
  }
}
</style>
