<template>
  <CsPage title="AI 选课助手" desc="输入目标与学期，AI 推荐课程并解释；可一键采纳（逐门走规则引擎判定，不绕过校验）。">
    <el-tabs v-model="activeTab">
      <!-- ============ 原有：一次性推荐 ============ -->
      <el-tab-pane label="一次性推荐" name="once">
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
          <el-alert
            type="info"
            :closable="false"
            show-icon
            title="AI 仅产出建议与解释，不直接选课；采纳后由确定性规则引擎裁定。"
          />
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
      </el-tab-pane>

      <!-- ============ 新增：对话模式 ============ -->
      <el-tab-pane label="对话模式" name="chat">
        <el-card shadow="never" class="mb-3">
          <el-button :icon="ChatLineSquare" :disabled="!!conversationId" @click="newConversation">新建会话</el-button>
          <span v-if="conversationId" class="ml-2 text-sm" style="color: var(--el-text-color-secondary)">
            会话：{{ conversationId }}
          </span>
        </el-card>

        <el-card v-if="!conversationId" shadow="never">
          <el-empty description="请点击「新建会话」开始对话" />
        </el-card>

        <template v-else>
          <el-card shadow="never" class="mb-3">
            <div ref="chatRef" class="chat-messages">
              <div v-for="(msg, i) in messages" :key="i" :class="['msg', msg.role]">
                <div class="msg-avatar">{{ msg.role === "user" ? "U" : "AI" }}</div>
                <div class="msg-bubble">
                  <div class="msg-content">{{ msg.content }}</div>
                  <div v-if="msg.loading" class="msg-cursor">|</div>
                </div>
              </div>
            </div>

            <div class="chat-input">
              <el-input v-model="inputText" :disabled="streaming" placeholder="输入你的问题..." @keyup.enter="sendMessage" />
              <el-button type="primary" :loading="streaming" :disabled="!inputText.trim()" @click="sendMessage"> 发送 </el-button>
            </div>
          </el-card>

          <el-card v-if="chatOfferings.length" shadow="never" header="AI 推荐课程" class="mb-3">
            <el-row :gutter="12">
              <el-col v-for="o in chatOfferings" :key="o.offering_id" :span="8">
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
            <el-button type="success" :loading="chatAcceptLoading" @click="onAcceptChat">一键采纳全部</el-button>
          </el-card>

          <el-card v-if="chatAcceptResults.length" shadow="never" header="采纳结果" class="mt-3">
            <el-table :data="chatAcceptResults" border>
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
        </template>
      </el-tab-pane>
    </el-tabs>
  </CsPage>
</template>

<script setup lang="ts" name="aiAdvisor">
import { nextTick, reactive, ref } from "vue";
import { ChatLineSquare, MagicStick } from "@element-plus/icons-vue";
import CsPage from "../components/CsPage.vue";
import { CourseSelection } from "@/api/interface/courseSelection";
import { acceptRecommendationApi, newAiConversationApi, recommendApi, sendAiMessageApi } from "@/api/modules/courseSelection";

// ============ 原有：一次性推荐 ============
// const USE_MOCK = true;
const USE_MOCK = false;

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

// ============ 新增：对话模式 ============
const activeTab = ref("once");
const conversationId = ref("");
const inputText = ref("");
const messages = ref<CourseSelection.ChatMessage[]>([]);
const streaming = ref(false);
const chatRef = ref<HTMLElement | null>(null);
const chatOfferings = ref<CourseSelection.RecommendedOffering[]>([]);
const chatAcceptLoading = ref(false);
const chatAcceptResults = ref<CourseSelection.AcceptResultItem[]>([]);

const mockChatOfferings: CourseSelection.RecommendedOffering[] = [
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
];

async function newConversation() {
  if (USE_MOCK) {
    conversationId.value = "conv-mock-" + Date.now();
    messages.value = [];
    chatOfferings.value = [];
    chatAcceptResults.value = [];
    return;
  }
  const { data } = await newAiConversationApi();
  conversationId.value = data.conversation_id;
  messages.value = [];
  chatOfferings.value = [];
  chatAcceptResults.value = [];
}

