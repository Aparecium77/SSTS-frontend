<template>
  <el-form ref="loginFormRef" :model="loginForm" :rules="loginRules" size="large">
    <el-form-item prop="username">
      <el-input v-model="loginForm.username" placeholder="请输入账号：student / teacher / academic_admin">
        <template #prefix>
          <el-icon class="el-input__icon">
            <User />
          </el-icon>
        </template>
      </el-input>
    </el-form-item>
    <el-form-item prop="password">
      <el-input
        v-model="loginForm.password"
        type="password"
        placeholder="请输入密码：123456"
        show-password
        autocomplete="new-password"
      >
        <template #prefix>
          <el-icon class="el-input__icon">
            <Lock />
          </el-icon>
        </template>
      </el-input>
    </el-form-item>
  </el-form>
  <div class="login-btn">
    <el-button :icon="CircleClose" round size="large" @click="handleResetClick">重置</el-button>
    <el-button :icon="UserFilled" round size="large" type="primary" :loading="loading" @click="handleLoginClick">
      登录
    </el-button>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import type { ElForm } from "element-plus";
import { ElNotification } from "element-plus";
import { CircleClose, Lock, User, UserFilled } from "@element-plus/icons-vue";
import { HOME_URL } from "@/config";
import type { Login } from "@/api/interface";
import { loginApi } from "@/api/modules/login";
import { initDynamicRouter } from "@/routers/modules/dynamicRouter";
import { useKeepAliveStore } from "@/stores/modules/keepAlive";
import { useTabsStore } from "@/stores/modules/tabs";
import { useUserStore } from "@/stores/modules/user";

const router = useRouter();
const userStore = useUserStore();
const tabsStore = useTabsStore();
const keepAliveStore = useKeepAliveStore();

type FormInstance = InstanceType<typeof ElForm>;

const loginFormRef = ref<FormInstance>();
const loading = ref(false);

const loginRules = reactive({
  username: [{ required: true, message: "请输入账号", trigger: "blur" }],
  password: [{ required: true, message: "请输入密码", trigger: "blur" }]
});

const loginForm = reactive<Login.ReqLoginForm>({
  username: "",
  password: ""
});

const login = (formEl: FormInstance | undefined) => {
  if (!formEl) return;

  formEl.validate(async valid => {
    if (!valid) return;

    loading.value = true;
    try {
      // Gateway 直接接收原密码，不需要 md5
      const res = await loginApi({ ...loginForm });
      // loginApi 已设置 userStore.token 和 userStore.userInfo
      const body = res.data || res;
      if (!userStore.token) {
        userStore.setToken(body.access_token);
        userStore.setUserInfo({ name: body.username || body.user_info?.name, role: body.role || body.user_info?.role });
      }

      await initDynamicRouter();

      tabsStore.setTabs([]);
      keepAliveStore.setKeepAliveName([]);

      router.push(HOME_URL);
      ElNotification({
        title: "登录成功",
        message: `欢迎进入 STSS，当前身份：${body.username || body.user_info?.name}`,
        type: "success",
        duration: 3000
      });
    } finally {
      loading.value = false;
    }
  });
};

const resetForm = (formEl: FormInstance | undefined) => {
  if (!formEl) return;
  formEl.resetFields();
};

const handleLoginClick = () => login(loginFormRef.value);
const handleResetClick = () => resetForm(loginFormRef.value);

onMounted(() => {
  document.onkeydown = (event: KeyboardEvent) => {
    if (event.code === "Enter" || event.code === "NumpadEnter") {
      if (loading.value) return;
      handleLoginClick();
    }
  };
});

onBeforeUnmount(() => {
  document.onkeydown = null;
});
</script>

<style scoped lang="scss">
@import "../index";
</style>
