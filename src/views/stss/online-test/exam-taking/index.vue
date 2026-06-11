<template>
  <div class="exam-taking-page card">
    <div class="page-hero">
      <div>
        <p class="eyebrow">在线测试 / 学生端</p>
        <h2>{{ mockExamSession.examName }}</h2>
        <p class="description">
          当前页面先用本地 mock 数据把答题流程搭起来，先不依赖后端。选择题和判断题共用同一个答题页，
          通过标签页切换题型更容易维护。
        </p>
      </div>
      <div class="hero-actions">
        <el-tag type="success" effect="light">剩余时间 45:00</el-tag>
        <el-button plain @click="handleSaveDraft">暂存答案</el-button>
        <el-button type="primary" @click="handleSubmit">提交试卷</el-button>
      </div>
    </div>

    <div class="info-grid">
      <div class="info-card">
        <span class="label">试卷编号</span>
        <span class="value">{{ mockExamSession.paperId }}</span>
      </div>
      <div class="info-card">
        <span class="label">题目总数</span>
        <span class="value">{{ mockExamSession.totalQuestions }}</span>
      </div>
      <div class="info-card">
        <span class="label">已作答</span>
        <span class="value">{{ answeredCount }} 题</span>
      </div>
      <div class="info-card">
        <span class="label">暂存时间</span>
        <span class="value">{{ lastSavedAt }}</span>
      </div>
    </div>

    <el-alert
      v-if="submitted"
      class="submit-alert"
      title="已模拟提交成功，后续可以在这里跳转到结果页或成绩分析页。"
      type="success"
      show-icon
      :closable="false"
    />

    <el-tabs v-model="activeType" class="type-tabs">
      <el-tab-pane label="选择题" name="single" />
      <el-tab-pane label="判断题" name="judge" />
    </el-tabs>

    <div class="content-grid">
      <div class="main-column">
        <div class="question-topbar">
          <div>
            <p class="section-title">{{ currentTypeLabel }}</p>
            <p class="section-desc">点击右侧题号切换当前题目，页面先用本地数据模拟答题体验。</p>
          </div>
          <div class="question-nav-actions">
            <el-button :disabled="currentIndex === 0" @click="handlePrevQuestion">上一题</el-button>
            <el-button :disabled="currentIndex === currentQuestionList.length - 1" @click="handleNextQuestion">下一题</el-button>
          </div>
        </div>

        <QuestionBlock v-model="currentAnswer" :question="currentQuestion" />

        <div class="bottom-actions">
          <el-button :disabled="currentIndex === 0" @click="handlePrevQuestion">上一题</el-button>
          <el-button :disabled="currentIndex === currentQuestionList.length - 1" @click="handleNextQuestion">下一题</el-button>
          <el-button plain @click="handleSaveDraft">暂存答案</el-button>
          <el-button type="primary" @click="handleSubmit">提交试卷</el-button>
        </div>
      </div>

      <aside class="side-column">
        <div class="side-card">
          <div class="side-card-head">
            <h3>题号导航</h3>
            <span>{{ currentIndex + 1 }}/{{ currentQuestionList.length }}</span>
          </div>
          <div class="nav-grid">
            <button
              v-for="(question, index) in currentQuestionList"
              :key="question.id"
              class="nav-item"
              :class="{
                active: index === currentIndex,
                answered: Boolean(answerMap[question.id])
              }"
              type="button"
              @click="currentIndex = index"
            >
              {{ index + 1 }}
            </button>
          </div>
        </div>

        <div class="side-card">
          <h3>答题进度</h3>
          <el-progress :percentage="progressPercent" :stroke-width="10" status="success" />
          <div class="progress-text">
            <span>已完成 {{ answeredCount }} 题</span>
            <span>共 {{ currentQuestionList.length }} 题</span>
          </div>
        </div>

        <div class="side-card">
          <h3>开发提示</h3>
          <ul class="tips-list">
            <li>选择题和判断题共用一个答题页即可，不必拆成两个独立页面。</li>
            <li>后续接后端时，只需要把 mock 数据换成接口数据。</li>
            <li>提交成功后可以在同页提示，也可以跳转到结果页。</li>
          </ul>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts" name="examTaking">
import { computed, reactive, ref } from "vue";
import QuestionBlock from "./components/QuestionBlock.vue";
import { mockExamSession, mockJudgeQuestionList, mockSingleQuestionList } from "./mock";
import type { ExamTaking } from "./types";

const activeType = ref<ExamTaking.QuestionType>("single");
const submitted = ref(false);
const lastSavedAt = ref("尚未暂存");

const questionIndexMap = reactive<Record<ExamTaking.QuestionType, number>>({
  single: 0,
  judge: 0
});

const answerMap = reactive<Record<string, string>>({});

const questionListMap: Record<ExamTaking.QuestionType, ExamTaking.QuestionItem[]> = {
  single: mockSingleQuestionList,
  judge: mockJudgeQuestionList
};

const currentQuestionList = computed(() => questionListMap[activeType.value]);

const currentIndex = computed({
  get: () => questionIndexMap[activeType.value],
  set: value => {
    questionIndexMap[activeType.value] = value;
  }
});

const currentQuestion = computed(() => currentQuestionList.value[currentIndex.value]);

const currentAnswer = computed<string>({
  get: () => answerMap[currentQuestion.value.id] ?? "",
  set: value => {
    answerMap[currentQuestion.value.id] = value;
  }
});

const answeredCount = computed(() => currentQuestionList.value.filter(question => Boolean(answerMap[question.id])).length);

const progressPercent = computed(() => {
  if (!currentQuestionList.value.length) return 0;
  return Math.round((answeredCount.value / currentQuestionList.value.length) * 100);
});

const currentTypeLabel = computed(() => (activeType.value === "single" ? "选择题答题区" : "判断题答题区"));

const handlePrevQuestion = () => {
  if (currentIndex.value === 0) return;
  currentIndex.value -= 1;
};

const handleNextQuestion = () => {
  if (currentIndex.value >= currentQuestionList.value.length - 1) return;
  currentIndex.value += 1;
};

const handleSaveDraft = () => {
  lastSavedAt.value = new Date().toLocaleTimeString("zh-CN", { hour12: false });
};

const handleSubmit = () => {
  submitted.value = true;
  handleSaveDraft();
};
</script>

<style scoped lang="scss">
@import "./index";
</style>
