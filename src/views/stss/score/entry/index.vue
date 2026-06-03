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
        </div>
        <div class="hero-controls">
          <label>
            <span>课程名称：</span>
            <el-select
              v-model="selectedCourseId"
              placeholder="选择课程"
              filterable
              class="hero-select"
              @change="handleCourseChange"
            >
              <el-option
                v-for="course in courses"
                :key="`${course.course_id}-${course.semester}`"
                :label="courseLabel(course)"
                :value="course.course_id"
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
              @change="loadEntryData"
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
          <el-step title="录入/导入成绩" />
          <el-step title="计算检查" />
          <el-step title="提交审批" />
        </el-steps>
        <div class="toolbar-actions">
          <el-button :icon="Refresh" :loading="loading" @click="reloadAll">刷新数据</el-button>
          <el-upload action="" :auto-upload="false" :show-file-list="false" :on-change="handleExcelChange" accept=".xlsx,.xls">
            <el-button :icon="Upload" :disabled="!selectedCourseId || !selectedSemester" :loading="importing">
              Excel 导入
            </el-button>
          </el-upload>
          <el-button :disabled="!selectedCourseId || !selectedSemester || !components.length" @click="openMappingDialog">
            配置导入映射
          </el-button>
          <el-button
            :disabled="!selectedCourseId || !selectedSemester || !components.length"
            :loading="externalImportingSource === 'exam'"
            @click="handleExternalImport('exam')"
          >
            导入考试成绩
          </el-button>
          <el-button
            :disabled="!selectedCourseId || !selectedSemester || !components.length"
            :loading="externalImportingSource === 'forum'"
            @click="handleExternalImport('forum')"
          >
            导入论坛成绩
          </el-button>
          <el-button :icon="Operation" :disabled="!canOperateCourse" :loading="calculating" @click="handleCalculate">
            计算检查
          </el-button>
          <el-button type="primary" :icon="Promotion" :disabled="!canOperateCourse" :loading="submitting" @click="handleSubmit">
            提交审批
          </el-button>
        </div>
      </div>
    </section>

    <section v-if="!selectedCourseId || !selectedSemester" class="empty-panel">
      <el-empty description="请选择课程和学期后开始录入成绩" />
    </section>

    <template v-else>
      <section class="entry-grid">
        <div class="panel filter-panel">
          <div class="panel-title">
            <span>筛选区</span>
            <small>快速定位学生和录入状态</small>
          </div>
          <div class="filter-row">
            <label>课程选择</label>
            <el-select v-model="selectedCourseId" placeholder="选择课程" filterable @change="handleCourseChange">
              <el-option
                v-for="course in courses"
                :key="`filter-${course.course_id}-${course.semester}`"
                :label="course.course_name || course.course_id"
                :value="course.course_id"
              />
            </el-select>
            <label>学期选择</label>
            <el-select v-model="selectedSemester" placeholder="选择学期" filterable @change="loadEntryData">
              <el-option v-for="semester in semesterOptions" :key="`filter-${semester}`" :label="semester" :value="semester" />
            </el-select>
          </div>
          <div class="filter-stats">
            <span>
              学生人数：<strong>{{ currentCourse?.student_count || rows.length }}</strong>
            </span>
            <span>
              学生数：<strong>{{ rows.length }}</strong>
            </span>
          </div>
          <div class="status-filter">
            <span>状态筛选</span>
            <el-radio-group v-model="statusFilter">
              <el-radio-button label="all">全部</el-radio-button>
              <el-radio-button label="unsaved">未保存</el-radio-button>
              <el-radio-button label="draft">草稿</el-radio-button>
              <el-radio-button label="submitted">已提交</el-radio-button>
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
            <span>课程概览与权重配置区</span>
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
          <div v-if="configDrafts.length" class="component-list">
            <div v-for="item in configDrafts" :key="item.local_id" class="component-item editable">
              <el-input
                v-model="item.component_type"
                placeholder="成绩项类型，如 usual / final"
                :disabled="item.is_locked === 1"
              />
              <el-input v-model="item.component_sub_id" placeholder="分项标识，如 part-a" :disabled="item.is_locked === 1" />
              <el-input-number
                v-model="item.weight"
                :min="0"
                :max="100"
                :precision="1"
                controls-position="right"
                :disabled="item.is_locked === 1"
              />
              <el-select v-model="item.data_source" :disabled="item.is_locked === 1">
                <el-option label="Manual" value="manual" />
                <el-option label="Exam" value="exam" />
                <el-option label="Forum" value="forum" />
              </el-select>
              <span class="component-source" :class="`source-${item.data_source}`">{{ sourceLabel(item.data_source) }}</span>
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
            <p>{{ filteredRows.length }} / {{ rows.length }} 名学生 · 手工项可编辑，Exam / Forum 来源为只读导入项</p>
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
          <span>批量操作：</span>
          <el-upload action="" :auto-upload="false" :show-file-list="false" :on-change="handleExcelChange" accept=".xlsx,.xls">
            <el-button :loading="importing">Excel 导入</el-button>
          </el-upload>
          <el-button :disabled="!components.length" @click="openMappingDialog">配置映射</el-button>
          <el-button
            :disabled="!components.length"
            :loading="externalImportingSource === 'exam'"
            @click="handleExternalImport('exam')"
          >
            从考试系统导入
          </el-button>
          <el-button
            :disabled="!components.length"
            :loading="externalImportingSource === 'forum'"
            @click="handleExternalImport('forum')"
          >
            从论坛导入
          </el-button>
          <el-button :disabled="!filteredRows.length" :loading="savingDraft" @click="saveVisibleDrafts">保存草稿</el-button>
          <el-button :disabled="!canOperateCourse" :loading="calculating" @click="handleCalculate">计算预览</el-button>
          <el-button type="primary" :disabled="!canOperateCourse" :loading="submitting" @click="handleSubmit">提交审批</el-button>
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
          <el-table-column v-for="component in components" :key="component.id" min-width="146">
            <template #header>
              <div class="component-head">
                <span>{{ component.component_type }}</span>
                <small>{{ component.weight }}% · {{ component.data_source }}</small>
              </div>
            </template>
            <template #default="{ row }">
              <div class="score-input-wrap" :class="{ readonly: isCellReadonly(row, component) }">
                <el-input-number
                  v-model="row.draftScores[component.id]"
                  :min="0"
                  :max="100"
                  :precision="1"
                  :step="1"
                  controls-position="right"
                  :disabled="isCellReadonly(row, component)"
                />
                <el-icon v-if="isCellReadonly(row, component)" class="cell-lock"><Lock /></el-icon>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="总评预览" min-width="112" align="center">
            <template #default="{ row }">
              <strong>{{ formatScore(rowPreview(row)) }}</strong>
            </template>
          </el-table-column>
          <el-table-column label="总评成绩" min-width="112" align="center">
            <template #default="{ row }">
              <strong>{{ formatScore(rowTotal(row)) }}</strong>
            </template>
          </el-table-column>
          <el-table-column label="状态" min-width="112" align="center" sortable>
            <template #default="{ row }">
              <el-tag round :type="rowStatusType(row)" class="status-tag">{{ rowStatusLabel(row) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" min-width="190" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" :loading="savingCell === row.student_id" @click="saveRow(row)">保存单元格</el-button>
              <el-button link type="primary" @click="handleCalculate">计算校验</el-button>
              <el-button v-if="rowHasLocked(row)" link type="primary" @click="requestUnlock(row)">解锁记录</el-button>
            </template>
          </el-table-column>
        </el-table>
      </section>

      <el-dialog v-model="mappingDialogVisible" title="外部成绩映射" width="760px">
        <div class="mapping-toolbar">
          <el-button size="small" @click="addMappingRow()">新增映射</el-button>
          <span class="mapping-tip">先保存映射，再执行 Exam / Forum 导入。</span>
        </div>
        <div v-if="mappingDrafts.length" class="mapping-list">
          <div v-for="item in mappingDrafts" :key="item.local_id" class="mapping-row">
            <el-select v-model="item.source_system" class="mapping-source">
              <el-option label="Exam" value="exam" />
              <el-option label="Forum" value="forum" />
            </el-select>
            <el-input v-model="item.external_id" placeholder="外部成绩项 ID" />
            <el-input v-model="item.external_name" placeholder="外部成绩项名称（可选）" />
            <el-select v-model="item.component_config_id" placeholder="映射到成绩项" class="mapping-component">
              <el-option
                v-for="component in components"
                :key="component.id"
                :label="`${component.component_type} / ${component.component_sub_id || 'default'} / ${component.weight}%`"
                :value="component.id"
              />
            </el-select>
            <el-button link type="danger" @click="removeMappingRow(item.local_id)">删除</el-button>
          </div>
        </div>
        <el-empty v-else description="暂无映射，请先新增一条映射" />
        <template #footer>
          <el-button @click="mappingDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="savingMappings" @click="saveMappings">保存映射</el-button>
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
  importExamScores,
  importForumScores,
  importGradeExcel,
  saveGradeConfig,
  submitCourseGrades,
  updateGradeRecord,
  upsertExternalMappings
} from "@/api/modules/score";

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

type MappingDraftItem = {
  local_id: string;
  source_system: ExternalSource;
  external_id: string;
  external_name: string;
  component_config_id: number | null;
};

const courses = ref<Score.Course[]>([]);
const components = ref<Score.GradeComponent[]>([]);
const configDrafts = ref<ConfigDraftItem[]>([]);
const rows = ref<EntryRow[]>([]);
const mappingDrafts = ref<MappingDraftItem[]>([]);
const selectedCourseId = ref("");
const selectedSemester = ref("");
const statusFilter = ref<StatusFilter>("all");
const studentKeyword = ref("");
const loading = ref(false);
const importing = ref(false);
const calculating = ref(false);
const submitting = ref(false);
const savingDraft = ref(false);
const savingCell = ref("");
const savingConfig = ref(false);
const mappingDialogVisible = ref(false);
const savingMappings = ref(false);
const externalImportingSource = ref<ExternalSource | "">("");
const importFailCount = ref(0);
const currentMappingKey = ref("");

let localSeed = 0;
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
const courseScopeTip = computed(() => Boolean(courses.value.length));
const totalWeight = computed(() => configDrafts.value.reduce((sum, component) => sum + Number(component.weight || 0), 0));
const weightAbnormal = computed(() => configDrafts.value.length > 0 && totalWeight.value !== 100);
const configLocked = computed(() => configDrafts.value.some(item => item.is_locked === 1));

const activeStep = computed(() => {
  if (!selectedCourseId.value || !selectedSemester.value) return 0;
  if (submitting.value) return 3;
  if (calculating.value || weightAbnormal.value) return 2;
  return 1;
});

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

const courseLabel = (course: Score.Course) =>
  `${course.course_name || course.course_id} · ${course.semester} · ${course.student_count}人`;

const sourceLabel = (source: string) => {
  if (source === "manual") return "Manual";
  if (source === "exam") return "Exam, 来自 Exam System";
  if (source === "forum") return "Forum, 来自 Forum System";
  return source;
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

const buildDefaultMappingDrafts = () =>
  components.value
    .filter(component => component.data_source === "exam" || component.data_source === "forum")
    .map(component => ({
      local_id: nextLocalId(),
      source_system: component.data_source as ExternalSource,
      external_id: "",
      external_name: "",
      component_config_id: component.id
    }));

const maybeResetMappingDrafts = () => {
  const nextKey = `${selectedCourseId.value}::${selectedSemester.value}`;
  if (currentMappingKey.value !== nextKey) {
    mappingDrafts.value = buildDefaultMappingDrafts();
    currentMappingKey.value = nextKey;
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
      workflow_status: sheetRow.status,
      submitted_at: sheetRow.submitted_at,
      approved_at: sheetRow.approved_at,
      published_at: sheetRow.published_at,
      draftScores
    };
  });

const loadCourses = async () => {
  const resp = await getGradeCourses();
  courses.value = resp.data.courses;
  if (!selectedCourseId.value && courses.value.length) {
    selectedCourseId.value = courses.value[0].course_id;
    selectedSemester.value = courses.value[0].semester;
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
    maybeResetMappingDrafts();
    rows.value = buildRows(gradebookResp.data.rows, configResp.data.components);
  } finally {
    loading.value = false;
  }
};

const reloadAll = async () => {
  await loadCourses();
  await loadEntryData();
};

const handleCourseChange = () => {
  const matched = courses.value.find(course => course.course_id === selectedCourseId.value);
  selectedSemester.value = matched?.semester || semesterOptions.value[0] || "";
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
  } catch (error: any) {
    ElMessage.error(error?.msg || "成绩项配置保存失败。");
    await loadEntryData();
  } finally {
    savingConfig.value = false;
  }
};

