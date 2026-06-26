<template>
  <div class="analytics-page">
    <!-- 无数据 -->
    <template v-if="!review">
      <div class="no-data">
        <el-empty description="该考试暂无作答记录或成绩尚未开放" />
        <el-button plain @click="backToList">返回考试列表</el-button>
      </div>
    </template>

    <template v-else>
      <!-- 返回按钮 -->
      <div class="back-row">
        <el-button plain size="small" @click="backToList">← 返回考试列表</el-button>
      </div>

      <!-- 顶部信息栏 -->
      <header class="analytics-header">
        <div>
          <h2 class="exam-title">{{ review.examTitle }}</h2>
          <p class="submit-time">提交时间：{{ formatTime(review.submitTime) }}</p>
        </div>
        <div v-if="review.scoreVisible" class="header-right">
          <div class="total-score-box">
            <span class="score-big">{{ review.totalScore }}</span>
            <span class="score-divider">/</span>
            <span class="score-full">{{ review.fullScore }}</span>
          </div>
        </div>
      </header>

      <!-- 成绩未开放提示 -->
      <el-alert
        v-if="!review.scoreVisible"
        class="section-alert"
        title="成绩尚未开放"
        description="老师暂未开放本次考试的成绩查看权限，请耐心等待。"
        type="info"
        show-icon
        :closable="false"
      />

      <!-- 统计卡片 -->
      <div v-if="review.scoreVisible" class="stats-row">
        <div class="stat-card">
          <span class="stat-label">正确题数</span>
          <span class="stat-value">{{ correctCount }} / {{ review.questions.length }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">正确率</span>
          <span class="stat-value highlight">{{ correctRate }}%</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">得分</span>
          <span class="stat-value highlight">{{ review.totalScore }} / {{ review.fullScore }}</span>
        </div>
      </div>

      <!-- 逐题列表 -->
      <div class="questions-section">
        <div class="section-title-row">
          <h3 class="section-title">
            逐题分析
            <span v-if="!review.scoreVisible" class="section-hint">（成绩开放后可查看得分）</span>
          </h3>
          <el-button v-if="review.answerVisible" size="small" plain @click="toggleRevealAll">
            {{ allRevealed ? "隐藏全部答案" : "显示全部答案" }}
          </el-button>
        </div>

        <div class="question-list">
          <div
            v-for="q in review.questions"
            :key="q.questionId"
            class="question-card"
            :class="{
              'is-revealed': currentRevealed[q.questionId],
              'is-correct': currentRevealed[q.questionId] && review.scoreVisible && q.isCorrect,
              'is-wrong': currentRevealed[q.questionId] && review.scoreVisible && q.isCorrect === false
            }"
          >
            <div class="q-header">
              <span class="q-index">
                <span class="q-num">{{ q.sortOrder }}</span>
                <span v-if="currentRevealed[q.questionId] && review.scoreVisible" class="q-icon">{{
                  q.isCorrect ? "✔" : "✘"
                }}</span>
              </span>
              <span v-if="review.scoreVisible && q.score !== null" class="q-score">{{ q.score }} 分</span>
            </div>

            <p class="q-stem">{{ q.stem }}</p>

            <!-- 选择题选项 -->
            <div v-if="q.type === 1" class="q-options">
              <div
                v-for="opt in q.options"
                :key="opt"
                class="q-option"
                :class="{
                  'option-chosen': !currentRevealed[q.questionId] && opt.startsWith(q.studentAnswer + '.'),
                  'option-wrong':
                    currentRevealed[q.questionId] &&
                    review.scoreVisible &&
                    q.isCorrect === false &&
                    opt.startsWith(q.studentAnswer + '.'),
                  'option-answer': currentRevealed[q.questionId] && review.answerVisible && opt.startsWith(q.standardAnswer + '.')
                }"
              >
                {{ opt }}
              </div>
            </div>

            <!-- 判断题 -->
            <div v-else class="q-judge-row">
              <span class="judge-btn" :class="judgeBtnClass(q, 'true')">正确</span>
              <span class="judge-btn" :class="judgeBtnClass(q, 'false')">错误</span>
            </div>

            <!-- 答案区域 -->
            <div v-if="review.answerVisible" class="answer-toggle">
              <template v-if="!currentRevealed[q.questionId]">
                <div class="answer-bar">
                  <el-button size="small" text type="primary" @click="toggleReveal(q.questionId)"> 👁 查看答案 </el-button>
                </div>
              </template>
              <template v-else>
                <div class="standard-answer">
                  <span class="answer-label">标准答案：</span>
                  <span v-if="q.options.length" class="answer-text">
                    <template v-for="opt in q.options" :key="opt">
                      <span v-if="opt.startsWith(q.standardAnswer + '.')">{{ opt }}</span>
                    </template>
                  </span>
                  <span v-else class="answer-text">
                    {{ q.standardAnswer === "true" ? "正确" : "错误" }}
                  </span>
                  <el-button size="small" text type="info" class="hide-answer-btn" @click="toggleReveal(q.questionId)">
                    隐藏答案
                  </el-button>
                </div>
              </template>
            </div>
            <p v-else class="answer-locked">🔒 答案暂未开放</p>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts" name="examAnalytics">
