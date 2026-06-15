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
import { beginExam } from "@/api/modules/onlineTest";
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

/* ────── 学生 & 考试标识（供 HTTP 兜底使用） ────── */
// TODO: studentId 后续从登录信息或 base-info 组获取
const currentStudentId = 91002;
const currentRecordId = ref(0);
const proctorHttpBase = ref(""); // ws://host:port/ws → http://host:port

/* ────── WebSocket（Go proctor）─ 含断线重连 ────── */
let wsConnection: WebSocket | null = null;
let intentionalClose = false;
let reconnectAttempts = 0;
const MAX_RECONNECT = 5;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let lastWsEndpoint = "";

const cancelReconnect = () => {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
};

const disconnectProctor = () => {
  intentionalClose = true;
  cancelReconnect();
  if (wsConnection) {
    wsConnection.close();
    wsConnection = null;
  }
};

/** 批量同步本地答案到服务端（用于断线重连后回补） */
const batchSyncAnswers = async (): Promise<boolean> => {
  const entries = Object.entries(answerMap).filter(([, v]) => v);
  if (!entries.length) return true;
  if (!proctorHttpBase.value) return false;
  try {
    const resp = await fetch(`${proctorHttpBase.value}/api/proctor/v1/answers/batch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId: String(currentStudentId),
        examId: String(numericExamId.value),
        answers: entries.map(([qid, ans]) => ({ questionId: Number(qid), answer: ans }))
      })
    });
    if (resp.ok) {
      lastSavedAt.value = new Date().toLocaleTimeString("zh-CN", { hour12: false });
      return true;
    }
    return false;
  } catch {
    return false;
  }
};

/** 指数退避重连调度 */
const scheduleReconnect = () => {
  cancelReconnect();
  if (reconnectAttempts >= MAX_RECONNECT) {
    ElNotification({
      title: "考试连接断开",
      message: "无法恢复连接，已切换为离线模式，答案将通过 HTTP 保存",
      type: "warning",
      duration: 6000
    });
    return;
  }
  // 2s → 4s → 8s → 16s → 32s，上限 30s
  const delay = Math.min(2000 * Math.pow(2, reconnectAttempts), 30000);
  reconnectAttempts++;
  console.log(`[Proctor] reconnect in ${delay / 1000}s (${reconnectAttempts}/${MAX_RECONNECT})`);
  reconnectTimer = setTimeout(() => {
    if (!lastWsEndpoint || !currentRecordId.value) return;
    connectProctor(lastWsEndpoint, currentStudentId, currentRecordId.value);
  }, delay);
};

const connectProctor = (wsEndpoint: string, sId: number, rId: number) => {
  try {
    lastWsEndpoint = wsEndpoint;
    const url = `${wsEndpoint}?studentId=${sId}&recordId=${rId}`;
    // 从 wsEndpoint 解析 HTTP base 供兜底使用
    try {
      const parsed = new URL(wsEndpoint);
      proctorHttpBase.value = `http://${parsed.host}`;
    } catch {
      proctorHttpBase.value = "";
    }
    wsConnection = new WebSocket(url);
    wsConnection.onopen = () => {
      console.log("[Proctor] connected");
      // 重连成功：同步离线期间堆积的本地答案
      if (reconnectAttempts > 0) {
        setTimeout(() => batchSyncAnswers(), 500);
        reconnectAttempts = 0;
        ElMessage.success("考试连接已恢复");
      }
    };
    wsConnection.onmessage = event => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "status") {
          if (typeof msg.remainingSeconds === "number") {
            remainingSeconds.value = Math.max(0, Math.floor(msg.remainingSeconds));
            startCountdown();
          }
          if (typeof msg.answeredCount === "number") {
            serverAnsweredCount.value = msg.answeredCount;
          }
        }
        if (msg.type === "ack" && msg.status === "saved") {
          lastSavedAt.value = new Date().toLocaleTimeString("zh-CN", { hour12: false });
        }
        if (msg.type === "exam_expired") {
          stopCountdown();
          disconnectProctor();
          submitState.value = "success";
          ElNotification({ title: "时间到", message: "考试已自动提交", type: "warning", duration: 5000 });
        }
        if (msg.type === "submitted") {
          stopCountdown();
          disconnectProctor();
          submitState.value = "success";
        }
        if (msg.type === "error") {
          ElMessage.error(msg.status || "考试服务异常");
        }
        if (msg.type === "ping") {
          wsConnection?.send(JSON.stringify({ type: "pong" }));
        }
      } catch {
        /* raw JSON 解析失败，忽略 */
      }
    };
    wsConnection.onerror = () => console.warn("[Proctor] error");
    wsConnection.onclose = () => {
      console.log("[Proctor] closed");
      wsConnection = null;
      if (!intentionalClose && submitState.value === "answering") {
        scheduleReconnect();
      }
    };
  } catch {
    console.warn("[Proctor] connect failed");
  }
};

