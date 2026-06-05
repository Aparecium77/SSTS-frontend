# 成绩管理任务 5 更新记录

日期：2026-06-01

## 目标

按后端当前可用字段降级实现学生端相关页面，并让教师/管理员成绩查询可以查看课程成绩明细。

## 本任务生成代码

- 重写 `src/views/stss/score/query/index.vue`：
  - 学生角色调用 `getMyGrades` 展示已发布总评、GPA、学分和排名。
  - 教师/管理员角色选择课程和学期后，加载名单、配置、明细并前端 pivot 为学生行。
  - 明确提示学生接口暂不支持课程名和分项明细。
- 重写 `src/views/stss/score/credit-progress/index.vue`：
  - 展示已修学分、总要求学分、累计 GPA、加权平均。
  - 当 `total_required_credits` 为 `null` 时显示培养方案未同步提示，不展示虚假完成率。
- 重写 `src/views/stss/score/personal-analytics/index.vue`：
  - 展示累计 GPA、加权平均、已修学分和课程排名。
  - 明确后端暂不返回通过率和不及格门数。

## 检查记录

- `corepack pnpm exec eslint src/views/stss/score/query/index.vue src/views/stss/score/credit-progress/index.vue src/views/stss/score/personal-analytics/index.vue`：通过。
- `corepack pnpm type:check`：未完全通过，失败点仍为项目既有 `src/components/ProTable/*` 与 `src/views/proTable/*` 类型问题；本任务修改文件未出现在错误列表中。
