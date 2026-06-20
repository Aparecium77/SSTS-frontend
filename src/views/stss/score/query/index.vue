<template>
  <div class="score-query-page">
    <section class="query-header">
      <div class="query-heading">
        <span class="brand-bar" aria-hidden="true"></span>
        <div>
          <p class="eyebrow">成绩管理</p>
          <h2>成绩查询</h2>
        </div>
      </div>
      <el-button :icon="Refresh" :loading="loading" @click="reload">刷新</el-button>
    </section>

    <section v-if="isStudent" class="query-surface">
      <el-alert class="student-login-tip" type="info" :closable="false" show-icon>
        <template #title> 当前登录：{{ userStore.userInfo.name }}（{{ userStore.userInfo.userId }}） </template>
        仅展示<strong>已发布</strong>总评。若为空，请确认教师已审批发布，且登录学号/学生 ID 与名册一致（可用学号如 20266001
        登录）。
      </el-alert>
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
      <el-table v-loading="loading" :data="studentGrades" border empty-text="暂无已发布成绩" @expand-change="handleStudentExpand">
        <el-table-column type="expand" width="48">
          <template #default="{ row }">
            <div v-loading="detailLoadingKey === detailKey(studentRow(row))" class="grade-detail-panel">
              <p v-if="!gradeDetailMap[detailKey(studentRow(row))]?.length" class="detail-empty">暂无分项成绩明细</p>
              <el-table v-else :data="gradeDetailMap[detailKey(studentRow(row))]" border size="small">
                <el-table-column prop="component_type" label="分项类型" min-width="120" />
                <el-table-column prop="component_sub_id" label="子项" min-width="100">
                  <template #default="{ row: item }">{{ item.component_sub_id || "-" }}</template>
                </el-table-column>
                <el-table-column prop="score" label="得分" width="100">
                  <template #default="{ row: item }">{{ item.score ?? "-" }}</template>
                </el-table-column>
                <el-table-column prop="data_source" label="来源" min-width="100">
                  <template #default="{ row: item }">{{ item.data_source || "-" }}</template>
                </el-table-column>
              </el-table>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="course_id" label="课程号" min-width="140" />
        <el-table-column prop="course_name" label="课程名" min-width="180" show-overflow-tooltip />
        <el-table-column prop="semester" label="学期" min-width="140" />
        <el-table-column prop="assessment_method" label="考核方式" min-width="140" show-overflow-tooltip>
          <template #default="{ row }">{{ row.assessment_method || "-" }}</template>
        </el-table-column>
        <el-table-column prop="category" label="课程类别" min-width="130" show-overflow-tooltip>
          <template #default="{ row }">{{ row.category || "-" }}</template>
        </el-table-column>
        <el-table-column prop="total_score" label="总评" width="110" class-name="emphasis-col" />
        <el-table-column prop="gpa" label="GPA" width="110" class-name="emphasis-col" />
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
          <p class="surface-subtitle">支持学号/姓名/分数段筛选与排序，数据来自后端聚合成绩单。</p>
        </div>
        <div class="teacher-filters filter-bar">
          <el-select
            v-model="selectedCourseKey"
            placeholder="选择课程"
            clearable
            filterable
            class="filter-control course-filter"
            @change="handleCourseChange"
          >
            <el-option
              v-for="course in courses"
              :key="toCourseKey(course.course_id, course.semester)"
              :label="courseOptionLabel(course)"
              :value="toCourseKey(course.course_id, course.semester)"
            />
          </el-select>
          <el-input v-model="filterStudentNo" placeholder="学号" clearable class="filter-control narrow" />
          <el-input v-model="filterStudentName" placeholder="姓名" clearable class="filter-control narrow" />
          <el-input-number
            v-model="filterMinScore"
            :min="0"
            :max="100"
            :controls="false"
            placeholder="最低分"
            class="filter-control score-input"
          />
          <el-input-number
            v-model="filterMaxScore"
            :min="0"
            :max="100"
            :controls="false"
            placeholder="最高分"
            class="filter-control score-input"
          />
          <el-select v-model="filterSortOrder" class="filter-control narrow">
            <el-option label="总分降序" value="desc" />
            <el-option label="总分升序" value="asc" />
          </el-select>
          <el-button type="primary" :disabled="!selectedCourseKey" :loading="loading" @click="searchCourseGrades">查询</el-button>
          <el-button :disabled="!selectedCourseKey" :loading="exporting" @click="handleExport">导出成绩</el-button>
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
      <el-table v-loading="loading" :data="pagedRows" border empty-text="请选择课程并查询">
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
            {{ getSheetScore(sheetRow(row), component.id) ?? "-" }}
          </template>
        </el-table-column>
        <el-table-column prop="total_score" label="总评" min-width="100" align="center" class-name="emphasis-col">
          <template #default="{ row }">{{ row.total_score ?? "-" }}</template>
        </el-table-column>
        <el-table-column prop="gpa" label="GPA" min-width="90" align="center" class-name="emphasis-col">
          <template #default="{ row }">{{ row.gpa ?? "-" }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" min-width="100" align="center" />
        <el-table-column prop="last_modified_at" label="最后更新时间" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">{{ row.last_modified_at || "-" }}</template>
        </el-table-column>
      </el-table>
      <el-pagination
        v-if="courseRows.length"
        class="query-pagination"
        layout="prev, pager, next, sizes, total"
        :total="courseRows.length"
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
import {
  exportGradeRecords,
  getCourseRecords,
  getGradeRecordLogs,
  getGradeCourses,
  getMyGradeRecords,
  getMyGrades
} from "@/api/modules/score";
import { useUserStore } from "@/stores/modules/user";
import { courseOptionLabel, parseCourseKey, toCourseKey } from "@/views/stss/score/_shared/courseSelection";

