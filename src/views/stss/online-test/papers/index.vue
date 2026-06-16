<template>
  <div class="card content-box">
    <!-- 1. 顶部查询搜索区 -->
    <el-form :inline="true" :model="searchForm" class="search-form">
      <el-form-item label="试卷名称">
        <el-input v-model="searchForm.keyword" placeholder="搜试卷名称" clearable />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="resetSearch">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 操作按钮区 -->
    <div style="margin-bottom: 20px">
      <el-button type="primary" @click="handleAdd">新增试卷</el-button>
    </div>

    <!-- 2. 试卷列表表格 -->
    <el-table v-loading="loading" :data="tableData" :border="true" style="width: 100%">
      <el-table-column type="index" label="序号" width="60" align="center" />
      <el-table-column prop="title" label="试卷名称" show-overflow-tooltip />
      <el-table-column prop="durationMins" label="时长(分钟)" width="100" align="center" />
      <el-table-column prop="totalScore" label="总分" width="80" align="center" />
      <el-table-column label="状态" width="100" align="center">
        <template #default="scope">
          <el-tag v-if="scope.row.status === 0" type="info">草稿</el-tag>
          <el-tag v-else-if="scope.row.status === 1" type="success">已发布</el-tag>
          <el-tag v-else-if="scope.row.status === 2" type="warning">已撤回</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" width="180" align="center" />

      <!-- 操作列 -->
      <el-table-column label="操作" width="360" fixed="right" align="center">
        <template #default="scope">
          <!-- 预览（所有状态都能看） -->
          <el-button type="info" link @click="handlePreview(scope.row)">预览</el-button>

          <!-- 草稿或撤回状态才可以修改和删除 -->
          <template v-if="scope.row.status === 0 || scope.row.status === 2">
            <el-button type="primary" link @click="handleEdit(scope.row)">编辑</el-button>
            <el-button type="success" link @click="openPublishDialog(scope.row)">发布</el-button>
            <el-button type="danger" link @click="handleDelete(scope.row)">删除</el-button>
          </template>

          <!-- 已发布状态可以撤回 -->
          <template v-if="scope.row.status === 1">
            <el-button type="success" link @click="handleOpenScore(scope.row)">开放成绩</el-button>
            <el-button type="success" link @click="handleOpenAnswer(scope.row)">开放答案</el-button>
            <el-button type="warning" link @click="handleWithdraw(scope.row)">撤回</el-button>
          </template>

          <!-- 成绩分析（发布或撤回后能看） -->
          <template v-if="scope.row.status === 1 || scope.row.status === 2">
            <el-button type="primary" link @click="goToGrading(scope.row)">成绩分析</el-button>
          </template>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页器 -->
    <div style="display: flex; justify-content: flex-end; margin-top: 20px">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50]"
        :background="true"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        @size-change="fetchData"
        @current-change="fetchData"
      />
    </div>

    <!-- 3. 新增/修改试卷的“右侧抽屉” -->
    <el-drawer v-model="drawerVisible" :title="drawerTitle" size="60%" destroy-on-close>
      <el-form :model="formData" label-width="100px">
        <!-- 基础信息 -->
        <el-divider content-position="left">基础信息</el-divider>
        <el-form-item label="试卷名称" required>
          <el-input v-model="formData.title" placeholder="例如：2026年春季软件工程期中考试" />
        </el-form-item>
        <el-row>
          <el-col :span="8">
            <el-form-item label="考试时长" required>
              <el-input-number v-model="formData.durationMins" :min="10" :max="300" style="width: 120px" />
              <span style="margin-left: 10px">分钟</span>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="及格分" required>
              <el-input-number v-model="formData.passScore" :min="0" :max="formData.totalScore" style="width: 120px" />
              <span style="margin-left: 10px">分</span>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="试卷总分" required>
              <el-input-number v-model="formData.totalScore" :min="0" :max="1000" style="width: 120px" />
              <span style="margin-left: 10px">分</span>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 组卷模式选择 -->
        <el-divider content-position="left">组卷策略</el-divider>
        <el-form-item label="组卷模式">
          <el-radio-group v-model="formData.generateMode" :disabled="!!formData.id">
            <el-radio-button label="manual">手动挑题</el-radio-button>
            <el-radio-button label="auto">自动抽题</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <!-- 模式A：手动组卷界面 -->
        <div v-if="formData.generateMode === 'manual'" style="padding: 15px; background-color: #f9fafc; border-radius: 4px">
          <el-alert title="请从题库中挑选题目，并为每道题设定分值。" type="info" :closable="false" style="margin-bottom: 15px" />
          <el-button type="primary" plain icon="Plus" @click="questionSelectorVisible = true">从题库中选择题目</el-button>

          <el-table :data="selectedQuestions" :border="true" style="width: 100%; margin-top: 15px">
            <el-table-column type="index" label="序号" width="60" align="center" />
            <el-table-column label="题干" prop="stem" show-overflow-tooltip />
            <el-table-column label="分值" width="120" align="center">
              <template #default="scope">
                <el-input-number v-model="scope.row.score" :min="0" :max="100" size="small" style="width: 90px" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80" align="center">
              <template #default="scope">
                <el-button type="danger" link @click="removeQuestion(scope.$index)">移除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 模式B：自动组卷界面 (新增难度和知识点) -->
        <div v-if="formData.generateMode === 'auto'" style="padding: 15px; background-color: #f0f9eb; border-radius: 4px">
          <el-alert
            title="系统将根据知识点、难度和题型配比，自动从题库抽取题目组卷"
            type="success"
            :closable="false"
            style="margin-bottom: 15px"
          />

          <el-row>
            <el-col :span="12">
              <el-form-item label="单选题数量">
                <el-input-number v-model="formData.autoRules.singleChoiceCount" :min="0" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="单选每题分">
                <el-input-number v-model="formData.autoRules.singleChoiceScore" :min="0" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row>
            <el-col :span="12">
              <el-form-item label="判断题数量">
                <el-input-number v-model="formData.autoRules.trueFalseCount" :min="0" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="判断每题分">
                <el-input-number v-model="formData.autoRules.trueFalseScore" :min="0" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row>
            <el-col :span="12">
              <el-form-item label="目标难度">
                <el-select v-model="formData.autoRules.targetDifficulty" style="width: 100%">
                  <el-option label="简单 (1)" :value="1" />
                  <el-option label="中等 (2)" :value="2" />
                  <el-option label="困难 (3)" :value="3" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="限定知识点">
                <el-select
                  v-model="formData.autoRules.knowledgePoints"
                  multiple
                  filterable
                  allow-create
                  default-first-option
                  placeholder="留空则不限"
                  style="width: 100%"
                >
                  <el-option label="软件工程基础" value="软件工程基础" />
                  <el-option label="需求分析" value="需求分析" />
                  <el-option label="生命周期" value="生命周期" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
        </div>
      </el-form>

      <template #footer>
        <div style="flex: auto">
          <el-button @click="drawerVisible = false">取消</el-button>
          <el-button type="primary" :loading="submitLoading" @click="saveData">保存试卷草稿</el-button>
        </div>
      </template>
    </el-drawer>

    <!-- 4. 发布试卷的弹窗 -->
    <el-dialog title="发布试卷" v-model="publishDialogVisible" width="500px">
      <el-form label-width="100px">
        <el-form-item label="有效时间" required>
          <el-date-picker
            v-model="publishTimeRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="YYYY-MM-DDTHH:mm:ss.000Z"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="允许次数" required>
          <el-input-number v-model="publishAttempts" :min="1" :max="10" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="publishDialogVisible = false">取消</el-button>
        <el-button type="success" :loading="submitLoading" @click="submitPublish">确认发布</el-button>
      </template>
    </el-dialog>

    <!-- 5. 题库选择器弹窗 -->
    <el-dialog title="从题库选择题目" v-model="questionSelectorVisible" width="800px">
      <el-table :data="bankQuestions" :border="true" @selection-change="handleSelectionChange" max-height="400">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="题型" width="80">
          <template #default="scope">{{ scope.row.type === 1 ? "单选" : "判断" }}</template>
        </el-table-column>
        <el-table-column prop="stem" label="题干" show-overflow-tooltip />
        <el-table-column prop="difficulty" label="难度" width="80" />
      </el-table>
      <template #footer>
        <el-button @click="questionSelectorVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmSelectQuestions">确认添加</el-button>
      </template>
    </el-dialog>

    <!-- 6. 沉浸式试卷预览弹窗 (学生视角) -->
    <el-dialog title="试卷预览" v-model="previewVisible" width="800px" top="5vh">
      <div v-loading="previewLoading" class="preview-container">
        <template v-if="previewData">
          <div class="preview-header">
            <h2>{{ previewData.title }}</h2>
            <div class="preview-meta">
              <span>考试时长：{{ previewData.durationMins }} 分钟</span>
              <span style="margin-left: 20px">总题数：{{ previewData.questions?.length || 0 }} 题</span>
            </div>
          </div>

          <!-- 遍历渲染题目 -->
          <div class="question-list">
            <div v-for="(q, index) in previewData.questions" :key="q.questionId" class="question-item">
              <div class="q-stem">
                <span class="q-type-tag">[{{ q.type === 1 ? "单选题" : "判断题" }}]</span>
                <strong>{{ +index + 1 }}. </strong>
                <span>{{ q.stem }}</span>
                <span class="q-score">({{ q.score }}分)</span>
              </div>

              <!-- 选项渲染 -->
              <div class="q-options">
                <template v-if="q.type === 1">
                  <div v-for="opt in q.options" :key="opt" class="opt-row">
                    <el-radio disabled :label="opt">{{ opt }}</el-radio>
                  </div>
                </template>
                <template v-else>
                  <div class="opt-row"><el-radio disabled label="正确">正确</el-radio></div>
                  <div class="opt-row"><el-radio disabled label="错误">错误</el-radio></div>
                </template>
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
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  queryExamPapers,
  createExamPaper,
  updateExamPaper,
  generateExamPaper,
  deleteExamPaper,
  publishExamPaper,
  withdrawExamPaper,
  queryQuestionBank,
  previewExamPaper,
  openExamScore, // 加这行
  openExamAnswer
} from "@/api/modules/onlineTest";

