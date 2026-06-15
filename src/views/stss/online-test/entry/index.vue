<template>
  <div class="exam-entry-page">
    <!-- 非学生身份占位 -->
    <template v-if="userRole !== 'student'">
      <div class="role-placeholder">
        <el-empty description="此页面为学生考试入口，教师/管理员请使用其他功能。" />
      </div>
    </template>

    <!-- 学生视图 -->
    <template v-else>
      <!-- 顶部筛选搜索 -->
      <div class="entry-toolbar">
        <div class="filter-tabs">
          <button
            v-for="tab in filterTabs"
            :key="tab.key"
            class="filter-btn"
            :class="{ active: activeFilter === tab.key }"
            @click="activeFilter = tab.key"
          >
            {{ tab.label }}
            <span class="count">{{ tabCounts[tab.key] }}</span>
          </button>
        </div>
        <el-input v-model="searchKeyword" class="search-input" placeholder="搜索考试名称……" clearable :prefix-icon="Search" />
      </div>

      <!-- 考试列表 -->
      <div v-if="filteredList.length" class="exam-list">
        <div v-for="exam in filteredList" :key="exam.examId" class="exam-card">
          <div class="exam-card-body">
            <div class="exam-info">
              <div class="exam-title-row">
                <h3 class="exam-name">{{ exam.examName }}</h3>
                <span class="status-tag" :class="`status-${exam.status}`">
                  {{ statusLabelMap[exam.status] }}
                </span>
              </div>
              <div class="exam-meta">
                <span>试卷：{{ exam.paperName }}</span>
                <span class="meta-sep">|</span>
                <span>时长：{{ exam.durationMinutes }} 分钟</span>
                <span class="meta-sep">|</span>
                <span>总分：{{ exam.totalScore }} 分</span>
              </div>
              <div class="exam-time">
                <el-icon><Clock /></el-icon>
                <span>{{ formatTimeRange(exam.startTime, exam.endTime) }}</span>
              </div>
            </div>

            <div class="exam-actions">
              <!-- 未开始 -->
              <template v-if="exam.status === 'upcoming'">
                <el-tooltip content="考试尚未开始，到时间后方可进入" placement="top">
                  <el-button type="primary" disabled>进入考试</el-button>
                </el-tooltip>
              </template>

              <!-- 进行中 -->
              <template v-else-if="exam.status === 'ongoing'">
                <el-button type="primary" @click="enterExam(exam.examId)"> 进入考试 </el-button>
              </template>

              <!-- 已结束 -->
              <template v-else>
                <el-button plain @click="viewAnalytics(exam.examId)">成绩分析</el-button>
                <span v-if="!exam.submitted" class="unsubmitted-hint">未提交</span>
              </template>
            </div>
          </div>

          <!-- 已结束且有成绩时展示分数 -->
          <div v-if="exam.status === 'ended' && exam.score !== undefined" class="exam-score-bar">
            <span class="score-label">你的成绩</span>
            <span class="score-value">{{ exam.score }}</span>
            <span class="score-total">/ {{ exam.totalScore }}</span>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <el-empty v-else description="没有找到符合条件的考试" />
    </template>
  </div>
</template>

<script setup lang="ts" name="examEntry">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { storeToRefs } from "pinia";
import { Search, Clock } from "@element-plus/icons-vue";
import { useUserStore } from "@/stores/modules/user";
import { listMyExamRecords } from "@/api/modules/onlineTest";
import type { ExamEntry } from "./types";

const router = useRouter();
const userStore = useUserStore();
const { userInfo } = storeToRefs(userStore);

/* ────── 身份 ────── */
const userRole = computed(() => userInfo.value?.role || "student");

/* ────── 考试列表数据 ────── */
// TODO: studentId 后续从登录信息或 base-info 组获取
const studentId = 91002;
const apiExamList = ref<ExamEntry.ExamItem[]>([]);
const loading = ref(false);

/** 根据 recordStatus + 时间窗口计算考试在前端的展示状态 */
function resolveStatus(recordStatus: number | null, validStartTime: string, validEndTime: string): ExamEntry.ExamStatus {
  if (recordStatus != null) {
    return recordStatus === 0 ? "ongoing" : "ended";
  }
  const now = Date.now();
  if (new Date(validStartTime).getTime() > now) return "upcoming";
  if (new Date(validEndTime).getTime() < now) return "ended";
  return "ongoing";
}

const fetchExamList = async () => {
  loading.value = true;
  try {
    const res = await listMyExamRecords({ studentId });
    apiExamList.value = res.records.map(r => ({
      examId: `exam-00${r.examId}`,
      examName: r.examTitle,
      paperId: `paper-00${r.examId}`,
      paperName: r.examTitle,
      startTime: r.validStartTime,
      endTime: r.validEndTime,
      durationMinutes: r.durationMins,
      status: resolveStatus(r.recordStatus, r.validStartTime, r.validEndTime),
      totalScore: r.totalScore,
      submitted: r.recordStatus === 1,
      score: r.studentScore ?? undefined
    }));
  } catch {
    console.warn("考试列表 API 调用失败，使用 mock 数据");
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchExamList();
});

/* ────── 筛选 & 搜索 ────── */
const filterTabs: { key: ExamEntry.FilterTab; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "upcoming", label: "未开始" },
  { key: "ongoing", label: "进行中" },
  { key: "ended", label: "已结束" }
];

const statusLabelMap: Record<ExamEntry.ExamStatus, string> = {
  upcoming: "未开始",
  ongoing: "进行中",
  ended: "已结束"
};

const tabCounts = computed(() => ({
  all: apiExamList.value.length,
  upcoming: apiExamList.value.filter(e => e.status === "upcoming").length,
  ongoing: apiExamList.value.filter(e => e.status === "ongoing").length,
  ended: apiExamList.value.filter(e => e.status === "ended").length
}));

const activeFilter = ref<ExamEntry.FilterTab>("all");
const searchKeyword = ref("");

const filteredList = computed(() => {
  let list = apiExamList.value;
  if (activeFilter.value !== "all") {
    list = list.filter(e => e.status === activeFilter.value);
  }
  if (searchKeyword.value.trim()) {
    const kw = searchKeyword.value.trim().toLowerCase();
    list = list.filter(e => e.examName.toLowerCase().includes(kw) || e.paperName.toLowerCase().includes(kw));
  }
  return list;
});

/* ────── 时间格式化 ────── */
const formatTimeRange = (start: string, end: string) => {
  const fmt = (iso: string) => {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };
  return `${fmt(start)} — ${fmt(end)}`;
};

/* ────── 操作 ────── */
const enterExam = (examId: string) => {
  router.push(`/online-test/exam-taking?examId=${examId}`);
};

const viewAnalytics = (examId: string) => {
  router.push(`/online-test/analytics?examId=${examId}`);
};
</script>

<style scoped lang="scss">
@import "./index";
</style>
