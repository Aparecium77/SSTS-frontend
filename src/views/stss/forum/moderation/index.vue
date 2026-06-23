<template>
  <div class="forum-moderation-page">
    <ForumPageShell
      v-if="canView"
      title="内容审核"
      description="管理员处理学生或教师举报的帖子、回复，并查看后端提供的论坛热度与活跃度统计。"
      :tags="['举报处理', '帖子审核', '回复审核', '热门统计', '活跃度统计']"
      :stats="stats"
      content-title="内容审核与统计"
      content-description="审核记录与统计数据均来自后端接口；统计口径以后端返回为准。"
      :data-count="1"
      empty-description="当前暂无审核记录。"
    >
      <template #actions>
        <el-space>
          <el-button :loading="loading.list || loading.stats" @click="reloadAll">刷新</el-button>
        </el-space>
      </template>

      <template #filters>
        <div class="moderation-toolbar">
          <el-alert
            :closable="false"
            show-icon
            title="内容审核页仅管理员可见；学生和教师即使从菜单进入，也不能查看举报记录。"
            type="info"
          />

          <el-form :model="queryForm" class="filter-form" inline>
            <el-form-item label="关键词">
              <el-input
                v-model="queryForm.keyword"
                clearable
                placeholder="搜索标题、正文、举报原因"
                style="width: 260px"
                @keyup.enter="handleFilter"
              />
            </el-form-item>

            <el-form-item label="课程">
              <el-input
                v-model="queryForm.course_name"
                clearable
                placeholder="输入课程名称"
                style="width: 180px"
                @keyup.enter="handleFilter"
              />
            </el-form-item>

            <el-form-item label="对象">
              <el-select v-model="queryForm.target_type" clearable placeholder="全部对象" style="width: 150px">
                <el-option label="帖子" value="post" />
                <el-option label="回复" value="reply" />
              </el-select>
            </el-form-item>

            <el-form-item label="状态">
              <el-select v-model="queryForm.status" clearable placeholder="全部状态" style="width: 150px">
                <el-option label="待处理" value="pending" />
                <el-option label="已驳回" value="approved" />
                <el-option label="已隐藏" value="hidden" />
                <el-option label="已删除" value="deleted" />
              </el-select>
            </el-form-item>

            <el-form-item>
              <el-space>
                <el-button type="primary" :loading="loading.list" @click="handleFilter">筛选</el-button>
                <el-button @click="resetQuery">重置</el-button>
              </el-space>
            </el-form-item>
          </el-form>

          <el-alert v-if="apiMessage" :closable="false" show-icon :title="apiMessage" :type="apiMessageType" />
        </div>
      </template>

      <section class="admin-stat-section">
        <div class="section-title-row">
          <div>
            <div class="section-title">论坛数据统计</div>
            <div class="section-subtitle">
              本区只展示后端统计接口返回的数据。热门帖来自 hot_posts，活跃度来自 forum activity，具体统计口径以后端为准。
            </div>
          </div>
          <el-tag effect="plain">{{ currentForumUser.name }} / {{ currentForumUser.backend_role }}</el-tag>
        </div>

        <div v-loading="loading.stats" class="insight-grid">
          <el-card class="insight-card" shadow="never">
            <template #header>
              <div class="card-header">
                <span>本周热门帖子</span>
                <el-tag size="small" type="warning" effect="plain">week</el-tag>
              </div>
            </template>

            <el-empty v-if="weeklyHotPosts.length === 0" description="暂无本周热门数据" />

            <div v-else class="hot-list">
              <div v-for="(post, index) in weeklyHotPosts" :key="post.id" class="hot-item">
                <div class="rank-badge">{{ index + 1 }}</div>
                <div class="hot-main">
                  <div class="hot-title">{{ post.title }}</div>
                  <div class="hot-meta">
                    课程 {{ post.course_id || "未知" }} · 回复 {{ post.replies_count }} · 点赞 {{ post.likes_count }} · 热度
                    {{ formatScore(post.hot_score) }}
                  </div>
                </div>
              </div>
            </div>
          </el-card>

          <el-card class="insight-card" shadow="never">
            <template #header>
              <div class="card-header">
                <span>本月热门帖子</span>
                <el-tag size="small" type="danger" effect="plain">month</el-tag>
              </div>
            </template>

            <el-empty v-if="monthlyHotPosts.length === 0" description="暂无本月热门数据" />

            <div v-else class="hot-list">
              <div v-for="(post, index) in monthlyHotPosts" :key="post.id" class="hot-item">
                <div class="rank-badge">{{ index + 1 }}</div>
                <div class="hot-main">
                  <div class="hot-title">{{ post.title }}</div>
                  <div class="hot-meta">
                    课程 {{ post.course_id || "未知" }} · 回复 {{ post.replies_count }} · 点赞 {{ post.likes_count }} · 热度
                    {{ formatScore(post.hot_score) }}
                  </div>
                </div>
              </div>
            </div>
          </el-card>

          <el-card class="activity-card" shadow="never">
            <template #header>
              <div class="card-header">
                <span>发文与活跃度统计</span>
                <el-radio-group v-model="activeActivityPeriod" size="small">
                  <el-radio-button label="week">本周</el-radio-button>
                  <el-radio-button label="month">本月</el-radio-button>
                </el-radio-group>
              </div>
            </template>

            <el-empty v-if="activeActivityList.length === 0" description="暂无活跃度统计数据" />

            <el-table v-else :data="activeActivityList" size="small" border>
              <el-table-column label="用户" prop="user_id" width="90">
                <template #default="{ row }">用户 #{{ row.user_id }}</template>
              </el-table-column>
              <el-table-column label="课程" prop="course_id" min-width="120" />
              <el-table-column label="发文" prop="post_count" width="80" />
              <el-table-column label="回帖" prop="reply_count" width="80" />
              <el-table-column label="浏览" prop="view_count" width="80" />
              <el-table-column label="点赞" prop="like_count" width="80" />
              <el-table-column label="活跃度" prop="activity_score" width="100">
                <template #default="{ row }">{{ formatScore(row.activity_score) }}</template>
              </el-table-column>
              <el-table-column label="统计周期" min-width="180">
                <template #default="{ row }">
                  {{ formatDateOnly(row.period_start) }} ~ {{ formatDateOnly(row.period_end) }}
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </div>
      </section>

      <el-card class="queue-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span>审核队列</span>
            <el-tag size="small" effect="plain">{{ moderationItems.length }} 条</el-tag>
          </div>
        </template>

        <el-table v-loading="loading.list" :data="moderationItems" border>
          <el-table-column label="举报内容" min-width="360">
            <template #default="{ row }">
              <div class="target-title-row">
                <el-tag :type="row.target_type === 'post' ? 'primary' : 'success'" size="small">
                  {{ targetTypeTextMap[row.target_type] }}
                </el-tag>
                <span class="target-title">{{ row.title }}</span>
              </div>

              <div class="content-preview">{{ row.content }}</div>

              <div class="meta-line">
                作者 {{ row.author_name || "未知用户" }} · 举报人 {{ row.reporter_name || "匿名" }} ·
                {{ formatTime(row.created_at) }}
              </div>
            </template>
          </el-table-column>

          <el-table-column label="课程" min-width="150">
            <template #default="{ row }">
              {{ row.course_name || "未知课程" }}
            </template>
          </el-table-column>

          <el-table-column label="举报原因" min-width="220">
            <template #default="{ row }">
              <span class="reason-text">{{ row.reason || "未填写原因" }}</span>
            </template>
          </el-table-column>

          <el-table-column label="状态" width="110" align="center">
            <template #default="{ row }">
              <el-tag :type="statusTagMap[row.status]">
                {{ statusTextMap[row.status] }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column label="处理信息" min-width="160">
            <template #default="{ row }">
              <template v-if="row.handled_at">
                <div>{{ row.handler_name || "管理员" }}</div>
                <div class="meta-line">{{ formatTime(row.handled_at) }}</div>
              </template>
              <span v-else class="empty-text">尚未处理</span>
            </template>
          </el-table-column>

          <el-table-column label="操作" width="290" fixed="right">
            <template #default="{ row }">
              <el-space wrap>
                <el-button link type="primary" @click="openDetailDrawer(row)">详情</el-button>

                <template v-if="row.status === 'pending'">
                  <el-button v-if="canApprove" link type="primary" @click="openHandleDialog(row, 'approved')"> 驳回 </el-button>
                  <el-button v-if="canApprove" link type="warning" @click="openHandleDialog(row, 'hidden')"> 隐藏 </el-button>
                  <el-button v-if="canReject" link type="danger" @click="openHandleDialog(row, 'deleted')"> 删除 </el-button>
                </template>

                <span v-else class="handled-text">已处理</span>
              </el-space>
            </template>
          </el-table-column>
        </el-table>

        <el-empty v-if="!loading.list && moderationItems.length === 0" description="当前暂无审核记录。" />

        <div v-if="pagination.total > pagination.pageSize" class="pagination-row">
          <el-pagination
            background
            layout="prev, pager, next, total"
            :current-page="pagination.page"
            :page-size="pagination.pageSize"
            :total="pagination.total"
            @current-change="handlePageChange"
          />
        </div>
      </el-card>
    </ForumPageShell>

    <ForumPageShell
      v-else
      title="内容审核"
      description="当前账号无内容审核权限。"
      :tags="['权限控制']"
      :stats="permissionStats"
      content-title="无权限访问"
      content-description="内容审核仅管理员可查看。"
      :data-count="0"
      empty-description="无内容审核权限。"
    >
      <el-result icon="warning" title="无权限访问" sub-title="内容审核仅管理员可查看，学生和教师不能查看举报记录。" />
    </ForumPageShell>

    <el-drawer v-model="detailDrawerVisible" size="620px" title="审核详情">
      <template v-if="currentItem">
        <div class="drawer-title-row">
          <div>
            <div class="drawer-title">{{ currentItem.title }}</div>
            <div class="drawer-meta">
              {{ targetTypeTextMap[currentItem.target_type] }} #{{ currentItem.target_id }} ·
              {{ currentItem.course_name || "未知课程" }} ·
              {{ formatTime(currentItem.created_at) }}
            </div>
          </div>
          <el-tag :type="statusTagMap[currentItem.status]">
            {{ statusTextMap[currentItem.status] }}
          </el-tag>
        </div>

        <el-divider />

        <el-descriptions :column="1" border>
          <el-descriptions-item label="内容作者">
            {{ currentItem.author_name || "未知用户" }}
          </el-descriptions-item>
          <el-descriptions-item label="举报人">
            {{ currentItem.reporter_name || "匿名" }}
          </el-descriptions-item>
          <el-descriptions-item label="举报原因">
            {{ currentItem.reason || "未填写原因" }}
          </el-descriptions-item>
          <el-descriptions-item label="处理人">
            {{ currentItem.handler_name || "尚未处理" }}
          </el-descriptions-item>
          <el-descriptions-item label="处理时间">
            {{ currentItem.handled_at ? formatTime(currentItem.handled_at) : "尚未处理" }}
          </el-descriptions-item>
        </el-descriptions>

        <el-card class="content-card" shadow="never">
          <template #header>
            <span>原始内容</span>
          </template>
          <div class="drawer-content">{{ currentItem.content }}</div>
        </el-card>

        <el-card v-if="currentItem.status === 'pending' && (canApprove || canReject)" class="action-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span>审核操作</span>
              <el-tag size="small" effect="plain">管理员权限</el-tag>
            </div>
          </template>

          <el-space wrap>
            <el-button v-if="canApprove" type="primary" @click="openHandleDialog(currentItem, 'approved')"> 驳回 </el-button>
            <el-button v-if="canApprove" type="warning" @click="openHandleDialog(currentItem, 'hidden')"> 隐藏 </el-button>
            <el-button v-if="canReject" type="danger" @click="openHandleDialog(currentItem, 'deleted')"> 删除 </el-button>
          </el-space>
        </el-card>
      </template>
    </el-drawer>

    <el-dialog v-model="handleDialogVisible" :title="handleDialogTitle" width="520px">
      <template v-if="handlingItem">
        <el-alert :closable="false" show-icon :title="handleConfirmTitle" type="warning" />

        <el-form class="handle-form" :model="handleForm" label-width="80px">
          <el-form-item label="处理说明">
            <el-input
              v-model="handleForm.reason"
              :rows="5"
              maxlength="300"
              placeholder="可填写处理说明；为空时将使用默认说明"
              show-word-limit
              type="textarea"
            />
          </el-form-item>
        </el-form>
      </template>

      <template #footer>
        <el-button @click="handleDialogVisible = false">取消</el-button>
        <el-button :type="handleButtonType" :loading="submitting" @click="submitHandle">确认处理</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import ForumPageShell from "../components/ForumPageShell.vue";
import { ForumAPI } from "@/api/modules/forum";
import type { Forum } from "@/api/interface/forum";

type ApiMessageType = "success" | "warning" | "error" | "info";

type PeriodType = "week" | "month";

type ModerationRow = Forum.ModerationItem;

interface QueryForm {
  keyword: string;
  course_name: string;
  target_type: Forum.ModerationTargetType | "";
  status: Forum.ModerationStatus | "";
}

const currentForumUser = computed(() => ForumAPI.getCurrentForumUser());

const targetTypeTextMap: Record<Forum.ModerationTargetType, string> = {
  post: "帖子",
  reply: "回复"
};

const statusTextMap: Record<Forum.ModerationStatus, string> = {
  pending: "待审",
  approved: "驳回",
  hidden: "隐藏",
  deleted: "删除"
};

const statusTagMap: Record<Forum.ModerationStatus, "success" | "info" | "warning" | "danger"> = {
  pending: "warning",
  approved: "success",
  hidden: "info",
  deleted: "danger"
};

const loading = reactive({
  list: false,
  stats: false
});

const submitting = ref(false);
const apiMessage = ref("");
const apiMessageType = ref<ApiMessageType>("info");
const moderationItems = ref<ModerationRow[]>([]);
const currentItem = ref<ModerationRow | null>(null);
const handlingItem = ref<ModerationRow | null>(null);
const detailDrawerVisible = ref(false);
const handleDialogVisible = ref(false);
const weeklyHotPosts = ref<Forum.HotPostItem[]>([]);
const monthlyHotPosts = ref<Forum.HotPostItem[]>([]);
const weeklyActivity = ref<Forum.ForumActivityItem[]>([]);
const monthlyActivity = ref<Forum.ForumActivityItem[]>([]);
const activeActivityPeriod = ref<PeriodType>("week");

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
});

