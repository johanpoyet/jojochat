<script setup>
import { ref, nextTick, watch } from 'vue'
import { useChatStore } from '../stores/chat'
import { useAuthStore } from '../stores/auth'
import { Search, MoreVertical, Check, CheckCheck, Smile, Edit2, Trash2, X, Ban } from 'lucide-vue-next'
import MessageInput from './MessageInput.vue'
import TypingIndicator from './TypingIndicator.vue'

const chatStore = useChatStore()
const authStore = useAuthStore()
const messagesContainer = ref(null)
const showReactionPicker = ref(null)
const editingMessage = ref(null)
const editContent = ref('')
const contextMenu = ref({ show: false, message: null, x: 0, y: 0 })
const showHeaderMenu = ref(false)
const confirmModal = ref({ show: false, title: '', message: '', onConfirm: null })
const alertModal = ref({ show: false, title: '', message: '' })
const showSearch = ref(false)
const searchQuery = ref('')
const searchResults = ref([])
const searchLoading = ref(false)

const commonEmojis = ['👍', '❤️', '😂', '😮', '😢', '🙏']

const showConfirm = (title, message, onConfirm) => {
  confirmModal.value = { show: true, title, message, onConfirm }
}

const closeConfirm = () => {
  confirmModal.value = { show: false, title: '', message: '', onConfirm: null }
}

const handleConfirm = () => {
  if (confirmModal.value.onConfirm) {
    confirmModal.value.onConfirm()
  }
  closeConfirm()
}

const showAlert = (title, message) => {
  alertModal.value = { show: true, title, message }
}

const closeAlert = () => {
  alertModal.value = { show: false, title: '', message: '' }
}

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

watch(() => chatStore.messages, () => {
  scrollToBottom()
}, { deep: true })

watch(() => chatStore.selectedUser, () => {
  scrollToBottom()
})

watch(() => chatStore.selectedGroup, () => {
  scrollToBottom()
})

watch(() => chatStore.isTyping, () => {
  scrollToBottom()
})

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getMessageStatus = (message) => {
  if (message.sender._id !== authStore.user.id) return null
  if (message.status === 'read') return 'read'
  if (message.status === 'received') return 'received'
  return 'sent'
}

const toggleReactionPicker = (messageId) => {
  showReactionPicker.value = showReactionPicker.value === messageId ? null : messageId
}

const addReaction = (messageId, emoji) => {
  chatStore.addReaction(messageId, emoji)
  showReactionPicker.value = null
}

const removeReaction = (messageId, emoji) => {
  chatStore.removeReaction(messageId, emoji)
}

const hasUserReacted = (message, emoji) => {
  if (!message.reactions) return false
  return message.reactions.some(r => r.user === authStore.user.id && r.emoji === emoji)
}

const groupedReactions = (message) => {
  if (!message.reactions || message.reactions.length === 0) return []
  const groups = {}
  message.reactions.forEach(r => {
    if (!groups[r.emoji]) groups[r.emoji] = { emoji: r.emoji, count: 0, users: [] }
    groups[r.emoji].count++
    groups[r.emoji].users.push(r.user)
  })
  return Object.values(groups)
}

const showContextMenu = (event, message) => {
  if (message.sender._id !== authStore.user.id) return
  event.preventDefault()
  contextMenu.value = { show: true, message, x: event.clientX, y: event.clientY }
}

const closeContextMenu = () => {
  contextMenu.value.show = false
}

const startEditMessage = (message) => {
  editingMessage.value = message._id
  editContent.value = message.content
  closeContextMenu()
}

const saveEditMessage = () => {
  if (editingMessage.value && editContent.value.trim()) {
    chatStore.editMessage(editingMessage.value, editContent.value)
    editingMessage.value = null
    editContent.value = ''
  }
}

const cancelEditMessage = () => {
  editingMessage.value = null
  editContent.value = ''
}

const deleteMessage = (message) => {
  chatStore.deleteMessage(message._id)
  closeContextMenu()
}

