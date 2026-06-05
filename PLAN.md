# 成绩管理模块前端对齐方案（后端现实版）

> 更新日期：2026-06-01  
> 前端仓库：`SSTS-frontend`  
> 后端仓库：`repo-group6-grade-main`  
> 文档基准：`demand.md`、`README.md`、`APP/模块6-技术选型.docx`、`APP/模块6-跨小组数据流动设计.docx`、`APP/模块6-数据库设计.docx`。  
> 代码基准：后端主实现 `backend/app/main.py` 挂载的 `backend/app/api/v1/*`。后端目录 `APP/grade-backend/*` 是历史参考实现，不作为正式运行或测试入口。

---

## 0. 结论摘要

前端原 `PLAN.md` 是基于早期理想接口设计编写的。现在后端已有正式需求文档、技术/数据流/数据库设计文档，以及一套可运行的 FastAPI MVP。前端实现要同时区分两件事：

- **需求/设计应支持什么**：以 `demand.md` 和三份模块 6 docx 为准。
- **当前代码实际能调用什么**：以 `backend/` 目录下 FastAPI 代码为准。

因此本方案采用“先按当前代码保证联调可跑，文档差异写入 `对接.md` 推动后端补齐”的策略。

最关键的对齐点：

- 后端真实前缀：`/api/v1/grade`。
- 后端真实响应：`{ code: 10000, message: "Success", data: ... }`，无 `trace_id/requestId/timestamp`。
- 后端鉴权设计由 Nginx/Gateway 校验 JWT 后注入 `X-User-ID`、`X-User-Role`、`X-User-Name`；业务服务不自行签发或验证 JWT。当前代码只读取这些 header，不读前端现有的 `Authorization` 或 `x-access-token`。
- 后端角色值是 `student`、`teacher`、`admin`、`dean`；前端 mock 管理员是 `academic_admin`，联调时必须映射为 `admin` 或 `dean`。
- 导出接口当前直接返回文件流 `StreamingResponse`，不是 `{ download_url }`。
- 学生成绩只查询 `GradeTotal.status == "published"`，管理员审批通过后还需要调用发布接口，否则学生端查不到。
- 后端成绩明细 `grade_records` 是“按分项一行”的窄表结构，不是前端原计划里的“一个学生一行、分项动态列”宽表结构；前端页面需要自行 pivot。
- 后端课程和成绩记录缺少教师范围过滤、课程名/学生名聚合字段，前端不能假设“教师只能看到本人课程”已经由后端实现。
- 后端需求文档中大量接口响应是目标契约，例如 `list/download_url/pdf/pass_rate/credit_summary`；当前代码尚未全部实现，前端不能直接按需求文档调用。

### 0.1 后端材料优先级

| 材料 | 作用 | 前端使用方式 |
| --- | --- | --- |
| `README.md` | 明确正式目录、启动方式、身份头、正式前缀、需求基线 | 判断 `backend/` 是正式实现，`APP/grade-backend` 是历史实现 |
| `demand.md` | 后端需求与接口目标契约 | 作为验收目标和对接依据 |
| `APP/模块6-技术选型.docx` | 确认 Python/FastAPI、SQLite、`/api/v1/`、Nginx 注入身份头 | 决定前端联调 header 与网关假设 |
| `APP/模块6-跨小组数据流动设计.docx` | 确认 SSOT、影子表、C/E/D/A 组数据流 | 判断哪些能力应由后端聚合，不应由前端跨组编排 |
| `APP/模块6-数据库设计.docx` | 确认窄表 `grade_record`、总评 `grade_total`、提交明细、状态机、GPA 队列 | 决定前端数据模型和页面状态流 |
| `backend/app/api/v1/*` | 当前可运行接口 | 作为当前开发和联调的真实契约 |

---

## 1. 前后端差异对比（Gap Analysis）

### 1.1 基础协议差异

| 项目 | 原 PLAN 预期 | 后端实际代码 | 前端修正 |
| --- | --- | --- | --- |
| API 前缀 | `/api/v1/grade`，但文档中也保留过 `/api/grade/v1` 待确认 | `backend/app/api/v1/router.py` 明确为 `/api/v1/grade` | 固定使用 `/api/v1/grade` |
| 响应成功码 | 已预期可能是 `10000`，需要适配 | `ErrorCode.SUCCESS = 10000` | 成绩模块请求层必须适配 `10000/message` 到前端模板的 `200/msg` |
| 响应追踪字段 | 原 PLAN 兼容 `trace_id/requestId/timestamp` | 后端 `APIResponse` 只返回 `code/message/data` | 不再把追踪字段作为契约，只保留可选类型兼容 |
| HTTP 状态 | 原计划主要按业务码处理 | 业务错误多为 HTTP 400/404/409，成功 200，部分导出直接文件流 | 请求层要同时处理 HTTP 非 2xx 和业务码非 10000 |
| 鉴权头 | 前端现有全局 axios 写 `Authorization` + `x-access-token` | 后端依赖 `X-User-ID`、`X-User-Role`、`X-User-Name` | 成绩模块联调时需要补充这三个 header，管理员角色映射为 `admin` |
| 管理员角色 | 前端 mock：`academic_admin` | 后端：`admin` 或 `dean` | 请求前转换 role：`academic_admin -> admin` |

### 1.2 路由与方法差异

