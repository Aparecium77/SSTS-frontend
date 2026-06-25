<template>
  <div class="base-info-permissions">
    <el-tabs v-model="activeTab">
      <el-tab-pane label="基础信息字典" name="dictionary">
        <el-card shadow="never" class="page-card">
          <div class="page-header">
            <div>
              <p class="eyebrow">基础信息管理</p>
              <h2>基础信息字典</h2>
              <p class="description">维护系统级数据字典：部门、职称、考核方式、学期类型等。</p>
            </div>
            <el-space>
              <el-button :icon="RefreshRight" @click="handleReset">重置</el-button>
              <el-button type="primary" :icon="Plus" @click="handleCreate">新增条目</el-button>
            </el-space>
          </div>

          <el-form :inline="true" :model="queryForm" class="search-form">
            <el-form-item label="关键字">
              <el-input v-model="queryForm.keyword" clearable placeholder="编码、名称、说明" @keyup.enter="handleSearch" />
            </el-form-item>
            <el-form-item label="分类">
              <el-input v-model="queryForm.category" clearable placeholder="如 department" @keyup.enter="handleSearch" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
            </el-form-item>
          </el-form>

          <el-table v-loading="loading" :data="tableData" border stripe>
            <el-table-column prop="category" label="分类" min-width="140" />
            <el-table-column prop="itemCode" label="编码" min-width="120" />
            <el-table-column prop="itemName" label="名称" min-width="200" />
            <el-table-column prop="description" label="说明" min-width="220" />
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
              :page-sizes="[10, 20, 50]"
              layout="total, sizes, prev, pager, next, jumper"
              :total="pageState.total"
              @size-change="handlePageChange"
              @current-change="handlePageChange"
            />
          </div>
        </el-card>
      </el-tab-pane>
      <el-tab-pane label="回收站" name="recycle">
        <el-card shadow="never" class="page-card">
          <div class="page-header">
            <div>
              <p class="eyebrow">基础信息管理</p>
              <h2>回收站</h2>
              <p class="description">查看已逻辑删除的用户，支持恢复或彻底删除。</p>
            </div>
            <el-space>
              <el-button :icon="RefreshRight" @click="loadRecycleTable">刷新</el-button>
              <el-button :disabled="!hasRows" type="danger" @click="batchClear">批量彻底删除</el-button>
            </el-space>
          </div>

          <el-form :inline="true" :model="recycleQueryForm" class="search-form">
            <el-form-item label="关键字">
              <el-input
                v-model="recycleQueryForm.keyword"
                clearable
                placeholder="用户编号、账号、姓名"
                @keyup.enter="handleRecycleSearch"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :icon="Search" @click="handleRecycleSearch">查询</el-button>
            </el-form-item>
          </el-form>

          <el-table
            v-loading="recycleLoading"
            :data="recycleTableData"
            border
            stripe
            @selection-change="handleRecycleSelectionChange"
          >
            <el-table-column type="selection" width="60" />
            <el-table-column prop="userNo" label="用户编号" min-width="140" />
            <el-table-column prop="username" label="账号" min-width="140" />
            <el-table-column prop="fullName" label="姓名" min-width="140" />
            <el-table-column prop="roleNames" label="角色" min-width="160">
              <template #default="scope">{{ scope.row.roleNames.join("、") || "-" }}</template>
            </el-table-column>
            <el-table-column prop="deletedAt" label="删除时间" min-width="180" />
            <el-table-column label="操作" width="220" fixed="right">
              <template #default="scope">
                <el-space wrap>
                  <el-button link type="primary" @click="handleRestoreRecycle(scope.row)">恢复</el-button>
                  <el-button link type="danger" @click="handleClearRecycle(scope.row)">彻底删除</el-button>
                </el-space>
              </template>
            </el-table-column>
          </el-table>

          <div class="page-footer">
            <el-pagination
              v-model:current-page="recyclePageState.pageNum"
              v-model:page-size="recyclePageState.pageSize"
              :page-sizes="[10, 20, 50]"
              layout="total, sizes, prev, pager, next, jumper"
              :total="recyclePageState.total"
              @size-change="handleRecyclePageChange"
              @current-change="handleRecyclePageChange"
            />
          </div>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <el-drawer v-model="drawerVisible" size="520px" destroy-on-close :title="drawerTitle">
      <el-form ref="formRef" :model="formState" :rules="formRules" label-width="100px" :disabled="drawerMode === 'view'">
        <el-form-item label="分类" prop="category">
          <el-input v-model="formState.category" placeholder="如 department" />
        </el-form-item>
        <el-form-item label="编码" prop="itemCode">
          <el-input v-model="formState.itemCode" placeholder="如 CS" />
        </el-form-item>
        <el-form-item label="名称" prop="itemName">
          <el-input v-model="formState.itemName" placeholder="如 计算机学院" />
        </el-form-item>
        <el-form-item label="说明">
          <el-input v-model="formState.description" type="textarea" :rows="3" placeholder="选填" />
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

