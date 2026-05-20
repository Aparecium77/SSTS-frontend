<template>
  <div class="message">
    <el-popover placement="bottom" :width="360" trigger="click">
      <template #reference>
        <el-badge :value="unreadCount" :hidden="unreadCount === 0" class="item">
          <i :class="'iconfont icon-xiaoxi'" class="toolBar-icon"></i>
        </el-badge>
      </template>
      <div class="message-header">
        <span class="message-header-title">消息中心</span>
        <el-button link type="primary" :disabled="unreadCount === 0" @click="markAllAsRead">全部已读</el-button>
      </div>
      <el-tabs v-model="activeName">
        <el-tab-pane v-for="tab in tabs" :key="tab.name" :label="`${tab.label}(${getUnreadCount(tab.items)})`" :name="tab.name">
          <div v-if="tab.items.length" class="message-list">
            <div
              v-for="item in tab.items"
              :key="item.id"
              class="message-item"
              :class="{ 'is-read': item.read }"
              @click="markAsRead(item)"
            >
              <img :src="item.icon" :alt="tab.label" class="message-icon" />
              <div class="message-content">
                <div class="message-title-row">
                  <span class="message-title">{{ item.title }}</span>
                  <span v-if="!item.read" class="message-dot"></span>
                </div>
                <span class="message-desc">{{ item.description }}</span>
                <span class="message-date">{{ item.time }}</span>
              </div>
            </div>
          </div>
          <div v-else class="message-empty">
            <img src="@/assets/images/notData.png" alt="notData" />
            <div>暂无{{ tab.label }}</div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-popover>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import msg01 from "@/assets/images/msg01.png";
import msg02 from "@/assets/images/msg02.png";
import msg03 from "@/assets/images/msg03.png";
import msg04 from "@/assets/images/msg04.png";
import msg05 from "@/assets/images/msg05.png";

type MessageTabName = "announcement" | "forum" | "todo";

interface MessageItem {
  id: string;
  title: string;
  description: string;
  time: string;
  icon: string;
  read: boolean;
}

interface MessageTab {
  name: MessageTabName;
  label: string;
  items: MessageItem[];
}

const activeName = ref<MessageTabName>("announcement");

const tabs = reactive<MessageTab[]>([
  {
    name: "announcement",
    label: "公告",
    items: [
      {
        id: "announcement-1",
        title: "2026-2027-1 学期选课通知已发布",
        description: "第一轮选课将于今晚 22:00 截止，请相关学生及时提交。",
        time: "10 分钟前",
        icon: msg01,
        read: false
      },
      {
        id: "announcement-2",
        title: "在线测试系统维护提醒",
        description: "本周六 20:00 至 22:00 将进行短时维护，期间可能无法交卷。",
        time: "1 小时前",
        icon: msg02,
        read: false
      }
    ]
  },
  {
    name: "forum",
    label: "论坛",
    items: [
      {
        id: "forum-1",
        title: "数据库课程论坛有新回复",
        description: "《数据库系统原理》讨论区新增 3 条回复，可前往查看。",
        time: "25 分钟前",
        icon: msg03,
        read: false
      },
      {
        id: "forum-2",
        title: "教务公告板新增置顶帖",
        description: "关于下学期排课安排的说明已同步到论坛公告板。",
        time: "今天 09:30",
        icon: msg04,
        read: false
      }
    ]
  },
  {
    name: "todo",
    label: "待办",
    items: [
      {
        id: "todo-1",
        title: "成绩发布流程待确认",
        description: "本学期成绩发布前，请先核对异常成绩与补考名单。",
        time: "今天",
        icon: msg05,
        read: false
      }
    ]
  }
]);

const getUnreadCount = (items: MessageItem[]) => items.filter(item => !item.read).length;

const unreadCount = computed(() => tabs.reduce((count, tab) => count + getUnreadCount(tab.items), 0));

const markAsRead = (item: MessageItem) => {
  if (item.read) return;
  item.read = true;
};

const markAllAsRead = () => {
  tabs.forEach(tab => {
    tab.items.forEach(item => {
      item.read = true;
    });
  });
};
</script>

<style scoped lang="scss">
.message-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 12px;
}
.message-header-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.message-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 260px;
  line-height: 45px;
}
.message-list {
  display: flex;
  flex-direction: column;
  .message-item {
    display: flex;
    align-items: flex-start;
    padding: 20px 0;
    cursor: pointer;
    border-bottom: 1px solid var(--el-border-color-light);
    transition: opacity 0.2s ease;
    &:last-child {
      border: none;
    }
    &.is-read {
      opacity: 0.66;
    }
    .message-icon {
      width: 40px;
      height: 40px;
      margin: 0 20px 0 5px;
      border-radius: 50%;
    }
    .message-content {
      display: flex;
      flex: 1;
      flex-direction: column;
      .message-title-row {
        display: flex;
        gap: 12px;
        align-items: center;
        justify-content: space-between;
      }
      .message-title {
        margin-bottom: 5px;
        line-height: 1.5;
        color: var(--el-text-color-primary);
      }
      .message-dot {
        flex-shrink: 0;
        width: 8px;
        height: 8px;
        background: var(--el-color-danger);
        border-radius: 50%;
      }
      .message-desc {
        margin-bottom: 6px;
        font-size: 12px;
        line-height: 1.6;
        color: var(--el-text-color-regular);
      }
      .message-date {
        font-size: 12px;
        color: var(--el-text-color-secondary);
      }
    }
  }
}
</style>
