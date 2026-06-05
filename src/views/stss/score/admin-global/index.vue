<template>
  <div class="admin-global-page">
    <section class="page-header">
      <div>
        <p class="eyebrow">成绩管理</p>
        <h2>全局成绩管理</h2>
        <p class="subtitle">教务管理员：跨课程查询、学生档案、课程对比、强制代录/代改</p>
      </div>
      <el-button :icon="Refresh" :loading="loading" @click="reloadActiveTab">刷新</el-button>
    </section>

    <el-alert
      class="page-alert"
      type="info"
      :closable="false"
      show-icon
      title="部分查询依赖基础信息/课程外部服务；本地若未配置会返回 503，可先保证 grade.db 中已有总评数据。"
    />

    <el-tabs v-model="activeTab" class="admin-tabs">
      <el-tab-pane label="全局成绩查询" name="records">
        <section class="filter-bar">
          <el-input v-model="recordFilters.course_id" placeholder="课程号" clearable class="filter-item" />
          <el-input v-model="recordFilters.semester" placeholder="学期" clearable class="filter-item" />
          <el-input v-model="recordFilters.student_id" placeholder="学生 ID" clearable class="filter-item" />
          <el-input v-model="recordFilters.student_no" placeholder="学号" clearable class="filter-item" />
          <el-input v-model="recordFilters.major" placeholder="专业" clearable class="filter-item" />
          <el-input v-model="recordFilters.college" placeholder="学院" clearable class="filter-item" />
          <el-input v-model="recordFilters.grade" placeholder="年级" clearable class="filter-item" />
          <el-button type="primary" :loading="loading" @click="loadRecords">查询</el-button>
          <el-button :loading="exporting" @click="exportRecords">导出 Excel</el-button>
        </section>
        <el-table v-loading="loading" :data="recordRows" border empty-text="请查询或调整筛选条件">
          <el-table-column prop="student_no" label="学号" min-width="120" />
          <el-table-column prop="student_name" label="姓名" min-width="100" />
          <el-table-column prop="course_id" label="课程号" min-width="130" />
          <el-table-column prop="course_name" label="课程名" min-width="160" show-overflow-tooltip />
          <el-table-column prop="semester" label="学期" min-width="110" />
          <el-table-column prop="major" label="专业" min-width="120" show-overflow-tooltip />
          <el-table-column prop="status" label="状态" width="100" />
          <el-table-column prop="total_score" label="总评" width="90" align="center" />
          <el-table-column prop="gpa" label="GPA" width="90" align="center" />
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="学生成绩档案" name="archive">
        <section class="filter-bar">
          <el-input v-model="archiveStudentId" placeholder="学生 ID，如 S1001" clearable class="filter-item wide" />
          <el-button type="primary" :loading="loading" @click="loadArchive">查询档案</el-button>
        </section>
        <el-table v-loading="loading" :data="archiveRows" border empty-text="输入学生 ID 后查询">
          <el-table-column prop="semester" label="学期" min-width="120" />
          <el-table-column prop="course_id" label="课程号" min-width="130" />
          <el-table-column prop="course_name" label="课程名" min-width="160" show-overflow-tooltip />
          <el-table-column prop="total_score" label="总评" width="90" align="center" />
          <el-table-column prop="gpa" label="GPA" width="90" align="center" />
          <el-table-column prop="status" label="状态" width="100" />
          <el-table-column prop="credit" label="学分" width="80" align="center" />
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="跨课程对比" name="comparison">
        <section class="filter-bar">
          <el-input v-model="comparisonFilters.semester" placeholder="学期" clearable class="filter-item" />
          <el-input v-model="comparisonFilters.major" placeholder="专业" clearable class="filter-item" />
          <el-input v-model="comparisonFilters.college" placeholder="学院" clearable class="filter-item" />
          <el-input v-model="comparisonFilters.grade" placeholder="年级" clearable class="filter-item" />
          <el-button type="primary" :loading="loading" @click="loadComparison">对比分析</el-button>
        </section>
        <el-table v-loading="loading" :data="comparisonRows" border empty-text="暂无对比数据">
          <el-table-column prop="course_id" label="课程号" min-width="130" />
          <el-table-column prop="course_name" label="课程名" min-width="160" show-overflow-tooltip />
          <el-table-column prop="semester" label="学期" min-width="110" />
          <el-table-column prop="student_count" label="人数" width="80" align="center" />
          <el-table-column prop="average_score" label="平均分" width="100" align="center" />
          <el-table-column prop="pass_rate" label="通过率(%)" width="110" align="center" />
          <el-table-column prop="excellent_rate" label="优秀率(%)" width="110" align="center" />
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="强制代录/代改" name="override">
        <div class="override-grid">
          <section class="override-card">
            <h3>强制代录</h3>
            <el-form label-width="110px">
              <el-form-item label="学生 ID">
                <el-input v-model="createForm.student_id" placeholder="S1001" />
              </el-form-item>
              <el-form-item label="学号">
                <el-input v-model="createForm.student_no" placeholder="可选" />
              </el-form-item>
              <el-form-item label="课程号">
                <el-input v-model="createForm.course_id" @change="loadOverrideComponents" />
              </el-form-item>
              <el-form-item label="学期">
                <el-input v-model="createForm.semester" @change="loadOverrideComponents" />
              </el-form-item>
              <el-form-item label="成绩分项">
                <el-select v-model="createForm.component_config_id" placeholder="先填课程与学期" filterable>
                  <el-option
                    v-for="item in overrideComponents"
                    :key="item.id"
                    :label="`${item.component_type} / ${item.component_sub_id || '-'} (${item.weight}%)`"
                    :value="item.id"
                  />
                </el-select>
              </el-form-item>
              <el-form-item label="成绩">
                <el-input-number v-model="createForm.score" :min="0" :max="100" :precision="1" controls-position="right" />
              </el-form-item>
              <el-form-item label="原因">
                <el-input v-model="createForm.reason" type="textarea" :rows="3" placeholder="必填" />
              </el-form-item>
              <el-button type="primary" :loading="acting" @click="submitCreate">提交代录</el-button>
            </el-form>
          </section>

          <section class="override-card">
            <h3>强制代改</h3>
            <el-form label-width="110px">
              <el-form-item label="记录 ID">
                <el-input-number v-model="overrideForm.record_id" :min="1" controls-position="right" />
              </el-form-item>
              <el-form-item label="新成绩">
                <el-input-number v-model="overrideForm.score" :min="0" :max="100" :precision="1" controls-position="right" />
              </el-form-item>
              <el-form-item label="原因">
                <el-input v-model="overrideForm.reason" type="textarea" :rows="3" placeholder="必填" />
              </el-form-item>
              <el-button type="primary" :loading="acting" @click="submitOverride">提交代改</el-button>
            </el-form>
          </section>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts" name="scoreAdminGlobal">
