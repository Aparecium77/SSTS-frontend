<template>
  <CsPage title="抽签与容量管理" desc="触发抽签批处理、调整课程容量、热更新限流参数（Waiting Room 节奏）。">
    <el-row :gutter="16">
      <el-col :span="12">
        <el-card shadow="never" header="抽签">
          <el-form :model="lottery" label-width="80px">
            <el-form-item label="学期"><el-input v-model="lottery.semester" /></el-form-item>
            <el-form-item label="随机种子">
              <el-input-number v-model="lottery.seed" :min="0" controls-position="right" />
            </el-form-item>
            <el-form-item><el-button type="primary" :loading="loading" @click="onLottery">触发抽签</el-button></el-form-item>
          </el-form>
          <el-alert v-if="run" :closable="false" type="success" show-icon :title="`批次 ${run.run_id} · ${run.status}`" />
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card shadow="never" header="容量调整">
          <el-form :model="cap" label-width="80px">
            <el-form-item label="开课 ID"><el-input v-model="cap.offering_id" /></el-form-item>
            <el-form-item label="增减"><el-input-number v-model="cap.delta" controls-position="right" /></el-form-item>
            <el-form-item label="原因"><el-input v-model="cap.reason" /></el-form-item>
            <el-form-item><el-button :loading="loading" @click="onAdjust">调整容量</el-button></el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card shadow="never" header="管理员代选">
          <el-form :model="proxy" label-width="80px">
            <el-form-item label="学生 ID"><el-input v-model="proxy.student_id" /></el-form-item>
            <el-form-item label="开课 ID"><el-input v-model="proxy.offering_id" /></el-form-item>
            <el-form-item label="原因"><el-input v-model="proxy.reason" /></el-form-item>
            <el-form-item><el-button :loading="loading" @click="onProxyEnroll">提交代选</el-button></el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card shadow="never" header="限流热更新">
          <el-form :model="throttle" label-width="110px">
            <el-form-item label="放行间隔(ms)">
              <el-input-number v-model="throttle.tick_interval_ms" :min="10" controls-position="right" />
            </el-form-item>
            <el-form-item label="每拍放行数">
              <el-input-number v-model="throttle.capacity_per_tick" :min="1" controls-position="right" />
            </el-form-item>
            <el-form-item label="单用户 r/s">
              <el-input-number v-model="throttle.per_user_rps" :min="1" controls-position="right" />
            </el-form-item>
            <el-form-item><el-button :loading="loading" @click="onThrottle">应用限流</el-button></el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>
  </CsPage>
</template>

<script setup lang="ts" name="courseCapacity">
import { reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import CsPage from "../components/CsPage.vue";
import { CourseSelection } from "@/api/interface/courseSelection";
import { adjustCapacityApi, proxyEnrollApi, triggerLotteryApi, updateThrottleApi } from "@/api/modules/courseSelection";

const USE_MOCK = false;

const lottery = reactive<CourseSelection.LotteryRunReq>({ semester: "2026-1", seed: 12345 });
const cap = reactive<CourseSelection.CapacityAdjustReq & { offering_id: string }>({
  offering_id: "B-CS101-2026-1-01",
  delta: 10,
  reason: "增开名额"
});
const proxy = reactive<CourseSelection.ProxyEnrollReq>({
  student_id: "student",
  offering_id: "B-CS101-2026-1-01",
  reason: "教务代选"
});
const throttle = reactive<CourseSelection.ThrottleReq>({ tick_interval_ms: 200, capacity_per_tick: 50, per_user_rps: 5 });
const run = ref<CourseSelection.LotteryRun | null>(null);
const loading = ref(false);

async function onLottery() {
  loading.value = true;
  try {
    if (USE_MOCK) {
      run.value = { run_id: `01HLOT-${Date.now()}`, status: "running", semester: lottery.semester, seed: lottery.seed };
    } else {
      const { data } = await triggerLotteryApi(lottery);
      run.value = data;
    }
    ElMessage.success("抽签已触发");
  } finally {
    loading.value = false;
  }
}

async function onAdjust() {
  loading.value = true;
  try {
    if (!USE_MOCK) await adjustCapacityApi(cap.offering_id, { delta: cap.delta, reason: cap.reason });
    ElMessage.success("容量已调整（同步 Redis 与 DB）");
  } finally {
    loading.value = false;
  }
}

async function onProxyEnroll() {
  loading.value = true;
  try {
    if (!USE_MOCK) await proxyEnrollApi(proxy);
    ElMessage.success("管理员代选已提交");
  } finally {
    loading.value = false;
  }
}

async function onThrottle() {
  loading.value = true;
  try {
    if (!USE_MOCK) await updateThrottleApi(throttle);
    ElMessage.success("限流参数已热更新");
  } finally {
    loading.value = false;
  }
}
</script>
