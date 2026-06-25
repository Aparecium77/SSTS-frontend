<template>
  <div class="base-info-course">
    <el-card shadow="never" class="page-card">
      <div class="page-header">
        <div>
          <p class="eyebrow">基础信息管理</p>
          <h2>课程资源</h2>
          <p class="description">维护课程基础数据：课程代码、课程名称、学分、容量、考核方式与状态。</p>
        </div>
        <el-space>
          <el-button :icon="RefreshRight" @click="handleReset">重置</el-button>
          <el-button :disabled="!selectedRows.length" type="danger" @click="handleBatchRemove">批量删除</el-button>
          <el-button @click="exportCsv">导出</el-button>
          <el-button type="primary" :icon="Plus" @click="handleCreate">新增课程</el-button>
        </el-space>
      </div>

      <el-form :inline="true" :model="queryForm" class="search-form">
        <el-form-item label="关键字">
          <el-input v-model="queryForm.keyword" clearable placeholder="编号、名称" @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
        </el-form-item>
      </el-form>

      <el-table v-loading="loading" :data="tableData" border stripe @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="60" />
        <el-table-column prop="courseNo" label="课程编号" min-width="140" />
        <el-table-column prop="courseName" label="课程名称" min-width="220" />
        <el-table-column prop="credits" label="学分" width="90" />
        <el-table-column prop="capacity" label="容量" width="90" />
        <el-table-column prop="assessmentMethod" label="考核方式" min-width="120" />
        <el-table-column prop="isActive" label="状态" width="100" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.isActive ? 'success' : 'info'">{{ scope.row.isActive ? "启用" : "停用" }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="updatedAt" label="更新时间" min-width="170" />
        <el-table-column label="操作" width="220" fixed="right">
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

    <el-drawer v-model="drawerVisible" size="520px" destroy-on-close :title="drawerTitle">
      <el-form ref="formRef" :model="formState" :rules="formRules" label-width="100px" :disabled="drawerMode === 'view'">
        <el-form-item label="课程编号" prop="courseNo">
          <el-input v-model="formState.courseNo" placeholder="请输入课程编号" />
        </el-form-item>
        <el-form-item label="课程名称" prop="courseName">
          <el-input v-model="formState.courseName" placeholder="请输入课程名称" />
        </el-form-item>
        <el-form-item label="学分" prop="credits">
          <el-input-number v-model="formState.credits" :min="0" />
        </el-form-item>
        <el-form-item label="容量" prop="capacity">
          <el-input-number v-model="formState.capacity" :min="0" />
        </el-form-item>
        <el-form-item label="考核方式" prop="assessmentMethod">
          <el-input v-model="formState.assessmentMethod" placeholder="如 考试 / 考查" />
        </el-form-item>
        <el-form-item label="状态" prop="isActive">
          <el-radio-group v-model="formState.isActive">
            <el-radio :label="true">启用</el-radio>
            <el-radio :label="false">停用</el-radio>
          </el-radio-group>
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

<script setup lang="ts" name="baseInfoCourse">
import { onMounted, reactive, ref, computed } from "vue";
import { Delete, EditPen, Plus, RefreshRight, Search, View } from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from "element-plus";
import {
  deleteBaseInfoCourseApi,
  getBaseInfoCourseDetailApi,
  getBaseInfoCourseListApi,
  saveBaseInfoCourseApi
} from "@/api/modules/baseInfo";
import type { BaseInfo } from "@/api/interface/baseInfo";

type DrawerMode = "create" | "edit" | "view";

const queryForm = reactive<BaseInfo.CourseQuery>({
  pageNum: 1,
  pageSize: 10,
  keyword: ""
} as BaseInfo.CourseQuery);

const pageState = reactive({ pageNum: 1, pageSize: 10, total: 0 });

const loading = ref(false);
const saving = ref(false);
const tableData = ref<BaseInfo.CourseItem[]>([]);
const selectedRows = ref<BaseInfo.CourseItem[]>([]);
const drawerVisible = ref(false);
const drawerMode = ref<DrawerMode>("create");
const formRef = ref<FormInstance>();

const emptyForm = (): BaseInfo.CourseForm => ({
  courseNo: "",
  courseName: "",
  credits: 0,
  capacity: 0,
  assessmentMethod: "",
  isActive: true
});

