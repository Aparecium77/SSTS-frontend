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
          <el-empty v-if="!outcome" description="提交后在此显示结果" />
          <template v-else>
            <el-result :icon="outcome.icon" :title="outcome.title" :sub-title="outcome.sub">
              <template v-if="outcome.queue" #extra>
                <el-tag type="warning">队列位置 {{ outcome.queue.position }}，{{ outcome.queue.retry_after_ms }}ms 后重试</el-tag>
              </template>
            </el-result>
          </template>
        </el-card>
      </el-col>
    </el-row>
  </CsPage>
</template>

<script setup lang="ts" name="courseEnrollment">
import { reactive, ref } from "vue";
import CsPage from "../components/CsPage.vue";
import { CourseSelection } from "@/api/interface/courseSelection";
import { dropEnrollmentApi, enrollApi, swapEnrollmentApi } from "@/api/modules/courseSelection";

const USE_MOCK = true;

const form = reactive<CourseSelection.EnrollReq>({ offering_id: "B-CS101-2026-1-01", stage: "add_drop" });
const swap = reactive<CourseSelection.SwapReq>({ drop_id: "", add_offering_id: "" });
const loading = ref(false);

interface Outcome {
  icon: "success" | "warning" | "error" | "info";
  title: string;
  sub?: string;
  queue?: CourseSelection.QueuePosition;
}
const outcome = ref<Outcome | null>(null);

// 后端错误码 → 结果展示
const CODE_MAP: Record<number, Outcome> = {
  30201: { icon: "warning", title: "已进入排队（Waiting Room）", queue: { position: 37, retry_after_ms: 200 } },
  30202: { icon: "error", title: "规则拒绝", sub: "存在硬性违例，请检查前置课/时间冲突" },
  30203: { icon: "error", title: "课程已满" },
  30204: { icon: "error", title: "重复选课" },
  30205: { icon: "info", title: "选课窗口未开放" }
};

async function onEnroll() {
  loading.value = true;
  try {
    if (USE_MOCK) {
      // 演示：满员课给 30203，其余成功
      outcome.value = form.offering_id.includes("CS201")
        ? CODE_MAP[30203]
        : { icon: "success", title: "选课成功", sub: `enrollment_id: 01HENR-${Date.now()}` };
    } else {
      const { data } = await enrollApi(form);
      outcome.value = { icon: "success", title: "选课成功", sub: data.enrollment_id };
    }
  } catch (e: any) {
    outcome.value = CODE_MAP[e?.code] ?? { icon: "error", title: "选课失败", sub: e?.msg };
  } finally {
    loading.value = false;
  }
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
</script>
