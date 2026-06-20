<template>
  <div class="credit-page">
    <section class="credit-header">
      <div>
        <p class="eyebrow">成绩管理</p>
        <h2>学分进展</h2>
      </div>
      <el-button :icon="Refresh" :loading="loading" @click="loadCreditData">刷新</el-button>
    </section>

    <section class="metric-grid">
      <div class="metric-tile">
        <span>已修学分</span>
        <strong>{{ credits?.earned_credits ?? "-" }}</strong>
      </div>
      <div class="metric-tile">
        <span>总要求学分</span>
        <strong>{{ credits?.total_required_credits ?? "未同步" }}</strong>
      </div>
      <div class="metric-tile">
        <span>剩余学分</span>
        <strong>{{ credits?.remaining_credits ?? "-" }}</strong>
      </div>
      <div class="metric-tile">
        <span>累计 GPA</span>
        <strong>{{ statistics?.cumulative_gpa ?? "-" }}</strong>
      </div>
    </section>

    <section class="credit-surface">
      <div v-if="credits" class="surface-meta">
        <el-tag effect="plain">专业：{{ credits.major || "未同步" }}</el-tag>
        <el-tag effect="plain">年级：{{ credits.grade || "未同步" }}</el-tag>
        <el-tag effect="plain">数据来源：{{ credits.data_source || "score-service" }}</el-tag>
      </div>
      <el-alert
        v-if="credits?.total_required_credits === null"
        type="warning"
        :closable="false"
        show-icon
        title="培养方案总学分尚未同步，暂不能展示毕业要求完成率和分类学分进度。"
      />
      <template v-else-if="credits">
        <div class="progress-head">
          <h3>总学分完成率</h3>
          <span>{{ creditPercent }}%</span>
        </div>
        <el-progress :percentage="creditPercent" :stroke-width="16" />
      </template>
      <el-empty v-else v-loading="loading" description="暂无学分数据" />

      <el-table
        v-if="credits?.categories?.length"
        class="category-table"
        :data="credits.categories"
        border
        empty-text="暂无分类学分信息"
      >
        <el-table-column prop="category" label="类别" min-width="160" />
        <el-table-column prop="earned_credits" label="已修" width="110" />
        <el-table-column prop="required_credits" label="要求" width="110" />
        <el-table-column prop="remaining_credits" label="剩余" width="110" />
      </el-table>
    </section>
  </div>
</template>

<script setup lang="ts" name="creditProgress">
import { computed, onMounted, ref } from "vue";
import { Refresh } from "@element-plus/icons-vue";
import type { Score } from "@/api/interface/score";
import { getMyCredits, getMyStatistics } from "@/api/modules/score";
import { useStudentOnlyPage } from "@/views/stss/score/_shared/useStudentOnlyPage";

const { ensureStudentAccess } = useStudentOnlyPage();

const loading = ref(false);
const credits = ref<Score.CreditProgress | null>(null);
const statistics = ref<Score.StudentStatistics | null>(null);

const creditPercent = computed(() => {
  if (!credits.value?.total_required_credits) return 0;
  return Math.min(100, Math.round((credits.value.earned_credits / credits.value.total_required_credits) * 100));
});

const loadCreditData = async () => {
  if (!ensureStudentAccess()) return;
  loading.value = true;
  try {
    const [creditResult, statisticsResult] = await Promise.allSettled([getMyCredits(), getMyStatistics()]);
    if (creditResult.status === "fulfilled") {
      credits.value = creditResult.value.data;
    } else {
      credits.value = null;
    }
    if (statisticsResult.status === "fulfilled") {
      statistics.value = statisticsResult.value.data;
    } else {
      statistics.value = null;
    }
  } finally {
    loading.value = false;
  }
};

onMounted(loadCreditData);
</script>

<style scoped lang="scss">
.credit-page {
  min-height: 100%;
  padding: 18px;
  background: linear-gradient(135deg, rgb(247 248 250 / 96%), rgb(240 245 246 / 92%));
}
.credit-header,
.metric-tile,
.credit-surface {
  background: rgb(255 255 255 / 94%);
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  box-shadow: 0 12px 30px rgb(31 45 61 / 6%);
}
.credit-header {
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
.credit-surface {
  padding: 18px;
  margin-top: 12px;
}
.progress-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  h3 {
    margin: 0;
  }
}

@media (width <= 900px) {
  .credit-header {
    flex-direction: column;
    gap: 14px;
    align-items: flex-start;
  }
  .metric-grid {
    grid-template-columns: 1fr;
  }
}
</style>
