<template>
  <div class="schedule-page-view">
    <SchedulePageShell
      v-model="detailVisible"
      title="排课规则"
      description="集中配置时间约束、教师冲突、教室容量和连排策略，为排课执行和调课审批建立统一规则口径。"
      :tags="['规则分类', '优先级', '启停状态']"
      :stats="stats"
      content-title="规则列表"
      content-description="统一展示规则优先级、影响范围和启停状态，后续阶段可直接切换到真实接口返回。"
      :data-count="ruleRecords.length"
      empty-description="当前筛选条件下没有规则记录。"
      dialog-title="规则详情"
    >
      <template #actions>
        <div class="header-actions">
          <el-button :loading="loading">刷新数据</el-button>
          <el-button type="primary" @click="openCreate">新增规则</el-button>
        </div>
      </template>

      <template #filters>
        <el-form :inline="true" :model="filters" class="filter-form">
          <el-form-item label="规则分类">
            <el-segmented v-model="filters.category" :options="categorySegments" />
          </el-form-item>
          <el-form-item label="启停状态">
            <el-select v-model="filters.status" placeholder="全部状态" clearable style="width: 160px" @change="loadRules">
              <el-option label="启用" value="enabled" />
              <el-option label="停用" value="disabled" />
            </el-select>
          </el-form-item>
          <el-form-item label="优先级">
            <el-select v-model="filters.priority" placeholder="全部优先级" clearable style="width: 160px" @change="loadRules">
              <el-option label="P1" :value="1" />
              <el-option label="P2" :value="2" />
              <el-option label="P3" :value="3" />
            </el-select>
          </el-form-item>
          <el-form-item label="关键词">
            <el-input
              v-model="filters.keyword"
              placeholder="规则名称 / 编号 / 作用范围"
              clearable
              style="width: 260px"
              @change="loadRules"
            />
          </el-form-item>
        </el-form>
      </template>

      <div class="overview-grid">
        <article v-for="item in categoryCards" :key="item.value" class="overview-card">
          <div class="overview-card__header">
            <strong>{{ item.label }}</strong>
            <el-tag size="small" effect="plain">{{ item.count }} 条</el-tag>
          </div>
          <p>{{ item.description }}</p>
        </article>
      </div>

      <el-table v-loading="loading" :data="ruleRecords" border>
        <el-table-column label="规则分类" min-width="120">
          <template #default="{ row }">
            <el-tag size="small" :type="getRuleCategoryTagType(row.category)" effect="light">
              {{ getRuleCategoryLabel(row.category) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="规则名称" min-width="200" />
        <el-table-column prop="code" label="规则编号" min-width="120" />
        <el-table-column label="优先级" min-width="90">
          <template #default="{ row }">
            <span class="priority-badge" :class="`priority-badge--p${row.priority}`">P{{ row.priority }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="scope" label="作用范围" min-width="150" />
        <el-table-column label="规则说明" min-width="240" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.description }}
          </template>
        </el-table-column>
        <el-table-column label="状态" min-width="110">
          <template #default="{ row }">
            <el-switch
              :model-value="row.status === 'enabled'"
              inline-prompt
              active-text="启用"
              inactive-text="停用"
              @change="toggleStatus(row)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="updatedAt" label="更新时间" min-width="160" />
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-space>
              <el-button link type="primary" @click="openDetail(row)">详情</el-button>
              <el-button link @click="openEdit(row)">编辑</el-button>
            </el-space>
          </template>
        </el-table-column>
      </el-table>

      <template #detail>
        <div v-if="currentRecord" class="detail-stack">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="规则名称">{{ currentRecord.name }}</el-descriptions-item>
            <el-descriptions-item label="规则编号">{{ currentRecord.code }}</el-descriptions-item>
            <el-descriptions-item label="规则分类">{{ getRuleCategoryLabel(currentRecord.category) }}</el-descriptions-item>
            <el-descriptions-item label="优先级">P{{ currentRecord.priority }}</el-descriptions-item>
            <el-descriptions-item label="作用范围">{{ currentRecord.scope }}</el-descriptions-item>
            <el-descriptions-item label="状态">{{ currentRecord.status === "enabled" ? "启用" : "停用" }}</el-descriptions-item>
          </el-descriptions>
          <el-alert :title="currentRecord.description" type="info" :closable="false" />
          <div class="detail-panel">
            <h4>规则条件</h4>
            <el-timeline>
              <el-timeline-item v-for="(condition, index) in currentRecord.conditions" :key="`${currentRecord.id}-${index}`">
                {{ formatCondition(condition) }}
              </el-timeline-item>
            </el-timeline>
          </div>
          <div class="detail-panel">
            <h4>生效说明</h4>
            <el-space wrap>
              <el-tag v-for="summary in currentRecord.effectSummary" :key="summary" effect="plain">
                {{ summary }}
              </el-tag>
            </el-space>
          </div>
        </div>
      </template>
    </SchedulePageShell>

    <el-drawer v-model="formVisible" :title="formMode === 'create' ? '新增规则' : '编辑规则'" size="620px">
      <el-form ref="formRef" :model="formModel" :rules="formRules" label-width="96px" class="rule-form">
        <el-form-item label="规则分类" prop="category">
          <el-radio-group v-model="formModel.category">
            <el-radio-button v-for="item in categoryOptionItems" :key="item.value" :label="item.value">
              {{ item.label }}
            </el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="规则名称" prop="name">
          <el-input v-model="formModel.name" maxlength="40" show-word-limit placeholder="例如：教师同一时段不可重复授课" />
        </el-form-item>
        <el-form-item label="规则编号" prop="code">
          <el-input v-model="formModel.code" placeholder="例如：TEACHER-002" />
        </el-form-item>
        <el-form-item label="优先级" prop="priority">
          <el-select v-model="formModel.priority" style="width: 160px">
            <el-option label="P1 - 硬约束" :value="1" />
            <el-option label="P2 - 重要约束" :value="2" />
            <el-option label="P3 - 优化约束" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="作用范围" prop="scope">
          <el-select v-model="formModel.scope" filterable allow-create default-first-option placeholder="选择或输入作用范围">
            <el-option v-for="item in scopeOptionItems" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="启停状态" prop="status">
          <el-radio-group v-model="formModel.status">
            <el-radio label="enabled">启用</el-radio>
            <el-radio label="disabled">停用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="规则说明" prop="description">
          <el-input v-model="formModel.description" type="textarea" :rows="3" maxlength="120" show-word-limit />
        </el-form-item>
        <el-form-item label="规则条件">
          <div class="condition-list">
            <div v-for="(condition, index) in formModel.conditions" :key="`condition-${index}`" class="condition-row">
              <el-input v-model="condition.field" placeholder="字段" />
              <el-input v-model="condition.operator" placeholder="运算符" />
              <el-input
                v-model="conditionValueText[index]"
                placeholder="值，数组请用 / 分隔"
                @input="updateConditionValue(index)"
              />
              <el-button link type="danger" @click="removeCondition(index)">删除</el-button>
            </div>
            <el-button plain @click="addCondition">新增条件</el-button>
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="drawer-footer">
          <el-button @click="formVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm">保存规则</el-button>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts" name="scheduleRules">
import { computed, onMounted, reactive, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import type { FormInstance, FormRules } from "element-plus";
import type { Schedule } from "@/api/interface/schedule";
import SchedulePageShell from "../components/SchedulePageShell.vue";
import type { RulePageFilters } from "./service";
import {
  fetchRuleBootstraps,
  fetchRuleDetailById,
  fetchRuleDetails,
  getRuleCategoryLabel,
  getRuleCategorySegments,
  getRuleCategoryTagType,
  getRuleScopeOptions,
  saveRule,
  updateRuleStatus
} from "./service";

type RuleFormMode = "create" | "edit";

const loading = ref(false);
const detailVisible = ref(false);
const formVisible = ref(false);
const formMode = ref<RuleFormMode>("create");
const currentRecord = ref<Schedule.RuleDetail | null>(null);
const formRef = ref<FormInstance>();
const ruleRecords = ref<Schedule.RuleDetail[]>([]);
const categoryCards = ref<Array<Schedule.OptionItem & { count: number }>>([]);
const categoryOptionItems = ref<Schedule.OptionItem[]>([]);
const scopeOptionItems = ref<Schedule.OptionItem[]>(getRuleScopeOptions());

const filters = reactive<RulePageFilters>({
  category: "time",
  status: "",
  priority: undefined,
  keyword: ""
});

const createEmptyForm = (): Schedule.RuleForm => ({
  category: "time",
  name: "",
  code: "",
  priority: 2,
  scope: "",
  status: "enabled",
  description: "",
  conditions: [{ field: "", operator: "", value: "" }]
});

const formModel = reactive<Schedule.RuleForm>(createEmptyForm());
const editingId = ref("");
const conditionValueText = ref<string[]>([""]);
const categorySegments = computed(() => getRuleCategorySegments());

const formRules: FormRules<Schedule.RuleForm> = {
  category: [{ required: true, message: "请选择规则分类", trigger: "change" }],
  name: [{ required: true, message: "请输入规则名称", trigger: "blur" }],
  code: [{ required: true, message: "请输入规则编号", trigger: "blur" }],
  priority: [{ required: true, message: "请选择优先级", trigger: "change" }],
  scope: [{ required: true, message: "请输入作用范围", trigger: "change" }],
  status: [{ required: true, message: "请选择状态", trigger: "change" }],
  description: [{ required: true, message: "请输入规则说明", trigger: "blur" }]
};

const stats = computed(() => [
  { label: "规则总数", value: ruleRecords.value.length, help: "统一沉淀排课约束规则" },
  { label: "启用规则", value: ruleRecords.value.filter(item => item.status === "enabled").length, help: "当前参与排课计算" },
  { label: "P1 规则", value: ruleRecords.value.filter(item => item.priority === 1).length, help: "硬约束或必须满足" },
  { label: "当前列表", value: ruleRecords.value.length, help: "符合筛选条件的规则" }
]);

watch(
  () => filters.category,
  () => {
    loadRules();
  }
);

watch(
  () => formModel.conditions,
  conditions => {
    conditionValueText.value = conditions.map(condition => serializeConditionValue(condition.value));
  },
  { deep: true, immediate: true }
);

const serializeConditionValue = (value: Schedule.RuleCondition["value"]) => {
  return Array.isArray(value) ? value.join(" / ") : String(value ?? "");
};

const parseConditionValue = (value: string): Schedule.RuleCondition["value"] => {
  if (value.includes("/")) {
    return value
      .split("/")
      .map(item => item.trim())
      .filter(Boolean);
  }
  if (value === "true") return true;
  if (value === "false") return false;
  if (value !== "" && !Number.isNaN(Number(value))) return Number(value);
  return value.trim();
};

const formatCondition = (condition: Schedule.RuleCondition) => {
  const value = Array.isArray(condition.value) ? condition.value.join(" / ") : String(condition.value);
  return `${condition.field} ${condition.operator} ${value}`;
};

const resetFormModel = () => {
  Object.assign(formModel, createEmptyForm());
  editingId.value = "";
  conditionValueText.value = formModel.conditions.map(condition => serializeConditionValue(condition.value));
};

const loadRules = async () => {
  loading.value = true;
  try {
    ruleRecords.value = await fetchRuleDetails(filters);
    categoryCards.value = await Promise.all(
      (await fetchRuleBootstraps()).categoryOptions.map(async item => ({
        ...item,
        count: (await fetchRuleDetails({ ...filters, category: item.value as Schedule.RuleCategory, keyword: "" })).length
      }))
    );
  } finally {
    loading.value = false;
  }
};

const loadBootstraps = async () => {
  const bootstrap = await fetchRuleBootstraps();
  categoryOptionItems.value = bootstrap.categoryOptions;
  scopeOptionItems.value = bootstrap.scopeOptions;
};

const openDetail = async (record: Schedule.RuleDetail) => {
  currentRecord.value = await fetchRuleDetailById(record.id);
  detailVisible.value = true;
};

const openCreate = () => {
  formMode.value = "create";
  resetFormModel();
  formVisible.value = true;
};

const openEdit = (record: Schedule.RuleDetail) => {
  formMode.value = "edit";
  editingId.value = record.id;
  Object.assign(formModel, {
    id: record.id,
    category: record.category,
    name: record.name,
    code: record.code,
    priority: record.priority,
    scope: record.scope,
    status: record.status,
    description: record.description,
    conditions: record.conditions.map(condition => ({ ...condition }))
  });
  conditionValueText.value = formModel.conditions.map(condition => serializeConditionValue(condition.value));
  formVisible.value = true;
};

const toggleStatus = async (record: Schedule.RuleDetail) => {
  const nextStatus: Schedule.RuleStatus = record.status === "enabled" ? "disabled" : "enabled";
  await updateRuleStatus(record.id, nextStatus);
  await loadRules();
  if (currentRecord.value?.id === record.id) {
    currentRecord.value = await fetchRuleDetailById(record.id);
  }
  ElMessage.success(`${record.name}已${nextStatus === "enabled" ? "启用" : "停用"}`);
};

const addCondition = () => {
  formModel.conditions.push({ field: "", operator: "", value: "" });
  conditionValueText.value.push("");
};

const removeCondition = (index: number) => {
  if (formModel.conditions.length === 1) {
    ElMessage.warning("至少保留一条规则条件");
    return;
  }
  formModel.conditions.splice(index, 1);
  conditionValueText.value.splice(index, 1);
};

const updateConditionValue = (index: number) => {
  formModel.conditions[index].value = parseConditionValue(conditionValueText.value[index] ?? "");
};

const submitForm = async () => {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  const normalizedConditions = formModel.conditions
    .map((condition, index) => ({
      field: condition.field.trim(),
      operator: condition.operator.trim(),
      value: parseConditionValue(conditionValueText.value[index] ?? "")
    }))
    .filter(condition => condition.field && condition.operator && String(condition.value).trim() !== "");

  if (normalizedConditions.length === 0) {
    ElMessage.warning("请至少填写一条完整规则条件");
    return;
  }

  await saveRule(
    {
      ...formModel,
      name: formModel.name.trim(),
      code: formModel.code.trim(),
      scope: formModel.scope.trim(),
      description: formModel.description.trim(),
      conditions: normalizedConditions
    },
    editingId.value || undefined
  );

  await loadRules();
  if (editingId.value) {
    currentRecord.value = await fetchRuleDetailById(editingId.value);
  }
  formVisible.value = false;
  ElMessage.success(formMode.value === "create" ? "规则已新增" : "规则已更新");
};

onMounted(async () => {
  await loadBootstraps();
  await loadRules();
});
</script>

<style scoped lang="scss">
.schedule-page-view,
.header-actions,
.filter-form {
  display: flex;
  flex-wrap: wrap;
}
.header-actions {
  gap: 12px;
}
.overview-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 18px;
}
.overview-card {
  padding: 14px 16px;
  background: linear-gradient(180deg, #fafefd 0%, #f2f8f7 100%);
  border: 1px solid #d7ebe7;
  border-radius: 12px;
}
.overview-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.overview-card p {
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
  color: #64748b;
}
.priority-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 38px;
  padding: 3px 10px;
  font-size: 12px;
  font-weight: 700;
  border-radius: 999px;
}
.priority-badge--p1 {
  color: #b42318;
  background: #fef3f2;
}
.priority-badge--p2 {
  color: #b54708;
  background: #fffaeb;
}
.priority-badge--p3 {
  color: #175cd3;
  background: #eff8ff;
}
.detail-stack {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.detail-panel h4 {
  margin: 0 0 12px;
  font-size: 15px;
  color: #1f2937;
}
.rule-form {
  padding-right: 12px;
}
.condition-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}
.condition-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1.2fr auto;
  gap: 10px;
  align-items: center;
}
.drawer-footer {
  display: flex;
  justify-content: flex-end;
}

@media (width <= 1200px) {
  .overview-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (width <= 768px) {
  .overview-grid,
  .condition-row {
    grid-template-columns: 1fr;
  }
}
</style>
