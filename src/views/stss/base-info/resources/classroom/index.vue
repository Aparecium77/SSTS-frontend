<template>
  <div class="base-info-classroom">
    <el-card shadow="never" class="page-card">
      <div class="page-header">
        <div>
          <p class="eyebrow">基础信息管理</p>
          <h2>教室资源</h2>
          <p class="description">维护教室基础数据：教室编号、楼栋、容量和教室类型。</p>
        </div>
        <el-space>
          <el-button :icon="RefreshRight" @click="handleReset">重置</el-button>
          <el-button type="primary" :icon="Plus" @click="handleCreate">新增教室</el-button>
        </el-space>
      </div>

      <el-form :inline="true" :model="queryForm" class="search-form">
        <el-form-item label="关键字">
          <el-input v-model="queryForm.keyword" clearable placeholder="教室编号、楼栋、类型" @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="楼栋">
          <el-input v-model="queryForm.building" clearable placeholder="请输入楼栋" @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="类型">
          <el-input v-model="queryForm.classroomType" clearable placeholder="请输入教室类型" @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
        </el-form-item>
      </el-form>

      <el-table v-loading="loading" :data="tableData" border stripe>
        <el-table-column prop="classroomNo" label="教室编号" min-width="140" />
        <el-table-column prop="building" label="楼栋" min-width="120" />
        <el-table-column prop="capacity" label="容量" width="100" />
        <el-table-column prop="roomType" label="教室类型" min-width="140" />
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
        <el-form-item label="教室编号" prop="classroomNo">
          <el-input v-model="formState.classroomNo" placeholder="请输入教室编号" />
        </el-form-item>
        <el-form-item label="楼栋" prop="building">
          <el-input v-model="formState.building" placeholder="请输入楼栋，如 博学楼" />
        </el-form-item>
        <el-form-item label="容量" prop="capacity">
          <el-input-number v-model="formState.capacity" :min="1" />
        </el-form-item>
        <el-form-item label="教室类型" prop="roomType">
          <el-input v-model="formState.roomType" placeholder="请输入教室类型，如 standard / lab" />
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

<script setup lang="ts" name="baseInfoClassroom">
import { computed, onMounted, reactive, ref } from "vue";
import { Delete, EditPen, Plus, RefreshRight, Search, View } from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from "element-plus";
import {
  deleteBaseInfoClassroomApi,
  getBaseInfoClassroomDetailApi,
  getBaseInfoClassroomListApi,
  saveBaseInfoClassroomApi
} from "@/api/modules/baseInfo";
import type { BaseInfo } from "@/api/interface/baseInfo";

type DrawerMode = "create" | "edit" | "view";

const queryForm = reactive<BaseInfo.ClassroomQuery>({
  pageNum: 1,
  pageSize: 5,
  keyword: "",
  building: "",
  classroomType: ""
});

const pageState = reactive({ pageNum: 1, pageSize: 10, total: 0 });

const loading = ref(false);
const saving = ref(false);
const tableData = ref<BaseInfo.ClassroomItem[]>([]);
const drawerVisible = ref(false);
const drawerMode = ref<DrawerMode>("create");
const formRef = ref<FormInstance>();

const emptyForm = (): BaseInfo.ClassroomForm => ({
  id: undefined,
  classroomNo: "",
  building: "",
  capacity: 1,
  roomType: ""
});

const formState = reactive<BaseInfo.ClassroomForm>(emptyForm());

const formRules: FormRules<BaseInfo.ClassroomForm> = {
  classroomNo: [{ required: true, message: "请输入教室编号", trigger: "blur" }],
  building: [{ required: true, message: "请输入楼栋", trigger: "blur" }],
  capacity: [{ required: true, message: "请输入容量", trigger: "change" }],
  roomType: [{ required: true, message: "请输入教室类型", trigger: "blur" }]
};

const patchForm = (data: Partial<BaseInfo.ClassroomForm>) => {
  Object.assign(formState, emptyForm(), data);
};

const drawerTitle = computed(() => {
  if (drawerMode.value === "create") return "新增教室";
  if (drawerMode.value === "edit") return "编辑教室";
  return "教室详情";
});

const closeDrawer = () => {
  drawerVisible.value = false;
};

const loadTable = async () => {
  loading.value = true;
  try {
    const res = await getBaseInfoClassroomListApi({ ...queryForm, pageNum: pageState.pageNum, pageSize: pageState.pageSize });
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
  queryForm.building = "";
  queryForm.classroomType = "";
  pageState.pageNum = 1;
  pageState.pageSize = 10;
  loadTable();
};

const handlePageChange = (page?: number, size?: number) => {
  if (page !== undefined) pageState.pageNum = page;
  if (size !== undefined) pageState.pageSize = size;
  loadTable();
};

const openDrawer = (mode: DrawerMode, data?: Partial<BaseInfo.ClassroomForm>) => {
  drawerMode.value = mode;
  drawerVisible.value = true;
  if (!data) {
    patchForm({});
    return;
  }
  patchForm({ ...data });
};

const handleCreate = () => openDrawer("create");

const handleEdit = async (row: BaseInfo.ClassroomItem) => {
  try {
    const detail = await getBaseInfoClassroomDetailApi(row.id);
    openDrawer("edit", detail);
  } catch (err) {
    ElMessage.error((err as any)?.message || "获取详情失败");
  }
};

const handleView = async (row: BaseInfo.ClassroomItem) => {
  try {
    const detail = await getBaseInfoClassroomDetailApi(row.id);
    openDrawer("view", detail);
  } catch (err) {
    ElMessage.error((err as any)?.message || "获取详情失败");
  }
};

const handleRemove = async (row: BaseInfo.ClassroomItem) => {
  try {
    await ElMessageBox.confirm(`确定删除 ${row.classroomNo} 吗？`, "提示", { type: "warning" });
    await deleteBaseInfoClassroomApi(row.id);
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
    await saveBaseInfoClassroomApi({ ...formState });
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
.base-info-classroom {
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