async function sendMessage() {
  const text = inputText.value.trim();
  if (!text) return;
  inputText.value = "";

  messages.value.push({ role: "user", content: text });

  const aiMsg: CourseSelection.ChatMessage = { role: "assistant", content: "", loading: true };
  messages.value.push(aiMsg);
  scrollToBottom();

  if (USE_MOCK) {
    chatMockStream(aiMsg);
    return;
  }

  streaming.value = true;
  try {
    let fullContent = "";
    await sendAiMessageApi(
      conversationId.value,
      { content: text },
      {
        onDelta: text => {
          fullContent += text;
          aiMsg.content = fullContent;
        },
        onToolCall: () => undefined,
        onDone: (_msgId, offerings) => {
          aiMsg.loading = false;
          aiMsg.offerings = offerings;
          // 将 offerings 转为推荐课程卡片
          resolveChatOfferings(offerings);
        }
      }
    );
  } finally {
    streaming.value = false;
    aiMsg.loading = false;
    scrollToBottom();
  }
}

function chatMockStream(aiMsg: CourseSelection.ChatMessage) {
  streaming.value = true;
  const mockText = "根据你的培养方案，推荐以下课程：\n机器学习（符合专业选修，无时间冲突）\n操作系统（前置课未修，暂不可选）";
  let idx = 0;

  const timer = setInterval(() => {
    if (idx < mockText.length) {
      aiMsg.content += mockText[idx];
      idx++;
      scrollToBottom();
    } else {
      clearInterval(timer);
      aiMsg.loading = false;
      streaming.value = false;
      const ids = mockChatOfferings.map(o => o.offering_id);
      aiMsg.offerings = ids;
      chatOfferings.value = mockChatOfferings;
      scrollToBottom();
    }
  }, 30);
}

function resolveChatOfferings(offeringIds: string[]) {
  // Mock：从 mockChatOfferings 中匹配 ID
  chatOfferings.value = mockChatOfferings.filter(o => offeringIds.includes(o.offering_id));
  scrollToBottom();
}

async function onAcceptChat() {
  if (!chatOfferings.value.length) return;
  chatAcceptLoading.value = true;
  chatAcceptResults.value = [];
  try {
    if (USE_MOCK) {
      chatAcceptResults.value = chatOfferings.value.map(o =>
        o.eligibility === "valid"
          ? { offering_id: o.offering_id, status: "enrolled" }
          : { offering_id: o.offering_id, status: "rejected", reason: "前置课程未修", code: 30103 }
      );
    } else {
      const { data: recData } = await recommendApi({ goal: "", semester: "2026-1" });
      const { data } = await acceptRecommendationApi(recData.rec_id);
      chatAcceptResults.value = data.results;
    }
  } finally {
    chatAcceptLoading.value = false;
  }
}

function scrollToBottom() {
  nextTick(() => {
    if (chatRef.value) {
      chatRef.value.scrollTop = chatRef.value.scrollHeight;
    }
  });
}
</script>

<style scoped lang="scss">
.chat-messages {
  max-height: 400px;
  padding: 8px 0;
  overflow-y: auto;
  .msg {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
    &.assistant {
      .msg-avatar {
        color: var(--el-color-primary);
        background: var(--el-color-primary-light-8);
      }
    }
    &.user {
      flex-direction: row-reverse;
      .msg-avatar {
        color: var(--el-color-success);
        background: var(--el-color-success-light-8);
      }
    }
  }
  .msg-avatar {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    font-size: 12px;
    font-weight: 600;
    border-radius: 50%;
  }
  .msg-bubble {
    max-width: 70%;
    padding: 8px 12px;
    font-size: 14px;
    line-height: 1.6;
    white-space: pre-wrap;
    background: var(--el-fill-color-light);
    border-radius: 8px;
  }
  .msg-cursor {
    display: inline;
    color: var(--el-color-primary);
    animation: blink 0.6s step-end infinite;
  }
}

@keyframes blink {
  50% {
    opacity: 0;
  }
}
.chat-input {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}
.ml-2 {
  margin-left: 8px;
}
.text-sm {
  font-size: 13px;
}
</style>
