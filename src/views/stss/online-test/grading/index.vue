<template>
  <div class="card content-box">
    <el-form :inline="true" :model="searchForm" class="search-form">
      <el-form-item label="选择考试">
        <el-select v-model="searchForm.examId" placeholder="请选择考试" style="width: 250px" @change="handleAnalyze">
          <el-option v-for="exam in examList" :key="exam.id" :label="exam.title" :value="exam.id" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :loading="loading" @click="handleAnalyze">开始分析</el-button>
        <el-button type="success" :disabled="!statsData" @click="handleExport">导出成绩 (Excel)</el-button>
        <el-button type="warning" :disabled="!statsData" @click="handlePublish">一键开放成绩与答案</el-button>
      </el-form-item>
    </el-form>

    <div v-loading="loading">
      <el-row :gutter="20" style="margin-bottom: 20px">
        <el-col :span="6">
          <el-card shadow="hover" class="data-card">
            <div class="card-title">最高分</div>
            <div class="card-value" style="color: #67c23a">{{ statsData?.maxScore ?? "-" }}</div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="data-card">
            <div class="card-title">最低分</div>
            <div class="card-value" style="color: #f56c6c">{{ statsData?.minScore ?? "-" }}</div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="data-card">
            <div class="card-title">平均分</div>
            <div class="card-value" style="color: #409eff">{{ statsData?.avgScore ? statsData.avgScore.toFixed(1) : "-" }}</div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="data-card">
            <div class="card-title">标准差</div>
            <div class="card-value" style="color: #e6a23c">
              {{ statsData?.stdDeviation ? statsData.stdDeviation.toFixed(1) : "-" }}
            </div>
          </el-card>
        </el-col>
      </el-row>

      <el-tabs v-model="activeTab" class="demo-tabs">
        <el-tab-pane label="学生成绩排名" name="ranking">
          <el-table :data="statsData?.rankings || []" :border="true" style="width: 100%">
            <el-table-column type="index" label="排名" width="80" align="center" />
            <el-table-column prop="studentId" label="学号" width="180" align="center" />
            <el-table-column prop="totalScore" label="总分" width="120" align="center">
              <template #default="scope">
                <strong :style="{ color: scope.row.totalScore < 60 ? '#f56c6c' : '#606266' }">{{ scope.row.totalScore }}</strong>
              </template>
            </el-table-column>
            <el-table-column prop="submitTime" label="交卷时间" align="center">
              <template #default="scope">{{ formatTime(scope.row.submitTime) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="150" align="center" fixed="right">
              <template #default="scope">
                <el-button type="primary" link @click="handleReviewRecord(scope.row)">查看答卷</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="题目正确率分析" name="questions">
          <el-table :data="statsData?.questionStats || []" :border="true" style="width: 100%">
            <el-table-column prop="sortOrder" label="题号" width="80" align="center" />
            <el-table-column prop="stem" label="题干" show-overflow-tooltip />
            <el-table-column label="正确率" width="300">
              <template #default="scope">
                <el-progress :percentage="Number(scope.row.correctRate.toFixed(1))" :color="customColors" />
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </div>

    <el-dialog title="学生答卷详情" v-model="reviewVisible" width="800px" top="5vh">
      <div v-loading="reviewLoading" class="preview-container">
        <template v-if="reviewData">
          <div class="preview-header">
            <h2>学号 {{ reviewData.studentId || "未知" }} 的答卷</h2>
            <div class="preview-meta">
              <span>
                总得分：<strong style="font-size: 18px; color: #67c23a">{{ reviewData.totalScore }}</strong>
                分
              </span>
            </div>
          </div>
          <div class="question-list">
            <div v-for="(q, index) in reviewData.questions" :key="q.questionId" class="question-item">
              <div class="q-stem">
                <span class="q-type-tag">[{{ q.type === 1 ? "单选题" : "判断题" }}]</span>
                <strong>{{ +index + 1 }}. </strong>
                <span>{{ q.stem }}</span>
                <span class="q-score">({{ q.score }}分)</span>
                <el-tag :type="q.isCorrect ? 'success' : 'danger'" size="small" style="float: right">{{
                  q.isCorrect ? "正确" : "错误"
                }}</el-tag>
              </div>
              <div class="q-options">
                <template v-if="q.type === 1">
                  <div v-for="opt in q.options" :key="opt" class="opt-row">
                    <el-radio disabled :label="opt" :model-value="q.studentAnswer">{{ opt }}</el-radio>
                  </div>
                </template>
                <template v-else>
                  <div class="opt-row"><el-radio disabled label="正确" :model-value="q.studentAnswer">正确</el-radio></div>
                  <div class="opt-row"><el-radio disabled label="错误" :model-value="q.studentAnswer">错误</el-radio></div>
                </template>
              </div>
              <div class="answer-box">
                <div style="margin-bottom: 5px">
                  学生答案：<span :class="q.isCorrect ? 'text-success' : 'text-danger'">{{ q.studentAnswer || "未作答" }}</span>
                </div>
                <div>
                  正确答案：<span class="text-success">{{ q.standardAnswer }}</span>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  queryExamPapers,
  getExamStats,
  exportExamScores,
  openExamScore,
  openExamAnswer,
  getExamRecordReview
} from "@/api/modules/onlineTest";
import { buildExportFileName, buildReviewRequest, filterAnalyzableExams, formatGradingTime } from "./logic";

