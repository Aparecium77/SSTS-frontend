/**
 * 基础信息管理 API。请求统一经 Gateway 转发到 info_service。
 */
import type { BaseInfo } from "@/api/interface/baseInfo";
import http from "@/api";
import { PORT1 } from "@/api/config/servicePort";

type ApiResponse<T> = { data?: T } & T;
type BackendList<T> = { items?: T[]; pagination?: { total?: number } };

const unwrap = <T>(res: ApiResponse<T>) => (res?.data ?? res) as T;

const extractList = <T>(res: ApiResponse<BackendList<T>>): BaseInfo.PageResult<T> => {
  const body = unwrap<BackendList<T>>(res);
  return {
    list: body.items ?? [],
    total: body.pagination?.total ?? 0
  };
};

const compact = <T extends Record<string, any>>(obj: T) =>
  Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== "" && value !== undefined && value !== null));

const toPageQuery = (query: Record<string, any>) =>
  compact({
    page: query.pageNum,
    page_size: query.pageSize,
    keyword: query.keyword,
    status: query.status,
    category: query.category,
    building: query.building,
    classroom_type: query.classroomType,
    min_capacity: query.minCapacity,
    is_active: query.isActive
  });

const pageSlice = <T>(items: T[], pageNum: number, pageSize: number) => {
  const start = (pageNum - 1) * pageSize;
  return items.slice(start, start + pageSize);
};

const shouldFetchAll = (query: Record<string, any>, keys: string[]) =>
  keys.some(key => query[key] !== "" && query[key] !== undefined && query[key] !== null);

const fetchAllPages = async <T>(
  fetchPage: (page: number, pageSize: number) => Promise<BaseInfo.PageResult<T>>,
  pageSize = 100
) => {
  const first = await fetchPage(1, pageSize);
  const pages = Math.ceil(first.total / pageSize);
  if (pages <= 1) return first.list;
  const rest = await Promise.all(Array.from({ length: pages - 1 }, (_, index) => fetchPage(index + 2, pageSize)));
  return first.list.concat(rest.flatMap(item => item.list));
};

export const getBaseInfoFileDownloadUrl = (fileId: string) => (fileId ? `${PORT1}/files/${fileId}/download` : "");

const getDownloadUrl = (accessUrl: string) => {
  if (!accessUrl) return "";
  return accessUrl.startsWith("/api/v1/info") ? accessUrl : accessUrl.replace("/api/v1/files", `${PORT1}/files`);
};

const statusToBackend = (status: BaseInfo.UserStatus) => (status === "INACTIVE" ? "DISABLED" : status);
const statusFromBackend = (status?: string): BaseInfo.UserStatus => {
  if (status === "DISABLED" || status === "INACTIVE") return "DISABLED";
  return "ACTIVE";
};

export const BASE_INFO_ROLE_OPTIONS: BaseInfo.RoleOption[] = [
  { id: 1, label: "学生", code: "STUDENT" },
  { id: 2, label: "教师", code: "TEACHER" },
  { id: 3, label: "教务管理员", code: "ACADEMIC_ADMIN" },
  { id: 4, label: "系统管理员", code: "SYS_ADMIN" },
  { id: 5, label: "服务账号", code: "SERVICE" }
];

export const BASE_INFO_EDITABLE_ROLE_OPTIONS = BASE_INFO_ROLE_OPTIONS.filter(role => [1, 2, 3].includes(role.id));

const validRoleIdSet = new Set(BASE_INFO_ROLE_OPTIONS.map(role => role.id));

const normalizeRoleIds = (roleIds: Array<number | string>) =>
  Array.from(
    new Set(
      roleIds.map(item => Number(String(item).trim())).filter(id => Number.isInteger(id) && id > 0 && validRoleIdSet.has(id))
    )
  );

const roleIdsFromString = (roleIds: string) => normalizeRoleIds(roleIds.split(","));

const roleIdsFromNames = (roleNames: string[]) =>
  normalizeRoleIds(
    roleNames
      .map(name => name.trim())
      .map(name => BASE_INFO_ROLE_OPTIONS.find(role => role.label === name || role.code === name)?.id ?? "")
  );

type CurrentAuthIdentity = {
  user_id?: string;
  username?: string;
  role?: string;
};

const roleIdsFromAuthRole = (role?: string) => {
  if (!role) return [];
  return BASE_INFO_ROLE_OPTIONS.filter(option => option.code === role || option.label === role).map(option => option.id);
};

