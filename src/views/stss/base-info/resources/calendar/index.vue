<template>
  <div class="base-info-calendar">
    <el-card shadow="never" class="page-card">
      <div class="page-header">
        <div>
          <p class="eyebrow">基础信息管理</p>
          <h2>校历管理</h2>
          <p class="description">维护学期校历：学期代码、学期名称、起止日期和版本。</p>
        </div>
        <el-space>
          <el-button :icon="RefreshRight" @click="handleReset">重置</el-button>
          <el-button type="primary" :icon="Plus" @click="handleCreate">新增校历</el-button>
        </el-space>
      </div>

      <el-form :inline="true" :model="queryForm" class="search-form">
        <el-form-item label="学期代码">
          <el-input v-model="queryForm.termCode" clearable placeholder="如 2025-2026-1" @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="学期名称">
          <el-input v-model="queryForm.termName" clearable placeholder="如 秋季学期" @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
        </el-form-item>
      </el-form>

      <el-table v-loading="loading" :data="tableData" border stripe>
        <el-table-column prop="termCode" label="学期代码" min-width="140" />
        <el-table-column prop="termName" label="学期名称" min-width="180" />
        <el-table-column prop="startDate" label="开始日期" width="140" />
        <el-table-column prop="endDate" label="结束日期" width="140" />
        <el-table-column prop="version" label="版本" width="90" />
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
        <el-form-item label="学期代码" prop="termCode">
          <el-input v-model="formState.termCode" placeholder="如 2025-2026-1" />
        </el-form-item>
        <el-form-item label="学期名称" prop="termName">
          <el-input v-model="formState.termName" placeholder="如 2025-2026 学年第一学期" />
        </el-form-item>
        <el-form-item label="开始日期" prop="startDate">
          <el-date-picker
            v-model="formState.startDate"
            type="date"
            placeholder="选择开始日期"
            value-format="YYYY-MM-DD"
            :editable="false"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="结束日期" prop="endDate">
          <el-date-picker
            v-model="formState.endDate"
            type="date"
            placeholder="选择结束日期"
            value-format="YYYY-MM-DD"
            :editable="false"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="版本" prop="version">
          <el-input v-model="formState.version" placeholder="如 1.0" />
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

<script setup lang="ts" name="baseInfoCalendar">
import { computed, onMounted, reactive, ref } from "vue";
import { Delete, EditPen, Plus, RefreshRight, Search, View } from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from "element-plus";
import {
  deleteBaseInfoCalendarApi,
  getBaseInfoCalendarDetailApi,
  getBaseInfoCalendarListApi,
  saveBaseInfoCalendarApi
} from "@/api/modules/baseInfo";
import type { BaseInfo } from "@/api/interface/baseInfo";

type DrawerMode = "create" | "edit" | "view";

const queryForm = reactive<BaseInfo.CalendarQuery>({
  pageNum: 1,
  pageSize: 10,
  termCode: "",
  termName: ""
});

const pageState = reactive({ pageNum: 1, pageSize: 10, total: 0 });

const loading = ref(false);
const saving = ref(false);
const tableData = ref<BaseInfo.CalendarItem[]>([]);
const drawerVisible = ref(false);
const drawerMode = ref<DrawerMode>("create");
const formRef = ref<FormInstance>();

const emptyForm = (): BaseInfo.CalendarForm => ({
  id: undefined,
  termCode: "",
  termName: "",
  startDate: "",
  endDate: "",
  version: "1.0"
});

const formState = reactive<BaseInfo.CalendarForm>(emptyForm());

const formRules: FormRules<BaseInfo.CalendarForm> = {
  termCode: [{ required: true, message: "请输入学期代码", trigger: "blur" }],
  termName: [{ required: true, message: "请输入学期名称", trigger: "blur" }],
  startDate: [{ required: true, message: "请选择开始日期", trigger: "change" }],
  endDate: [{ required: true, message: "请选择结束日期", trigger: "change" }]
};

const patchForm = (data: Partial<BaseInfo.CalendarForm>) => {
  Object.assign(formState, emptyForm(), data);
};

const drawerTitle = computed(() => {
  if (drawerMode.value === "create") return "新增校历";
  if (drawerMode.value === "edit") return "编辑校历";
  return "校历详情";
});

const closeDrawer = () => {
  drawerVisible.value = false;
};

const loadTable = async () => {
  loading.value = true;
  try {
    const res = await getBaseInfoCalendarListApi({
      ...queryForm,
      pageNum: pageState.pageNum,
      pageSize: pageState.pageSize
    });
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
  queryForm.termCode = "";
  queryForm.termName = "";
  pageState.pageNum = 1;
  pageState.pageSize = 10;
  loadTable();
};

const handlePageChange = (page?: number, size?: number) => {
  if (page !== undefined) pageState.pageNum = page;
  if (size !== undefined) pageState.pageSize = size;
  loadTable();
};

const openDrawer = (mode: DrawerMode, data?: Partial<BaseInfo.CalendarForm>) => {
  drawerMode.value = mode;
  drawerVisible.value = true;
  if (!data) {
    patchForm({});
    return;
  }
  patchForm({ ...data });
};

const handleCreate = () => openDrawer("create");

const handleEdit = async (row: BaseInfo.CalendarItem) => {
  try {
    const detail = await getBaseInfoCalendarDetailApi(row.id);
    openDrawer("edit", detail);
  } catch (err) {
    ElMessage.error((err as any)?.message || "获取详情失败");
  }
};

const handleView = async (row: BaseInfo.CalendarItem) => {
  try {
    const detail = await getBaseInfoCalendarDetailApi(row.id);
    openDrawer("view", detail);
  } catch (err) {
    ElMessage.error((err as any)?.message || "获取详情失败");
  }
};

const handleRemove = async (row: BaseInfo.CalendarItem) => {
  try {
    await ElMessageBox.confirm(`确定删除 ${row.termCode} 吗？`, "提示", { type: "warning" });
    await deleteBaseInfoCalendarApi(row.id);
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

    if (!formState.startDate || !formState.endDate) {
      ElMessage.error("请选择起止日期");
      return;
    }
    if (formState.startDate > formState.endDate) {
      ElMessage.error("开始日期必须早于或等于结束日期");
      return;
    }

    saving.value = true;
    await saveBaseInfoCalendarApi({ ...formState } as any);
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
.base-info-calendar {
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
.range-tip {
  margin: 0 0 16px 100px;
  font-size: 12px;
  line-height: 1.5;
  color: #6b7280;
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
