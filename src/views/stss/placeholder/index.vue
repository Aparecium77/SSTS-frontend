<template>
  <div class="stss-placeholder card">
    <div class="placeholder-content">
      <p class="eyebrow">STSS Academic Service</p>
      <h2>{{ route.meta.title }}</h2>
      <p class="description">当前模块已完成菜单和权限接入，页面主体还未开发，可直接交由对应小组继续实现。</p>
      <div class="meta-grid">
        <div class="meta-item">
          <span class="label">当前路由</span>
          <span class="value">{{ route.path }}</span>
        </div>
        <div class="meta-item">
          <span class="label">当前角色</span>
          <span class="value">{{ userRoleLabel }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="stssPlaceholder">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { useUserStore } from "@/stores/modules/user";

const route = useRoute();
const userStore = useUserStore();

const roleLabelMap: Record<string, string> = {
  student: "学生",
  teacher: "教师",
  academic_admin: "教务管理员"
};

const userRoleLabel = computed(() => roleLabelMap[userStore.userInfo.role] ?? "未识别角色");
</script>

<style scoped lang="scss">
.stss-placeholder {
  min-height: calc(100vh - 210px);
  padding: 48px;
  background:
    radial-gradient(circle at top right, rgb(0 150 136 / 14%), transparent 30%), linear-gradient(135deg, #f8fffd 0%, #eef5ff 100%);
  .placeholder-content {
    max-width: 680px;
  }
  .eyebrow {
    margin-bottom: 14px;
    font-size: 13px;
    font-weight: 700;
    color: #009688;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
  h2 {
    margin: 0 0 12px;
    font-size: 32px;
    color: #1f2a44;
  }
  .description {
    margin: 0 0 28px;
    font-size: 15px;
    line-height: 1.7;
    color: #5c667a;
  }
  .meta-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }
  .meta-item {
    padding: 18px 20px;
    background: rgb(255 255 255 / 82%);
    backdrop-filter: blur(8px);
    border: 1px solid rgb(0 150 136 / 12%);
    border-radius: 18px;
  }
  .label {
    display: block;
    margin-bottom: 8px;
    font-size: 12px;
    color: #7f8aa3;
  }
  .value {
    display: block;
    font-size: 16px;
    font-weight: 600;
    color: #22304d;
    word-break: break-all;
  }
}
</style>