const openMappingDialog = () => {
  if (!components.value.length) {
    ElMessage.warning("请先完成成绩项配置并保存。");
    return;
  }
  if (!mappingDrafts.value.length) mappingDrafts.value = buildDefaultMappingDrafts();
  mappingDialogVisible.value = true;
};

const addMappingRow = (source: ExternalSource = "exam") => {
  mappingDrafts.value.push({
    local_id: nextLocalId(),
    source_system: source,
    external_id: "",
    external_name: "",
    component_config_id:
      components.value.find(component => component.data_source === source)?.id ?? components.value[0]?.id ?? null
  });
};

const removeMappingRow = (localId: string) => {
  mappingDrafts.value = mappingDrafts.value.filter(item => item.local_id !== localId);
};

const saveMappings = async () => {
  if (!selectedCourseId.value || !selectedSemester.value) return;
  const validMappings = mappingDrafts.value.filter(item => item.component_config_id && item.external_id.trim());
  if (!validMappings.length) {
    ElMessage.warning("请至少填写一条完整映射后再保存。");
    return;
  }

  savingMappings.value = true;
  try {
    const resp = await upsertExternalMappings({
      course_id: selectedCourseId.value,
      semester: selectedSemester.value,
      mappings: validMappings.map(item => ({
        source_system: item.source_system,
        external_id: item.external_id.trim(),
        external_name: item.external_name.trim() || undefined,
        component_config_id: Number(item.component_config_id)
      }))
    });
    ElMessage.success(`映射已保存：新增 ${resp.data.inserted} 条，更新 ${resp.data.updated} 条。`);
    mappingDialogVisible.value = false;
  } catch (error: any) {
    ElMessage.error(error?.msg || "映射保存失败。");
  } finally {
    savingMappings.value = false;
  }
};

