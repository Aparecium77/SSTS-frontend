<template>
  <div class="exam-taking-page">
    <!-- ────── 视图 1：答题中 ────── -->
    <template v-if="submitState === 'answering'">
      <!-- 顶部栏: 考试名称 + 剩余时间 + 交卷 -->
      <header class="exam-header">
        <h2 class="exam-name">{{ examSession.examName }}</h2>
        <div class="header-right">
          <div class="timer" :class="{ 'timer-warn': remainingSeconds <= 300 }">
            <el-icon><Clock /></el-icon>
            <span class="timer-text">{{ formattedTime }}</span>
          </div>
          <el-button type="primary" size="large" @click="handleSubmitConfirm"> 交卷 </el-button>
        </div>
      </header>

      <!-- 主体区域 -->
      <div class="exam-body">
        <aside class="exam-sidebar">
          <div class="sidebar-card">
            <div class="sidebar-card-head">
              <h3>题目选择</h3>
              <span class="nav-progress">{{ currentIndex + 1 }} / {{ allQuestions.length }}</span>
            </div>
            <div class="nav-grid">
              <button
                v-for="(q, index) in allQuestions"
                :key="q.id"
                class="nav-item"
                :class="{
                  active: index === currentIndex,
                  answered: Boolean(answerMap[q.id]),
                  'type-judge': q.type === 'judge'
                }"
                :title="`第 ${index + 1} 题${q.type === 'single' ? '（选择题）' : '（判断题）'}`"
                @click="currentIndex = index"
              >
                {{ index + 1 }}
              </button>
            </div>
          </div>

          <div class="sidebar-card">
            <h3>个人信息</h3>
            <div class="info-list">
              <div class="info-row">
                <span class="info-label">姓名</span>
                <span class="info-val">{{ mockStudentInfo.studentName }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">学号</span>
                <span class="info-val">{{ mockStudentInfo.studentId }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">班级</span>
                <span class="info-val">{{ mockStudentInfo.className }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">试卷编号</span>
                <span class="info-val">{{ examSession.paperId }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">已作答</span>
                <span class="info-val">{{ answeredCount }} / {{ allQuestions.length }} 题</span>
              </div>
            </div>
          </div>

          <div class="sidebar-card">
            <h3>图例说明</h3>
            <div class="legend-list">
              <div class="legend-item">
                <span class="legend-dot current"></span>
                <span>当前题目</span>
              </div>
              <div class="legend-item">
                <span class="legend-dot answered"></span>
                <span>已作答</span>
              </div>
              <div class="legend-item">
                <span class="legend-dot unanswered"></span>
                <span>未作答</span>
              </div>
              <div class="legend-divider"></div>
              <div class="legend-item">
                <span class="legend-shape single"></span>
                <span>选择题</span>
              </div>
              <div class="legend-item">
                <span class="legend-shape judge"></span>
                <span>判断题</span>
              </div>
            </div>
          </div>
        </aside>

        <main class="exam-main">
          <div class="question-area">
            <QuestionBlock v-model="currentAnswer" :question="currentQuestion" />
          </div>

          <footer class="exam-footer">
            <el-button size="large" :disabled="currentIndex === 0" @click="currentIndex--"> 上一题 </el-button>
            <el-button size="large" plain @click="handleSaveDraft"> 保存 </el-button>
            <el-button size="large" :disabled="currentIndex >= allQuestions.length - 1" @click="currentIndex++">
              下一题
            </el-button>
          </footer>
        </main>
      </div>
    </template>

    <!-- ────── 视图 2/3：提交中 / 提交成功 ────── -->
    <SubmitResult v-else :submit-state="submitState" @go-home="goHome" @view-paper="viewPaper" />
  </div>
</template>

<script setup lang="ts" name="examTaking">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Clock } from "@element-plus/icons-vue";
import { ElMessageBox, ElNotification } from "element-plus";
import QuestionBlock from "./components/QuestionBlock.vue";
import SubmitResult from "./components/SubmitResult.vue";
import { examSessionMap, mockAllQuestionList, mockExamSession, mockStudentInfo, questionMap } from "./mock";
import type { ExamTaking } from "./types";

const route = useRoute();
const router = useRouter();

/* ────── 根据 examId 加载对应试卷 ────── */
const examId = (route.query.examId as string) || mockExamSession.examId;
const examSession = examSessionMap[examId] ?? mockExamSession;
const allQuestions: ExamTaking.QuestionItem[] = questionMap[examId] ?? mockAllQuestionList;

/* ────── 三视图状态 ────── */
const submitState = ref<ExamTaking.SubmitState>("answering");

/* ────── 答题状态 ────── */
const lastSavedAt = ref("尚未保存");
const currentIndex = ref(0);
const answerMap = reactive<Record<string, string>>({});

const currentQuestion = computed(() => allQuestions[currentIndex.value]);

const currentAnswer = computed<string>({
  get: () => answerMap[currentQuestion.value.id] ?? "",
  set: value => {
    answerMap[currentQuestion.value.id] = value;
  }
});

const answeredCount = computed(() => allQuestions.filter(q => Boolean(answerMap[q.id])).length);

/* ────── 倒计时 ────── */
const remainingSeconds = ref(examSession.durationMinutes * 60);
let timerHandle: ReturnType<typeof setInterval> | null = null;

const formattedTime = computed(() => {
  const mm = Math.floor(remainingSeconds.value / 60);
  const ss = remainingSeconds.value % 60;
  return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
});

const startTimer = () => {
  if (timerHandle) return;
  timerHandle = setInterval(() => {
    if (remainingSeconds.value <= 1) {
      stopTimer();
      remainingSeconds.value = 0;
      autoSubmit();
    } else {
      remainingSeconds.value -= 1;
    }
  }, 1000);
};

const stopTimer = () => {
  if (timerHandle) {
    clearInterval(timerHandle);
    timerHandle = null;
  }
};

const autoSubmit = () => {
  performSubmit();
  ElNotification({
    title: "时间到",
    message: "考试时间已到，系统已自动提交试卷。",
    type: "warning",
    duration: 5000
  });
};

/* ────── 提交流程 ────── */
const performSubmit = () => {
  stopTimer();
  handleSaveDraft();
  submitState.value = "submitting";
  // 模拟提交，1.5 秒后显示成功
  setTimeout(() => {
    submitState.value = "success";
  }, 1500);
};

const handleSubmitConfirm = () => {
  const unanswered = allQuestions.length - answeredCount.value;
  const timeHint = `<span style="color:#dc2626;font-weight:700;">${formattedTime.value}</span>`;
  const msg =
    unanswered > 0
      ? `你还有 ${unanswered} 道题未作答，剩余时间 ${timeHint}，确认要交卷吗？`
      : `剩余时间 ${timeHint}，确认提交试卷吗？提交后无法修改。`;
  ElMessageBox.confirm(msg, "确认交卷", {
    confirmButtonText: "确认交卷",
    cancelButtonText: "继续检查",
    type: "warning",
    dangerouslyUseHTMLString: true
  })
    .then(() => {
      performSubmit();
    })
    .catch(() => {
      // 用户取消
    });
};

/* ────── 保存 ────── */
const handleSaveDraft = () => {
  lastSavedAt.value = new Date().toLocaleTimeString("zh-CN", { hour12: false });
};

/* ────── 结果页操作 ────── */
const goHome = () => {
  router.push("/online-test/entry");
};

const viewPaper = () => {
  router.push("/online-test/analytics");
};

/* ────── 生命周期 ────── */
onMounted(() => {
  startTimer();
});

onBeforeUnmount(() => {
  stopTimer();
});
</script>

<style lang="scss">
/*
 * 打通父级 flex 链路，让 exam-taking-page 自适应可用高度。
 * 避免 100vh 硬编码导致不同布局（tabs/footer 显隐）下出现滚动条。
 */
.el-main:has(.exam-taking-page) {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

/* LayoutClassic：el-main 的父级是 .classic-main */
.classic-main:has(.exam-taking-page) {
  flex: 1;
  min-height: 0;
}
</style>

<style scoped lang="scss">
@import "./index";
</style>
