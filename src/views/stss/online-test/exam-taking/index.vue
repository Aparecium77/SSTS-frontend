<template>
  <div class="exam-taking-page">
    <template v-if="submitState === 'answering'">
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
                :class="{ active: index === currentIndex, answered: Boolean(answerMap[q.id]), 'type-judge': q.type === 2 }"
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
                <span class="info-label">姓名</span><span class="info-val">{{ mockStudentInfo.studentName }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">学号</span><span class="info-val">{{ mockStudentInfo.studentId }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">班级</span><span class="info-val">{{ mockStudentInfo.className }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">试卷编号</span><span class="info-val">{{ examSession.paperId }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">已作答</span>
                <span class="info-val">{{ answeredCount }}/{{ allQuestions.length }}</span>
              </div>
            </div>
          </div>

          <div class="sidebar-card">
            <h3>图例说明</h3>
            <div class="legend-list">
              <div class="legend-item"><span class="legend-dot current"></span><span>当前题目</span></div>
              <div class="legend-item"><span class="legend-dot answered"></span><span>已作答</span></div>
              <div class="legend-item"><span class="legend-dot unanswered"></span><span>未作答</span></div>
              <div class="legend-divider"></div>
              <div class="legend-item"><span class="legend-shape single"></span><span>选择题</span></div>
              <div class="legend-item"><span class="legend-shape judge"></span><span>判断题</span></div>
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
import { beginExam, saveExamProgress } from "@/api/modules/onlineTest";
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

/* ────── WebSocket（Go proctor） ────── */
let wsConnection: WebSocket | null = null;

const disconnectProctor = () => {
  if (wsConnection) {
    wsConnection.close();
    wsConnection = null;
  }
};

const connectProctor = (wsEndpoint: string, sId: number, rId: number) => {
  try {
    const url = `${wsEndpoint}?studentId=${sId}&recordId=${rId}`;
    wsConnection = new WebSocket(url);
    wsConnection.onopen = () => console.log("[Proctor] connected");
    wsConnection.onmessage = event => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "status" && typeof msg.remainingTime === "number") {
          remainingSeconds.value = Math.max(0, Math.floor(msg.remainingTime));
        }
        if (msg.type === "exam_expired") {
          disconnectProctor();
          submitState.value = "success";
          ElNotification({ title: "时间到", message: "考试已自动提交", type: "warning", duration: 5000 });
        }
        if (msg.type === "submitted") {
          disconnectProctor();
          submitState.value = "success";
        }
      } catch {
        /* raw */
      }
    };
    wsConnection.onerror = () => console.warn("[Proctor] error");
    wsConnection.onclose = () => console.log("[Proctor] closed");
  } catch {
    console.warn("[Proctor] connect failed");
  }
};

const fetchPaper = async () => {
  disconnectProctor();
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
    // 初始倒计时（Go 连上后会通过 status 消息覆盖）
    remainingSeconds.value = res.durationMins * 60;
    if (res.wsEndpoint) {
      connectProctor(res.wsEndpoint, 91002, res.recordId);
    }
  } catch {
    console.warn("beginExam API 调用失败，使用 mock 数据");
  }
};

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
// 初始值由 fetchPaper 设置，后续由 Go proctor 的 status 消息驱动
const remainingSeconds = ref(0);

const formattedTime = computed(() => {
  const mm = Math.floor(remainingSeconds.value / 60);
  const ss = remainingSeconds.value % 60;
  return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
});

/* ────── 提交流程（走 Go WebSocket） ────── */
const performSubmit = () => {
  if (!wsConnection || wsConnection.readyState !== WebSocket.OPEN) {
    ElMessage.error("考试连接已断开，无法交卷");
    return;
  }
  submitState.value = "submitting";
  wsConnection.send(JSON.stringify({ type: "submit" }));
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
      /* 用户取消 */
    });
};

/* ────── 答题数据 ────── */
const buildAnswers = () =>
  allQuestions.value.filter(q => Boolean(answerMap[q.id])).map(q => ({ questionId: q.id, studentAnswer: answerMap[q.id] }));

/* ────── 保存 ────── */
const handleSaveDraft = async () => {
  try {
    await saveExamProgress({ studentId: 91002, examId: numericExamId.value, answers: buildAnswers() });
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
onBeforeUnmount(() => {
  disconnectProctor();
});
</script>

<style lang="scss">
.el-main:has(.exam-taking-page) {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}
.classic-main:has(.exam-taking-page) {
  flex: 1;
  min-height: 0;
}
</style>

<style scoped lang="scss">
@import "./index";
</style>