const queryForm = reactive<QueryForm>({
  keyword: "",
  course_name: "",
  target_type: "",
  status: "pending"
});

const handleForm = reactive<Forum.ModerationHandleForm>({
  status: "approved",
  reason: ""
});

const isAdmin = computed(() => currentForumUser.value.backend_role === "admin");
const canView = computed(() => isAdmin.value);
const canApprove = computed(() => isAdmin.value);
const canReject = computed(() => isAdmin.value);

const activeActivityList = computed(() => (activeActivityPeriod.value === "week" ? weeklyActivity.value : monthlyActivity.value));

const totalWeeklyPosts = computed(() => weeklyActivity.value.reduce((sum, item) => sum + Number(item.post_count || 0), 0));
const totalWeeklyReplies = computed(() => weeklyActivity.value.reduce((sum, item) => sum + Number(item.reply_count || 0), 0));
const totalMonthlyPosts = computed(() => monthlyActivity.value.reduce((sum, item) => sum + Number(item.post_count || 0), 0));
const totalMonthlyReplies = computed(() => monthlyActivity.value.reduce((sum, item) => sum + Number(item.reply_count || 0), 0));

const stats = computed(() => [
  {
    label: "待处理",
    value: moderationItems.value.filter(item => item.status === "pending").length,
    help: "等待管理员处理的举报记录"
  },
  {
    label: "本周发文",
    value: totalWeeklyPosts.value,
    help: "后端活跃度统计返回值"
  },
  {
    label: "本周回帖",
    value: totalWeeklyReplies.value,
    help: "后端活跃度统计返回值"
  },
  {
    label: "本月发文",
    value: totalMonthlyPosts.value,
    help: `本月回帖 ${totalMonthlyReplies.value} 条`
  }
]);

