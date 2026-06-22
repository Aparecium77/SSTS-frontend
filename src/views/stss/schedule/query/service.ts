import type { Schedule } from "@/api/interface/schedule";
import type { QueryCalendarCell, QueryDimensionTarget } from "./mock";
import {
  queryCalendarDayLabels,
  queryDimensionOptions,
  queryDimensionTargets,
  queryScheduleDetails,
  queryScheduleRecords,
  querySemesterOptions
} from "./mock";

export interface QueryPageFilters {
  semesterId: string;
  dimension: Schedule.ScheduleDimension;
  targetId: string;
  weekLabel: string;
  status: "" | Schedule.RecordStatus;
  keyword: string;
}

const delay = async () => {
  await Promise.resolve();
};

const matchDimensionTarget = (
  record: Schedule.ScheduleRecord,
  dimension: Schedule.ScheduleDimension,
  target?: QueryDimensionTarget
) => {
  if (!target) return true;

  const compareValue =
    {
      teacher: record.teacherName,
      student: record.className,
      class: record.className,
      classroom: record.classroomName
    }[dimension] ?? "";

  return compareValue.includes(target.label);
};

export const getQuerySemesterOptions = async () => {
  await delay();
  return querySemesterOptions;
};

export const getQueryDimensionOptions = async () => {
  await delay();
  return queryDimensionOptions;
};

export const getQueryTargetsByDimension = async (dimension: Schedule.ScheduleDimension) => {
  await delay();
  return queryDimensionTargets.filter(item => item.dimension === dimension);
};

export const getQueryRecords = async (filters: QueryPageFilters) => {
  await delay();
  const target = queryDimensionTargets.find(item => item.id === filters.targetId);

  return queryScheduleRecords.filter(item => {
    const matchesSemester = !filters.semesterId || item.semesterId === filters.semesterId;
    const matchesWeek = !filters.weekLabel || item.timeSlot.weekLabel === filters.weekLabel;
    const matchesStatus = !filters.status || item.status === filters.status;
    const keyword = filters.keyword.trim();
    const matchesKeyword =
      !keyword || [item.courseName, item.teacherName, item.className, item.classroomName].some(field => field.includes(keyword));
    const matchesTarget = !filters.targetId || matchDimensionTarget(item, filters.dimension, target);

    return matchesSemester && matchesWeek && matchesStatus && matchesKeyword && matchesTarget;
  });
};

export const getQueryRecordDetail = async (id: string) => {
  await delay();
  return queryScheduleDetails[id] ?? null;
};

export const getQueryCalendarCells = async (records: Schedule.ScheduleRecord[]): Promise<QueryCalendarCell[]> => {
  await delay();
  return queryCalendarDayLabels.map((dayLabel, index) => ({
    dayOfWeek: index + 1,
    dayLabel,
    records: records.filter(item => item.timeSlot.dayOfWeek === index + 1)
  }));
};
