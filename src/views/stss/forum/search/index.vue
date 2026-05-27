<template>
  <div class="forum-search-page">
    <ForumPageShell
      title="检索"
      description="按关键词、课程、模块和时间范围检索论坛帖子，模拟全文检索结果展示。"
      :tags="['关键词检索', '课程筛选', '结果高亮']"
      :stats="stats"
      content-title="检索结果"
      content-description="根据当前筛选条件自动展示匹配结果，后续可替换为后端全文检索接口。"
      :data-count="searchResults.length"
      empty-description="当前筛选条件下暂无检索结果。"
    >
      <template #filters>
        <el-form :model="queryForm" class="filter-form" inline>
          <el-form-item label="关键词">
            <el-input v-model="queryForm.keyword" clearable placeholder="输入关键词，如 接口、UML、复习" style="width: 260px" />
          </el-form-item>

          <el-form-item label="课程">
            <el-select v-model="queryForm.courseId" clearable placeholder="全部课程" style="width: 170px">
              <el-option v-for="board in mockBoards" :key="board.id" :label="board.courseName" :value="board.courseId" />
            </el-select>
          </el-form-item>

          <el-form-item label="模块">
            <el-select v-model="queryForm.module" clearable placeholder="全部模块" style="width: 170px">
              <el-option label="课程讨论" value="discussion" />
              <el-option label="作业答疑" value="homework" />
              <el-option label="考试说明" value="exam" />
              <el-option label="综合交流" value="general" />
            </el-select>
          </el-form-item>

          <el-form-item label="排序">
            <el-select v-model="queryForm.sortBy" placeholder="排序方式" style="width: 170px">
              <el-option label="相关度优先" value="relevance" />
              <el-option label="发布时间优先" value="createdAt" />
              <el-option label="热度优先" value="hotScore" />
            </el-select>
          </el-form-item>

          <el-form-item label="时间范围">
            <el-date-picker
              v-model="queryForm.dateRange"
              clearable
              end-placeholder="结束日期"
              range-separator="至"
              start-placeholder="开始日期"
              type="daterange"
              value-format="YYYY-MM-DD"
            />
          </el-form-item>

          <el-form-item>
            <el-button @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>
      </template>

      <div class="result-list">
        <el-card v-for="post in searchResults" :key="post.id" class="result-card" shadow="hover">
          <div class="result-header">
            <div>
              <div class="result-title" v-html="highlightKeyword(post.title)" />
              <div class="result-meta">
                {{ post.courseName }} · {{ postModuleTextMap[post.module] }} · {{ post.authorName }} · {{ post.createdAt }}
              </div>
            </div>
            <div class="result-tags">
              <el-tag v-if="post.pinned" size="small" type="danger">置顶</el-tag>
              <el-tag v-if="post.status === 'hot'" size="small" type="warning">热门</el-tag>
              <el-tag size="small">{{ postModuleTextMap[post.module] }}</el-tag>
            </div>
          </div>

          <p class="result-content" v-html="highlightKeyword(post.content)" />

          <div class="result-footer">
            <div class="metric-list">
              <span>浏览 {{ post.viewsCount }}</span>
              <span>回复 {{ post.repliesCount }}</span>
              <span>点赞 {{ post.likesCount }}</span>
              <span>热度 {{ post.hotScore }}</span>
              <span>相关度 {{ getRelevanceScore(post) }}</span>
            </div>
            <el-button link type="primary" @click="openPreview(post)">查看摘要</el-button>
          </div>
        </el-card>
      </div>
    </ForumPageShell>

    <el-drawer v-model="drawerVisible" size="520px" title="检索结果摘要">
      <template v-if="currentPost">
        <div class="preview-title">{{ currentPost.title }}</div>
        <div class="preview-meta">
          {{ currentPost.courseName }} · {{ postModuleTextMap[currentPost.module] }} · {{ currentPost.authorName }}
        </div>

        <el-divider />

        <p class="preview-content">{{ currentPost.content }}</p>

        <div class="preview-metrics">
          <el-tag>浏览 {{ currentPost.viewsCount }}</el-tag>
          <el-tag type="success">回复 {{ currentPost.repliesCount }}</el-tag>
          <el-tag type="warning">点赞 {{ currentPost.likesCount }}</el-tag>
          <el-tag type="danger">热度 {{ currentPost.hotScore }}</el-tag>
        </div>

        <el-alert
          class="preview-alert"
          show-icon
          title="当前为本地 mock 摘要。真实接入后，可在这里展示高亮片段、命中字段和后端相关度评分。"
          type="info"
        />
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import ForumPageShell from "../components/ForumPageShell.vue";
import { mockBoards, mockPosts, postModuleTextMap, type ForumPostMock, type PostModule } from "../mock";