const getCurrentAuthIdentity = async (): Promise<CurrentAuthIdentity> => {
  try {
    const res = await http.get("/auth/me", {}, { cancel: false, loading: false });
    const body = unwrap<any>(res as any);
    return {
      user_id: body.user_id ?? "",
      username: body.username ?? "",
      role: body.role ?? ""
    };
  } catch {
    return {};
  }
};

export const enrichBaseInfoUserFromCurrentAuthApi = async (user: BaseInfo.UserItem) => {
  if (user.roleIds || user.roleNames.length || !user.username) return user;
  const identity = await getCurrentAuthIdentity();
  const sameUser = identity.username === user.username || (!!identity.user_id && identity.user_id === user.id);
  if (!sameUser) return user;
  const roleIds = roleIdsFromAuthRole(identity.role);
  if (!roleIds.length) return user;
  return {
    ...user,
    roleIds: roleIds.join(","),
    roleNames: roleIds.map(id => BASE_INFO_ROLE_OPTIONS.find(role => role.id === id)?.label ?? "").filter(Boolean)
  };
};

const convertUploadedFile = (item: any): BaseInfo.UploadedFile => ({
  id: String(item.id ?? ""),
  fileName: item.file_name ?? "",
  fileType: item.file_type ?? "",
  fileSize: item.file_size ?? 0,
  accessUrl: getDownloadUrl(item.access_url ?? "")
});

export const uploadBaseInfoFileApi = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  const res = await http.post(`${PORT1}/files/`, formData, { cancel: false });
  return convertUploadedFile(unwrap<any>(res as any));
};

// ═══════════════════════════════════════════════════════════════════
// 用户与档案
// ═══════════════════════════════════════════════════════════════════

const convertUserItem = (item: any): BaseInfo.UserItem => ({
  id: String(item.id ?? ""),
  userNo: item.user_no ?? "",
  username: item.username ?? "",
  roleIds: item.role_ids ?? "",
  roleNames: item.role_names ?? [],
  fullName: item.profile?.full_name ?? "",
  gender: item.profile?.gender ?? "",
  phone: item.profile?.phone ?? "",
  email: item.profile?.email ?? "",
  status: statusFromBackend(item.profile?.status),
  avatarFileId: item.profile?.avatar_file_id ? String(item.profile.avatar_file_id) : "",
  isDeleted: Boolean(item.is_deleted),
  createdAt: item.created_at ?? "",
  updatedAt: item.updated_at ?? ""
});

const userPayload = (form: BaseInfo.UserForm) => {
  const roleIds = normalizeRoleIds(form.roleIds);
  const shouldSyncRoleIds = form.syncRoleIds !== false;
  return compact({
    user_no: form.userNo,
    username: form.username,
    role_ids: shouldSyncRoleIds && roleIds.length ? roleIds : undefined,
    full_name: form.fullName,
    gender: form.gender,
    phone: form.phone,
    email: form.email,
    status: statusToBackend(form.status)
  });
};

const userCreatePayload = (form: BaseInfo.UserForm) => {
  const roleIds = normalizeRoleIds(form.roleIds);
  return compact({
    user_no: form.userNo,
    username: form.username,
    role_ids: roleIds.length ? roleIds : undefined,
    full_name: form.fullName,
    gender: form.gender,
    phone: form.phone,
    email: form.email
  });
};

export const getBaseInfoUserListApi = async (query: BaseInfo.UserQuery) => {
  const res = await http.get(`${PORT1}/users/`, toPageQuery(query));
  const { list, total } = extractList<any>(res as any);
  return { list: list.map(convertUserItem), total };
};

export const getBaseInfoUserDetailApi = async (id: string) => {
  const res = await http.get(`${PORT1}/users/${id}`);
  return convertUserItem(unwrap<any>(res as any));
};

export const getBaseInfoUserDetailWithRolesApi = async (row: BaseInfo.UserItem) => {
  const detail = await enrichBaseInfoUserFromCurrentAuthApi(await getBaseInfoUserDetailApi(row.id));
  return {
    ...detail,
    roleNames: detail.roleNames.length ? detail.roleNames : row.roleNames,
    roleIds: detail.roleIds || row.roleIds
  };
};

