<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useChatStore } from '../stores/chat'
import { useGroupsStore } from '../stores/groups'
import { storeToRefs } from 'pinia'
import { Search, MessageSquarePlus, MoreVertical, CircleDashed, User, X, Check, Users, Settings, UserCog } from 'lucide-vue-next'

const emit = defineEmits(['logout', 'show-status', 'show-settings', 'show-profile'])

const authStore = useAuthStore()
const chatStore = useChatStore()
const groupsStore = useGroupsStore()
const { typingUsers } = storeToRefs(chatStore)

const showUserModal = ref(false)
const showMenu = ref(false)
const modalMode = ref('single') // 'single' or 'group'
const selectedUsers = ref([])
const groupName = ref('')
const groupDescription = ref('')
const creatingGroup = ref(false)

const toggleMenu = () => {
  showMenu.value = !showMenu.value
}

const handleLogout = () => {
  showMenu.value = false
  emit('logout')
}

const handleSettings = () => {
  showMenu.value = false
  emit('show-settings')
}

const selectUser = async (user) => {
  if (modalMode.value === 'single') {
    await chatStore.selectUser(user)
    showUserModal.value = false
  } else {
    toggleUserSelection(user)
  }
}

const selectGroupFromList = async (group) => {
  await chatStore.selectGroup(group)
}

const toggleUserSelection = (user) => {
  const index = selectedUsers.value.findIndex(u => u.id === user.id)
  if (index === -1) {
    selectedUsers.value.push(user)
  } else {
    selectedUsers.value.splice(index, 1)
  }
}

const isUserSelected = (user) => {
  return selectedUsers.value.some(u => u.id === user.id)
}

const canCreateGroup = computed(() => {
  return selectedUsers.value.length >= 1 && groupName.value.trim().length >= 3
})

const openNewConversation = () => {
  modalMode.value = 'single'
  selectedUsers.value = []
  groupName.value = ''
  groupDescription.value = ''
  showUserModal.value = true
}

const switchToGroupMode = () => {
  modalMode.value = 'group'
  selectedUsers.value = []
  groupName.value = ''
  groupDescription.value = ''
}

const switchToSingleMode = () => {
  modalMode.value = 'single'
  selectedUsers.value = []
}

const createGroup = async () => {
  if (!canCreateGroup.value) return

  creatingGroup.value = true
  const memberIds = selectedUsers.value.map(u => u.id)

  const result = await groupsStore.createGroup(
    groupName.value.trim(),
    groupDescription.value.trim(),
    memberIds
  )

  creatingGroup.value = false

  if (result.success) {
    showUserModal.value = false
    selectedUsers.value = []
    groupName.value = ''
    groupDescription.value = ''

    // Sélectionner le groupe nouvellement créé dans le chat
    chatStore.selectGroup(result.group)
  } else {
    alert(`Failed to create group: ${result.error}`)
  }
}

