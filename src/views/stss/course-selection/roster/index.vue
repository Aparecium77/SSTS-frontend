<template>
  <ModuleScaffold
    group-label="选课中心组"
    module-label="任课花名册"
    description="选课中心组的同学在这里继续开发任课教师查看学生名单、导出花名册等页面。"
    view-path="src/views/stss/course-selection/roster/index.vue"
    api-path="src/api/modules/courseSelection.ts"
    type-path="src/api/interface/courseSelection.ts"
  />
</template>

<script setup lang="ts" name="teachingRoster">
import ModuleScaffold from "@/views/stss/components/ModuleScaffold.vue";

// 选课中心组的同学在这里继续补充任课花名册页面逻辑。
</script>
