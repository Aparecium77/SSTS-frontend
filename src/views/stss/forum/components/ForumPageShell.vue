<template>
  <div class="forum-page">
    <section class="forum-hero forum-card">
      <div class="forum-hero__content">
        <p class="forum-hero__eyebrow">论坛交流</p>
        <div class="forum-hero__heading">
          <div>
            <h2>{{ title }}</h2>
            <p>{{ description }}</p>
          </div>
          <div v-if="tags.length" class="forum-hero__tags">
            <el-tag v-for="tag in tags" :key="tag" effect="plain" round>
              {{ tag }}
            </el-tag>
          </div>
        </div>
      </div>
    </section>

    <section v-if="stats.length" class="forum-stats">
      <article v-for="item in stats" :key="item.label" class="forum-stats__item forum-card">
        <span class="forum-stats__label">{{ item.label }}</span>
        <strong class="forum-stats__value">{{ item.value }}</strong>
        <p class="forum-stats__help">{{ item.help }}</p>
      </article>
    </section>

    <section class="forum-section forum-card">
      <div class="forum-section__header">
        <div>
          <h3>筛选与操作</h3>
        </div>
        <slot name="actions" />
      </div>
      <slot name="filters" />
    </section>

    <section class="forum-section forum-card">
      <div class="forum-section__header">
        <div>
          <h3>{{ contentTitle }}</h3>
          <p>{{ contentDescription }}</p>
        </div>
      </div>
      <slot v-if="dataCount > 0" />
      <el-empty v-else :description="emptyDescription" />
    </section>

    <el-dialog v-model="popupVisible" class="forum-popup-dialog" width="560px" :close-on-click-modal="false">
      <template #header>
        <div class="popup-header">
          <span class="popup-header__eyebrow">课程公告</span>
          <strong>请注意查看</strong>
        </div>
      </template>

      <div class="popup-list">
        <article v-for="notice in popupAnnouncements" :key="notice.id" class="popup-notice">
          <div class="popup-notice__title-row">
            <span class="popup-notice__title">{{ notice.title }}</span>
            <el-tag v-if="notice.pinned" size="small" type="danger">置顶</el-tag>
          </div>
          <div class="popup-notice__meta">{{ notice.course_id || "未知课程" }} · {{ formatPopupTime(notice.created_at) }}</div>
          <p class="popup-notice__content">{{ notice.content }}</p>
        </article>
      </div>

      <template #footer>
        <el-button type="primary" @click="confirmPopupAnnouncements">我知道了</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts" name="forumPageShell">
import { computed, onMounted, ref } from "vue";
import { ForumAPI } from "@/api/modules/forum";
import type { Forum } from "@/api/interface/forum";

interface StatItem {
  label: string;
  value: string | number;
  help: string;
}

withDefaults(
  defineProps<{
    title: string;
    description: string;
    tags?: string[];
    stats?: StatItem[];
    contentTitle: string;
    contentDescription: string;
    dataCount: number;
    emptyDescription: string;
  }>(),
  {
    tags: () => [],
    stats: () => []
  }
);

const popupVisible = ref(false);
const popupAnnouncements = ref<Forum.NoticeItem[]>([]);
const currentForumUser = computed(() => ForumAPI.getCurrentForumUser());

const popupStorageKey = (noticeId: number) => `forum-popup-read-${noticeId}`;

const hasReadPopup = (noticeId: number) => {
  if (typeof window === "undefined") return true;
  return window.sessionStorage.getItem(popupStorageKey(noticeId)) === "1";
};

const markPopupRead = (noticeId: number) => {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(popupStorageKey(noticeId), "1");
};

const sortNotices = (items: Forum.NoticeItem[]) => {
  return [...items].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
  });
};