const closeModal = () => {
  showUserModal.value = false
  selectedUsers.value = []
  groupName.value = ''
  groupDescription.value = ''
  modalMode.value = 'single'
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
      <div class="user-info" @click="emit('show-profile')">
        <div class="avatar">
          <img v-if="authStore.user?.avatar" :src="`${authStore.API_URL}${authStore.user.avatar}`" alt="avatar" />
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
            <button @click="handleSettings" class="menu-item">
              <Settings :size="18" />
              Settings
            </button>
            <button @click="handleLogout" class="menu-item">
              <UserCog :size="18" />
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
      <!-- Groups -->
      <div
        v-for="group in groupsStore.groups"
        :key="'group-' + group._id"
        class="conversation-item"
        :class="{ active: chatStore.selectedGroup?._id === group._id }"
        @click="selectGroupFromList(group)"
      >
        <div class="avatar group-avatar">
          <Users :size="24" color="#00a884" />
        </div>
        <div class="conv-info">
          <div class="conv-header">
            <h4>{{ group.name }}</h4>
          </div>
          <div class="conv-preview">
            <p class="group-members">
              {{ group.members.length }} member{{ group.members.length > 1 ? 's' : '' }}
            </p>
          </div>
        </div>
      </div>

      <!-- Direct Conversations -->
      <div
        v-for="conv in chatStore.conversations"
        :key="conv.id"
        class="conversation-item"
        :class="{ active: chatStore.selectedUser?.id === conv.otherUser.id }"
        @click="selectUser(conv.otherUser)"
      >
        <div class="avatar-wrapper">
          <div class="avatar">
            <img v-if="conv.otherUser.avatar" :src="conv.otherUser.avatar" alt="avatar" />
            <User v-else :size="20" />
          </div>
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
            <p v-else-if="conv.lastMessage && !conv.lastMessage.deleted">
              {{ conv.lastMessage.isSender ? 'You: ' : '' }}
              {{ conv.lastMessage.content }}
            </p>
            <p v-else-if="conv.lastMessage && conv.lastMessage.deleted" class="deleted-message-preview">
              Message supprimé
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
          <h3>{{ modalMode === 'single' ? 'New Conversation' : 'New Group' }}</h3>
          <button @click="closeModal" class="btn-close">
            <X :size="24" />
          </button>
        </div>

        <!-- Mode Switcher -->
        <div class="mode-switcher">
          <button
            :class="['mode-btn', { active: modalMode === 'single' }]"
            @click="switchToSingleMode"
          >
            <User :size="18" />
            Single Chat
          </button>
          <button
            :class="['mode-btn', { active: modalMode === 'group' }]"
            @click="switchToGroupMode"
          >
            <Users :size="18" />
            Group Chat
          </button>
        </div>

        <!-- Group Name Input (only in group mode) -->
        <div v-if="modalMode === 'group'" class="group-info-section">
          <input
            v-model="groupName"
            type="text"
            placeholder="Group name (min 3 characters)"
            class="group-name-input"
          />
          <input
            v-model="groupDescription"
            type="text"
            placeholder="Group description (optional)"
            class="group-description-input"
          />
          <div v-if="selectedUsers.length > 0" class="selected-users-count">
            {{ selectedUsers.length }} member{{ selectedUsers.length > 1 ? 's' : '' }} selected
          </div>
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
              :class="['conversation-item', { selected: isUserSelected(user) }]"
              @click="selectUser(user)"
            >
              <!-- Selection Checkbox (only in group mode) -->
              <div v-if="modalMode === 'group'" class="selection-checkbox">
                <div :class="['checkbox', { checked: isUserSelected(user) }]">
                  <Check v-if="isUserSelected(user)" :size="16" color="white" />
                </div>
              </div>

              <div class="avatar-wrapper">
                <div class="avatar">
                  <img v-if="user.avatar" :src="user.avatar" alt="avatar" />
                  <User v-else :size="20" />
                </div>
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

        <!-- Create Group Button (only in group mode) -->
        <div v-if="modalMode === 'group'" class="modal-footer">
          <button
            :class="['create-group-btn', { disabled: !canCreateGroup }]"
            :disabled="!canCreateGroup || creatingGroup"
            @click="createGroup"
          >
            <Users :size="20" />
            {{ creatingGroup ? 'Creating...' : 'Create Group' }}
          </button>
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
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
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
  background: var(--bg-primary);
  height: 59px;
  box-sizing: border-box;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.avatar-wrapper {
  position: relative;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
}

.avatar {
  width: 100%;
  height: 100%;
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

.menu-container {
  position: relative;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background: var(--bg-secondary);
  border-radius: 4px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  padding: 5px 0;
  z-index: 100;
  min-width: 150px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px 20px;
  text-align: left;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14.5px;
  color: var(--text-primary);
}

.menu-item:hover {
  background: var(--hover-color);
}

.search-container {
  padding: 7px 10px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}

.search-box {
  background: var(--bg-primary);
  border-radius: 8px;
  display: flex;
  align-items: center;
  padding: 0 10px;
  height: 35px;
}

.search-icon {
  background: none;
  border: none;
  color: var(--text-secondary);
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
  color: var(--text-primary);
  width: 100%;
}

.search-box input::placeholder {
  color: var(--text-secondary);
}

.conversations {
  flex: 1;
  overflow-y: auto;
  background: var(--bg-secondary);
}

.conversation-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 0 15px;
  height: 72px;
  cursor: pointer;
  background: var(--bg-secondary);
  position: relative;
}

.conversation-item:hover {
  background: var(--hover-color);
}

.conversation-item.active {
  background: var(--bg-primary);
}

.conversation-item .avatar-wrapper {
  width: 49px;
  height: 49px;
}

.conv-info {
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  border-bottom: 1px solid var(--border-color);
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
  color: var(--text-primary);
  font-weight: 400;
  line-height: 21px;
}

.time {
  font-size: 12px;
  color: var(--text-secondary);
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
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.typing-text {
  color: var(--accent-color) !important;
  font-weight: 500;
}

.deleted-message-preview {
  font-style: italic;
  color: var(--text-secondary);
  opacity: 0.7;
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
  background: var(--bg-secondary);
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
  border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: var(--text-primary);
  font-weight: 500;
}

.btn-close {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 1.5rem;
  padding: 0.25rem;
  line-height: 1;
  transition: color 0.2s;
}

.btn-close:hover {
  color: var(--accent-color);
}

.modal-body {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-body .search-box {
  border-bottom: 1px solid var(--border-color);
}

.user-list {
  overflow-y: auto;
  max-height: 60vh;
}

.user-list .conversation-item {
  border-bottom: 1px solid var(--border-color);
}

.user-list .conversation-item:last-child {
  border-bottom: none;
}

/* Mode Switcher */
.mode-switcher {
  display: flex;
  gap: 0;
  padding: 10px 15px;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-primary);
}

.mode-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.mode-btn:first-child {
  border-radius: 8px 0 0 8px;
  border-right: none;
}

.mode-btn:last-child {
  border-radius: 0 8px 8px 0;
}

.mode-btn:hover {
  background: var(--hover-color);
}

.mode-btn.active {
  background: var(--accent-color);
  color: white;
  border-color: var(--accent-color);
}

/* Group Info Section */
.group-info-section {
  padding: 15px;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-secondary);
}

.group-name-input,
.group-description-input {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 14px;
  color: var(--text-primary);
  background: var(--bg-tertiary);
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.group-name-input {
  margin-bottom: 10px;
}

.group-name-input:focus,
.group-description-input:focus {
  border-color: var(--accent-color);
}

.group-name-input::placeholder,
.group-description-input::placeholder {
  color: var(--text-secondary);
}

.selected-users-count {
  margin-top: 10px;
  font-size: 13px;
  color: var(--accent-color);
  font-weight: 500;
}

/* Selection Checkbox */
.selection-checkbox {
  margin-right: 10px;
}

.checkbox {
  width: 24px;
  height: 24px;
  border: 2px solid var(--border-color);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  background: var(--bg-secondary);
}

.checkbox.checked {
  background: var(--accent-color);
  border-color: var(--accent-color);
}

.conversation-item.selected {
  background: var(--hover-color) !important;
}

/* Modal Footer */
.modal-footer {
  padding: 15px;
  border-top: 1px solid var(--border-color);
  background: var(--bg-secondary);
  display: flex;
  justify-content: flex-end;
}

.create-group-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: var(--accent-color);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
  width: 100%;
  justify-content: center;
}

.create-group-btn:hover:not(.disabled) {
  background: var(--accent-dark);
}

.create-group-btn.disabled {
  background: var(--border-color);
  color: var(--text-secondary);
  cursor: not-allowed;
}

.status-indicator {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #8696a0;
  border: 2px solid white;
  z-index: 1;
}

.status-indicator.online {
  background: #25D366;
}

.group-avatar {
  background: #e7f8f4;
}

.group-members {
  color: #667781;
  font-size: 14px;
}
</style>