const cellKey = (row: EntryRow, component: Score.GradeComponent) => `${row.student_id}-${component.id}`;

const cellReadonlyReason = (row: EntryRow, component: Score.GradeComponent) => {
  const record = row.records[component.id];
  if (component.data_source !== "manual") return "外部来源成绩不能手工编辑";
  if (component.is_locked) return "成绩项已锁定";
  if (record?.is_locked) return "成绩记录已锁定";
  if (record?.status === "submitted") return "已提交成绩不能编辑";
  if (record?.status === "approved") return "已审批成绩需走改分流程";
  return "";
};

const isCellReadonly = (row: EntryRow, component: Score.GradeComponent) => Boolean(cellReadonlyReason(row, component));

const rowRecords = (row: EntryRow) => components.value.map(component => row.records[component.id]).filter(Boolean);

const rowStatus = (row: EntryRow): StatusFilter => {
  if (row.workflow_status === "published" || row.workflow_status === "approved") return "approved";
  if (row.workflow_status === "submitted") return "submitted";
  if (row.workflow_status === "draft") return "draft";
  const records = rowRecords(row);
  if (!records.length) return "unsaved";
  if (records.some(record => record.status === "approved")) return "approved";
  if (records.some(record => record.status === "submitted")) return "submitted";
  if (records.some(record => record.status === "draft")) return "draft";
  return "unsaved";
};