import { computed, onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { getExamRecordReview } from "@/api/modules/onlineTest";
import { reviewMap } from "./mock";
import type { ExamAnalytics } from "./types";

const route = useRoute();
const router = useRouter();

/* ────── 路由参数 ────── */
const examIdParam = (route.query.examId as string) || "";
const numericExamId = parseInt(examIdParam.replace("exam-00", ""), 10) || 1;

/* ────── 数据 ────── */
const review = ref<ExamAnalytics.ExamReview | null>(reviewMap[examIdParam] ?? null);

const fetchReview = async () => {
  try {
    const res = await getExamRecordReview({ examId: numericExamId, studentId: 91002 });
    review.value = {
      recordId: res.recordId,
      examId: res.examId,
      examTitle: res.examTitle,
      studentId: res.studentId,
      submitTime: res.submitTime,
      totalScore: res.totalScore,
      scoreVisible: res.scoreVisible,
      answerVisible: res.answerVisible,
      fullScore: 100,
      questions: res.questions.map(q => ({
        questionId: q.questionId,
        sortOrder: q.sortOrder,
        type: q.type,
        stem: q.stem,
        options: q.options,
        studentAnswer: q.studentAnswer,
        score: q.score,
        isCorrect: (q.isCorrect as unknown) === 1 || q.isCorrect === true,
        standardAnswer: q.standardAnswer
      }))
    };
  } catch {
    console.warn("getExamRecordReview API 调用失败，使用 mock 数据");
  }
};

onMounted(() => {
  if (numericExamId) fetchReview();
});

/* ────── 答案显示控制（每题独立，默认隐藏） ────── */
const currentRevealed = reactive<Record<number, boolean>>({});
const allRevealed = computed(() => {
  if (!review.value) return false;
  return review.value.questions.every(q => currentRevealed[q.questionId]);
});

const judgeBtnClass = (q: ExamAnalytics.QuestionDetail, value: string) => {
  const revealed = currentRevealed[q.questionId];
  const isChosen = q.studentAnswer === value;
  const isAnswer = q.standardAnswer === value;
  return {
    "judge-chosen": !revealed && isChosen,
    "judge-wrong": revealed && !!review.value?.scoreVisible && q.isCorrect === false && isChosen,
    "judge-answer": revealed && !!review.value?.answerVisible && isAnswer
  };
};

const toggleReveal = (questionId: number) => {
  currentRevealed[questionId] = !currentRevealed[questionId];
};

const toggleRevealAll = () => {
  if (!review.value) return;
  const target = !allRevealed.value;
  review.value.questions.forEach(q => {
    currentRevealed[q.questionId] = target;
  });
};

/* ────── 统计 ────── */
const correctCount = computed(() => review.value?.questions.filter(q => q.isCorrect).length ?? 0);

const correctRate = computed(() => {
  if (!review.value || !review.value.questions.length) return 0;
  return Math.round((correctCount.value / review.value.questions.length) * 100);
});

/* ────── 时间格式化 ────── */
const formatTime = (iso: string) => {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/* ────── 操作 ────── */
const backToList = () => {
  router.push("/online-test/entry");
};
</script>

<style scoped lang="scss">
@import "./index";
</style>
