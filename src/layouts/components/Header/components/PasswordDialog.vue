<template>
  <el-dialog v-model="dialogVisible" title="修改密码" width="500px" draggable>
    <div class="password-dialog">
      <p class="desc">当前模板阶段已保留统一入口。后续各组不要重复造轮子，密码修改应统一接入这里。</p>
      <el-form label-width="92px">
        <el-form-item label="旧密码">
          <el-input type="password" placeholder="后续接入真实接口" show-password />
        </el-form-item>
        <el-form-item label="新密码">
          <el-input type="password" placeholder="后续接入真实接口" show-password />
        </el-form-item>
        <el-form-item label="确认密码">
          <el-input type="password" placeholder="后续接入真实接口" show-password />
        </el-form-item>
      </el-form>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="dialogVisible = false">确认</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref } from "vue";

const dialogVisible = ref(false);
const openDialog = () => {
  dialogVisible.value = true;
};

defineExpose({ openDialog });
</script>

<style scoped lang="scss">
.password-dialog {
  .desc {
    margin: 0 0 16px;
    font-size: 13px;
    line-height: 1.7;
    color: #667085;
  }
}
</style>