const permissionStats = computed(() => [
  {
    label: "审核权限",
    value: "无",
    help: "内容审核仅管理员可查看"
  }
]);

const handleDialogTitle = computed(() => {
  return `处理举报：${statusTextMap[handleForm.status]}`;
});

const handleConfirmTitle = computed(() => {
  if (!handlingItem.value) return "";
  const target = `${targetTypeTextMap[handlingItem.value.target_type]}「${handlingItem.value.title}」`;
  if (handleForm.status === "approved") return `即将驳回举报，保留 ${target} 的原展示状态`;
  if (handleForm.status === "hidden") return `即将通过举报，并隐藏 ${target}`;
  return `即将通过举报，并删除 ${target}`;
});

const handleButtonType = computed<"primary" | "warning" | "danger">(() => {
  if (handleForm.status === "approved") return "primary";
  if (handleForm.status === "hidden") return "warning";
  return "danger";
});

const setApiMessage = (message: string, type: ApiMessageType = "info") => {
  apiMessage.value = message;
  apiMessageType.value = type;
};

const normalizeApiModeration = (item: Forum.ModerationItem & Record<string, any>): ModerationRow => ({
  id: item.id,
  target_type: item.target_type || item.targetType,
  target_id: item.target_id ?? item.targetId,
  title: item.title || "未命名内容",
  content: item.content || "",
  course_name: item.course_name || item.courseName || "未知课程",
  author_name: item.author_name || item.authorName || "未知用户",
  reporter_name: item.reporter_name || item.reporterName || "匿名",
  reason: item.reason || "",
  status: item.status || "pending",
  created_at: item.created_at || item.createdAt || "",
  handled_at: item.handled_at || item.handledAt || null,
  handler_name: item.handler_name || item.handlerName || null
});

