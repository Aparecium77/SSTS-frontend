import type { ReqPage } from "@/api/interface";

export namespace Schedule {
  export type ResourceCategory = "teacher" | "classroom" | "course" | "class";
  export type RuleCategory = "time" | "teacherConflict" | "classroomCapacity" | "courseArrangement";
  export type ScheduleDimension = "teacher" | "student" | "class" | "classroom";
  export type RecordStatus = "draft" | "published" | "adjusting" | "archived";
  export type PublishStatus = "pending" | "published" | "rolledBack";
  export type TaskStatus = "draft" | "queued" | "running" | "completed" | "failed";
  export type AdjustmentStatus = "pending" | "approved" | "rejected";
  export type ResourceStatus = "enabled" | "disabled";
  export type RuleStatus = "enabled" | "disabled";

  export interface OptionItem {
    label: string;
    value: string;
    description?: string;
  }

  export interface PageQuery extends ReqPage {
    keyword?: string;
    academicYear?: string;
    semesterId?: string;
    week?: number;
    status?: string;
  }

  export interface WeekRange {
    startWeek: number;
    endWeek: number;
  }

  export interface SemesterInfo {
    academicYear: string;
    semesterId: string;
    semesterName: string;
    startDate: string;
    endDate: string;
    totalWeeks: number;
    currentWeek: number;
  }

  export interface TimeSlot {
    dayOfWeek: number;
    sectionStart: number;
    sectionEnd: number;
    weekLabel: string;
    timeRange: string;
  }

  export interface PersonSummary {
    id: string;
    code: string;
    name: string;
    department?: string;
  }

  export interface ClassroomSummary {
    id: string;
    building: string;
    roomNumber: string;
    capacity: number;
    tags: string[];
  }

  export interface CourseSummary {
    id: string;
    code: string;
    name: string;
    credits: number;
    hours: number;
  }

  export interface ClassSummary {
    id: string;
    name: string;
    grade: string;
    major: string;
    studentCount: number;
  }

  export interface ResourceStats {
    total: number;
    enabled: number;
    disabled: number;
    warningCount: number;
  }

  export interface ResourceQuery extends PageQuery {
    category?: ResourceCategory;
    department?: string;
  }

  export interface ResourceRecord {
    id: string;
    category: ResourceCategory;
    name: string;
    code: string;
    department: string;
    status: ResourceStatus;
    ownerName: string;
    capacity?: number;
    tags: string[];
    updatedAt: string;
    remark?: string;
  }

  export interface ResourceDetail extends ResourceRecord {
    semester: SemesterInfo;
    usageRate?: number;
    relatedCourses?: string[];
  }

  export interface ResourceForm {
    id?: string;
    category: ResourceCategory;
    name: string;
    code: string;
    department: string;
    ownerName: string;
    capacity?: number;
    status: ResourceStatus;
    tags: string[];
    remark?: string;
  }

  export interface RuleStats {
    total: number;
    enabled: number;
    disabled: number;
    pendingReview: number;
  }

  export interface RuleQuery extends PageQuery {
    category?: RuleCategory;
    priority?: number;
  }

  export interface RuleCondition {
    field: string;
    operator: string;
    value: string | number | boolean | string[];
  }

  export interface RuleRecord {
    id: string;
    category: RuleCategory;
    name: string;
    code: string;
    priority: number;
    status: RuleStatus;
    scope: string;
    updatedAt: string;
    description: string;
  }

  export interface RuleDetail extends RuleRecord {
    conditions: RuleCondition[];
    effectSummary: string[];
  }

  export interface RuleForm {
    id?: string;
    category: RuleCategory;
    name: string;
    code: string;
    priority: number;
    scope: string;
    status: RuleStatus;
    description: string;
    conditions: RuleCondition[];
  }

  export interface ScheduleQuery extends PageQuery {
    dimension: ScheduleDimension;
    targetId?: string;
    date?: string;
  }

  export interface ScheduleStats {
    totalCourses: number;
    occupiedClassrooms: number;
    involvedTeachers: number;
    conflictCount: number;
  }

  export interface ScheduleRecord {
    id: string;
    semesterId: string;
    academicYear: string;
    courseName: string;
    courseCode: string;
    teacherName: string;
    className: string;
    classroomName: string;
    studentCount: number;
    weekText: string;
    date: string;
    status: RecordStatus;
    timeSlot: TimeSlot;
  }

  export interface ScheduleDetail extends ScheduleRecord {
    classCode: string;
    teacherCode: string;
    classroomCode: string;
    remark?: string;
  }

  export interface AdjustmentForm {
    scheduleId: string;
    reason: string;
    targetDate: string;
    targetDayOfWeek: number;
    targetSectionStart: number;
    targetSectionEnd: number;
    targetClassroomId: string;
  }

  export interface ConflictRecord {
    id: string;
    level: "high" | "medium" | "low";
    title: string;
    message: string;
    relatedEntity: string;
  }

  export interface AdjustmentRecord {
    id: string;
    scheduleId: string;
    courseName: string;
    originSlot: string;
    targetSlot: string;
    applicant: string;
    status: AdjustmentStatus;
    submittedAt: string;
  }

  export interface PublishQuery extends PageQuery {
    status?: PublishStatus;
    version?: string;
  }

  export interface PublishRecord {
    id: string;
    version: string;
    semesterName: string;
    publishedAt: string;
    publishedBy: string;
    status: PublishStatus;
    targetScope: string;
    note?: string;
  }

  export interface PublishForm {
    semesterId: string;
    targetScope: string;
    targetIds: string[];
    note?: string;
  }

  export interface TaskQuery extends PageQuery {
    status?: TaskStatus;
  }

  export interface TaskProgress {
    processed: number;
    total: number;
    percent: number;
  }

  export interface AutoTaskRecord {
    id: string;
    taskName: string;
    semesterName: string;
    status: TaskStatus;
    createdBy: string;
    createdAt: string;
    progress: TaskProgress;
    conflictCount: number;
  }

  export interface AutoTaskForm {
    taskName: string;
    semesterId: string;
    ruleIds: string[];
    resourceScope: string[];
    preferContinuousCourse: boolean;
    avoidWeekend: boolean;
  }

  export interface AutoTaskResult {
    taskId: string;
    arrangedCourses: number;
    unresolvedConflicts: number;
    generatedAt: string;
    summary: string[];
  }
}