const rowStatusLabel = (row: EntryRow) => {
  if (row.workflow_status === "published") return "已发布";
  if (row.workflow_status === "approved") return "已审批";
  if (row.workflow_status === "submitted") return "已提交";
  if (row.workflow_status === "draft") return rowRecords(row).length ? "草稿" : "未保存";
  return "未保存";
};

const rowStatusType = (row: EntryRow) => {
  if (row.workflow_status === "published" || row.workflow_status === "approved") return "success";
  if (row.workflow_status === "submitted") return "primary";
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
    await loadEntryData();
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
    ElMessage.success(saveGroups ? "当前筛选结果已批量保存。" : "当前没有可保存的草稿成绩。");
    await loadEntryData();
  } catch (error: any) {
    ElMessage.error(error?.msg || "批量保存草稿失败。");
  } finally {
    savingDraft.value = false;
  }
};

const handleExcelChange = async (uploadFile: UploadFile) => {
  if (!uploadFile.raw) return;
  importing.value = true;
  try {
    const resp = await importGradeExcel(uploadFile.raw);
    importFailCount.value = resp.data.fail_count;
    ElMessage.success(`导入完成：成功 ${resp.data.success_count} 条，失败 ${resp.data.fail_count} 条`);
    await loadEntryData();
  } catch (error: any) {
    ElMessage.error(error?.msg || "Excel 导入失败。");
  } finally {
    importing.value = false;
  }
};