import { reactive, ref } from "vue";
import { Refresh } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import type { Score } from "@/api/interface/score";
import {
  adminCreateGradeRecord,
  adminOverrideGradeRecord,
  exportAdminGradeQuery,
  getGradeConfig,
  queryAdminCourseComparison,
  queryAdminGradeRecords,
  queryAdminStudentArchive
} from "@/api/modules/score";

const activeTab = ref("records");
const loading = ref(false);
const exporting = ref(false);
const acting = ref(false);

const recordFilters = reactive({
  course_id: "",
  semester: "",
  student_id: "",
  student_no: "",
  major: "",
  college: "",
  grade: ""
});
const recordRows = ref<Score.AdminGradeRecordRow[]>([]);

const archiveStudentId = ref("S1001");
const archiveRows = ref<Score.AdminGradeRecordRow[]>([]);

const comparisonFilters = reactive({
  semester: "",
  major: "",
  college: "",
  grade: ""
});
const comparisonRows = ref<Score.AdminCourseComparisonItem[]>([]);

const overrideComponents = ref<Score.GradeComponent[]>([]);
const createForm = reactive({
  student_id: "S1001",
  student_no: "",
  course_id: "",
  semester: "",
  component_config_id: null as number | null,
  score: null as number | null,
  reason: ""
});

const overrideForm = reactive({
  record_id: null as number | null,
  score: null as number | null,
  reason: ""
});

const cleanParams = (source: Record<string, string>) => {
  const params: Record<string, string> = {};
  Object.entries(source).forEach(([key, value]) => {
    if (value?.trim()) params[key] = value.trim();
  });
  return params;
};

const showError = (error: any) => {
  ElMessage.error(error?.msg || error?.message || "请求失败");
};

const loadRecords = async () => {
  loading.value = true;
  try {
    const resp = await queryAdminGradeRecords(cleanParams(recordFilters));
    recordRows.value = resp.data.records;
  } catch (error: any) {
    recordRows.value = [];
    showError(error);
  } finally {
    loading.value = false;
  }
};