export const saveBaseInfoUserApi = async (form: BaseInfo.UserForm) => {
  if (form.id) {
    const res = await http.patch(`${PORT1}/users/${form.id}`, userPayload(form));
    return convertUserItem(unwrap<any>(res as any));
  }
  const created = convertUserItem(unwrap<any>((await http.post(`${PORT1}/users/`, userCreatePayload(form))) as any));
  if (form.status !== "ACTIVE") {
    const patched = await http.patch(`${PORT1}/users/${created.id}`, { status: statusToBackend(form.status) });
    return convertUserItem(unwrap<any>(patched as any));
  }
  return created;
};

export const deleteBaseInfoUserApi = async (id: string) => {
  await http.delete(`${PORT1}/users/${id}`);
};

// ═══════════════════════════════════════════════════════════════════
// 课程资源
// ═══════════════════════════════════════════════════════════════════

const convertCourseItem = (item: any): BaseInfo.CourseItem => ({
  id: String(item.id ?? ""),
  courseNo: item.course_code ?? "",
  courseName: item.course_name ?? "",
  credits: item.credit ?? 0,
  capacity: item.capacity ?? 0,
  assessmentMethod: item.assessment_method ?? "",
  isActive: item.is_active ?? true,
  createdAt: item.created_at ?? "",
  updatedAt: item.updated_at ?? ""
});

const coursePayload = (form: BaseInfo.CourseForm) =>
  compact({
    course_code: form.courseNo,
    course_name: form.courseName,
    credit: form.credits,
    capacity: form.capacity,
    assessment_method: form.assessmentMethod,
    is_active: form.isActive
  });

const courseCreatePayload = (form: BaseInfo.CourseForm) =>
  compact({
    course_code: form.courseNo,
    course_name: form.courseName,
    credit: form.credits,
    capacity: form.capacity,
    assessment_method: form.assessmentMethod
  });

export const getBaseInfoCourseListApi = async (query: BaseInfo.CourseQuery) => {
  const res = await http.get(`${PORT1}/courses/`, toPageQuery(query));
  const { list, total } = extractList<any>(res as any);
  return { list: list.map(convertCourseItem), total };
};

export const getBaseInfoCourseDetailApi = async (id: string) => {
  const res = await http.get(`${PORT1}/courses/${id}`);
  return convertCourseItem(unwrap<any>(res as any));
};

export const saveBaseInfoCourseApi = async (form: BaseInfo.CourseForm) => {
  if (form.id) {
    const res = await http.patch(`${PORT1}/courses/${form.id}`, coursePayload(form));
    return convertCourseItem(unwrap<any>(res as any));
  }
  const created = convertCourseItem(unwrap<any>((await http.post(`${PORT1}/courses/`, courseCreatePayload(form))) as any));
  if (!form.isActive) {
    const patched = await http.patch(`${PORT1}/courses/${created.id}`, { is_active: false });
    return convertCourseItem(unwrap<any>(patched as any));
  }
  return created;
};

export const deleteBaseInfoCourseApi = async (id: string) => {
  await http.delete(`${PORT1}/courses/${id}`);
};

// ═══════════════════════════════════════════════════════════════════
// 教师资源
// ═══════════════════════════════════════════════════════════════════

const TEACHER_ROLE_ID = 2;

const convertTeacherItem = (item: any): BaseInfo.TeacherItem => ({
  ...convertUserItem(item),
  teacherNo: item.user_no ?? ""
});

export const getBaseInfoTeacherListApi = async (query: BaseInfo.TeacherQuery) => {
  const fetchPage = async (page: number, pageSize: number) => {
    const res = await http.get(`${PORT1}/users/`, toPageQuery({ ...query, pageNum: page, pageSize }));
    const { list, total } = extractList<any>(res as any);
    return { list: list.map(convertTeacherItem), total };
  };
  const needsLocalRoleFilter = true;
  if (needsLocalRoleFilter) {
    const all = await fetchAllPages(fetchPage);
    const teachers = all.filter(item => item.roleNames.includes("教师") || item.roleNames.includes("TEACHER"));
    return { list: pageSlice(teachers, query.pageNum, query.pageSize), total: teachers.length };
  }
  return fetchPage(query.pageNum, query.pageSize);
};

export const getBaseInfoTeacherDetailApi = async (id: string) => {
  const res = await http.get(`${PORT1}/users/${id}`);
  return convertTeacherItem(unwrap<any>(res as any));
};

