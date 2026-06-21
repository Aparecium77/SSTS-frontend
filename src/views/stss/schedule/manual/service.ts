import type { Schedule } from "@/api/interface/schedule";
import {
  manualAdjustmentRecords,
  manualApprovalOptions,
  manualConflictRecords,
  manualCourseOptions,
  manualCurrentSchedules,
  manualDefaultForm,
  manualPreviewRecords
} from "./mock";

export interface ManualPageFilters {
  keyword: string;
  status: Schedule.AdjustmentStatus | "all";
}

const delay = async () => {
  await Promise.resolve();
};

export const getManualApprovalOptions = async () => {
  await delay();
  return manualApprovalOptions;
};

export const getManualCourseOptions = async () => {
  await delay();
  return manualCourseOptions;
};

export const getManualCurrentSchedules = async () => {
  await delay();
  return manualCurrentSchedules;
};

export const getManualAdjustmentRecords = async (filters: ManualPageFilters) => {
  await delay();
  const keyword = filters.keyword.trim();

  return manualAdjustmentRecords.filter(item => {
    const matchesStatus = filters.status === "all" || item.status === filters.status;
    const matchesKeyword =
      !keyword || [item.courseName, item.originSlot, item.targetSlot, item.applicant].some(field => field.includes(keyword));
    return matchesStatus && matchesKeyword;
  });
};

export const getManualDefaultForm = async () => {
  await delay();
  return { ...manualDefaultForm };
};

export const getManualConflicts = async (params: Schedule.AdjustmentForm) => {
  await delay();

  if (params.targetDayOfWeek === 3 && params.targetSectionStart <= 2) {
    return [];
  }

  return manualConflictRecords;
};

export const getManualPreviewRecords = async (scheduleId: string) => {
  await delay();
  return manualPreviewRecords.filter(item => scheduleId === "schedule-02" || item.courseName.includes("数据结构"));
};

export const submitManualAdjustment = async (params: Schedule.AdjustmentForm) => {
  await delay();
  return {
    success: true,
    message: `已提交 ${params.scheduleId} 的调课申请，等待审批。`
  };
};
