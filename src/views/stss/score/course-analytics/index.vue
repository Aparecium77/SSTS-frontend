<template>
  <div class="course-analytics-page">
    <section class="analytics-header">
      <div>
        <p class="eyebrow">成绩管理</p>
        <h2>课程成绩分析</h2>
      </div>
      <div class="header-actions">
        <el-button :icon="Refresh" :loading="loading" @click="reload">刷新</el-button>
        <el-button type="primary" :icon="Download" :disabled="!analysis" :loading="exporting" @click="handleExport">
          导出 Excel
        </el-button>
      </div>
    </section>

    <section class="analytics-filters">
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
        @change="loadAnalysis"
      >
        <el-option v-for="semester in semesterOptions" :key="semester" :label="semester" :value="semester" />
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
          <el-tag effect="plain">后端当前不返回学生排名明细表</el-tag>
        </div>
        <div class="summary-tags">
          <el-tag v-for="[key, value] in rankingSummaryEntries" :key="key" effect="dark">{{ key }}：{{ value }}</el-tag>
        </div>
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

const loading = ref(false);
const exporting = ref(false);
const courses = ref<Score.Course[]>([]);
const selectedCourseId = ref("");
const selectedSemester = ref("");
const analysis = ref<Score.CourseAnalysis | null>(null);

const semesterOptions = computed(() => {
  const semesters = courses.value
    .filter(course => !selectedCourseId.value || course.course_id === selectedCourseId.value)
    .map(course => course.semester);
  return Array.from(new Set(semesters));
});

const rankingSummaryEntries = computed(() => Object.entries(analysis.value?.ranking_summary ?? {}));

const courseLabel = (course: Score.Course) => `${course.course_name || course.course_id} · ${course.semester}`;

const loadCourses = async () => {
  const resp = await getGradeCourses();
  courses.value = resp.data.courses;
  if (!selectedCourseId.value && courses.value.length) {
    selectedCourseId.value = courses.value[0].course_id;
    selectedSemester.value = courses.value[0].semester;
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
  const matched = courses.value.find(course => course.course_id === selectedCourseId.value);
  selectedSemester.value = matched?.semester || "";
  loadAnalysis();
};

const handleExport = async () => {
  if (!analysis.value) return;
  exporting.value = true;
  try {
    const resp = await exportCourseAnalysis(selectedCourseId.value, {
      semester: selectedSemester.value,
      format: "xlsx"
    });
    const blob = new Blob([resp.data], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${selectedCourseId.value}-${selectedSemester.value}-成绩分析.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
    ElMessage.success("导出已开始");
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
.summary-panel {
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
