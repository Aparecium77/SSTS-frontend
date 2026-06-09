<template>
  <CsPage title="选课 / 退课" desc="提交选课、退课、退一选一。展示规则拒绝、满员、重复选课与排队（Waiting Room）等结果状态。">
    <el-row :gutter="16">
      <el-col :span="12">
        <el-card shadow="never" header="选课 / 退课">
          <el-form :model="form" label-width="90px">
            <el-form-item label="开课 ID"><el-input v-model="form.offering_id" placeholder="B-CS101-2026-1-01" /></el-form-item>
            <el-form-item label="阶段">
              <el-radio-group v-model="form.stage">
                <el-radio-button label="add_drop">补退选</el-radio-button>
                <el-radio-button label="preference">意愿初选</el-radio-button>
              </el-radio-group>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="loading" @click="onEnroll">提交选课</el-button>
              <el-button type="danger" :loading="loading" @click="onDrop">退课</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card shadow="never" header="退一选一（原子）" class="mt-3">
          <el-form :model="swap" label-width="90px">
            <el-form-item label="退课 ID"><el-input v-model="swap.drop_id" /></el-form-item>
            <el-form-item label="改选开课"><el-input v-model="swap.add_offering_id" /></el-form-item>
            <el-form-item><el-button :loading="loading" @click="onSwap">退一选一</el-button></el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card shadow="never" header="操作结果">
          <el-empty v-if="!outcome && !waiting" description="提交后在此显示结果" />
          <template v-if="waiting">
            <el-result icon="warning" title="排队中">
              <template #extra>
                <div class="queue-info">
                  <el-progress
                    :percentage="queuePercent"
                    :stroke-width="20"
                    :format="() => `第 ${queuePos} 位`"
                    color="#e6a23c"
                  />
                  <div class="queue-status">已轮询 {{ retryCount }} 次 · {{ retryAfterMs }}ms 后再次查询</div>
                  <el-button type="danger" plain size="small" @click="cancelWaiting"> 取消排队 </el-button>
                </div>
              </template>
            </el-result>
          </template>
          <template v-else-if="outcome">
            <el-result :icon="outcome.icon" :title="outcome.title" :sub-title="outcome.sub" />
          </template>
        </el-card>
      </el-col>
    </el-row>
  </CsPage>
</template>

