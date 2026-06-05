# 成绩管理任务 4 更新记录

日期：2026-06-01

## 目标

实现成绩提交审批、成绩发布、改分审批的管理员工作台。

## 本任务生成代码

- 重写 `src/views/stss/score/change-approval/index.vue`：
  - 提供课程、学期、改分状态筛选。
  - Tab 1 展示成绩提交记录，支持 `pending -> approve/reject`，`approved -> publish`。
  - Tab 2 展示改分申请，支持 `pending -> approve/reject`。
  - 审批操作通过弹窗采集意见，并附带当前用户信息。
  - 发布操作提示“发布后学生端可见”，避免把审批通过误认为最终发布。

## 检查记录

- `corepack pnpm exec eslint src/views/stss/score/change-approval/index.vue`：通过。
- `corepack pnpm type:check`：未完全通过，失败点仍为项目既有 `src/components/ProTable/*` 与 `src/views/proTable/*` 类型问题；本任务修改文件未出现在错误列表中。
