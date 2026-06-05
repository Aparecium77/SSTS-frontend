/**
 * 成绩管理模块类型定义。
 * 字段命名保持后端 snake_case，避免在 API 层做隐式转换。
 */
export namespace Score {
  export type FrontendRole = "student" | "teacher" | "academic_admin" | "admin" | "dean";
  export type BackendRole = "student" | "teacher" | "admin" | "dean";

  export type GradeRecordStatus = "draft" | "submitted" | "approved" | string;
  export type SubmissionStatus = "pending" | "approved" | "rejected" | "published" | string;
  export type ModifyRequestStatus = "pending" | "approved" | "rejected" | string;
  export type DataSource = "manual" | "exam" | "forum" | string;

  export interface BackendResp<T> {
    code: number;
    message: string;
    data: T;
  }

  export interface Course {
    course_id: string;
    course_name: string | null;
    semester: string;
    student_count: number;
    credit: number | null;
  }

  /** 登录时按学号/学生 ID 解析名册（GET /students/login-resolve） */
  export interface StudentLoginResolve {
    student_id: string;
    student_no: string;
    student_name: string;
  }

  export interface CourseList {
    total: number;
    courses: Course[];
  }

  export interface CourseStudent {
    student_id: string;
    student_no: string;
    student_name: string;
    major: string | null;
  }

  export interface CourseStudentList {
    total: number;
    students: CourseStudent[];
  }

  export interface GradeComponent {
    id: number;
    course_id: string;
    semester: string;
    component_type: string;
    component_sub_id: string;
    weight: number;
    data_source: DataSource;
    is_locked: 0 | 1;
  }

  export interface GradeConfig {
    course_id: string;
    semester: string;
    components: GradeComponent[];
  }

  export interface GradeConfigItemReq {
    component_type: string;
    component_sub_id: string;
    weight: number;
    data_source: DataSource;
  }

  export interface SaveGradeConfigReq {
    semester: string;
    components: GradeConfigItemReq[];
  }

  export interface SaveGradeConfigResp {
    inserted: number;
    updated: number;
    total_weight: number;
    components: GradeComponent[];
  }

  export interface CourseWorkflowResetResp {
    course_id: string;
    semester: string;
    keep_config: boolean;
    deleted: Record<string, number>;
    message: string;
  }

  export interface LegacyComponentConfigReq extends SaveGradeConfigReq {
    course_id: string;
  }

  export interface GradeRecord {
    id: number;
    student_id: string;
    student_no: string;
    course_id: string;
    semester: string;
    component_config_id: number;
    component_type: string;
    component_sub_id: string;
    score: number | null;
    version_no: number;
    result_type: string;
    status: GradeRecordStatus;
    is_locked: 0 | 1;
    data_source: DataSource;
    created_at: string;
    updated_at: string;
  }

  export interface GradeRecordListReq {
    course_id?: string;
    semester?: string;
    student_id?: string;
    status?: string;
    page?: number;
    page_size?: number;
  }

  export interface GradeRecordList {
    total: number;
    page: number;
    page_size: number;
    records: GradeRecord[];
  }

  export interface GradeSheetReq {
    semester: string;
    page?: number;
    page_size?: number;
  }

  export interface GradeRecordRow {
    student_id: string;
    student_no: string;
    student_name?: string;
    major?: string | null;
    records: Record<number, GradeRecord>;
  }

  export interface GradeSheetRecord {
    id?: number | null;
    grade_record_id?: number | null;
    component_config_id: number;
    component_type: string;
    component_sub_id: string;
    weight: number;
    data_source: DataSource;
    score: number | null;
    version_no?: number | null;
    is_locked?: 0 | 1;
    status?: GradeRecordStatus;
    recorded_at?: string | null;
    updated_at?: string | null;
  }