| 功能 | 原 PLAN | 后端实际 | 差异处理 |
| --- | --- | --- | --- |
| 课程列表 | `GET /courses` | `GET /courses` | 一致，但后端不按教师过滤 |
| 学生名单 | `GET /courses/{course_id}/students?semester=` | 一致 | 一致 |
| 成绩配置 | `GET/PUT /courses/{course_id}/grade-config` | 一致 | PUT body 只接受 `semester + components` |
| 旧配置接口 | 未重点规划 | `POST /component-configs` | 作为兼容接口，不作为前端主入口 |
| 创建成绩记录 | `POST /grade-records` | 一致 | body 字段与原 PLAN 不同，必须用 `component_config_id` |
| 更新成绩记录 | 原 PLAN 未单列或弱化 | `PUT /grade-records/{record_id}` | 前端内联编辑应优先用 PUT，创建缺失记录才用 POST |
| 批量保存 | `POST /grade-records/batch` | 一致 | body 是单个分项批量，不是整张成绩表批量 |
| Excel 导入 | `POST /grade-records/import-excel` | 一致 | 后端从 Excel 行内读取 `course_id/semester/component_config_id`，不是从 form fields 读取 |
| 在线测试导入 | 原计划“成绩服务转发 exam 组” | `POST /grade-records/import-exam` 但要求前端传 `scores[]`，且要先建 external mapping | 前端不能只传课程和分项；需要后端补聚合，或前端对接在线测试组 |
| 论坛导入 | 原计划后续 | 后端已有 `/import-forum`，机制同 exam | 本期仍建议隐藏或置灰 |
| 外部映射 | 原 PLAN 未覆盖 | `POST /grade-records/external-mappings` | 必须补入计划，否则 exam/forum 导入无法工作 |
| 计算总评 | `POST /courses/{course_id}/grade-calculations` | 存在，但只返回 `calculated_count`，不落表、不返回预览 | 前端不能把它当作真实总评预览接口 |
| 课程全量成绩 | 原 PLAN 未列 | `GET /grade-records/courses/{course_id}/records?semester=` | 无分页，返回该课程所有成绩记录，适合 pivot 构建宽表 |
| 审批列表（管理员） | 原 PLAN 未列 | `GET /grade-submissions?course_id=&semester=` | 管理员查看所有提交记录，审批页面需要此接口 |
| 提交审批 | `POST /courses/{course_id}/grade-submissions` | 一致 | 后端会计算总评快照，并把明细锁为 `submitted`；**注意：同一课程只能提交一次，已有 GradeTotal 时返回 409** |
| 审批通过 | `PUT /grade-submissions/{id}/approve` | 一致 | 通过后 `GradeTotal.status = approved`，学生仍不可见 |
| 发布成绩 | 原 PLAN 未纳入主流程 | `PUT /grade-submissions/{id}/publish` 与 `POST /grade-submissions/totals/publish` | 必须加入管理员流程，否则学生查不到成绩 |
| 审批驳回 | `PUT /grade-submissions/{id}/reject` | 一致 | 后端把明细回退为 `draft` |
| 改分申请 | `POST /grade-record-modify-requests` | 一致 | 只允许 `record.status == approved` 且未锁定，不是 `published/corrected` |
| 改分审批 | `PUT /grade-record-modify-requests/{id}/approve/reject` | 一致 | 通过后会新建 `GradeTotal(status=approved)`，仍需发布或调整后端状态 |
| 成绩记录日志 | `GET /grade-record-logs` | 一致 | 仅支持 `course_id` 过滤，最多 100 条，无分页 |
| 改分日志 | `GET /grade-record-modify-requests/{id}/logs` | 一致 | 仅管理员可查 |
| 学生查成绩 | `GET /students/me/grades` | 一致 | 只返回总评，不返回分项明细 |
| 学分进展 | `GET /students/me/credits` | 一致 | 只返回 `earned_credits` 和 `total_required_credits: null`，无分类进度 |
| 个人统计 | `GET /students/me/statistics` | 一致 | 无 `pass_rate/failed_course_count`，但有 `course_rankings` |
| 管理员查学生 | `GET /students/{id}/grades/statistics` | 一致 | 只允许 admin/dean |
| GPA 接口 | 原 PLAN 未列 | `/students/{id}/gpa`、`/gpa-summary`、`/semester-gpa`、`POST /gpa-refresh` | 前端统计页可补充使用，但刷新接口仅管理员 |
| 课程分析 | `GET /courses/{id}/analysis` | 一致 | 返回 `distribution/grade_levels/ranking_summary`，不返回学生排名列表 |
| 分析导出 | 原 PLAN 以 PDF 或 download_url 为目标 | `GET /courses/{id}/analysis/export?format=xlsx` 文件流，仅支持 xlsx | 前端导出按钮要按文件流处理；PDF 不由后端支持 |
| 名册同步 | 原 PLAN 视作跨组后端职责 | `POST /sync-roster` 已暴露 | 前端成绩模块不建议直接使用，管理员/测试可用作数据准备 |

### 1.3 字段结构差异

#### 课程

后端 `GET /courses` 返回：

```ts
{
  total: number;
  courses: Array<{
    course_id: string;
    course_name: string | null;
    semester: string;
    student_count: number;
    credit: number | null;
  }>;
}
```

