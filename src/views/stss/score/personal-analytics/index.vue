<template>
  <div class="personal-analytics-page">
    <section class="analytics-header">
      <div>
        <p class="eyebrow">成绩管理</p>
        <h2>个人成绩统计</h2>
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

const loading = ref(false);
const statistics = ref<Score.StudentStatistics | null>(null);
const rankings = computed(() => statistics.value?.course_rankings ?? []);

const loadStatistics = async () => {
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
  min-height: 100%;
  padding: 18px;
  background: linear-gradient(135deg, rgb(247 248 250 / 96%), rgb(239 244 242 / 92%));
}
.analytics-header,
.metric-tile,
.analytics-surface {
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
  color: #1c846d;
}
.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-top: 12px;
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
