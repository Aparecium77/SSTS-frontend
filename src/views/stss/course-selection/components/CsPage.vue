<template>
  <div class="cs-page">
    <div class="cs-header">
      <h2>{{ title }}</h2>
      <p v-if="desc">{{ desc }}</p>
    </div>
    <slot />
  </div>
</template>

<script setup lang="ts" name="CsPage">
// 选课中心组本地公共页壳：统一页面标题 + 模块说明（满足 README 页面最低要求）。
defineProps<{ title: string; desc?: string }>();
</script>

<style scoped lang="scss">
.cs-page {
  padding: 16px;
}
.cs-header {
  margin-bottom: 12px;
  h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
  }
  p {
    margin: 4px 0 0;
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }
}
</style>