  export interface GradeSheetRow {
    id?: number | null;
    grade_record_id?: number | null;
    student_id: string;
    student_no: string;
    student_name: string;
    major?: string | null;
    course_id: string;
    course_name?: string | null;
    semester: string;
    credit?: number | null;
    status: string;
    total_score?: number | null;
    gpa?: number | null;
    recorded_at?: string | null;
    last_modified_at?: string | null;
    submitted_at?: string | null;
    approved_at?: string | null;
    published_at?: string | null;
    records?: GradeSheetRecord[];
    component_scores?: GradeSheetRecord[];
  }

  export interface GradeSheet {
    course_id: string;
    course_name?: string | null;
    semester: string;
    total?: number;
    page?: number;
    page_size?: number;
    edition?: string;
    current_submission_status?: string;
    current_submission_id?: number | null;
    components: GradeComponent[];
    rows: GradeSheetRow[];
  }

  export interface SaveGradeRecordReq {
    student_id: string;
    course_id: string;
    semester: string;
    component_config_id: number;
    score?: number | null;
    result_type?: string;
  }

  export interface SaveGradeRecordResp {
    grade_record_id: number;
    status: string;
  }

  export interface UpdateGradeRecordReq {
    score?: number | null;
    result_type?: string;
    version_no?: number;
  }

  export interface UpdateGradeRecordResp {
    grade_record_id: number;
    version_no: number;
  }

  export interface BatchSaveGradeRecordItem {
    student_id: string;
    score?: number | null;
    result_type?: string;
  }

  export interface BatchSaveGradeRecordsReq {
    course_id: string;
    semester: string;
    component_config_id: number;
    records: BatchSaveGradeRecordItem[];
  }

  export interface BatchResult {
    success_count: number;
    fail_count: number;
    failed_records: Array<{
      student_id: string;
      error_code: number;
      message: string;
    }>;
  }

  export interface ImportGradeExcelReq {
    course_id: string;
    semester: string;
    component_config_id: number;
  }

  export interface ExternalMappingItem {
    source_system: "exam" | "forum" | string;
    external_id: string;
    external_name?: string;
    component_config_id: number;
  }

  export interface ExternalMappingsReq {
    course_id: string;
    semester: string;
    mappings: ExternalMappingItem[];
  }

  export interface ExternalMappingsResp {
    inserted: number;
    updated: number;
  }

  export interface ExternalScoreItem {
    student_id: string;
    score: number | null;
    external_id?: string;
    result_type?: string;
  }

  export interface ImportExternalScoresReq {
    course_id: string;
    semester: string;
    component_config_id?: number;
    component_type?: string;
    component_sub_id?: string;
    scores?: ExternalScoreItem[];
  }

  export interface ImportExternalScoresResp {
    source_system: string;
    imported: number;
  }

  export interface GradeRecordLog {
    id: number;
    operator_id: string;
    operator_name: string;
    operator_role: string;
    operation_type: string;
    target_type: string;
    target_id: number;
    course_id: string;
    semester: string;
    ip_address: string | null;
    before_value: string | null;
    after_value: string | null;
    created_at: string;
  }

  export interface GradeRecordLogListReq {
    course_id?: string;
    operator_id?: string;
    operation_type?: string;
    target_id?: number;
    page?: number;
    page_size?: number;
  }

  export interface GradeRecordLogList {
    total: number;
    page?: number;
    page_size?: number;
    logs: GradeRecordLog[];
  }

  export interface CalculateGradeReq {
    course_id: string;
    semester: string;
  }

  export interface CalculateGradeResp {
    course_id: string;
    semester: string;
    calculated_count: number;
  }

  export interface SubmitCourseGradesReq {
    course_id: string;
    semester: string;
    submitted_by?: string;
    submitted_by_name?: string;
  }

  export interface Submission {
    id: number;
    course_id: string;
    semester: string;
    submitted_by: string;
    submitted_by_name: string;
    reviewer_id: string | null;
    reviewer_name: string | null;
    status: SubmissionStatus;
    opinion: string | null;
    student_count: number;
    submitted_at: string;
    approved_at: string | null;
  }

  export interface SubmissionList {
    total: number;
    submissions: Submission[];
  }