const getValidMappingsForSource = (source: ExternalSource) =>
  mappingDrafts.value.filter(item => item.source_system === source && item.component_config_id && item.external_id.trim());

const handleExternalImport = async (source: ExternalSource) => {
  if (!selectedCourseId.value || !selectedSemester.value) return;
  const externalComponents = components.value.filter(component => component.data_source === source);
  if (!externalComponents.length) {
    ElMessage.warning(`当前课程没有 ${source === "exam" ? "考试" : "论坛"} 来源成绩项。`);
    return;
  }

  const mappings = getValidMappingsForSource(source);
  if (externalComponents.length > 1 && !mappings.length) {
    ElMessage.warning("当前来源下有多个外部成绩项，请先配置映射后再导入。");
    openMappingDialog();
    return;
  }

  externalImportingSource.value = source;
  try {
    const payload: Score.ImportExternalScoresReq = {
      course_id: selectedCourseId.value,
      semester: selectedSemester.value
    };
    if (externalComponents.length === 1 && !mappings.length) {
      payload.component_config_id = externalComponents[0].id;
      payload.component_type = externalComponents[0].component_type;
      payload.component_sub_id = externalComponents[0].component_sub_id;
    }

    const resp = source === "exam" ? await importExamScores(payload) : await importForumScores(payload);
    ElMessage.success(`${source === "exam" ? "考试" : "论坛"}成绩导入完成：共导入 ${resp.data.imported} 条。`);
    await loadEntryData();
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
    await loadEntryData();
  } catch (error: any) {
    ElMessage.error(error?.msg || "计算检查失败。");
  } finally {
    calculating.value = false;
  }
};

const handleSubmit = async () => {
  await ElMessageBox.confirm("提交后成绩记录会进入审批流程，已提交或已审批记录将不能直接编辑。", "提交审批", {
    type: "warning"
  });
  submitting.value = true;
  try {
    await submitCourseGrades(selectedCourseId.value, {
      course_id: selectedCourseId.value,
      semester: selectedSemester.value
    });
    ElMessage.success("已提交审批。");
    await loadEntryData();
  } catch (error: any) {
    ElMessage.error(error?.msg || "提交审批失败。");
  } finally {
    submitting.value = false;
  }
};

const focusConfig = () => {
  ElMessage.info("请在配置区调整权重，使总权重等于 100%。");
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

onMounted(reloadAll);
</script>

<style scoped lang="scss">
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
.toolbar-actions,
.batch-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}
.entry-grid {
  display: grid;
  grid-template-columns: minmax(390px, 0.92fr) minmax(420px, 1.14fr) 292px;
  gap: 16px;
  margin-top: 16px;
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
  min-height: 230px;
}
.component-list {
  display: grid;
  gap: 9px;
  max-height: 170px;
  padding-right: 8px;
  overflow: auto;
}
.component-item {
  display: grid;
  grid-template-columns: 120px 92px 1fr;
  gap: 10px;
  align-items: center;
  padding: 7px 9px;
  background: #fbfcfe;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
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
  :deep(.el-input-number) {
    width: 108px;
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
    :deep(.el-input__wrapper) {
      background: #e5e9ef;
      box-shadow: inset 0 0 0 1px #c9d0da;
    }
  }
}
.cell-lock {
  position: absolute;
  right: 8px;
  color: #7d8796;
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
  .entry-grid,
  .table-head {
    grid-template-columns: 1fr;
  }
  .toolbar-actions {
    justify-content: flex-start;
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
  .student-search,
  .component-item {
    grid-template-columns: 1fr;
    width: 100%;
  }
  .hero-select,
  .semester-select {
    width: 100%;
  }
}
</style>
