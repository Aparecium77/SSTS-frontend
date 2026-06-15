/**
 * 选课中心组类型定义。字段对齐后端《03 API 设计 / 11 前端接口文档》。
 * 后端响应壳为 { code, message, data, trace_id }；本前端公共层用 { code, msg, data }，
 * 由请求层统一适配，业务类型只关心 data。
 */
export namespace CourseSelection {
  // ---------------- 枚举 ----------------
  export type EnrollmentStatus = "pending_lottery" | "enrolled" | "waitlisted" | "canceled" | "failed";
  export type Stage = "preference" | "lottery" | "add_drop";
  export type ItemCategory = "major_required" | "major_elective" | "general";
  export type RuleType = "min_credit_total" | "min_credit_category" | "prerequisite" | "exclusive";
  export type Severity = "hard" | "soft";
  export type PlanStatus = "draft" | "valid" | "invalid";

  // ---------------- 培养方案 ----------------
  export interface PlanItem {
    plan_item_id?: string;
    course_code: string;
    category: ItemCategory;
    expected_semester: string;
    credit: number;
  }
  export interface StudyPlan {
    plan_id: string;
    student_id: string;
    major_code: string;
    curriculum_version: string;
    total_credit_required: number;
    status: PlanStatus;
    validated_at?: string;
    items: PlanItem[];
  }
  export interface Violation {
    code: number;
    rule_type?: RuleType;
    message: string;
    severity: Severity;
  }
  export interface SavePlanReq {
    major_code: string;
    curriculum_version: string;
    items: PlanItem[];
  }
  export interface PlanValidationResult {
    plan_id?: string;
    status: PlanStatus;
    valid: boolean;
    violations: Violation[];
  }

  // ---------------- 课程检索 / 开课 ----------------
  export interface TimeSlot {
    day: number;
    period: number[];
    weeks: string;
  }
  export interface OfferingBrief {
    offering_id: string;
    course_code: string;
    course_name: string;
    teacher_name: string;
    credit?: number;
    remaining: number;
    max_capacity: number;
  }
  export interface OfferingDetail extends OfferingBrief {
    teacher_id: string;
    semester: string;
    time_slots: TimeSlot[];
    classroom?: string;
    campus?: string;
    enrolled_count: number;
  }
  export interface SearchQuery {
    keyword?: string;
    teacher_name?: string;
    semester?: string;
    category?: string;
    page?: number;
    page_size?: number;
  }
  export interface SearchResult {
    list: OfferingBrief[];
    total: number;
  }
  export interface ConflictItem {
    type: string;
    with_offering_id: string;
    message: string;
    code: number;
  }
  export interface ConflictResult {
    has_conflict: boolean;
    conflicts: ConflictItem[];
  }

  // ---------------- 选课操作 ----------------
  export interface EnrollReq {
    offering_id: string;
    stage: Stage;
    idempotency_key?: string;
  }
  export interface EnrollResult {
    enrollment_id: string;
    status: EnrollmentStatus;
  }
  export interface QueuePosition {
    position: number;
    retry_after_ms: number;
  }
  export interface SwapReq {
    drop_id: string;
    add_offering_id: string;
  }
  export interface EnrollmentView {
    enrollment_id: string;
    offering_id: string;
    course_code: string;
    course_name: string;
    teacher_id: string;
    teacher_name: string;
    status: EnrollmentStatus;
    stage: Stage;
    enrolled_at?: string;
  }
  export interface EnrollmentList {
    list: EnrollmentView[];
    total: number;
  }

  // ---------------- 课表 ----------------
  export interface TimetableSlot {
    offering_id: string;
    course_name: string;
    day: number;
    period: number[];
    weeks: string;
    classroom?: string;
  }
  export interface Timetable {
    semester: string;
    slots: TimetableSlot[];
  }

  // ---------------- AI 助手 ----------------
  export interface RecommendReq {
    goal: string;
    semester: string;
  }
  export interface RecommendedOffering {
    offering_id: string;
    course_name: string;
    reason: string;
    eligibility: "valid" | "invalid";
  }
  export interface RecommendResult {
    rec_id: string;
    offerings: RecommendedOffering[];
  }
  export interface AcceptResultItem {
    offering_id: string;
    status: string;
    reason?: string;
    code?: number;
  }
  export interface AcceptResult {
    results: AcceptResultItem[];
  }

  // ---------------- AI 流式对话 ----------------
  export interface AiMessageReq {
    content: string;
  }
  export interface AiDeltaEvent {
    content: string;
  }
  export interface AiToolCallEvent {
    name: string;
    arguments: string;
  }
  export interface AiDoneEvent {
    conversation_id?: string;
    message_id?: string;
    offerings?: string[];
  }
  export interface ChatMessage {
    role: "user" | "assistant";
    content: string;
    loading?: boolean;
    offerings?: string[];
  }

  // ---------------- 教师：花名册 ----------------
  export interface TeachingOffering {
    offering_id: string;
    course_name: string;
    enrolled_count: number;
    max_capacity: number;
  }
  export interface RosterStudent {
    student_id: string;
    name: string;
    enrolled_at?: string;
  }
  export interface Roster {
    offering_id: string;
    course_code: string;
    semester: string;
    students: RosterStudent[];
    total: number;
    snapshot_at?: string;
  }

  // ---------------- 教务：窗口 / 容量 / 监控 ----------------
  export interface WindowReq {
    semester: string;
    stage: Stage;
    start_at: string;
    end_at: string;
  }
  export interface LotteryRunReq {
    semester: string;
    seed?: number;
  }
  export interface LotteryRun {
    run_id: string;
    semester?: string;
    status: "running" | "completed" | "aborted";
    offering_count?: number;
    enrolled_count?: number;
    seed?: number;
  }
  export interface CapacityAdjustReq {
    delta: number;
    reason: string;
  }
  export interface ProxyEnrollReq {
    student_id: string;
    offering_id: string;
    reason: string;
  }
  export interface ThrottleReq {
    tick_interval_ms?: number;
    capacity_per_tick?: number;
    per_user_rps?: number;
  }
  export interface Dashboard {
    online_count: number;
    offerings_remaining: { offering_id: string; course_name: string; remaining: number; max_capacity: number }[];
    rule_violations_dist: Record<string, number>;
  }
}