  export interface ReviewSubmissionReq {
    reviewer_id?: string;
    reviewer_name?: string;
    opinion?: string;
  }

  export interface PublishSubmissionResp {
    submission_id: number;
    status: string;
    published_count: number;
  }

  export interface PublishTotalsReq {
    course_id: string;
    semester: string;
  }

  export interface ModifyRequestReq {
    grade_record_id: number;
    new_score?: number | null;
    modify_type?: string;
    reason: string;
    applicant_id: string;
    applicant_name: string;
  }

  export interface ModifyRequestCreateResp {
    id: number;
    status: string;
    grade_record_id: number;
  }

  export interface ModifyRequest {
    id: number;
    grade_record_id: number;
    student_id: string;
    student_no?: string | null;
    student_name?: string | null;
    course_id: string;
    course_name?: string | null;
    semester: string;
    component_type: string;
    component_sub_id: string;
    original_score: number | null;
    new_score: number | null;
    modify_type: string;
    reason: string;
    status: ModifyRequestStatus;
    applicant_id: string;
    applicant_name: string;
    reviewer_id: string | null;
    reviewer_name: string | null;
    opinion: string | null;
    created_at: string;
    approved_at: string | null;
  }

  export interface ModifyRequestListReq {
    course_id?: string;
    semester?: string;
    status?: string;
    page?: number;
    page_size?: number;
  }

  export interface ModifyRequestList {
    total: number;
    page?: number;
    page_size?: number;
    requests: ModifyRequest[];
  }

  export interface ReviewModifyRequestReq {
    reviewer_id?: string;
    reviewer_name?: string;
    opinion?: string;
  }

  export interface ModifyRequestReviewResp {
    id: number;
    status: string;
  }

  export interface ModifyRequestLog {
    id: number;
    operator_id: string;
    operator_name: string;
    operator_role: string;
    operation_type: string;
    target_type: string;
    target_id: number;
    course_id: string;
    semester: string;
    ip_address: string | null;
    before_value: string | null;
    after_value: string | null;
    created_at: string;
  }

  export interface ModifyRequestLogList {
    total: number;
    page?: number;
    page_size?: number;
    logs: ModifyRequestLog[];
  }

  export interface StudentGrade {
    course_id: string;
    course_name?: string | null;
    student_name?: string;
    semester: string;
    credit?: number;
    assessment_method?: string | null;
    category?: string | null;
    total_score: number;
    gpa: number;
    grade_level?: string | null;
    rank?: number | null;
    total_students?: number | null;
  }

  export interface StudentGradeList {
    student_id: string;
    student_name?: string;
    data_source?: string;
    grades: StudentGrade[];
  }

  export interface CreditProgressCategory {
    category: string;
    earned_credits: number;
    required_credits: number;
    remaining_credits: number;
  }

  export interface CreditProgress {
    student_id: string;
    student_name?: string;
    major?: string | null;
    grade?: string | null;
    earned_credits: number;
    total_required_credits: number | null;
    remaining_credits?: number | null;
    categories?: CreditProgressCategory[];
    data_source?: string;
    student_data_source?: string;
  }

  export interface CourseRanking {
    course_id: string;
    semester: string;
    rank?: number | null;
    total_students?: number | null;
    total_score?: number | null;
  }

  export interface FailedCourse {
    course_id: string;
    course_name?: string | null;
    semester: string;
    score: number;
  }

  export interface SemesterGpaTrendItem {
    semester: string;
    semester_gpa: number;
    weighted_average: number;
  }

  export interface StudentStatistics {
    student_id?: string;
    cumulative_gpa: number | null;
    weighted_average: number | null;
    earned_credits: number;
    pass_rate?: number;
    failed_course_count?: number;
    failed_courses?: FailedCourse[];
    course_rankings?: CourseRanking[];
    semester_gpa_trend?: SemesterGpaTrendItem[];
    major?: string | null;
    class_name?: string | null;
    profile_data_source?: string;
    major_percentile?: number | null;
    major_rank?: number | null;
    major_peer_count?: number;
    class_percentile?: number | null;
    class_rank?: number | null;
    class_peer_count?: number;
    percentile_scope_source?: string | null;
    percentile?: number | null;
  }