原 PLAN 里教师课程下拉假设“只显示本人任课课程”。后端当前从 `LocalRosterShadow` 全表汇总，不看教师 ID，前端必须先在 UI 上弱提示“后端暂未按教师过滤”，不能把它作为权限边界。

#### 成绩配置

后端组件没有 `max_score` 字段，分数校验写死 0–100：

```ts
{
  id: number;
  course_id: string;
  semester: string;
  component_type: string;
  component_sub_id: string;
  weight: number;
  data_source: "manual" | "exam" | "forum" | string;
  is_locked: 0 | 1;
}
```

原 PLAN 的 `max_score` 不能提交给后端，前端若展示满分，只能作为 UI 常量 100。

#### 成绩记录

后端成绩记录是分项明细：

```ts
{
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
  status: "draft" | "submitted" | "approved" | string;
  is_locked: 0 | 1;
  data_source: string;
  created_at: string;
  updated_at: string;
}
```

后端不返回 `student_name`、`course_name`、`total_score`、`gpa`。录入页和教师查询页要把 `students` 名单与 `grade-records` 按 `student_id` 合并，并在前端 pivot 成动态列。

#### 学生总评

学生端返回 `GradeTotal` 摘要：

```ts
{
  student_id: string;
  grades: Array<{
    course_id: string;
    semester: string;
    total_score: number;
    gpa: number;
    credit?: number;
    rank?: number | null;
    total_students?: number | null;
  }>;
}
```

后端学生接口不返回分项明细、课程名、考核方式、成绩等级。学生“展开查看分项明细”的需求当前无法通过后端接口完成，除非后端新增安全的 `/students/me/grade-records` 或在 `me/grades` 聚合 components。

---

## 2. 后端实际 API 契约

### 2.1 统一响应

```ts
interface BackendResp<T> {
  code: number;      // 10000 成功，其他为业务失败
  message: string;  // 成功为 "Success"
  data: T;
}
```

注意：`export` 类接口返回文件流，不包这层结构。

### 2.2 鉴权请求头

后端依赖：

```http
X-User-ID: T001
X-User-Role: teacher
X-User-Name: Teacher
```

角色规则：

| 前端角色 | 后端 role |
| --- | --- |
| `student` | `student` |
| `teacher` | `teacher` |
| `academic_admin` | `admin` |

后端当前没有 JWT 解析逻辑。联调阶段若网关尚未注入这些 header，前端成绩模块需要临时注入；生产最终应由网关从 JWT 解析并注入，避免前端伪造身份。

### 2.3 接口清单

| 函数建议名 | 方法 | 路径 | 参数/Body | data 结构 |
| --- | --- | --- | --- | --- |
| `getGradeCourses` | GET | `/courses` | 无 | `{ total, courses }` |
| `getCourseStudents` | GET | `/courses/{course_id}/students` | query: `semester` | `{ total, students }` |
| `getGradeConfig` | GET | `/courses/{course_id}/grade-config` | query: `semester` | `{ course_id, semester, components }` |
| `saveGradeConfig` | PUT | `/courses/{course_id}/grade-config` | `{ semester, components }` | `{ inserted, updated, total_weight, components }` |
| `createComponentConfigsLegacy` | POST | `/component-configs` | `{ course_id, semester, components }` | 同上 |
| `getGradeRecords` | GET | `/grade-records` | query: `course_id? semester? student_id? status? page? page_size?` | `{ total, page, page_size, records }` |
| `createGradeRecord` | POST | `/grade-records` | `{ student_id, course_id, semester, component_config_id, score?, result_type? }` | `{ grade_record_id, status }` |
| `updateGradeRecord` | PUT | `/grade-records/{record_id}` | `{ score?, result_type?, version_no? }` | `{ grade_record_id, version_no }` |
| `batchCreateGradeRecords` | POST | `/grade-records/batch` | `{ course_id, semester, component_config_id, records }` | `{ success_count, fail_count, failed_records }` |
| `importGradeExcel` | POST | `/grade-records/import-excel` | multipart: `file` | `{ success_count, fail_count, failed_records }` |
| `upsertExternalMappings` | POST | `/grade-records/external-mappings` | `{ course_id, semester, mappings }` | `{ inserted, updated }` |
| `importExamScores` | POST | `/grade-records/import-exam` | `{ course_id, semester, scores }` | `{ source_system, imported }` |
| `importForumScores` | POST | `/grade-records/import-forum` | `{ course_id, semester, scores }` | `{ source_system, imported }` |
| `getGradeRecordLogs` | GET | `/grade-record-logs` | query: `course_id?` | `{ total, logs }` |
| `getCourseRecords` | GET | `/grade-records/courses/{course_id}/records` | query: `semester` | `GradeRecord[]` |
| `calculatePreview` | POST | `/courses/{course_id}/grade-calculations` | `{ course_id, semester }` | `{ course_id, semester, calculated_count }` |
| `submitCourseGrades` | POST | `/courses/{course_id}/grade-submissions` | `{ course_id, semester, submitted_by?, submitted_by_name? }` | `{ id, course_id, semester, status, student_count }` |
| `getGradeSubmissions` | GET | `/grade-submissions` | query: `course_id? semester?` | `{ total, submissions }` |
| `approveSubmission` | PUT | `/grade-submissions/{id}/approve` | `{ reviewer_id?, reviewer_name?, opinion? }` | `{ id, course_id, semester, status, student_count }` |
| `rejectSubmission` | PUT | `/grade-submissions/{id}/reject` | `{ reviewer_id?, reviewer_name?, opinion? }` | 同上 |
| `publishSubmission` | PUT | `/grade-submissions/{id}/publish` | body 可空 | `{ submission_id, status, published_count }` |
| `publishTotalsLegacy` | POST | `/grade-submissions/totals/publish` | `{ course_id, semester }` | `{ submission_id, status, published_count }` |
| `createModifyRequest` | POST | `/grade-record-modify-requests` | `{ grade_record_id, new_score?, modify_type?, reason, applicant_id, applicant_name }` | `{ id, status, grade_record_id }` |
| `getModifyRequests` | GET | `/grade-record-modify-requests` | query: `course_id? status?` | `{ total, requests }` |
| `approveModifyRequest` | PUT | `/grade-record-modify-requests/{id}/approve` | `{ reviewer_id?, reviewer_name?, opinion? }` | `{ id, status }` |
| `rejectModifyRequest` | PUT | `/grade-record-modify-requests/{id}/reject` | 同上 | `{ id, status }` |
| `getModifyRequestLogs` | GET | `/grade-record-modify-requests/{id}/logs` | 无 | `{ total, logs }` |
| `getMyGrades` | GET | `/students/me/grades` | query: `semester?` | `{ student_id, grades }` |
| `getMyCredits` | GET | `/students/me/credits` | 无 | `{ student_id, earned_credits, total_required_credits }` |
| `getMyStatistics` | GET | `/students/me/statistics` | 无 | `{ cumulative_gpa, weighted_average, earned_credits, course_rankings }` |
| `getStudentGrades` | GET | `/students/{student_id}/grades` | query: `semester?` | `{ student_id, grades }` |
| `getStudentStatistics` | GET | `/students/{student_id}/statistics` | 无 | `{ student_id, cumulative_gpa, weighted_average, earned_credits }` |
| `getStudentGpa` | GET | `/students/{student_id}/gpa` | 无 | `{ student_id, cumulative_gpa, weighted_average, earned_credits, semester_gpas }` |
| `getSemesterGpa` | GET | `/students/{student_id}/semester-gpa` | 无 | `SemesterGpa[]` |
| `refreshGpa` | POST | `/gpa-refresh` | `{ student_id? course_id? semester? student_ids? }` | 多种刷新结果 |
| `getCourseAnalysis` | GET | `/courses/{course_id}/analysis` | query: `semester` | `CourseAnalysis` |
| `exportCourseAnalysis` | GET | `/courses/{course_id}/analysis/export` | query: `semester, format=xlsx` | 文件流 |
| `exportGradeRecords` | GET | `/grade-records/export` | query: `course_id, semester` | 文件流 |

