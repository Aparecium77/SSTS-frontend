<template>
  <CsPage title="AI 选课助手" desc="输入目标与学期，AI 推荐课程并解释；可一键采纳（逐门走规则引擎判定，不绕过校验）。">
    <el-card shadow="never" class="mb-3">
      <el-form :inline="true" :model="req">
        <el-form-item label="目标">
          <el-input v-model="req.goal" style="width: 320px" placeholder="例如：补满专业选修学分，避开早八" />
        </el-form-item>
        <el-form-item label="学期"><el-input v-model="req.semester" style="width: 120px" /></el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="MagicStick" :loading="loading" @click="onRecommend">生成推荐</el-button>
        </el-form-item>
      </el-form>
      <el-alert type="info" :closable="false" show-icon title="AI 仅产出建议与解释，不直接选课；采纳后由确定性规则引擎裁定。" />
    </el-card>

    <el-card shadow="never" header="推荐结果">
      <el-empty v-if="!rec" description="尚未生成推荐" />
      <template v-else>
        <el-row :gutter="12">
          <el-col v-for="o in rec.offerings" :key="o.offering_id" :span="8">
            <el-card shadow="hover" class="mb-2">
              <div class="flex justify-between">
                <span class="font-semibold">{{ o.course_name }}</span>
                <el-tag :type="o.eligibility === 'valid' ? 'success' : 'danger'" size="small">
                  {{ o.eligibility === "valid" ? "可选" : "不可选" }}
                </el-tag>
              </div>
              <div class="mt-1 text-xs" style="color: var(--el-text-color-secondary)">{{ o.reason }}</div>
              <div class="mt-1 text-xs" style="color: var(--el-text-color-placeholder)">{{ o.offering_id }}</div>
            </el-card>
          </el-col>
        </el-row>
        <el-button type="success" :loading="loading" @click="onAccept">一键采纳全部</el-button>
      </template>
    </el-card>

    <el-card v-if="acceptResults.length" shadow="never" header="采纳结果" class="mt-3">
      <el-table :data="acceptResults" border>
        <el-table-column prop="offering_id" label="开课" min-width="180" />
        <el-table-column label="结果" width="120">
          <template #default="{ row }">
            <el-tag :type="row.status === 'enrolled' ? 'success' : 'danger'">
              {{ row.status === "enrolled" ? "已选上" : "被拒" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="reason" label="原因" />
        <el-table-column prop="code" label="错误码" width="100" />
      </el-table>
    </el-card>
  </CsPage>
</template>

<script setup lang="ts" name="aiAdvisor">
import { reactive, ref } from "vue";
import { MagicStick } from "@element-plus/icons-vue";
import CsPage from "../components/CsPage.vue";
import { CourseSelection } from "@/api/interface/courseSelection";
import { acceptRecommendationApi, recommendApi } from "@/api/modules/courseSelection";

const USE_MOCK = true;

const req = reactive<CourseSelection.RecommendReq>({ goal: "补满专业选修学分", semester: "2026-1" });
const rec = ref<CourseSelection.RecommendResult | null>(null);
const acceptResults = ref<CourseSelection.AcceptResultItem[]>([]);
const loading = ref(false);

const mockRec: CourseSelection.RecommendResult = {
  rec_id: "rec-xyz",
  offerings: [
    {
      offering_id: "B-CS301-2026-1-01",
      course_name: "机器学习",
      reason: "符合专业选修，且与现有课表无时间冲突",
      eligibility: "valid"
    },
    {
      offering_id: "B-CS302-2026-1-01",
      course_name: "操作系统",
      reason: "前置课《数据结构》未修，暂不可选",
      eligibility: "invalid"
    }
  ]
};

async function onRecommend() {
  loading.value = true;
  acceptResults.value = [];
  try {
    if (USE_MOCK) {
      rec.value = mockRec;
    } else {
      const { data } = await recommendApi(req);
      rec.value = data;
    }
  } finally {
    loading.value = false;
  }
}

async function onAccept() {
  if (!rec.value) return;
  loading.value = true;
  try {
    if (USE_MOCK) {
      acceptResults.value = rec.value.offerings.map(o =>
        o.eligibility === "valid"
          ? { offering_id: o.offering_id, status: "enrolled" }
          : { offering_id: o.offering_id, status: "rejected", reason: "前置课程未修", code: 30103 }
      );
    } else {
      const { data } = await acceptRecommendationApi(rec.value.rec_id);
      acceptResults.value = data.results;
    }
  } finally {
    loading.value = false;
  }
}
</script>
