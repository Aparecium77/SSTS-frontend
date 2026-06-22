<template>
  <div class="stss-module-scaffold card">
    <div class="module-header">
      <p class="eyebrow">{{ groupLabel }}</p>
      <h2>{{ moduleLabel }}</h2>
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

@media (width <= 992px) {
  .stss-module-scaffold {
    padding: 24px;
  }
}
</style>