  export interface SemesterGpa {
    student_id?: string;
    semester: string;
    gpa?: number | null;
    semester_gpa?: number | null;
    weighted_average: number | null;
    earned_credits: number;
    rank?: number | null;
  }

  export interface StudentGpa extends StudentStatistics {
    student_id: string;
    semester_gpas: SemesterGpa[];
  }

  export interface RefreshGpaReq {
    student_id?: string;
    course_id?: string;
    semester?: string;
    student_ids?: string[];
  }

  export interface RefreshGpaResp {
    refreshed?: number;
    refreshed_count?: number;
    student_ids?: string[];
    student_id?: string;
    course_id?: string;
    semester?: string;
  }

  export interface AnalysisRanking {
    rank: number;
    student_id: string;
    student_no?: string | null;
    student_name?: string | null;
    total_score: number;
    gpa: number;
  }

  export interface HistoricalComparison {
    semester: string;
    average_score: number;
    pass_rate: number;
    excellent_rate: number;
    student_count: number;
  }

  export interface CourseAnalysis {
    course_id: string;
    course_name?: string;
    semester: string;
    total_students: number;
    average_score: number;
    max_score: number;
    min_score: number;
    median_score?: number;
    std_deviation?: number;
    pass_rate: number;
    excellent_rate: number;
    fail_rate?: number;
    distribution: Array<{ range: string; count: number; percentage: number }>;
    grade_levels: Array<{ level: string; count: number; percentage: number }>;
    ranking_summary: Record<string, number>;
    rankings?: AnalysisRanking[];
    historical_comparison?: HistoricalComparison[];
  }

  export interface StudentGradeComponentItem {
    component_type: string;
    component_sub_id?: string | null;
    weight?: number | null;
    score?: number | null;
    data_source?: string | null;
  }

  export interface StudentGradeComponentDetail {
    student_id: string;
    course_id: string;
    semester: string;
    components: StudentGradeComponentItem[];
  }

  export interface AdminGradeRecordRow {
    student_id: string;
    student_no?: string | null;
    student_name?: string | null;
    course_id: string;
    course_name?: string | null;
    semester: string;
    major?: string | null;
    grade?: string | null;
    college?: string | null;
    status: string;
    total_score: number;
    gpa: number;
    credit?: number | null;
    local_roster_shadow_id?: number | null;
  }

  export interface AdminGradeQueryList {
    total: number;
    records: AdminGradeRecordRow[];
  }

  export interface AdminStudentArchive {
    student_id: string;
    records: AdminGradeRecordRow[];
  }

  export interface AdminCourseComparisonItem {
    course_id: string;
    course_name?: string | null;
    semester: string;
    student_count: number;
    average_score: number;
    pass_rate: number;
    excellent_rate: number;
  }

  export interface AdminCourseComparisonList {
    total: number;
    courses: AdminCourseComparisonItem[];
  }

  export interface AdminCreateGradeRecordReq {
    student_id: string;
    student_no?: string;
    course_id: string;
    semester: string;
    component_config_id: number;
    component_type?: string;
    component_sub_id?: string;
    score?: number | null;
    result_type?: string;
    status?: string;
    reason: string;
  }

  export interface AdminCreateGradeRecordResp {
    grade_record_id: number;
    reason: string;
  }

  export interface AdminOverrideGradeRecordReq {
    score?: number | null;
    result_type?: string;
    reason: string;
  }

  export interface AdminOverrideGradeRecordResp {
    grade_record_id: number;
    reason: string;
  }

  export interface SyncRosterReq {
    course_id?: string;
    semester?: string;
  }

  export interface SyncRosterResp {
    synced_count?: number;
    inserted?: number;
    updated?: number;
  }

  export interface ListQuery {
    pageNum: number;
    pageSize: number;
    keyword?: string;
  }

  export interface ScoreItem {
    id: string;
    courseName: string;
    score?: number;
  }
}
