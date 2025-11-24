<script setup>
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useChatStore } from '../stores/chat'
import { storeToRefs } from 'pinia'
import { Search, MessageSquarePlus, MoreVertical, CircleDashed, User, X } from 'lucide-vue-next'

const emit = defineEmits(['logout', 'show-status'])

const authStore = useAuthStore()
const chatStore = useChatStore()
const { typingUsers } = storeToRefs(chatStore)

const showUserModal = ref(false)
const showMenu = ref(false)

const toggleMenu = () => {
  showMenu.value = !showMenu.value
}

const handleLogout = () => {
  showMenu.value = false
  emit('logout')
}

const selectUser = async (user) => {
  await chatStore.selectUser(user)
  showUserModal.value = false
}

const openNewConversation = () => {
  showUserModal.value = true
}

const closeModal = () => {
  showUserModal.value = false
}

const getLastMessageTime = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date

  if (diff < 86400000) {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  } else if (diff < 604800000) {
    return date.toLocaleDateString('en-US', { weekday: 'short' })
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
}

const isUserTyping = (userId) => {
  return typingUsers.value.includes(userId)
}
</script>

<template>
  <div class="conversation-list">
    <div class="sidebar-header">
      <div class="user-info">
        <div class="avatar">
          <img v-if="authStore.user?.avatar" :src="authStore.user.avatar" alt="avatar" />
          <User v-else :size="24" color="#cfd8dc" />
        </div>
      </div>
      <div class="header-actions">
        <button class="icon-btn" title="Status" @click="emit('show-status')">
          <CircleDashed :size="24" />
        </button>
        <button @click="openNewConversation" class="icon-btn" title="New Chat">
          <MessageSquarePlus :size="24" />
        </button>
        <div class="menu-container">
          <button class="icon-btn" title="Menu" @click="toggleMenu">
            <MoreVertical :size="24" />
          </button>
          <div v-if="showMenu" class="dropdown-menu">
            <button @click="handleLogout" class="menu-item">
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="search-container">
      <div class="search-box">
        <button class="search-icon">
          <Search :size="18" />
        </button>
        <input type="text" placeholder="Search or start new chat" />
      </div>
    </div>

    <div class="conversations">
      <div
        v-for="conv in chatStore.conversations"
        :key="conv.id"
        class="conversation-item"
        :class="{ active: chatStore.selectedUser?.id === conv.otherUser.id }"
        @click="selectUser(conv.otherUser)"
      >
        <div class="avatar">
          <img v-if="conv.otherUser.avatar" :src="conv.otherUser.avatar" alt="avatar" />
          <User v-else :size="20" />
          <span
            class="status-indicator"
            :class="{ online: conv.otherUser.status === 'online' }"
          ></span>
        </div>
        <div class="conv-info">
          <div class="conv-header">
            <h4>{{ conv.otherUser.username }}</h4>
            <span v-if="conv.lastMessage" class="time">
              {{ getLastMessageTime(conv.lastMessage.createdAt) }}
            </span>
          </div>
          <div class="conv-preview">
            <p v-if="isUserTyping(conv.otherUser.id)" class="typing-text">
              typing...
            </p>
            <p v-else-if="conv.lastMessage">
              {{ conv.lastMessage.isSender ? 'You: ' : '' }}
              {{ conv.lastMessage.content }}
            </p>
            <span v-if="conv.unreadCount > 0" class="unread-badge">
              {{ conv.unreadCount }}
            </span>
          </div>
        </div>
      </div>

    </div>

    <!-- User Selection Modal -->
    <div v-if="showUserModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>New Conversation</h3>
          <button @click="closeModal" class="btn-close">
            <X :size="24" />
          </button>
        </div>
        <div class="modal-body">
          <div class="search-box">
            <Search :size="18" />
            <input type="text" placeholder="Search users" />
          </div>
          <div class="user-list">
            <div
              v-for="user in chatStore.users"
              :key="user.id"
              class="conversation-item"
              @click="selectUser(user)"
            >
              <div class="avatar">
                <img v-if="user.avatar" :src="user.avatar" alt="avatar" />
                <User v-else :size="20" />
                <span
                  class="status-indicator"
                  :class="{ online: user.status === 'online' }"
                ></span>
              </div>
              <div class="conv-info">
                <div class="conv-header">
                  <h4>{{ user.username }}</h4>
                </div>
                <div class="conv-preview">
                  <p class="user-status">{{ user.status }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.conversation-list {
  width: 30%;
  min-width: 340px;
  max-width: 450px;
  background: white;
  border-right: 1px solid #d1d7db;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  height: 100%;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  background: #f0f2f5;
  height: 59px;
  box-sizing: border-box;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.avatar {
  position: relative;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #dfe5e7;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.header-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.icon-btn {
  background: none;
  border: none;
  color: #54656f;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-btn:hover {
  background-color: rgba(0,0,0,0.05);
}

.menu-container {
  position: relative;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  padding: 5px 0;
  z-index: 100;
  min-width: 150px;
}

.menu-item {
  display: block;
  width: 100%;
  padding: 10px 20px;
  text-align: left;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14.5px;
  color: #3b4a54;
}

.menu-item:hover {
  background: #f5f6f6;
}

.search-container {
  padding: 7px 10px;
  background: white;
  border-bottom: 1px solid #f0f2f5;
}

.search-box {
  background: #f0f2f5;
  border-radius: 8px;
  display: flex;
  align-items: center;
  padding: 0 10px;
  height: 35px;
}

.search-icon {
  background: none;
  border: none;
  color: #54656f;
  padding: 0 10px 0 0;
  display: flex;
  align-items: center;
}

.search-box input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 14px;
  color: #3b4a54;
  width: 100%;
}

.search-box input::placeholder {
  color: #54656f;
}

.conversations {
  flex: 1;
  overflow-y: auto;
  background: white;
}

.conversation-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 0 15px;
  height: 72px;
  cursor: pointer;
  background: white;
  position: relative;
}

