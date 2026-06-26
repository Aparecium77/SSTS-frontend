<template>
  <div class="schedule-page-view">
    <SchedulePageShell
      v-model="detailVisible"
      title="教室管理"
      description="维护排课服务使用的教室容量、类型、启停状态和基础可用时段。"
      :tags="['真实接口', '批量导入', '可用时段']"
      :stats="stats"
      content-title="教室列表"
      content-description="数据来自 /api/v1/schedule/classrooms，新增、编辑、启停和删除会直接写入排课后端。"
      :data-count="filteredClassrooms.length"
      empty-description="当前筛选条件下没有教室。"
      dialog-title="教室详情"
    >
      <template #actions>
        <el-space wrap>
          <el-upload :show-file-list="false" accept=".csv,.xlsx" :auto-upload="false" :on-change="handleImportFile">
            <el-button>批量导入</el-button>
          </el-upload>
          <el-checkbox v-model="overwriteImport">覆盖同编号</el-checkbox>
          <el-button @click="loadClassrooms">刷新</el-button>
          <el-button type="primary" @click="openCreate">新增教室</el-button>
        </el-space>
      </template>

      <template #filters>
        <el-form :inline="true" :model="filters" class="filter-form">
          <el-form-item label="关键字">
            <el-input v-model="filters.keyword" clearable placeholder="教室名称 / 编号 / 校区 / 楼栋" style="width: 260px" />
          </el-form-item>
          <el-form-item label="教室类型">
            <el-select v-model="filters.roomType" clearable placeholder="全部类型" style="width: 180px">
              <el-option v-for="item in roomTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="filters.active" clearable placeholder="全部状态" style="width: 140px">
              <el-option label="启用" value="active" />
              <el-option label="停用" value="inactive" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button @click="resetFilters">重置</el-button>
          </el-form-item>
        </el-form>
      </template>

      <el-table v-loading="loading" :data="filteredClassrooms" border>
        <el-table-column prop="code" label="编号" min-width="110" />
        <el-table-column prop="name" label="教室名称" min-width="180" />
        <el-table-column prop="campus" label="校区" min-width="120" />
        <el-table-column prop="building" label="楼栋" min-width="140" />
        <el-table-column prop="capacity" label="容量" min-width="90" />
        <el-table-column label="类型" min-width="130">
          <template #default="{ row }">{{ getRoomTypeLabel(row.room_type) }}</template>
        </el-table-column>
        <el-table-column label="可用时段" min-width="180">
          <template #default="{ row }">{{
            row.available_time.length ? `${row.available_time.length} 个节次` : "未设置"
          }}</template>
        </el-table-column>
        <el-table-column label="状态" min-width="150">
          <template #default="{ row }">
            <div class="status-cell">
              <el-tag :type="row.is_active ? 'success' : 'info'">{{ row.is_active ? "启用" : "停用" }}</el-tag>
              <el-switch
                :model-value="row.is_active"
                inline-prompt
                active-text="启用"
                inactive-text="停用"
                @change="value => updateActive(row, Boolean(value))"
              />
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-space>
              <el-button link type="primary" @click="openDetail(row)">详情</el-button>
              <el-button link @click="openEdit(row)">编辑</el-button>
              <el-button link type="danger" @click="removeClassroom(row)">删除</el-button>
            </el-space>
          </template>
        </el-table-column>
      </el-table>

      <template #detail>
        <div v-if="currentClassroom" class="detail-stack">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="编号">{{ currentClassroom.code }}</el-descriptions-item>
            <el-descriptions-item label="名称">{{ currentClassroom.name }}</el-descriptions-item>
            <el-descriptions-item label="校区">{{ currentClassroom.campus }}</el-descriptions-item>
            <el-descriptions-item label="楼栋">{{ currentClassroom.building }}</el-descriptions-item>
            <el-descriptions-item label="容量">{{ currentClassroom.capacity }}</el-descriptions-item>
            <el-descriptions-item label="类型">{{ getRoomTypeLabel(currentClassroom.room_type) }}</el-descriptions-item>
            <el-descriptions-item label="状态">{{ currentClassroom.is_active ? "启用" : "停用" }}</el-descriptions-item>
            <el-descriptions-item label="可用节次数">{{ currentClassroom.available_time.length }}</el-descriptions-item>
          </el-descriptions>
          <div class="slot-preview">
            <el-tag v-for="slot in currentClassroom.available_time" :key="slotKey(slot)" effect="plain">
              {{ `${getDayLabel(slot.day)} ${slot.slot}节` }}
            </el-tag>
          </div>
        </div>
      </template>
    </SchedulePageShell>

    <el-drawer v-model="formVisible" :title="formMode === 'create' ? '新增教室' : '编辑教室'" size="680px">
      <el-form ref="formRef" :model="formModel" :rules="formRules" label-width="96px" class="classroom-form">
        <el-form-item label="教室编号" prop="code">
          <el-input v-model="formModel.code" :disabled="formMode === 'edit'" maxlength="32" placeholder="例如 A101" />
        </el-form-item>
        <el-form-item label="教室名称" prop="name">
          <el-input v-model="formModel.name" maxlength="64" placeholder="例如 A座101教室" />
        </el-form-item>
        <el-form-item label="校区" prop="campus">
          <el-input v-model="formModel.campus" maxlength="32" />
        </el-form-item>
        <el-form-item label="楼栋" prop="building">
          <el-input v-model="formModel.building" maxlength="64" />
        </el-form-item>
        <el-form-item label="容量" prop="capacity">
          <el-input-number v-model="formModel.capacity" :min="1" :max="1000" :controls="false" style="width: 100%" />
        </el-form-item>
        <el-form-item label="教室类型" prop="room_type">
          <el-select v-model="formModel.room_type" style="width: 100%">
            <el-option v-for="item in roomTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="formMode === 'edit'" label="启停状态">
          <el-switch v-model="formModel.is_active" inline-prompt active-text="启用" inactive-text="停用" />
        </el-form-item>
        <el-form-item label="可用时段" class="slot-form-item">
          <div class="slot-grid">
            <div v-for="day in dayOptions" :key="day.value" class="slot-row">
              <strong>{{ day.label }}</strong>
              <el-checkbox-group v-model="selectedSlots">
                <el-checkbox-button
                  v-for="section in sectionOptions"
                  :key="`${day.value}-${section}`"
                  :label="`${day.value}-${section}`"
                >
                  {{ section }}
                </el-checkbox-button>
              </el-checkbox-group>
            </div>
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="drawer-footer">
          <el-button @click="formVisible = false">取消</el-button>
          <el-button type="primary" :loading="saving" @click="submitForm">保存</el-button>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts" name="scheduleClassrooms">
