<template>
  <div class="base-info-teacher">
    <el-card shadow="never" class="page-card">
      <div class="page-header">
        <div>
          <p class="eyebrow">基础信息管理组</p>
          <h2>教师资源</h2>
          <p class="description">维护教师基础数据：工号、姓名、院系、职称、联系方式、头像与状态。</p>
        </div>
        <el-space>
          <el-button :icon="RefreshRight" @click="handleReset">重置</el-button>
          <el-button type="primary" :icon="Plus" @click="handleCreate">新增教师</el-button>
        </el-space>
      </div>

      <el-form :inline="true" :model="queryForm" class="search-form">
        <el-form-item label="关键字">
          <el-input v-model="queryForm.keyword" clearable placeholder="工号、姓名、手机号、邮箱" @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryForm.status" clearable placeholder="请选择状态">
            <el-option label="启用" value="ACTIVE" />
            <el-option label="停用" value="DISABLED" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
        </el-form-item>
      </el-form>

      <el-table v-loading="loading" :data="tableData" border stripe>
        <el-table-column prop="teacherNo" label="用户编号" min-width="140" />
        <el-table-column prop="username" label="登录账号" min-width="140" />
        <el-table-column prop="roleNames" label="角色" min-width="160">
          <template #default="scope">{{ scope.row.roleNames.join("、") || "-" }}</template>
        </el-table-column>
        <el-table-column prop="fullName" label="姓名" min-width="140" />
        <el-table-column prop="phone" label="手机号" min-width="140" />
        <el-table-column prop="email" label="邮箱" min-width="200" />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'ACTIVE' ? 'success' : 'info'">{{
              scope.row.status === "ACTIVE" ? "启用" : "停用"
            }}</el-tag>
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
        <el-form-item label="用户编号" prop="teacherNo">
          <el-input v-model="formState.teacherNo" placeholder="请输入用户编号" />
        </el-form-item>
        <el-form-item label="登录账号" prop="username">
          <el-input v-model="formState.username" placeholder="请输入登录账号" />
        </el-form-item>
        <el-form-item label="姓名" prop="fullName">
          <el-input v-model="formState.fullName" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="性别" prop="gender">
          <el-select v-model="formState.gender" placeholder="请选择性别">
            <el-option label="男" value="男" />
            <el-option label="女" value="女" />
          </el-select>
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="formState.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="formState.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="formState.status">
            <el-radio label="ACTIVE">启用</el-radio>
            <el-radio label="DISABLED">停用</el-radio>
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

<script setup lang="ts" name="baseInfoTeacher">
import { onMounted, reactive, ref } from "vue";
import { Delete, EditPen, Plus, RefreshRight, Search, View } from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from "element-plus";
import {
  deleteBaseInfoTeacherApi,
  getBaseInfoTeacherDetailWithRolesApi,
  getBaseInfoTeacherListApi,
  parseBaseInfoRoleIds,
  parseBaseInfoRoleIdsFromNames,
  saveBaseInfoTeacherApi
} from "@/api/modules/baseInfo";
import type { BaseInfo } from "@/api/interface/baseInfo";

type DrawerMode = "create" | "edit" | "view";
type TeacherFormSource = Partial<
  Omit<BaseInfo.TeacherForm, "roleIds"> & Omit<BaseInfo.TeacherItem, "roleIds"> & { roleIds?: number[] | string }
>;

const queryForm = reactive<BaseInfo.TeacherQuery>({
  pageNum: 1,
  pageSize: 10,
  keyword: "",
  status: ""
} as BaseInfo.TeacherQuery);

const pageState = reactive({ pageNum: 1, pageSize: 10, total: 0 });

const loading = ref(false);
const saving = ref(false);
const tableData = ref<BaseInfo.TeacherItem[]>([]);
const drawerVisible = ref(false);
const drawerMode = ref<DrawerMode>("create");
const formRef = ref<FormInstance>();

const emptyForm = (): BaseInfo.TeacherForm => ({
  teacherNo: "",
  username: "",
  fullName: "",
  gender: "",
  phone: "",
  email: "",
  status: "ACTIVE",
  roleIds: [2]
});

const formState = reactive<BaseInfo.TeacherForm>(emptyForm());

const formRules: FormRules<BaseInfo.TeacherForm> = {
  teacherNo: [{ required: true, message: "请输入用户编号", trigger: "blur" }],
  username: [{ required: true, message: "请输入登录账号", trigger: "blur" }],
  fullName: [{ required: true, message: "请输入姓名", trigger: "blur" }],
  phone: [
    { required: true, message: "请输入手机号", trigger: "blur" },
    { pattern: /^1[3-9]\d{9}$/, message: "请输入正确的手机号", trigger: "blur" }
  ],
  email: [
    { required: true, message: "请输入邮箱", trigger: "blur" },
    { type: "email", message: "请输入正确的邮箱地址", trigger: "blur" }
  ],
  status: [{ required: true, message: "请选择状态", trigger: "change" }]
};

const patchForm = (data: TeacherFormSource) => {
  const roleIds = Array.isArray(data.roleIds)
    ? data.roleIds
    : parseBaseInfoRoleIds(data.roleIds ?? "").concat(parseBaseInfoRoleIdsFromNames(data.roleNames ?? []));
  Object.assign(formState, emptyForm(), data, {
    teacherNo: data.teacherNo || data.userNo || "",
    roleIds: Array.from(new Set(roleIds.length ? roleIds : [2]))
  });
};

const loadTable = async () => {
  loading.value = true;
  try {
    const res = await getBaseInfoTeacherListApi({ ...queryForm, pageNum: pageState.pageNum, pageSize: pageState.pageSize });
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
  queryForm.status = "";
  pageState.pageNum = 1;
  pageState.pageSize = 10;
  loadTable();
};

const handlePageChange = (page?: number, size?: number) => {
  if (page !== undefined) pageState.pageNum = page;
  if (size !== undefined) pageState.pageSize = size;
  loadTable();
};

const openDrawer = (mode: DrawerMode, data?: Partial<BaseInfo.TeacherForm>) => {
  drawerMode.value = mode;
  drawerVisible.value = true;
  if (!data) {
    patchForm({});
    return;
  }
  patchForm({ ...data });
};

const handleCreate = () => openDrawer("create");

const handleEdit = async (row: BaseInfo.TeacherItem) => {
  try {
    const detail = await getBaseInfoTeacherDetailWithRolesApi(row);
    openDrawer("edit", detail);
  } catch (err) {
    ElMessage.error((err as any)?.message || "获取详情失败");
  }
};

const handleView = async (row: BaseInfo.TeacherItem) => {
  try {
    const detail = await getBaseInfoTeacherDetailWithRolesApi(row);
    openDrawer("view", detail);
  } catch (err) {
    ElMessage.error((err as any)?.message || "获取详情失败");
  }
};

const handleRemove = async (row: BaseInfo.TeacherItem) => {
  try {
    await ElMessageBox.confirm(`确定删除 ${row.fullName} 吗？`, "提示", { type: "warning" });
    await deleteBaseInfoTeacherApi(row.id);
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
    await saveBaseInfoTeacherApi({ ...formState });
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
.base-info-teacher {
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
