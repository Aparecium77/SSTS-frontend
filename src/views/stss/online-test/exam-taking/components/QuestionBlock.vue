<template>
  <div class="question-block card">
    <div class="question-head">
      <div>
        <p class="question-type">{{ questionTypeLabel }}</p>
        <h3 class="question-title">{{ question.stem }}</h3>
      </div>
      <el-tag v-if="question.type === 'single'" type="primary">选择题</el-tag>
      <el-tag v-else type="success">判断题</el-tag>
    </div>

    <div v-if="question.type === 'single'" class="options-list">
      <el-radio-group :model-value="modelValue" class="single-option-group" @change="handleChange">
        <el-radio v-for="option in question.options ?? []" :key="option.value" :label="option.value" class="option-item">
          {{ option.label }}
        </el-radio>
      </el-radio-group>
    </div>

    <div v-else class="judge-area">
      <el-radio-group :model-value="modelValue" @change="handleChange">
        <el-radio-button label="true">正确</el-radio-button>
        <el-radio-button label="false">错误</el-radio-button>
      </el-radio-group>
    </div>

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

const questionTypeLabel = computed(() => (props.question.type === "single" ? "选择题作答区" : "判断题作答区"));

const handleChange = (value: string) => {
  emit("update:modelValue", value);
};
</script>

<style scoped lang="scss">
.question-block {
  padding: 24px;
}
.question-head {
  display: flex;
  gap: 16px;
  justify-content: space-between;
  margin-bottom: 20px;
}
.question-type {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 700;
  color: #009688;
  text-transform: uppercase;
  letter-spacing: 0.08em;
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
</style>
