<template>
  <div class="base-info-users">
    <el-card shadow="never" class="page-card">
      <div class="page-header">
        <div>
          <p class="eyebrow">基础信息管理</p>
          <h2>用户与档案</h2>
          <p class="description">维护用户、角色与档案信息，支持查询、新增、编辑、删除和头像上传。</p>
        </div>
        <el-space>
          <el-button :icon="RefreshRight" @click="handleReset">重置</el-button>
          <el-button type="primary" :icon="Plus" @click="handleCreate">新增用户</el-button>
        </el-space>
      </div>

      <el-form :inline="true" :model="queryForm" class="search-form">
        <el-form-item label="关键字">
          <el-input
            v-model="queryForm.keyword"
            clearable
            placeholder="账号、账号名、姓名、手机号、邮箱"
            @keyup.enter="handleSearch"
          />
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
        <el-table-column prop="userNo" label="用户编号" min-width="140" />
        <el-table-column prop="username" label="账号名" min-width="140" />
        <el-table-column prop="roleNames" label="角色" min-width="160">
          <template #default="scope">{{ scope.row.roleNames.join("、") || "-" }}</template>
        </el-table-column>
        <el-table-column prop="fullName" label="姓名" min-width="120" />
        <el-table-column prop="gender" label="性别" width="90" />
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

    <el-drawer
      v-model="drawerVisible"
      size="520px"
      destroy-on-close
      :title="drawerMode === 'create' ? '新增用户' : drawerMode === 'edit' ? '编辑用户' : '用户详情'"
    >
      <el-form ref="formRef" :model="formState" :rules="formRules" label-width="90px" :disabled="drawerMode === 'view'">
        <el-form-item label="用户编号" prop="userNo">
          <el-input v-model="formState.userNo" placeholder="请输入用户编号" />
        </el-form-item>
        <el-form-item label="账号名" prop="username">
          <el-input v-model="formState.username" placeholder="请输入账号名" />
        </el-form-item>
        <el-form-item label="姓名" prop="fullName">
          <el-input v-model="formState.fullName" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="角色" prop="roleIds">
          <el-select v-model="formState.roleIds" multiple collapse-tags collapse-tags-tooltip placeholder="请选择角色">
            <el-option v-for="item in roleOptions" :key="item.id" :label="item.label" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="性别" prop="gender">
          <el-select v-model="formState.gender" placeholder="请选择性别">
            <el-option v-for="item in genderOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="formState.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="formState.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="头像" prop="avatarFileId">
          <el-upload class="avatar-uploader" :show-file-list="false" :before-upload="handleBeforeUpload">
            <template #default>
              <el-button size="small">上传头像</el-button>
            </template>
          </el-upload>
          <div v-if="previewUrl" style="margin-top: 8px">
            <div @click="openPreview" style="display: inline-block; cursor: pointer">
              <el-image style="width: 64px; height: 64px; border-radius: 6px" :src="previewUrl" fit="cover" />
            </div>
            <el-button type="text" @click="removeAvatar">移除</el-button>
          </div>
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
  <el-dialog v-model="previewDialogVisible" width="50%" :show-close="true">
    <img :src="previewUrl" style="width: 100%" />
  </el-dialog>
</template>

<script setup lang="ts" name="baseInfoUsers">
import { onMounted, reactive, ref } from "vue";
import { Delete, EditPen, Plus, RefreshRight, Search, View } from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from "element-plus";
import {
  deleteBaseInfoUserApi,
  BASE_INFO_ROLE_OPTIONS,
  getBaseInfoFileDownloadUrl,
  getBaseInfoUserDetailWithRolesApi,
  getBaseInfoUserListApi,
  normalizeBaseInfoRoleIds,
  parseBaseInfoRoleIds,
  parseBaseInfoRoleIdsFromNames,
  saveBaseInfoUserApi,
  uploadBaseInfoFileApi
} from "@/api/modules/baseInfo";
import type { BaseInfo } from "@/api/interface/baseInfo";

type DrawerMode = "create" | "edit" | "view";
type UserFormSource = Partial<
  Omit<BaseInfo.UserForm, "roleIds"> & Omit<BaseInfo.UserItem, "roleIds"> & { roleIds?: number[] | string }
>;

const genderOptions = [
  { label: "男", value: "男" },
  { label: "女", value: "女" }
];
const roleOptions = BASE_INFO_ROLE_OPTIONS;

const queryForm = reactive<BaseInfo.UserQuery>({
  pageNum: 1,
  pageSize: 5,
  keyword: "",
  status: ""
});

const pageState = reactive({
  pageNum: 1,
  pageSize: 5,
  total: 0
});

const loading = ref(false);
const saving = ref(false);
const tableData = ref<BaseInfo.UserItem[]>([]);
const drawerVisible = ref(false);
const drawerMode = ref<DrawerMode>("create");
const formRef = ref<FormInstance>();
const originalRoleIds = ref<number[]>([]);

const emptyForm = (): BaseInfo.UserForm => ({
  userNo: "",
  username: "",
  roleIds: [],
  fullName: "",
  gender: "男",
  phone: "",
  email: "",
  status: "ACTIVE",
  avatarFileId: ""
});

const formState = reactive<BaseInfo.UserForm>(emptyForm());

