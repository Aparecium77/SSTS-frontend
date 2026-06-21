<template>
  <div class="stss-module-scaffold card">
    <div class="module-header">
      <p class="eyebrow">{{ groupLabel }}</p>
      <h2>{{ moduleLabel }}</h2>
      <p class="description">{{ description }}</p>
    </div>
    <div class="meta-grid">
      <div class="meta-item">
        <span class="label">页面文件</span>
        <span class="value">{{ viewPath }}</span>
      </div>
      <div class="meta-item">
        <span class="label">接口文件</span>
        <span class="value">{{ apiPath }}</span>
      </div>
      <div class="meta-item">
        <span class="label">类型文件</span>
        <span class="value">{{ typePath }}</span>
      </div>
    </div>
    <div class="todo-box">
      <h3>开发提示</h3>
      <p>请在当前目录继续补充表格、表单、详情抽屉、对话框、局部组件与 mock 数据。</p>
      <p>页面中不要直接写 axios，请统一调用对应的 `src/api/modules/*.ts` 接口封装文件。</p>
    </div>
  </div>
</template>

<script setup lang="ts" name="stssModuleScaffold">
defineProps<{
  groupLabel: string;
  moduleLabel: string;
  description: string;
  viewPath: string;
  apiPath: string;
  typePath: string;
}>();
</script>

<style scoped lang="scss">
.stss-module-scaffold {
  min-height: calc(100vh - 210px);
  padding: 36px;
  background:
    radial-gradient(circle at top right, rgb(0 150 136 / 12%), transparent 28%), linear-gradient(135deg, #f8fffd 0%, #f2f7ff 100%);
}
.module-header {
  max-width: 760px;
  margin-bottom: 28px;
}
.eyebrow {
  margin-bottom: 12px;
  font-size: 13px;
  font-weight: 700;
  color: #009688;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
h2 {
  margin: 0 0 12px;
  font-size: 30px;
  color: #1f2a44;
}
.description {
  margin: 0;
  font-size: 15px;
  line-height: 1.75;
  color: #55627a;
}
.meta-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}
.meta-item,
.todo-box {
  padding: 18px 20px;
  background: rgb(255 255 255 / 84%);
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
  font-size: 14px;
  font-weight: 600;
  color: #22304d;
  word-break: break-all;
}
.todo-box h3 {
  margin: 0 0 12px;
  font-size: 18px;
  color: #22304d;
}
.todo-box p {
  margin: 0;
  font-size: 14px;
  line-height: 1.75;
  color: #5b667b;
}
.todo-box p + p {
  margin-top: 8px;
}

@media (width <= 992px) {
  .stss-module-scaffold {
    padding: 24px;
  }
  .meta-grid {
    grid-template-columns: 1fr;
  }
}
</style>
