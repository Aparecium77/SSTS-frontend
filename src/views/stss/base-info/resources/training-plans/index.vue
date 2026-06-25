<template>
  <div class="base-info-training-plans">
    <el-card shadow="never" class="page-card">
      <div class="page-header">
        <div>
          <p class="eyebrow">基础信息管理</p>
          <h2>培养方案管理</h2>
          <p class="description">维护培养方案：方案代码、专业代码、年级、版本和必修课程。</p>
        </div>
        <el-space>
          <el-button :icon="RefreshRight" @click="handleReset">重置</el-button>
          <el-button type="primary" :icon="Plus" @click="handleCreate">新增培养方案</el-button>
        </el-space>
      </div>

      <el-form :inline="true" :model="queryForm" class="search-form">
        <el-form-item label="专业编码">
          <el-input v-model="queryForm.majorCode" clearable placeholder="如 CS" @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="年级">
          <el-input v-model="queryForm.grade" clearable placeholder="请输入年级" @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
        </el-form-item>
      </el-form>

      <el-table v-loading="loading" :data="tableData" border stripe>
        <el-table-column prop="planNo" label="方案编码" min-width="160" />
        <el-table-column prop="majorCode" label="专业编码" min-width="180" />
        <el-table-column prop="grade" label="年级" width="100" align="center" />
        <el-table-column prop="version" label="版本" width="100" align="center" />
        <el-table-column label="必修课程" min-width="260">
          <template #default="scope">
            {{ formatRequiredCourses(scope.row) }}
          </template>
        </el-table-column>
        <el-table-column prop="updatedAt" label="更新时间" min-width="170" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="scope">
            <el-space wrap>
              <el-button link type="primary" :icon="View" @click="handleView(scope.row)">详情</el-button>
              <el-button link type="primary" :icon="EditPen" @click="handleEdit(scope.row)">编辑</el-button>
              <el-button link type="danger" :icon="Delete" @click="handleRemove(scope.row)">删除</el-button>
            </el-space>
          </template>
        </el-table-column>
      </el-table>

      <div class="page-footer">
        <el-pagination
          v-model:current-page="pageState.pageNum"
          v-model:page-size="pageState.pageSize"
          :page-sizes="[5, 10, 20]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pageState.total"
          @size-change="handlePageChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <el-drawer v-model="drawerVisible" size="560px" destroy-on-close :title="drawerTitle">
      <el-form ref="formRef" :model="formState" :rules="formRules" label-width="100px" :disabled="drawerMode === 'view'">
        <el-form-item label="方案编码" prop="planNo">
          <el-input v-model="formState.planNo" placeholder="请输入方案编码" />
        </el-form-item>
        <el-form-item label="专业编码" prop="majorCode">
          <el-input v-model="formState.majorCode" placeholder="请输入专业编码" />
        </el-form-item>
        <el-form-item label="年级" prop="grade">
          <el-input v-model="formState.grade" placeholder="请输入年级，如 2024" />
        </el-form-item>
        <el-form-item label="版本" prop="version">
          <el-input v-model="formState.version" placeholder="例如 1.0" />
        </el-form-item>
        <el-form-item label="必修课程" prop="requiredCourseIds">
          <el-select
            v-model="formState.requiredCourseIds"
            multiple
            filterable
            collapse-tags
            collapse-tags-tooltip
            placeholder="请选择课程"
          >
            <el-option
              v-for="course in courseOptions"
              :key="course.id"
              :label="`${course.courseNo} ${course.courseName}`"
              :value="course.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-space>
          <el-button @click="closeDrawer">取消</el-button>
          <el-button v-if="drawerMode !== 'view'" type="primary" :loading="saving" @click="handleSubmit">保存</el-button>
        </el-space>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts" name="baseInfoTrainingPlans">
import { computed, onMounted, reactive, ref } from "vue";
import { Delete, EditPen, Plus, RefreshRight, Search, View } from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from "element-plus";
import {
  deleteBaseInfoTrainingPlanApi,
  getBaseInfoCourseListApi,
  getBaseInfoTrainingPlanDetailApi,
  getBaseInfoTrainingPlanListApi,
  saveBaseInfoTrainingPlanApi
} from "@/api/modules/baseInfo";
import type { BaseInfo } from "@/api/interface/baseInfo";

type DrawerMode = "create" | "edit" | "view";

const queryForm = reactive<BaseInfo.TrainingPlanQuery>({
  pageNum: 1,
  pageSize: 10,
  keyword: "",
  majorCode: "",
  grade: ""
} as BaseInfo.TrainingPlanQuery);

const pageState = reactive({ pageNum: 1, pageSize: 10, total: 0 });

const loading = ref(false);
const saving = ref(false);
const tableData = ref<BaseInfo.TrainingPlanItem[]>([]);
const courseOptions = ref<BaseInfo.CourseItem[]>([]);
const drawerVisible = ref(false);
const drawerMode = ref<DrawerMode>("create");
const formRef = ref<FormInstance>();

const emptyForm = (): BaseInfo.TrainingPlanForm => ({
  planNo: "",
  majorCode: "",
  grade: "",
  version: "",
  requiredCourseIds: []
});