export const getBaseInfoTeacherDetailWithRolesApi = async (row: BaseInfo.TeacherItem) => {
  const detail = await enrichBaseInfoUserFromCurrentAuthApi(await getBaseInfoTeacherDetailApi(row.id));
  return {
    ...detail,
    roleNames: detail.roleNames.length ? detail.roleNames : row.roleNames,
    roleIds: detail.roleIds || row.roleIds
  };
};

export const saveBaseInfoTeacherApi = async (form: BaseInfo.TeacherForm) => {
  const roleIds = normalizeRoleIds(form.roleIds);
  const saved = await saveBaseInfoUserApi({
    id: form.id,
    userNo: form.teacherNo,
    username: form.username,
    roleIds: roleIds.length ? roleIds : [TEACHER_ROLE_ID],
    fullName: form.fullName,
    gender: form.gender,
    phone: form.phone,
    email: form.email,
    status: form.status,
    syncRoleIds: form.syncRoleIds,
    avatarFileId: ""
  });
  return { ...saved, teacherNo: saved.userNo };
};

export const deleteBaseInfoTeacherApi = async (id: string) => {
  await deleteBaseInfoUserApi(id);
};

// ═══════════════════════════════════════════════════════════════════
// 教室资源
// ═══════════════════════════════════════════════════════════════════

const convertClassroomItem = (item: any): BaseInfo.ClassroomItem => ({
  id: String(item.id ?? ""),
  classroomNo: item.room_no ?? "",
  building: item.building ?? "",
  capacity: item.capacity ?? 0,
  roomType: item.type ?? "",
  createdAt: item.created_at ?? "",
  updatedAt: item.updated_at ?? ""
});

const classroomPayload = (form: BaseInfo.ClassroomForm) =>
  compact({
    room_no: form.classroomNo,
    building: form.building,
    capacity: form.capacity,
    type: form.roomType
  });

export const getBaseInfoClassroomListApi = async (query: BaseInfo.ClassroomQuery) => {
  const res = await http.get(`${PORT1}/classrooms/`, toPageQuery(query));
  const { list, total } = extractList<any>(res as any);
  return { list: list.map(convertClassroomItem), total };
};

export const getBaseInfoClassroomDetailApi = async (id: string) => {
  const res = await http.get(`${PORT1}/classrooms/${id}`);
  return convertClassroomItem(unwrap<any>(res as any));
};

export const saveBaseInfoClassroomApi = async (form: BaseInfo.ClassroomForm) => {
  const payload = classroomPayload(form);
  const res = form.id
    ? await http.patch(`${PORT1}/classrooms/${form.id}`, payload)
    : await http.post(`${PORT1}/classrooms/`, payload);
  return convertClassroomItem(unwrap<any>(res as any));
};

export const deleteBaseInfoClassroomApi = async (id: string) => {
  await http.delete(`${PORT1}/classrooms/${id}`);
};

// ═══════════════════════════════════════════════════════════════════
// 培养方案
// ═══════════════════════════════════════════════════════════════════

const convertCourseBrief = (item: any): BaseInfo.CourseBrief => ({
  id: String(item.id ?? ""),
  courseNo: item.course_code ?? "",
  courseName: item.course_name ?? ""
});

const convertTrainingPlanItem = (item: any): BaseInfo.TrainingPlanItem => ({
  id: String(item.id ?? ""),
  planNo: item.program_code ?? "",
  majorCode: item.major_code ?? "",
  grade: item.grade ?? "",
  version: item.version ?? "",
  requiredCourseIds: (item.required_course_ids ?? []).map((id: number | string) => String(id)),
  requiredCourses: (item.required_courses ?? []).map(convertCourseBrief),
  snapshotTime: item.snapshot_time ?? "",
  createdAt: item.created_at ?? "",
  updatedAt: item.updated_at ?? ""
});

const trainingPlanPayload = (form: BaseInfo.TrainingPlanForm) =>
  compact({
    program_code: form.planNo,
    major_code: form.majorCode,
    grade: form.grade,
    version: form.version,
    required_course_ids: form.requiredCourseIds.map(Number).filter(Number.isFinite)
  });