const extractHotPosts = (data: any): Forum.HotPostItem[] => {
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data?.items)) return data.data.items;
  if (Array.isArray(data)) return data;
  return [];
};

const extractActivityItems = (data: any): Forum.ForumActivityItem[] => {
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data)) return data;
  return [];
};

const loadModerationList = async () => {
  if (!canView.value) {
    moderationItems.value = [];
    pagination.total = 0;
    return;
  }

  loading.list = true;

  try {
    const res = await ForumAPI.getModerationList({
      page: pagination.page,
      page_size: pagination.pageSize,
      keyword: queryForm.keyword.trim() || undefined,
      course_name: queryForm.course_name.trim() || undefined,
      target_type: queryForm.target_type || undefined,
      status: queryForm.status || undefined
    });

    moderationItems.value = (res.data?.items ?? []).map(item =>
      normalizeApiModeration(item as Forum.ModerationItem & Record<string, any>)
    );
    pagination.total = res.data?.pagination?.total ?? moderationItems.value.length;
    setApiMessage("已连接内容审核接口。", "success");
  } catch (error) {
    console.error("加载审核列表失败：", error);
    moderationItems.value = [];
    pagination.total = 0;
    setApiMessage("内容审核接口暂不可用。", "warning");
  } finally {
    loading.list = false;
  }
};

