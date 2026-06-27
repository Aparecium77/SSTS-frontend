<template>
  <div class="account-profile">
    <el-card shadow="never" class="page-card overview-card">
      <div class="overview-header">
        <div class="avatar-wrap">
          <el-avatar :size="96" :src="avatarUrl || undefined" @error="handleAvatarError">
            {{ profileForm.fullName.slice(0, 1) || profileDetail.username.slice(0, 1) }}
          </el-avatar>
          <el-upload :show-file-list="false" :before-upload="handleAvatarUpload" accept="image/*">
            <el-button class="avatar-action" :icon="EditPen">上传头像</el-button>
          </el-upload>
        </div>
        <div class="profile-summary">
          <p class="eyebrow">账号中心</p>
          <h2>{{ profileForm.fullName || profileDetail.username || "个人中心" }}</h2>
          <p class="description">维护当前账号的个人档案、联系方式和登录密码。</p>
          <el-space wrap class="summary-tags">
            <el-tag type="success">{{ profileDetail.roleName || "未分配角色" }}</el-tag>
            <el-tag>{{ profileDetail.userNo || "无用户编号" }}</el-tag>
            <el-tag :type="profileForm.status === 'ACTIVE' ? 'success' : 'info'">
              {{ profileForm.status === "ACTIVE" ? "启用" : "停用" }}
            </el-tag>
          </el-space>
        </div>
      </div>

      <div class="stat-grid">
        <div class="stat-card">
          <span class="stat-label">登录账号</span>
          <strong>{{ profileDetail.username || "-" }}</strong>
          <small>用户 ID：{{ profileDetail.id || profileDetail.userId || "-" }}</small>
        </div>
        <div class="stat-card">
          <span class="stat-label">联系方式</span>
          <strong>{{ profileForm.phone || "-" }}</strong>
          <small>{{ profileForm.email || "-" }}</small>
        </div>
        <div class="stat-card">
          <span class="stat-label">更新时间</span>
          <strong>{{ profileDetail.updatedAt || "-" }}</strong>
          <small>创建时间：{{ profileDetail.createdAt || "-" }}</small>
        </div>
      </div>
    </el-card>

    <el-row :gutter="20" class="content-grid">
      <el-col :xs="24" :lg="14">
        <el-card shadow="never" class="page-card">
          <template #header>
            <div class="card-header">
              <div>
                <h3>个人资料</h3>
                <p>维护姓名、联系方式和账号状态。</p>
              </div>
              <el-button type="primary" :loading="savingProfile" @click="handleSaveProfile">保存资料</el-button>
            </div>
          </template>

          <el-form ref="profileFormRef" :model="profileForm" :rules="profileRules" label-width="100px">
            <el-form-item label="姓名" prop="fullName">
              <el-input v-model="profileForm.fullName" placeholder="请输入姓名" />
            </el-form-item>
            <el-form-item label="性别" prop="gender">
              <el-select v-model="profileForm.gender" clearable placeholder="请选择性别">
                <el-option label="男" value="男" />
                <el-option label="女" value="女" />
              </el-select>
            </el-form-item>
            <el-form-item label="手机号" prop="phone">
              <el-input v-model="profileForm.phone" placeholder="请输入手机号" />
            </el-form-item>
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="profileForm.email" placeholder="请输入邮箱" />
            </el-form-item>
            <el-form-item label="状态" prop="status">
              <el-radio-group v-model="profileForm.status">
                <el-radio label="ACTIVE">启用</el-radio>
                <el-radio label="DISABLED">停用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <el-col :xs="24" :lg="10">
        <el-card shadow="never" class="page-card">
          <template #header>
            <div class="card-header">
              <div>
                <h3>安全设置</h3>
                <p>修改当前登录账号的密码。</p>
              </div>
            </div>
          </template>

          <el-form ref="securityFormRef" :model="securityForm" :rules="securityRules" label-width="100px">
            <el-form-item label="原密码" prop="oldPassword">
              <el-input v-model="securityForm.oldPassword" type="password" show-password placeholder="请输入原密码" />
            </el-form-item>
            <el-form-item label="新密码" prop="newPassword">
              <el-input
                v-model="securityForm.newPassword"
                type="password"
                show-password
                placeholder="管理员至少 10 位；普通用户至少 8 位"
              />
            </el-form-item>
            <el-form-item label="确认密码" prop="confirmPassword">
              <el-input v-model="securityForm.confirmPassword" type="password" show-password placeholder="再次输入新密码" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="savingPassword" @click="handleChangePassword">修改密码</el-button>
            </el-form-item>
          </el-form>

          <el-divider />

          <div class="security-panel">
            <div class="security-item">
              <span>角色</span>
              <strong>{{ profileDetail.roleNames.join("、") || "-" }}</strong>
            </div>
            <div class="security-item">
              <span>用户编号</span>
              <strong>{{ profileDetail.userNo || "-" }}</strong>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts" name="baseInfoProfile">