---

## 3. 页面与业务流程修正

### 3.1 成绩录入 `/score/entry`

沿用原页面，但数据结构要改为“窄表转宽表”：

1. 选择课程与学期：`getGradeCourses()`。
2. 拉取学生名单：`getCourseStudents(course_id, { semester })`。
3. 拉取成绩配置：`getGradeConfig(course_id, { semester })`。
4. 拉取成绩明细：`getGradeRecords({ course_id, semester, page, page_size })` 或 `getCourseRecords(course_id, { semester })`。
5. 前端按 `student_id` 聚合成表格行，按 `component_config_id` 生成动态列。

保存策略：

- 单个单元格没有 `record.id` 时调用 `createGradeRecord`。
- 已有 `record.id` 时调用 `updateGradeRecord`。
- 批量保存某个分项时调用 `batchCreateGradeRecords`。
- `data_source !== "manual"` 的分项不允许手工编辑，否则后端会报 `external grade records cannot be edited manually`。

提交策略：

- `calculatePreview` 只能展示“已计算学生数”，不能作为总评预览。
- 真正计算总评发生在 `submitCourseGrades` 内部。
- 提交后明细状态变 `submitted` 且锁定，前端表格只读。

### 3.2 审批与发布 `/score/change-approval`

> **前置条件（重要）**：后端 `submit_for_approval` 会检查该课程是否已存在 `GradeTotal` 记录。
> - 如果已存在 → 返回 409（`RESUBMIT_FORBIDDEN`），要求走改分流程
> - 如果不存在 → 正常创建提交记录并计算总评快照
>
> 因此**一门课只能提交一次审批**。前端需要在 UI 上明确区分”首次提交”和”改分申请”两条路径。
> 建议在成绩录入页根据 `GET /grade-submissions?course_id=&semester=` 返回是否有 approved/published 记录来决定显示”提交审批”还是”申请改分”按钮。

原 PLAN 只规划”通过/驳回”，现在必须加入”发布”动作。

后端状态流：

```text
GradeRecord: draft -> submitted -> approved -> draft(驳回)
GradeSubmission: pending -> approved/rejected
GradeTotal: approved -> published
```

管理员审批通过后：

- 教师侧可以看到 `approved`。
- 学生侧仍查不到，因为 `students/me/grades` 只查 `published`。
- 管理员需要再调用 `publishSubmission(id)` 或 `publishTotalsLegacy({ course_id, semester })`。

页面建议：

- Tab 1 名称从“成绩提交审批”改为“提交审批与发布”。
- pending 行显示“通过/驳回”。
- approved 行显示“发布”。
- published 后端没有把 `GradeSubmission.status` 改为 `published`，只返回发布结果；前端需用 `GradeTotal` 或返回结果刷新提示，建议后端补齐 submission 状态。

