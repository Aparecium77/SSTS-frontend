<template>
  <div class="question-block card" :key="question.id">
    <div class="question-head">
      <div>
        <p class="question-meta">
          <span class="meta-score">{{ question.score }}分</span>
          <span class="meta-divider">·</span>
          <span class="meta-difficulty" :class="`difficulty-${difficultyCss}`">{{ difficultyLabel }}</span>
        </p>
        <h3 class="question-title">{{ question.stem }}</h3>
      </div>
      <el-tag :type="question.type === 1 ? 'primary' : 'success'">
        {{ question.type === 1 ? "选择题" : "判断题" }}
      </el-tag>
    </div>

    <Transition name="fade" mode="out-in">
      <div v-if="question.type === 1" key="single" class="options-list">
        <el-radio-group :model-value="modelValue" class="single-option-group" @change="handleChange">
          <el-radio v-for="opt in question.options" :key="opt" :label="opt.charAt(0)" class="option-item">
            {{ opt }}
          </el-radio>
        </el-radio-group>
      </div>

      <div v-else key="judge" class="judge-area">
        <el-radio-group :model-value="modelValue" @change="handleChange">
          <el-radio-button label="true">正确</el-radio-button>
          <el-radio-button label="false">错误</el-radio-button>
        </el-radio-group>
      </div>
    </Transition>

    <el-alert
      v-if="question.analysis"
      class="analysis-box"
      type="info"
      :closable="false"
      show-icon
      :title="`题目解析：${question.analysis}`"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { ExamTaking } from "../types";

const props = defineProps<{
  question: ExamTaking.QuestionItem;
  modelValue: string;
}>();

const emit = defineEmits<{
  (event: "update:modelValue", value: string): void;
}>();

const difficultyMap: Record<ExamTaking.Difficulty, string> = {
  1: "简单",
  2: "中等",
  3: "困难"
};

const difficultyCssMap = ["", "easy", "medium", "hard"];
const difficultyCss = computed(() => difficultyCssMap[props.question.difficulty]);
const difficultyLabel = computed(() => difficultyMap[props.question.difficulty]);

const handleChange = (value: string | number | boolean | undefined) => {
  if (value !== undefined) {
    emit("update:modelValue", String(value));
  }
};
</script>

<style scoped lang="scss">
.question-block {
  min-height: 280px;
  padding: 24px;
}
.question-head {
  display: flex;
  gap: 16px;
  justify-content: space-between;
  margin-bottom: 20px;
}
.question-meta {
  display: flex;
  gap: 4px;
  align-items: center;
  margin: 0 0 8px;
  font-size: 13px;
}
.meta-score {
  font-weight: 600;
  color: #334155;
}
.meta-divider {
  color: #cbd5e1;
}
.meta-difficulty {
  font-weight: 600;
}
.difficulty-easy {
  color: #22c55e;
}
.difficulty-medium {
  color: #f59e0b;
}
.difficulty-hard {
  color: #ef4444;
}
.question-title {
  margin: 0;
  font-size: 22px;
  line-height: 1.6;
  color: #1f2a44;
}
.options-list {
  padding: 8px 0 4px;
}
.single-option-group {
  display: grid;
  gap: 12px;
}
.option-item {
  padding: 14px 16px;
  margin-right: 0;
  background: #ffffff;
  border: 1px solid #dbe5f0;
  border-radius: 14px;
}
.judge-area {
  padding: 8px 0 6px;
}
.analysis-box {
  margin-top: 20px;
}

/* ────── 题型切换过渡动画 ────── */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
