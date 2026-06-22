# 成绩管理任务 3 更新记录

日期：2026-06-01

## 目标

实现成绩录入页 MVP，打通课程、学生名单、成绩配置、成绩记录读取，以及手工成绩保存。

## 本任务生成代码

- 新增 `src/views/stss/score/_shared/adapters.ts`：
  - `pivotGradeRecords(students, records)` 将后端成绩窄表聚合为前端学生行。
- 重写 `src/views/stss/score/entry/index.vue`：
  - 加载课程列表并默认选中第一门课程。
  - 按课程和学期加载学生名单、成绩配置、成绩明细。
  - 根据成绩项动态生成表格列。
  - 单元格保存时，有记录走 `updateGradeRecord`，无记录走 `createGradeRecord`。
  - 非 `manual` 来源、已锁定、已提交、已审批的成绩禁用编辑。
  - 支持 Excel 导入、计算检查、提交审批入口。

## 检查记录

- `corepack pnpm exec eslint src/views/stss/score/_shared/adapters.ts src/views/stss/score/entry/index.vue`：通过。
- `corepack pnpm type:check`：未完全通过，失败点仍为项目既有 `src/components/ProTable/*` 与 `src/views/proTable/*` 类型问题；本任务修改文件未出现在错误列表中。
