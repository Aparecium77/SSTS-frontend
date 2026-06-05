# 成绩管理任务 7 更新记录

日期：2026-06-01

## 目标

实现改分申请页面，并按后端校验规则只允许对可申请的分项成绩提交申请。

## 本任务生成代码

- 重写 `src/views/stss/score/change-request/index.vue`：
  - 支持课程和学期筛选。
  - 加载课程学生名单与成绩明细，合并学生姓名。
  - 仅展示 `status === "approved"` 且 `is_locked === 0` 的成绩记录。
  - 改分申请针对 `grade_record_id` 提交，包含新成绩、改分类型、原因、申请人信息。
  - 页面提示 submitted、published 或锁定记录不能直接申请改分。

## 检查记录

- `corepack pnpm exec eslint src/views/stss/score/change-request/index.vue`：通过。
- `corepack pnpm type:check`：未完全通过，失败点仍为项目既有 `src/components/ProTable/*` 与 `src/views/proTable/*` 类型问题；本任务修改文件未出现在错误列表中。