const userStore = useUserStore();
const loading = ref(false);
const exporting = ref(false);
const auditLoading = ref(false);
const auditDialogVisible = ref(false);
const detailLoadingKey = ref("");
const studentSemester = ref("");
const studentGrades = ref<Score.StudentGrade[]>([]);
const gradeDetailMap = ref<Record<string, Score.StudentGradeComponentItem[]>>({});
const courses = ref<Score.Course[]>([]);
const selectedCourseKey = ref("");
const filterStudentNo = ref("");
const filterStudentName = ref("");
const filterMinScore = ref<number | undefined>();
const filterMaxScore = ref<number | undefined>();
const filterSortOrder = ref<"asc" | "desc">("desc");
const components = ref<Score.GradeComponent[]>([]);
const gradeSheet = ref<Score.GradeSheet | null>(null);
const courseRows = ref<Score.GradeSheetRow[]>([]);
const auditLogs = ref<Score.GradeRecordLog[]>([]);
const page = ref(1);
const pageSize = ref(20);

const isStudent = computed(() => userStore.userInfo.role === "student");
const parsedSelectedCourse = computed(() => parseCourseKey(selectedCourseKey.value || ""));
const selectedCourseId = computed(() => parsedSelectedCourse.value.courseId);
const selectedSemester = computed(() => parsedSelectedCourse.value.semester);
const studentSemesters = computed(() => Array.from(new Set(studentGrades.value.map(item => item.semester))));

const pagedRows = computed(() => {
  const start = (page.value - 1) * pageSize.value;
  return courseRows.value.slice(start, start + pageSize.value);
});

const detailKey = (row: Score.StudentGrade) => `${row.course_id}::${row.semester}`;

const getSheetScore = (row: Score.GradeSheetRow, componentId: number) => {
  const record = (row.records ?? row.component_scores ?? []).find(item => item.component_config_id === componentId);
  return record?.score ?? null;
};

const loadGradeDetail = async (row: Score.StudentGrade) => {
  const key = detailKey(row);
  if (gradeDetailMap.value[key]) return;
  detailLoadingKey.value = key;
  try {
    const resp = await getMyGradeRecords(row.course_id, { semester: row.semester });
    gradeDetailMap.value[key] = resp.data.components;
  } catch {
    gradeDetailMap.value[key] = [];
  } finally {
    detailLoadingKey.value = "";
  }
};

const handleStudentExpand = (row: unknown, expandedRows: unknown) => {
  const grade = studentRow(row);
  const rows = expandedRows as Score.StudentGrade[];
  if (rows.some(item => detailKey(studentRow(item)) === detailKey(grade))) {
    loadGradeDetail(grade);
  }
};

const studentRow = (row: unknown) => row as Score.StudentGrade;
const sheetRow = (row: unknown) => row as Score.GradeSheetRow;

const getLatestSemester = (grades: Score.StudentGrade[]) => {
  const semesters = Array.from(new Set(grades.map(item => item.semester).filter(Boolean)));
  return semesters.sort((a, b) => b.localeCompare(a))[0] || "";
};

const loadMyGrades = async () => {
  loading.value = true;
  try {
    const resp = await getMyGrades({ semester: studentSemester.value || undefined });
    const grades = resp.data.grades;
    if (!studentSemester.value && grades.length) {
      const latestSemester = getLatestSemester(grades);
      if (latestSemester) {
        studentSemester.value = latestSemester;
        studentGrades.value = grades.filter(item => item.semester === latestSemester);
      } else {
        studentGrades.value = grades;
      }
    } else {
      studentGrades.value = grades;
    }
    gradeDetailMap.value = {};
  } finally {
    loading.value = false;
  }
};