type SortBy = "relevance" | "createdAt" | "hotScore";
type DateRangeValue = [string, string] | null;

const queryForm = reactive({
  keyword: "",
  courseId: "" as string | null,
  module: "" as PostModule | "" | null,
  sortBy: "relevance" as SortBy,
  dateRange: null as DateRangeValue
});

const drawerVisible = ref(false);
const currentPost = ref<ForumPostMock | null>(null);

const searchResults = computed(() => {
  const keyword = queryForm.keyword.trim().toLowerCase();

  const result = mockPosts.filter(post => {
    const matchKeyword =
      !keyword ||
      post.title.toLowerCase().includes(keyword) ||
      post.content.toLowerCase().includes(keyword) ||
      post.authorName.toLowerCase().includes(keyword) ||
      post.courseName.toLowerCase().includes(keyword);

    const matchCourse = !queryForm.courseId || post.courseId === queryForm.courseId;
    const matchModule = !queryForm.module || post.module === queryForm.module;
    const matchDate = isInDateRange(post.createdAt);

    return post.status !== "deleted" && matchKeyword && matchCourse && matchModule && matchDate;
  });

  return result.sort((a, b) => {
    if (queryForm.sortBy === "createdAt") return b.createdAt.localeCompare(a.createdAt);
    if (queryForm.sortBy === "hotScore") return b.hotScore - a.hotScore;
    return getRelevanceScore(b) - getRelevanceScore(a);
  });
});

const stats = computed(() => [
  {
    label: "可检索帖子",
    value: mockPosts.filter(item => item.status !== "deleted").length,
    help: "当前 mock 数据范围"
  },
  {
    label: "命中结果",
    value: searchResults.value.length,
    help: "按当前条件筛选后"
  },
  {
    label: "热门结果",
    value: searchResults.value.filter(item => item.status === "hot").length,
    help: "命中结果中的热门帖"
  },
  {
    label: "最高热度",
    value: searchResults.value.length ? Math.max(...searchResults.value.map(item => item.hotScore)).toFixed(1) : "0.0",
    help: "结果集内最高热度分"
  }
]);

const isInDateRange = (createdAt: string) => {
  if (!queryForm.dateRange) return true;

  const date = createdAt.slice(0, 10);
  const [startDate, endDate] = queryForm.dateRange;

  return date >= startDate && date <= endDate;
};

const getRelevanceScore = (post: ForumPostMock) => {
  const keyword = queryForm.keyword.trim().toLowerCase();

  if (!keyword) return Math.round(post.hotScore);

  let score = 0;

  if (post.title.toLowerCase().includes(keyword)) score += 60;
  if (post.content.toLowerCase().includes(keyword)) score += 30;
  if (post.authorName.toLowerCase().includes(keyword)) score += 10;
  if (post.courseName.toLowerCase().includes(keyword)) score += 10;

  return Math.min(100, Math.round(score + post.hotScore * 0.2));
};

const escapeHtml = (value: string) => {
  return value.replace(/[&<>"']/g, char => {
    const map: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    };

    return map[char];
  });
};

const highlightKeyword = (value: string) => {
  const escapedValue = escapeHtml(value);
  const keyword = queryForm.keyword.trim();

  if (!keyword) return escapedValue;

  const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const keywordRegExp = new RegExp(`(${escapedKeyword})`, "gi");

  return escapedValue.replace(keywordRegExp, '<span class="highlight-keyword">$1</span>');
};

const resetQuery = () => {
  queryForm.keyword = "";
  queryForm.courseId = "";
  queryForm.module = "";
  queryForm.sortBy = "relevance";
  queryForm.dateRange = null;
};

const openPreview = (post: ForumPostMock) => {
  currentPost.value = post;
  drawerVisible.value = true;
};
</script>

<style scoped lang="scss">
.forum-search-page,
.filter-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.filter-form {
  flex-flow: row wrap;
}
.result-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.result-card {
  border-radius: 12px;
}
.result-header {
  display: flex;
  gap: 16px;
  justify-content: space-between;
}
.result-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.result-meta {
  margin-top: 8px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.result-tags {
  display: flex;
  flex-shrink: 0;
  gap: 6px;
}
.result-content {
  margin: 14px 0;
  line-height: 1.8;
  color: var(--el-text-color-regular);
}
.result-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.metric-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.preview-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.preview-meta {
  margin-top: 8px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.preview-content {
  line-height: 1.8;
  color: var(--el-text-color-regular);
}
.preview-metrics {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 16px 0;
}
.preview-alert {
  margin-top: 16px;
}
:deep(.highlight-keyword) {
  padding: 0 2px;
  color: var(--el-color-danger);
  background: var(--el-color-warning-light-8);
  border-radius: 3px;
}
</style>
