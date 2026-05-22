import type { Schedule } from "@/api/interface/schedule";
import {
  createAutoTask as createAutoTaskApi,
  executeAutoTask as executeAutoTaskApi,
  getAutoTaskPage as getAutoTaskPageApi,
  getAutoTaskResult as getAutoTaskResultApi
} from "@/api/modules/schedule";
import {
  autoTaskRecords as seedAutoTaskRecords,
  autoTaskResults as seedAutoTaskResults,
  resourceScopeOptions,
  ruleOptions,
  semesterOptions,
  taskStatusOptions,
  type AutoResultView,
  type AutoTaskView
} from "./mock";

export interface AutoTaskFilters {
  status: "" | Schedule.TaskStatus;
  semesterId: string;
  keyword: string;
}

const USE_REMOTE_API = false;

let localTaskRecords: AutoTaskView[] = seedAutoTaskRecords.map(item => ({
  ...item,
  ruleIds: [...item.ruleIds],
  resourceScope: [...item.resourceScope]
}));

let localTaskResults: AutoResultView[] = seedAutoTaskResults.map(item => ({
  ...item,
  summary: [...item.summary],
  conflictBreakdown: item.conflictBreakdown.map(conflict => ({ ...conflict })),
  conflicts: item.conflicts.map(conflict => ({ ...conflict }))
}));

const cloneTaskRecord = (record: AutoTaskView): AutoTaskView => ({
  ...record,
  ruleIds: [...record.ruleIds],
  resourceScope: [...record.resourceScope]
});

const cloneTaskResult = (result: AutoResultView): AutoResultView => ({
  ...result,
  summary: [...result.summary],
  conflictBreakdown: result.conflictBreakdown.map(conflict => ({ ...conflict })),
  conflicts: result.conflicts.map(conflict => ({ ...conflict }))
});

const buildMockResult = (task: AutoTaskView): AutoResultView => ({
  taskId: task.id,
  taskName: task.taskName,
  semesterName: task.semesterName,
  arrangedCourses: task.progress.processed,
  unresolvedConflicts: task.conflictCount,
  generatedAt: "2026-05-22 11:20",
  summary: [
    `已基于 ${task.ruleIds.length} 条规则参与排课计算`,
    `资源范围覆盖 ${task.resourceScope.length} 个资源池`,
    task.avoidWeekend ? "已启用周末规避策略" : "允许周末作为候选排课窗口"
  ],
  successRate: task.progress.percent,
  conflictBreakdown: [
    { label: "教师时间冲突", count: Math.max(task.conflictCount - 2, 0), level: "high" },
    { label: "教室容量不足", count: Math.min(task.conflictCount, 2), level: "medium" }
  ],
  conflicts:
    task.conflictCount > 0
      ? [
          {
            id: `${task.id}-conflict-1`,
            level: "high",
            title: "教师时间冲突",
            message: "模拟结果显示仍存在教师同一时段重复授课。",
            relatedEntity: "教师资源池"
          },
          {
            id: `${task.id}-conflict-2`,
            level: "medium",
            title: "教室容量不足",
            message: "部分大班课程未匹配到足够容量的教室。",
            relatedEntity: "大教室资源池"
          }
        ]
      : []
});

export const getTaskStatusLabel = (status: Schedule.TaskStatus) =>
  taskStatusOptions.find(item => item.value === status)?.label ?? status;

export const getTaskStatusTagType = (status: Schedule.TaskStatus) => {
  const typeMap: Record<Schedule.TaskStatus, "info" | "warning" | "success" | "danger"> = {
    draft: "info",
    queued: "warning",
    running: "warning",
    completed: "success",
    failed: "danger"
  };
  return typeMap[status];
};

export const getConflictTagType = (level: Schedule.ConflictRecord["level"]) => {
  const typeMap: Record<Schedule.ConflictRecord["level"], "danger" | "warning" | "info"> = {
    high: "danger",
    medium: "warning",
    low: "info"
  };
  return typeMap[level];
};

export const getTaskStatusOptions = () => taskStatusOptions;