import { computed, onMounted, reactive, ref } from "vue";
import { EditPen } from "@element-plus/icons-vue";
import { ElMessage, type FormInstance, type FormRules } from "element-plus";
import { useUserStore } from "@/stores/modules/user";
import {
  changeBaseInfoProfilePasswordApi,
  getBaseInfoProfileDetailApi,
  saveBaseInfoProfileApi,
  uploadBaseInfoProfileAvatarApi
} from "@/api/modules/profile";
import type { Profile } from "@/api/interface/profile";
import { removeLocalProfileAvatar, saveLocalProfileAvatar } from "@/utils/profileAvatar";

const profileFormRef = ref<FormInstance>();
const securityFormRef = ref<FormInstance>();
const savingProfile = ref(false);
const savingPassword = ref(false);
const avatarLoadFailed = ref(false);
const userStore = useUserStore();

const emptyProfileDetail = (): Profile.ProfileDetail => ({
  id: "",
  userId: "",
  userNo: "",
  username: "",
  fullName: "",
  gender: "",
  email: "",
  phone: "",
  status: "ACTIVE",
  avatarFileId: "",
  avatarUrl: "",
  roleNames: [],
  roleName: "",
  createdAt: "",
  updatedAt: ""
});

const profileDetail = reactive<Profile.ProfileDetail>(emptyProfileDetail());

const profileForm = reactive<Profile.UpdateProfileParams>({
  id: "",
  fullName: "",
  gender: "",
  phone: "",
  email: "",
  status: "ACTIVE",
  avatarFileId: "",
  avatarUrl: ""
});

const securityForm = reactive<Profile.ChangePasswordParams>({
  oldPassword: "",
  newPassword: "",
  confirmPassword: ""
});

const avatarUrl = computed(() => (avatarLoadFailed.value ? "" : profileForm.avatarUrl || profileDetail.avatarUrl || ""));

const profileRules: FormRules<Profile.UpdateProfileParams> = {
  fullName: [{ required: true, message: "请输入姓名", trigger: "blur" }],
  phone: [{ required: true, message: "请输入手机号", trigger: "blur" }],
  email: [
    { required: true, message: "请输入邮箱", trigger: "blur" },
    { type: "email", message: "请输入正确的邮箱地址", trigger: "blur" }
  ],
  status: [{ required: true, message: "请选择状态", trigger: "change" }]
};

const validateNewPassword = (_rule: unknown, value: string, callback: (error?: Error) => void) => {
  const isAdmin = userStore.userInfo.role === "academic_admin";
  if (!value) {
    callback(new Error("请输入新密码"));
    return;
  }
  if (isAdmin) {
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{10,}$/.test(value)) {
      callback(new Error("管理员密码至少 10 位，并包含大小写字母、数字和特殊字符"));
      return;
    }
  } else if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(value)) {
    callback(new Error("密码至少 8 位，并包含字母和数字"));
    return;
  }
  callback();
};

const securityRules: FormRules<Profile.ChangePasswordParams> = {
  oldPassword: [{ required: true, message: "请输入原密码", trigger: "blur" }],
  newPassword: [{ validator: validateNewPassword, trigger: "blur" }],
  confirmPassword: [
    { required: true, message: "请再次输入新密码", trigger: "blur" },
    {
      validator: (_rule, value, callback) => {
        if (!value || value === securityForm.newPassword) {
          callback();
          return;
        }
        callback(new Error("两次输入的新密码不一致"));
      },
      trigger: "blur"
    }
  ]
};

const patchProfileForm = (data: Profile.ProfileDetail) => {
  Object.assign(profileDetail, emptyProfileDetail(), data);
  avatarLoadFailed.value = false;
  profileForm.id = data.id;
  profileForm.fullName = data.fullName;
  profileForm.gender = data.gender;
  profileForm.phone = data.phone;
  profileForm.email = data.email;
  profileForm.status = data.status;
  profileForm.avatarFileId = data.avatarFileId;
  profileForm.avatarUrl = data.avatarUrl;
};

const loadProfile = async () => {
  const detail = await getBaseInfoProfileDetailApi();
  patchProfileForm(detail);
};