const loadPopupAnnouncements = async () => {
  if (currentForumUser.value.backend_role !== "student") return;

  try {
    const courseIds = await ForumAPI.CourseSelectClient.getAccessibleCourseIds();
    if (courseIds.length === 0) return;

    const results = await Promise.allSettled(
      courseIds.map(courseId =>
        ForumAPI.getAnnouncementList({
          page: 1,
          page_size: 50,
          course_id: courseId,
          status: "published",
          sort_by: "created_at",
          sort_order: "desc"
        })
      )
    );

    const notices = results
      .flatMap(result => (result.status === "fulfilled" ? (result.value.data?.items ?? []) : []))
      .filter(notice => notice.status === "published" && notice.popup && !hasReadPopup(notice.id));

    popupAnnouncements.value = sortNotices(notices);
    popupVisible.value = popupAnnouncements.value.length > 0;
  } catch (error) {
    console.warn("加载课程弹窗公告失败：", error);
  }
};

const confirmPopupAnnouncements = () => {
  popupAnnouncements.value.forEach(notice => markPopupRead(notice.id));
  popupVisible.value = false;
};

const formatPopupTime = (time?: string | null) => {
  if (!time) return "未知时间";
  return time.replace("T", " ").slice(0, 16);
};

onMounted(() => {
  loadPopupAnnouncements();
});
</script>

<style scoped lang="scss">
.forum-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.forum-card {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: 12px;
  box-shadow: var(--el-box-shadow-light);
}
.forum-hero {
  padding: 28px 32px;
  overflow: hidden;
  background:
    radial-gradient(circle at top right, rgb(15 118 110 / 16%), transparent 28%),
    linear-gradient(135deg, #f4fbf8 0%, #eef5ff 100%);
  border: 1px solid rgb(15 118 110 / 12%);
}
.forum-hero__eyebrow {
  margin: 0 0 12px;
  font-size: 12px;
  font-weight: 700;
  color: #0f766e;
  letter-spacing: 0.12em;
}
.forum-hero__heading {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  justify-content: space-between;
}
.forum-hero h2 {
  margin: 0 0 10px;
  font-size: 28px;
  color: #1f2937;
}
.forum-hero p {
  margin: 0;
  line-height: 1.7;
  color: #526072;
}
.forum-hero__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
  min-width: 200px;
}
.forum-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}
.forum-stats__item {
  padding: 20px 22px;
}
.forum-stats__label {
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  color: #6b7280;
}
.forum-stats__value {
  display: block;
  margin-bottom: 6px;
  font-size: 26px;
  color: #111827;
}
.forum-stats__help {
  margin: 0;
  font-size: 13px;
  color: #64748b;
}
.forum-section {
  padding: 22px 24px;
}
.forum-section__header {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 18px;
}
.forum-section__header h3 {
  margin: 0 0 8px;
  font-size: 18px;
  color: #1f2937;
}
.forum-section__header p {
  margin: 0;
  color: #64748b;
}
.popup-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.popup-header__eyebrow {
  font-size: 12px;
  font-weight: 700;
  color: var(--el-color-primary);
  letter-spacing: 0.12em;
}
.popup-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 52vh;
  overflow: auto;
}
.popup-notice {
  padding: 14px 16px;
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-light);
  border-radius: 12px;
}
.popup-notice__title-row {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
}
.popup-notice__title {
  min-width: 0;
  overflow: hidden;
  font-size: 16px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}
.popup-notice__meta {
  margin-top: 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.popup-notice__content {
  margin: 10px 0 0;
  line-height: 1.7;
  color: var(--el-text-color-regular);
  white-space: pre-wrap;
}

@media (width <= 1100px) {
  .forum-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (width <= 768px) {
  .forum-hero,
  .forum-section {
    padding: 20px;
  }
  .forum-hero__heading,
  .forum-section__header {
    flex-direction: column;
  }
  .forum-hero__tags {
    justify-content: flex-start;
    min-width: auto;
  }
  .forum-stats {
    grid-template-columns: 1fr;
  }
}
</style>