export const fetchAutoBootstraps = async () => ({
  semesterOptions,
  ruleOptions,
  resourceScopeOptions,
  statusOptions: taskStatusOptions
});

export const fetchAutoTasks = async (filters?: AutoTaskFilters) => {
  if (USE_REMOTE_API) {
    const response = await getAutoTaskPageApi({
      pageNum: 1,
      pageSize: 50,
      status: filters?.status || undefined,
      semesterId: filters?.semesterId || undefined,
      keyword: filters?.keyword || undefined
    });
    return response.data.list.map(
      item =>
        ({
          ...item,
          semesterId: filters?.semesterId || "",
          ruleIds: [],
          resourceScope: [],
          preferContinuousCourse: false,
          avoidWeekend: false
        }) satisfies AutoTaskView
    );
  }

  const keyword = filters?.keyword.trim().toLowerCase() ?? "";
  return localTaskRecords
    .filter(item => {
      const matchesStatus = !filters?.status || item.status === filters.status;
      const matchesSemester = !filters?.semesterId || item.semesterId === filters.semesterId;
      const matchesKeyword =
        !keyword ||
        [item.taskName, item.semesterName, item.createdBy, item.note ?? ""].some(field => field.toLowerCase().includes(keyword));
      return matchesStatus && matchesSemester && matchesKeyword;
    })
    .map(cloneTaskRecord);
};

export const fetchAutoTaskResult = async (taskId: string) => {
  if (USE_REMOTE_API) {
    const response = await getAutoTaskResultApi(taskId);
    return {
      ...response.data.data,
      taskName: "",
      semesterName: "",
      successRate: 0,
      conflictBreakdown: [],
      conflicts: []
    } satisfies AutoResultView;
  }

  const result = localTaskResults.find(item => item.taskId === taskId);
  return result ? cloneTaskResult(result) : null;
};

export const createAutoTaskDraft = async (
  form: Schedule.AutoTaskForm & { taskName: string; semesterName: string; note?: string }
) => {
  const payload: AutoTaskView = {
    id: `task-${Date.now()}`,
    taskName: form.taskName.trim(),
    semesterId: form.semesterId,
    semesterName: form.semesterName,
    status: "draft",
    createdBy: "当前用户",
    createdAt: "2026-05-22 11:00",
    progress: {
      processed: 0,
      total: 240,
      percent: 0
    },
    conflictCount: 0,
    ruleIds: [...form.ruleIds],
    resourceScope: [...form.resourceScope],
    preferContinuousCourse: form.preferContinuousCourse,
    avoidWeekend: form.avoidWeekend,
    note: form.note
  };

  if (USE_REMOTE_API) {
    await createAutoTaskApi(form);
    return payload;
  }

  localTaskRecords = [payload, ...localTaskRecords];
  return cloneTaskRecord(payload);
};

export const executeAutoTaskById = async (taskId: string) => {
  if (USE_REMOTE_API) {
    await executeAutoTaskApi({ id: taskId });
    return taskId;
  }

  localTaskRecords = localTaskRecords.map(item => {
    if (item.id !== taskId) return item;

    const nextStatus: Schedule.TaskStatus = item.status === "failed" ? "queued" : "running";
    const nextProgress =
      nextStatus === "queued"
        ? item.progress
        : {
            processed: Math.max(item.progress.processed, Math.floor(item.progress.total * 0.72)),
            total: item.progress.total,
            percent: Math.max(item.progress.percent, 72)
          };

    const nextRecord: AutoTaskView = {
      ...item,
      status: nextStatus,
      progress: nextProgress,
      createdAt: item.createdAt,
      latestResultId: `${item.id}-latest`
    };

    const nextResult = buildMockResult({
      ...nextRecord,
      conflictCount: nextStatus === "running" ? Math.max(item.conflictCount, 4) : item.conflictCount
    });

    const resultIndex = localTaskResults.findIndex(result => result.taskId === item.id);
    if (resultIndex >= 0) {
      localTaskResults[resultIndex] = nextResult;
    } else {
      localTaskResults = [nextResult, ...localTaskResults];
    }

    return nextRecord;
  });

  return taskId;
};
