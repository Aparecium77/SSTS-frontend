<template>
  <div class="schedule-page">
    <section class="hero card">
      <div class="hero__content">
        <p class="hero__eyebrow">排课管理</p>
        <div class="hero__heading">
          <div>
            <h2>{{ title }}</h2>
            <p>{{ description }}</p>
          </div>
          <div class="hero__tags">
            <el-tag v-for="tag in tags" :key="tag" effect="plain" round>
              {{ tag }}
            </el-tag>
          </div>
        </div>
      </div>
    </section>

    <section class="stats">
      <article v-for="item in stats" :key="item.label" class="stats__item card">
        <span class="stats__label">{{ item.label }}</span>
        <strong class="stats__value">{{ item.value }}</strong>
        <p class="stats__help">{{ item.help }}</p>
      </article>
    </section>

    <section class="filters card">
      <div class="section-header">
        <div>
          <h3>筛选与操作</h3>
          <p>统一使用本地 mock 数据驱动页面结构，后续可直接替换为接口返回。</p>
        </div>
        <slot name="actions" />
      </div>
      <slot name="filters" />
    </section>

    <section class="content card">
      <div class="section-header">
        <div>
          <h3>{{ contentTitle }}</h3>
          <p>{{ contentDescription }}</p>
        </div>
      </div>
      <slot v-if="dataCount > 0" />
      <el-empty v-else :description="emptyDescription" />
    </section>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="760px">
      <slot name="detail" />
    </el-dialog>
  </div>
</template>

<script setup lang="ts" name="schedulePageShell">
import { computed } from "vue";

interface StatItem {
  label: string;
  value: string | number;
  help: string;
}

const props = withDefaults(
  defineProps<{
    title: string;
    description: string;
    tags?: string[];
    stats: StatItem[];
    contentTitle: string;
    contentDescription: string;
    dataCount: number;
    emptyDescription: string;
    dialogTitle: string;
    modelValue: boolean;
  }>(),
  {
    tags: () => []
  }
);

const emit = defineEmits<{
  (event: "update:modelValue", value: boolean): void;
}>();

const dialogVisible = computed({
  get: () => props.modelValue,
  set: value => emit("update:modelValue", value)
});
</script>

<style scoped lang="scss">
.schedule-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.hero {
  padding: 28px 32px;
  overflow: hidden;
  background:
    radial-gradient(circle at top right, rgb(15 118 110 / 16%), transparent 28%),
    linear-gradient(135deg, #f4fbf8 0%, #eef5ff 100%);
  border: 1px solid rgb(15 118 110 / 12%);
}
.hero__eyebrow {
  margin: 0 0 12px;
  font-size: 12px;
  font-weight: 700;
  color: #0f766e;
  letter-spacing: 0.12em;
}
.hero__heading {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  justify-content: space-between;
}
.hero h2 {
  margin: 0 0 10px;
  font-size: 28px;
  color: #1f2937;
}
.hero p {
  margin: 0;
  line-height: 1.7;
  color: #526072;
}
.hero__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
  min-width: 200px;
}
.stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}
.stats__item {
  padding: 20px 22px;
}
.stats__label {
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  color: #6b7280;
}
.stats__value {
  display: block;
  margin-bottom: 6px;
  font-size: 26px;
  color: #111827;
}
.stats__help {
  margin: 0;
  font-size: 13px;
  color: #64748b;
}
.filters,
.content {
  padding: 22px 24px;
}
.section-header {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 18px;
}
.section-header h3 {
  margin: 0 0 8px;
  font-size: 18px;
  color: #1f2937;
}
.section-header p {
  margin: 0;
  color: #64748b;
}

@media (width <= 1100px) {
  .stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (width <= 768px) {
  .hero,
  .filters,
  .content {
    padding: 20px;
  }
  .hero__heading,
  .section-header {
    flex-direction: column;
  }
  .hero__tags {
    justify-content: flex-start;
    min-width: auto;
  }
  .stats {
    grid-template-columns: 1fr;
  }
}
</style>