const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("头像本地预览生成失败"));
    reader.readAsDataURL(file);
  });

const avatarIdentity = () => ({ userId: profileDetail.id || profileForm.id, username: profileDetail.username });

const handleAvatarError = () => {
  avatarLoadFailed.value = true;
  profileForm.avatarUrl = "";
  removeLocalProfileAvatar(avatarIdentity());
  return false;
};

const handleAvatarUpload = async (file: File) => {
  const isImage = /^(image\/png|image\/jpe?g)$/.test(file.type);
  if (!isImage) {
    ElMessage.error("仅支持 PNG/JPG/JPEG 格式的图片");
    return false;
  }
  try {
    const localUrl = await fileToDataUrl(file);
    avatarLoadFailed.value = false;
    profileForm.avatarUrl = localUrl;
    saveLocalProfileAvatar(avatarIdentity(), { fileId: profileForm.avatarFileId || `local-${Date.now()}`, url: localUrl });

    const res = await uploadBaseInfoProfileAvatarApi(file);
    profileForm.avatarFileId = res.id;
    saveLocalProfileAvatar(avatarIdentity(), { fileId: res.id, url: localUrl });
    ElMessage.success("头像已保存为本地展示副本，文件已上传");
  } catch (err) {
    ElMessage.warning((err as Error)?.message || "头像已本地预览，但服务器上传失败");
  }
  return false;
};

const handleSaveProfile = async () => {
  const valid = await profileFormRef.value?.validate().catch(() => false);
  if (!valid) return;
  savingProfile.value = true;
  try {
    const detail = await saveBaseInfoProfileApi({ ...profileForm });
    patchProfileForm({
      ...detail,
      avatarFileId: profileForm.avatarFileId || detail.avatarFileId,
      avatarUrl: profileForm.avatarUrl || detail.avatarUrl
    });
    if (profileForm.avatarFileId && profileForm.avatarUrl) {
      saveLocalProfileAvatar(
        { userId: detail.id || profileForm.id, username: detail.username || profileDetail.username },
        { fileId: profileForm.avatarFileId, url: profileForm.avatarUrl }
      );
    }
    ElMessage.success("个人资料保存成功");
  } catch (err) {
    ElMessage.error((err as Error)?.message || "保存失败");
  } finally {
    savingProfile.value = false;
  }
};

const handleChangePassword = async () => {
  const valid = await securityFormRef.value?.validate().catch(() => false);
  if (!valid) return;
  savingPassword.value = true;
  try {
    await changeBaseInfoProfilePasswordApi({ ...securityForm });
    securityForm.oldPassword = "";
    securityForm.newPassword = "";
    securityForm.confirmPassword = "";
    ElMessage.success("密码修改成功");
  } catch (err) {
    ElMessage.error((err as Error)?.message || "修改密码失败");
  } finally {
    savingPassword.value = false;
  }
};

onMounted(() => {
  loadProfile();
});
</script>

<style scoped lang="scss">
.account-profile {
  padding: 20px;
}
.page-card {
  border-radius: 16px;
}
.overview-card {
  margin-bottom: 20px;
}
.overview-header {
  display: flex;
  gap: 24px;
  align-items: center;
}
.avatar-wrap {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
}
.profile-summary {
  flex: 1;
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
  font-size: 30px;
  color: #1f2a44;
}
.description {
  margin: 0 0 12px;
  line-height: 1.75;
  color: #5b667b;
}
.avatar-action {
  width: 100%;
}
.stat-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-top: 20px;
}
.stat-card {
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f8fafc;

  strong,
  small,
  span {
    display: block;
  }

  strong {
    margin: 8px 0 4px;
    color: #1f2a44;
  }

  small {
    color: #667085;
  }
}
.stat-label {
  font-size: 12px;
  color: #667085;
}
.content-grid {
  row-gap: 20px;
}
.card-header {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  justify-content: space-between;

  h3 {
    margin: 0 0 6px;
    font-size: 18px;
    color: #1f2a44;
  }

  p {
    margin: 0;
    color: #667085;
  }
}
.security-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.security-item {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 0;
  border-bottom: 1px solid #eef2f7;

  span {
    color: #667085;
  }

  strong {
    max-width: 260px;
    overflow-wrap: anywhere;
    color: #1f2a44;
    text-align: right;
  }
}

@media (width <= 992px) {
  .overview-header,
  .card-header {
    flex-direction: column;
  }

  .stat-grid {
    grid-template-columns: 1fr;
  }
}
</style>
