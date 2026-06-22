# 成绩管理任务 1 更新记录

日期：2026-06-01

## 目标

补齐成绩模块请求层，使前端可以对接后端当前 FastAPI MVP 的真实契约。

## 设计约束

- 浏览器最终请求路径为 `/api/v1/grade`；由于项目全局 `VITE_API_URL=/api`，成绩模块内部前缀使用 `/v1/grade`。
- 后端成功码为 `10000`，不同于项目全局 `200`。
- 后端读取身份头 `X-User-ID`、`X-User-Role`、`X-User-Name`。
- 前端角色 `academic_admin` 在请求后端时映射为 `admin`。
- 文件导出接口返回 blob 文件流，不走统一响应体适配。

## 本任务生成代码

- 在 `src/api/index.ts` 的请求配置中新增 `skipCodeCheck?: boolean`，允许成绩模块绕过全局 `code=200` 判断。
- 在 `src/api/modules/score.ts` 中新增成绩模块局部请求适配：
  - `SCORE_PREFIX = "/v1/grade"`，与全局 `VITE_API_URL=/api` 组合后形成 `/api/v1/grade`
  - `SCORE_SUCCESS = 10000`
  - `toScoreBackendRole()` 处理 `academic_admin -> admin`
  - `scoreRequestOptions()` 注入 `X-User-*` 身份头并开启 `skipCodeCheck`
  - `adaptScoreResp()` 将后端 `{ code, message, data }` 转为项目 `ResultData`
  - 封装课程、学生名单、成绩配置、成绩记录、提交审批、改分、学生查询、GPA、课程分析、导出等接口函数
  - 导出接口使用 `http.service.get(..., { responseType: "blob" })`，不走统一响应体适配

## 检查记录

- `corepack pnpm exec eslint src/api/index.ts src/api/modules/score.ts`：通过。
- `corepack pnpm type:check`：未完全通过，失败点为项目既有 `src/components/ProTable/*` 与 `src/views/proTable/*` 类型问题；本任务修改文件未出现在错误列表中。
