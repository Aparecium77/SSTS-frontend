<template>
  <el-dropdown trigger="click">
    <div class="avatar">
      <img :src="avatarSrc" alt="avatar" @error="handleAvatarError" />
    </div>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item @click="openDialog('infoRef')">
          <el-icon><User /></el-icon>{{ $t("header.personalData") }}
        </el-dropdown-item>
        <el-dropdown-item @click="openDialog('passwordRef')">
          <el-icon><Edit /></el-icon>{{ $t("header.changePassword") }}
        </el-dropdown-item>
        <el-dropdown-item divided @click="logout">
          <el-icon><SwitchButton /></el-icon>{{ $t("header.logout") }}
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
  <!-- infoDialog -->
  <InfoDialog ref="infoRef"></InfoDialog>
  <!-- passwordDialog -->
  <PasswordDialog ref="passwordRef"></PasswordDialog>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { LOGIN_URL } from "@/config";
import { useRouter } from "vue-router";
import { logoutApi } from "@/api/modules/login";
import { useUserStore } from "@/stores/modules/user";
import { ElMessageBox, ElMessage } from "element-plus";
import InfoDialog from "./InfoDialog.vue";
import PasswordDialog from "./PasswordDialog.vue";
import defaultAvatar from "@/assets/images/avatar.gif";
import { getLocalProfileAvatar, PROFILE_AVATAR_CHANGED_EVENT, removeLocalProfileAvatar } from "@/utils/profileAvatar";

const router = useRouter();
const userStore = useUserStore();
const localAvatarUrl = ref("");
const avatarLoadFailed = ref(false);

const avatarIdentity = computed(() => ({
  userId: userStore.userId,
  username: userStore.userInfo.name
}));

const refreshLocalAvatar = () => {
  avatarLoadFailed.value = false;
  localAvatarUrl.value = getLocalProfileAvatar(avatarIdentity.value)?.url || "";
};

const avatarSrc = computed(() => (avatarLoadFailed.value ? defaultAvatar : localAvatarUrl.value || defaultAvatar));

const handleAvatarError = (event: Event) => {
  if (!localAvatarUrl.value) return;
  avatarLoadFailed.value = true;
  localAvatarUrl.value = "";
  removeLocalProfileAvatar(avatarIdentity.value);
  (event.target as HTMLImageElement).src = defaultAvatar;
};

const logout = () => {
  ElMessageBox.confirm("您是否确认退出登录？", "温馨提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(async () => {
    await logoutApi();
    userStore.resetUserState();
    router.replace(LOGIN_URL);
    ElMessage.success("退出登录成功！");
  });
};

const infoRef = ref<InstanceType<typeof InfoDialog> | null>(null);
const passwordRef = ref<InstanceType<typeof PasswordDialog> | null>(null);
const openDialog = (ref: string) => {
  if (ref == "infoRef") infoRef.value?.openDialog();
  if (ref == "passwordRef") passwordRef.value?.openDialog();
};

onMounted(() => {
  refreshLocalAvatar();
  window.addEventListener(PROFILE_AVATAR_CHANGED_EVENT, refreshLocalAvatar);
});

onUnmounted(() => {
  window.removeEventListener(PROFILE_AVATAR_CHANGED_EVENT, refreshLocalAvatar);
});
</script>

<style scoped lang="scss">
.avatar {
  width: 40px;
  height: 40px;
  overflow: hidden;
  cursor: pointer;
  border-radius: 50%;
  img {
    width: 100%;
    height: 100%;
  }
}
</style>
