<template>
  <div class="schedule-page-view">
    <SchedulePageShell
      v-model="detailVisible"
      title="教学资源"
      description="统一管理教师、教室、课程与班级资源，为排课规则、手工调课和自动排课提供稳定的基础数据。"
      :tags="['分类切换', '资源建档', '状态启停']"
      :stats="stats"
      content-title="资源清单"
      content-description="集中维护教师、教室、课程和班级等排课基础资源。"
      :data-count="tableData.length"
      empty-description="当前筛选条件下没有资源数据。"
      dialog-title="资源详情"
    >
      <template #actions>
        <el-space wrap>
          <el-button @click="resetFilters">重置筛选</el-button>
          <el-button type="primary" @click="openCreateDialog">新增资源</el-button>
        </el-space>
      </template>

      <template #filters>
        <div class="filters-stack">
          <el-form :inline="true" :model="searchParam" class="filter-form">
            <el-form-item label="资源分类">
              <el-segmented v-model="searchParam.category" :options="categorySegments" />
            </el-form-item>
            <el-form-item label="所属部门">
              <el-select v-model="searchParam.department" placeholder="选择部门" clearable style="width: 220px">
                <el-option v-for="item in departmentOptions" :key="item.value" :label="item.label" :value="item.label" />
              </el-select>
            </el-form-item>
            <el-form-item label="资源状态">
              <el-select v-model="searchParam.status" placeholder="全部状态" clearable style="width: 160px">
                <el-option label="启用" value="enabled" />
                <el-option label="停用" value="disabled" />
              </el-select>
            </el-form-item>
            <el-form-item label="关键字">
              <el-input v-model="searchParam.keyword" placeholder="资源名称 / 编号 / 负责人" clearable style="width: 240px" />
            </el-form-item>
            <el-form-item>
              <el-space>
                <el-button type="primary" @click="handleSearch">查询</el-button>
                <el-button @click="resetFilters">重置</el-button>
              </el-space>
            </el-form-item>
          </el-form>
        </div>
      </template>

      <el-table :data="tableData" border>
        <el-table-column prop="name" label="资源名称" min-width="180" />
        <el-table-column prop="code" label="资源编号" min-width="120" />
        <el-table-column label="分类" min-width="120">
          <template #default="{ row }">
            <el-tag :type="categoryTagTypeMap[row.category]" effect="light">
              {{ categoryLabelMap[row.category] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="department" label="所属部门" min-width="140" />
        <el-table-column prop="ownerName" label="维护人" min-width="120" />
        <el-table-column label="容量/人数" min-width="110">
          <template #default="{ row }">
            {{ row.capacity ?? "-" }}
          </template>
        </el-table-column>
        <el-table-column label="标签" min-width="220">
          <template #default="{ row }">
            <el-space wrap>
              <el-tag v-for="tag in row.tags" :key="tag" size="small" effect="plain">{{ tag }}</el-tag>
            </el-space>
          </template>
        </el-table-column>
        <el-table-column label="状态" min-width="160">
          <template #default="{ row }">
            <div class="status-cell">
              <el-tag :type="row.status === 'enabled' ? 'success' : 'info'">
                {{ row.status === "enabled" ? "启用中" : "已停用" }}
              </el-tag>
              <el-switch
                :model-value="row.status === 'enabled'"
                inline-prompt
                active-text="启用"
                inactive-text="停用"
                @change="value => handleStatusChange(row.id, Boolean(value))"
              />
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="updatedAt" label="更新时间" min-width="160" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-space>
              <el-button link type="primary" @click="openDetail(row.id)">详情</el-button>
              <el-button link @click="openEditDialog(row)">编辑</el-button>
            </el-space>
          </template>
        </el-table-column>
      </el-table>

      <template #detail>
        <div v-if="currentDetail" class="detail-stack">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="资源名称">{{ currentDetail.name }}</el-descriptions-item>
            <el-descriptions-item label="资源编号">{{ currentDetail.code }}</el-descriptions-item>
            <el-descriptions-item label="资源分类">{{ categoryLabelMap[currentDetail.category] }}</el-descriptions-item>
            <el-descriptions-item label="所属部门">{{ currentDetail.department }}</el-descriptions-item>
            <el-descriptions-item label="维护人">{{ currentDetail.ownerName }}</el-descriptions-item>
            <el-descriptions-item label="资源状态">
              {{ currentDetail.status === "enabled" ? "启用中" : "已停用" }}
            </el-descriptions-item>
            <el-descriptions-item label="容量/人数">{{ currentDetail.capacity ?? "-" }}</el-descriptions-item>
            <el-descriptions-item label="适用学期">{{ currentDetail.semester.semesterName }}</el-descriptions-item>
            <el-descriptions-item label="使用率">{{
              currentDetail.usageRate ? `${currentDetail.usageRate}%` : "-"
            }}</el-descriptions-item>
            <el-descriptions-item label="更新时间">{{ currentDetail.updatedAt }}</el-descriptions-item>
            <el-descriptions-item label="备注" :span="2">{{ currentDetail.remark || "无" }}</el-descriptions-item>
            <el-descriptions-item label="标签" :span="2">
              <el-space wrap>
                <el-tag v-for="tag in currentDetail.tags" :key="tag" effect="plain">{{ tag }}</el-tag>
              </el-space>
            </el-descriptions-item>
          </el-descriptions>

          <el-card shadow="never">
            <template #header>关联课程</template>
            <el-empty v-if="!currentDetail.relatedCourses?.length" description="暂无关联课程" />
            <el-space v-else wrap>
              <el-tag v-for="course in currentDetail.relatedCourses" :key="course" type="primary" effect="plain">
                {{ course }}
              </el-tag>
            </el-space>
          </el-card>
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
        :page-sizes="[5, 10, 20, 50]"
        @size-change="onPageSizeChange"
        @current-change="onPageCurrentChange"
      />
    </div>

    <el-dialog v-model="formVisible" :title="formMode === 'create' ? '新增资源' : '编辑资源'" width="720px">
      <el-form ref="formRef" :model="formModel" :rules="formRules" label-width="96px" class="resource-form">
        <el-form-item label="资源分类" prop="category">
          <el-select v-model="formModel.category" placeholder="选择资源分类">
            <el-option v-for="item in resourceCategoryOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="资源名称" prop="name">
          <el-input v-model="formModel.name" placeholder="请输入资源名称" />
        </el-form-item>
        <el-form-item label="资源编号" prop="code">
          <el-input v-model="formModel.code" placeholder="请输入资源编号" />
        </el-form-item>
        <el-form-item label="所属部门" prop="department">
          <el-select v-model="formModel.department" placeholder="选择所属部门">
            <el-option v-for="item in departmentOptions" :key="item.value" :label="item.label" :value="item.label" />
          </el-select>
        </el-form-item>
        <el-form-item label="维护人" prop="ownerName">
          <el-input v-model="formModel.ownerName" placeholder="请输入维护人" />
        </el-form-item>
        <el-form-item label="容量/人数" prop="capacity">
          <el-input-number v-model="formModel.capacity" :min="0" :controls="false" style="width: 100%" />
        </el-form-item>
        <el-form-item label="资源状态" prop="status">
          <el-radio-group v-model="formModel.status">
            <el-radio value="enabled">启用</el-radio>
            <el-radio value="disabled">停用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="资源标签" prop="tags">
          <el-select v-model="formModel.tags" multiple filterable allow-create default-first-option placeholder="输入或选择标签">
            <el-option v-for="tag in tagSuggestions" :key="tag" :label="tag" :value="tag" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="formModel.remark" type="textarea" :rows="3" placeholder="补充资源限制、排课注意事项等信息" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-space>
          <el-button @click="formVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm">保存</el-button>
        </el-space>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts" name="scheduleResources">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import type { FormInstance, FormRules } from "element-plus";
import type { Schedule } from "@/api/interface/schedule";
import { useTable } from "@/hooks/useTable";
import SchedulePageShell from "../components/SchedulePageShell.vue";
import { departmentOptions, resourceCategoryOptions, resourceTagSuggestions } from "./mock";
import {
  changeResourceRecordStatus,
  createResourceRecord,
  getResourceDetail,
  getResourcePage,
  getResourceStats,
  updateResourceRecord
} from "./service";
import type { ResourceFilters } from "./types";

type ResourceFormMode = "create" | "edit";

const detailVisible = ref(false);
const formVisible = ref(false);
const formMode = ref<ResourceFormMode>("create");
const currentDetail = ref<Schedule.ResourceDetail | null>(null);
const formRef = ref<FormInstance>();
const statsState = ref<Schedule.ResourceStats>({
  total: 0,
  enabled: 0,
  disabled: 0,
  warningCount: 0
});

const searchInitParam: ResourceFilters = {
  category: "teacher",
  department: "",
  status: "",
  keyword: ""
};

const { tableData, pageable, searchParam, search, handleSizeChange, handleCurrentChange, getTableList } = useTable(
  async (params: Schedule.ResourceQuery) => {
    const result = await getResourcePage(params);
    return { data: result.data };
  },
  {},
  true
);

Object.assign(searchParam.value, searchInitParam);

const createEmptyForm = (): Schedule.ResourceForm => ({
  category: "teacher",
  name: "",
  code: "",
  department: "",
  ownerName: "",
  capacity: undefined,
  status: "enabled",
  tags: [],
  remark: ""
});

const formModel = reactive<Schedule.ResourceForm>(createEmptyForm());

const formRules: FormRules<Schedule.ResourceForm> = {
  category: [{ required: true, message: "请选择资源分类", trigger: "change" }],
  name: [{ required: true, message: "请输入资源名称", trigger: "blur" }],
  code: [{ required: true, message: "请输入资源编号", trigger: "blur" }],
  department: [{ required: true, message: "请选择所属部门", trigger: "change" }],
  ownerName: [{ required: true, message: "请输入维护人", trigger: "blur" }],
  status: [{ required: true, message: "请选择资源状态", trigger: "change" }],
  tags: [{ type: "array", required: true, min: 1, message: "请至少填写一个标签", trigger: "change" }]
};

const categorySegments = resourceCategoryOptions.map(item => ({ label: item.label, value: item.value }));
const categoryLabelMap = Object.fromEntries(resourceCategoryOptions.map(item => [item.value, item.label])) as Record<
  Schedule.ResourceCategory,
  string
>;
const categoryTagTypeMap: Record<Schedule.ResourceCategory, "success" | "warning" | "primary" | "info"> = {
  teacher: "success",
  classroom: "warning",
  course: "primary",
  class: "info"
};

const loadStats = async () => {
  const { data } = await getResourceStats({
    ...(searchParam.value as ResourceFilters),
    pageNum: pageable.value.pageNum,
    pageSize: pageable.value.pageSize
  });
  statsState.value = data;
};

const refreshList = async () => {
  await getTableList();
  await loadStats();
};

const handleSearch = async () => {
  search();
  await loadStats();
};

const stats = computed(() => [
  { label: "资源总数", value: statsState.value.total, help: "教师、教室、课程、班级统一建档" },
  { label: "启用中", value: statsState.value.enabled, help: "当前可参与排课的资源" },
  { label: "停用中", value: statsState.value.disabled, help: "暂不参与排课或调课" },
  { label: "预警项", value: statsState.value.warningCount, help: "停用资源或容量不足资源" }
]);

const tagSuggestions = computed(() => {
  const tableTags = tableData.value.flatMap(item => item.tags);
  return Array.from(new Set([...resourceTagSuggestions, ...tableTags]));
});

const resetFormModel = () => {
  Object.assign(formModel, createEmptyForm());
};

const resetFilters = async () => {
  Object.assign(searchParam.value, searchInitParam);
  pageable.value.pageNum = 1;
  await refreshList();
};

const onPageSizeChange = async (size: number) => {
  handleSizeChange(size);
  await loadStats();
};

const onPageCurrentChange = async (page: number) => {
  handleCurrentChange(page);
  await loadStats();
};

const openDetail = async (id: string) => {
  const { data } = await getResourceDetail(id);
  currentDetail.value = data;
  detailVisible.value = true;
};

const openCreateDialog = () => {
  formMode.value = "create";
  resetFormModel();
  formVisible.value = true;
};

const openEditDialog = (record: Schedule.ResourceRecord) => {
  formMode.value = "edit";
  Object.assign(formModel, {
    ...record,
    tags: [...record.tags]
  });
  formVisible.value = true;
};

const handleStatusChange = async (id: string, enabled: boolean) => {
  const { data } = await changeResourceRecordStatus({
    id,
    status: enabled ? "enabled" : "disabled"
  });
  if (!data) {
    ElMessage.error("资源不存在或已被移除");
    return;
  }

  await refreshList();
  if (currentDetail.value?.id === id) {
    currentDetail.value = (await getResourceDetail(id)).data;
  }
  ElMessage.success(`${data.name}已${enabled ? "启用" : "停用"}`);
};

const submitForm = async () => {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  if (formMode.value === "edit" && formModel.id) {
    await updateResourceRecord({
      ...formModel,
      tags: [...formModel.tags]
    });
    ElMessage.success("资源已更新");
  } else {
    await createResourceRecord({
      ...formModel,
      tags: [...formModel.tags]
    });
    ElMessage.success("资源已新增");
  }

  formVisible.value = false;
  resetFormModel();
  pageable.value.pageNum = 1;
  await refreshList();
};

onMounted(async () => {
  await refreshList();
});
</script>

<style scoped lang="scss">
.schedule-page-view,
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
.status-cell {
  display: flex;
  gap: 12px;
  align-items: center;
}
.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
.resource-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 4px 16px;
}
.resource-form :deep(.el-form-item:last-child),
.resource-form :deep(.el-form-item:nth-last-child(2)) {
  grid-column: 1 / -1;
}

@media (width <= 768px) {
  .pagination-wrap {
    justify-content: flex-start;
    overflow-x: auto;
  }
  .resource-form {
    grid-template-columns: 1fr;
  }
}
</style>
