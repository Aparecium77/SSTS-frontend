<template>
  <div class="card content-box">
    <!-- 1. 顶部查询搜索区 -->
    <el-form :inline="true" :model="searchForm" class="search-form">
      <el-form-item label="关键字">
        <el-input v-model="searchForm.keyword" placeholder="搜题干内容" clearable />
      </el-form-item>
      <el-form-item label="题型">
        <el-select v-model="searchForm.type" placeholder="全部" clearable style="width: 120px">
          <el-option label="单选题" :value="1" />
          <el-option label="判断题" :value="2" />
        </el-select>
      </el-form-item>
      <el-form-item label="难度">
        <el-select v-model="searchForm.difficulty" placeholder="全部" clearable style="width: 120px">
          <el-option label="简单" :value="1" />
          <el-option label="中等" :value="2" />
          <el-option label="困难" :value="3" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="resetSearch">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 操作按钮区 -->
    <div style="margin-bottom: 20px">
      <el-button type="primary" @click="handleAdd">新增题目</el-button>
      <el-button type="success" @click="importDialogVisible = true">Excel 批量导入</el-button>
    </div>

    <!-- 题目列表表格 -->
    <el-table v-loading="loading" :data="tableData" :border="true" style="width: 100%">
      <el-table-column type="index" label="序号" width="60" align="center" />
      <el-table-column label="题型" width="100" align="center">
        <template #default="scope">
          <el-tag :type="scope.row.type === 1 ? 'primary' : 'warning'">
            {{ scope.row.type === 1 ? "单选题" : "判断题" }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="stem" label="题干" show-overflow-tooltip />
      <el-table-column label="难度" width="100" align="center">
        <template #default="scope">
          <span v-if="scope.row.difficulty === 1" style="color: #67c23a">简单</span>
          <span v-else-if="scope.row.difficulty === 2" style="color: #e6a23c">中等</span>
          <span v-else-if="scope.row.difficulty === 3" style="color: #f56c6c">困难</span>
        </template>
      </el-table-column>
      <!-- 知识点列 -->
      <el-table-column label="知识点" width="200">
        <template #default="scope">
          <el-tag
            v-for="item in scope.row.knowledgePoints"
            :key="item"
            size="small"
            style="margin-right: 5px; margin-bottom: 2px"
          >
            {{ item }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150" fixed="right" align="center">
        <template #default="scope">
          <el-button type="primary" link @click="handleEdit(scope.row)">修改</el-button>
          <el-button type="danger" link @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 2. 分页器 -->
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

    <!-- 3. 加题/改题的弹窗 -->
    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="650px" destroy-on-close>
      <el-form :model="formData" label-width="80px" ref="formRef">
        <el-form-item label="题干" required>
          <el-input v-model="formData.stem" type="textarea" :rows="3" placeholder="请输入题目内容" />
        </el-form-item>

        <el-row>
          <el-col :span="12">
            <el-form-item label="题型" required>
              <el-select v-model="formData.type" placeholder="请选择" style="width: 100%" @change="handleTypeChange">
                <el-option label="单选题" :value="1" />
                <el-option label="判断题" :value="2" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="难度" required>
              <el-select v-model="formData.difficulty" placeholder="请选择" style="width: 100%">
                <el-option label="简单" :value="1" />
                <el-option label="中等" :value="2" />
                <el-option label="困难" :value="3" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 动态选项渲染 -->
        <template v-if="formData.type === 1">
          <el-form-item label="选项 A" required><el-input v-model="formData.options[0]" placeholder="输入选项 A" /></el-form-item>
          <el-form-item label="选项 B" required><el-input v-model="formData.options[1]" placeholder="输入选项 B" /></el-form-item>
          <el-form-item label="选项 C" required><el-input v-model="formData.options[2]" placeholder="输入选项 C" /></el-form-item>
          <el-form-item label="选项 D" required><el-input v-model="formData.options[3]" placeholder="输入选项 D" /></el-form-item>
        </template>

        <!-- 答案选择 -->
        <el-form-item label="正确答案" required>
          <el-radio-group v-if="formData.type === 1" v-model="formData.answer">
            <el-radio label="A">A</el-radio>
            <el-radio label="B">B</el-radio>
            <el-radio label="C">C</el-radio>
            <el-radio label="D">D</el-radio>
          </el-radio-group>
          <el-radio-group v-if="formData.type === 2" v-model="formData.answer">
            <el-radio label="正确">正确</el-radio>
            <el-radio label="错误">错误</el-radio>
          </el-radio-group>
        </el-form-item>

        <!-- 知识点 -->
        <el-form-item label="知识点">
          <el-select
            v-model="formData.knowledgePoints"
            :multiple="true"
            filterable
            allow-create
            default-first-option
            placeholder="可选择或输入多个知识点"
            style="width: 100%"
          >
            <el-option label="软件工程基础" value="软件工程基础" />
            <el-option label="需求分析" value="需求分析" />
            <el-option label="生命周期" value="生命周期" />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="submitLoading" @click="saveData">保存</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 4. Excel 批量导入弹窗 -->
    <el-dialog title="导入题库" v-model="importDialogVisible" width="400px" destroy-on-close>
      <el-upload class="upload-demo" drag action="#" :http-request="handleImport" :show-file-list="false" accept=".xlsx, .xls">
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">将 Excel 文件拖到此处，或 <em>点击上传</em></div>
        <template #tip>
          <div class="el-upload__tip">请确保 Excel 包含：题型、题干、选项、答案等字段</div>
        </template>
      </el-upload>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { UploadFilled } from "@element-plus/icons-vue";
import { queryQuestionBank, addQuestion, updateQuestion, deleteQuestion, importQuestionsByExcel } from "@/api/modules/onlineTest";
import {
  buildQuestionBankQuery,
  buildQuestionRequest,
  cloneQuestionForEdit,
  createDefaultQuestionForm,
  createEmptyQuestionSearchForm,
  getQuestionFormByType,
  shouldMoveToPreviousPageAfterDelete,
  validateQuestionForm
} from "./logic";

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

const searchForm = ref(createEmptyQuestionSearchForm());

const loading = ref(false);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);
const tableData = ref<any[]>([]);

const fetchData = async () => {
  loading.value = true;
  try {
    const res = await queryQuestionBank({
      ...buildQuestionBankQuery(searchForm.value, currentPage.value, pageSize.value, teacherId, courseId)
    });
    tableData.value = res.records;
    total.value = res.total;
  } catch (error) {
    console.error("获取题库失败", error);
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
  searchForm.value = createEmptyQuestionSearchForm();
  handleSearch();
};

const dialogVisible = ref(false);
const dialogTitle = ref("新增题目");
const submitLoading = ref(false);

const formData = ref(createDefaultQuestionForm());

const handleTypeChange = (val: number) => {
  Object.assign(formData.value, getQuestionFormByType(val));
};

const handleAdd = () => {
  dialogTitle.value = "新增题目";
  formData.value = createDefaultQuestionForm();
  dialogVisible.value = true;
};

const handleEdit = (row: any) => {
  dialogTitle.value = "修改题目";
  formData.value = cloneQuestionForEdit(row);
  dialogVisible.value = true;
};

const saveData = async () => {
  if (!validateQuestionForm(formData.value)) {
    return ElMessage.warning("题干和正确答案为必填项！");
  }

  submitLoading.value = true;
  try {
    const reqData = buildQuestionRequest(formData.value, teacherId, courseId);

    if (formData.value.id) {
      await updateQuestion({ ...reqData, id: formData.value.id });
      ElMessage.success("修改成功！");
    } else {
      await addQuestion(reqData);
      ElMessage.success("新增成功！");
    }
    dialogVisible.value = false;
    fetchData();
  } catch (error) {
    console.error(error);
  } finally {
    submitLoading.value = false;
  }
};

const handleDelete = (row: any) => {
  ElMessageBox.confirm("即将永久删除该题目，是否继续？", "危险操作", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(async () => {
      try {
        await deleteQuestion({ teacherId, id: row.id, force: true });
        ElMessage.success("删除成功！");
        if (shouldMoveToPreviousPageAfterDelete(tableData.value.length, currentPage.value)) {
          currentPage.value -= 1;
        }
        fetchData();
      } catch (error: any) {
        ElMessage.error(error?.message || "删除失败！该题目可能已被试卷关联。");
      }
    })
    .catch(() => {
      // 用户取消删除操作，这里写一行注释防报错
    });
};

const importDialogVisible = ref(false);

const handleImport = async (options: any) => {
  const file = options.file;
  try {
    await importQuestionsByExcel(teacherId, file);
    ElMessage.success("导入成功！");
    importDialogVisible.value = false;
    currentPage.value = 1;
    fetchData();
  } catch (error) {
    console.error("导入失败", error);
    ElMessage.error("导入失败，请检查 Excel 格式是否正确");
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
</style>
