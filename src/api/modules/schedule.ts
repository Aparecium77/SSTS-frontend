import type { ResPage, ResultData } from "@/api/interface";
import { SCHEDULE_API } from "@/api/config/servicePort";
import type { Schedule } from "@/api/interface/schedule";
import http from "@/api";

const SCHEDULE_PREFIX = SCHEDULE_API;

// 课表查询
export const getScheduleOverview = (params: Schedule.ScheduleQuery) => {
  return http.post<ResultData<Schedule.ScheduleStats>>(SCHEDULE_PREFIX + "/query/overview", params);
};

export const getScheduleRecordPage = (params: Schedule.ScheduleQuery) => {
  return http.post<ResPage<Schedule.ScheduleRecord>>(SCHEDULE_PREFIX + "/query/page", params);
};

export const getScheduleDetail = (id: string) => {
  return http.get<ResultData<Schedule.ScheduleDetail>>(SCHEDULE_PREFIX + `/query/detail/${id}`);
};

export const getScheduleDimensionOptions = () => {
  return http.get<Schedule.OptionItem[]>(SCHEDULE_PREFIX + "/query/dimensions");
};

// 教学资源
export const getResourceStats = (params: Schedule.ResourceQuery) => {
  return http.post<ResultData<Schedule.ResourceStats>>(SCHEDULE_PREFIX + "/resources/stats", params);
};

export const getResourcePage = (params: Schedule.ResourceQuery) => {
  return http.post<ResPage<Schedule.ResourceRecord>>(SCHEDULE_PREFIX + "/resources/page", params);
};

export const getResourceDetail = (id: string) => {
  return http.get<ResultData<Schedule.ResourceDetail>>(SCHEDULE_PREFIX + `/resources/detail/${id}`);
};

export const createResource = (params: Schedule.ResourceForm) => {
  return http.post(SCHEDULE_PREFIX + "/resources/create", params);
};

export const updateResource = (params: Schedule.ResourceForm) => {
  return http.post(SCHEDULE_PREFIX + "/resources/update", params);
};

export const changeResourceStatus = (params: { id: string; status: Schedule.ResourceStatus }) => {
  return http.post(SCHEDULE_PREFIX + "/resources/change-status", params);
};

export const getResourceCategoryOptions = () => {
  return http.get<Schedule.OptionItem[]>(SCHEDULE_PREFIX + "/resources/categories");
};

// 排课规则
export const getRuleStats = (params: Schedule.RuleQuery) => {
  return http.post<ResultData<Schedule.RuleStats>>(SCHEDULE_PREFIX + "/rules/stats", params);
};

export const getRulePage = (params: Schedule.RuleQuery) => {
  return http.post<ResPage<Schedule.RuleRecord>>(SCHEDULE_PREFIX + "/rules/page", params);
};

export const getRuleDetail = (id: string) => {
  return http.get<ResultData<Schedule.RuleDetail>>(SCHEDULE_PREFIX + `/rules/detail/${id}`);
};

export const createRule = (params: Schedule.RuleForm) => {
  return http.post(SCHEDULE_PREFIX + "/rules/create", params);
};

export const updateRule = (params: Schedule.RuleForm) => {
  return http.post(SCHEDULE_PREFIX + "/rules/update", params);
};

export const changeRuleStatus = (params: { id: string; status: Schedule.RuleStatus }) => {
  return http.post(SCHEDULE_PREFIX + "/rules/change-status", params);
};

export const getRuleCategoryOptions = () => {
  return http.get<Schedule.OptionItem[]>(SCHEDULE_PREFIX + "/rules/categories");
};

// 手工调课
export const getAdjustmentPage = (params: Schedule.PageQuery) => {
  return http.post<ResPage<Schedule.AdjustmentRecord>>(SCHEDULE_PREFIX + "/manual/page", params);
};

export const detectAdjustmentConflicts = (params: Schedule.AdjustmentForm) => {
  return http.post<ResultData<Schedule.ConflictRecord[]>>(SCHEDULE_PREFIX + "/manual/conflicts", params);
};

export const submitAdjustment = (params: Schedule.AdjustmentForm) => {
  return http.post(SCHEDULE_PREFIX + "/manual/submit", params);
};

// 课表发布
export const getPublishPage = (params: Schedule.PublishQuery) => {
  return http.post<ResPage<Schedule.PublishRecord>>(SCHEDULE_PREFIX + "/publish/page", params);
};

export const createPublishRecord = (params: Schedule.PublishForm) => {
  return http.post(SCHEDULE_PREFIX + "/publish/create", params);
};

export const rollbackPublishRecord = (params: { id: string }) => {
  return http.post(SCHEDULE_PREFIX + "/publish/rollback", params);
};

// 自动排课
export const getAutoTaskPage = (params: Schedule.TaskQuery) => {
  return http.post<ResPage<Schedule.AutoTaskRecord>>(SCHEDULE_PREFIX + "/auto/page", params);
};

export const createAutoTask = (params: Schedule.AutoTaskForm) => {
  return http.post(SCHEDULE_PREFIX + "/auto/create", params);
};

export const executeAutoTask = (params: { id: string }) => {
  return http.post(SCHEDULE_PREFIX + "/auto/execute", params);
};

export const getAutoTaskResult = (id: string) => {
  return http.get<ResultData<Schedule.AutoTaskResult>>(SCHEDULE_PREFIX + `/auto/result/${id}`);
};