<script setup lang="ts" name="baseInfoPermissions">
import { computed, onMounted, reactive, ref } from "vue";
import { Delete, EditPen, Plus, RefreshRight, Search, View } from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from "element-plus";
import {
  deleteBaseInfoPermissionApi,
  batchClearBaseInfoRecycleApi,
  clearBaseInfoRecycleApi,
  getBaseInfoPermissionDetailApi,
  getBaseInfoPermissionListApi,
  getBaseInfoRecycleListApi,
  restoreBaseInfoRecycleApi,
  saveBaseInfoPermissionApi
} from "@/api/modules/baseInfo";
import type { BaseInfo } from "@/api/interface/baseInfo";

type DrawerMode = "create" | "edit" | "view";

const activeTab = ref("dictionary");
const queryForm = reactive<BaseInfo.PermissionQuery>({
  pageNum: 1,
  pageSize: 10,
  keyword: "",
  category: ""
});
const pageState = reactive({ pageNum: 1, pageSize: 10, total: 0 });
const loading = ref(false);
const saving = ref(false);
const tableData = ref<BaseInfo.PermissionItem[]>([]);
const drawerVisible = ref(false);
const drawerMode = ref<DrawerMode>("create");
const formRef = ref<FormInstance>();
const recycleQueryForm = reactive<BaseInfo.RecycleQuery>({
  pageNum: 1,
  pageSize: 10,
  keyword: ""
});
const recyclePageState = reactive({ pageNum: 1, pageSize: 10, total: 0 });
const recycleLoading = ref(false);
const recycleTableData = ref<BaseInfo.RecycleItem[]>([]);
const selectedRecycleRows = ref<BaseInfo.RecycleItem[]>([]);
const hasRows = computed(() => selectedRecycleRows.value.length > 0);

const emptyForm = (): BaseInfo.PermissionForm => ({
  category: "",
  itemCode: "",
  itemName: "",
  description: "",
  isActive: true
});
const formState = reactive<BaseInfo.PermissionForm>(emptyForm());

const formRules: FormRules<BaseInfo.PermissionForm> = {
  category: [{ required: true, message: "请输入分类", trigger: "blur" }],
  itemCode: [{ required: true, message: "请输入编码", trigger: "blur" }],
  itemName: [{ required: true, message: "请输入名称", trigger: "blur" }]
};

const drawerTitle = computed(() => {
  if (drawerMode.value === "create") return "新增条目";
  if (drawerMode.value === "edit") return "编辑条目";
  return "条目详情";
});

const patchForm = (data?: Partial<BaseInfo.PermissionForm>) => {
  Object.assign(formState, emptyForm(), data ?? {});
};

