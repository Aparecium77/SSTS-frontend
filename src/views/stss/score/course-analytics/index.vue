<template>
  <div class="course-analytics-page">
    <section class="analytics-header">
      <div>
        <p class="eyebrow">成绩管理</p>
        <h2>课程成绩分析</h2>
      </div>
      <div class="header-actions">
        <el-button :icon="Refresh" :loading="loading" @click="reload">刷新</el-button>
        <el-button type="primary" :icon="Download" :disabled="!analysis" :loading="exportingXlsx" @click="handleExport('xlsx')">
          导出 Excel
        </el-button>
        <el-button :icon="Download" :disabled="!analysis" :loading="exportingPdf" @click="handleExport('pdf')">
          导出 PDF
        </el-button>
      </div>
    </section>

    <section class="analytics-filters">
      <el-select
        v-model="selectedCourseKey"
        placeholder="选择课程"
        clearable
        filterable
        class="filter-control"
        @change="handleCourseChange"
      >
        <el-option
          v-for="course in availableCourses"
          :key="toCourseKey(course.course_id, course.semester)"
          :label="courseOptionLabel(course)"
          :value="toCourseKey(course.course_id, course.semester)"
        />
      </el-select>
    </section>

    <template v-if="analysis">
      <section class="metric-grid">
        <div class="metric-tile">
          <span>平均分</span>
          <strong>{{ analysis.average_score }}</strong>
        </div>
        <div class="metric-tile">
          <span>最高分</span>
          <strong>{{ analysis.max_score }}</strong>
        </div>
        <div class="metric-tile">
          <span>最低分</span>
          <strong>{{ analysis.min_score }}</strong>
        </div>
        <div class="metric-tile">
          <span>通过率</span>
          <strong>{{ analysis.pass_rate }}%</strong>
        </div>
      </section>

      <section class="analytics-grid">
        <div class="analytics-panel">
          <div class="panel-head">
            <h3>分数段分布</h3>
            <span>{{ analysis.total_students }} 人</span>
          </div>
          <div class="bar-list">
            <div v-for="item in analysis.distribution" :key="item.range" class="bar-row">
              <span>{{ item.range }}</span>
              <el-progress :percentage="Math.round(item.percentage)" :stroke-width="12" />
              <strong>{{ item.count }}</strong>
            </div>
          </div>
        </div>

        <div class="analytics-panel">
          <div class="panel-head">
            <h3>等级统计</h3>
            <span>优秀率 {{ analysis.excellent_rate }}%</span>
          </div>
          <div class="bar-list">
            <div v-for="item in analysis.grade_levels" :key="item.level" class="bar-row">
              <span>{{ item.level }}</span>
              <el-progress :percentage="Math.round(item.percentage)" :stroke-width="12" status="success" />
              <strong>{{ item.count }}</strong>
            </div>
          </div>
        </div>
      </section>

      <section class="analytics-panel summary-panel">
        <div class="panel-head">
          <h3>排名摘要</h3>
        </div>
        <div class="summary-tags">
          <el-tag v-for="[key, value] in rankingSummaryEntries" :key="key" effect="dark">{{ key }}：{{ value }}</el-tag>
        </div>
      </section>

      <section v-if="analysis.rankings?.length" class="analytics-panel table-panel">
        <div class="panel-head">
          <h3>完整排名表</h3>
          <span>共 {{ analysis.rankings.length }} 人</span>
        </div>
        <el-table :data="analysis.rankings" border max-height="360" empty-text="暂无排名数据">
          <el-table-column prop="rank" label="名次" width="80" align="center" />
          <el-table-column prop="student_no" label="学号" min-width="120" />
          <el-table-column prop="student_name" label="姓名" min-width="110" />
          <el-table-column prop="total_score" label="总评" width="100" align="center" />
          <el-table-column prop="gpa" label="GPA" width="100" align="center" />
        </el-table>
      </section>

      <section v-if="analysis.historical_comparison?.length" class="analytics-panel table-panel">
        <div class="panel-head">
          <h3>历年同课程对比</h3>
        </div>
        <el-table :data="analysis.historical_comparison" border empty-text="暂无历年数据">
          <el-table-column prop="semester" label="学期" min-width="140" />
          <el-table-column prop="student_count" label="人数" width="90" align="center" />
          <el-table-column prop="average_score" label="平均分" width="110" align="center" />
          <el-table-column prop="pass_rate" label="通过率(%)" width="120" align="center" />
          <el-table-column prop="excellent_rate" label="优秀率(%)" width="120" align="center" />
        </el-table>
      </section>
    </template>

    <section v-else class="empty-panel">
      <el-empty v-loading="loading" description="请选择课程和学期查看分析" />
    </section>
  </div>
