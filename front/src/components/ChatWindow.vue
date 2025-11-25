<script setup>
import { ref, nextTick, watch } from 'vue'
import { useChatStore } from '../stores/chat'
import { useAuthStore } from '../stores/auth'
import { Search, MoreVertical, Check, CheckCheck, Smile, Edit2, Trash2, X } from 'lucide-vue-next'
import MessageInput from './MessageInput.vue'
import TypingIndicator from './TypingIndicator.vue'

const chatStore = useChatStore()
const authStore = useAuthStore()
const messagesContainer = ref(null)
const showReactionPicker = ref(null)
const editingMessage = ref(null)
const editContent = ref('')
const contextMenu = ref({ show: false, message: null, x: 0, y: 0 })

const commonEmojis = ['👍', '❤️', '😂', '😮', '😢', '🙏']

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
          <button class="icon-btn" title="Search">
            <Search :size="24" />
          </button>
          <button class="icon-btn" title="Menu">
            <MoreVertical :size="24" />
          </button>
        </div>
      </div>

      <div ref="messagesContainer" class="messages-container" @click="closeContextMenu">
        <div
          v-for="message in chatStore.messages"
          :key="message._id"
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
</style>
