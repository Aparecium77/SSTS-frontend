<template>
  <div class="cs-page">
    <div class="cs-header">
      <h2>培养方案校验</h2>
      <p>维护本人培养方案，提交前做规则校验（总学分、模块学分、前置课、互斥），不通过给出可定位的违例。</p>
    </div>

    <el-card shadow="never" class="mb-3">
      <el-form :inline="true" :model="plan">
        <el-form-item label="专业">
          <el-input v-model="plan.major_code" style="width: 120px" />
        </el-form-item>
        <el-form-item label="培养方案版本">
          <el-input v-model="plan.curriculum_version" style="width: 120px" />
        </el-form-item>
        <el-form-item>
          <el-tag :type="statusTagType">{{ statusText }}</el-tag>
        </el-form-item>
        <el-form-item>
          <el-button :icon="Plus" @click="addItem">新增课程</el-button>
          <el-button :loading="loading" @click="onValidate">校验（试算）</el-button>
          <el-button type="primary" :loading="loading" @click="onSave">保存方案</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <el-table :data="plan.items" border empty-text="暂无课程，请点击「新增课程」">
        <el-table-column label="课程代码" min-width="120">
          <template #default="{ row }"><el-input v-model="row.course_code" /></template>
        </el-table-column>
        <el-table-column label="类别" width="160">
          <template #default="{ row }">
            <el-select v-model="row.category">
              <el-option label="专业必修" value="major_required" />
              <el-option label="专业选修" value="major_elective" />
              <el-option label="通识" value="general" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="计划学期" width="140">
          <template #default="{ row }"><el-input v-model="row.expected_semester" /></template>
        </el-table-column>
        <el-table-column label="学分" width="120">
          <template #default="{ row }"><el-input-number v-model="row.credit" :min="0" :step="0.5" /></template>
        </el-table-column>
        <el-table-column label="操作" width="90">
          <template #default="{ $index }">
            <el-button link type="danger" @click="plan.items.splice($index, 1)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="mt-2 text-right" style="color: var(--el-text-color-secondary)">
        合计学分：{{ totalCredit }}（要求 {{ plan.total_credit_required }}）
      </div>
    </el-card>

    <el-card v-if="result" shadow="never" class="mt-3">
      <el-alert v-if="result.valid" type="success" :closable="false" title="校验通过，可进入选课" show-icon />
      <template v-else>
        <el-alert
          type="error"
          :closable="false"
          :title="`校验未通过，共 ${result.violations.length} 条违例`"
          show-icon
          class="mb-2"
        />
        <el-table :data="result.violations" border>
          <el-table-column label="级别" width="100">
            <template #default="{ row }">
              <el-tag :type="row.severity === 'hard' ? 'danger' : 'warning'">
                {{ row.severity === "hard" ? "硬规则" : "软规则" }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="rule_type" label="规则" width="180" />
          <el-table-column prop="message" label="说明" />
          <el-table-column prop="code" label="错误码" width="100" />
        </el-table>
      </template>
    </el-card>
  </div>
</template>

<script setup lang="ts" name="studyPlans">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import { Plus } from "@element-plus/icons-vue";
import { CourseSelection } from "@/api/interface/courseSelection";
import { getMyStudyPlanApi, saveMyStudyPlanApi, validateMyStudyPlanApi } from "@/api/modules/courseSelection";

const USE_MOCK = false; // 联调时置 false，页面即走真实接口，无需改模板

const plan = reactive<CourseSelection.StudyPlan>({
  plan_id: "",
  student_id: "me",
  major_code: "CS",
  curriculum_version: "2023",
  total_credit_required: 160,
  status: "draft",
  items: []
});
const result = ref<CourseSelection.PlanValidationResult | null>(null);
const loading = ref(false);

const totalCredit = computed(() => plan.items.reduce((s, i) => s + (Number(i.credit) || 0), 0));
const statusText = computed(() => ({ draft: "草稿", valid: "已校验通过", invalid: "校验未通过" })[plan.status]);
const statusTagType = computed(
  () => ({ draft: "info", valid: "success", invalid: "danger" })[plan.status] as "info" | "success" | "danger"
);

const mockPlan: CourseSelection.StudyPlan = {
  plan_id: "01HPLAN",
  student_id: "me",
  major_code: "CS",
  curriculum_version: "2023",
  total_credit_required: 160,
  status: "draft",
  items: [
    { plan_item_id: "1", course_code: "CS101", category: "major_required", expected_semester: "2026-1", credit: 3 },
    { plan_item_id: "2", course_code: "CS201", category: "major_elective", expected_semester: "2026-2", credit: 2 }
  ]
};

function addItem() {
  plan.items.push({ course_code: "", category: "major_elective", expected_semester: "2026-1", credit: 2 });
}

const reqBody = (): CourseSelection.SavePlanReq => ({
  major_code: plan.major_code,
  curriculum_version: plan.curriculum_version,
  items: plan.items
});

async function onValidate() {
  loading.value = true;
  try {
    if (USE_MOCK) {
      const ok = totalCredit.value >= plan.total_credit_required;
      result.value = ok
        ? { status: "valid", valid: true, violations: [] }
        : {
            status: "invalid",
            valid: false,
            violations: [
              {
                code: 30101,
                rule_type: "min_credit_total",
                message: `总学分 ${totalCredit.value} < 要求 ${plan.total_credit_required}`,
                severity: "hard"
              }
            ]
          };
    } else {
      const { data } = await validateMyStudyPlanApi(reqBody());
      result.value = data;
    }
    plan.status = result.value.valid ? "valid" : "invalid";
  } finally {
    loading.value = false;
  }
}

async function onSave() {
  loading.value = true;
  try {
    if (!USE_MOCK) {
      const { data } = await saveMyStudyPlanApi(reqBody());
      result.value = data;
      plan.status = data.status;
    } else {
      await onValidate();
    }
    ElMessage.success("方案已保存");
  } finally {
    loading.value = false;
  }
}

async function load() {
  if (USE_MOCK) {
    Object.assign(plan, mockPlan);
    return;
  }
  const { data } = await getMyStudyPlanApi();
  if (data) Object.assign(plan, data);
}

onMounted(load);
</script>

<style scoped lang="scss">
.cs-page {
  padding: 16px;
}
.cs-header {
  margin-bottom: 12px;
  h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
  }
  p {
    margin: 4px 0 0;
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }
}
</style>
