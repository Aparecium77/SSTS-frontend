<template>
  <div class="personal-analytics-page">
    <section class="analytics-header">
      <div class="score-heading">
        <span class="brand-bar" aria-hidden="true"></span>
        <div>
          <p class="eyebrow">成绩管理</p>
          <h2>个人成绩统计</h2>
        </div>
      </div>
      <el-button :icon="Refresh" :loading="loading" @click="loadStatistics">刷新</el-button>
    </section>

    <section class="metric-grid">
      <div class="metric-tile">
        <span>累计 GPA</span>
        <strong>{{ statistics?.cumulative_gpa ?? "-" }}</strong>
      </div>
      <div class="metric-tile">
        <span>加权平均</span>
        <strong>{{ statistics?.weighted_average ?? "-" }}</strong>
      </div>
      <div class="metric-tile">
        <span>已修学分</span>
        <strong>{{ statistics?.earned_credits ?? "-" }}</strong>
      </div>
      <div class="metric-tile">
        <span>通过率</span>
        <strong>{{ statistics?.pass_rate ?? "-" }}%</strong>
      </div>
    </section>

    <section class="analytics-surface">
      <div class="surface-head">
        <h3>学业摘要</h3>
        <div class="summary-tags">
          <el-tag effect="plain">专业：{{ statistics?.major || "未同步" }}</el-tag>
          <el-tag effect="plain">班级：{{ statistics?.class_name || "未同步" }}</el-tag>
          <el-tag effect="plain">不及格门数：{{ statistics?.failed_course_count ?? 0 }}</el-tag>
        </div>
      </div>
      <el-table v-loading="loading" :data="rankings" border empty-text="暂无课程排名数据">
        <el-table-column prop="course_id" label="课程号" min-width="140" />
        <el-table-column prop="semester" label="学期" min-width="130" />
        <el-table-column label="总评" width="110">
          <template #default="{ row }">{{ row.total_score ?? "-" }}</template>
        </el-table-column>
        <el-table-column label="排名" width="140">
          <template #default="{ row }">
            <span v-if="row.rank && row.total_students">{{ row.rank }} / {{ row.total_students }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
      </el-table>

      <div v-if="statistics?.semester_gpa_trend?.length" class="trend-block">
        <div class="surface-head trend-head">
          <h3>学期 GPA 趋势</h3>
          <el-tag effect="plain">当前以后端返回摘要为准</el-tag>
        </div>
        <el-table :data="statistics.semester_gpa_trend" border empty-text="暂无学期趋势数据">
          <el-table-column prop="semester" label="学期" min-width="140" />
          <el-table-column prop="semester_gpa" label="学期 GPA" width="120" />
          <el-table-column prop="weighted_average" label="学期加权平均" width="140" />
        </el-table>
      </div>

      <div v-if="statistics?.failed_courses?.length" class="trend-block">
        <div class="surface-head trend-head">
          <h3>未通过课程</h3>
          <el-tag effect="plain">后端已返回课程名时优先展示课程名</el-tag>
        </div>
        <el-table :data="statistics.failed_courses" border empty-text="暂无未通过课程">
          <el-table-column prop="course_id" label="课程号" min-width="120" />
          <el-table-column prop="course_name" label="课程名" min-width="180" show-overflow-tooltip>
            <template #default="{ row }">{{ row.course_name || "-" }}</template>
          </el-table-column>
          <el-table-column prop="semester" label="学期" min-width="120" />
          <el-table-column prop="score" label="分数" width="100" />
        </el-table>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts" name="personalScoreAnalytics">
import { computed, onMounted, ref } from "vue";
import { Refresh } from "@element-plus/icons-vue";
import type { Score } from "@/api/interface/score";
import { getMyStatistics } from "@/api/modules/score";
import { useStudentOnlyPage } from "@/views/stss/score/_shared/useStudentOnlyPage";

const { ensureStudentAccess } = useStudentOnlyPage();

const loading = ref(false);
const statistics = ref<Score.StudentStatistics | null>(null);
const rankings = computed(() => statistics.value?.course_rankings ?? []);

const loadStatistics = async () => {
  if (!ensureStudentAccess()) return;
  loading.value = true;
  try {
    const resp = await getMyStatistics();
    statistics.value = resp.data;
  } finally {
    loading.value = false;
  }
};

onMounted(loadStatistics);
</script>

<style scoped lang="scss">
.personal-analytics-page {
  @include score-page;
}
.analytics-header,
.metric-tile,
.analytics-surface {
  @include score-card;
}
.analytics-header {
  @include score-header;
}
.score-heading {
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
.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-top: 12px;
}
.metric-tile {
  @include score-metric-tile;
}
.analytics-surface {
  padding: 14px;
  margin-top: 12px;
}
.surface-head {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  h3 {
    margin: 0;
  }
}
.analytics-surface :deep(.el-table) {
  @include score-table-theme;
}
.trend-block {
  margin-top: 16px;
}

@media (width <= 900px) {
  .analytics-header,
  .surface-head {
    flex-direction: column;
    align-items: flex-start;
  }
  .metric-grid {
    grid-template-columns: 1fr;
  }
}
</style>