const formState = reactive<BaseInfo.TrainingPlanForm>(emptyForm());

const formRules: FormRules<BaseInfo.TrainingPlanForm> = {
  planNo: [{ required: true, message: "请输入方案编码", trigger: "blur" }],
  majorCode: [{ required: true, message: "请输入专业编码", trigger: "blur" }],
  grade: [{ required: true, message: "请输入年级", trigger: "blur" }],
  version: [{ required: true, message: "请输入版本号", trigger: "blur" }],
  requiredCourseIds: [{ type: "array", required: true, min: 1, message: "请选择必修课程", trigger: "change" }]
};

const patchForm = (data: Partial<BaseInfo.TrainingPlanForm>) => {
  Object.assign(formState, emptyForm(), data);
};

const formatRequiredCourses = (row: BaseInfo.TrainingPlanItem) => {
  if (row.requiredCourses.length) {
    return row.requiredCourses.map(course => `${course.courseNo} ${course.courseName}`).join("、");
  }
  return row.requiredCourseIds.join("、") || "-";
};

const loadCourseOptions = async () => {
  try {
    const res = await getBaseInfoCourseListApi({ pageNum: 1, pageSize: 100, keyword: "", isActive: true });
    courseOptions.value = res.list;
  } catch (err) {
    ElMessage.error((err as any)?.message || "获取课程选项失败");
  }
};

const drawerTitle = computed(() => {
  if (drawerMode.value === "create") return "新增培养方案";
  if (drawerMode.value === "edit") return "编辑培养方案";
  return "培养方案详情";
});

const loadTable = async () => {
  loading.value = true;
  try {
    const res = await getBaseInfoTrainingPlanListApi({ ...queryForm, pageNum: pageState.pageNum, pageSize: pageState.pageSize });
    tableData.value = res.list;
    pageState.total = res.total;
  } catch (err) {
    ElMessage.error((err as any)?.message || "获取列表失败");
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  pageState.pageNum = 1;
  loadTable();
};

const handleReset = () => {
  queryForm.keyword = "";
  queryForm.majorCode = "";
  queryForm.grade = "";
  pageState.pageNum = 1;
  pageState.pageSize = 10;
  loadTable();
};

const handlePageChange = (page?: number, size?: number) => {
  if (page !== undefined) pageState.pageNum = page;
  if (size !== undefined) pageState.pageSize = size;
  loadTable();
};

const openDrawer = (mode: DrawerMode, data?: Partial<BaseInfo.TrainingPlanForm>) => {
  drawerMode.value = mode;
  drawerVisible.value = true;
  if (!data) {
    patchForm({});
    return;
  }
  patchForm({ ...data });
};

const handleCreate = () => openDrawer("create");

const handleEdit = async (row: BaseInfo.TrainingPlanItem) => {
  try {
    const detail = await getBaseInfoTrainingPlanDetailApi(row.id);
    openDrawer("edit", detail);
  } catch (err) {
    ElMessage.error((err as any)?.message || "获取详情失败");
  }
};

const handleView = async (row: BaseInfo.TrainingPlanItem) => {
  try {
    const detail = await getBaseInfoTrainingPlanDetailApi(row.id);
    openDrawer("view", detail);
  } catch (err) {
    ElMessage.error((err as any)?.message || "获取详情失败");
  }
};

const handleRemove = async (row: BaseInfo.TrainingPlanItem) => {
  try {
    await ElMessageBox.confirm(`确定删除 ${row.planNo} 吗？`, "提示", { type: "warning" });
    await deleteBaseInfoTrainingPlanApi(row.id);
    ElMessage.success("删除成功");
    await loadTable();
  } catch (err) {
    if ((err as any)?.code === "cancel") return;
    ElMessage.error((err as any)?.message || "删除失败");
  }
};

const closeDrawer = () => {
  drawerVisible.value = false;
};

const handleSubmit = async () => {
  try {
    const valid = await formRef.value?.validate().catch(() => false);
    if (!valid) return;
    saving.value = true;
    await saveBaseInfoTrainingPlanApi({ ...formState });
    ElMessage.success(drawerMode.value === "create" ? "新增成功" : "保存成功");
    drawerVisible.value = false;
    await loadTable();
  } catch (err) {
    ElMessage.error((err as any)?.message || "保存失败");
  } finally {
    saving.value = false;
  }
};

onMounted(() => {
  loadCourseOptions();
  loadTable();
});
</script>

<style scoped lang="scss">
.base-info-training-plans {
  padding: 20px;
}
.page-card {
  border-radius: 16px;
}
.page-header {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 20px;
}
.eyebrow {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 700;
  color: #009688;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
h2 {
  margin: 0 0 8px;
  font-size: 28px;
  color: #1f2a44;
}
.description {
  margin: 0;
  line-height: 1.75;
  color: #5b667b;
}
.search-form {
  margin-bottom: 12px;
}
.page-footer {
  display: flex;
  justify-content: flex-end;
  padding-top: 16px;
}

@media (width <= 992px) {
  .page-header {
    flex-direction: column;
  }
}
</style>