const fetchPaper = async () => {
  stopCountdown();
  disconnectProctor();
  proctorHttpBase.value = "";
  try {
    const res = await beginExam({ studentId: currentStudentId, examId: numericExamId.value });
    const paper = res.paper;
    examSession.value = {
      examId: `exam-00${paper.examId}`,
      paperId: `paper-00${paper.examId}`,
      startedAt: new Date().toISOString(),
      examName: paper.title,
      durationMinutes: paper.durationMins,
      totalQuestions: paper.questions.length
    };
    allQuestions.value = paper.questions.map(q => ({
      id: q.questionId,
      type: q.type as ExamTaking.QuestionType,
      stem: q.stem,
      score: q.score,
      difficulty: 1 as ExamTaking.Difficulty,
      options: q.options
    }));
    // 等 Go proctor 连上后通过 status 消息设置权威时间并启动倒计时
    if (res.wsEndpoint) {
      currentRecordId.value = res.recordId;
      reconnectAttempts = 0;
      intentionalClose = false;
      connectProctor(res.wsEndpoint, currentStudentId, res.recordId);
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
const serverAnsweredCount = ref(0);

const currentQuestion = computed(() => allQuestions.value[currentIndex.value]);

const currentAnswer = computed<string>({
  get: () => answerMap[currentQuestion.value.id] ?? "",
  set: value => {
    answerMap[currentQuestion.value.id] = value;
  }
});

const answeredCount = computed(() => allQuestions.value.filter(q => Boolean(answerMap[q.id])).length);

/* ────── 倒计时 ────── */
// 服务器权威值由 Go status 消息推送；前端本地每秒递减，收到 status 时校准
const remainingSeconds = ref(0);
let countdownTimer: ReturnType<typeof setInterval> | null = null;

const startCountdown = () => {
  if (countdownTimer) return;
  countdownTimer = setInterval(() => {
    if (remainingSeconds.value > 0) {
      remainingSeconds.value--;
    }
    if (remainingSeconds.value <= 0) {
      stopCountdown();
    }
  }, 1000);
};

const stopCountdown = () => {
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
};

const formattedTime = computed(() => {
  const mm = Math.floor(remainingSeconds.value / 60);
  const ss = remainingSeconds.value % 60;
  return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
});

/* ────── 提交流程（WebSocket 主路径 + HTTP 兜底） ────── */
const performSubmit = async () => {
  if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
    submitState.value = "submitting";
    wsConnection.send(JSON.stringify({ type: "submit" }));
    return;
  }
  if (!proctorHttpBase.value) {
    ElMessage.error("考试连接已断开，无法交卷");
    return;
  }
  submitState.value = "submitting";
  try {
    const resp = await fetch(`${proctorHttpBase.value}/api/proctor/v1/answers/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId: String(currentStudentId),
        examId: String(numericExamId.value)
      })
    });
    if (resp.ok) {
      stopCountdown();
      submitState.value = "success";
    } else {
      const err = await resp.json().catch(() => ({}));
      ElMessage.error(err.error || "交卷失败，请重试");
      submitState.value = "answering";
    }
  } catch {
    ElMessage.error("交卷失败，网络异常");
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
      /* 用户取消 */
    });
};

/* ────── 保存答案（WebSocket 主路径 + HTTP 兜底） ────── */
const saveWithFallback = async (questionId: number, answer: string): Promise<boolean> => {
  if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
    wsConnection.send(JSON.stringify({ type: "save_answer", questionId, answer }));
    return true;
  }
  if (!proctorHttpBase.value) {
    ElMessage.error("考试连接已断开，无法保存");
    return false;
  }
  try {
    const resp = await fetch(`${proctorHttpBase.value}/api/proctor/v1/answers/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId: String(currentStudentId),
        examId: String(numericExamId.value),
        questionId,
        answer
      })
    });
    if (resp.ok) {
      lastSavedAt.value = new Date().toLocaleTimeString("zh-CN", { hour12: false });
      return true;
    }
    ElMessage.error("保存失败，请重试");
    return false;
  } catch {
    ElMessage.error("保存失败，网络异常");
    return false;
  }
};

const handleSaveDraft = () => {
  const q = currentQuestion.value;
  const ans = answerMap[q.id];
  if (!ans) {
    ElMessage.warning("当前题目未作答");
    return;
  }
  saveWithFallback(q.id, ans);
};

/* ────── 自动保存：切换题目时保存上一题 ────── */
watch(currentIndex, (_, oldIdx) => {
  if (oldIdx == null || oldIdx < 0 || oldIdx >= allQuestions.value.length) return;
  const prevQ = allQuestions.value[oldIdx];
  const prevAns = answerMap[prevQ.id];
  if (prevAns) {
    saveWithFallback(prevQ.id, prevAns);
  }
});

/* ────── 结果页操作 ────── */
const goHome = () => {
  router.push("/online-test/entry");
};

/* ────── 生命周期 ────── */
onBeforeUnmount(() => {
  stopCountdown();
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
