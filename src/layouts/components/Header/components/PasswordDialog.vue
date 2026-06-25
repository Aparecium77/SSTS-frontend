<template>
  <el-dialog v-model="dialogVisible" title="修改密码" width="500px" draggable>
    <div class="password-dialog">
      <p class="desc">修改当前登录账号密码。管理员密码至少 10 位，并包含大小写字母、数字和特殊字符。</p>
      <el-form ref="formRef" :model="formState" :rules="formRules" label-width="92px">
        <el-form-item label="旧密码" prop="oldPassword">
          <el-input v-model="formState.oldPassword" type="password" placeholder="请输入旧密码" show-password />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="formState.newPassword" type="password" placeholder="请输入新密码" show-password />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="formState.confirmPassword" type="password" placeholder="请再次输入新密码" show-password />
        </el-form-item>
      </el-form>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确认</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import { ElMessage, type FormInstance, type FormRules } from "element-plus";
import { changeBaseInfoProfilePasswordApi } from "@/api/modules/profile";
import type { Profile } from "@/api/interface/profile";
import { useUserStore } from "@/stores/modules/user";

const dialogVisible = ref(false);
const submitting = ref(false);
const formRef = ref<FormInstance>();
const userStore = useUserStore();

const formState = reactive<Profile.ChangePasswordParams>({
  oldPassword: "",
  newPassword: "",
  confirmPassword: ""
});

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

const formRules: FormRules<Profile.ChangePasswordParams> = {
  oldPassword: [{ required: true, message: "请输入旧密码", trigger: "blur" }],
  newPassword: [{ validator: validateNewPassword, trigger: "blur" }],
  confirmPassword: [
    { required: true, message: "请再次输入新密码", trigger: "blur" },
    {
      validator: (_rule, value, callback) => {
        if (value === formState.newPassword) {
          callback();
          return;
        }
        callback(new Error("两次输入的新密码不一致"));
      },
      trigger: "blur"
    }
  ]
};

const resetForm = () => {
  formState.oldPassword = "";
  formState.newPassword = "";
  formState.confirmPassword = "";
  formRef.value?.clearValidate();
};

const openDialog = () => {
  resetForm();
  dialogVisible.value = true;
};

const handleCancel = () => {
  dialogVisible.value = false;
  resetForm();
};

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  submitting.value = true;
  try {
    await changeBaseInfoProfilePasswordApi({ ...formState });
    ElMessage.success("密码修改成功");
    handleCancel();
  } catch (err) {
    ElMessage.error((err as Error)?.message || "修改密码失败");
  } finally {
    submitting.value = false;
  }
};

defineExpose({ openDialog });
</script>

<style scoped lang="scss">
.password-dialog {
  .desc {
    margin: 0 0 16px;
    font-size: 13px;
    line-height: 1.7;
    color: #667085;
  }
}
</style>
