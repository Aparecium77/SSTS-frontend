<template>
  <div class="submit-result-page">
    <!-- 提交中 -->
    <div v-if="submitState === 'submitting'" class="result-body">
      <div class="spinner-wrap">
        <el-icon class="spinner" :size="72"><Loading /></el-icon>
      </div>
      <h2 class="result-title">提交中</h2>
      <p class="result-desc">正在提交你的试卷，请稍候……</p>
    </div>

    <!-- 提交成功 -->
    <div v-else-if="submitState === 'success'" class="result-body">
      <div class="checkmark-wrap">
        <span class="checkmark">✔</span>
      </div>
      <h2 class="result-title success">你已提交成功</h2>
      <p class="result-desc">试卷已成功提交，等待系统评分。</p>
      <div class="result-actions">
        <el-button size="large" type="primary" @click="$emit('goHome')">返回考试列表</el-button>
        <el-button size="large" plain @click="$emit('viewPaper')">查看试卷</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Loading } from "@element-plus/icons-vue";
import type { ExamTaking } from "../types";

defineProps<{
  submitState: ExamTaking.SubmitState;
}>();

defineEmits<{
  (e: "goHome"): void;
  (e: "viewPaper"): void;
}>();
</script>

<style scoped lang="scss">
.submit-result-page {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 500px;
}
.result-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: center;
  max-width: 420px;
  text-align: center;
}

/* ────── 旋转动画 ────── */
.spinner-wrap {
  color: #009688;
  animation: spin 0.9s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ────── 绿色对勾 ────── */
.checkmark-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 96px;
  height: 96px;
  background: #e6f7f5;
  border-radius: 50%;
}
.checkmark {
  font-size: 48px;
  font-weight: 700;
  line-height: 1;
  color: #009688;
}

/* ────── 文字 ────── */
.result-title {
  margin: 0;
  font-size: 26px;
  font-weight: 700;
  color: #1e293b;
  &.success {
    color: #009688;
  }
}
.result-desc {
  margin: 0;
  font-size: 15px;
  line-height: 1.6;
  color: #64748b;
}

/* ────── 按钮组 ────── */
.result-actions {
  display: flex;
  gap: 16px;
  margin-top: 12px;
}
</style>
