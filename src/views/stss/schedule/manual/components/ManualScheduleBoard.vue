<template>
  <div class="board">
    <article v-for="record in records" :key="record.id" class="board__item" @click="$emit('select', record)">
      <div class="board__meta">
        <span>{{ record.timeSlot.weekLabel }}</span>
        <el-tag size="small" :type="record.status === 'adjusting' ? 'warning' : 'success'">
          {{ record.status === "adjusting" ? "调课中" : "正常" }}
        </el-tag>
      </div>
      <h4>{{ record.courseName }}</h4>
      <p>{{ record.teacherName }}</p>
      <p>{{ `${record.className} / ${record.classroomName}` }}</p>
      <strong>{{ `周${record.timeSlot.dayOfWeek} ${record.timeSlot.sectionStart}-${record.timeSlot.sectionEnd} 节` }}</strong>
    </article>
  </div>
</template>

<script setup lang="ts" name="manualScheduleBoard">
import type { Schedule } from "@/api/interface/schedule";

defineProps<{
  records: Schedule.ScheduleRecord[];
}>();

defineEmits<{
  (event: "select", record: Schedule.ScheduleRecord): void;
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
  padding: 16px;
  cursor: pointer;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid #dbeafe;
  border-radius: 16px;
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