### 3.3 成绩查询 `/score/query`

学生视角：

- 调 `getMyGrades`。
- 当前只能展示 `course_id/semester/credit/total_score/gpa`。
- 课程名、成绩等级、分项展开当前后端不支持。

教师/管理员视角：

- 调 `getGradeRecords` 获取分项明细。
- 需要合并 `getCourseStudents` 才能显示学生姓名和专业。
- 需要前端 pivot 才能形成“每个学生一行”的查询表。
- 后端 `getGradeRecords` 分页是按分项行分页，不适合直接分页学生行。若页面按学生行展示，会出现同一学生分项跨页的问题。MVP 建议录入页使用 `getCourseRecords` 一次性取全量；数据量大时需后端提供按学生聚合的查询接口。

### 3.4 改分申请 `/score/change-request`

> **后端校验逻辑（三重检查）**：
> 1. `GradeRecord.status` 必须是 `approved`（不是 submitted/published/corrected）
> 2. `GradeRecord.is_locked` 必须是 `0`
> 3. 审批通过时额外检查：对应的 `GradeTotal` 必须存在且 `is_current == 1`，否则审批会报错 `NO_GRADE_RECORDS_FOUND`
>
> 前端在提交改分申请前应校验条件 1、2（可从成绩记录详情获取）。条件 3 属于后端内部一致性检查，前端无需前置校验但需要在错误提示中友好展示。

后端只允许对 `GradeRecord.status == “approved”` 且 `is_locked == 0` 的明细发起改分申请。原 PLAN 中”submitted/published/corrected 都可申请”需要删除。

注意：

- 改分是针对某个分项 `grade_record_id`，不是直接改总评。
- 审批通过后后端会重算该学生总评并新建一条 `GradeTotal(status=”approved”)`。
- 学生端是否能看到改分后的结果取决于是否发布；当前后端 approve modify 后没有自动 publish。
- **改分通过后如需学生可见，管理员仍需手动调用发布接口**（`PUT /grade-submissions/{id}/publish` 或 `POST /grade-submissions/totals/publish`）。

### 3.5 学分进展 `/score/credit-progress`

后端当前只提供：

```ts
{
  student_id: string;
  earned_credits: number;
  total_required_credits: null;
}
```

原 PLAN 中的”必修/专业选修/公共课分类进度、剩余学分最大类别”等当前无法实现。MVP 页面应降级为：

- 已修学分卡片（数据来源：`getMyCredits` 或 `getStudentGpa(student_id)` 的 `earned_credits`）。
- 累计 GPA 卡片（数据来源：`getStudentGpa(student_id)` 的 `cumulative_gpa`）。
- 学期 GPA 趋势图（数据来源：`getSemesterGpa(student_id)`）。
- “培养方案总学分未同步”空状态（`total_required_credits` 为 null 时显示）。
- 如果后端未来补 `required_credits/categories`，再恢复进度条和饼图。

### 3.6 个人成绩统计 `/score/personal-analytics`

后端当前 `me/statistics` 返回累计 GPA、加权平均、已修学分、课程排名列表，不返回通过率和不及格门数。

可补充调用：

- `GET /students/{student_id}/semester-gpa`：学期 GPA 趋势。
- 但学生当前没有“自己的 student_id 显式值”问题：可从 `userStore.token/userInfo` 映射，或让后端补 `/students/me/semester-gpa`。

### 3.7 课程成绩分析 `/score/course-analytics`

后端支持基础统计、分布和等级统计，但不返回排名列表。页面应展示：

- 平均分、最高分、最低分、中位数、通过率、优秀率。
- `distribution` 柱状图。
- `grade_levels` 饼图或条形图。
- `ranking_summary` 阈值摘要。

原 PLAN 的“排名表分页”当前无法从后端获得。

导出：

- 后端只支持 xlsx 文件流。
- 不支持 PDF，不返回 `download_url`。
- 前端若要 PDF 报告，仍需自渲染；否则本期改为“导出 Excel”。

---

## 4. 前端目录组织建议

现阶段不新增代码，但后续实现建议按现有 Geeker-Admin 风格组织：

```text
src/
├── api/
│   ├── interface/
│   │   └── score.ts
│   └── modules/
│       └── score.ts
└── views/stss/score/
    ├── menu.ts
    ├── _shared/
    │   ├── constants.ts
    │   ├── http.ts
    │   ├── adapters.ts
    │   ├── components/
    │   │   ├── CourseSelector.vue
    │   │   ├── SemesterSelect.vue
    │   │   ├── ScoreStatusTag.vue
    │   │   ├── ScoreComponentEditor.vue
    │   │   ├── ChangeRequestDialog.vue
    │   │   └── ApprovalDialog.vue
    │   └── hooks/
    │       ├── useScoreIdentity.ts
    │       ├── useScoreCourses.ts
    │       └── useGradeRecordPivot.ts
    ├── entry/index.vue
    ├── query/index.vue
    ├── change-request/index.vue
    ├── change-approval/index.vue
    ├── credit-progress/index.vue
    ├── personal-analytics/index.vue
    └── course-analytics/index.vue
```

关键约束：

