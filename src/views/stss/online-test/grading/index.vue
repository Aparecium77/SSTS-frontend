<template>
  <div class="card content-box">
    <!-- 顶部选择与操作区 -->
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
      <!-- 核心指标卡片 -->
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
            <div class="card-value" style="color: #409eff">
              {{ statsData?.avgScore ? statsData.avgScore.toFixed(1) : "-" }}
            </div>
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

      <!-- 详细数据表格 (使用 Tabs 切换) -->
      <el-tabs v-model="activeTab" class="demo-tabs">
        <!-- 成绩排名 Tab -->
        <el-tab-pane label="学生成绩排名" name="ranking">
          <el-table :data="statsData?.rankings || []" :border="true" style="width: 100%">
            <el-table-column type="index" label="排名" width="80" align="center" />
            <el-table-column prop="studentId" label="学号" width="180" align="center" />
            <el-table-column prop="totalScore" label="总分" width="120" align="center">
              <template #default="scope">
                <strong :style="{ color: scope.row.totalScore < 60 ? '#f56c6c' : '#606266' }">
                  {{ scope.row.totalScore }}
                </strong>
              </template>
            </el-table-column>
            <el-table-column prop="submitTime" label="交卷时间" align="center">
              <template #default="scope">
                {{ formatTime(scope.row.submitTime) }}
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- 题目分析 Tab -->
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { queryExamPapers, getExamStats, exportExamScores, openExamScore, openExamAnswer } from "@/api/modules/onlineTest";

const route = useRoute();

// 获取当前教师身份
const getTeacherId = () => {
  try {
    const localData = JSON.parse(localStorage.getItem("geeker-user") || "{}");
    return localData?.userInfo?.id || 9001;
  } catch {
    return 9001;
  }
};
const teacherId = getTeacherId();
const courseId = 101; // 当前固定的测试课程

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

// 初始化加载：拉取试卷列表
onMounted(async () => {
  try {
    // 拉取老师名下的试卷列表（只要发布过或撤回的，这里简略查全部）
    const res = await queryExamPapers({ current: 1, size: 100, teacherId, courseId });
    // 过滤掉草稿状态的试卷 (假设 0 是草稿)
    examList.value = (res.records || []).filter(exam => exam.status !== 0);

    // 如果是通过路由传参跳转过来的，直接选中并分析
    if (route.query.examId) {
      searchForm.value.examId = Number(route.query.examId);
      handleAnalyze();
    }
  } catch (error) {
    console.error("加载试卷列表失败", error);
  }
});

// 日期格式化工具
const formatTime = (isoStr: string) => {
  if (!isoStr) return "-";
  const date = new Date(isoStr);
  return date.toLocaleString("zh-CN", { hour12: false });
};

// 触发分析（调用真实接口）
const handleAnalyze = async () => {
  if (!searchForm.value.examId) {
    return ElMessage.warning("请先选择一场考试");
  }
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

// 导出成绩为 Excel
const handleExport = async () => {
  if (!searchForm.value.examId) return;
  try {
    ElMessage.info("正在生成 Excel 文件，请稍候...");
    const blob = await exportExamScores(teacherId, searchForm.value.examId);
    // 浏览器创建 Blob URL 并模拟点击下载
    const url = window.URL.createObjectURL(new Blob([blob]));
    const link = document.createElement("a");
    link.href = url;
    // 动态生成文件名
    const examName = examList.value.find(e => e.id === searchForm.value.examId)?.title || "考试";
    link.setAttribute("download", `${examName}成绩单.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
    ElMessage.success("成绩单已成功导出！");
  } catch (error) {
    console.error("导出失败", error);
    ElMessage.error("导出失败，请重试");
  }
};

// 一键开放成绩与答案
const handlePublish = () => {
  if (!searchForm.value.examId) return;
  const examId = searchForm.value.examId;
  ElMessageBox.confirm("确定要向参与本次考试的学生开放成绩和答案解析吗？", "提示", {
    confirmButtonText: "确定开放",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(async () => {
      loading.value = true;
      try {
        // 并发执行两个开放接口
        await Promise.all([openExamScore({ teacherId, id: examId }), openExamAnswer({ teacherId, id: examId })]);
        ElMessage.success("成绩与答案解析已成功对学生开放！");
      } catch (error: any) {
        ElMessage.error(error?.message || "开放操作失败");
      } finally {
        loading.value = false;
      }
    })
    .catch(() => {
      ElMessage.info("操作已取消");
    });
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
</style>
