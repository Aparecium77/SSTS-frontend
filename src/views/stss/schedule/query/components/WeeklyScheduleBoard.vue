<template>
  <div v-loading="loading" class="board">
    <article v-for="cell in cells" :key="cell.dayOfWeek" class="board__cell">
      <header class="board__header">
        <h4>{{ cell.dayLabel }}</h4>
        <span>{{ `${cell.records.length} 条` }}</span>
      </header>
      <div v-if="cell.records.length" class="board__records">
        <button
          v-for="record in cell.records"
          :key="record.entry.id"
          type="button"
          class="record-card"
          @click="$emit('select', record)"
        >
          <strong>{{ record.course }}</strong>
          <span>{{ `${record.entry.slot_start}-${record.entry.slot_end} 节` }}</span>
          <span>{{ record.classroom }}</span>
        </button>
      </div>
      <el-empty v-else description="暂无课程" :image-size="56" />
    </article>
  </div>
</template>

<script setup lang="ts" name="weeklyScheduleBoard">
import type { QueryEntryView } from "../types";

defineProps<{
  cells: Array<{
    dayOfWeek: number;
    dayLabel: string;
    records: QueryEntryView[];
  }>;
  loading?: boolean;
}>();

defineEmits<{
  (event: "select", record: QueryEntryView): void;
}>();
</script>

<style scoped lang="scss">
.board {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 12px;
}
.board__cell {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 260px;
  padding: 14px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}
.board__header {
  display: flex;
  gap: 8px;
  align-items: baseline;
  justify-content: space-between;
}
.board__header h4 {
  margin: 0;
  font-size: 15px;
  color: #0f172a;
}
.board__header span {
  font-size: 12px;
  color: #64748b;
}
.board__records {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.record-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 92px;
  padding: 12px;
  text-align: left;
  cursor: pointer;
  background: #ffffff;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
}
.record-card strong {
  font-size: 14px;
  color: #1d4ed8;
}
.record-card span {
  font-size: 12px;
  color: #475569;
}

@media (width <= 1200px) {
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
