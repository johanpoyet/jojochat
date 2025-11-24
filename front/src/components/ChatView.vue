<script setup>
import { onMounted, ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useChatStore } from '../stores/chat'
import ConversationList from './ConversationList.vue'
import ChatWindow from './ChatWindow.vue'
import StatusView from './StatusView.vue'

const authStore = useAuthStore()
const chatStore = useChatStore()
const showStatus = ref(false)

onMounted(async () => {
  chatStore.setupSocketListeners()
  await chatStore.getUsers()
  await chatStore.getConversations()
})

const handleLogout = () => {
  authStore.logout()
}
</script>

<template>
  <div class="chat-container">
    <StatusView :show="showStatus" @close="showStatus = false" />
    <ConversationList @logout="handleLogout" @show-status="showStatus = true" />
    <ChatWindow />
  </div>
</template>

<style scoped>
.chat-container {
  display: flex;
  width: 100vw;
  height: 100vh;
  margin: 0;
  background: #d1d7db;
  position: relative;
  overflow: hidden;
}

.chat-container::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 127px;
  background-color: #00a884;
  z-index: -1;
}

@media (min-width: 1441px) {
  .chat-container {
    padding: 19px;
    box-sizing: border-box;
  }
  
  .chat-container > * {
    box-shadow: 0 17px 50px 0 rgba(11,20,26,.19), 0 12px 15px 0 rgba(11,20,26,.24);
  }
}
</style>
