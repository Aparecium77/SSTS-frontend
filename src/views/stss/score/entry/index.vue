<template>
  <div class="score-entry-page">
    <section class="entry-hero">
      <div class="hero-main">
        <div class="breadcrumb-line">当前位置：成绩管理 / <strong>成绩录入</strong></div>
        <div class="course-summary">
          <span>当前课程：{{ currentCourse?.course_name || selectedCourseId || "未选择" }}</span>
          <em v-if="selectedCourseId">({{ selectedCourseId }})</em>
          <i />
          <span>学期：{{ selectedSemester || "--" }}</span>
          <i />
          <span>学生人数：{{ rows.length || currentCourse?.student_count || 0 }}</span>
          <i />
          <span>成绩分项：{{ components.length }}</span>
          <i />
          <span>学分：{{ currentCourse?.credit ?? "--" }}</span>
          <i />
          <span>
            课程状态：
            <el-tag :type="courseWorkflowTagType" size="small" effect="light">{{ courseWorkflowLabel }}</el-tag>
          </span>
        </div>
        <div class="hero-controls">
          <label>
            <span>课程名称：</span>
            <el-select
              v-model="selectedCourseKey"
              placeholder="选择课程"
              filterable
              class="hero-select"
              @change="handleCourseChange"
            >
              <el-option
                v-for="course in courses"
                :key="toCourseKey(course.course_id, course.semester)"
                :label="courseOptionLabel(course)"
                :value="toCourseKey(course.course_id, course.semester)"
              />
            </el-select>
          </label>
          <label>
            <span>学期合算数：</span>
            <el-select
              v-model="selectedSemester"
              placeholder="选择学期"
              filterable
              class="semester-select"
              @change="handleSemesterChange"
            >
              <el-option v-for="semester in semesterOptions" :key="semester" :label="semester" :value="semester" />
            </el-select>
          </label>
        </div>
        <div class="hero-metrics">
          <div class="metric-pill">
            <span>筛选结果</span>
            <strong>{{ filteredRows.length }}</strong>
          </div>
          <div class="metric-pill warn">
            <span>缺失项</span>
            <strong>{{ missingScoreCount }}</strong>
          </div>
          <div class="metric-pill calm">
            <span>锁定项</span>
            <strong>{{ lockedRecordCount }}</strong>
          </div>
          <div class="metric-pill" :class="{ danger: weightAbnormal }">
            <span>总权重</span>
            <strong>{{ totalWeight }}%</strong>
          </div>
        </div>
      </div>
      <div class="hero-side">
        <el-steps :active="activeStep" align-center finish-status="success" process-status="process" class="entry-steps">
          <el-step title="选择课程和学期" />
          <el-step title="配置分项权重" />
          <el-step title="录入/导入成绩" />
          <el-step title="计算并提交审批" />
        </el-steps>
        <div class="hero-reset">
          <el-button
            type="danger"
            plain
            size="small"
            :disabled="!selectedCourseId || !selectedSemester"
            :loading="resettingWorkflow"
            @click="handleWorkflowReset(false)"
          >
            重置本课（回到配权重前）
          </el-button>
          <el-button
            size="small"
            :disabled="!selectedCourseId || !selectedSemester || !components.length"
            :loading="resettingWorkflow"
            @click="handleWorkflowReset(true)"
          >
            仅清成绩与审批
          </el-button>
          <span class="reset-hint">保留名册；用于本地联调，生产环境请慎用</span>
        </div>
      </div>
    </section>

    <section v-if="!selectedCourseId || !selectedSemester" class="empty-panel">
      <el-empty description="请选择课程和学期后开始录入成绩" />
    </section>

    <template v-else>
      <el-alert
        v-if="currentCourseWorkflowStatus === 'submitted'"
        class="workflow-alert"
        type="info"
        :closable="false"
        show-icon
        title="当前课程成绩已提交，状态：审批中。审批完成前不可再次提交或编辑成绩。"
      />
      <el-alert class="flow-guide" type="info" :closable="true" show-icon>
        <template #title>成绩录入在做什么？</template>
        <ol class="flow-guide-list">
          <li>
            <strong>分项与权重（左侧配置区）</strong>：只填「叫什么、占多少 %、分数从哪来」，不在这里填具体分数。权重合计 100%。
          </li>
          <li>
            <strong>录入分数（下方表格 / 导入）</strong>：来源选「手工录入」→ 表格或 Excel；选「考试/论坛系统」→
            在权重区选好对应活动后点「拉取」，或用上方「导入成绩」批量拉取。
          </li>
          <li>
            <strong>考试/论坛活动</strong>：在权重区「对应活动」列选择（如
            quiz1），保存配置后拉取；同一课可有多个考试分项，各选各的活动。
          </li>
          <li><strong>计算检查 → 提交审批</strong>：确认无缺项后提交。</li>
        </ol>
      </el-alert>
      <section class="entry-grid">
        <div class="panel filter-panel">
          <div class="panel-title">
            <span>筛选学生</span>
            <small>课程与学期请在页头选择</small>
          </div>
          <div class="filter-stats">
            <span>
              本课学生：<strong>{{ rows.length }}</strong>
            </span>
          </div>
          <div class="status-filter">
            <span>状态筛选</span>
            <el-radio-group v-model="statusFilter">
              <el-radio-button label="all">全部</el-radio-button>
              <el-radio-button label="unsaved">未保存</el-radio-button>
              <el-radio-button label="draft">已保存未提交</el-radio-button>
              <el-radio-button label="submitted">审批中</el-radio-button>
              <el-radio-button label="approved">已审批</el-radio-button>
              <el-radio-button label="abnormal">异常</el-radio-button>
            </el-radio-group>
          </div>
          <div class="student-search">
            <label>学生搜索</label>
            <el-input v-model="studentKeyword" :prefix-icon="Search" placeholder="学号/姓名" clearable />
          </div>
          <p v-if="courseScopeTip" class="scope-tip">*后端课程列表暂未按教师过滤，不能作为权限边界*</p>
        </div>

        <div class="panel config-panel">
          <div class="panel-title">
            <span>成绩分项与权重</span>
            <div class="config-actions">
              <small :class="{ danger: weightAbnormal }">当前总权重 {{ totalWeight }}%</small>
              <el-button size="small" @click="addConfigItem">新增分项</el-button>
              <el-button size="small" @click="resetConfigDrafts">重置</el-button>
              <el-button
                size="small"
                type="primary"
                :loading="savingConfig"
                :disabled="!selectedCourseId || !selectedSemester || !configDrafts.length"
                @click="saveComponentConfig"
              >
                保存配置
              </el-button>
            </div>
          </div>
          <p class="config-hint">
            此处<strong>只配置分项名称、权重、成绩来源</strong>，不在此录入分数。考试/论坛分项请在「对应活动」选好活动（保存后可用「拉取」或上方「导入成绩」）。
          </p>
          <div v-if="configDrafts.length" class="component-list">
            <div class="component-row component-row--head">
              <span>分项名称</span>
              <span>对应活动</span>
              <span>权重%</span>
              <span>成绩来源</span>
              <span>拉取</span>
              <span />
            </div>
            <div v-for="item in configDrafts" :key="item.local_id" class="component-row component-item editable">
              <el-input
                v-model="item.component_type"
                class="config-field-short"
                placeholder="平时"
                :disabled="item.is_locked === 1"
              />
              <el-input
                v-if="item.data_source === 'manual'"
                v-model="item.component_sub_id"
                class="config-field-short"
                placeholder="备注可选"
                :disabled="item.is_locked === 1"
              />
              <el-select
                v-else-if="item.data_source === 'exam'"
                v-model="item.component_sub_id"
                class="config-field-activity"
                filterable
                allow-create
                default-first-option
                placeholder="选择考试"
                :disabled="item.is_locked === 1"
              >
                <el-option v-for="opt in examExternalOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
              </el-select>
              <el-select
                v-else
                v-model="item.component_sub_id"
                class="config-field-activity"
                filterable
                allow-create
                default-first-option
                placeholder="选择论坛"
                :disabled="item.is_locked === 1"
              >
                <el-option v-for="opt in forumExternalOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
              </el-select>
              <el-input-number
                v-model="item.weight"
                class="config-weight-input"
                :min="0"
                :max="100"
                :precision="1"
                :disabled="item.is_locked === 1"
              />
              <el-select
                v-model="item.data_source"
                class="config-field-source"
                placeholder="来源"
                :disabled="item.is_locked === 1"
                @change="onDataSourceChange(item)"
              >
                <el-option label="手工录入" value="manual" />
                <el-option label="考试系统" value="exam" />
                <el-option label="论坛系统" value="forum" />
              </el-select>
              <el-button
                v-if="item.data_source === 'exam' || item.data_source === 'forum'"
                link
                type="primary"
                size="small"
                class="config-pull-btn"
                :disabled="!canOperateCourse || item.is_locked === 1"
                :loading="externalImportingKey === item.local_id"
                @click="handleConfigRowImport(item)"
              >
                拉取
              </el-button>
              <span v-else class="config-pull-placeholder">—</span>
              <el-button link type="danger" :disabled="item.is_locked === 1" @click="removeConfigItem(item.local_id)">
                删除
              </el-button>
            </div>
          </div>
          <el-empty v-else class="mini-empty" description="暂无成绩项配置，可先新增分项后保存" />
          <el-alert
            v-if="configLocked"
            class="weight-alert"
            type="info"
            :closable="false"
            show-icon
            title="当前课程已有锁定成绩项，后端不允许修改配置。"
          />
          <el-alert
            v-if="weightAbnormal"
            class="weight-alert"
            type="warning"
            :closable="false"
            show-icon
            :title="`Warning: 权重配置异常！当前总权重为 ${totalWeight}%`"
          />
        </div>

        <aside class="panel exception-panel">
          <div class="panel-title">
            <span>批量与异常检查面板</span>
            <small>录入前后都应检查</small>
          </div>
          <div class="exception-list">
            <div class="exception-item warn">
              <span>缺失成绩数量：</span>
              <strong>{{ missingScoreCount }}</strong>
            </div>
            <div class="exception-item danger">
              <span>分数超范围数量：</span>
              <strong>{{ outOfRangeCount }}</strong>
            </div>
            <div class="exception-item danger">
              <span>权重配置异常：</span>
              <strong>{{ weightAbnormal ? "是" : "否" }}</strong>
              <el-button link type="primary" @click="focusConfig">配置</el-button>
            </div>
            <div class="exception-item warn">
              <span>导入失败记录：</span>
              <strong>{{ importFailCount }}</strong>
              <el-button link type="primary" @click="showImportLog">看日志</el-button>
            </div>
            <div class="exception-item muted">
              <span>已锁定记录数量：</span>
              <strong>{{ lockedRecordCount }}</strong>
            </div>
          </div>
          <div class="exception-actions">
            <el-button :icon="Aim" @click="locateAbnormal">定位异常单元格</el-button>
            <el-button @click="showMissingDetail">查看缺失明细</el-button>
            <el-button :icon="Download" @click="showImportLog">下载导入日志</el-button>
          </div>
        </aside>
      </section>

      <section class="panel table-panel">
        <div class="table-head">
          <div>
            <h3>成绩录入主表格</h3>
            <p>
              {{ filteredRows.length }} / {{ rows.length }} 名学生 ·
              「手工录入」列可改分；「考试/论坛」列在权重区配置活动后拉取或「导入成绩」写入
            </p>
          </div>
          <el-alert
            v-if="weightAbnormal"
            class="table-alert"
            type="warning"
            :closable="false"
            show-icon
            :title="`Warning: 权重配置异常！当前总权重不为 100%（当前为 ${totalWeight}%）`"
          />
        </div>

        <div class="batch-actions">
          <span class="batch-label">操作</span>
          <el-button :icon="Refresh" :loading="loading" @click="reloadAll">刷新</el-button>
          <el-upload
            ref="excelUploadRef"
            class="excel-upload-hidden"
            action=""
            :auto-upload="false"
            :show-file-list="false"
            :on-change="handleExcelChange"
            accept=".xlsx,.xls"
          />
          <el-dropdown trigger="click" :disabled="!canOperateCourse" @command="handleImportCommand">
            <el-button :icon="Upload" :loading="Boolean(externalImportingSource) || importing">
              导入成绩
              <span v-if="!hasExternalComponents" class="import-hint">（Excel）</span>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="excel">Excel 导入（手工分项）</el-dropdown-item>
                <el-dropdown-item command="exam" divided :disabled="!hasExamComponents"> 从考试系统拉取 </el-dropdown-item>
                <el-dropdown-item command="forum" :disabled="!hasForumComponents">从论坛系统拉取</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-button :disabled="!filteredRows.length" :loading="savingDraft" @click="saveVisibleDrafts">保存草稿</el-button>
          <el-button :icon="Operation" :disabled="!canOperateCourse" :loading="calculating" @click="handleCalculate">
            计算检查
          </el-button>
          <el-tooltip :disabled="!submitDisabledReason" :content="submitDisabledReason" placement="top">
            <span class="submit-action-wrapper">
              <el-button
                type="primary"
                :icon="Promotion"
                :disabled="!canOperateCourse || Boolean(submitDisabledReason)"
                :loading="submitting"
                @click="handleSubmit"
              >
                提交审批
              </el-button>
            </span>
          </el-tooltip>
        </div>

        <el-table
          ref="tableRef"
          v-loading="loading"
          :data="filteredRows"
          border
          height="calc(100vh - 588px)"
          empty-text="暂无学生或成绩记录"
          row-key="student_id"
          :row-class-name="tableRowClassName"
          class="entry-table"
        >
          <el-table-column type="selection" width="46" fixed />
          <el-table-column prop="student_no" label="学号" min-width="120" fixed />
          <el-table-column prop="student_name" label="姓名" min-width="108" fixed />
          <el-table-column prop="major" label="专业" min-width="150" show-overflow-tooltip />
          <el-table-column v-for="component in components" :key="component.id" min-width="178">
            <template #header>
              <div class="component-head">
                <span>{{ component.component_type }}</span>
                <small>{{ component.weight }}% · {{ dataSourceHint(component.data_source) }}</small>
              </div>
            </template>
            <template #default="{ row }">
              <div class="score-input-wrap" :class="{ readonly: isCellReadonly(entryRow(row), component) }">
                <el-input-number
                  v-model="row.draftScores[component.id]"
                  :min="0"
                  :max="100"
                  :precision="1"
                  :step="1"
                  controls-position="right"
                  :disabled="isCellReadonly(entryRow(row), component)"
                />
                <el-icon v-if="isCellReadonly(entryRow(row), component)" class="cell-lock"><Lock /></el-icon>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="总评预览" min-width="112" align="center">
            <template #default="{ row }">
              <strong>{{ formatScore(rowPreview(entryRow(row))) }}</strong>
            </template>
          </el-table-column>
          <el-table-column label="总评成绩" min-width="112" align="center">
            <template #default="{ row }">
              <strong>{{ formatScore(rowTotal(entryRow(row))) }}</strong>
            </template>
          </el-table-column>
          <el-table-column label="状态" min-width="112" align="center" sortable>
            <template #default="{ row }">
              <el-tag round :type="rowStatusType(entryRow(row))" class="status-tag">{{ rowStatusLabel(entryRow(row)) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" min-width="190" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" :loading="savingCell === entryRow(row).student_id" @click="saveRow(entryRow(row))">
                保存本行
              </el-button>
              <el-button v-if="rowHasLocked(entryRow(row))" link type="primary" @click="requestUnlock(entryRow(row))">
                解锁记录
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </section>

      <el-dialog v-model="excelImportDialogVisible" title="Excel 导入" width="520px">
        <div class="excel-import-dialog">
          <p>文件：{{ pendingExcelImport?.name || "未选择文件" }}</p>
          <el-select v-model="selectedExcelComponentId" placeholder="选择导入目标成绩项" class="mapping-component">
            <el-option
              v-for="component in excelImportComponents"
              :key="component.id"
              :label="excelImportComponentLabel(component)"
              :value="component.id"
            />
          </el-select>
        </div>
        <template #footer>
          <el-button @click="excelImportDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="importing" @click="confirmExcelImport">开始导入</el-button>
        </template>
      </el-dialog>
    </template>
  </div>
</template>

<script setup lang="ts" name="scoreEntry">
import { computed, onMounted, ref } from "vue";
import { Aim, Download, Lock, Operation, Promotion, Refresh, Search, Upload } from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import type { UploadFile } from "element-plus";
import type { Score } from "@/api/interface/score";
import {
  batchCreateGradeRecords,
  calculatePreview,
  createGradeRecord,
  getCourseRecords,
  getGradeConfig,
  getGradeCourses,
  resetCourseWorkflow,
  importExamScores,
  importForumScores,
  importGradeExcel,
  saveGradeConfig,
  submitCourseGrades,
  updateGradeRecord,
  upsertExternalMappings
} from "@/api/modules/score";
import { courseOptionLabel, parseCourseKey, toCourseKey } from "@/views/stss/score/_shared/courseSelection";

type EntryRow = Score.GradeRecordRow & {
  total_score: number | null;
  workflow_status: string;
  submitted_at?: string | null;
  approved_at?: string | null;
  published_at?: string | null;
  draftScores: Record<number, number | null>;
};

type StatusFilter = "all" | "unsaved" | "draft" | "submitted" | "approved" | "abnormal";
type ExternalSource = "exam" | "forum";

type ConfigDraftItem = {
  local_id: string;
  id?: number;
  component_type: string;
  component_sub_id: string;
  weight: number;
  data_source: Score.DataSource;
  is_locked: 0 | 1;
};

type PendingExcelImport = {
  file: File;
  name: string;
};

const courses = ref<Score.Course[]>([]);
const components = ref<Score.GradeComponent[]>([]);
const configDrafts = ref<ConfigDraftItem[]>([]);
const rows = ref<EntryRow[]>([]);
const selectedCourseKey = ref("");
const selectedSemester = ref("");
const selectedCourseId = computed(() => parseCourseKey(selectedCourseKey.value).courseId);
const statusFilter = ref<StatusFilter>("all");
const studentKeyword = ref("");
const loading = ref(false);
const importing = ref(false);
const calculating = ref(false);
const submitting = ref(false);
const savingDraft = ref(false);
const savingCell = ref("");
const savingConfig = ref(false);
const resettingWorkflow = ref(false);
const externalImportingSource = ref<ExternalSource | "">("");
const externalImportingKey = ref("");
const importFailCount = ref(0);
const excelImportDialogVisible = ref(false);
const excelUploadRef = ref();
const pendingExcelImport = ref<PendingExcelImport | null>(null);
const selectedExcelComponentId = ref<number | null>(null);
const currentSubmissionStatus = ref("draft");

let localSeed = 0;

const examExternalOptions = [
  { label: "测验 quiz1", value: "quiz1" },
  { label: "测验 quiz2", value: "quiz2" },
  { label: "期中 midterm", value: "midterm" },
  { label: "期末 final", value: "final" }
];

const forumExternalOptions = [
  { label: "论坛活跃 forum_activity_1", value: "forum_activity_1" },
  { label: "论坛发帖 forum_posts", value: "forum_posts" }
];

const entryRow = (row: unknown) => row as EntryRow;

const normalizeWorkflowStatus = (status?: string | null) => {
  if (!status) return "draft";
  if (status === "published") return "published";
  if (status === "approved") return "approved";
  if (status === "pending" || status === "submitted") return "submitted";
  if (status === "rejected") return "rejected";
  return status;
};
const nextLocalId = () => `local-${Date.now()}-${localSeed++}`;

const semesterOptions = computed(() => {
  const semesters = courses.value
    .filter(course => !selectedCourseId.value || course.course_id === selectedCourseId.value)
    .map(course => course.semester);
  return Array.from(new Set(semesters));
});

const currentCourse = computed(() =>
  courses.value.find(course => course.course_id === selectedCourseId.value && course.semester === selectedSemester.value)
);

const canOperateCourse = computed(() => Boolean(selectedCourseId.value && selectedSemester.value && components.value.length));
const currentCourseWorkflowStatus = computed(() => {
  if (currentSubmissionStatus.value && currentSubmissionStatus.value !== "draft") {
    return normalizeWorkflowStatus(currentSubmissionStatus.value);
  }
  const statuses = rows.value.map(row => normalizeWorkflowStatus(row.workflow_status));
  if (statuses.includes("published")) return "published";
  if (statuses.includes("approved")) return "approved";
  if (statuses.includes("submitted")) return "submitted";
  if (statuses.includes("rejected")) return "rejected";
  return statuses[0] || "draft";
});

const courseWorkflowLabel = computed(() => {
  const status = currentCourseWorkflowStatus.value;
  if (status === "submitted") return "审批中";
  if (status === "approved") return "已审批";
  if (status === "published") return "已发布";
  if (status === "rejected") return "已驳回";
  return "录入中";
});

const courseWorkflowTagType = computed(() => {
  const status = currentCourseWorkflowStatus.value;
  if (status === "submitted") return "primary";
  if (status === "approved" || status === "published") return "success";
  if (status === "rejected") return "danger";
  return "info";
});
const hasUnsavedDraftChanges = computed(() =>
  rows.value.some(row =>
    components.value.some(component => {
      const record = row.records[component.id];
      const draft = row.draftScores[component.id];
      const saved = record?.score ?? null;
      if (draft === null || draft === undefined) return false;
      if (saved === null || saved === undefined) return true;
      return Number(draft) !== Number(saved);
    })
  )
);

const submitDisabledReason = computed(() => {
  if (!canOperateCourse.value) return "请先选择课程和学期，并确保当前课程已有成绩项。";
  if (weightAbnormal.value) return "总权重须为 100% 后再提交审批。";
  if (currentCourseWorkflowStatus.value === "published" || currentCourseWorkflowStatus.value === "approved") {
    return "该课程已有历史总评，不能重复提交，请走改分申请流程。";
  }
  if (currentCourseWorkflowStatus.value === "submitted") {
    return "该课程正在审批中，请等待审批结果。";
  }
  if (hasUnsavedDraftChanges.value) return "表格有未保存的修改，请先保存草稿或保存本行。";
  if (missingScoreCount.value > 0) return `尚有 ${missingScoreCount.value} 项成绩未录入，请补全并保存后再提交。`;
  if (outOfRangeCount.value > 0) return "存在超出 0–100 分的成绩，请修正后再提交。";
  return "";
});
const courseScopeTip = computed(() => Boolean(courses.value.length));
const totalWeight = computed(() => configDrafts.value.reduce((sum, component) => sum + Number(component.weight || 0), 0));
const weightAbnormal = computed(() => configDrafts.value.length > 0 && totalWeight.value !== 100);
const configLocked = computed(() => configDrafts.value.some(item => item.is_locked === 1));

const activeStep = computed(() => {
  if (!selectedCourseId.value || !selectedSemester.value) return 0;
  const workflow = currentCourseWorkflowStatus.value;
  if (workflow === "submitted" || workflow === "approved" || workflow === "published") return 3;
  if (!components.value.length || weightAbnormal.value) return 1;
  if (calculating.value || submitting.value) return 3;
  return 2;
});

const hasExamComponents = computed(() => components.value.some(component => component.data_source === "exam"));
const hasForumComponents = computed(() => components.value.some(component => component.data_source === "forum"));
const hasExternalComponents = computed(() => hasExamComponents.value || hasForumComponents.value);

const missingScoreCount = computed(() =>
  rows.value.reduce(
    (sum, row) =>
      sum +
      components.value.filter(component => row.draftScores[component.id] === null || row.draftScores[component.id] === undefined)
        .length,
    0
  )
);

const outOfRangeCount = computed(() =>
  rows.value.reduce(
    (sum, row) =>
      sum +
      components.value.filter(component => {
        const score = row.draftScores[component.id];
        return score !== null && score !== undefined && (score < 0 || score > 100);
      }).length,
    0
  )
);

const lockedRecordCount = computed(() =>
  rows.value.reduce(
    (sum, row) => sum + components.value.filter(component => row.records[component.id]?.is_locked || component.is_locked).length,
    0
  )
);

const filteredRows = computed(() => {
  const keyword = studentKeyword.value.trim().toLowerCase();
  return rows.value.filter(row => {
    const matchesKeyword =
      !keyword || row.student_no.toLowerCase().includes(keyword) || (row.student_name || "").toLowerCase().includes(keyword);
    if (!matchesKeyword) return false;

    if (statusFilter.value === "all") return true;
    if (statusFilter.value === "abnormal") return rowMissingCount(row) > 0 || rowOutOfRangeCount(row) > 0 || weightAbnormal.value;
    return rowStatus(row) === statusFilter.value;
  });
});

const excelImportComponents = computed(() =>
  components.value.filter(component => component.data_source === "manual" && component.is_locked !== 1)
);
const excelImportComponentLabel = (component: Score.GradeComponent) =>
  `${component.component_type}${component.component_sub_id ? ` / ${component.component_sub_id}` : ""} / ${component.weight}%`;

const dataSourceHint = (source: string) => {
  if (source === "manual") return "表格或 Excel 录入";
  if (source === "exam") return "导入成绩 → 从考试系统拉取";
  if (source === "forum") return "导入成绩 → 从论坛系统拉取";
  return "";
};

const onDataSourceChange = (item: ConfigDraftItem) => {
  if (item.data_source === "exam" && !item.component_sub_id.trim()) {
    item.component_sub_id = "quiz1";
  }
  if (item.data_source === "forum" && !item.component_sub_id.trim()) {
    item.component_sub_id = "forum_activity_1";
  }
};

const normalizeSheetRecords = (row: Score.GradeSheetRow) => row.records ?? row.component_scores ?? [];

const createConfigDraft = (component?: Partial<Score.GradeComponent>): ConfigDraftItem => ({
  local_id: nextLocalId(),
  id: component?.id,
  component_type: component?.component_type || "",
  component_sub_id: component?.component_sub_id || "",
  weight: Number(component?.weight ?? 0),
  data_source: component?.data_source || "manual",
  is_locked: component?.is_locked ?? 0
});

const syncConfigDrafts = (configItems: Score.GradeComponent[]) => {
  configDrafts.value = configItems.map(item => createConfigDraft(item));
};

const resetExcelImportState = () => {
  pendingExcelImport.value = null;
  selectedExcelComponentId.value = excelImportComponents.value.length === 1 ? excelImportComponents.value[0].id : null;
};

const snapshotManualDraftScores = () => {
  const snap = new Map<string, Record<number, number | null>>();
  for (const row of rows.value) {
    const manual: Record<number, number | null> = {};
    for (const component of components.value) {
      if (component.data_source !== "manual") continue;
      const score = row.draftScores[component.id];
      if (score !== null && score !== undefined) {
        manual[component.id] = score;
      }
    }
    if (Object.keys(manual).length) snap.set(row.student_id, manual);
  }
  return snap;
};

const restoreManualDraftScores = (builtRows: EntryRow[], snap: Map<string, Record<number, number | null>>) => {
  if (!snap.size) return builtRows;
  return builtRows.map(row => {
    const manual = snap.get(row.student_id);
    if (!manual) return row;
    for (const [componentId, score] of Object.entries(manual)) {
      const id = Number(componentId);
      const component = components.value.find(item => item.id === id);
      if (component?.data_source !== "manual") continue;
      if (row.draftScores[id] === null || row.draftScores[id] === undefined) {
        row.draftScores[id] = score;
      }
    }
    return row;
  });
};

const reloadEntryData = async (successMessage?: string) => {
  const manualSnap = snapshotManualDraftScores();
  try {
    await loadEntryData();
    if (manualSnap.size) {
      rows.value = restoreManualDraftScores(rows.value, manualSnap);
    }
  } catch (error: any) {
    if (successMessage) {
      ElMessage.warning(successMessage);
      return;
    }
    throw error;
  }
};

const buildRows = (sheetRows: Score.GradeSheetRow[], configItems: Score.GradeComponent[]): EntryRow[] =>
  sheetRows.map(sheetRow => {
    const records: Record<number, Score.GradeRecord> = {};
    const draftScores: Record<number, number | null> = {};
    const rawRecords = normalizeSheetRecords(sheetRow);
    const recordsByComponent = new Map(rawRecords.map(record => [record.component_config_id, record]));

    configItems.forEach(component => {
      const rawRecord = recordsByComponent.get(component.id);
      draftScores[component.id] = rawRecord?.score ?? null;
      if (!rawRecord?.grade_record_id && !rawRecord?.id) return;
      records[component.id] = {
        id: Number(rawRecord.grade_record_id ?? rawRecord.id ?? 0),
        student_id: sheetRow.student_id,
        student_no: sheetRow.student_no,
        course_id: sheetRow.course_id,
        semester: sheetRow.semester,
        component_config_id: component.id,
        component_type: rawRecord.component_type,
        component_sub_id: rawRecord.component_sub_id,
        score: rawRecord.score,
        version_no: Number(rawRecord.version_no ?? 0),
        result_type: "normal",
        status: rawRecord.status ?? sheetRow.status,
        is_locked: rawRecord.is_locked ?? 0,
        data_source: rawRecord.data_source,
        created_at: rawRecord.recorded_at ?? "",
        updated_at: rawRecord.updated_at ?? ""
      };
    });

    return {
      student_id: sheetRow.student_id,
      student_no: sheetRow.student_no,
      student_name: sheetRow.student_name,
      major: sheetRow.major,
      records,
      total_score: sheetRow.total_score ?? null,
      workflow_status: sheetRow.status || "draft",
      submitted_at: sheetRow.submitted_at,
      approved_at: sheetRow.approved_at,
      published_at: sheetRow.published_at,
      draftScores
    };
  });

const loadCourses = async () => {
  const resp = await getGradeCourses();
  courses.value = resp.data.courses;
  if (!selectedCourseKey.value && courses.value.length) {
    const first = courses.value[0];
    selectedCourseKey.value = toCourseKey(first.course_id, first.semester);
    selectedSemester.value = first.semester;
  }
};

const loadEntryData = async () => {
  if (!selectedCourseId.value || !selectedSemester.value) return;
  loading.value = true;
  try {
    const [configResp, gradebookResp] = await Promise.all([
      getGradeConfig(selectedCourseId.value, { semester: selectedSemester.value }),
      getCourseRecords(selectedCourseId.value, { semester: selectedSemester.value })
    ]);

    components.value = configResp.data.components;
    syncConfigDrafts(configResp.data.components);
    currentSubmissionStatus.value = gradebookResp.data.current_submission_status || "draft";
    rows.value = buildRows(gradebookResp.data.rows, configResp.data.components);
    if (!excelImportDialogVisible.value || !pendingExcelImport.value) {
      resetExcelImportState();
    }
  } finally {
    loading.value = false;
  }
};

const reloadAll = async () => {
  await loadCourses();
  await loadEntryData();
};

const handleCourseChange = () => {
  const { semester } = parseCourseKey(selectedCourseKey.value);
  if (semester) selectedSemester.value = semester;
  loadEntryData();
};

const handleSemesterChange = () => {
  if (selectedCourseId.value && selectedSemester.value) {
    selectedCourseKey.value = toCourseKey(selectedCourseId.value, selectedSemester.value);
  }
  loadEntryData();
};

const addConfigItem = () => {
  if (configLocked.value) {
    ElMessage.warning("当前课程配置已锁定，不能新增成绩项。");
    return;
  }
  configDrafts.value.push(createConfigDraft());
};

const removeConfigItem = (localId: string) => {
  const item = configDrafts.value.find(config => config.local_id === localId);
  if (!item) return;
  if (item.id) {
    ElMessage.warning("后端暂不支持删除已保存成绩项，请保留或联系后端补充删除能力。");
    return;
  }
  configDrafts.value = configDrafts.value.filter(config => config.local_id !== localId);
};

const resetConfigDrafts = () => {
  syncConfigDrafts(components.value);
};

const saveComponentConfig = async () => {
  if (!selectedCourseId.value || !selectedSemester.value) return;
  if (!configDrafts.value.length) {
    ElMessage.warning("请先新增至少一个成绩项。");
    return;
  }
  if (configLocked.value) {
    ElMessage.warning("当前课程配置已锁定，不能修改成绩项。");
    return;
  }
  if (weightAbnormal.value) {
    ElMessage.warning("保存前请先把总权重调整到 100%。");
    return;
  }

  const duplicateKeys = new Set<string>();
  const seenKeys = new Set<string>();
  for (const item of configDrafts.value) {
    if (!item.component_type.trim()) {
      ElMessage.warning("请填写每个成绩项的类型。");
      return;
    }
    const uniqueKey = `${item.component_type.trim()}::${item.component_sub_id.trim()}`;
    if (seenKeys.has(uniqueKey)) duplicateKeys.add(uniqueKey);
    seenKeys.add(uniqueKey);
  }
  if (duplicateKeys.size) {
    ElMessage.warning("成绩项类型与分项标识的组合不能重复。");
    return;
  }

  savingConfig.value = true;
  try {
    await saveGradeConfig(selectedCourseId.value, {
      semester: selectedSemester.value,
      components: configDrafts.value.map(item => ({
        component_type: item.component_type.trim(),
        component_sub_id: item.component_sub_id.trim(),
        weight: Number(item.weight),
        data_source: item.data_source
      }))
    });
    ElMessage.success("成绩项配置已保存。");
    await loadEntryData();
    await syncExternalMappingsFromComponents();
  } catch (error: any) {
    ElMessage.error(error?.msg || "成绩项配置保存失败。");
    await loadEntryData();
  } finally {
    savingConfig.value = false;
  }
};

const syncExternalMappingsFromComponents = async () => {
  if (!selectedCourseId.value || !selectedSemester.value) return;
  const mappings = components.value
    .filter(
      component =>
        (component.data_source === "exam" || component.data_source === "forum") && String(component.component_sub_id || "").trim()
    )
    .map(component => ({
      source_system: component.data_source as ExternalSource,
      external_id: String(component.component_sub_id).trim(),
      component_config_id: component.id
    }));
  if (!mappings.length) return;
  try {
    await upsertExternalMappings({
      course_id: selectedCourseId.value,
      semester: selectedSemester.value,
      mappings
    });
  } catch {
    /* 映射为辅助信息，保存配置已成功时不阻断主流程 */
  }
};

const importExternalForComponent = async (component: Score.GradeComponent, source: ExternalSource) => {
  if (!selectedCourseId.value || !selectedSemester.value) return 0;
  const payload: Score.ImportExternalScoresReq = {
    course_id: selectedCourseId.value,
    semester: selectedSemester.value,
    component_config_id: component.id,
    component_type: component.component_type,
    component_sub_id: String(component.component_sub_id || "").trim() || undefined
  };
  const resp = source === "exam" ? await importExamScores(payload) : await importForumScores(payload);
  return resp.data.imported;
};

const handleConfigRowImport = async (item: ConfigDraftItem) => {
  if (!selectedCourseId.value || !selectedSemester.value) return;
  if (!item.id) {
    ElMessage.warning("请先保存配置后再拉取该项成绩。");
    return;
  }
  if (item.data_source !== "exam" && item.data_source !== "forum") return;
  if (!item.component_sub_id.trim()) {
    ElMessage.warning("请先选择对应的考试/论坛活动。");
    return;
  }
  const component = components.value.find(c => c.id === item.id);
  if (!component) {
    ElMessage.warning("未找到该分项，请刷新后重试。");
    return;
  }

  const source = item.data_source as ExternalSource;
  externalImportingKey.value = item.local_id;
  try {
    const imported = await importExternalForComponent(component, source);
    ElMessage.success(`${source === "exam" ? "考试" : "论坛"}「${component.component_type}」已拉取 ${imported} 条。`);
    await reloadEntryData(`${source === "exam" ? "考试" : "论坛"}成绩已导入，但页面刷新失败，请手动刷新。`);
  } catch (error: any) {
    ElMessage.error(error?.msg || "拉取失败。");
  } finally {
    externalImportingKey.value = "";
  }
};

const cellKey = (row: EntryRow, component: Score.GradeComponent) => `${row.student_id}-${component.id}`;

const cellReadonlyReason = (row: EntryRow, component: Score.GradeComponent) => {
  const record = row.records[component.id];
  if (component.data_source !== "manual") return "外部来源成绩不能手工编辑";
  if (component.is_locked) return "成绩项已锁定";
  if (record?.is_locked) return "成绩记录已锁定";
  if (record?.status === "submitted" || record?.status === "pending") return "审批中的成绩不能编辑";
  if (record?.status === "approved") return "已审批成绩需走改分流程";
  return "";
};

const isCellReadonly = (row: EntryRow, component: Score.GradeComponent) => Boolean(cellReadonlyReason(row, component));

const rowRecords = (row: EntryRow) => components.value.map(component => row.records[component.id]).filter(Boolean);

const rowStatus = (row: EntryRow): StatusFilter => {
  if (row.workflow_status === "published" || row.workflow_status === "approved") return "approved";
  if (row.workflow_status === "submitted" || row.workflow_status === "pending") return "submitted";
  if (row.workflow_status === "draft") return "draft";
  const records = rowRecords(row);
  if (!records.length) return "unsaved";
  if (records.some(record => record.status === "approved")) return "approved";
  if (records.some(record => record.status === "submitted" || record.status === "pending")) return "submitted";
  if (records.some(record => record.status === "draft")) return "draft";
  return "unsaved";
};

const rowStatusLabel = (row: EntryRow) => {
  if (row.workflow_status === "published") return "已发布";
  if (row.workflow_status === "approved") return "已审批";
  if (row.workflow_status === "submitted" || row.workflow_status === "pending") return "审批中";
  if (row.workflow_status === "draft") return rowRecords(row).length ? "已保存未提交" : "未保存";
  return "未保存";
};

const rowStatusType = (row: EntryRow) => {
  if (row.workflow_status === "published" || row.workflow_status === "approved") return "success";
  if (row.workflow_status === "submitted" || row.workflow_status === "pending") return "primary";
  if (row.workflow_status === "draft") return rowRecords(row).length ? "warning" : "info";
  return "info";
};

const rowHasLocked = (row: EntryRow) =>
  components.value.some(component => row.records[component.id]?.is_locked || component.is_locked);

const rowMissingCount = (row: EntryRow) =>
  components.value.filter(component => row.draftScores[component.id] === null || row.draftScores[component.id] === undefined)
    .length;

const rowOutOfRangeCount = (row: EntryRow) =>
  components.value.filter(component => {
    const score = row.draftScores[component.id];
    return score !== null && score !== undefined && (score < 0 || score > 100);
  }).length;

const tableRowClassName = ({ row }: { row: EntryRow }) => {
  if (rowOutOfRangeCount(row) > 0) return "score-row-danger";
  if (rowMissingCount(row) > 0) return "score-row-warning";
  if (rowHasLocked(row)) return "score-row-locked";
  return "";
};

const rowTotal = (row: EntryRow) => row.total_score ?? null;

const rowPreview = (row: EntryRow) =>
  components.value.reduce((sum, component) => {
    const score = row.draftScores[component.id];
    if (score === null || score === undefined) return sum;
    return sum + (Number(score) * Number(component.weight || 0)) / 100;
  }, 0);

const formatScore = (score: number | null | undefined) => (score === null || score === undefined ? "-" : score.toFixed(2));

const saveCell = async (row: EntryRow, component: Score.GradeComponent) => {
  const key = cellKey(row, component);
  const score = row.draftScores[component.id];
  savingCell.value = key;
  try {
    const existing = row.records[component.id];
    if (existing?.id) {
      await updateGradeRecord(existing.id, {
        score,
        version_no: existing.version_no
      });
    } else {
      await createGradeRecord({
        student_id: row.student_id,
        course_id: selectedCourseId.value,
        semester: selectedSemester.value,
        component_config_id: component.id,
        score,
        result_type: "normal"
      });
    }
  } finally {
    savingCell.value = "";
  }
};

const saveRow = async (row: EntryRow) => {
  savingCell.value = row.student_id;
  try {
    const editableComponents = components.value.filter(component => !isCellReadonly(row, component));
    for (const component of editableComponents) {
      await saveCell(row, component);
    }
    ElMessage.success("该学生成绩已保存。");
    await reloadEntryData("保存已成功，但页面刷新失败，请手动刷新查看最新状态。");
  } catch (error: any) {
    ElMessage.error(error?.msg || "保存学生成绩失败。");
  } finally {
    savingCell.value = "";
  }
};

const saveVisibleDrafts = async () => {
  savingDraft.value = true;
  try {
    let saveGroups = 0;
    for (const component of components.value) {
      const records = filteredRows.value
        .filter(row => !isCellReadonly(row, component))
        .filter(row => row.draftScores[component.id] !== null || row.records[component.id])
        .map(row => ({
          student_id: row.student_id,
          score: row.draftScores[component.id],
          result_type: "normal"
        }));
      if (!records.length) continue;
      await batchCreateGradeRecords({
        course_id: selectedCourseId.value,
        semester: selectedSemester.value,
        component_config_id: component.id,
        records
      });
      saveGroups += 1;
    }
    const successMessage = saveGroups ? "当前筛选结果已批量保存。" : "当前没有可保存的草稿成绩。";
    ElMessage.success(successMessage);
    await reloadEntryData("草稿已保存，但页面刷新失败，请手动刷新查看最新状态。");
  } catch (error: any) {
    ElMessage.error(error?.msg || "批量保存草稿失败。");
  } finally {
    savingDraft.value = false;
  }
};

const triggerExcelPick = () => {
  const input = excelUploadRef.value?.$el?.querySelector("input") as HTMLInputElement | null;
  input?.click();
};

const handleImportCommand = (command: string) => {
  if (command === "excel") {
    triggerExcelPick();
    return;
  }
  if (command === "exam") {
    handleExternalImport("exam");
    return;
  }
  if (command === "forum") {
    handleExternalImport("forum");
  }
};

const handleExcelChange = async (uploadFile: UploadFile) => {
  if (!uploadFile.raw) return;
  if (!selectedCourseId.value || !selectedSemester.value) {
    ElMessage.warning("请先选择课程和学期。");
    return;
  }
  if (!excelImportComponents.value.length) {
    ElMessage.warning("当前课程没有可用于 Excel 导入的手工成绩项。");
    return;
  }
  pendingExcelImport.value = {
    file: uploadFile.raw,
    name: uploadFile.name
  };
  selectedExcelComponentId.value = excelImportComponents.value.length === 1 ? excelImportComponents.value[0].id : null;
  excelImportDialogVisible.value = true;
};

const confirmExcelImport = async () => {
  if (!pendingExcelImport.value || !selectedExcelComponentId.value) {
    ElMessage.warning("请选择要导入到的成绩项。");
    return;
  }
  importing.value = true;
  try {
    const resp = await importGradeExcel(pendingExcelImport.value.file, {
      course_id: selectedCourseId.value,
      semester: selectedSemester.value,
      component_config_id: selectedExcelComponentId.value
    });
    importFailCount.value = resp.data.fail_count;
    ElMessage.success(`导入完成：成功 ${resp.data.success_count} 条，失败 ${resp.data.fail_count} 条`);
    excelImportDialogVisible.value = false;
    resetExcelImportState();
    await reloadEntryData("Excel 已导入，但页面刷新失败，请手动刷新查看最新状态。");
  } catch (error: any) {
    const failed = error?.data?.failed_records as Score.BatchResult["failed_records"] | undefined;
    const detail = failed?.length
      ? failed
          .slice(0, 3)
          .map(item => item.message || item.error_code)
          .join("；")
      : "";
    ElMessage.error(detail ? `${error?.msg || "Excel 导入失败"}：${detail}` : error?.msg || "Excel 导入失败。");
  } finally {
    importing.value = false;
  }
};

const handleExternalImport = async (source: ExternalSource) => {
  if (!selectedCourseId.value || !selectedSemester.value) return;
  const externalComponents = components.value.filter(component => component.data_source === source);
  if (!externalComponents.length) {
    ElMessage.warning(`当前课程没有 ${source === "exam" ? "考试" : "论坛"} 来源成绩项。`);
    return;
  }

  const missingActivity = externalComponents.filter(component => !String(component.component_sub_id || "").trim());
  if (missingActivity.length) {
    ElMessage.warning("请先在权重区为每个考试/论坛分项选择「对应活动」并保存配置。");
    return;
  }

  externalImportingSource.value = source;
  try {
    let importedTotal = 0;
    for (const component of externalComponents) {
      importedTotal += await importExternalForComponent(component, source);
    }
    ElMessage.success(
      `${source === "exam" ? "考试" : "论坛"}成绩导入完成：共 ${importedTotal} 条（${externalComponents.length} 个分项）。`
    );
    await reloadEntryData(`${source === "exam" ? "考试" : "论坛"}成绩已导入，但页面刷新失败，请手动刷新查看最新状态。`);
  } catch (error: any) {
    ElMessage.error(error?.msg || "外部成绩导入失败。");
  } finally {
    externalImportingSource.value = "";
  }
};

const handleCalculate = async () => {
  calculating.value = true;
  try {
    const resp = await calculatePreview(selectedCourseId.value, {
      course_id: selectedCourseId.value,
      semester: selectedSemester.value
    });
    ElMessage.success(`计算检查完成：已计算 ${resp.data.calculated_count} 名学生`);
    await reloadEntryData("计算检查已完成，但页面刷新失败，请手动刷新查看最新状态。");
  } catch (error: any) {
    ElMessage.error(error?.msg || "计算检查失败。");
  } finally {
    calculating.value = false;
  }
};

const handleSubmit = async () => {
  if (submitDisabledReason.value) {
    ElMessage.warning(submitDisabledReason.value);
    return;
  }
  await ElMessageBox.confirm("提交后成绩记录会进入审批流程，已提交或已审批记录将不能直接编辑。", "提交审批", {
    type: "warning"
  });
  submitting.value = true;
  try {
    const resp = await submitCourseGrades(selectedCourseId.value, {
      course_id: selectedCourseId.value,
      semester: selectedSemester.value
    });
    currentSubmissionStatus.value = resp.data.status || "pending";
    ElMessage.success("提交成功，当前课程状态：审批中");
    await reloadEntryData("提交已成功（审批中），但页面刷新失败，请手动刷新查看最新状态。");
  } catch (error: any) {
    ElMessage.error(error?.msg || "提交审批失败。");
  } finally {
    submitting.value = false;
  }
};

const focusConfig = () => {
  ElMessage.info("请在「成绩分项与权重」区调整分项，使总权重等于 100% 后保存配置。");
};

const locateAbnormal = () => {
  statusFilter.value = "abnormal";
  ElMessage.info("已筛选异常记录。");
};

const showMissingDetail = () => {
  ElMessage.info(`当前缺失成绩 ${missingScoreCount.value} 项。`);
};

const showImportLog = () => {
  ElMessage.info(importFailCount.value ? `最近一次导入失败 ${importFailCount.value} 条。` : "暂无导入失败记录。");
};

const requestUnlock = (row: EntryRow) => {
  ElMessage.info(`${row.student_name || row.student_no} 的锁定成绩需通过改分或审批流程处理。`);
};

const handleWorkflowReset = async (keepConfig: boolean) => {
  if (!selectedCourseId.value || !selectedSemester.value) return;
  const courseLabel = currentCourse.value?.course_name || selectedCourseId.value;
  const actionText = keepConfig
    ? "仅删除成绩记录与审批提交，保留当前分项权重配置并解锁。"
    : "删除分项配置、成绩记录、审批提交与外部映射，回到「配置权重前」。";
  try {
    await ElMessageBox.confirm(
      `课程：${courseLabel}（${selectedCourseId.value}）\n学期：${selectedSemester.value}\n\n${actionText}\n名册学生名单会保留。`,
      keepConfig ? "仅清成绩与审批" : "重置本课联调数据",
      { type: "warning", confirmButtonText: "确认重置", cancelButtonText: "取消" }
    );
  } catch {
    return;
  }
  resettingWorkflow.value = true;
  try {
    const resp = await resetCourseWorkflow(selectedCourseId.value, {
      semester: selectedSemester.value,
      keep_config: keepConfig
    });
    currentSubmissionStatus.value = "draft";
    ElMessage.success(keepConfig ? "已清空成绩与审批，可继续录入。" : "本课已回退到配置权重前，请重新新增分项并保存。");
    await reloadAll();
    void resp;
  } catch (error: any) {
    ElMessage.error(error?.msg || "重置失败");
  } finally {
    resettingWorkflow.value = false;
  }
};

onMounted(reloadAll);
</script>

<style scoped lang="scss">
.workflow-alert {
  margin-bottom: 12px;
}

.score-entry-page {
  --score-ink: #111827;
  --score-muted: #667085;
  --score-line: #d8e0eb;
  --score-blue: #1368c4;
  --score-blue-dark: #0d4f9a;
  --score-teal: #0f766e;
  --score-warn: #d97706;
  --score-danger: #c24132;
  --score-surface: #ffffff;
  --score-soft: #f6f8fb;

  min-height: 100%;
  padding: 16px;
  color: var(--score-ink);
  background:
    linear-gradient(180deg, rgb(243 247 252 / 94%), rgb(236 241 247 / 96%)),
    radial-gradient(circle at 12% 0%, rgb(19 104 196 / 14%), transparent 32%);
}
.entry-hero,
.panel,
.empty-panel {
  background: var(--score-surface);
  border: 1px solid #dbe2ec;
  border-radius: 8px;
  box-shadow: 0 14px 36px rgb(25 38 64 / 10%);
}
.entry-hero {
  position: relative;
  display: grid;
  grid-template-columns: minmax(520px, 1fr) minmax(560px, 0.94fr);
  gap: 18px;
  padding: 16px 18px;
  overflow: hidden;
  background:
    linear-gradient(90deg, rgb(255 255 255 / 96%), rgb(249 252 255 / 92%)),
    linear-gradient(135deg, rgb(19 104 196 / 8%), transparent 34%);
  border-color: rgb(179 196 219 / 70%);
  &::before {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 3px;
    content: "";
    background: linear-gradient(90deg, var(--score-blue), #12a594, #f59e0b);
  }
}
.breadcrumb-line {
  margin-bottom: 14px;
  font-size: 14px;
  color: var(--score-muted);
}
.course-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  margin-bottom: 12px;
  font-size: 17px;
  font-weight: 700;
  color: var(--score-ink);
  em {
    font-style: normal;
    color: #344054;
  }
  i {
    width: 1px;
    height: 18px;
    background: #c8d0dc;
  }
}
.hero-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 14px 20px;
  align-items: center;
  label {
    display: flex;
    gap: 8px;
    align-items: center;
    font-weight: 700;
    color: var(--score-ink);
  }
}
.hero-metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(96px, 1fr));
  gap: 8px;
  margin-top: 14px;
}
.metric-pill {
  display: grid;
  gap: 2px;
  min-height: 58px;
  padding: 9px 11px;
  background: linear-gradient(180deg, #f8fbff, #eef5ff);
  border: 1px solid #dce7f5;
  border-radius: 8px;
  span {
    font-size: 12px;
    font-weight: 700;
    color: var(--score-muted);
  }
  strong {
    font-size: 20px;
    line-height: 1;
    color: var(--score-blue-dark);
  }
  &.warn {
    background: linear-gradient(180deg, #fffaf1, #fff1db);
    border-color: #f7d8a5;
    strong {
      color: var(--score-warn);
    }
  }
  &.calm {
    background: linear-gradient(180deg, #f4fffd, #e8f7f5);
    border-color: #c6e2df;
    strong {
      color: var(--score-teal);
    }
  }
  &.danger {
    background: linear-gradient(180deg, #fff7f6, #ffe8e4);
    border-color: #f1b6af;
    strong {
      color: var(--score-danger);
    }
  }
}
.hero-select {
  width: 240px;
}
.semester-select {
  width: 180px;
}
.hero-side {
  display: grid;
  gap: 12px;
  align-content: center;
}
.hero-reset {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  justify-content: center;
  padding-top: 4px;
}
.reset-hint {
  flex: 1 1 100%;
  font-size: 12px;
  color: var(--score-muted);
  text-align: center;
}
.entry-steps {
  min-width: 0;
  :deep(.el-step__title) {
    font-size: 13px;
    font-weight: 800;
  }
  :deep(.el-step__head.is-process) {
    color: var(--score-blue);
    border-color: var(--score-blue);
  }
}
.flow-guide {
  margin-bottom: 12px;
}
.flow-guide-list {
  margin: 6px 0 0;
  padding-left: 18px;
  font-size: 13px;
  line-height: 1.65;
  color: var(--score-muted);
}
.config-hint {
  margin: 0 0 12px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--score-muted);
}
.batch-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  justify-content: flex-end;
}
.batch-label {
  margin-right: 4px;
  font-size: 13px;
  font-weight: 700;
  color: var(--score-muted);
}
.import-hint {
  margin-left: 4px;
  font-size: 12px;
  font-weight: 400;
  color: var(--score-muted);
}
.excel-upload-hidden {
  display: none;
}
.submit-action-wrapper {
  display: inline-flex;
}
.excel-import-dialog {
  display: grid;
  gap: 12px;
}
.entry-grid {
  display: grid;
  grid-template-columns: minmax(300px, 1fr) minmax(260px, 0.82fr);
  grid-template-areas:
    "filter exception"
    "config config";
  gap: 16px;
  margin-top: 16px;
}
.filter-panel {
  grid-area: filter;
}
.config-panel {
  grid-area: config;
}
.exception-panel {
  grid-area: exception;
}
.panel {
  padding: 16px;
}
.panel-title {
  display: flex;
  gap: 10px;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 14px;
  span {
    font-size: 18px;
    font-weight: 900;
    color: var(--score-ink);
  }
  small {
    font-size: 12px;
    font-weight: 800;
    color: var(--score-muted);
    &.danger {
      color: var(--score-danger);
    }
  }
}
.filter-panel {
  min-height: 230px;
}
.filter-row {
  display: grid;
  grid-template-columns: auto minmax(150px, 1fr) auto minmax(150px, 0.86fr);
  gap: 10px;
  align-items: center;
  margin-bottom: 12px;
  label {
    font-weight: 700;
    color: var(--score-ink);
  }
}
.filter-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 12px;
  font-size: 15px;
  color: var(--score-ink);
  strong {
    font-size: 17px;
    color: var(--score-blue-dark);
  }
}
.status-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-bottom: 14px;
  > span {
    font-weight: 700;
  }
  :deep(.el-radio-button__inner) {
    padding: 8px 10px;
    font-weight: 700;
  }
}
.student-search {
  display: grid;
  grid-template-columns: 84px 1fr;
  gap: 8px;
  align-items: center;
  label {
    font-weight: 700;
  }
}
.scope-tip {
  margin: 12px 0 0;
  font-size: 14px;
  font-weight: 700;
  color: #5b3413;
}
.config-panel {
  position: relative;
  min-height: auto;
}
.component-list {
  display: grid;
  gap: 9px;
  max-height: 220px;
  padding-right: 8px;
  overflow: auto;
}
.component-row {
  display: grid;
  grid-template-columns: minmax(68px, 0.7fr) minmax(68px, 0.85fr) 150px minmax(96px, 1fr) 40px 32px;
  gap: 8px;
  align-items: center;
  min-width: 0;
  :deep(.el-input),
  :deep(.el-select) {
    width: 100%;
    min-width: 0;
  }
  :deep(.el-input__wrapper) {
    padding-inline: 8px;
  }
}
.config-field-short {
  max-width: 120px;
}
.config-field-activity {
  max-width: 120px;
  min-width: 0;
}
.config-field-source {
  max-width: 150px;
  min-width: 0;
}
.config-weight-input {
  width: 110px;
  :deep(.el-input__wrapper) {
    padding-inline: 6px 6px;
  }
  :deep(.el-input__inner) {
    text-align: center;
  }
}
.config-pull-btn {
  justify-self: start;
  padding: 0;
  white-space: nowrap;
}
.config-pull-placeholder {
  justify-self: center;
  font-size: 12px;
  color: #98a2b3;
}
.component-row--head {
  padding: 0 4px 6px;
  font-size: 12px;
  font-weight: 800;
  color: var(--score-muted);
  white-space: nowrap;
}
.component-row--head span:last-child {
  justify-self: end;
}
.component-item {
  padding: 8px 10px;
  background: #fbfcfe;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  min-width: 0;
}
.component-item :deep(.el-button) {
  padding: 0;
}
.component-name {
  font-size: 15px;
  font-weight: 700;
}
.component-source {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 26px;
  padding: 0 9px;
  font-size: 12px;
  font-weight: 800;
  color: #344054;
  background: #eef2f7;
  border-radius: 999px;
}
.source-manual {
  color: #175cd3;
  background: #eaf2ff;
}
.source-exam {
  color: #92400e;
  background: #fff4df;
}
.source-forum {
  color: #047857;
  background: #e8f8f1;
}
.weight-alert {
  margin-top: 12px;
}
.mini-empty {
  --el-empty-padding: 12px 0;
}
.exception-panel {
  min-height: 230px;
  background:
    linear-gradient(180deg, rgb(255 255 255 / 96%), rgb(250 252 255 / 96%)),
    linear-gradient(135deg, rgb(19 104 196 / 8%), transparent);
}
.exception-list {
  display: grid;
  gap: 8px;
}
.exception-item {
  display: flex;
  gap: 6px;
  align-items: center;
  min-height: 32px;
  padding: 7px 10px;
  font-weight: 700;
  border-radius: 8px;
  strong {
    min-width: 28px;
    padding: 1px 8px;
    color: #ffffff;
    text-align: center;
    border-radius: 7px;
  }
  &.warn {
    background: #fff4df;
    border: 1px solid #f6d6a2;
    strong {
      background: #f08a1a;
    }
  }
  &.danger {
    background: #ffe8e4;
    border: 1px solid #f4bbb4;
    strong {
      background: #d63c32;
    }
  }
  &.muted {
    background: #eef2f7;
    border: 1px solid #d8dee8;
    strong {
      background: #687385;
    }
  }
}
.exception-actions {
  display: grid;
  gap: 8px;
  margin-top: 12px;
}
.table-panel {
  padding: 14px 16px 16px;
  margin-top: 16px;
}
.table-head {
  display: grid;
  grid-template-columns: minmax(260px, 0.8fr) minmax(360px, 1fr);
  gap: 12px;
  align-items: center;
  h3 {
    margin: 0;
    font-size: 20px;
    color: var(--score-ink);
  }
  p {
    margin: 5px 0 0;
    color: var(--score-muted);
  }
}
.table-alert {
  min-width: 0;
}
.batch-actions {
  align-items: center;
  justify-content: flex-start;
  margin: 12px 0 10px;
  > span {
    font-weight: 700;
  }
}
.entry-table {
  :deep(.el-table__header th) {
    font-size: 14px;
    color: var(--score-ink);
    background: linear-gradient(180deg, #f7f9fc, #edf2f8);
  }
  :deep(.el-table__cell) {
    padding: 8px 0;
  }
  :deep(.el-table__row.score-row-warning td) {
    background: #fffaf2;
  }
  :deep(.el-table__row.score-row-danger td) {
    background: #fff5f4;
  }
  :deep(.el-table__row.score-row-locked td) {
    background: #f8fafc;
  }
  :deep(.el-table__row:hover td) {
    background: #eef6ff !important;
  }
}
.component-head {
  display: grid;
  gap: 2px;
  line-height: 1.18;
  span {
    font-weight: 800;
  }
  small {
    font-weight: 600;
    color: #7b8494;
  }
}
.score-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  :deep(.el-input-number) {
    width: 100%;
    max-width: 132px;
  }
  :deep(.el-input__wrapper) {
    border-radius: 5px;
    box-shadow: inset 0 0 0 1px #cfd8e6;
    transition:
      box-shadow 0.16s ease,
      background 0.16s ease;
  }
  :deep(.el-input__wrapper:hover) {
    box-shadow: inset 0 0 0 1px var(--score-blue);
  }
  &.readonly {
    :deep(.el-input-number .el-input__wrapper) {
      padding-right: 30px;
    }
    :deep(.el-input__wrapper) {
      background: #e5e9ef;
      box-shadow: inset 0 0 0 1px #c9d0da;
    }
  }
}
.cell-lock {
  position: absolute;
  right: 34px;
  z-index: 1;
  font-size: 14px;
  color: #5f6b7c;
  pointer-events: none;
}
.status-tag {
  min-width: 64px;
  font-weight: 800;
}
.empty-panel {
  padding: 44px;
  margin-top: 14px;
}

@media (width <= 1280px) {
  .entry-hero,
  .table-head {
    grid-template-columns: 1fr;
  }
  .entry-grid {
    grid-template-columns: 1fr;
    grid-template-areas:
      "filter"
      "config"
      "exception";
  }
  .toolbar-actions {
    justify-content: flex-start;
  }
}

@media (width <= 960px) {
  .component-row {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  .component-row--head {
    display: none;
  }
  .component-item :deep(.el-button) {
    justify-self: start;
  }
}

@media (width <= 760px) {
  .score-entry-page {
    padding: 10px;
  }
  .course-summary,
  .hero-controls {
    flex-direction: column;
    align-items: flex-start;
  }
  .course-summary i {
    display: none;
  }
  .hero-controls label,
  .filter-row,
  .student-search {
    grid-template-columns: 1fr;
    width: 100%;
  }
  .component-row {
    grid-template-columns: 1fr;
    grid-template-areas:
      "name"
      "subid"
      "weight"
      "source"
      "delete";
  }
  .hero-select,
  .semester-select {
    width: 100%;
  }
}
</style>
