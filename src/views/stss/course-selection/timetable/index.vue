<template>
  <CsPage title="我的课表" desc="按周次渲染本学期课表（7 天 × 节次），支持 PDF 导出。">
    <el-card shadow="never" class="mb-3">
      <el-form :inline="true">
        <el-form-item label="学期"><el-input v-model="semester" style="width: 130px" /></el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="load">刷新</el-button>
          <el-button :icon="Download" @click="onExport">导出 PDF</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <el-empty v-if="!slots.length" description="本学期暂无课程" />
      <table v-else class="timetable">
        <thead>
          <tr>
            <th class="period-col">节次</th>
            <th v-for="d in 7" :key="d">周{{ d }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in 12" :key="p">
            <td class="period-col">第{{ p }}节</td>
            <td v-for="d in 7" :key="d">
              <div v-if="cell(d, p)" class="slot">
                <div class="name">{{ cell(d, p)!.course_name }}</div>
                <div class="room">{{ cell(d, p)!.classroom }}</div>
                <div class="weeks">{{ cell(d, p)!.weeks }}周</div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </el-card>
  </CsPage>
</template>

<script setup lang="ts" name="myTimetable">
import { onMounted, ref } from "vue";
import { Download } from "@element-plus/icons-vue";
import CsPage from "../components/CsPage.vue";
import { CourseSelection } from "@/api/interface/courseSelection";
import { exportTimetablePdfApi, getMyTimetableApi } from "@/api/modules/courseSelection";
import { useDownload } from "@/hooks/useDownload";

const USE_MOCK = false;

const semester = ref("2026-1");
const slots = ref<CourseSelection.TimetableSlot[]>([]);
const loading = ref(false);

const mockSlots: CourseSelection.TimetableSlot[] = [
  { offering_id: "B-CS101-2026-1-01", course_name: "软件工程", day: 1, period: [1, 2], weeks: "1-16", classroom: "西1-201" },
  { offering_id: "B-CS301-2026-1-01", course_name: "机器学习", day: 3, period: [3, 4], weeks: "1-16", classroom: "东4-305" },
  { offering_id: "B-MA102-2026-1-02", course_name: "高等数学", day: 5, period: [6, 7], weeks: "1-8", classroom: "西2-110" }
];

function cell(day: number, period: number) {
  return slots.value.find(s => s.day === day && s.period.includes(period));
}

async function load() {
  loading.value = true;
  try {
    if (USE_MOCK) {
      slots.value = mockSlots;
    } else {
      const { data } = await getMyTimetableApi(semester.value);
      slots.value = data.slots;
    }
  } finally {
    loading.value = false;
  }
}

function onExport() {
  useDownload(exportTimetablePdfApi, `课表-${semester.value}`, semester.value, true, ".pdf");
}

onMounted(load);
</script>

<style scoped lang="scss">
.timetable {
  width: 100%;
  border-collapse: collapse;
  th,
  td {
    height: 48px;
    padding: 4px;
    text-align: center;
    vertical-align: middle;
    border: 1px solid var(--el-border-color);
  }
  th {
    font-weight: 600;
    background: var(--el-fill-color-light);
  }
  .period-col {
    width: 70px;
    background: var(--el-fill-color-light);
  }
  .slot {
    padding: 4px;
    font-size: 12px;
    background: var(--el-color-primary-light-9);
    border-radius: 4px;
    .name {
      font-weight: 600;
      color: var(--el-color-primary);
    }
    .room,
    .weeks {
      color: var(--el-text-color-secondary);
    }
  }
}
</style>
