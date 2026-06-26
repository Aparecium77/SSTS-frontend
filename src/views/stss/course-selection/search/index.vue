<template>
  <CsPage title="课程检索" desc="按关键词 / 教师 / 学期 / 类别检索开课，查看剩余容量与时段，可直接发起选课。">
    <el-card shadow="never" class="mb-3">
      <el-form :inline="true" :model="query">
        <el-form-item label="关键词"><el-input v-model="query.keyword" placeholder="课程名/代码" clearable /></el-form-item>
        <el-form-item label="教师"><el-input v-model="query.teacher_name" clearable /></el-form-item>
        <el-form-item label="学期"><el-input v-model="query.semester" placeholder="2026-1" clearable /></el-form-item>
        <el-form-item label="类别">
          <el-select v-model="query.category" clearable style="width: 140px">
            <el-option label="专业必修" value="major_required" />
            <el-option label="专业选修" value="major_elective" />
            <el-option label="通识" value="general" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" :loading="loading" @click="onSearch">查询</el-button>
          <el-button @click="onReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <el-table v-loading="loading" :data="list" border empty-text="暂无匹配课程">
        <el-table-column prop="course_code" label="课程代码" width="120" />
        <el-table-column prop="course_name" label="课程名称" min-width="160" />
        <el-table-column prop="teacher_name" label="教师" width="120" />
        <el-table-column prop="credit" label="学分" width="80" />
        <el-table-column label="余量" width="200">
          <template #default="{ row }">
            <el-progress
              :percentage="Math.round((1 - row.remaining / row.max_capacity) * 100)"
              :status="row.remaining === 0 ? 'exception' : undefined"
              :format="() => `${row.remaining}/${row.max_capacity}`"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row)">详情</el-button>
            <el-button link type="success" :disabled="row.remaining === 0" @click="onEnroll(row)">选课</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="mt-3 text-right">
        <el-pagination
          v-model:current-page="page"
          :page-size="pageSize"
          :total="total"
          layout="total, prev, pager, next"
          @current-change="onSearch"
        />
      </div>
    </el-card>

    <el-drawer v-model="detailVisible" title="开课详情" size="420px">
      <template v-if="detail">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="课程">{{ detail.course_code }} {{ detail.course_name }}</el-descriptions-item>
          <el-descriptions-item label="教师">{{ detail.teacher_name }}</el-descriptions-item>
          <el-descriptions-item label="学期">{{ detail.semester }}</el-descriptions-item>
          <el-descriptions-item label="教室">{{ detail.classroom }} / {{ detail.campus }}</el-descriptions-item>
          <el-descriptions-item label="容量">{{ capacityText }}</el-descriptions-item>
          <el-descriptions-item label="时段">
            <el-tag v-for="(s, i) in detail.time_slots" :key="i" class="mr-1">
              周{{ s.day }} 第{{ s.period.join("-") }}节 ({{ s.weeks }}周)
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>
        <el-divider content-position="left">冲突预检</el-divider>
        <el-alert
          v-if="conflictResult && !conflictResult.has_conflict"
          type="success"
          show-icon
          :closable="false"
          title="未发现时间冲突"
        />
        <el-alert v-else-if="conflictResult" type="warning" show-icon :closable="false" title="存在选课冲突" class="mb-2" />
        <el-table
          v-if="conflictResult?.conflicts.length"
          :data="conflictResult.conflicts"
          border
          size="small"
          empty-text="暂无冲突"
        >
          <el-table-column prop="type" label="类型" width="100" />
          <el-table-column prop="with_offering_id" label="冲突开课" min-width="150" />
          <el-table-column prop="message" label="说明" min-width="180" />
        </el-table>
      </template>
    </el-drawer>
  </CsPage>
</template>

<script setup lang="ts" name="courseSearch">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import { Search } from "@element-plus/icons-vue";
import CsPage from "../components/CsPage.vue";
import { CourseSelection } from "@/api/interface/courseSelection";
import { enrollApi, getOfferingApi, getOfferingConflictsApi, searchCoursesApi } from "@/api/modules/courseSelection";

const USE_MOCK = false;