const loadCourses = async () => {
  const resp = await getGradeCourses();
  courses.value = resp.data.courses;
  if (!selectedCourseKey.value && courses.value.length) {
    const first = courses.value[0];
    selectedCourseKey.value = toCourseKey(first.course_id, first.semester);
  }
};

const buildRecordParams = () => {
  const params: {
    semester: string;
    student_no?: string;
    student_name?: string;
    min_score?: number;
    max_score?: number;
    sort_order?: "asc" | "desc";
  } = {
    semester: selectedSemester.value,
    sort_order: filterSortOrder.value
  };
  if (filterStudentNo.value.trim()) params.student_no = filterStudentNo.value.trim();
  if (filterStudentName.value.trim()) params.student_name = filterStudentName.value.trim();
  if (filterMinScore.value !== undefined && filterMinScore.value !== null) params.min_score = filterMinScore.value;
  if (filterMaxScore.value !== undefined && filterMaxScore.value !== null) params.max_score = filterMaxScore.value;
  return params;
};

const loadCourseGrades = async () => {
  if (!selectedCourseId.value || !selectedSemester.value) return;
  loading.value = true;
  try {
    const resp = await getCourseRecords(selectedCourseId.value, buildRecordParams());
    gradeSheet.value = resp.data;
    components.value = resp.data.components;
    courseRows.value = resp.data.rows;
  } finally {
    loading.value = false;
  }
};

const searchCourseGrades = () => {
  page.value = 1;
  loadCourseGrades();
};

const handleCourseChange = () => {
  page.value = 1;
  if (selectedCourseKey.value) loadCourseGrades();
  else {
    gradeSheet.value = null;
    courseRows.value = [];
    components.value = [];
  }
};

const handlePageChange = (nextPage: number) => {
  page.value = nextPage;
};

const handlePageSizeChange = (nextSize: number) => {
  pageSize.value = nextSize;
  page.value = 1;
};

const handleExport = async () => {
  if (!selectedCourseId.value || !selectedSemester.value) return;
  exporting.value = true;
  try {
    const params = buildRecordParams();
    const resp = await exportGradeRecords({
      course_id: selectedCourseId.value,
      semester: selectedSemester.value,
      format: "xlsx",
      student_no: params.student_no,
      student_name: params.student_name,
      min_score: params.min_score,
      max_score: params.max_score,
      sort_order: params.sort_order
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
      if (selectedCourseKey.value) await loadCourseGrades();
    } finally {
      loading.value = false;
    }
  }
};

onMounted(reload);
</script>

<style scoped lang="scss">
/* 设计 token 与复用 mixin 来自全局 @/styles/var.scss（vite 自动注入） */
.score-query-page {
  @include score-page;
}

/* 卡片：页头卡 + 内容 surface 卡 */
.query-header,
.query-surface {
  @include score-card;
}
.query-header {
  @include score-header;

  margin-bottom: 14px;
}
.surface-head {
  display: flex;
  gap: 14px;
  align-items: center;
  justify-content: space-between;
}

/* 页头标题区：signature 竖条 + eyebrow */
.query-heading {
  display: flex;
  gap: 12px;
  align-items: center;
}
.brand-bar {
  @include score-brand-bar;
}
.eyebrow {
  @include score-eyebrow;
}
.surface-head h3 {
  margin: 2px 0 0;
  font-size: 15px;
  font-weight: 600;
  color: $score-ink;
}
.query-surface {
  padding: 18px 20px;
}
.student-login-tip {
  margin-bottom: 14px;
}
.surface-subtitle {
  margin: 4px 0 0;
  font-size: 13px;
  color: $score-ink-soft;
}

/* 筛选区 → 成块工具条 */
.teacher-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}
.filter-bar {
  @include score-filter-bar;

  justify-content: flex-end;
}
.filter-control {
  width: 180px;
}
.filter-control.course-filter {
  width: 260px;
}
.filter-control.narrow {
  width: 120px;
}
.filter-control.score-input {
  width: 110px;
}
.semester-filter {
  width: 180px;
}
.surface-alert {
  margin: 12px 0;
}
.query-pagination {
  justify-content: flex-end;
  margin-top: 14px;
}
.component-head {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
  small {
    color: $score-ink-soft;
  }
}
.grade-detail-panel {
  padding: 8px 12px 12px 36px;
}
.detail-empty {
  margin: 0;
  color: $score-ink-soft;
}

/* 表头 signature + 总评/GPA 强调列（scoped 下需 :deep 命中 EP 内部） */
.query-surface :deep(.el-table) {
  @include score-table-theme;
}
</style>