- 类型直接保留后端 snake_case，不做 camelCase 转换。
- `adapters.ts` 专门处理窄表转宽表、分页字段转换、角色映射。
- 页面不要直接写 axios，统一走 `src/api/modules/score.ts`。
- 成绩模块请求层单独处理 `10000/message` 和 `X-User-*`，不要贸然改全局 axios，以免影响其他组。

---

## 5. 核心类型代码架子（写入文档，不落地）

建议将 `src/api/interface/score.ts` 重写为以下方向：

```ts
export namespace Score {
  export type FrontendRole = "student" | "teacher" | "academic_admin";
  export type BackendRole = "student" | "teacher" | "admin" | "dean";

  export type GradeRecordStatus = "draft" | "submitted" | "approved";
  export type SubmissionStatus = "pending" | "approved" | "rejected";
  export type ModifyRequestStatus = "pending" | "approved" | "rejected";
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

  export interface CourseStudent {
    student_id: string;
    student_no: string;
    student_name: string;
    major: string | null;
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
    status: GradeRecordStatus | string;
    is_locked: 0 | 1;
    data_source: DataSource;
    created_at: string;
    updated_at: string;
  }

  export interface GradeRecordList {
    total: number;
    page: number;
    page_size: number;
    records: GradeRecord[];
  }

  export interface GradeRecordRow {
    student_id: string;
    student_no: string;
    student_name?: string;
    major?: string | null;
    records: Record<number, GradeRecord>;
  }

  export interface SaveGradeRecordReq {
    student_id: string;
    course_id: string;
    semester: string;
    component_config_id: number;
    score?: number | null;
    result_type?: string;
  }

  export interface UpdateGradeRecordReq {
    score?: number | null;
    result_type?: string;
    version_no?: number;
  }

  export interface BatchSaveGradeRecordsReq {
    course_id: string;
    semester: string;
    component_config_id: number;
    records: Array<{
      student_id: string;
      score?: number | null;
      result_type?: string;
    }>;
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

  export interface Submission {
    id: number;
    course_id: string;
    semester: string;
    submitted_by: string;
    submitted_by_name: string;
    reviewer_id: string | null;
    reviewer_name: string | null;
    status: SubmissionStatus | string;
    opinion: string | null;
    student_count: number;
    submitted_at: string;
    approved_at: string | null;
  }

  export interface ModifyRequest {
    id: number;
    grade_record_id: number;
    student_id: string;
    course_id: string;
    semester: string;
    component_type: string;
    component_sub_id: string;
    original_score: number | null;
    new_score: number | null;
    modify_type: string;
    reason: string;
    status: ModifyRequestStatus | string;
    applicant_id: string;
    applicant_name: string;
    reviewer_id: string | null;
    reviewer_name: string | null;
    opinion: string | null;
    created_at: string;
    approved_at: string | null;
  }

  export interface StudentGrade {
    course_id: string;
    semester: string;
    total_score: number;
    gpa: number;
    credit?: number;
    rank?: number | null;
    total_students?: number | null;
  }

  export interface CourseAnalysis {
    course_id: string;
    course_name?: string;
    semester: string;
    total_students: number;
    average_score: number;
    max_score: number;
    min_score: number;
    median_score: number;
    pass_rate: number;
    excellent_rate: number;
    distribution: Array<{ range: string; count: number; percentage: number }>;
    grade_levels: Array<{ level: string; count: number; percentage: number }>;
    ranking_summary: Record<string, number>;
  }
}
```

---

## 6. API 请求层代码架子（写入文档，不落地）

成绩模块建议新增局部适配，不直接改全局 axios：

```ts
import http from "@/api";
import { ResultEnum } from "@/enums/httpEnum";
import { useUserStore } from "@/stores/modules/user";
import type { ResultData } from "@/api/interface";
import type { Score } from "@/api/interface/score";

const SCORE_PREFIX = "/api/v1/grade";
const SCORE_SUCCESS = 10000;

function backendRole(role: string): Score.BackendRole {
  if (role === "academic_admin") return "admin";
  if (role === "teacher") return "teacher";
  if (role === "student") return "student";
  return "student";
}

function scoreRequestOptions(options: Record<string, any> = {}) {
  const userStore = useUserStore();
  return {
    ...options,
    headers: {
      ...(options.headers ?? {}),
      "X-User-ID": userStore.token || "anonymous",
      "X-User-Role": backendRole(userStore.userInfo.role),
      "X-User-Name": userStore.userInfo.name || ""
    }
  };
}

function adapt<T>(resp: Score.BackendResp<T>): ResultData<T> {
  if (resp.code !== SCORE_SUCCESS) {
    return Promise.reject({
      code: String(resp.code),
      msg: resp.message,
      data: resp.data
    }) as never;
  }
  return {
    code: String(ResultEnum.SUCCESS),
    msg: resp.message,
    data: resp.data
  };
}

const scoreHttp = {
  async get<T>(url: string, params?: object) {
    const resp = await http.get<Score.BackendResp<T>>(SCORE_PREFIX + url, params, scoreRequestOptions());
    return adapt(resp as unknown as Score.BackendResp<T>);
  },
  async post<T>(url: string, body?: object | FormData) {
    const resp = await http.post<Score.BackendResp<T>>(SCORE_PREFIX + url, body, scoreRequestOptions());
    return adapt(resp as unknown as Score.BackendResp<T>);
  },
  async put<T>(url: string, body?: object) {
    const resp = await http.put<Score.BackendResp<T>>(SCORE_PREFIX + url, body, scoreRequestOptions());
    return adapt(resp as unknown as Score.BackendResp<T>);
  }
};
```

