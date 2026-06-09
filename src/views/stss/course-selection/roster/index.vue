<template>
  <CsPage title="任课花名册" desc="教师查看本人任课课程的学生名单，可含已退课、导出 Excel。">
    <el-card shadow="never" class="mb-3">
      <el-form :inline="true">
        <el-form-item label="任课课程">
          <el-select v-model="offeringId" style="width: 240px" @change="loadRoster">
            <el-option
              v-for="o in offerings"
              :key="o.offering_id"
              :label="`${o.course_name}（${o.enrolled_count}/${o.max_capacity}）`"
              :value="o.offering_id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="含已退课"><el-switch v-model="includeDropped" @change="loadRoster" /></el-form-item>
        <el-form-item>
          <el-button :icon="Download" @click="onExport">导出 Excel</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <div v-if="roster" class="mb-2" style="color: var(--el-text-color-secondary)">
        {{ roster.course_code }} · {{ roster.semester }} · 共 {{ roster.total }} 人 · 快照 {{ roster.snapshot_at }}
      </div>
      <el-table v-loading="loading" :data="roster?.students || []" border empty-text="暂无学生">
        <el-table-column type="index" label="#" width="60" />
        <el-table-column prop="student_id" label="学号" width="160" />
        <el-table-column prop="name" label="姓名" min-width="140" />
        <el-table-column prop="enrolled_at" label="选课时间" width="220" />
      </el-table>
    </el-card>
  </CsPage>
</template>

<script setup lang="ts" name="teachingRoster">
import { onMounted, ref } from "vue";
import { Download } from "@element-plus/icons-vue";
import CsPage from "../components/CsPage.vue";
import { CourseSelection } from "@/api/interface/courseSelection";
import { exportRosterXlsxApi, getTeachingOfferingsApi, getTeachingRosterApi } from "@/api/modules/courseSelection";
import { useDownload } from "@/hooks/useDownload";

const USE_MOCK = false;

const offerings = ref<CourseSelection.TeachingOffering[]>([]);
const offeringId = ref("");
const includeDropped = ref(false);
const roster = ref<CourseSelection.Roster | null>(null);
const loading = ref(false);

const mockOfferings: CourseSelection.TeachingOffering[] = [
  { offering_id: "B-CS101-2026-1-01", course_name: "软件工程", enrolled_count: 45, max_capacity: 60 },
  { offering_id: "B-CS101-2026-1-02", course_name: "软件工程(2班)", enrolled_count: 58, max_capacity: 60 }
];
const mockRoster: CourseSelection.Roster = {
  offering_id: "B-CS101-2026-1-01",
  course_code: "CS101",
  semester: "2026-1",
  total: 2,
  snapshot_at: "2026-05-10T08:00:00Z",
  students: [
    { student_id: "S-3210123", name: "李同学", enrolled_at: "2026-04-22T10:00:00Z" },
    { student_id: "S-3210124", name: "王同学", enrolled_at: "2026-04-22T10:05:00Z" }
  ]
};

async function loadOfferings() {
  if (USE_MOCK) {
    offerings.value = mockOfferings;
  } else {
    const { data } = await getTeachingOfferingsApi("2026-1");
    offerings.value = data.list;
  }
  offeringId.value = offerings.value[0]?.offering_id || "";
  await loadRoster();
}

async function loadRoster() {
  if (!offeringId.value) return;
  loading.value = true;
  try {
    if (USE_MOCK) {
      roster.value = { ...mockRoster, offering_id: offeringId.value };
    } else {
      const { data } = await getTeachingRosterApi(offeringId.value, includeDropped.value);
      roster.value = data;
    }
  } finally {
    loading.value = false;
  }
}

function onExport() {
  useDownload(exportRosterXlsxApi, `花名册-${offeringId.value}`, offeringId.value, true, ".xlsx");
}

onMounted(loadOfferings);
</script>
