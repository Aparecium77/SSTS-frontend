import type { ResPage, ResultData } from "@/api/interface";
import type { Schedule } from "@/api/interface/schedule";
import { resourceDetailMap, resourceRecords as seedRecords, resourceStatsSeed } from "./mock";

type ResourceMutationPayload = Schedule.ResourceForm;

let resourceStore: Schedule.ResourceRecord[] = seedRecords.map(item => ({ ...item, tags: [...item.tags] }));

const cloneRecord = (record: Schedule.ResourceRecord): Schedule.ResourceRecord => ({
  ...record,
  tags: [...record.tags]
});

const cloneDetail = (detail: Schedule.ResourceDetail): Schedule.ResourceDetail => ({
  ...detail,
  tags: [...detail.tags],
  relatedCourses: [...(detail.relatedCourses ?? [])],
  semester: { ...detail.semester }
});

const normalizeKeyword = (value?: string) => value?.trim().toLowerCase() ?? "";

const buildPage = (params: Schedule.ResourceQuery): ResPage<Schedule.ResourceRecord> => {
  const keyword = normalizeKeyword(params.keyword);
  const filtered = resourceStore.filter(item => {
    const matchesCategory = !params.category || item.category === params.category;
    const matchesDepartment = !params.department || item.department === params.department;
    const matchesStatus = !params.status || item.status === params.status;
    const matchesKeyword =
      !keyword || [item.name, item.code, item.ownerName].some(field => field.toLowerCase().includes(keyword));
    return matchesCategory && matchesDepartment && matchesStatus && matchesKeyword;
  });

  const pageNum = params.pageNum ?? 1;
  const pageSize = params.pageSize ?? 10;
  const start = (pageNum - 1) * pageSize;
  const list = filtered.slice(start, start + pageSize).map(cloneRecord);

  return {
    list,
    pageNum,
    pageSize,
    total: filtered.length
  };
};

const buildStats = (params: Schedule.ResourceQuery): Schedule.ResourceStats => {
  const page = buildPage({ ...params, pageNum: 1, pageSize: resourceStore.length || 1 });
  const list = page.list;
  return {
    total: list.length,
    enabled: list.filter(item => item.status === "enabled").length,
    disabled: list.filter(item => item.status === "disabled").length,
    warningCount: list.filter(item => item.status === "disabled" || (item.capacity ?? 9999) < 45).length
  };
};

const syncDetailRecord = (record: Schedule.ResourceRecord) => {
  const existing = resourceDetailMap[record.id];
  if (existing) {
    resourceDetailMap[record.id] = {
      ...existing,
      ...record,
      tags: [...record.tags]
    };
    return;
  }

  resourceDetailMap[record.id] = {
    ...cloneDetail(resourceDetailMap.default),
    ...record,
    tags: [...record.tags],
    usageRate: undefined,
    relatedCourses: []
  };
};

export const getLocalResourcePage = async (
  params: Schedule.ResourceQuery
): Promise<ResultData<ResPage<Schedule.ResourceRecord>>> => {
  return {
    code: "200",
    msg: "success",
    data: buildPage(params)
  };
};

export const getLocalResourceStats = async (params: Schedule.ResourceQuery): Promise<ResultData<Schedule.ResourceStats>> => {
  return {
    code: "200",
    msg: "success",
    data: buildStats(params)
  };
};

export const getLocalResourceDetail = async (id: string): Promise<ResultData<Schedule.ResourceDetail>> => {
  const detail = resourceDetailMap[id];
  const record = resourceStore.find(item => item.id === id);
  const data =
    detail != null
      ? cloneDetail(detail)
      : {
          ...cloneDetail(resourceDetailMap.default),
          ...(record ? cloneRecord(record) : cloneRecord(seedRecords[0])),
          usageRate: undefined,
          relatedCourses: []
        };

  return {
    code: "200",
    msg: "success",
    data
  };
};

export const createLocalResource = async (params: ResourceMutationPayload): Promise<ResultData<Schedule.ResourceRecord>> => {
  const record: Schedule.ResourceRecord = {
    id: `res-${Date.now()}`,
    category: params.category,
    name: params.name.trim(),
    code: params.code.trim(),
    department: params.department,
    ownerName: params.ownerName.trim(),
    capacity: params.capacity,
    status: params.status,
    tags: [...params.tags],
    updatedAt: "2026-05-22 10:30",
    remark: params.remark?.trim()
  };

  resourceStore = [record, ...resourceStore];
  syncDetailRecord(record);

  return {
    code: "200",
    msg: "success",
    data: cloneRecord(record)
  };
};

export const updateLocalResource = async (params: ResourceMutationPayload): Promise<ResultData<Schedule.ResourceRecord>> => {
  const index = resourceStore.findIndex(item => item.id === params.id);
  const record: Schedule.ResourceRecord = {
    id: params.id ?? `res-${Date.now()}`,
    category: params.category,
    name: params.name.trim(),
    code: params.code.trim(),
    department: params.department,
    ownerName: params.ownerName.trim(),
    capacity: params.capacity,
    status: params.status,
    tags: [...params.tags],
    updatedAt: "2026-05-22 10:30",
    remark: params.remark?.trim()
  };

  if (index >= 0) {
    resourceStore.splice(index, 1, record);
  } else {
    resourceStore.unshift(record);
  }
  syncDetailRecord(record);

  return {
    code: "200",
    msg: "success",
    data: cloneRecord(record)
  };
};

export const changeLocalResourceStatus = async (params: {
  id: string;
  status: Schedule.ResourceStatus;
}): Promise<ResultData<Schedule.ResourceRecord | null>> => {
  const record = resourceStore.find(item => item.id === params.id) ?? null;
  if (!record) {
    return {
      code: "404",
      msg: "resource not found",
      data: null
    };
  }

  record.status = params.status;
  record.updatedAt = "2026-05-22 10:30";
  syncDetailRecord(record);

  return {
    code: "200",
    msg: "success",
    data: cloneRecord(record)
  };
};

export const getLocalResourceStatsSeed = () => ({ ...resourceStatsSeed });
