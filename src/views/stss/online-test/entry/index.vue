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
      <div v-if="pagedList.length" class="exam-list">
        <div v-for="exam in pagedList" :key="exam.examId" class="exam-card">
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
                <span class="meta-sep">|</span>
                <span :class="{ 'attempts-exhausted': exam.allowedAttempts - exam.submittedCount <= 0 && !exam.hasDraft }">
                  剩余次数：{{ Math.max(exam.allowedAttempts - exam.submittedCount, 0) }}/{{ exam.allowedAttempts }}
                </span>
                <template v-if="exam.submitted">
                  <span class="meta-sep">|</span>
                  <span :class="exam.answerVisible ? 'answer-open' : 'answer-closed'">
                    答案{{ exam.answerVisible ? "已" : "未" }}开放
                  </span>
                </template>
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
                <template v-if="!exam.hasDraft && exam.submittedCount >= exam.allowedAttempts">
                  <el-tooltip content="答题次数已用完" placement="top">
                    <el-button type="primary" disabled>进入考试</el-button>
                  </el-tooltip>
                </template>
                <template v-else>
                  <el-button type="primary" @click="enterExam(exam.examId)"> 进入考试 </el-button>
                </template>
                <el-button v-if="exam.submittedCount > 0" plain style="margin-left: 8px" @click="viewAnalytics(exam.examId)">
                  成绩分析
                </el-button>
              </template>

              <!-- 已结束 -->
              <template v-else>
                <el-button plain @click="viewAnalytics(exam.examId)">成绩分析</el-button>
                <span v-if="!exam.submitted" class="unsubmitted-hint">未提交</span>
              </template>
            </div>
          </div>

          <!-- 已结束且有成绩时展示分数 -->
          <div v-if="exam.scoreVisible && exam.score !== undefined" class="exam-score-bar">
            <span class="score-label">你的成绩</span>
            <span class="score-value">{{ exam.score }}</span>
            <span class="score-total">/ {{ exam.totalScore }}</span>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div v-if="total > 10" class="entry-pagination">
        <el-pagination v-model:current-page="page" :page-size="10" :total="total" layout="prev, pager, next, total" />
      </div>

      <!-- 空状态 -->
      <el-empty v-if="!filteredList.length && !loading" description="没有找到符合条件的考试" />

      <!-- 确认进入考试弹窗 -->
      <el-dialog v-model="showDialog" title="确认进入考试" width="480px" :close-on-click-modal="false">
        <div v-if="selectedExam" class="confirm-dialog-body">
          <div class="confirm-section">
            <h4>{{ selectedExam.examName }}</h4>
            <p>时长：{{ selectedExam.durationMinutes }} 分钟 | 总分：{{ selectedExam.totalScore }} 分</p>
            <p>考试时间：{{ formatTimeRange(selectedExam.startTime, selectedExam.endTime) }}</p>
          </div>
          <div class="confirm-section">
            <p>姓名：张三 | 学号：91002 | 班级：软件工程2024</p>
          </div>
          <el-alert type="warning" :closable="false" show-icon style="margin: 12px 0">
            <template #title>进入后即开始计时，请合理安排时间</template>
          </el-alert>
          <el-checkbox v-model="confirmChecked" style="margin-top: 12px"> 我已确认考试信息，准备好开始考试 </el-checkbox>
        </div>
        <template #footer>
          <el-button @click="showDialog = false">取消</el-button>
          <el-button type="primary" :disabled="!confirmChecked" @click="confirmEnterExam">确认进入</el-button>
        </template>
      </el-dialog>
    </template>
  </div>
</template>

<script setup lang="ts" name="examEntry">
import { computed, onActivated, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { storeToRefs } from "pinia";
import { Search, Clock } from "@element-plus/icons-vue";
import { useUserStore } from "@/stores/modules/user";
import { listMyExamRecords } from "@/api/modules/onlineTest";
import type { ExamEntry } from "./types";
import { filterExamList, formatTimeRange, getTabCounts, normalizeExamRecordItem } from "./logic";
import { mockExamList } from "./mock";

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
const page = ref(1);
const showDialog = ref(false);
const confirmChecked = ref(false);
const selectedExam = ref<ExamEntry.ExamItem | null>(null);

const fetchExamList = async () => {
  loading.value = true;
  try {
    const res = await listMyExamRecords({ studentId, current: 1, size: 100 });
    apiExamList.value = res.records.map(record => normalizeExamRecordItem(record));
  } catch {
    apiExamList.value = mockExamList;
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchExamList();
});

onActivated(() => {
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

const activeFilter = ref<ExamEntry.FilterTab>("all");
const searchKeyword = ref("");

const filteredList = computed(() => filterExamList(apiExamList.value, activeFilter.value, searchKeyword.value));

const total = computed(() => filteredList.value.length);

const pagedList = computed(() => {
  const start = (page.value - 1) * 10;
  return filteredList.value.slice(start, start + 10);
});

const tabCounts = computed(() => getTabCounts(apiExamList.value));

// 筛选或搜索变化时回到第 1 页
watch([activeFilter, searchKeyword], () => {
  page.value = 1;
});

/* ────── 操作 ────── */
const enterExam = (examId: string) => {
  const exam = apiExamList.value.find(e => e.examId === examId);
  if (!exam) return;
  // 已有草稿（进行中）→ 直接继续，不弹窗
  if (exam.hasDraft) {
    router.push(`/online-test/exam-taking?examId=${exam.examId}`);
    return;
  }
  selectedExam.value = exam;
  confirmChecked.value = false;
  showDialog.value = true;
};

const confirmEnterExam = () => {
  if (!confirmChecked.value || !selectedExam.value) return;
  showDialog.value = false;
  router.push(`/online-test/exam-taking?examId=${selectedExam.value.examId}`);
};

const viewAnalytics = (examId: string) => {
  router.push(`/online-test/analytics?examId=${examId}`);
};
</script>

<style scoped lang="scss">
@import "./index";
.entry-pagination {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}
.attempts-exhausted {
  font-weight: 600;
  color: #f56c6c;
}
.confirm-dialog-body {
  .confirm-section {
    margin-bottom: 12px;
    h4 {
      margin: 0 0 4px;
      font-size: 18px;
      font-weight: 600;
    }
    p {
      margin: 2px 0;
      font-size: 14px;
      color: #64748b;
    }
  }
}
</style>