const exportRecords = async () => {
  exporting.value = true;
  try {
    const resp = await exportAdminGradeQuery(cleanParams(recordFilters));
    const blob = new Blob([resp.data], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "global-grade-query.xlsx";
    link.click();
    window.URL.revokeObjectURL(url);
    ElMessage.success("导出已开始");
  } catch (error: any) {
    showError(error);
  } finally {
    exporting.value = false;
  }
};

const loadArchive = async () => {
  if (!archiveStudentId.value.trim()) {
    ElMessage.warning("请输入学生 ID");
    return;
  }
  loading.value = true;
  try {
    const resp = await queryAdminStudentArchive(archiveStudentId.value.trim());
    archiveRows.value = resp.data.records;
  } catch (error: any) {
    archiveRows.value = [];
    showError(error);
  } finally {
    loading.value = false;
  }
};

const loadComparison = async () => {
  loading.value = true;
  try {
    const resp = await queryAdminCourseComparison(cleanParams(comparisonFilters));
    comparisonRows.value = resp.data.courses;
  } catch (error: any) {
    comparisonRows.value = [];
    showError(error);
  } finally {
    loading.value = false;
  }
};

const loadOverrideComponents = async () => {
  if (!createForm.course_id.trim() || !createForm.semester.trim()) {
    overrideComponents.value = [];
    createForm.component_config_id = null;
    return;
  }
  try {
    const resp = await getGradeConfig(createForm.course_id.trim(), { semester: createForm.semester.trim() });
    overrideComponents.value = resp.data.components;
    if (overrideComponents.value.length === 1) {
      createForm.component_config_id = overrideComponents.value[0].id;
    }
  } catch (error: any) {
    overrideComponents.value = [];
    showError(error);
  }
};

const submitCreate = async () => {
  if (!createForm.student_id.trim() || !createForm.course_id.trim() || !createForm.semester.trim()) {
    ElMessage.warning("请填写学生、课程与学期");
    return;
  }
  if (!createForm.component_config_id) {
    ElMessage.warning("请选择成绩分项");
    return;
  }
  if (!createForm.reason.trim()) {
    ElMessage.warning("请填写代录原因");
    return;
  }
  acting.value = true;
  try {
    const resp = await adminCreateGradeRecord({
      student_id: createForm.student_id.trim(),
      student_no: createForm.student_no.trim() || undefined,
      course_id: createForm.course_id.trim(),
      semester: createForm.semester.trim(),
      component_config_id: createForm.component_config_id,
      score: createForm.score,
      reason: createForm.reason.trim()
    });
    ElMessage.success(`代录成功，记录 ID：${resp.data.grade_record_id}`);
  } catch (error: any) {
    showError(error);
  } finally {
    acting.value = false;
  }
};

const submitOverride = async () => {
  if (!overrideForm.record_id) {
    ElMessage.warning("请填写记录 ID");
    return;
  }
  if (!overrideForm.reason.trim()) {
    ElMessage.warning("请填写代改原因");
    return;
  }
  acting.value = true;
  try {
    const resp = await adminOverrideGradeRecord(overrideForm.record_id, {
      score: overrideForm.score,
      reason: overrideForm.reason.trim()
    });
    ElMessage.success(`代改成功，记录 ID：${resp.data.grade_record_id}`);
  } catch (error: any) {
    showError(error);
  } finally {
    acting.value = false;
  }
};

const reloadActiveTab = async () => {
  if (activeTab.value === "records") await loadRecords();
  else if (activeTab.value === "archive") await loadArchive();
  else if (activeTab.value === "comparison") await loadComparison();
  else if (activeTab.value === "override") await loadOverrideComponents();
};
</script>

<style scoped lang="scss">
.admin-global-page {
  min-height: 100%;
  padding: 18px;
  background: linear-gradient(135deg, rgb(247 248 250 / 96%), rgb(240 245 246 / 92%));
}
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px;
  margin-bottom: 12px;
  background: rgb(255 255 255 / 94%);
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
}
.eyebrow {
  margin: 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.page-header h2 {
  margin: 4px 0;
}
.subtitle {
  margin: 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.page-alert {
  margin-bottom: 12px;
}
.admin-tabs {
  padding: 16px 20px 20px;
  background: rgb(255 255 255 / 94%);
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
}
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}
.filter-item {
  width: 140px;
}
.filter-item.wide {
  width: 220px;
}
.override-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}
.override-card {
  padding: 16px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
}
.override-card h3 {
  margin: 0 0 12px;
}
@media (width <= 900px) {
  .override-grid {
    grid-template-columns: 1fr;
  }
}
</style>