const query = reactive<CourseSelection.SearchQuery>({ keyword: "", teacher_name: "", semester: "2026-1", category: "" });
const list = ref<CourseSelection.OfferingBrief[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = 10;
const loading = ref(false);
const detailVisible = ref(false);
const detail = ref<CourseSelection.OfferingDetail | null>(null);
const conflictResult = ref<CourseSelection.ConflictResult | null>(null);
const capacityText = computed(() =>
  detail.value ? `${detail.value.enrolled_count} / ${detail.value.max_capacity}（余 ${detail.value.remaining}）` : ""
);

const mockList: CourseSelection.OfferingBrief[] = [
  {
    offering_id: "B-CS101-2026-1-01",
    course_code: "CS101",
    course_name: "软件工程",
    teacher_name: "张老师",
    credit: 3,
    remaining: 12,
    max_capacity: 60
  },
  {
    offering_id: "B-CS201-2026-1-01",
    course_code: "CS201",
    course_name: "数据结构",
    teacher_name: "李老师",
    credit: 4,
    remaining: 0,
    max_capacity: 80
  },
  {
    offering_id: "B-CS301-2026-1-01",
    course_code: "CS301",
    course_name: "机器学习",
    teacher_name: "王老师",
    credit: 3,
    remaining: 25,
    max_capacity: 100
  }
];

async function onSearch() {
  loading.value = true;
  try {
    if (USE_MOCK) {
      const kw = (query.keyword || "").trim();
      const filtered = mockList.filter(o => !kw || o.course_name.includes(kw) || o.course_code.includes(kw));
      list.value = filtered;
      total.value = filtered.length;
    } else {
      const { data } = await searchCoursesApi({ ...query, page: page.value, page_size: pageSize });
      list.value = data.list;
      total.value = data.total;
    }
  } finally {
    loading.value = false;
  }
}

function onReset() {
  query.keyword = "";
  query.teacher_name = "";
  query.category = "";
  page.value = 1;
  onSearch();
}

async function openDetail(row: CourseSelection.OfferingBrief) {
  conflictResult.value = null;
  if (USE_MOCK) {
    detail.value = {
      ...row,
      teacher_id: "T-9001",
      semester: query.semester || "2026-1",
      time_slots: [{ day: 1, period: [1, 2], weeks: "1-16" }],
      classroom: "紫金港西1-201",
      campus: "紫金港",
      enrolled_count: row.max_capacity - row.remaining
    };
    conflictResult.value = { has_conflict: false, conflicts: [] };
  } else {
    const [{ data }, conflictRes] = await Promise.all([
      getOfferingApi(row.offering_id),
      getOfferingConflictsApi(row.offering_id)
    ]);
    detail.value = data;
    conflictResult.value = conflictRes.data;
  }
  detailVisible.value = true;
}

async function onEnroll(row: CourseSelection.OfferingBrief) {
  try {
    const res = USE_MOCK ? null : await enrollApi({ offering_id: row.offering_id, stage: "add_drop" }, { queueAsSuccess: true });
    if (res?.code === 30201) {
      const queue = res.data as CourseSelection.QueuePosition | undefined;
      sessionStorage.setItem(
        "course-selection-pending-queue",
        JSON.stringify({
          offering_id: row.offering_id,
          stage: "add_drop",
          queue: queue ?? { position: 0, retry_after_ms: 1000 }
        })
      );
      const position = queue?.position ? `当前第 ${queue.position} 位，` : "";
      ElMessage.warning(`已进入排队，${position}请到「选课/退课」页继续查看状态`);
      return;
    }
    ElMessage.success(`已发起选课：${row.course_name}（详见「选课/退课」）`);
  } catch (e: any) {
    if (e?.code === 30201) {
      const queue = e.data as CourseSelection.QueuePosition | undefined;
      sessionStorage.setItem(
        "course-selection-pending-queue",
        JSON.stringify({
          offering_id: row.offering_id,
          stage: "add_drop",
          queue: queue ?? { position: 0, retry_after_ms: 1000 }
        })
      );
      const position = queue?.position ? `当前第 ${queue.position} 位，` : "";
      ElMessage.warning(`已进入排队，${position}请到「选课/退课」页继续查看状态`);
      return;
    }
    throw e;
  }
}

onMounted(onSearch);
</script>
