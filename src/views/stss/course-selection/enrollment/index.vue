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
            <el-form-item label="退课 ID"><el-input v-model="dropId" placeholder="我的选课中的 enrollment_id" /></el-form-item>
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
                  <el-alert v-if="queueHint" :closable="false" :title="queueHint" show-icon type="info" />
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
import { dropEnrollmentApi, enrollApi, getQueuePositionApi, swapEnrollmentApi } from "@/api/modules/courseSelection";

const USE_MOCK = false;
const MAX_WAIT_RETRIES = 30; // 最多轮询 30 次
const PENDING_QUEUE_KEY = "course-selection-pending-queue";

// 排队进度（假设 50 位为初始最大值，纯 UI 展示用）
const queuePercent = computed(() => Math.max(0, Math.min(100, 100 - (queuePos.value / 50) * 100)));

const form = reactive<CourseSelection.EnrollReq>({ offering_id: "B-CS101-2026-1-01", stage: "add_drop" });
const swap = reactive<CourseSelection.SwapReq>({ drop_id: "", add_offering_id: "" });
const dropId = ref("");
const loading = ref(false);

// Waiting Room 状态
const waiting = ref(false);
const queuePos = ref(0);
const retryAfterMs = ref(1000);
const retryCount = ref(0);
const queueHint = ref("");
let pollTimer: ReturnType<typeof setTimeout> | null = null;
let idempotencyKey = "";

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

function isEnrollResult(
  data: CourseSelection.EnrollResult | CourseSelection.QueuePosition
): data is CourseSelection.EnrollResult {
  return "enrollment_id" in data;
}

const savePendingQueue = (queue: CourseSelection.QueuePosition) => {
  sessionStorage.setItem(
    PENDING_QUEUE_KEY,
    JSON.stringify({
      offering_id: form.offering_id,
      stage: form.stage,
      idempotency_key: idempotencyKey,
      queue
    })
  );
};

const clearPendingQueue = () => sessionStorage.removeItem(PENDING_QUEUE_KEY);

const enterQueue = (queue: CourseSelection.QueuePosition) => {
  queuePos.value = queue.position;
  retryAfterMs.value = queue.retry_after_ms;
  retryCount.value = 0;
  waiting.value = true;
  queueHint.value = "";
  outcome.value = {
    icon: "warning",
    title: "已进入排队（Waiting Room）",
    sub: `当前排队位置 ${queuePos.value}`
  };
  savePendingQueue(queue);
  pollQueue();
};

const restorePendingQueue = () => {
  const raw = sessionStorage.getItem(PENDING_QUEUE_KEY);
  if (!raw) return;
  try {
    const cached = JSON.parse(raw) as {
      offering_id?: string;
      stage?: CourseSelection.Stage;
      idempotency_key?: string;
      queue?: CourseSelection.QueuePosition;
    };
    if (!cached.offering_id || !cached.queue) return;
    form.offering_id = cached.offering_id;
    form.stage = cached.stage ?? "add_drop";
    idempotencyKey = cached.idempotency_key || generateUUID();
    enterQueue(cached.queue);
  } catch {
    clearPendingQueue();
  }
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
    if (!isEnrollResult(data)) {
      enterQueue(data);
      return;
    }
    clearPendingQueue();
    outcome.value = { icon: "success", title: "选课成功", sub: data.enrollment_id };
  } catch (e: any) {
    if (e?.code === 30201) {
      // 进入 Waiting Room — 开始轮询
      const queue = e?.data as CourseSelection.QueuePosition | undefined;
      enterQueue(queue ?? { position: 0, retry_after_ms: 500 });
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
    queueHint.value = "暂未排到，请稍后刷新或重新提交。";
    pollTimer = null;
    return;
  }

  try {
    const { data } = await getQueuePositionApi(form.offering_id);
    queuePos.value = data.position;
    retryAfterMs.value = data.retry_after_ms;
    savePendingQueue(data);

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
      queueHint.value = "";
      pollTimer = setTimeout(pollQueue, data.retry_after_ms);
    }
  } catch {
    retryCount.value++;
    queueHint.value = "暂时无法获取最新排队位置，稍后自动重试。";
    pollTimer = setTimeout(pollQueue, retryAfterMs.value);
  }
}

async function retryEnroll() {
  try {
    const { data } = await enrollApi({ ...form, idempotency_key: idempotencyKey });
    if (!isEnrollResult(data)) {
      queuePos.value = data.position;
      retryAfterMs.value = data.retry_after_ms;
      savePendingQueue(data);
      retryCount.value++;
      pollTimer = setTimeout(pollQueue, retryAfterMs.value);
      return;
    }
    waiting.value = false;
    clearPendingQueue();
    outcome.value = { icon: "success", title: "选课成功", sub: data.enrollment_id };
  } catch (e: any) {
    if (e?.code === 30201) {
      // 还在排队，继续轮询
      const queue = e?.data as CourseSelection.QueuePosition | undefined;
      if (queue) retryAfterMs.value = queue.retry_after_ms;
      retryCount.value++;
      queueHint.value = "";
      pollTimer = setTimeout(pollQueue, retryAfterMs.value);
    } else {
      waiting.value = false;
      clearPendingQueue();
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
  clearPendingQueue();
  queueHint.value = "";
  outcome.value = { icon: "info", title: "已取消排队" };
}

async function onDrop() {
  if (!dropId.value.trim()) {
    ElMessage.warning("请填写我的选课中的退课 ID");
    return;
  }
  loading.value = true;
  try {
    if (!USE_MOCK) await dropEnrollmentApi(dropId.value.trim());
    clearPendingQueue();
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

onUnmounted(() => {
  if (pollTimer) clearTimeout(pollTimer);
});

onMounted(restorePendingQueue);
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