const loadAdminStats = async () => {
  if (!canView.value) {
    weeklyHotPosts.value = [];
    monthlyHotPosts.value = [];
    weeklyActivity.value = [];
    monthlyActivity.value = [];
    return;
  }

  loading.stats = true;

  const results = await Promise.allSettled([
    ForumAPI.getHotPosts({ period: "week", limit: 5 }),
    ForumAPI.getHotPosts({ period: "month", limit: 5 }),
    ForumAPI.getForumActivity({ period: "week" }),
    ForumAPI.getForumActivity({ period: "month" })
  ]);

  const [weeklyHotRes, monthlyHotRes, weeklyActivityRes, monthlyActivityRes] = results;

  weeklyHotPosts.value = weeklyHotRes.status === "fulfilled" ? extractHotPosts(weeklyHotRes.value.data) : [];
  monthlyHotPosts.value = monthlyHotRes.status === "fulfilled" ? extractHotPosts(monthlyHotRes.value.data) : [];
  weeklyActivity.value = weeklyActivityRes.status === "fulfilled" ? extractActivityItems(weeklyActivityRes.value.data) : [];
  monthlyActivity.value = monthlyActivityRes.status === "fulfilled" ? extractActivityItems(monthlyActivityRes.value.data) : [];

  const failedCount = results.filter(result => result.status === "rejected").length;

  if (failedCount === 0) {
    setApiMessage("已连接审核与统计接口。", "success");
  } else if (failedCount < results.length) {
    setApiMessage("部分统计接口暂不可用，已展示可用统计数据；审核功能不受影响。", "warning");
  } else {
    setApiMessage("统计接口暂不可用，审核功能不受影响。", "warning");
  }

  loading.stats = false;
};

const reloadAll = async () => {
  await Promise.all([loadModerationList(), loadAdminStats()]);
};

const handleFilter = async () => {
  pagination.page = 1;
  await loadModerationList();
};

const resetQuery = async () => {
  queryForm.keyword = "";
  queryForm.course_name = "";
  queryForm.target_type = "";
  queryForm.status = "pending";
  pagination.page = 1;
  await loadModerationList();
};

const handlePageChange = async (page: number) => {
  pagination.page = page;
  await loadModerationList();
};

const openDetailDrawer = (item: ModerationRow) => {
  currentItem.value = item;
  detailDrawerVisible.value = true;
};

const openHandleDialog = (item: ModerationRow, status: Forum.ModerationStatus) => {
  handlingItem.value = item;
  handleForm.status = status;
  handleForm.reason = getDefaultReason(status);
  handleDialogVisible.value = true;
};