const formState = reactive<BaseInfo.CourseForm>(emptyForm());

const formRules: FormRules<BaseInfo.CourseForm> = {
  courseNo: [{ required: true, message: "请输入课程编号", trigger: "blur" }],
  courseName: [{ required: true, message: "请输入课程名称", trigger: "blur" }],
  credits: [{ required: true, message: "请输入学分", trigger: "change" }],
  capacity: [{ required: true, message: "请输入容量", trigger: "change" }]
};

const patchForm = (data: Partial<BaseInfo.CourseForm>) => {
  Object.assign(formState, emptyForm(), data);
};

const drawerTitle = computed(() => {
  if (drawerMode.value === "create") return "新增课程";
  if (drawerMode.value === "edit") return "编辑课程";
  return "课程详情";
});

const loadTable = async () => {
  loading.value = true;
  try {
    const res = await getBaseInfoCourseListApi({ ...queryForm, pageNum: pageState.pageNum, pageSize: pageState.pageSize });
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
  pageState.pageNum = 1;
  pageState.pageSize = 10;
  loadTable();
};

const handlePageChange = (page?: number, size?: number) => {
  if (page !== undefined) pageState.pageNum = page;
  if (size !== undefined) pageState.pageSize = size;
  loadTable();
};

const handleSelectionChange = (rows: BaseInfo.CourseItem[]) => {
  selectedRows.value = rows;
};

const handleBatchRemove = async () => {
  if (!selectedRows.value.length) return;
  try {
    await ElMessageBox.confirm(`确定删除选中的 ${selectedRows.value.length} 个课程？`, "提示", { type: "warning" });
    for (const r of selectedRows.value) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await deleteBaseInfoCourseApi(r.id);
      } catch (e) {
        // continue
      }
    }
    ElMessage.success("批量删除完成");
    selectedRows.value = [];
    await loadTable();
  } catch (err) {
    if ((err as any)?.code === "cancel") return;
    ElMessage.error((err as any)?.message || "批量删除失败");
  }
};

const exportCsv = () => {
  const rows = tableData.value || [];
  if (!rows.length) {
    ElMessage.info("当前没有数据可导出");
    return;
  }
  const header = ["课程编号", "课程名称", "学分", "容量", "考核方式", "状态", "更新时间"];
  const lines = [header.join(",")];
  for (const r of rows) {
    const line = [
      r.courseNo,
      r.courseName,
      String(r.credits),
      String(r.capacity),
      r.assessmentMethod,
      r.isActive ? "启用" : "停用",
      r.updatedAt
    ]
      .map(v => `"${String(v).replace(/"/g, '""')}"`)
      .join(",");
    lines.push(line);
  }
  const csv = lines.join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `courses_${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

const openDrawer = (mode: DrawerMode, data?: Partial<BaseInfo.CourseForm>) => {
  drawerMode.value = mode;
  drawerVisible.value = true;
  if (!data) {
    patchForm({});
    return;
  }
  patchForm({ ...data });
};

const handleCreate = () => openDrawer("create");

const handleEdit = async (row: BaseInfo.CourseItem) => {
  try {
    const detail = await getBaseInfoCourseDetailApi(row.id);
    openDrawer("edit", detail);
  } catch (err) {
    ElMessage.error((err as any)?.message || "获取详情失败");
  }
};

const handleView = async (row: BaseInfo.CourseItem) => {
  try {
    const detail = await getBaseInfoCourseDetailApi(row.id);
    openDrawer("view", detail);
  } catch (err) {
    ElMessage.error((err as any)?.message || "获取详情失败");
  }
};

const handleRemove = async (row: BaseInfo.CourseItem) => {
  try {
    await ElMessageBox.confirm(`确定删除 ${row.courseName} 吗？`, "提示", { type: "warning" });
    await deleteBaseInfoCourseApi(row.id);
    ElMessage.success("删除成功");
    await loadTable();
  } catch (err) {
    if ((err as any)?.code === "cancel") return;
    ElMessage.error((err as any)?.message || "删除失败");
  }
};

const handleSubmit = async () => {
  try {
    const valid = await formRef.value?.validate().catch(() => false);
    if (!valid) return;
    saving.value = true;
    await saveBaseInfoCourseApi({ ...formState });
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
  loadTable();
});
</script>

<style scoped lang="scss">
.base-info-course {
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