export const getBaseInfoTrainingPlanListApi = async (query: BaseInfo.TrainingPlanQuery) => {
  const useByMajor = Boolean(query.majorCode);
  const url = useByMajor ? `${PORT1}/training-programs/by-major` : `${PORT1}/training-programs/`;
  const fetchPage = async (page: number, pageSize: number) => {
    const params = useByMajor
      ? compact({ page, page_size: pageSize, major_code: query.majorCode, grade: query.grade })
      : compact({ page, page_size: pageSize });
    const res = await http.get(url, params);
    const { list, total } = extractList<any>(res as any);
    return { list: list.map(convertTrainingPlanItem), total };
  };
  if (query.keyword && !useByMajor) {
    const all = await fetchAllPages(fetchPage);
    const filtered = all.filter(item =>
      [item.planNo, item.majorCode, item.grade, item.version].some(value => value.includes(query.keyword || ""))
    );
    return { list: pageSlice(filtered, query.pageNum, query.pageSize), total: filtered.length };
  }
  return fetchPage(query.pageNum, query.pageSize);
};

export const getBaseInfoTrainingPlanDetailApi = async (id: string) => {
  const res = await http.get(`${PORT1}/training-programs/${id}`);
  return convertTrainingPlanItem(unwrap<any>(res as any));
};

export const saveBaseInfoTrainingPlanApi = async (form: BaseInfo.TrainingPlanForm) => {
  const payload = trainingPlanPayload(form);
  const res = form.id
    ? await http.put(`${PORT1}/training-programs/${form.id}`, payload)
    : await http.post(`${PORT1}/training-programs/`, payload);
  return convertTrainingPlanItem(unwrap<any>(res as any));
};

export const deleteBaseInfoTrainingPlanApi = async (id: string) => {
  await http.delete(`${PORT1}/training-programs/${id}`);
};

// ═══════════════════════════════════════════════════════════════════
// 基础信息字典
// ═══════════════════════════════════════════════════════════════════

const convertBaseInfoItem = (item: any): BaseInfo.PermissionItem => ({
  id: String(item.id ?? ""),
  category: item.category ?? "",
  itemCode: item.item_code ?? "",
  itemName: item.item_name ?? "",
  description: item.description ?? "",
  isActive: item.is_active ?? true,
  createdAt: item.created_at ?? "",
  updatedAt: item.updated_at ?? ""
});

const baseInfoPayload = (form: BaseInfo.PermissionForm) =>
  compact({
    category: form.category,
    item_code: form.itemCode,
    item_name: form.itemName,
    description: form.description,
    is_active: form.isActive
  });

export const getBaseInfoPermissionListApi = async (query: BaseInfo.PermissionQuery) => {
  const fetchPage = async (page: number, pageSize: number) => {
    const res = await http.get(`${PORT1}/base-info/`, compact({ page, page_size: pageSize, category: query.category }));
    const { list, total } = extractList<any>(res as any);
    return { list: list.map(convertBaseInfoItem), total };
  };
  if (query.keyword) {
    const all = await fetchAllPages(fetchPage);
    const filtered = all.filter(item =>
      [item.category, item.itemCode, item.itemName, item.description].some(value => value.includes(query.keyword || ""))
    );
    return { list: pageSlice(filtered, query.pageNum, query.pageSize), total: filtered.length };
  }
  return fetchPage(query.pageNum, query.pageSize);
};

export const getBaseInfoPermissionDetailApi = async (id: string) => {
  const res = await http.get(`${PORT1}/base-info/${id}`);
  return convertBaseInfoItem(unwrap<any>(res as any));
};

export const saveBaseInfoPermissionApi = async (form: BaseInfo.PermissionForm) => {
  if (form.id) {
    const res = await http.patch(`${PORT1}/base-info/${form.id}`, baseInfoPayload(form));
    return convertBaseInfoItem(unwrap<any>(res as any));
  }
  const created = convertBaseInfoItem(
    unwrap<any>(
      (await http.post(
        `${PORT1}/base-info/`,
        compact({
          category: form.category,
          item_code: form.itemCode,
          item_name: form.itemName,
          description: form.description
        })
      )) as any
    )
  );
  if (!form.isActive) {
    const patched = await http.patch(`${PORT1}/base-info/${created.id}`, { is_active: false });
    return convertBaseInfoItem(unwrap<any>(patched as any));
  }
  return created;
};

export const deleteBaseInfoPermissionApi = async (id: string) => {
  await http.delete(`${PORT1}/base-info/${id}`);
};

