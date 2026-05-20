<template>
  <div>
    <div class="card mb10">
      <h4 class="title">简介</h4>
      <span class="text">
        STSS 是本项目当前使用的统一系统名称，前端基于 Vue 3、TypeScript、Vite、Pinia、Vue Router、Element Plus 与 Tailwind CSS
        构建，用于承载教务系统的课程、排课、论坛、在线测试与成绩等业务模块。
      </span>
    </div>
    <div class="card mb10">
      <h4 class="title">项目信息</h4>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="系统名称" label-align="left">
          <el-tag>STSS</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="版本号" label-align="left">
          <el-tag>{{ version }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="发布时间" label-align="left">
          <el-tag>{{ lastBuildTime }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="课程信息" label-align="left">
          <el-tag type="info">25-26春夏软工</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="班级信息" label-align="left">
          <el-tag type="info">刘玉生老师班软件工程</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="技术栈" label-align="left">
          <el-tag type="success">Vue 3 + TypeScript + Vite</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="当前状态" label-align="left">
          <el-tag type="warning">前端骨架搭建中</el-tag>
        </el-descriptions-item>
      </el-descriptions>
    </div>
    <div class="card mb10">
      <h4 class="title">生产环境依赖</h4>
      <el-descriptions :column="3" border>
        <el-descriptions-item v-for="(value, key) in dependencies" :key="key" width="400px" :label="key">
          <el-tag type="info">
            {{ value }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>
    </div>
    <div class="card">
      <h4 class="title">开发环境依赖</h4>
      <el-descriptions :column="3" border>
        <el-descriptions-item v-for="(value, key) in devDependencies" :key="key" width="400px" :label="key">
          <el-tag type="info">
            {{ value }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>
    </div>
  </div>
</template>

<script setup lang="ts" name="about">
const { pkg, lastBuildTime } = __APP_INFO__;
const { dependencies, devDependencies, version } = pkg;
</script>

<style lang="scss" scoped>
.card {
  .title {
    margin: 0 0 15px;
    font-size: 17px;
    font-weight: bold;
    color: var(--el-text-color-primary);
  }
  .text {
    font-size: 15px;
    line-height: 25px;
    color: var(--el-text-color-regular);
    .el-link {
      font-size: 15px;
    }
  }
}
</style>