但注意：当前全局 axios 会在 `code !== 200` 时提前拦截。真正落地时有两种选择：

1. 推荐：给全局 `CustomAxiosRequestConfig` 增加 `skipCodeCheck?: boolean`，成绩模块请求加 `{ skipCodeCheck: true }`，再由 `adapt` 处理 `10000`。
2. 临时：不用项目封装的 `http`，成绩模块单独 `axios.create()`。代价是 loading、取消请求、错误提示与项目不完全一致。

建议选方案 1，改动小且保留模板能力。

API 函数示例：

```ts
export const getGradeCourses = () =>
  scoreHttp.get<{ total: number; courses: Score.Course[] }>("/courses");

export const getCourseStudents = (courseId: string, params: { semester: string }) =>
  scoreHttp.get<{ total: number; students: Score.CourseStudent[] }>(`/courses/${courseId}/students`, params);

export const getGradeConfig = (courseId: string, params: { semester: string }) =>
  scoreHttp.get<{ course_id: string; semester: string; components: Score.GradeComponent[] }>(
    `/courses/${courseId}/grade-config`,
    params
  );

export const saveGradeConfig = (
  courseId: string,
  body: { semester: string; components: Array<Pick<Score.GradeComponent, "component_type" | "component_sub_id" | "weight" | "data_source">> }
) => scoreHttp.put(`/courses/${courseId}/grade-config`, body);

export const getGradeRecords = (params: {
  course_id?: string;
  semester?: string;
  student_id?: string;
  status?: string;
  page?: number;
  page_size?: number;
}) => scoreHttp.get<Score.GradeRecordList>("/grade-records", params);

export const createGradeRecord = (body: Score.SaveGradeRecordReq) =>
  scoreHttp.post<{ grade_record_id: number; status: string }>("/grade-records", body);

export const updateGradeRecord = (recordId: number, body: Score.UpdateGradeRecordReq) =>
  scoreHttp.put<{ grade_record_id: number; version_no: number }>(`/grade-records/${recordId}`, body);

export const submitCourseGrades = (courseId: string, body: { course_id: string; semester: string }) =>
  scoreHttp.post(`/courses/${courseId}/grade-submissions`, body);

export const approveSubmission = (id: number, body: { reviewer_id?: string; reviewer_name?: string; opinion?: string }) =>
  scoreHttp.put(`/grade-submissions/${id}/approve`, body);

export const publishSubmission = (id: number) =>
  scoreHttp.put<{ submission_id: number; status: string; published_count: number }>(`/grade-submissions/${id}/publish`, {});
```

文件流导出不能走 `adapt`：

```ts
export const exportGradeRecords = (params: { course_id: string; semester: string }) =>
  http.service.get(`${SCORE_PREFIX}/grade-records/export`, {
    params,
    responseType: "blob",
    ...scoreRequestOptions({ loading: true })
  });
```

---

## 7. 核心页面数据流：成绩录入页

组件结构：

```text
entry/index.vue
├── SemesterSelect
├── CourseSelector
├── ScoreComponentEditor
└── EditableGradeTable
```

推荐数据流：

```ts
const selectedCourseId = ref("");
const selectedSemester = ref("");
const components = ref<Score.GradeComponent[]>([]);
const students = ref<Score.CourseStudent[]>([]);
const records = ref<Score.GradeRecord[]>([]);

const rows = computed(() => pivotGradeRecords(students.value, components.value, records.value));

async function loadEntryData() {
  const [studentResp, configResp, recordResp] = await Promise.all([
    getCourseStudents(selectedCourseId.value, { semester: selectedSemester.value }),
    getGradeConfig(selectedCourseId.value, { semester: selectedSemester.value }),
    getCourseRecords(selectedCourseId.value, { semester: selectedSemester.value })
  ]);

  students.value = studentResp.data.students;
  components.value = configResp.data.components;
  records.value = recordResp.data;
}

async function saveCell(row: Score.GradeRecordRow, component: Score.GradeComponent, score: number | null) {
  const existing = row.records[component.id];
  if (existing) {
    await updateGradeRecord(existing.id, { score, version_no: existing.version_no });
  } else {
    await createGradeRecord({
      student_id: row.student_id,
      course_id: selectedCourseId.value,
      semester: selectedSemester.value,
      component_config_id: component.id,
      score,
      result_type: "normal"
    });
  }
  await loadEntryData();
}
```

`pivotGradeRecords` 负责把后端窄表转换为 UI 宽表：

```ts
function pivotGradeRecords(
  students: Score.CourseStudent[],
  components: Score.GradeComponent[],
  records: Score.GradeRecord[]
): Score.GradeRecordRow[] {
  const byStudent = new Map<string, Score.GradeRecordRow>();

  for (const student of students) {
    byStudent.set(student.student_id, {
      student_id: student.student_id,
      student_no: student.student_no,
      student_name: student.student_name,
      major: student.major,
      records: {}
    });
  }

  for (const record of records) {
    const row = byStudent.get(record.student_id);
    if (row) row.records[record.component_config_id] = record;
  }

  return Array.from(byStudent.values());
}
```

---

## 8. 权限与菜单修正

### 8.1 菜单角色

前端菜单仍用三类角色：