<script setup lang="ts" name="courseEnrollment">
import { computed, onMounted, onUnmounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import CsPage from "../components/CsPage.vue";
import { generateUUID } from "@/utils";
import { CourseSelection } from "@/api/interface/courseSelection";
import {
  createEnrollmentEventSource,
  dropEnrollmentApi,
  enrollApi,
  getQueuePositionApi,
  swapEnrollmentApi
} from "@/api/modules/courseSelection";

const USE_MOCK = false;
const MAX_WAIT_RETRIES = 30; // 最多轮询 30 次

// 排队进度（假设 50 位为初始最大值，纯 UI 展示用）
const queuePercent = computed(() => Math.max(0, Math.min(100, 100 - (queuePos.value / 50) * 100)));

const form = reactive<CourseSelection.EnrollReq>({ offering_id: "B-CS101-2026-1-01", stage: "add_drop" });
const swap = reactive<CourseSelection.SwapReq>({ drop_id: "", add_offering_id: "" });
const loading = ref(false);

// Waiting Room 状态
const waiting = ref(false);
const queuePos = ref(0);
const retryAfterMs = ref(1000);
const retryCount = ref(0);
let pollTimer: ReturnType<typeof setTimeout> | null = null;
let idempotencyKey = "";
let eventSource: EventSource | null = null;

interface Outcome {
  icon: "success" | "warning" | "error" | "info";
  title: string;
  sub?: string;
  queue?: CourseSelection.QueuePosition;
}
const outcome = ref<Outcome | null>(null);

// 后端错误码 → 结果展示
const CODE_MAP: Record<number, Outcome> = {
  30202: { icon: "error", title: "规则拒绝", sub: "存在硬性违例，请检查前置课/时间冲突" },
  30203: { icon: "error", title: "课程已满" },
  30204: { icon: "error", title: "重复选课" },
  30205: { icon: "info", title: "选课窗口未开放" }
};

async function onEnroll() {
  loading.value = true;
  waiting.value = false;
  outcome.value = null;
  idempotencyKey = generateUUID();
  try {
    if (USE_MOCK) {
      // 演示：满员课给 30203，其余成功
      outcome.value = form.offering_id.includes("CS201")
        ? CODE_MAP[30203]
        : { icon: "success", title: "选课成功", sub: `enrollment_id: 01HENR-${Date.now()}` };
      return;
    }

    const req = { ...form, idempotency_key: idempotencyKey };
    const { data } = await enrollApi(req);
    outcome.value = { icon: "success", title: "选课成功", sub: data.enrollment_id };
  } catch (e: any) {
    if (e?.code === 30201) {
      // 进入 Waiting Room — 开始轮询
      const queue = e?.data as CourseSelection.QueuePosition | undefined;
      queuePos.value = queue?.position ?? 0;
      retryAfterMs.value = queue?.retry_after_ms ?? 500;
      retryCount.value = 0;
      waiting.value = true;
      outcome.value = {
        icon: "warning",
        title: "已进入排队（Waiting Room）",
        sub: `当前排队位置 ${queuePos.value}`
      };
      pollQueue();
    } else {
      outcome.value = CODE_MAP[e?.code] ?? { icon: "error", title: "选课失败", sub: e?.msg };
    }
  } finally {
    loading.value = false;
  }
}

async function pollQueue() {
  if (pollTimer) clearTimeout(pollTimer);
  if (!waiting.value) return;
  if (retryCount.value >= MAX_WAIT_RETRIES) {
    waiting.value = false;
    outcome.value = { icon: "error", title: "排队超时", sub: "已达最大轮询次数，请稍后重试" };
    return;
  }

  try {
    const { data } = await getQueuePositionApi(form.offering_id);
    queuePos.value = data.position;
    retryAfterMs.value = data.retry_after_ms;

    if (data.position <= 0) {
      // 排到了，重发选课请求
      await retryEnroll();
    } else {
      outcome.value = {
        icon: "warning",
        title: "排队中",
        sub: `当前排队位置 ${data.position}`
      };
      retryCount.value++;
      pollTimer = setTimeout(pollQueue, data.retry_after_ms);
    }
  } catch {
    retryCount.value++;
    pollTimer = setTimeout(pollQueue, retryAfterMs.value);
  }
}

async function retryEnroll() {
  try {
    const { data } = await enrollApi({ ...form, idempotency_key: idempotencyKey });
    waiting.value = false;
    outcome.value = { icon: "success", title: "选课成功", sub: data.enrollment_id };
  } catch (e: any) {
    if (e?.code === 30201) {
      // 还在排队，继续轮询
      const queue = e?.data as CourseSelection.QueuePosition | undefined;
      if (queue) retryAfterMs.value = queue.retry_after_ms;
      retryCount.value++;
      pollTimer = setTimeout(pollQueue, retryAfterMs.value);
    } else {
      waiting.value = false;
      outcome.value = CODE_MAP[e?.code] ?? { icon: "error", title: "选课失败", sub: e?.msg };
    }
  }
}

function cancelWaiting() {
  waiting.value = false;
  if (pollTimer) {
    clearTimeout(pollTimer);
    pollTimer = null;
  }
  outcome.value = { icon: "info", title: "已取消排队" };
}

async function onDrop() {
  loading.value = true;
  try {
    if (!USE_MOCK) await dropEnrollmentApi(form.offering_id);
    outcome.value = { icon: "success", title: "退课成功（幂等）" };
  } finally {
    loading.value = false;
  }
}

async function onSwap() {
  loading.value = true;
  try {
    if (!USE_MOCK) await swapEnrollmentApi(swap);
    outcome.value = { icon: "success", title: "退一选一成功", sub: "两步要么都成、要么全回滚" };
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  if (USE_MOCK) return;
  try {
    eventSource = createEnrollmentEventSource();
    eventSource.addEventListener("queue.position_update", (e: MessageEvent) => {
      const data = JSON.parse(e.data) as { offering_id: string; position: number };
      if (data.offering_id === form.offering_id && waiting.value) {
        queuePos.value = data.position;
        outcome.value = { icon: "warning", title: "排队中", sub: `当前排队位置 ${data.position}` };
      }
    });
    eventSource.addEventListener("enrollment.confirmed", (e: MessageEvent) => {
      const data = JSON.parse(e.data) as { offering_id: string; enrollment_id: string };
      if (data.offering_id === form.offering_id) {
        waiting.value = false;
        if (pollTimer) {
          clearTimeout(pollTimer);
          pollTimer = null;
        }
        outcome.value = { icon: "success", title: "选课成功（SSE 推送）", sub: data.enrollment_id };
      }
    });
    eventSource.addEventListener("idle.warning", (e: MessageEvent) => {
      const data = JSON.parse(e.data) as { countdown_s: number };
      ElMessage.warning(`长时间无操作，将在 ${data.countdown_s}s 后自动释放名额`);
    });
    eventSource.addEventListener("session.expired", () => {
      ElMessage.error("选课会话超时，名额已释放");
      waiting.value = false;
      outcome.value = null;
    });
  } catch {
    // SSE 连接失败不影响核心选课功能
  }
});

onUnmounted(() => {
  if (pollTimer) clearTimeout(pollTimer);
  eventSource?.close();
});
</script>

<style scoped lang="scss">
.queue-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
  min-width: 260px;
  .queue-status {
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }
}
</style>
