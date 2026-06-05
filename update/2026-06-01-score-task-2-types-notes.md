# 成绩管理任务 2 更新记录

日期：2026-06-01

## 目标

补齐成绩模块 TypeScript 类型，并让 API 封装使用这些类型，减少页面开发阶段的字段猜测。

## 本任务生成代码

- 重写 `src/api/interface/score.ts`：
  - 保留后端 snake_case 字段。
  - 增加课程、学生名单、成绩配置、成绩记录、批量导入、外部成绩映射、审批发布、改分申请、学生成绩、学分进展、GPA、课程分析等类型。
  - 保留旧的 `ListQuery`、`ScoreItem`，避免潜在引用被破坏。
- 更新 `src/api/modules/score.ts`：
  - API 返回值绑定 `Score.*` 类型。
  - 请求 body 从 `object` 收紧为明确的请求接口。
  - 后端统一响应类型改用 `Score.BackendResp<T>`。

## 检查记录

- `corepack pnpm exec eslint src/api/interface/score.ts src/api/modules/score.ts`：通过。
- `corepack pnpm type:check`：未完全通过，失败点仍为项目既有 `src/components/ProTable/*` 与 `src/views/proTable/*` 类型问题；本任务修改文件未出现在错误列表中。
