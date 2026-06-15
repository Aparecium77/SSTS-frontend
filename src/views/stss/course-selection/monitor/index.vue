<template>
  <CsPage title="选课监控" desc="实时态势：在线人数、各课余量、规则拒绝分布。对应后端 /admin/dashboard 与 Prometheus 指标。">
    <el-row :gutter="16" class="mb-3">
      <el-col :span="6">
        <el-card shadow="never">
          <el-statistic title="当前在线" :value="dashboard.online_count" />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never">
          <el-statistic title="监控开课数" :value="dashboard.offerings_remaining.length" />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never">
          <el-statistic title="已满课程" :value="fullCount" />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never">
          <el-statistic title="规则拒绝(近1h)" :value="totalViolations" />
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <el-col :span="14">
        <el-card shadow="never" header="热点课程余量">
          <el-table :data="dashboard.offerings_remaining" border max-height="360">
            <el-table-column prop="course_name" label="课程" min-width="140" />
            <el-table-column prop="offering_id" label="开课ID" min-width="160" />
            <el-table-column label="余量" width="220">
              <template #default="{ row }">
                <el-progress
                  :percentage="Math.round((1 - row.remaining / row.max_capacity) * 100)"
                  :status="row.remaining === 0 ? 'exception' : row.remaining < 10 ? 'warning' : 'success'"
                  :format="() => `${row.remaining}/${row.max_capacity}`"
                />
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="10">
        <el-card shadow="never" header="规则拒绝分布">
          <el-empty v-if="!violationRows.length" description="暂无拒绝" />
          <div v-for="r in violationRows" :key="r.code" class="mb-2">
            <div class="flex justify-between text-sm">
              <div>{{ r.label }}</div>
              <div>{{ r.count }}</div>
            </div>
            <el-progress :percentage="Math.round((r.count / totalViolations) * 100)" :show-text="false" />
          </div>
        </el-card>
      </el-col>
    </el-row>
  </CsPage>
</template>

<script setup lang="ts" name="courseMonitor">
import { computed, onMounted, onUnmounted, reactive } from "vue";
import CsPage from "../components/CsPage.vue";
import { CourseSelection } from "@/api/interface/courseSelection";
import { getDashboardApi } from "@/api/modules/courseSelection";

const USE_MOCK = false;

const CODE_LABEL: Record<string, string> = {
  "30102": "时间冲突",
  "30103": "前置课未修",
  "30104": "学分超限",
  "30203": "课程已满"
};

const dashboard = reactive<CourseSelection.Dashboard>({
  online_count: 0,
  offerings_remaining: [],
  rule_violations_dist: {}
});

const mock: CourseSelection.Dashboard = {
  online_count: 1287,
  offerings_remaining: [
    { offering_id: "B-CS101-2026-1-01", course_name: "软件工程", remaining: 12, max_capacity: 60 },
    { offering_id: "B-CS201-2026-1-01", course_name: "数据结构", remaining: 0, max_capacity: 80 },
    { offering_id: "B-CS301-2026-1-01", course_name: "机器学习", remaining: 5, max_capacity: 100 }
  ],
  rule_violations_dist: { "30102": 34, "30103": 12, "30203": 56 }
};

const fullCount = computed(() => dashboard.offerings_remaining.filter(o => o.remaining === 0).length);
const totalViolations = computed(() => Object.values(dashboard.rule_violations_dist).reduce((a, b) => a + b, 0));
const violationRows = computed(() =>
  Object.entries(dashboard.rule_violations_dist).map(([code, count]) => ({ code, count, label: CODE_LABEL[code] || code }))
);

async function load() {
  if (USE_MOCK) {
    Object.assign(dashboard, { ...mock, online_count: 1200 + Math.floor(Math.random() * 200) });
  } else {
    const { data } = await getDashboardApi();
    Object.assign(dashboard, data);
  }
}

let timer: ReturnType<typeof setInterval>;
onMounted(() => {
  load();
  timer = setInterval(load, 5000); // 实时态势轮询
});
onUnmounted(() => clearInterval(timer));
</script>
