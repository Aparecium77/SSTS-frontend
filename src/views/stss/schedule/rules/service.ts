import type { Schedule } from "@/api/interface/schedule";
import {
  changeRuleStatus as changeRuleStatusApi,
  createRule as createRuleApi,
  getRuleCategoryOptions as getRuleCategoryOptionsApi,
  getRuleDetail as getRuleDetailApi,
  getRulePage as getRulePageApi,
  updateRule as updateRuleApi
} from "@/api/modules/schedule";
import { ruleCategoryOptions, ruleRecords as seedRuleRecords, ruleScopeOptions } from "./mock";

export interface RulePageFilters {
  category: "" | Schedule.RuleCategory;
  status: "" | Schedule.RuleStatus;
  priority?: number;
  keyword: string;
}

const USE_REMOTE_API = false;

let localRuleRecords: Schedule.RuleDetail[] = seedRuleRecords.map(item => ({
  ...item,
  conditions: item.conditions.map(condition => ({ ...condition })),
  effectSummary: [...item.effectSummary]
}));

const cloneRuleDetail = (record: Schedule.RuleDetail): Schedule.RuleDetail => ({
  ...record,
  conditions: record.conditions.map(condition => ({ ...condition })),
  effectSummary: [...record.effectSummary]
});

const buildEffectSummary = (form: Schedule.RuleForm) => [
  `${getRuleCategoryLabel(form.category)}规则已纳入统一规则中心`,
  `作用范围：${form.scope.trim()}`,
  `优先级：P${form.priority}`
];

export const getRuleCategoryLabel = (category: Schedule.RuleCategory) =>
  ruleCategoryOptions.find(item => item.value === category)?.label ?? category;

export const getRuleCategoryTagType = (category: Schedule.RuleCategory) => {
  const typeMap: Record<Schedule.RuleCategory, "success" | "warning" | "danger" | "info"> = {
    time: "success",
    teacherConflict: "danger",
    classroomCapacity: "warning",
    courseArrangement: "info"
  };
  return typeMap[category];
};

export const getRuleCategorySegments = () => [
  { label: "全部", value: "" },
  ...ruleCategoryOptions.map(item => ({ label: item.label, value: item.value }))
];

export const getRuleScopeOptions = () => ruleScopeOptions;

export const getRuleCategoryCards = async () => {
  const records = await fetchRuleDetails();
  return ruleCategoryOptions.map(item => ({
    ...item,
    count: records.filter(record => record.category === item.value).length
  }));
};

export const fetchRuleDetails = async (filters?: RulePageFilters) => {
  if (USE_REMOTE_API) {
    const params: Schedule.RuleQuery = {
      pageNum: 1,
      pageSize: 50,
      category: filters?.category || undefined,
      status: filters?.status || undefined,
      priority: filters?.priority,
      keyword: filters?.keyword || undefined
    };
    const [pageRes, categoryRes] = await Promise.all([getRulePageApi(params), getRuleCategoryOptionsApi()]);
    void categoryRes;
    return pageRes.data.list.map(
      item =>
        ({
          ...item,
          conditions: [],
          effectSummary: []
        }) satisfies Schedule.RuleDetail
    );
  }

  const keyword = filters?.keyword.trim().toLowerCase() ?? "";
  return localRuleRecords
    .filter(item => {
      const matchesCategory = !filters?.category || item.category === filters.category;
      const matchesStatus = !filters?.status || item.status === filters.status;
      const matchesPriority = !filters?.priority || item.priority === filters.priority;
      const matchesKeyword =
        !keyword || [item.name, item.code, item.scope, item.description].some(field => field.toLowerCase().includes(keyword));
      return matchesCategory && matchesStatus && matchesPriority && matchesKeyword;
    })
    .map(cloneRuleDetail);
};

export const fetchRuleDetailById = async (id: string) => {
  if (USE_REMOTE_API) {
    const response = await getRuleDetailApi(id);
    return response.data;
  }
  const record = localRuleRecords.find(item => item.id === id);
  return record ? cloneRuleDetail(record) : null;
};

export const saveRule = async (form: Schedule.RuleForm, editingId?: string) => {
  const payload: Schedule.RuleDetail = {
    id: editingId || `rule-${Date.now()}`,
    category: form.category,
    name: form.name.trim(),
    code: form.code.trim(),
    priority: form.priority,
    scope: form.scope.trim(),
    status: form.status,
    description: form.description.trim(),
    conditions: form.conditions.map(condition => ({ ...condition })),
    effectSummary: buildEffectSummary(form),
    updatedAt: "2026-05-22 10:30"
  };

  if (USE_REMOTE_API) {
    if (editingId) {
      await updateRuleApi(form);
    } else {
      await createRuleApi(form);
    }
    return payload;
  }

  if (editingId) {
    localRuleRecords = localRuleRecords.map(item => (item.id === editingId ? payload : item));
  } else {
    localRuleRecords = [payload, ...localRuleRecords];
  }
  return cloneRuleDetail(payload);
};

export const updateRuleStatus = async (id: string, status: Schedule.RuleStatus) => {
  if (USE_REMOTE_API) {
    await changeRuleStatusApi({ id, status });
    return status;
  }

  localRuleRecords = localRuleRecords.map(item => (item.id === id ? { ...item, status, updatedAt: "2026-05-22 10:30" } : item));
  return status;
};

export const fetchRuleBootstraps = async () => {
  if (USE_REMOTE_API) {
    const options = await getRuleCategoryOptionsApi();
    return {
      categoryOptions: options.data ?? [],
      scopeOptions: ruleScopeOptions
    };
  }

  return {
    categoryOptions: ruleCategoryOptions,
    scopeOptions: ruleScopeOptions
  };
};