const toggleHeaderMenu = () => {
  showHeaderMenu.value = !showHeaderMenu.value
}

const closeHeaderMenu = () => {
  showHeaderMenu.value = false
}

const blockContact = () => {
  if (!chatStore.selectedUser) return

  closeHeaderMenu()

  const userId = chatStore.selectedUser.id || chatStore.selectedUser._id
  const username = chatStore.selectedUser.username

  showConfirm(
    'Block Contact',
    `Are you sure you want to block ${username}? You won't receive messages from them.`,
    async () => {
      try {
        const response = await fetch(`${authStore.API_URL}/api/users/block/${userId}`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${authStore.token}` }
        })

        if (response.ok) {
          // Clear the chat immediately
          chatStore.selectedUser = null
          chatStore.selectedGroup = null
          chatStore.messages = []

          // Show success message after clearing
          showAlert('Success', `${username} has been blocked`)
        } else {
          const data = await response.json()
          showAlert('Error', data.error || 'Failed to block contact')
        }
      } catch (err) {
        console.error('Block error:', err)
        showAlert('Error', 'Network error. Please try again.')
      }
    }
  )
}

const toggleSearch = () => {
  showSearch.value = !showSearch.value
  if (!showSearch.value) {
    searchQuery.value = ''
    searchResults.value = []
  }
}

const performSearch = async () => {
  if (!searchQuery.value || searchQuery.value.trim().length === 0) {
    searchResults.value = []
    return
  }

  searchLoading.value = true

  try {
    const conversationId = chatStore.selectedGroup
      ? `group-${chatStore.selectedGroup._id}`
      : chatStore.selectedUser?.id || chatStore.selectedUser?._id

    if (!conversationId) {
      console.error('No conversation selected')
      searchLoading.value = false
      return
    }

    const params = new URLSearchParams({
      query: searchQuery.value,
      conversationId
    })

    const response = await fetch(`${authStore.API_URL}/api/messages/search?${params}`, {
      headers: { 'Authorization': `Bearer ${authStore.token}` }
    })

    const data = await response.json()

    if (response.ok) {
      searchResults.value = data.messages
    } else {
      console.error('Search error:', data.error)
    }
  } catch (error) {
    console.error('Search error:', error)
  } finally {
    searchLoading.value = false
  }
}

const scrollToMessage = (messageId) => {
  showSearch.value = false
  searchQuery.value = ''
  searchResults.value = []

  nextTick(() => {
    const messageElement = document.getElementById(`message-${messageId}`)
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      messageElement.classList.add('highlight')
      setTimeout(() => {
        messageElement.classList.remove('highlight')
      }, 2000)
    }
  })
}

const isImage = (message) => message.type === 'image' && message.mediaUrl
const isVideo = (message) => message.type === 'video' && message.mediaUrl
const isDocument = (message) => message.type === 'document' && message.mediaUrl

const getMediaUrl = (url) => {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return `${authStore.API_URL}${url}`
}
</script>

<template>
  <div class="chat-window">
    <div v-if="!chatStore.selectedUser && !chatStore.selectedGroup" class="empty-state">
      <i class="fas fa-comments"></i>
      <h2>Chat App</h2>
      <p>Select a conversation to start messaging</p>
    </div>

    <template v-else>
      <div class="chat-header">
        <div class="header-info">
          <div class="avatar">
            <img
              v-if="chatStore.selectedGroup?.avatar"
              :src="chatStore.selectedGroup.avatar"
              alt="avatar"
            />
            <img
              v-else-if="chatStore.selectedUser?.avatar"
              :src="chatStore.selectedUser.avatar"
              alt="avatar"
            />
            <i v-else class="fas fa-user"></i>
          </div>
          <div class="user-details">
            <h3>{{ chatStore.selectedGroup ? chatStore.selectedGroup.name : chatStore.selectedUser.username }}</h3>
            <p class="status">
              <template v-if="chatStore.selectedGroup">
                {{ chatStore.selectedGroup.members.length }} members
              </template>
              <template v-else>
                {{ chatStore.isTyping ? 'typing...' : (chatStore.selectedUser.status === 'online' ? 'online' : '') }}
              </template>
            </p>
          </div>
        </div>
        <div class="header-actions">
          <button class="icon-btn" title="Search" @click="toggleSearch">
            <Search :size="24" />
          </button>
          <div class="menu-wrapper">
            <button class="icon-btn" title="Menu" @click="toggleHeaderMenu">
              <MoreVertical :size="24" />
            </button>
            <div v-if="showHeaderMenu" class="header-dropdown-menu">
              <button v-if="chatStore.selectedUser" @click="blockContact" class="menu-item danger">
                <Ban :size="18" />
                <span>Block Contact</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Search Panel -->
      <div v-if="showSearch" class="search-panel">
        <div class="search-header">
          <h3>Search Messages</h3>
          <button @click="toggleSearch" class="close-search">
            <X :size="20" />
          </button>
        </div>
        <div class="search-input-container">
          <Search :size="18" class="search-icon" />
          <input
            v-model="searchQuery"
            @input="performSearch"
            type="text"
            placeholder="Search in conversation..."
            class="search-input"
          />
        </div>
        <div class="search-results">
          <div v-if="searchLoading" class="search-loading">Searching...</div>
          <div v-else-if="searchQuery && searchResults.length === 0" class="search-empty">
            No messages found
          </div>
          <div v-else-if="searchResults.length > 0" class="search-results-list">
            <div
              v-for="result in searchResults"
              :key="result._id"
              @click="scrollToMessage(result._id)"
              class="search-result-item"
            >
              <div class="result-sender">{{ result.sender.username }}</div>
              <div class="result-content">{{ result.content }}</div>
              <div class="result-date">{{ formatTime(result.createdAt) }}</div>
            </div>
          </div>
        </div>
      </div>

      <div ref="messagesContainer" class="messages-container" @click="closeContextMenu(); closeHeaderMenu()">
        <div
          v-for="message in chatStore.messages"
          :key="message._id"
          :id="`message-${message._id}`"
          class="message"
          :class="{
            sent: message.sender._id === authStore.user.id,
            received: message.sender._id !== authStore.user.id,
            deleted: message.deleted
          }"
          @contextmenu="showContextMenu($event, message)"
        >
          <div class="message-wrapper">
            <button class="btn-react" @click.stop="toggleReactionPicker(message._id)">
              <Smile :size="16" />
            </button>

            <div class="message-bubble">
              <img v-if="isImage(message)" :src="getMediaUrl(message.mediaUrl)" class="message-image" alt="Image" />
              <video v-else-if="isVideo(message)" :src="getMediaUrl(message.mediaUrl)" controls class="message-video"></video>
              <a v-else-if="isDocument(message)" :href="getMediaUrl(message.mediaUrl)" target="_blank" class="message-document">
                <span>Document</span>
              </a>

              <div v-if="editingMessage === message._id" class="edit-message">
                <input v-model="editContent" @keyup.enter="saveEditMessage" @keyup.esc="cancelEditMessage" />
                <div class="edit-actions">
                  <button @click="saveEditMessage">Save</button>
                  <button @click="cancelEditMessage"><X :size="16" /></button>
                </div>
              </div>
              <p v-else-if="message.deleted" class="deleted-text">This message was deleted</p>
              <p v-else>{{ message.content }}</p>

              <div class="message-meta">
                <span v-if="message.editedAt" class="edited">edited</span>
                <span class="time">{{ formatTime(message.createdAt) }}</span>
                <span v-if="getMessageStatus(message)" class="status-icon">
                  <Check v-if="getMessageStatus(message) === 'sent'" :size="16" />
                  <CheckCheck v-else-if="getMessageStatus(message) === 'received'" :size="16" />
                  <CheckCheck v-else-if="getMessageStatus(message) === 'read'" class="read" :size="16" />
                </span>
              </div>

              <div v-if="groupedReactions(message).length" class="reactions-display">
                <span
                  v-for="reaction in groupedReactions(message)"
                  :key="reaction.emoji"
                  class="reaction-badge"
                  :class="{ 'user-reacted': hasUserReacted(message, reaction.emoji) }"
                  @click="hasUserReacted(message, reaction.emoji) ? removeReaction(message._id, reaction.emoji) : addReaction(message._id, reaction.emoji)"
                >
                  {{ reaction.emoji }} {{ reaction.count > 1 ? reaction.count : '' }}
                </span>
              </div>

              <div v-if="showReactionPicker === message._id" class="reaction-picker" @click.stop>
                <button v-for="emoji in commonEmojis" :key="emoji" @click="addReaction(message._id, emoji)">
                  {{ emoji }}
                </button>
              </div>
            </div>
          </div>
        </div>
        <TypingIndicator v-if="chatStore.isTyping" />
      </div>

      <div
        v-if="contextMenu.show"
        class="context-menu"
        :style="{ top: contextMenu.y + 'px', left: contextMenu.x + 'px' }"
        @click.stop
      >
        <button @click="startEditMessage(contextMenu.message)">
          <Edit2 :size="16" /> Edit
        </button>
        <button @click="deleteMessage(contextMenu.message)" class="danger">
          <Trash2 :size="16" /> Delete
        </button>
      </div>

      <MessageInput />
    </template>

    <!-- Confirm Modal -->
    <div v-if="confirmModal.show" class="modal-overlay" @click="closeConfirm">
      <div class="custom-modal" @click.stop>
        <div class="modal-header">
          <h3>{{ confirmModal.title }}</h3>
          <button @click="closeConfirm" class="modal-close">
            <X :size="20" />
          </button>
        </div>
        <div class="modal-body-text">
          {{ confirmModal.message }}
        </div>
        <div class="modal-footer-buttons">
          <button @click="closeConfirm" class="modal-btn modal-btn-cancel">Cancel</button>
          <button @click="handleConfirm" class="modal-btn modal-btn-confirm">Confirm</button>
        </div>
      </div>
    </div>

    <!-- Alert Modal -->
    <div v-if="alertModal.show" class="modal-overlay" @click="closeAlert">
      <div class="custom-modal" @click.stop>
        <div class="modal-header">
          <h3>{{ alertModal.title }}</h3>
          <button @click="closeAlert" class="modal-close">
            <X :size="20" />
          </button>
        </div>
        <div class="modal-body-text">
          {{ alertModal.message }}
        </div>
        <div class="modal-footer-buttons">
          <button @click="closeAlert" class="modal-btn modal-btn-primary">OK</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chat-window {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  position: relative;
}

:root.dark-mode .chat-window {
  background-image: none;
}

:root:not(.dark-mode) .chat-window {
  background: #efeae2;
  background-image: url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png');
  background-size: 412.5px 749.25px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: var(--text-secondary);
  background: var(--bg-primary);
  border-bottom: 6px solid #25D366;
}

.empty-state i {
  font-size: 4rem;
  margin-bottom: 1rem;
  color: var(--text-secondary);
  opacity: 0.5;
}

.empty-state h2 {
  margin: 0.5rem 0;
  color: var(--text-primary);
  font-weight: 300;
  font-size: 32px;
}

.empty-state p {
  color: var(--text-secondary);
  font-size: 14px;
}

.chat-header {
  background: var(--bg-primary);
  padding: 10px 16px;
  height: 59px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-sizing: border-box;
  border-bottom: 1px solid var(--border-color);
}

.header-info {
  display: flex;
  align-items: center;
  gap: 15px;
  cursor: pointer;
}

.avatar {
  position: relative;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  overflow: hidden;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-details h3 {
  margin: 0;
  font-size: 16px;
  color: var(--text-primary);
  font-weight: 400;
  line-height: normal;
}

.user-details .status {
  margin: 0;
  font-size: 13px;
  color: var(--text-secondary);
  line-height: normal;
  min-height: 15px;
}

.header-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.menu-wrapper {
  position: relative;
}

.header-dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: var(--bg-secondary);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  min-width: 200px;
  z-index: 1000;
  overflow: hidden;
}

.header-dropdown-menu .menu-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: none;
  border: none;
  color: var(--text-primary);
  font-size: 15px;
  cursor: pointer;
  transition: background 0.2s;
  text-align: left;
}

.header-dropdown-menu .menu-item:hover {
  background: var(--hover-color);
}

.header-dropdown-menu .menu-item.danger {
  color: var(--danger-color);
}

.header-dropdown-menu .menu-item.danger:hover {
  background: rgba(239, 83, 80, 0.1);
}

.icon-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-btn:hover {
  background-color: var(--hover-color);
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px 60px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.message {
  display: flex;
  margin-bottom: 12px;
  max-width: 65%;
}

.message:has(.reactions-display) {
  margin-bottom: 20px;
}

.message.sent {
  align-self: flex-end;
}

.message.received {
  align-self: flex-start;
}

.message-bubble {
  padding: 6px 7px 8px 9px;
  border-radius: 7.5px;
  position: relative;
  box-shadow: 0 1px 0.5px rgba(0, 0, 0, 0.13);
  min-width: 80px;
}

.message.sent .message-bubble {
  background: var(--message-out);
  border-top-right-radius: 0;
}

.message.sent .message-bubble::before {
  content: "";
  position: absolute;
  top: 0;
  right: -8px;
  width: 8px;
  height: 13px;
  background: linear-gradient(to top left, rgba(0,0,0,0) 50%, var(--message-out) 50%);
}

.message.received .message-bubble {
  background: var(--message-in);
  border-top-left-radius: 0;
}

.message.received .message-bubble::before {
  content: "";
  position: absolute;
  top: 0;
  left: -8px;
  width: 8px;
  height: 13px;
  background: linear-gradient(to top right, rgba(0,0,0,0) 50%, var(--message-in) 50%);
}

.message-bubble p {
  margin: 0 0 4px 0;
  word-wrap: break-word;
  color: var(--text-primary);
  font-size: 14.2px;
  line-height: 19px;
}

.message-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  justify-content: flex-end;
  float: right;
  margin-top: -10px;
  margin-left: 10px;
  position: relative;
  top: 4px;
}

.time {
  font-size: 11px;
  color: var(--text-secondary);
}

.status-icon {
  display: flex;
  align-items: center;
  color: var(--text-secondary);
}

.status-icon .read {
  color: #53bdeb;
}

.message.deleted .message-bubble {
  opacity: 0.7;
}

.deleted-text {
  font-style: italic;
  color: var(--text-secondary);
}

.message-image {
  max-width: 300px;
  max-height: 200px;
  border-radius: 8px;
  margin-bottom: 4px;
  cursor: pointer;
}

.message-video {
  max-width: 300px;
  max-height: 200px;
  border-radius: 8px;
  margin-bottom: 4px;
}

.message-document {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  background: rgba(0,0,0,0.05);
  border-radius: 8px;
  text-decoration: none;
  color: #111b21;
  margin-bottom: 4px;
}

.edited {
  font-size: 11px;
  color: #667781;
  font-style: italic;
}

.edit-message {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.edit-message input {
  border: 1px solid #00a884;
  border-radius: 4px;
  padding: 6px 8px;
  font-size: 14px;
  outline: none;
}

.edit-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.edit-actions button {
  background: #00a884;
  color: white;
  border: none;
  padding: 4px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
}

.edit-actions button:last-child {
  background: #667781;
}

.message-bubble {
  position: relative;
}

.message-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.message.received .message-wrapper {
  flex-direction: row-reverse;
}

.btn-react {
  background: white;
  border: none;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: none;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #667781;
  box-shadow: 0 1px 3px rgba(0,0,0,0.15);
  flex-shrink: 0;
}

.btn-react:hover {
  background: #e9edef;
}

.message:hover .btn-react {
  display: flex;
}

.reaction-picker {
  position: absolute;
  bottom: 100%;
  background: white;
  border-radius: 20px;
  padding: 6px;
  display: flex;
  gap: 4px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.15);
  margin-bottom: 8px;
}

.message.sent .reaction-picker {
  right: 0;
}

.message.received .reaction-picker {
  left: 0;
}

.reaction-picker button {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  transition: background 0.2s;
}

.reaction-picker button:hover {
  background: #f0f2f5;
}

.reactions-display {
  position: absolute;
  bottom: -22px;
  right: 4px;
  display: flex;
  gap: 2px;
}

.message.received .reactions-display {
  left: 4px;
  right: auto;
}

.reaction-badge {
  background: white;
  border-radius: 12px;
  padding: 2px 6px;
  font-size: 14px;
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(0,0,0,0.15);
  border: 1px solid rgba(0,0,0,0.08);
  color: #111b21;
}

:root.dark-mode .reaction-badge {
  background: #2a2a2a;
  border-color: rgba(255,255,255,0.1);
  color: #e9edef;
}

.reaction-badge:hover {
  transform: scale(1.1);
}

.context-menu {
  position: fixed;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.2);
  z-index: 1000;
  overflow: hidden;
}

.context-menu button {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 20px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 14px;
  color: #111b21;
}

.context-menu button:hover {
  background: #f0f2f5;
}

.context-menu button.danger {
  color: #dc2626;
}

/* Custom Modals */
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
  z-index: 10000;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.custom-modal {
  background: var(--bg-secondary);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  width: 90%;
  max-width: 400px;
  overflow: hidden;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.modal-close {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
}

.modal-close:hover {
  background: var(--hover-color);
  color: var(--text-primary);
}

.modal-body-text {
  padding: 24px;
  color: var(--text-primary);
  font-size: 15px;
  line-height: 1.5;
}

.modal-footer-buttons {
  display: flex;
  gap: 12px;
  padding: 16px 24px;
  justify-content: flex-end;
  border-top: 1px solid var(--border-color);
}

.modal-btn {
  padding: 10px 24px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  outline: none;
}

.modal-btn-cancel {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.modal-btn-cancel:hover {
  background: var(--hover-color);
}

.modal-btn-confirm {
  background: var(--danger-color);
  color: white;
}

.modal-btn-confirm:hover {
  background: #c53030;
}

.modal-btn-primary {
  background: var(--accent-color);
  color: white;
}

.modal-btn-primary:hover {
  background: var(--accent-dark);
}

/* Search Panel Styles */
.search-panel {
  position: absolute;
  top: 0;
  right: 0;
  width: 350px;
  height: 100%;
  background: var(--bg-primary);
  border-left: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  z-index: 10;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
}

.search-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-primary);
}

.search-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.close-search-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.close-search-btn:hover {
  background: var(--hover-color);
}

.search-input-container {
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-input-wrapper .icon {
  position: absolute;
  left: 12px;
  font-size: 18px;
  color: var(--text-secondary);
}

.search-input-container input {
  width: 100%;
  padding: 10px 12px 10px 40px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 14px;
  transition: border-color 0.2s;
}

.search-input-container input:focus {
  outline: none;
  border-color: var(--accent-color);
}

.search-input-container input::placeholder {
  color: var(--text-secondary);
}

.search-results-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.search-result-item {
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-bottom: 4px;
  border: 1px solid transparent;
}

.search-result-item:hover {
  background: var(--hover-color);
  border-color: var(--border-color);
}

.search-result-sender {
  font-weight: 600;
  font-size: 14px;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.search-result-content {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.search-result-date {
  font-size: 12px;
  color: var(--text-secondary);
}

.search-loading,
.search-no-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  color: var(--text-secondary);
  text-align: center;
}

.search-loading .icon,
.search-no-results .icon {
  font-size: 48px;
  margin-bottom: 12px;
  opacity: 0.5;
}

.highlight {
  animation: highlightMessage 2s ease;
}

@keyframes highlightMessage {
  0% {
    background: var(--accent-color);
    opacity: 0.3;
  }
  50% {
    background: var(--accent-color);
    opacity: 0.5;
  }
  100% {
    background: transparent;
    opacity: 1;
  }
}
</style>
