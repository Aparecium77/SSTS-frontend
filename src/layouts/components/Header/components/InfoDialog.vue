<template>
  <el-dialog v-model="dialogVisible" title="个人信息" width="560px" draggable>
    <div class="info-dialog">
      <div class="avatar-panel">
        <img src="@/assets/images/avatar.gif" alt="avatar" class="avatar-img" />
        <div class="avatar-copy">
          <div class="name">{{ userStore.userInfo.name || "未命名用户" }}</div>
          <div class="role">{{ roleLabel }}</div>
        </div>
      </div>
      <el-descriptions :column="1" border>
        <el-descriptions-item label="账号">{{ roleAccount }}</el-descriptions-item>
        <el-descriptions-item label="系统角色">{{ roleLabel }}</el-descriptions-item>
        <el-descriptions-item label="说明">
          当前模板阶段仅统一公共入口。后续可在这里接入头像、邮箱、联系方式等个人资料编辑能力。
        </el-descriptions-item>
      </el-descriptions>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="dialogVisible = false">确认</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useUserStore } from "@/stores/modules/user";

const userStore = useUserStore();

const dialogVisible = ref(false);

const roleLabelMap: Record<string, string> = {
  student: "学生",
  teacher: "教师",
  academic_admin: "教务管理员"
};

const accountMap: Record<string, string> = {
  student: "student",
  teacher: "teacher",
  academic_admin: "academic_admin"
};

const roleLabel = computed(() => roleLabelMap[userStore.userInfo.role] ?? "未识别角色");
const roleAccount = computed(() => accountMap[userStore.userInfo.role] ?? "-");

const openDialog = () => {
  dialogVisible.value = true;
};

defineExpose({ openDialog });
</script>

<style scoped lang="scss">
.info-dialog {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.avatar-panel {
  display: flex;
  gap: 16px;
  align-items: center;
}
.avatar-img {
  width: 72px;
  height: 72px;
  border-radius: 50%;
}
.avatar-copy {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.name {
  font-size: 18px;
  font-weight: 600;
  color: #1f2a44;
}
.role {
  font-size: 13px;
  color: #667085;
}
</style>