const rejectReportWithoutChangingTargetVisibility = async (moderationId: number, payload: Forum.ModerationHandleForm) => {
  // 当前后端的 approved 会切换目标帖子/回复的可见状态。
  // “驳回举报”在业务上应保留原内容，所以这里连续调用两次 approved，抵消后端的可见性切换副作用。
  await ForumAPI.handleModeration(moderationId, payload);
  return ForumAPI.handleModeration(moderationId, payload);
};

const submitHandle = async () => {
  if (!handlingItem.value || !canView.value) return;

  submitting.value = true;

  try {
    const payload = {
      status: handleForm.status,
      reason: handleForm.reason?.trim() || getDefaultReason(handleForm.status)
    };

    const res =
      handleForm.status === "approved"
        ? await rejectReportWithoutChangingTargetVisibility(handlingItem.value.id, payload)
        : await ForumAPI.handleModeration(handlingItem.value.id, payload);

    const updated = normalizeApiModeration(res.data as Forum.ModerationItem & Record<string, any>);
    updateLocalModeration(updated.id, updated);

    ElMessage.success("审核处理完成");
    handleDialogVisible.value = false;
    await reloadAll();
  } catch (error) {
    console.error("审核处理失败：", error);
    ElMessage.error("处理失败，请检查审核接口或管理员权限");
  } finally {
    submitting.value = false;
  }
};

const updateLocalModeration = (id: number, patch: Partial<ModerationRow>) => {
  moderationItems.value = moderationItems.value.map(item => (item.id === id ? { ...item, ...patch } : item));

  if (currentItem.value?.id === id) {
    currentItem.value = { ...currentItem.value, ...patch };
  }

  if (handlingItem.value?.id === id) {
    handlingItem.value = { ...handlingItem.value, ...patch };
  }
};

const getDefaultReason = (status: Forum.ModerationStatus) => {
  if (status === "approved") return "举报内容依据不足，驳回举报，原内容保留。";
  if (status === "hidden") return "举报成立，内容不适合继续公开展示，已隐藏处理。";
  if (status === "deleted") return "举报成立，内容违反论坛规范，已删除处理。";
  return "";
};

const formatScore = (value?: number) => {
  return Number(value || 0).toFixed(1);
};

const formatDateOnly = (time?: string | null) => {
  if (!time) return "未知";
  return time.replace("T", " ").slice(0, 10);
};

const formatTime = (time?: string | null) => {
  if (!time) return "未知时间";
  return time.replace("T", " ").slice(0, 16);
};

onMounted(() => {
  reloadAll();
});
</script>

<style scoped lang="scss">
.forum-moderation-page,
.moderation-toolbar {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.filter-form {
  display: flex;
  flex-flow: row wrap;
}
.admin-stat-section {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 18px;
}
.section-title-row {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  justify-content: space-between;
}
.section-title {
  font-size: 17px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}
.section-subtitle {
  margin-top: 6px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.insight-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}
.insight-card,
.activity-card,
.queue-card {
  border-radius: 12px;
}
.activity-card {
  grid-column: 1 / -1;
}
.queue-card {
  margin-top: 18px;
}
.card-header {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
}
.hot-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.hot-item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 10px 12px;
  background: var(--el-fill-color-lighter);
  border-radius: 10px;
}
.rank-badge {
  display: inline-flex;
  flex: 0 0 28px;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  font-weight: 700;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  border-radius: 999px;
}
.hot-main {
  min-width: 0;
}
.hot-title {
  overflow: hidden;
  font-weight: 700;
  color: var(--el-text-color-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}
.hot-meta {
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.target-title-row {
  display: flex;
  gap: 8px;
  align-items: center;
}
.target-title {
  overflow: hidden;
  font-weight: 700;
  color: var(--el-text-color-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}
.content-preview {
  display: -webkit-box;
  margin-top: 8px;
  overflow: hidden;
  line-height: 1.6;
  color: var(--el-text-color-regular);
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.meta-line {
  margin-top: 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.reason-text {
  display: -webkit-box;
  overflow: hidden;
  line-height: 1.5;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.empty-text,
.handled-text {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.pagination-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
.drawer-title-row {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  justify-content: space-between;
}
.drawer-title {
  font-size: 19px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}
.drawer-meta {
  margin-top: 8px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.content-card,
.action-card {
  margin-top: 16px;
  border-radius: 12px;
}
.drawer-content {
  line-height: 1.8;
  white-space: pre-wrap;
}
.handle-form {
  margin-top: 16px;
}

@media (width <= 1000px) {
  .insight-grid {
    grid-template-columns: 1fr;
  }
}
</style>