const loadTable = async () => {
  loading.value = true;
  try {
    const res = await getBaseInfoPermissionListApi({ ...queryForm, pageNum: pageState.pageNum, pageSize: pageState.pageSize });
    tableData.value = res.list;
    pageState.total = res.total;
  } catch (err) {
    ElMessage.error((err as Error)?.message || "获取列表失败");
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
  queryForm.category = "";
  pageState.pageNum = 1;
  pageState.pageSize = 10;
  loadTable();
};

const handlePageChange = (page?: number, size?: number) => {
  if (page !== undefined) pageState.pageNum = page;
  if (size !== undefined) pageState.pageSize = size;
  loadTable();
};

const closeDrawer = () => {
  drawerVisible.value = false;
};

const openDrawer = (mode: DrawerMode, data?: Partial<BaseInfo.PermissionForm>) => {
  drawerMode.value = mode;
  drawerVisible.value = true;
  patchForm(data);
};

const handleCreate = () => openDrawer("create");

const handleEdit = async (row: BaseInfo.PermissionItem) => {
  try {
    const detail = await getBaseInfoPermissionDetailApi(row.id);
    openDrawer("edit", detail);
  } catch (err) {
    ElMessage.error((err as Error)?.message || "获取详情失败");
  }
};

const handleView = async (row: BaseInfo.PermissionItem) => {
  try {
    const detail = await getBaseInfoPermissionDetailApi(row.id);
    openDrawer("view", detail);
  } catch (err) {
    ElMessage.error((err as Error)?.message || "获取详情失败");
  }
};

const handleRemove = async (row: BaseInfo.PermissionItem) => {
  try {
    await ElMessageBox.confirm(`确定删除 ${row.itemName || row.itemCode} 吗？`, "提示", { type: "warning" });
    await deleteBaseInfoPermissionApi(row.id);
    ElMessage.success("删除成功");
    await loadTable();
  } catch (err) {
    if ((err as any)?.code === "cancel") return;
    ElMessage.error((err as Error)?.message || "删除失败");
  }
};

const handleSubmit = async () => {
  try {
    const valid = await formRef.value?.validate().catch(() => false);
    if (!valid) return;
    saving.value = true;
    await saveBaseInfoPermissionApi({ ...formState });
    ElMessage.success(drawerMode.value === "create" ? "新增成功" : "保存成功");
    drawerVisible.value = false;
    await loadTable();
  } catch (err) {
    ElMessage.error((err as Error)?.message || "保存失败");
  } finally {
    saving.value = false;
  }
};

const loadRecycleTable = async () => {
  recycleLoading.value = true;
  try {
    const res = await getBaseInfoRecycleListApi({
      ...recycleQueryForm,
      pageNum: recyclePageState.pageNum,
      pageSize: recyclePageState.pageSize
    });
    recycleTableData.value = res.list;
    recyclePageState.total = res.total;
  } catch (err) {
    ElMessage.error((err as Error)?.message || "获取回收站失败");
  } finally {
    recycleLoading.value = false;
  }
};

const handleRecycleSearch = () => {
  recyclePageState.pageNum = 1;
  loadRecycleTable();
};

const handleRecyclePageChange = (page?: number, size?: number) => {
  if (page !== undefined) recyclePageState.pageNum = page;
  if (size !== undefined) recyclePageState.pageSize = size;
  loadRecycleTable();
};

const handleRecycleSelectionChange = (rows: BaseInfo.RecycleItem[]) => {
  selectedRecycleRows.value = rows;
};

const handleRestoreRecycle = async (row: BaseInfo.RecycleItem) => {
  try {
    await restoreBaseInfoRecycleApi(row.id);
    ElMessage.success("恢复成功");
    await loadRecycleTable();
  } catch (err) {
    ElMessage.error((err as Error)?.message || "恢复失败");
  }
};

const handleClearRecycle = async (row: BaseInfo.RecycleItem) => {
  try {
    await ElMessageBox.confirm(`确定彻底删除 ${row.fullName || row.username} 吗？`, "提示", { type: "warning" });
    await clearBaseInfoRecycleApi(row.id);
    ElMessage.success("彻底删除成功");
    await loadRecycleTable();
  } catch (err) {
    if ((err as any)?.code === "cancel") return;
    ElMessage.error((err as Error)?.message || "彻底删除失败");
  }
};

const batchClear = async () => {
  if (!selectedRecycleRows.value.length) return;
  try {
    await ElMessageBox.confirm(`确定彻底删除选中的 ${selectedRecycleRows.value.length} 个用户？`, "提示", { type: "warning" });
    await batchClearBaseInfoRecycleApi(selectedRecycleRows.value.map(row => row.id));
    selectedRecycleRows.value = [];
    ElMessage.success("批量彻底删除成功");
    await loadRecycleTable();
  } catch (err) {
    if ((err as any)?.code === "cancel") return;
    ElMessage.error((err as Error)?.message || "批量彻底删除失败");
  }
};

onMounted(() => {
  loadTable();
  loadRecycleTable();
});
</script>

<style scoped lang="scss">
.base-info-permissions {
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
