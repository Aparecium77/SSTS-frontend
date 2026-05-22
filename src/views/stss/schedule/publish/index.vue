<template>
  <SchedulePageShell
    v-model="detailVisible"
    title="课表发布"
    description="负责课表版本发布、目标范围确认与回滚记录管理，为第七阶段调课结果和第九阶段自动排课结果提供统一出口。"
    :tags="['版本管理', '发布确认', '回滚记录']"
    :stats="stats"
    content-title="发布记录"
    content-description="页面已拆成独立发布服务层和页面层，后续接入正式发布接口时只需要替换本地 service。"
    :data-count="tableData.length"
    empty-description="当前筛选条件下没有发布记录。"
    dialog-title="发布详情"
  >
    <template #actions>
      <el-space wrap>
        <el-button @click="resetFilters">重置筛选</el-button>
        <el-button type="primary" @click="openPublishDialog">发布新版本</el-button>
      </el-space>
    </template>

    <template #filters>
      <div class="filters-stack">
        <el-form :inline="true" :model="searchParam" class="filter-form">
          <el-form-item label="发布状态">
            <el-select v-model="searchParam.status" placeholder="全部状态" clearable style="width: 180px">
              <el-option label="待确认" value="pending" />
              <el-option label="已发布" value="published" />
              <el-option label="已回滚" value="rolledBack" />
            </el-select>
          </el-form-item>
          <el-form-item label="关键字">
            <el-input v-model="searchParam.keyword" placeholder="版本号 / 学期 / 发布范围" clearable style="width: 240px" />
          </el-form-item>
          <el-form-item>
            <el-space>
              <el-button type="primary" @click="handleSearch">查询</el-button>
              <el-button @click="resetFilters">重置</el-button>
            </el-space>
          </el-form-item>
        </el-form>

        <el-alert
          title="发布页数据与回滚交互均独立落在 publish 目录，避免与第七阶段 manual 和第九阶段 auto 的并行修改冲突。"
          type="info"
          :closable="false"
        />
      </div>
    </template>

    <el-table :data="tableData" border>
      <el-table-column prop="version" label="版本号" min-width="150" />
      <el-table-column prop="semesterName" label="学期" min-width="220" />
      <el-table-column prop="targetScope" label="发布范围" min-width="140" />
      <el-table-column prop="publishedBy" label="发布人" min-width="120" />
      <el-table-column prop="publishedAt" label="发布时间" min-width="170" />
      <el-table-column label="状态" min-width="110">
        <template #default="{ row }">
          <el-tag :type="statusTagTypeMap[row.status]">{{ statusLabelMap[row.status] }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <el-space>
            <el-button link type="primary" @click="openDetail(row)">详情</el-button>
            <el-button v-if="row.status !== 'rolledBack'" link type="danger" @click="openRollbackDialog(row)">回滚</el-button>
          </el-space>
        </template>
      </el-table-column>
    </el-table>

    <template #detail>
      <div v-if="currentRecord" class="detail-stack">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="版本号">{{ currentRecord.version }}</el-descriptions-item>
          <el-descriptions-item label="学期">{{ currentRecord.semesterName }}</el-descriptions-item>
          <el-descriptions-item label="发布范围">{{ currentRecord.targetScope }}</el-descriptions-item>
          <el-descriptions-item label="发布人">{{ currentRecord.publishedBy }}</el-descriptions-item>
          <el-descriptions-item label="发布时间">{{ currentRecord.publishedAt }}</el-descriptions-item>
          <el-descriptions-item label="状态">{{ statusLabelMap[currentRecord.status] }}</el-descriptions-item>
          <el-descriptions-item label="备注">{{ currentRecord.note || "无" }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </template>
  </SchedulePageShell>

  <div class="pagination-wrap">
    <el-pagination
      background
      layout="total, sizes, prev, pager, next"
      :total="pageable.total"
      :current-page="pageable.pageNum"
      :page-size="pageable.pageSize"
      :page-sizes="[5, 10, 20]"
      @size-change="onPageSizeChange"
      @current-change="onPageCurrentChange"
    />
  </div>

  <el-dialog v-model="publishVisible" title="发布新版本" width="720px">
    <el-form ref="publishFormRef" :model="publishForm" :rules="publishRules" label-width="96px" class="publish-form">
      <el-form-item label="学期" prop="semesterId">
        <el-select v-model="publishForm.semesterId" placeholder="选择学期">
          <el-option v-for="item in semesterOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="发布范围" prop="targetScope">
        <el-select v-model="publishForm.targetScope" placeholder="选择发布范围">
          <el-option v-for="item in publishScopeOptions" :key="item.value" :label="item.label" :value="item.label" />
        </el-select>
      </el-form-item>
      <el-form-item label="发布对象" prop="targetIds">
        <el-select v-model="publishForm.targetIds" multiple placeholder="选择对象">
          <el-option v-for="item in currentTargetOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="发布说明" prop="note">
        <el-input v-model="publishForm.note" type="textarea" :rows="4" placeholder="填写本次发布说明、影响范围或注意事项" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-space>
        <el-button @click="publishVisible = false">取消</el-button>
        <el-button type="primary" @click="submitPublish">确认发布</el-button>
      </el-space>
    </template>
  </el-dialog>

  <el-dialog v-model="rollbackVisible" title="回滚确认" width="560px">
    <el-alert
      title="回滚将把当前版本标记为已回滚，并保留记录供第七阶段调课审批和第九阶段自动排课复跑时追踪。"
      type="warning"
      :closable="false"
    />
    <el-form ref="rollbackFormRef" :model="rollbackForm" :rules="rollbackRules" label-width="84px" class="rollback-form">
      <el-form-item label="回滚版本">
        <el-input :model-value="rollbackTarget?.version || ''" disabled />
      </el-form-item>
      <el-form-item label="回滚原因" prop="note">
        <el-input v-model="rollbackForm.note" type="textarea" :rows="4" placeholder="填写回滚原因，便于后续复盘和联调" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-space>
        <el-button @click="rollbackVisible = false">取消</el-button>
        <el-button type="danger" @click="submitRollback">确认回滚</el-button>
      </el-space>
    </template>
  </el-dialog>
</template>

<script setup lang="ts" name="schedulePublish">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import type { FormInstance, FormRules } from "element-plus";
import type { Schedule } from "@/api/interface/schedule";
import { useTable } from "@/hooks/useTable";
import SchedulePageShell from "../components/SchedulePageShell.vue";
import { publishScopeOptions, publishTargetOptions, semesterOptions } from "./mock";
import { createLocalPublishRecord, getLocalPublishPage, rollbackLocalPublishRecord } from "./service";
import type { PublishFilters } from "./types";

const detailVisible = ref(false);
const publishVisible = ref(false);
const rollbackVisible = ref(false);
const currentRecord = ref<Schedule.PublishRecord | null>(null);
const rollbackTarget = ref<Schedule.PublishRecord | null>(null);
const publishFormRef = ref<FormInstance>();
const rollbackFormRef = ref<FormInstance>();

const searchInitParam: PublishFilters = {
  status: "",
  keyword: ""
};

const { tableData, pageable, searchParam, search, handleSizeChange, handleCurrentChange, getTableList } = useTable(
  async (params: Schedule.PublishQuery) => {
    const result = await getLocalPublishPage(params);
    return { data: result.data };
  },
  {},
  true
);

Object.assign(searchParam.value, searchInitParam);

const publishForm = reactive<Schedule.PublishForm>({
  semesterId: semesterOptions[0]?.value ?? "",
  targetScope: "全校",
  targetIds: [],
  note: ""
});

const rollbackForm = reactive({
  note: ""
});

const publishRules: FormRules<Schedule.PublishForm> = {
  semesterId: [{ required: true, message: "请选择学期", trigger: "change" }],
  targetScope: [{ required: true, message: "请选择发布范围", trigger: "change" }],
  targetIds: [{ type: "array", required: true, min: 1, message: "请至少选择一个发布对象", trigger: "change" }]
};

const rollbackRules: FormRules<typeof rollbackForm> = {
  note: [{ required: true, message: "请填写回滚原因", trigger: "blur" }]
};

const statusLabelMap: Record<Schedule.PublishStatus, string> = {
  pending: "待确认",
  published: "已发布",
  rolledBack: "已回滚"
};

const statusTagTypeMap: Record<Schedule.PublishStatus, "warning" | "success" | "danger"> = {
  pending: "warning",
  published: "success",
  rolledBack: "danger"
};

const stats = computed(() => [
  { label: "版本总数", value: pageable.value.total, help: "保留所有发布与回滚记录" },
  { label: "已发布", value: tableData.value.filter(item => item.status === "published").length, help: "当前窗口内有效版本" },
  { label: "待确认", value: tableData.value.filter(item => item.status === "pending").length, help: "待最终确认的版本" },
  { label: "已回滚", value: tableData.value.filter(item => item.status === "rolledBack").length, help: "便于回溯发布问题" }
]);

const currentTargetOptions = computed(() => {
  const scope = publishScopeOptions.find(item => item.label === publishForm.targetScope)?.value ?? "school";
  return publishTargetOptions[scope] ?? [];
});

const refreshList = async () => {
  await getTableList();
};

const handleSearch = async () => {
  search();
};

const resetFilters = async () => {
  Object.assign(searchParam.value, searchInitParam);
  pageable.value.pageNum = 1;
  await refreshList();
};

const onPageSizeChange = async (size: number) => {
  handleSizeChange(size);
};

const onPageCurrentChange = async (page: number) => {
  handleCurrentChange(page);
};

const openDetail = (record: Schedule.PublishRecord) => {
  currentRecord.value = record;
  detailVisible.value = true;
};

const resetPublishForm = () => {
  publishForm.semesterId = semesterOptions[0]?.value ?? "";
  publishForm.targetScope = "全校";
  publishForm.targetIds = [];
  publishForm.note = "";
};

const openPublishDialog = () => {
  resetPublishForm();
  publishVisible.value = true;
};

const submitPublish = async () => {
  const valid = await publishFormRef.value?.validate().catch(() => false);
  if (!valid) return;

  const semesterName = semesterOptions.find(item => item.value === publishForm.semesterId)?.label ?? publishForm.semesterId;
  await createLocalPublishRecord({
    ...publishForm,
    targetIds: [...publishForm.targetIds],
    semesterName,
    publishedBy: "教务管理员"
  });

  publishVisible.value = false;
  pageable.value.pageNum = 1;
  await refreshList();
  ElMessage.success("新版本已发布");
};

const openRollbackDialog = (record: Schedule.PublishRecord) => {
  rollbackTarget.value = record;
  rollbackForm.note = record.note ?? "";
  rollbackVisible.value = true;
};

const submitRollback = async () => {
  const valid = await rollbackFormRef.value?.validate().catch(() => false);
  if (!valid || !rollbackTarget.value) return;

  const { data } = await rollbackLocalPublishRecord({
    id: rollbackTarget.value.id,
    note: rollbackForm.note
  });
  if (!data) {
    ElMessage.error("发布记录不存在或已被移除");
    return;
  }

  rollbackVisible.value = false;
  if (currentRecord.value?.id === data.id) currentRecord.value = data;
  await refreshList();
  ElMessage.success("版本已回滚");
};

onMounted(async () => {
  await refreshList();
});
</script>

<style scoped lang="scss">
.filters-stack,
.detail-stack {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.filter-form {
  display: flex;
  flex-wrap: wrap;
}
.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
.publish-form,
.rollback-form {
  margin-top: 16px;
}

@media (width <= 768px) {
  .pagination-wrap {
    justify-content: flex-start;
    overflow-x: auto;
  }
}
</style>
