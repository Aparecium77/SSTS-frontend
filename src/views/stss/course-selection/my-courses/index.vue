<template>
  <CsPage title="我的选课" desc="本人当前学期选课记录，可退课。状态含已选 / 待抽签 / 候补 / 已退 / 失败。">
    <el-card shadow="never" class="mb-3">
      <el-form :inline="true">
        <el-form-item label="学期"><el-input v-model="semester" style="width: 130px" /></el-form-item>
        <el-form-item label="状态">
          <el-select v-model="status" clearable style="width: 140px">
            <el-option v-for="(t, k) in STATUS_TEXT" :key="k" :label="t.text" :value="k" />
          </el-select>
        </el-form-item>
        <el-form-item><el-button type="primary" :loading="loading" @click="load">查询</el-button></el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <el-table v-loading="loading" :data="rows" border empty-text="本学期暂无选课记录">
        <el-table-column prop="course_code" label="课程代码" width="120" />
        <el-table-column prop="course_name" label="课程名称" min-width="160" />
        <el-table-column prop="teacher_name" label="教师" width="120" />
        <el-table-column label="阶段" width="110">
          <template #default="{ row }">{{ STAGE_TEXT[row.stage] }}</template>
        </el-table-column>
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="STATUS_TEXT[row.status].type">{{ STATUS_TEXT[row.status].text }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="enrolled_at" label="选课时间" width="200" />
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-popconfirm title="确认退课？" @confirm="onDrop(row)">
              <template #reference>
                <el-button link type="danger" :disabled="row.status !== 'enrolled'">退课</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </CsPage>
</template>

<script setup lang="ts" name="myEnrollments">
import { onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import CsPage from "../components/CsPage.vue";
import { CourseSelection } from "@/api/interface/courseSelection";
import { dropEnrollmentApi, getMyEnrollmentsApi } from "@/api/modules/courseSelection";

const USE_MOCK = true;

const STATUS_TEXT: Record<string, { text: string; type: "success" | "info" | "warning" | "danger" }> = {
  enrolled: { text: "已选", type: "success" },
  pending_lottery: { text: "待抽签", type: "info" },
  waitlisted: { text: "候补", type: "warning" },
  canceled: { text: "已退", type: "info" },
  failed: { text: "失败", type: "danger" }
};
const STAGE_TEXT: Record<string, string> = { preference: "意愿初选", lottery: "抽签", add_drop: "补退选" };

const semester = ref("2026-1");
const status = ref("");
const rows = ref<CourseSelection.EnrollmentView[]>([]);
const loading = ref(false);

const mockRows: CourseSelection.EnrollmentView[] = [
  {
    enrollment_id: "01HENR1",
    offering_id: "B-CS101-2026-1-01",
    course_code: "CS101",
    course_name: "软件工程",
    teacher_id: "T-9001",
    teacher_name: "张老师",
    status: "enrolled",
    stage: "add_drop",
    enrolled_at: "2026-04-22T10:00:00Z"
  },
  {
    enrollment_id: "01HENR2",
    offering_id: "B-CS301-2026-1-01",
    course_code: "CS301",
    course_name: "机器学习",
    teacher_id: "T-9003",
    teacher_name: "王老师",
    status: "pending_lottery",
    stage: "preference",
    enrolled_at: "2026-04-20T09:00:00Z"
  }
];

async function load() {
  loading.value = true;
  try {
    if (USE_MOCK) {
      rows.value = mockRows.filter(r => !status.value || r.status === status.value);
    } else {
      const { data } = await getMyEnrollmentsApi(semester.value, status.value || undefined);
      rows.value = data.list;
    }
  } finally {
    loading.value = false;
  }
}

async function onDrop(row: CourseSelection.EnrollmentView) {
  if (!USE_MOCK) await dropEnrollmentApi(row.enrollment_id);
  row.status = "canceled";
  ElMessage.success("已退课");
}

onMounted(load);
</script>
