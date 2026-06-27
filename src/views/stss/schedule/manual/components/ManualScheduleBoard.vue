<template>
  <div class="board">
    <button v-for="record in records" :key="record.entry.id" type="button" class="board__item" @click="$emit('select', record)">
      <div class="board__meta">
        <span>{{ record.entry.semester }}</span>
        <el-tag size="small" effect="plain">ID {{ record.entry.id }}</el-tag>
      </div>
      <h4>{{ record.course }}</h4>
      <p>{{ record.teachers }}</p>
      <p>{{ record.classroom }}</p>
      <strong>{{ record.timeText }}</strong>
    </button>
  </div>
</template>

<script setup lang="ts" name="manualScheduleBoard">
import type { QueryEntryView } from "../../query/types";

defineProps<{
  records: QueryEntryView[];
}>();

defineEmits<{
  (event: "select", record: QueryEntryView): void;
}>();
</script>

<style scoped lang="scss">
.board {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}
.board__item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 160px;
  padding: 16px;
  text-align: left;
  cursor: pointer;
  background: #ffffff;
  border: 1px solid #dbeafe;
  border-radius: 8px;
}
.board__meta {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: #64748b;
}
.board__item h4 {
  margin: 0;
  font-size: 16px;
  color: #0f172a;
}
.board__item p,
.board__item strong {
  margin: 0;
  color: #475569;
}

@media (width <= 1100px) {
  .board {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (width <= 768px) {
  .board {
    grid-template-columns: 1fr;
  }
}
</style>
