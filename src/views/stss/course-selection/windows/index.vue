<template>
  <CsPage title="选课窗口配置" desc="教务设置各阶段（意愿初选 / 抽签 / 补退选）的开放起止时间。">
    <el-row :gutter="16">
      <el-col :span="10">
        <el-card shadow="never" header="新增 / 更新窗口">
          <el-form :model="form" label-width="90px">
            <el-form-item label="学期"><el-input v-model="form.semester" /></el-form-item>
            <el-form-item label="阶段">
              <el-select v-model="form.stage" style="width: 100%">
                <el-option label="意愿初选" value="preference" />
                <el-option label="抽签" value="lottery" />
                <el-option label="补退选" value="add_drop" />
              </el-select>
            </el-form-item>
            <el-form-item label="开始时间">
              <el-date-picker v-model="form.start_at" type="datetime" style="width: 100%" />
            </el-form-item>
            <el-form-item label="结束时间">
              <el-date-picker v-model="form.end_at" type="datetime" style="width: 100%" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="loading" @click="onSave">保存窗口</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <el-col :span="14">
        <el-card shadow="never" header="已配置窗口">
          <el-table :data="windows" border empty-text="尚未配置窗口">
            <el-table-column prop="semester" label="学期" width="110" />
            <el-table-column label="阶段" width="120">
              <template #default="{ row }">{{ STAGE_TEXT[row.stage] }}</template>
            </el-table-column>
            <el-table-column prop="start_at" label="开始" min-width="170" />
            <el-table-column prop="end_at" label="结束" min-width="170" />
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </CsPage>
</template>

<script setup lang="ts" name="courseWindows">
import { reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import CsPage from "../components/CsPage.vue";
import { CourseSelection } from "@/api/interface/courseSelection";
import { setWindowApi } from "@/api/modules/courseSelection";

const USE_MOCK = true;
const STAGE_TEXT: Record<string, string> = { preference: "意愿初选", lottery: "抽签", add_drop: "补退选" };

const form = reactive<CourseSelection.WindowReq>({
  semester: "2026-1",
  stage: "preference",
  start_at: "",
  end_at: ""
});
const loading = ref(false);
const windows = ref<CourseSelection.WindowReq[]>([
  { semester: "2026-1", stage: "preference", start_at: "2026-04-20 00:00", end_at: "2026-04-23 00:00" },
  { semester: "2026-1", stage: "add_drop", start_at: "2026-04-26 00:00", end_at: "2026-05-03 00:00" }
]);

async function onSave() {
  if (!form.start_at || !form.end_at) {
    ElMessage.warning("请填写起止时间");
    return;
  }
  loading.value = true;
  try {
    if (!USE_MOCK) await setWindowApi(form);
    windows.value.unshift({ ...form });
    ElMessage.success("窗口已保存");
  } finally {
    loading.value = false;
  }
}
</script>