import { computed, reactive, ref, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import type { FormInstance, FormRules, UploadFile } from "element-plus";
import type { Schedule } from "@/api/interface/schedule";
import { batchImportClassrooms, createClassroom, deleteClassroom, getClassrooms, updateClassroom } from "@/api/modules/schedule";
import SchedulePageShell from "../components/SchedulePageShell.vue";
import { dayOptions, getDayLabel, getRoomTypeLabel, parseSlotKey, roomTypeOptions, sectionOptions, slotKey } from "../utils";

type ClassroomForm = Schedule.ClassroomCreate & { is_active: boolean };

const loading = ref(false);
const saving = ref(false);
const detailVisible = ref(false);
const formVisible = ref(false);
const formMode = ref<"create" | "edit">("create");
const formRef = ref<FormInstance>();
const selectedSlots = ref<string[]>([]);
const overwriteImport = ref(false);
const classrooms = ref<Schedule.Classroom[]>([]);
const currentClassroom = ref<Schedule.Classroom | null>(null);
const editingId = ref<number | null>(null);

const filters = reactive<{
  keyword: string;
  roomType: Schedule.ClassroomType | "";
  active: "active" | "inactive" | "";
}>({
  keyword: "",
  roomType: "",
  active: ""
});

const createEmptyForm = (): ClassroomForm => ({
  code: "",
  name: "",
  campus: "",
  building: "",
  capacity: 60,
  room_type: "LECTURE",
  available_time: [],
  is_active: true
});

const formModel = reactive<ClassroomForm>(createEmptyForm());

const formRules: FormRules<ClassroomForm> = {
  code: [{ required: true, message: "请输入教室编号", trigger: "blur" }],
  name: [{ required: true, message: "请输入教室名称", trigger: "blur" }],
  campus: [{ required: true, message: "请输入校区", trigger: "blur" }],
  building: [{ required: true, message: "请输入楼栋", trigger: "blur" }],
  capacity: [{ required: true, message: "请输入容量", trigger: "change" }],
  room_type: [{ required: true, message: "请选择教室类型", trigger: "change" }]
};

const filteredClassrooms = computed(() => {
  const keyword = filters.keyword.trim().toLowerCase();
  return classrooms.value.filter(item => {
    const matchKeyword =
      !keyword || [item.code, item.name, item.campus, item.building].some(value => String(value).toLowerCase().includes(keyword));
    const matchType = !filters.roomType || item.room_type === filters.roomType;
    const matchActive =
      !filters.active || (filters.active === "active" && item.is_active) || (filters.active === "inactive" && !item.is_active);
    return matchKeyword && matchType && matchActive;
  });
});

const stats = computed(() => [
  { label: "教室总数", value: classrooms.value.length, help: "排课服务已登记教室" },
  { label: "启用中", value: classrooms.value.filter(item => item.is_active).length, help: "可参与自动排课和调课" },
  { label: "容量合计", value: classrooms.value.reduce((sum, item) => sum + item.capacity, 0), help: "所有登记教室座位数" },
  {
    label: "有时段配置",
    value: classrooms.value.filter(item => item.available_time.length > 0).length,
    help: "已设置基础可用时段"
  }
]);

watch(
  selectedSlots,
  values => {
    formModel.available_time = values.map(parseSlotKey).sort((a, b) => a.day - b.day || a.slot - b.slot);
  },
  { deep: true }
);

const loadClassrooms = async () => {
  loading.value = true;
  try {
    const { data } = await getClassrooms({ limit: 1000 });
    classrooms.value = data;
  } finally {
    loading.value = false;
  }
};

const resetFilters = () => {
  filters.keyword = "";
  filters.roomType = "";
  filters.active = "";
};

const resetForm = () => {
  Object.assign(formModel, createEmptyForm());
  selectedSlots.value = [];
  editingId.value = null;
};

const openCreate = () => {
  formMode.value = "create";
  resetForm();
  formVisible.value = true;
};

const openEdit = (record: Schedule.Classroom) => {
  formMode.value = "edit";
  editingId.value = record.id;
  Object.assign(formModel, {
    code: record.code,
    name: record.name,
    campus: record.campus,
    building: record.building,
    capacity: record.capacity,
    room_type: record.room_type,
    available_time: [...record.available_time],
    is_active: record.is_active
  });
  selectedSlots.value = record.available_time.map(slotKey);
  formVisible.value = true;
};

const openDetail = (record: Schedule.Classroom) => {
  currentClassroom.value = record;
  detailVisible.value = true;
};

const updateActive = async (record: Schedule.Classroom, isActive: boolean) => {
  await updateClassroom(record.id, { is_active: isActive });
  ElMessage.success(`${record.name}已${isActive ? "启用" : "停用"}`);
  await loadClassrooms();
};

const removeClassroom = async (record: Schedule.Classroom) => {
  await ElMessageBox.confirm(`确认删除教室 ${record.name}？`, "删除教室", { type: "warning" });
  await deleteClassroom(record.id);
  ElMessage.success("教室已删除");
  await loadClassrooms();
};

const submitForm = async () => {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  saving.value = true;
  try {
    if (formMode.value === "edit" && editingId.value) {
      await updateClassroom(editingId.value, {
        name: formModel.name,
        campus: formModel.campus,
        building: formModel.building,
        capacity: formModel.capacity,
        room_type: formModel.room_type,
        available_time: formModel.available_time,
        is_active: formModel.is_active
      });
      ElMessage.success("教室已更新");
    } else {
      await createClassroom({
        code: formModel.code,
        name: formModel.name,
        campus: formModel.campus,
        building: formModel.building,
        capacity: formModel.capacity,
        room_type: formModel.room_type,
        available_time: formModel.available_time
      });
      ElMessage.success("教室已新增");
    }
    formVisible.value = false;
    await loadClassrooms();
  } finally {
    saving.value = false;
  }
};

const handleImportFile = async (uploadFile: UploadFile) => {
  if (!uploadFile.raw) return;
  const result = await batchImportClassrooms(uploadFile.raw, overwriteImport.value);
  const failed = result.data.failed.length;
  ElMessage.success(`导入成功 ${result.data.success} 条${failed ? `，失败 ${failed} 条` : ""}`);
  await loadClassrooms();
};

loadClassrooms();
</script>

<style scoped lang="scss">
.schedule-page-view,
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
.slot-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.classroom-form {
  padding-right: 12px;
}
.slot-form-item {
  display: block;
}
.slot-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.slot-row {
  display: grid;
  grid-template-columns: 52px minmax(0, 1fr);
  gap: 12px;
  align-items: center;
}
.slot-row strong {
  color: #334155;
}
.slot-row :deep(.el-checkbox-button__inner) {
  width: 34px;
  padding-right: 0;
  padding-left: 0;
}
.drawer-footer {
  display: flex;
  justify-content: flex-end;
}

@media (width <= 768px) {
  .slot-row {
    grid-template-columns: 1fr;
  }
}
</style>