const formRules: FormRules<BaseInfo.UserForm> = {
  userNo: [{ required: true, message: "请输入用户编号", trigger: "blur" }],
  username: [
    { required: true, message: "请输入账号名", trigger: "blur" },
    { min: 2, max: 30, message: "账号名长度为 2 到 30 个字符", trigger: "blur" }
  ],
  fullName: [
    { required: true, message: "请输入姓名", trigger: "blur" },
    { min: 2, max: 20, message: "姓名长度为 2 到 20 个字符", trigger: "blur" }
  ],
  roleIds: [{ type: "array", required: true, min: 1, message: "请选择角色", trigger: "change" }],
  gender: [{ required: true, message: "请选择性别", trigger: "change" }],
  phone: [
    { required: true, message: "请输入手机号", trigger: "blur" },
    { pattern: /^1[3-9]\d{9}$/, message: "请输入正确的手机号", trigger: "blur" }
  ],
  email: [
    { required: true, message: "请输入邮箱", trigger: "blur" },
    { type: "email", message: "请输入正确的邮箱地址", trigger: "blur" }
  ],
  status: [{ required: true, message: "请选择状态", trigger: "change" }],
  avatarFileId: []
};

const isSameRoleIds = (left: number[], right: number[]) => {
  const normalizedLeft = normalizeBaseInfoRoleIds(left).sort((a, b) => a - b);
  const normalizedRight = normalizeBaseInfoRoleIds(right).sort((a, b) => a - b);
  return normalizedLeft.length === normalizedRight.length && normalizedLeft.every((id, index) => id === normalizedRight[index]);
};

const patchForm = (data: UserFormSource) => {
  const roleIds = normalizeBaseInfoRoleIds(
    Array.isArray(data.roleIds)
      ? data.roleIds
      : parseBaseInfoRoleIds(data.roleIds ?? "").concat(parseBaseInfoRoleIdsFromNames(data.roleNames ?? []))
  );
  Object.assign(formState, emptyForm(), data, {
    roleIds
  });
  originalRoleIds.value = [...roleIds];
  previewUrl.value = data.avatarFileId ? getBaseInfoFileDownloadUrl(data.avatarFileId) : "";
};

const previewUrl = ref<string>("");
const previewDialogVisible = ref(false);

const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("头像本地预览生成失败"));
    reader.readAsDataURL(file);
  });

const handleBeforeUpload = async (file: File) => {
  // 校验格式与大小
  const isImage = /^(image\/png|image\/jpe?g)$/.test(file.type);
  if (!isImage) {
    ElMessage.error("仅支持 PNG/JPG/JPEG 格式的图片");
    return false;
  }
  const isLt2M = file.size / 1024 / 1024 < 2;
  if (!isLt2M) {
    ElMessage.error("图片大小不能超过 2MB");
    return false;
  }

  try {
    previewUrl.value = await fileToDataUrl(file);
    const res = await uploadBaseInfoFileApi(file);
    formState.avatarFileId = res.id;
  } catch (err) {
    ElMessage.error((err as any)?.message || "上传失败");
  }
  // 阻止 el-upload 默认行为，上传已由基础信息文件接口完成。
  return false;
};

const removeAvatar = () => {
  formState.avatarFileId = "";
  previewUrl.value = "";
  previewDialogVisible.value = false;
};

const openPreview = () => {
  if (previewUrl.value) previewDialogVisible.value = true;
};

const closeDrawer = () => {
  drawerVisible.value = false;
  previewDialogVisible.value = false;
};

const loadTable = async () => {
  loading.value = true;
  try {
    const res = await getBaseInfoUserListApi({ ...queryForm, pageNum: pageState.pageNum, pageSize: pageState.pageSize });
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
  pageState.pageSize = 5;
  loadTable();
};

const handlePageChange = (page?: number, size?: number) => {
  if (page !== undefined) pageState.pageNum = page;
  if (size !== undefined) pageState.pageSize = size;
  loadTable();
};

const openDrawer = (mode: DrawerMode, data?: Partial<BaseInfo.UserForm>) => {
  drawerMode.value = mode;
  drawerVisible.value = true;
  previewDialogVisible.value = false;
  if (!data) {
    patchForm({});
    return;
  }
  patchForm({ ...data });
};

const handleCreate = () => openDrawer("create");

const handleEdit = async (row: BaseInfo.UserItem) => {
  try {
    const detail = await getBaseInfoUserDetailWithRolesApi(row);
    openDrawer("edit", detail);
  } catch (err) {
    ElMessage.error((err as any)?.message || "获取详情失败");
  }
};

const handleView = async (row: BaseInfo.UserItem) => {
  try {
    const detail = await getBaseInfoUserDetailWithRolesApi(row);
    openDrawer("view", detail);
  } catch (err) {
    ElMessage.error((err as any)?.message || "获取详情失败");
  }
};

const handleRemove = async (row: BaseInfo.UserItem) => {
  try {
    await ElMessageBox.confirm(`确定删除 ${row.fullName} 吗？`, "提示", { type: "warning" });
    await deleteBaseInfoUserApi(row.id);
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
    const roleIds = normalizeBaseInfoRoleIds(formState.roleIds);
    const syncRoleIds = drawerMode.value === "create" || !isSameRoleIds(roleIds, originalRoleIds.value);
    await saveBaseInfoUserApi({ ...formState, roleIds, syncRoleIds });
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
.base-info-users {
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
