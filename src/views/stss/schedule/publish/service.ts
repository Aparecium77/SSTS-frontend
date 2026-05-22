import type { ResPage, ResultData } from "@/api/interface";
import type { Schedule } from "@/api/interface/schedule";
import { publishRecords as seedRecords } from "./mock";

let publishStore: Schedule.PublishRecord[] = seedRecords.map(item => ({ ...item }));

const cloneRecord = (record: Schedule.PublishRecord): Schedule.PublishRecord => ({ ...record });

const normalizeKeyword = (value?: string) => value?.trim().toLowerCase() ?? "";

const filterRecords = (params: Schedule.PublishQuery) => {
  const keyword = normalizeKeyword(params.keyword || params.version);
  return publishStore.filter(item => {
    const matchesStatus = !params.status || item.status === params.status;
    const matchesKeyword =
      !keyword ||
      [item.version, item.semesterName, item.targetScope, item.publishedBy].some(field => field.toLowerCase().includes(keyword));
    return matchesStatus && matchesKeyword;
  });
};

export const getLocalPublishPage = async (
  params: Schedule.PublishQuery
): Promise<ResultData<ResPage<Schedule.PublishRecord>>> => {
  const filtered = filterRecords(params);
  const pageNum = params.pageNum ?? 1;
  const pageSize = params.pageSize ?? 10;
  const start = (pageNum - 1) * pageSize;

  return {
    code: "200",
    msg: "success",
    data: {
      list: filtered.slice(start, start + pageSize).map(cloneRecord),
      pageNum,
      pageSize,
      total: filtered.length
    }
  };
};

export const createLocalPublishRecord = async (
  params: Schedule.PublishForm & { semesterName: string; publishedBy: string }
): Promise<ResultData<Schedule.PublishRecord>> => {
  const nextIndex = publishStore.length + 1;
  const version = `V2026.05.${String(20 + nextIndex).padStart(2, "0")}`;
  const record: Schedule.PublishRecord = {
    id: `publish-${Date.now()}`,
    version,
    semesterName: params.semesterName,
    publishedAt: "2026-05-22 11:30",
    publishedBy: params.publishedBy,
    status: "published",
    targetScope: params.targetScope,
    note: params.note?.trim()
  };

  publishStore = [record, ...publishStore];

  return {
    code: "200",
    msg: "success",
    data: cloneRecord(record)
  };
};

export const rollbackLocalPublishRecord = async (params: {
  id: string;
  note?: string;
}): Promise<ResultData<Schedule.PublishRecord | null>> => {
  const target = publishStore.find(item => item.id === params.id) ?? null;
  if (!target) {
    return {
      code: "404",
      msg: "publish record not found",
      data: null
    };
  }

  target.status = "rolledBack";
  target.note = params.note?.trim() || target.note || "手动回滚。";

  return {
    code: "200",
    msg: "success",
    data: cloneRecord(target)
  };
};
