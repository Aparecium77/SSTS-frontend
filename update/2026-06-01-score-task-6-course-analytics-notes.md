# 成绩管理任务 6 更新记录

日期：2026-06-01

## 目标

实现课程成绩分析页，并按后端当前能力处理 Excel 文件流导出。

## 本任务生成代码

- 重写 `src/views/stss/score/course-analytics/index.vue`：
  - 支持课程和学期选择。
  - 展示平均分、最高分、最低分、通过率。
  - 展示分数段分布、等级统计、排名摘要。
  - 明确后端当前不返回学生排名明细表。
  - 导出使用 `exportCourseAnalysis` blob 响应生成 `.xlsx` 文件。

## 检查记录

- `corepack pnpm exec eslint src/views/stss/score/course-analytics/index.vue`：通过。
- `corepack pnpm type:check`：未完全通过，失败点仍为项目既有 `src/components/ProTable/*` 与 `src/views/proTable/*` 类型问题；本任务修改文件未出现在错误列表中。