| 前端角色 | 页面 |
| --- | --- |
| student | 成绩查询、学分进展、个人成绩统计 |
| teacher | 成绩录入、成绩查询、改分申请、课程成绩分析 |
| academic_admin | 成绩录入(查看)、成绩查询、改分审批、全局成绩管理、课程成绩分析（不含学分进展/个人统计） |

与后端交互时 `academic_admin` 映射为 `admin`。

### 8.2 按钮权限

建议修正：

- teacher 的 `scoreQuery` 增加 `create`，用于“申请改分”按钮。
- academic_admin 的 `scoreChangeApproval` 增加 `publish`，用于“发布成绩”按钮。
- 如果管理员页面保留学分进展/个人统计，必须支持输入学生 ID；否则先隐藏这两个菜单，避免进入后只能看当前 mock 用户。

---

## 9. 潜在风险与后端建议

| 风险 | 前端影响 | 建议 |
| --- | --- | --- |
| 后端鉴权头可由前端伪造 | 安全边界不成立 | 生产环境由网关/JWT 中间件注入 `X-User-*`，后端不要信任浏览器直传 |
| 教师接口未按任课范围过滤 | 教师可能看到全校课程与成绩 | 后端按 `user_id` 过滤 `courses/grade-records/submissions/modify-requests` |
| `academic_admin` 与 `admin/dean` 不一致 | 联调 403 | 统一角色枚举，或网关做映射 |
| 全局 axios 只认 `code=200` | 成绩接口 `10000` 会被判失败 | 加 `skipCodeCheck` 或成绩模块独立 axios |
| `getGradeRecords` 分页按分项行分页 | 前端学生行表格分页错乱 | 后端新增聚合查询：按学生一行返回 components、total、gpa |
| 学生查分无分项明细 | 学生无法展开查看成绩组成 | 新增 `/students/me/grades/{course_id}/records?semester=` 或在 `me/grades` 返回 components |
| 课程/成绩记录缺少课程名、学生名 | 前端要多次请求并合并，体验慢 | 后端列表接口 join `course_name/student_name/major/credit` |
| `calculatePreview` 不返回总评分和绩点 | 前端无法预览总评 | 后端返回每个学生的 `total_score/gpa/missing_components` |
| 审批通过不等于发布 | 学生查不到刚审批的成绩 | 前端加发布按钮；后端也可考虑 approve 时可选自动 publish |
| 改分通过后新总评是 `approved` | 改分结果学生端仍不可见 | 后端补改分发布流程或改分通过后同步 published |
| 学分进展缺分类与总要求 | 原设计无法落地 | 后端对接培养方案，返回 required/earned by category |
| Excel 导入只从文件列读上下文 | 前端上传弹窗的课程/分项选择无法生效 | 后端支持 multipart fields：`course_id/semester/component_config_id`，文件只需学生与成绩 |
| 在线测试导入要求前端传 scores | 前端被迫跨组编排 | 成绩服务内部调用在线测试服务，前端只传 course/semester/component |
| 导出只支持 xlsx 文件流 | 原 PDF/download_url 计划不匹配 | 前端本期改为 blob 下载 Excel；PDF 作为前端自渲染扩展 |
| 日志接口无分页 | 审计数据多时卡顿 | 后端补 `page/page_size/operator_id/target_id/date_range` |
| `APIResponse.error(None, ...)` | 可能返回 `code: null`，前端类型不稳定 | 后端统一使用明确错误码，如 `10400/70103` |

---

## 10. 推荐实施顺序

1. 文档对齐：以本 PLAN 为准同步前端、后端、测试同学。
2. 请求层适配：先解决 `10000/message`、`X-User-*`、`academic_admin -> admin`。
3. 类型定义：按后端实际字段重写 `src/api/interface/score.ts`。
4. 菜单和按钮：裁剪角色菜单，补 `create/publish` 权限。
5. 成绩录入页：先完成课程、名单、配置、明细 pivot 与手工录入。
6. 提交审批发布：打通提交、审批、发布三步闭环。
7. 学生查分：先做总评列表，分项展开等待后端补接口。
8. 统计分析：按后端已有字段展示，隐藏排名表和分类学分等未支持功能。
9. 导出：先按 xlsx blob 下载；PDF 报告作为后续增强。

---

## 11. 验收清单

- [ ] 所有成绩接口前缀均为 `/api/v1/grade`。
- [ ] 成绩模块能正确处理 `{ code: 10000, message, data }`。
- [ ] 请求真实后端时带 `X-User-ID`、`X-User-Role`、`X-User-Name`。
- [ ] `academic_admin` 请求后端时映射为 `admin`。
- [ ] 教师成绩录入页能把分项记录 pivot 成学生行。
- [ ] `data_source !== manual` 的成绩列不能手工编辑。
- [ ] 提交流程完整覆盖：draft -> submitted -> approved/rejected -> published。
- [ ] 学生端只在 published 后看到成绩。
- [ ] 改分申请只允许针对 approved 且未锁定的分项记录。
- [ ] 改分审批后能刷新总评，并明确是否发布给学生。
- [ ] 学分进展对 `total_required_credits: null` 有空状态，不展示虚假进度。
- [ ] 课程分析不展示后端未返回的排名表。
- [ ] 导出按文件流处理，不再期待 `download_url`。
- [ ] 所有后端暂不支持的能力在 UI 中隐藏、置灰或显示明确空状态。
