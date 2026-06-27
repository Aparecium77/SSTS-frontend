<template>
  <div class="approval-page">
    <section class="approval-header">
      <div class="score-heading">
        <span class="brand-bar" aria-hidden="true"></span>
        <div>
          <p class="eyebrow">成绩管理</p>
          <h2>审批与发布</h2>
        </div>
      </div>
      <el-button :icon="Refresh" :loading="loading" @click="reloadAll">刷新</el-button>
    </section>

    <section class="approval-filters">
      <el-select
        v-model="selectedCourseKey"
        placeholder="全部课程"
        clearable
        filterable
        class="filter-control"
        @change="handleCourseChange"
      >
        <el-option
          v-for="course in courseOptions"
          :key="course.course_id"
          :label="courseOptionLabel(course)"
          :value="course.course_id"
        />
      </el-select>
      <el-select
        v-model="selectedSemester"
        placeholder="全部学期"
        clearable
        filterable
        class="filter-control"
        @change="loadApprovalData"
      >
        <el-option v-for="semester in semesterOptions" :key="semester" :label="semester" :value="semester" />
      </el-select>
      <el-select v-model="modifyStatus" placeholder="改分状态" class="status-control" @change="loadModifyRequests">
        <el-option label="待审批" value="pending" />
        <el-option label="已通过" value="approved" />
        <el-option label="已驳回" value="rejected" />
        <el-option label="全部" value="" />
      </el-select>
      <el-button :disabled="!filterCourseId || !filterSemester" :loading="refreshingGpa" @click="handleRefreshGpa">
        刷新 GPA
      </el-button>
    </section>

    <section class="approval-surface">
      <el-alert
        v-if="pendingModifyCount > 0 && activeTab !== 'modifies'"
        class="tab-hint"
        type="warning"
        :closable="false"
        show-icon
        :title="`有 ${pendingModifyCount} 条待审批改分申请，请切换到「改分审批」标签页处理。`"
      />
      <el-tabs v-model="activeTab">
        <el-tab-pane label="提交审批与发布" name="submissions">
          <el-table v-loading="loading" :data="submissions" border empty-text="暂无成绩提交">
            <el-table-column prop="course_id" label="课程号" min-width="130" />
            <el-table-column prop="semester" label="学期" min-width="130" />
            <el-table-column prop="submitted_by_name" label="提交人" min-width="120" />
            <el-table-column prop="student_count" label="学生数" width="90" />
            <el-table-column prop="submitted_at" label="提交时间" min-width="170" show-overflow-tooltip />
            <el-table-column prop="opinion" label="审批意见" min-width="180" show-overflow-tooltip />
            <el-table-column label="状态" width="110">
              <template #default="{ row }">
                <el-tag :type="submissionStatusType(submissionRow(row).status)">{{
                  submissionStatusText(submissionRow(row).status)
                }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" min-width="230" fixed="right">
              <template #default="{ row }">
                <div class="table-actions">
                  <el-button
                    v-if="row.status === 'pending'"
                    size="small"
                    type="success"
                    :icon="Check"
                    :loading="actingId === `submission-approve-${row.id}`"
                    @click="reviewSubmission(submissionRow(row), 'approve')"
                  >
                    通过
                  </el-button>
                  <el-button
                    v-if="row.status === 'pending'"
                    size="small"
                    type="danger"
                    :icon="Close"
                    :loading="actingId === `submission-reject-${row.id}`"
                    @click="reviewSubmission(submissionRow(row), 'reject')"
                  >
                    驳回
                  </el-button>
                  <el-button
                    v-if="row.status === 'approved'"
                    size="small"
                    type="primary"
                    :icon="Promotion"
                    :loading="actingId === `submission-publish-${row.id}`"
                    @click="publishApprovedSubmission(submissionRow(row))"
                  >
                    发布
                  </el-button>
                  <span v-if="row.status !== 'pending' && row.status !== 'approved'" class="muted-action">无操作</span>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane :label="modifyTabLabel" name="modifies">
          <el-table v-loading="loading" :data="visibleModifyRequests" border empty-text="暂无改分申请">
            <el-table-column prop="course_id" label="课程号" min-width="120" />
            <el-table-column prop="semester" label="学期" min-width="120" />
            <el-table-column prop="student_name" label="学生" min-width="120">
              <template #default="{ row }">{{ row.student_name || row.student_id }}</template>
            </el-table-column>
            <el-table-column label="成绩项" min-width="150">
              <template #default="{ row }">{{ row.component_type }} / {{ row.component_sub_id }}</template>
            </el-table-column>
            <el-table-column label="原成绩" width="90">
              <template #default="{ row }">{{ row.original_score ?? "-" }}</template>
            </el-table-column>
            <el-table-column label="新成绩" width="90">
              <template #default="{ row }">{{ row.new_score ?? "-" }}</template>
            </el-table-column>
            <el-table-column prop="reason" label="原因" min-width="220" show-overflow-tooltip />
            <el-table-column prop="applicant_name" label="申请人" min-width="120" />
            <el-table-column label="状态" width="110">
              <template #default="{ row }">
                <el-tag :type="modifyStatusType(modifyRow(row).status)">{{ modifyStatusText(modifyRow(row).status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" min-width="230" fixed="right">
              <template #default="{ row }">
                <div class="table-actions">
                  <el-button
                    v-if="row.status === 'pending'"
                    size="small"
                    type="success"
                    :icon="Check"
                    :loading="actingId === `modify-approve-${row.id}`"
                    @click="reviewModify(modifyRow(row), 'approve')"
                  >
                    通过
                  </el-button>
                  <el-button
                    v-if="row.status === 'pending'"
                    size="small"
                    type="danger"
                    :icon="Close"
                    :loading="actingId === `modify-reject-${row.id}`"
                    @click="reviewModify(modifyRow(row), 'reject')"
                  >
                    驳回
                  </el-button>
                  <el-button size="small" @click="openModifyLogs(modifyRow(row))">查看日志</el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </section>

    <el-dialog v-model="logDialogVisible" title="改分申请日志" width="900px">
      <el-table v-loading="logLoading" :data="modifyLogs" border empty-text="暂无日志记录">
        <el-table-column prop="operator_name" label="操作人" min-width="120" />
        <el-table-column prop="operator_role" label="角色" min-width="100" />
        <el-table-column prop="operation_type" label="动作" min-width="150" />
        <el-table-column prop="before_value" label="修改前" min-width="180" show-overflow-tooltip />
        <el-table-column prop="after_value" label="修改后" min-width="180" show-overflow-tooltip />
        <el-table-column prop="created_at" label="时间" min-width="170" show-overflow-tooltip />
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup lang="ts" name="scoreChangeApproval">
import { computed, onMounted, ref } from "vue";
import { Check, Close, Promotion, Refresh } from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import type { Score } from "@/api/interface/score";
import {
  approveModifyRequest,
  approveSubmission,
  getGradeCourses,
  getGradeSubmissions,
  getModifyRequestLogs,
  getModifyRequests,
  publishSubmission,
  refreshGpa,
  rejectModifyRequest,
  rejectSubmission,
  getScoreUserId
} from "@/api/modules/score";
import { useUserStore } from "@/stores/modules/user";
import { courseOptionLabel, semesterOptionsForCourse, uniqueCourseOptions } from "@/views/stss/score/_shared/courseSelection";

type ReviewAction = "approve" | "reject";

const userStore = useUserStore();
const courses = ref<Score.Course[]>([]);
const submissions = ref<Score.Submission[]>([]);
const modifyRequests = ref<Score.ModifyRequest[]>([]);
const modifyLogs = ref<Score.ModifyRequestLog[]>([]);
const selectedCourseKey = ref("");
const selectedSemester = ref("");
const courseOptions = computed(() => uniqueCourseOptions(courses.value));
const filterCourseId = computed(() => selectedCourseKey.value);
const filterSemester = computed(() => selectedSemester.value);
const modifyStatus = ref("pending");
const activeTab = ref("submissions");
const loading = ref(false);
const logLoading = ref(false);
const refreshingGpa = ref(false);
const logDialogVisible = ref(false);
const actingId = ref("");

const semesterOptions = computed(() => semesterOptionsForCourse(courses.value, filterCourseId.value));

const pendingModifyCount = computed(() => modifyRequests.value.filter(item => item.status === "pending").length);

const modifyTabLabel = computed(() =>
  pendingModifyCount.value > 0 ? `改分审批（${pendingModifyCount.value} 待办）` : "改分审批"
);

const visibleModifyRequests = computed(() => modifyRequests.value);

const submissionRow = (row: unknown) => row as Score.Submission;
const modifyRow = (row: unknown) => row as Score.ModifyRequest;

const reviewerPayload = (opinion: string) => ({
  reviewer_id: getScoreUserId(),
  reviewer_name: userStore.userInfo.name || "管理员",
  opinion
});

const loadCourses = async () => {
  const resp = await getGradeCourses();
  courses.value = resp.data.courses;
};

const loadSubmissions = async () => {
  const resp = await getGradeSubmissions({
    course_id: filterCourseId.value || undefined,
    semester: filterSemester.value || undefined
  });
  submissions.value = resp.data.submissions;
};

const loadModifyRequests = async () => {
  const resp = await getModifyRequests({
    course_id: filterCourseId.value || undefined,
    semester: filterSemester.value || undefined,
    status: modifyStatus.value || undefined,
    page_size: 100
  });
  modifyRequests.value = resp.data.requests;
  if (pendingModifyCount.value > 0 && activeTab.value === "submissions") {
    activeTab.value = "modifies";
  }
};

const loadApprovalData = async () => {
  loading.value = true;
  try {
    await Promise.all([loadSubmissions(), loadModifyRequests()]);
  } finally {
    loading.value = false;
  }
};

const reloadAll = async () => {
  loading.value = true;
  try {
    await loadCourses();
    await Promise.all([loadSubmissions(), loadModifyRequests()]);
  } finally {
    loading.value = false;
  }
};

const handleCourseChange = () => {
  if (selectedSemester.value && !semesterOptions.value.includes(selectedSemester.value)) {
    selectedSemester.value = "";
  }
  loadApprovalData();
};

const askOpinion = async (title: string, placeholder: string) => {
  try {
    const { value } = await ElMessageBox.prompt(placeholder, title, {
      confirmButtonText: "确认",
      cancelButtonText: "取消",
      inputType: "textarea",
      inputPlaceholder: placeholder
    });
    return String(value || "");
  } catch {
    return null;
  }
};

const reviewSubmission = async (row: Score.Submission, action: ReviewAction) => {
  const opinion = await askOpinion(action === "approve" ? "通过成绩提交" : "驳回成绩提交", "请输入审批意见");
  if (opinion === null) return;
  actingId.value = `submission-${action}-${row.id}`;
  try {
    if (action === "approve") await approveSubmission(row.id, reviewerPayload(opinion));
    else await rejectSubmission(row.id, reviewerPayload(opinion));
    ElMessage.success(action === "approve" ? "已通过成绩提交" : "已驳回成绩提交");
    await loadSubmissions();
  } finally {
    actingId.value = "";
  }
};

const publishApprovedSubmission = async (row: Score.Submission) => {
  try {
    await ElMessageBox.confirm("发布后学生端才能查询到该课程成绩。", "发布成绩", { type: "warning" });
  } catch {
    return;
  }
  actingId.value = `submission-publish-${row.id}`;
  try {
    const resp = await publishSubmission(row.id);
    ElMessage.success(`发布完成：${resp.data.published_count} 条成绩已发布`);
    await loadSubmissions();
  } finally {
    actingId.value = "";
  }
};

const reviewModify = async (row: Score.ModifyRequest, action: ReviewAction) => {
  const opinion = await askOpinion(action === "approve" ? "通过改分申请" : "驳回改分申请", "请输入审批意见");
  if (opinion === null) return;
  actingId.value = `modify-${action}-${row.id}`;
  try {
    if (action === "approve") await approveModifyRequest(row.id, reviewerPayload(opinion));
    else await rejectModifyRequest(row.id, reviewerPayload(opinion));
    ElMessage.success(action === "approve" ? "已通过改分申请" : "已驳回改分申请");
    await loadModifyRequests();
  } finally {
    actingId.value = "";
  }
};

const openModifyLogs = async (row: Score.ModifyRequest) => {
  logDialogVisible.value = true;
  logLoading.value = true;
  try {
    const resp = await getModifyRequestLogs(row.id);
    modifyLogs.value = resp.data.logs;
  } finally {
    logLoading.value = false;
  }
};

const handleRefreshGpa = async () => {
  if (!filterCourseId.value || !filterSemester.value) return;
  refreshingGpa.value = true;
  try {
    const resp = await refreshGpa({
      course_id: filterCourseId.value,
      semester: filterSemester.value
    });
    ElMessage.success(`GPA 刷新请求已提交，影响学生数：${resp.data.refreshed_count ?? resp.data.refreshed ?? 0}`);
  } finally {
    refreshingGpa.value = false;
  }
};

const submissionStatusType = (status: string) => {
  if (status === "published") return "success";
  if (status === "approved") return "success";
  if (status === "rejected") return "danger";
  return "warning";
};

const submissionStatusText = (status: string) => {
  if (status === "pending") return "待审批";
  if (status === "approved") return "待发布";
  if (status === "published") return "已发布";
  if (status === "rejected") return "已驳回";
  return status;
};

const modifyStatusType = (status: string) => {
  if (status === "approved") return "success";
  if (status === "rejected") return "danger";
  return "warning";
};

const modifyStatusText = (status: string) => {
  if (status === "pending") return "待审批";
  if (status === "approved") return "已通过";
  if (status === "rejected") return "已驳回";
  return status;
};

onMounted(reloadAll);
</script>

<style scoped lang="scss">
.approval-page {
  @include score-page;
}
.approval-header,
.approval-filters,
.approval-surface {
  @include score-card;
}
.approval-header {
  @include score-header;
}
.score-heading {
  display: flex;
  gap: 12px;
  align-items: center;
}
.brand-bar {
  @include score-brand-bar;
}
.eyebrow {
  @include score-eyebrow;
}
.approval-filters {
  @include score-filter-bar;

  gap: 10px;
  margin-top: 12px;
}
.filter-control {
  width: 260px;
}
.status-control {
  width: 160px;
}
.approval-surface {
  padding: 14px;
  margin-top: 12px;
}
.approval-surface :deep(.el-table) {
  @include score-table-theme;
}
.tab-hint {
  margin-bottom: 12px;
}
.table-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
.muted-action {
  color: var(--el-text-color-secondary);
}

@media (width <= 900px) {
  .approval-header {
    flex-direction: column;
    gap: 14px;
    align-items: flex-start;
  }
  .filter-control,
  .status-control {
    width: 100%;
  }
}
</style>