</template>

<script setup lang="ts" name="courseScoreAnalytics">
import { computed, onMounted, ref } from "vue";
import { Download, Refresh } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import type { Score } from "@/api/interface/score";
import { exportCourseAnalysis, getCourseAnalysis, getGradeCourses } from "@/api/modules/score";
import { courseOptionLabel, findCourseByKey, parseCourseKey, toCourseKey } from "@/views/stss/score/_shared/courseSelection";

const loading = ref(false);
const exportingXlsx = ref(false);
const exportingPdf = ref(false);
const courses = ref<Score.Course[]>([]);
const selectedCourseKey = ref("");
const analysis = ref<Score.CourseAnalysis | null>(null);

const availableCourses = computed(() => courses.value.filter(course => course.course_id && course.semester));
const selectedCourseId = computed(() => parseCourseKey(selectedCourseKey.value).courseId);
const selectedSemester = computed(() => parseCourseKey(selectedCourseKey.value).semester);

const rankingSummaryEntries = computed(() => Object.entries(analysis.value?.ranking_summary ?? {}));

const loadCourses = async () => {
  const resp = await getGradeCourses();
  courses.value = resp.data.courses;
  if (!findCourseByKey(availableCourses.value, selectedCourseKey.value) && availableCourses.value[0]) {
    const first = availableCourses.value[0];
    selectedCourseKey.value = toCourseKey(first.course_id, first.semester);
  }
};

const loadAnalysis = async () => {
  if (!selectedCourseId.value || !selectedSemester.value) {
    analysis.value = null;
    return;
  }
  loading.value = true;
  try {
    const resp = await getCourseAnalysis(selectedCourseId.value, { semester: selectedSemester.value });
    analysis.value = resp.data;
  } finally {
    loading.value = false;
  }
};

const reload = async () => {
  await loadCourses();
  await loadAnalysis();
};

const handleCourseChange = () => {
  loadAnalysis();
};

const handleExport = async (format: "xlsx" | "pdf") => {
  if (!analysis.value || !selectedCourseId.value || !selectedSemester.value) return;
  const exporting = format === "pdf" ? exportingPdf : exportingXlsx;
  exporting.value = true;
  try {
    const resp = await exportCourseAnalysis(selectedCourseId.value, {
      semester: selectedSemester.value,
      format
    });
    const mime = format === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    const blob = new Blob([resp.data], { type: mime });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${selectedCourseId.value}-${selectedSemester.value}-成绩分析.${format === "pdf" ? "pdf" : "xlsx"}`;
    link.click();
    window.URL.revokeObjectURL(url);
    ElMessage.success(format === "pdf" ? "PDF 导出已开始" : "Excel 导出已开始");
  } finally {
    exporting.value = false;
  }
};

onMounted(reload);
</script>

<style scoped lang="scss">
.course-analytics-page {
  min-height: 100%;
  padding: 18px;
  background: linear-gradient(135deg, rgb(247 248 250 / 96%), rgb(240 245 246 / 92%));
}
.analytics-header,
.analytics-filters,
.metric-tile,
.analytics-panel,
.empty-panel {
  background: rgb(255 255 255 / 94%);
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  box-shadow: 0 12px 30px rgb(31 45 61 / 6%);
}
.analytics-header {
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
  color: #187992;
}
.header-actions,
.analytics-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}
.analytics-filters {
  padding: 12px;
  margin-top: 12px;
}
.filter-control {
  width: 260px;
}
.metric-grid,
.analytics-grid {
  display: grid;
  gap: 12px;
  margin-top: 12px;
}
.metric-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}
.analytics-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.metric-tile {
  display: grid;
  gap: 8px;
  min-height: 112px;
  padding: 18px;
  span {
    color: var(--el-text-color-secondary);
  }
  strong {
    font-size: 28px;
    color: #1f2d3d;
  }
}
.analytics-panel,
.empty-panel {
  padding: 16px;
}
.summary-panel,
.table-panel {
  margin-top: 12px;
}
.panel-head {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  h3 {
    margin: 0;
  }
  span {
    color: var(--el-text-color-secondary);
  }
}
.bar-list {
  display: grid;
  gap: 12px;
}
.bar-row {
  display: grid;
  grid-template-columns: 72px minmax(120px, 1fr) 48px;
  gap: 10px;
  align-items: center;
}
.summary-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

@media (width <= 900px) {
  .analytics-header,
  .panel-head {
    flex-direction: column;
    align-items: flex-start;
  }
  .filter-control {
    width: 100%;
  }
  .metric-grid,
  .analytics-grid {
    grid-template-columns: 1fr;
  }
}
</style>