const route = useRoute();

const getTeacherId = () => {
  try {
    const localData = JSON.parse(localStorage.getItem("geeker-user") || "{}");
    return localData?.userInfo?.id || 9001;
  } catch {
    return 9001;
  }
};
const teacherId = getTeacherId();
const courseId = 101;

const loading = ref(false);
const examList = ref<any[]>([]);
const searchForm = ref({ examId: undefined as number | undefined });
const statsData = ref<any>(null);
const activeTab = ref("ranking");

const customColors = [
  { color: "#f56c6c", percentage: 50 },
  { color: "#e6a23c", percentage: 70 },
  { color: "#67c23a", percentage: 100 }
];

onMounted(async () => {
  try {
    const res = await queryExamPapers({ current: 1, size: 100, teacherId, courseId });
    examList.value = filterAnalyzableExams(res.records || []);
    if (route.query.examId) {
      searchForm.value.examId = Number(route.query.examId);
      handleAnalyze();
    }
  } catch (error) {
    console.error("加载试卷列表失败", error);
  }
});

const formatTime = formatGradingTime;

const handleAnalyze = async () => {
  if (!searchForm.value.examId) return ElMessage.warning("请先选择一场考试");
  loading.value = true;
  try {
    const res = await getExamStats({ teacherId, id: searchForm.value.examId });
    statsData.value = res;
    ElMessage.success("数据加载成功");
  } catch (error: any) {
    ElMessage.error(error?.message || "获取统计数据失败");
    statsData.value = null;
  } finally {
    loading.value = false;
  }
};

const handleExport = async () => {
  if (!searchForm.value.examId) return;
  try {
    ElMessage.info("正在生成 Excel...");
    const blob = await exportExamScores(teacherId, searchForm.value.examId);
    const url = window.URL.createObjectURL(new Blob([blob]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", buildExportFileName(examList.value, searchForm.value.examId));
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
    ElMessage.success("导出成功！");
  } catch (error) {
    ElMessage.error("导出失败");
  }
};

const handlePublish = () => {
  if (!searchForm.value.examId) return;
  const examId = searchForm.value.examId;
  ElMessageBox.confirm("确定要向学生开放成绩和答案解析吗？", "提示", { type: "warning" })
    .then(async () => {
      loading.value = true;
      try {
        await Promise.all([openExamScore({ teacherId, id: examId }), openExamAnswer({ teacherId, id: examId })]);
        ElMessage.success("已成功对学生开放！");
      } catch (error: any) {
        ElMessage.error(error?.message || "开放操作失败");
      } finally {
        loading.value = false;
      }
    })
    .catch(() => {
      //
    });
};

const reviewVisible = ref(false);
const reviewLoading = ref(false);
const reviewData = ref<any>(null);

const handleReviewRecord = async (row: any) => {
  reviewVisible.value = true;
  reviewLoading.value = true;
  reviewData.value = null;
  try {
    const res = await getExamRecordReview(buildReviewRequest(teacherId, row.recordId));
    reviewData.value = res;
  } catch (error: any) {
    ElMessage.error(error?.message || "获取答卷详情失败");
    reviewVisible.value = false;
  } finally {
    reviewLoading.value = false;
  }
};
</script>

<style scoped>
.search-form {
  padding: 18px 18px 0;
  margin-bottom: 20px;
  background-color: #f8f8f8;
  border-radius: 4px;
}
.data-card {
  text-align: center;
}
.card-title {
  margin-bottom: 10px;
  font-size: 14px;
  color: #909399;
}
.card-value {
  font-size: 28px;
  font-weight: bold;
}
.preview-container {
  min-height: 300px;
  padding: 0 20px;
}
.preview-header {
  padding-bottom: 20px;
  margin-bottom: 20px;
  text-align: center;
  border-bottom: 1px solid #ebeef5;
}
.preview-header h2 {
  margin: 0 0 10px;
  font-size: 22px;
  color: #303133;
}
.preview-meta {
  font-size: 14px;
  color: #909399;
}
.question-list {
  max-height: 550px;
  padding-right: 10px;
  overflow-y: auto;
}
.question-item {
  padding: 15px;
  margin-bottom: 25px;
  background-color: #f8f9fa;
  border-radius: 6px;
}
.q-stem {
  margin-bottom: 15px;
  font-size: 16px;
  line-height: 1.6;
  color: #303133;
}
.q-type-tag {
  margin-right: 5px;
  font-weight: bold;
  color: #409eff;
}
.q-score {
  margin-left: 8px;
  font-size: 14px;
  color: #e6a23c;
}
.q-options {
  padding-left: 10px;
}
.opt-row {
  margin-bottom: 10px;
}
.answer-box {
  padding: 10px 15px;
  margin-top: 15px;
  font-size: 14px;
  color: #606266;
  background-color: #ebeef5;
  border-radius: 4px;
}
.text-success {
  font-weight: bold;
  color: #67c23a;
}
.text-danger {
  font-weight: bold;
  color: #f56c6c;
}
</style>