// ═══════════════════════════════════════════════════════════════════
// 回收站
// ═══════════════════════════════════════════════════════════════════

const convertRecycleItem = (item: any): BaseInfo.RecycleItem => ({
  id: String(item.id ?? ""),
  userNo: item.user_no ?? "",
  username: item.username ?? "",
  fullName: item.full_name ?? "",
  roleIds: item.role_ids ?? "",
  roleNames: item.role_names ?? [],
  deletedAt: item.deleted_at ?? ""
});

export const getBaseInfoRecycleListApi = async (query: BaseInfo.RecycleQuery) => {
  const res = await http.get(`${PORT1}/recycle-bin/`, toPageQuery(query));
  const { list, total } = extractList<any>(res as any);
  return { list: list.map(convertRecycleItem), total };
};

export const restoreBaseInfoRecycleApi = async (id: string) => {
  await http.post(`${PORT1}/recycle-bin/${id}/restore`, {});
};

export const clearBaseInfoRecycleApi = async (id: string) => {
  await http.delete(`${PORT1}/recycle-bin/${id}`);
};

export const batchClearBaseInfoRecycleApi = async (ids: string[]) => {
  await http.post(`${PORT1}/recycle-bin/batch-delete`, { user_ids: ids.map(Number).filter(Number.isFinite) });
};

// ═══════════════════════════════════════════════════════════════════
// 学期校历
// ═══════════════════════════════════════════════════════════════════

const convertCalendarItem = (item: any): BaseInfo.CalendarItem => ({
  id: String(item.id ?? ""),
  termCode: item.term_code ?? "",
  termName: item.term_name ?? "",
  startDate: item.start_date ?? "",
  endDate: item.end_date ?? "",
  version: item.version ?? "",
  snapshotTime: item.snapshot_time ?? "",
  createdAt: item.created_at ?? "",
  updatedAt: item.updated_at ?? ""
});

const calendarPayload = (form: BaseInfo.CalendarForm) =>
  compact({
    term_code: form.termCode,
    term_name: form.termName,
    start_date: form.startDate,
    end_date: form.endDate,
    version: form.version
  });

export const getBaseInfoCalendarListApi = async (query: BaseInfo.CalendarQuery) => {
  const fetchPage = async (page: number, pageSize: number) => {
    const res = await http.get(`${PORT1}/calendars/`, { page, page_size: pageSize });
    const { list, total } = extractList<any>(res as any);
    return { list: list.map(convertCalendarItem), total };
  };
  if (shouldFetchAll(query, ["termCode", "termName"])) {
    const all = await fetchAllPages(fetchPage);
    const termCode = query.termCode?.trim() ?? "";
    const termName = query.termName?.trim() ?? "";
    const filtered = all.filter(item => {
      const codeMatched = !termCode || item.termCode.includes(termCode);
      const nameMatched = !termName || item.termName.includes(termName);
      return codeMatched && nameMatched;
    });
    return { list: pageSlice(filtered, query.pageNum, query.pageSize), total: filtered.length };
  }
  return fetchPage(query.pageNum, query.pageSize);
};

export const getBaseInfoCalendarDetailApi = async (id: string) => {
  const res = await http.get(`${PORT1}/calendars/${id}`);
  return convertCalendarItem(unwrap<any>(res as any));
};

export const saveBaseInfoCalendarApi = async (form: BaseInfo.CalendarForm) => {
  const payload = calendarPayload(form);
  const res = form.id
    ? await http.put(`${PORT1}/calendars/${form.id}`, payload)
    : await http.post(`${PORT1}/calendars/`, payload);
  return convertCalendarItem(unwrap<any>(res as any));
};

export const deleteBaseInfoCalendarApi = async (id: string) => {
  await http.delete(`${PORT1}/calendars/${id}`);
};

export const getBaseInfoUserIdByAuthIdApi = async (authUserId: string) => {
  if (!authUserId) return "";
  if (/^\d+$/.test(authUserId)) return authUserId;
  const res = await getBaseInfoUserListApi({ pageNum: 1, pageSize: 20, keyword: authUserId });
  return res.list.find(item => item.username === authUserId || item.userNo === authUserId)?.id ?? "";
};

export const parseBaseInfoRoleIds = roleIdsFromString;
export const parseBaseInfoRoleIdsFromNames = roleIdsFromNames;
export const normalizeBaseInfoRoleIds = normalizeRoleIds;
