/**
 * 基础信息管理类型。字段以 group1-base/info_service/schemas 为准，
 * 页面层使用 camelCase，API 层负责 snake_case 转换。
 */
export type UserStatus = "ACTIVE" | "DISABLED" | "INACTIVE";
export type UserGender = "男" | "女" | "";

export namespace BaseInfo {
  export interface PageQuery {
    pageNum: number;
    pageSize: number;
    keyword?: string;
  }

  export interface PageResult<T> {
    list: T[];
    total: number;
  }

  export interface UploadedFile {
    id: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    accessUrl: string;
  }

  export interface UserQuery extends PageQuery {
    status?: UserStatus | "";
  }
  export interface UserItem {
    id: string;
    userNo: string;
    username: string;
    roleIds: string;
    roleNames: string[];
    fullName: string;
    gender: UserGender;
    phone: string;
    email: string;
    status: UserStatus;
    avatarFileId: string;
    isDeleted: boolean;
    createdAt: string;
    updatedAt: string;
  }
  export interface RoleOption {
    id: number;
    label: string;
    code: string;
  }
  export interface UserForm {
    id?: string;
    userNo: string;
    username: string;
    roleIds: number[];
    fullName: string;
    gender: UserGender;
    phone: string;
    email: string;
    status: UserStatus;
    avatarFileId: string;
  }
  export type UserDetail = UserItem;

  export interface CourseQuery extends PageQuery {
    isActive?: boolean | "";
  }
  export interface CourseItem {
    id: string;
    courseNo: string;
    courseName: string;
    credits: number;
    capacity: number;
    assessmentMethod: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  }
  export interface CourseForm {
    id?: string;
    courseNo: string;
    courseName: string;
    credits: number;
    capacity: number;
    assessmentMethod: string;
    isActive: boolean;
  }
  export type CourseDetail = CourseItem;

  export interface TeacherQuery extends UserQuery {}
  export interface TeacherItem extends UserItem {
    teacherNo: string;
  }
  export interface TeacherForm {
    id?: string;
    teacherNo: string;
    username: string;
    fullName: string;
    gender: UserGender;
    phone: string;
    email: string;
    status: UserStatus;
    roleIds: number[];
  }
  export type TeacherDetail = TeacherItem;

  export interface ClassroomQuery extends PageQuery {
    building?: string | "";
    classroomType?: string | "";
    minCapacity?: number | "";
  }
  export interface ClassroomItem {
    id: string;
    classroomNo: string;
    building: string;
    capacity: number;
    roomType: string;
    createdAt: string;
    updatedAt: string;
  }
  export interface ClassroomForm {
    id?: string;
    classroomNo: string;
    building: string;
    capacity: number;
    roomType: string;
  }
  export type ClassroomDetail = ClassroomItem;

  export interface TrainingPlanQuery extends PageQuery {
    majorCode?: string;
    grade?: string | "";
  }
  export interface CourseBrief {
    id: string;
    courseNo: string;
    courseName: string;
  }
  export interface TrainingPlanItem {
    id: string;
    planNo: string;
    majorCode: string;
    grade: string;
    version: string;
    requiredCourseIds: string[];
    requiredCourses: CourseBrief[];
    snapshotTime: string;
    createdAt: string;
    updatedAt: string;
  }
  export interface TrainingPlanForm {
    id?: string;
    planNo: string;
    majorCode: string;
    grade: string;
    version: string;
    requiredCourseIds: string[];
  }
  export type TrainingPlanDetail = TrainingPlanItem;

  export interface PermissionQuery extends PageQuery {
    category?: string;
  }
  export interface PermissionItem {
    id: string;
    category: string;
    itemCode: string;
    itemName: string;
    description: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  }
  export interface PermissionForm {
    id?: string;
    category: string;
    itemCode: string;
    itemName: string;
    description: string;
    isActive: boolean;
  }

  export interface RecycleQuery extends PageQuery {}
  export interface RecycleItem {
    id: string;
    userNo: string;
    username: string;
    fullName: string;
    roleIds: string;
    roleNames: string[];
    deletedAt: string;
  }

  export interface CalendarQuery {
    pageNum: number;
    pageSize: number;
    termCode?: string;
    termName?: string;
  }
  export interface CalendarItem {
    id: string;
    termCode: string;
    termName: string;
    startDate: string;
    endDate: string;
    version: string;
    snapshotTime: string;
    createdAt: string;
    updatedAt: string;
  }
  export interface CalendarForm {
    id?: string;
    termCode: string;
    termName: string;
    startDate: string;
    endDate: string;
    version: string;
  }
  export type CalendarDetail = CalendarItem;
}