.conversation-item:hover {
  background: #f5f6f6;
}

.conversation-item.active {
  background: #f0f2f5;
}

.conversation-item .avatar {
  width: 49px;
  height: 49px;
  flex-shrink: 0;
}

.conv-info {
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  border-bottom: 1px solid #f0f2f5;
  padding-right: 15px;
  min-width: 0;
}

.conversation-item:last-child .conv-info {
  border-bottom: none;
}

.conv-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 3px;
}

.conv-header h4 {
  margin: 0;
  font-size: 17px;
  color: #111b21;
  font-weight: 400;
  line-height: 21px;
}

.time {
  font-size: 12px;
  color: #667781;
  line-height: 14px;
}

.conv-preview {
  display: flex;
  justify-content: space-between;
  align-items: center;
  line-height: 20px;
}

.conv-preview p {
  margin: 0;
  font-size: 14px;
  color: #667781;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.typing-text {
  color: #00a884 !important;
  font-weight: 500;
}

.unread-badge {
  background: #25D366;
  color: white;
  border-radius: 50%;
  min-width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 500;
  margin-left: 6px;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e0e0e0;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: #111;
  font-weight: 500;
}

.btn-close {
  background: none;
  border: none;
  color: #54656f;
  cursor: pointer;
  font-size: 1.5rem;
  padding: 0.25rem;
  line-height: 1;
  transition: color 0.2s;
}

.btn-close:hover {
  color: #128C7E;
}

.modal-body {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-body .search-box {
  border-bottom: 1px solid #e0e0e0;
}

.user-list {
  overflow-y: auto;
  max-height: 60vh;
}

.user-list .conversation-item {
  border-bottom: 1px solid #f0f2f5;
}

.user-list .conversation-item:last-child {
  border-bottom: none;
}
</style>