const router = useRouter();

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

// --- 列表查询 ---
const searchForm = ref({ keyword: "" });
const loading = ref(false);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);
const tableData = ref<any[]>([]);

const fetchData = async () => {
  loading.value = true;
  try {
    const res = await queryExamPapers({ current: currentPage.value, size: pageSize.value, teacherId, courseId });
    let list = res.records || [];
    if (searchForm.value.keyword) {
      list = list.filter((item: any) => item.title.includes(searchForm.value.keyword));
    }
    tableData.value = list;
    total.value = res.total;
  } catch (error) {
    console.error("查询试卷失败", error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchData();
});

const handleSearch = () => {
  currentPage.value = 1;
  fetchData();
};
const resetSearch = () => {
  searchForm.value.keyword = "";
  handleSearch();
};

const goToGrading = (row: any) => {
  router.push({ path: "/online-test/grading", query: { examId: row.id } });
};

// --- 新增/修改试卷 ---
const drawerVisible = ref(false);
const drawerTitle = ref("新增试卷");
const submitLoading = ref(false);

const formData = ref({
  id: undefined as number | undefined,
  title: "",
  durationMins: 120,
  totalScore: 100,
  passScore: 60,
  generateMode: "manual" as "manual" | "auto",
  allowedAttempts: 1,
  autoRules: {
    singleChoiceCount: 4,
    trueFalseCount: 2,
    singleChoiceScore: 20,
    trueFalseScore: 10,
    targetDifficulty: 1,
    knowledgePoints: [] as string[]
  }
});

const selectedQuestions = ref<any[]>([]);

const handleAdd = () => {
  drawerTitle.value = "新增试卷";
  formData.value = {
    id: undefined,
    title: "",
    durationMins: 120,
    totalScore: 100,
    passScore: 60,
    generateMode: "manual",
    allowedAttempts: 1,
    autoRules: {
      singleChoiceCount: 4,
      trueFalseCount: 2,
      singleChoiceScore: 20,
      trueFalseScore: 10,
      targetDifficulty: 1,
      knowledgePoints: []
    }
  };
  selectedQuestions.value = [];
  drawerVisible.value = true;
};

const handleEdit = (row: any) => {
  drawerTitle.value = "修改试卷";
  formData.value = {
    id: row.id,
    title: row.title,
    durationMins: row.durationMins,
    totalScore: row.totalScore,
    passScore: row.passScore,
    generateMode: row.generateMode,
    allowedAttempts: row.allowedAttempts || 1,
    autoRules: formData.value.autoRules
  };
  selectedQuestions.value = [];
  drawerVisible.value = true;
};

const saveData = async () => {
  if (!formData.value.title) return ElMessage.warning("试卷名称不能为空");
  submitLoading.value = true;
  try {
    if (formData.value.generateMode === "manual") {
      const qIds = selectedQuestions.value.map(q => q.id);
      const qScores = selectedQuestions.value.map(q => q.score);
      const req = {
        teacherId,
        courseId,
        title: formData.value.title,
        totalScore: formData.value.totalScore,
        durationMins: formData.value.durationMins,
        passScore: formData.value.passScore,
        allowedAttempts: formData.value.allowedAttempts,
        generateMode: "manual" as const,
        questionIds: qIds,
        questionScores: qScores
      };
      if (formData.value.id) {
        await updateExamPaper({ ...req, id: formData.value.id });
      } else {
        await createExamPaper(req);
      }
    } else {
      await generateExamPaper({
        teacherId,
        courseId,
        title: formData.value.title,
        totalScore: formData.value.totalScore,
        durationMins: formData.value.durationMins,
        passScore: formData.value.passScore,
        allowedAttempts: formData.value.allowedAttempts,
        generateMode: "auto" as const,
        autoRules: formData.value.autoRules
      });
    }
    ElMessage.success("试卷保存成功！");
    drawerVisible.value = false;
    fetchData();
  } catch (error: any) {
    ElMessage.error(error?.message || "保存失败");
  } finally {
    submitLoading.value = false;
  }
};

// --- 发布、撤回、删除 ---
const publishDialogVisible = ref(false);
const publishTargetId = ref(0);
const publishTimeRange = ref<[string, string]>(["", ""]);
const publishAttempts = ref(1);

const openPublishDialog = (row: any) => {
  publishTargetId.value = row.id;
  publishTimeRange.value = ["", ""];
  publishAttempts.value = row.allowedAttempts || 1;
  publishDialogVisible.value = true;
};

const submitPublish = async () => {
  if (!publishTimeRange.value || !publishTimeRange.value[0]) {
    return ElMessage.warning("请选择有效时间范围");
  }
  submitLoading.value = true;
  try {
    await publishExamPaper({
      teacherId,
      id: publishTargetId.value,
      validStartTime: publishTimeRange.value[0],
      validEndTime: publishTimeRange.value[1],
      allowedAttempts: publishAttempts.value,
      scoringStrategy: "AUTO_GRADE"
    });
    ElMessage.success("发布成功！学生现在可以参加该考试了。");
    publishDialogVisible.value = false;
    fetchData();
  } catch (error: any) {
    ElMessage.error(error?.message || "发布失败");
  } finally {
    submitLoading.value = false;
  }
};

const handleWithdraw = (row: any) => {
  ElMessageBox.confirm(`撤回后，学生将无法继续进入该考试。确认撤回吗？`, "撤回确认", { type: "warning" })
    .then(async () => {
      try {
        await withdrawExamPaper({ teacherId, id: row.id });
        ElMessage.success("已成功撤回");
        fetchData();
      } catch (error: any) {
        ElMessage.error(error?.message || "撤回失败");
      }
    })
    .catch(() => {
      //
    });
};

const handleDelete = (row: any) => {
  ElMessageBox.confirm("确认要删除该试卷草稿吗？", "删除提示", { type: "warning" })
    .then(async () => {
      try {
        await deleteExamPaper({ teacherId, id: row.id });
        ElMessage.success("删除成功");
        fetchData();
      } catch (error: any) {
        ElMessage.error(error?.message || "删除失败");
      }
    })
    .catch(() => {
      //
    });
};

// --- 题库选择器 ---
const questionSelectorVisible = ref(false);
const bankQuestions = ref<any[]>([]);
const tempSelection = ref<any[]>([]);

onMounted(async () => {
  try {
    const res = await queryQuestionBank({ current: 1, size: 50, teacherId, courseId });
    bankQuestions.value = res.records;
  } catch (e) {
    // 静默失败，不影响主流程
  }
});

const handleSelectionChange = (val: any[]) => {
  tempSelection.value = val;
};
const confirmSelectQuestions = () => {
  const newItems = tempSelection.value.map(q => ({ ...q, score: 10 }));
  selectedQuestions.value.push(...newItems);
  questionSelectorVisible.value = false;
  ElMessage.success(`已添加 ${newItems.length} 道题目，请为其设置分值`);
};
const removeQuestion = (index: number) => {
  selectedQuestions.value.splice(index, 1);
};

// --- 预览试卷 (重点新增) ---
const previewVisible = ref(false);
const previewData = ref<any>(null);
const previewLoading = ref(false);

const handlePreview = async (row: any) => {
  previewVisible.value = true;
  previewLoading.value = true;
  previewData.value = null; // 重置旧数据
  try {
    const res = await previewExamPaper({ teacherId, id: row.id });
    previewData.value = res;
  } catch (error: any) {
    ElMessage.error(error?.message || "获取试卷预览失败");
    previewVisible.value = false;
  } finally {
    previewLoading.value = false;
  }
};
const handleOpenScore = async (row: any) => {
  try {
    await openExamScore({ teacherId, id: row.id });
    ElMessage.success("成绩已开放");
    fetchData();
  } catch (error: any) {
    ElMessage.error(error?.message || "操作失败");
  }
};

const handleOpenAnswer = async (row: any) => {
  try {
    await openExamAnswer({ teacherId, id: row.id });
    ElMessage.success("答案已开放");
    fetchData();
  } catch (error: any) {
    ElMessage.error(error?.message || "操作失败");
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

/* 预览相关样式 */
.preview-container {
  min-height: 300px;
  padding: 0 20px;
}
.preview-header {
  padding-bottom: 20px; /* 挪到 border-bottom 前面 */
  margin-bottom: 20px;
  text-align: center;
  border-bottom: 1px solid #ebeef5;
}
.preview-header h2 {
  margin: 0 0 10px; /* 去掉末尾多余的 0，简写为三值 */
  font-size: 22px; /* 挪到 color 前面 */
  color: #303133;
}
.preview-meta {
  font-size: 14px; /* 挪到 color 前面 */
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
</style>
