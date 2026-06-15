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
                  'type-judge': q.type === 2
                }"
                :title="`第 ${index + 1} 题${q.type === 1 ? '（选择题）' : '（判断题）'}`"
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
    <SubmitResult v-else :submit-state="submitState" @go-home="goHome" />
  </div>
</template>

<script setup lang="ts" name="examTaking">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Clock } from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox, ElNotification } from "element-plus";
import QuestionBlock from "./components/QuestionBlock.vue";
import SubmitResult from "./components/SubmitResult.vue";
import { beginExam, saveExamProgress, submitExamAnswers } from "@/api/modules/onlineTest";
import { examSessionMap, mockAllQuestionList, mockExamSession, mockStudentInfo, questionMap } from "./mock";
import type { ExamTaking } from "./types";

const route = useRoute();
const router = useRouter();

/* ────── 根据 examId 加载试卷 ────── */
const examIdParam = computed(() => (route.query.examId as string) || mockExamSession.examId);
const numericExamId = computed(() => parseInt(examIdParam.value.replace(/^exam-0*/, ""), 10) || 1);
const mockKey = computed(() => (examIdParam.value.startsWith("exam-") ? examIdParam.value : `exam-00${examIdParam.value}`));

const examSession = ref(examSessionMap[mockKey.value] ?? examSessionMap[examIdParam.value] ?? mockExamSession);
const allQuestions = ref<ExamTaking.QuestionItem[]>(
  questionMap[mockKey.value] ?? questionMap[examIdParam.value] ?? mockAllQuestionList
);

const fetchPaper = async () => {
  try {
    const res = await beginExam({ studentId: 91002, examId: numericExamId.value });
    examSession.value = {
      examId: `exam-00${res.examId}`,
      paperId: `paper-00${res.examId}`,
      startedAt: new Date().toISOString(),
      examName: res.title,
      durationMinutes: res.durationMins,
      totalQuestions: res.questions.length
    };
    allQuestions.value = res.questions.map(q => ({
      id: q.questionId,
      type: q.type as ExamTaking.QuestionType,
      stem: q.stem,
      score: q.score,
      difficulty: 1 as ExamTaking.Difficulty,
      options: q.options
    }));
  } catch {
    console.warn("beginExam API 调用失败，使用 mock 数据");
  }
};

// 考试 ID 变化时重置状态（keep-alive 场景下 onMounted 不会重新触发）
watch(
  () => route.query.examId,
  () => {
    submitState.value = "answering";
    currentIndex.value = 0;
    Object.keys(answerMap).forEach(k => delete answerMap[Number(k)]);
    fetchPaper();
  }
);

onMounted(() => {
  fetchPaper();
});

/* ────── 三视图状态 ────── */
const submitState = ref<ExamTaking.SubmitState>("answering");

/* ────── 答题状态 ────── */
const lastSavedAt = ref("尚未保存");
const currentIndex = ref(0);
const answerMap = reactive<Record<number, string>>({});

const currentQuestion = computed(() => allQuestions.value[currentIndex.value]);

const currentAnswer = computed<string>({
  get: () => answerMap[currentQuestion.value.id] ?? "",
  set: value => {
    answerMap[currentQuestion.value.id] = value;
  }
});

const answeredCount = computed(() => allQuestions.value.filter(q => Boolean(answerMap[q.id])).length);

/* ────── 倒计时 ────── */
const remainingSeconds = ref(examSession.value.durationMinutes * 60);
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
const performSubmit = async () => {
  stopTimer();
  submitState.value = "submitting";
  try {
    await submitExamAnswers({
      studentId: 91002,
      examId: numericExamId.value,
      answers: buildAnswers()
    });
    submitState.value = "success";
  } catch {
    ElMessage.error("交卷失败，请重试");
    submitState.value = "answering";
  }
};

const handleSubmitConfirm = () => {
  const unanswered = allQuestions.value.length - answeredCount.value;
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

/* ────── 构建答题数据 ────── */
const buildAnswers = () =>
  allQuestions.value.filter(q => Boolean(answerMap[q.id])).map(q => ({ questionId: q.id, studentAnswer: answerMap[q.id] }));

/* ────── 保存 ────── */
const handleSaveDraft = async () => {
  try {
    await saveExamProgress({
      studentId: 91002,
      examId: numericExamId.value,
      answers: buildAnswers()
    });
    lastSavedAt.value = new Date().toLocaleTimeString("zh-CN", { hour12: false });
  } catch {
    ElMessage.error("保存失败，请重试");
  }
};

/* ────── 结果页操作 ────── */
const goHome = () => {
  router.push("/online-test/entry");
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
