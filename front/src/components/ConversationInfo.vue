<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useChatStore } from '../stores/chat'
import { useGroupsStore } from '../stores/groups'
import { ArrowLeft, Bell, BellOff, Users, Calendar, Image, FileText, Video, X } from 'lucide-vue-next'
import GroupMembers from './GroupMembers.vue'

const emit = defineEmits(['close'])

const authStore = useAuthStore()
const chatStore = useChatStore()
const groupsStore = useGroupsStore()

const notificationsMuted = ref(false)
const showMediaGallery = ref(false)
const showGroupMembers = ref(false)
const confirmModal = ref({ show: false, title: '', message: '', onConfirm: null })

const conversationUser = computed(() => {
  return chatStore.selectedGroup || chatStore.selectedUser
})

const isGroup = computed(() => !!chatStore.selectedGroup)

const isGroupCreator = computed(() => {
  if (!isGroup.value) return false
  const creatorId = chatStore.selectedGroup?.creator?._id || chatStore.selectedGroup?.creator
  const userId = authStore.user?.id || authStore.user?._id
  return creatorId === userId
})

const createdDate = computed(() => {
  if (!conversationUser.value?.createdAt) return 'Unknown'
  return new Date(conversationUser.value.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

const toggleNotifications = () => {
  notificationsMuted.value = !notificationsMuted.value
  // TODO: Save notification preference to backend
}

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

const blockUser = async () => {
  if (!chatStore.selectedUser) return

  showConfirm(
    'Block Contact',
    `Are you sure you want to block ${chatStore.selectedUser.username}? You won't receive messages from them.`,
    async () => {
      try {
        const response = await fetch(`${authStore.API_URL}/api/users/block/${chatStore.selectedUser.id}`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${authStore.token}` }
        })

        if (response.ok) {
          emit('close')
          chatStore.selectedUser = null
          await chatStore.getConversations()
        }
      } catch (err) {
        console.error('Failed to block user:', err)
      }
    }
  )
}

const leaveGroup = () => {
  const name = chatStore.selectedGroup?.name
  const groupName = name ? `"${name}"` : 'this group'

  showConfirm(
    'Leave Group',
    `Are you sure you want to leave ${groupName}?`,
    async () => {
      try {
        const groupId = chatStore.selectedGroup._id
        console.log('Leaving group:', groupId)

        const result = await groupsStore.leaveGroup(groupId)

        if (result.success) {
          console.log('Left group successfully')
          chatStore.selectedGroup = null
          chatStore.messages = []
          await groupsStore.fetchGroups()
          emit('close')
        } else {
          console.error('Failed to leave group:', result.error)
        }
      } catch (err) {
        console.error('Leave group error:', err)
      }
    }
  )
}

const deleteConversation = () => {
  const name = chatStore.selectedGroup ? chatStore.selectedGroup.name : chatStore.selectedUser?.username
  const type = chatStore.selectedGroup ? 'group' : 'conversation'

  showConfirm(
    `Delete ${type === 'group' ? 'Group' : 'Conversation'}`,
    `Are you sure you want to delete this ${type}${name ? ` with ${name}` : ''}? This cannot be undone.`,
    async () => {
      try {
        if (chatStore.selectedGroup) {
          // For groups, delete the group (only creator can do this)
          const groupId = chatStore.selectedGroup._id
          console.log('Deleting group:', groupId)

          const response = await fetch(`${authStore.API_URL}/api/groups/${groupId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authStore.token}` }
          })

          if (response.ok) {
            console.log('Group deleted successfully')
            chatStore.selectedGroup = null
            chatStore.messages = []
            await chatStore.getConversations()
            emit('close')
          } else {
            const error = await response.json()
            console.error('Failed to delete group:', error)
          }
        } else if (chatStore.selectedUser) {
          // For direct conversations, find and delete the conversation
          const userId = chatStore.selectedUser.id || chatStore.selectedUser._id
          console.log('Finding conversation for user:', userId)

          const conversationsResponse = await fetch(`${authStore.API_URL}/api/messages/conversations`, {
            headers: { 'Authorization': `Bearer ${authStore.token}` }
          })
          const data = await conversationsResponse.json()
          console.log('All conversations:', data.conversations)

          const conversation = data.conversations.find(c => {
            const otherUserId = c.otherUser.id || c.otherUser._id
            return otherUserId === userId
          })

          console.log('Found conversation:', conversation)

          if (conversation) {
            const conversationId = conversation.id || conversation._id
            console.log('Deleting conversation:', conversationId)

            const response = await fetch(`${authStore.API_URL}/api/messages/conversations/${conversationId}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${authStore.token}` }
            })

            if (response.ok) {
              console.log('Conversation deleted successfully')
              chatStore.selectedUser = null
              chatStore.messages = []
              await chatStore.getConversations()
              emit('close')
            } else {
              const error = await response.json()
              console.error('Failed to delete conversation:', error)
            }
          } else {
            console.log('No conversation found to delete')
            // Même s'il n'y a pas de conversation, on ferme quand même
            chatStore.selectedUser = null
            chatStore.messages = []
            emit('close')
          }
        }
      } catch (err) {
        console.error('Delete error:', err)
      }
    }
  )
}
</script>

<template>
  <div class="conversation-info">
    <div class="info-header">
      <button @click="emit('close')" class="btn-back">
        <ArrowLeft :size="24" />
      </button>
      <h2>{{ isGroup ? 'Group Info' : 'Contact Info' }}</h2>
    </div>

    <div class="info-content">
      <!-- Avatar and Name -->
      <div class="info-profile">
        <div class="avatar-large">
          <img
            v-if="conversationUser?.avatar"
            :src="`${authStore.API_URL}${conversationUser.avatar}`"
            alt="avatar"
          />
          <div v-else class="avatar-placeholder-large">
            {{ conversationUser?.username?.charAt(0).toUpperCase() || conversationUser?.name?.charAt(0).toUpperCase() }}
          </div>
        </div>
        <h3>{{ conversationUser?.username || conversationUser?.name }}</h3>
        <p v-if="!isGroup" class="status-text">{{ conversationUser?.statusMessage || 'Hey there! I am using WhatsApp.' }}</p>
        <p v-if="isGroup" class="members-count">
          <Users :size="16" />
          {{ conversationUser?.members?.length || 0 }} members
        </p>
      </div>

      <!-- About Section -->
      <div class="info-section">
        <div class="section-label">About</div>
        <div class="section-item">
          <div class="item-icon">
            <Calendar :size="20" />
          </div>
          <div class="item-content">
            <div class="item-label">{{ isGroup ? 'Created' : 'Joined' }}</div>
            <div class="item-value">{{ createdDate }}</div>
          </div>
        </div>
        <div v-if="!isGroup && conversationUser?.email" class="section-item">
          <div class="item-icon">📧</div>
          <div class="item-content">
            <div class="item-label">Email</div>
            <div class="item-value">{{ conversationUser.email }}</div>
          </div>
        </div>
      </div>

      <!-- Notification Settings -->
      <div class="info-section">
        <div class="section-label">Notification Settings</div>
        <button @click="toggleNotifications" class="section-item-button">
          <div class="item-icon">
            <BellOff v-if="notificationsMuted" :size="20" />
            <Bell v-else :size="20" />
          </div>
          <div class="item-content">
            <div class="item-label">Mute Notifications</div>
            <div class="item-value">{{ notificationsMuted ? 'Muted' : 'Enabled' }}</div>
          </div>
        </button>
      </div>

      <!-- Media, Links, Docs -->
      <div class="info-section">
        <div class="section-label">Media, Links and Docs</div>
        <button class="section-item-button" @click="showMediaGallery = !showMediaGallery">
          <div class="item-icon">
            <Image :size="20" />
          </div>
          <div class="item-content">
            <div class="item-label">Media</div>
            <div class="item-value">View all</div>
          </div>
        </button>
      </div>

      <!-- Group Settings (if group) -->
      <div v-if="isGroup" class="info-section">
        <div class="section-label">Group Settings</div>
        <button class="section-item-button" @click="showGroupMembers = true">
          <div class="item-icon">
            <Users :size="20" />
          </div>
          <div class="item-content">
            <div class="item-label">View Members</div>
            <div class="item-value">{{ conversationUser?.members?.length || 0 }}</div>
          </div>
        </button>
      </div>

      <!-- Danger Zone -->
      <div class="info-section danger-section">
        <button v-if="!isGroup" @click="blockUser" class="danger-button">
          Block {{ conversationUser?.username }}
        </button>
        <button v-if="isGroup && isGroupCreator" @click="deleteConversation" class="danger-button">
          Delete Group
        </button>
        <button v-else-if="isGroup && !isGroupCreator" @click="leaveGroup" class="danger-button">
          Leave Group
        </button>
        <button v-if="!isGroup" @click="deleteConversation" class="danger-button">
          Delete Conversation
        </button>
      </div>
    </div>

    <!-- Group Members Modal -->
    <div v-if="showGroupMembers && isGroup" class="members-modal-overlay" @click="showGroupMembers = false">
      <div class="members-modal" @click.stop>
        <GroupMembers :group="conversationUser" @close="showGroupMembers = false" />
      </div>
    </div>

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
  </div>
</template>

<style scoped>
.conversation-info {
  width: 100%;
  height: 100%;
  background: var(--bg-primary);
  display: flex;
  flex-direction: column;
}

.info-header {
  background: var(--accent-dark);
  color: white;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 20px;
}

.info-header h2 {
  margin: 0;
  font-size: 19px;
  font-weight: 500;
}

.btn-back {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 8px;
  margin: -8px;
  display: flex;
  align-items: center;
}

.info-content {
  flex: 1;
  overflow-y: auto;
}

.info-profile {
  background: var(--bg-secondary);
  padding: 32px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: 10px;
}

.avatar-large {
  width: 200px;
  height: 200px;
  border-radius: 50%;
  overflow: hidden;
  margin-bottom: 16px;
}

.avatar-large img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder-large {
  width: 100%;
  height: 100%;
  background: #00a884;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 72px;
  font-weight: 300;
}

.info-profile h3 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 400;
  color: var(--text-primary);
}

.status-text {
  color: var(--text-secondary);
  font-size: 14px;
  margin: 0;
}

.members-count {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-secondary);
  font-size: 14px;
  margin: 4px 0 0 0;
}

.info-section {
  background: var(--bg-secondary);
  margin-bottom: 10px;
  padding: 8px 0;
}

.section-label {
  padding: 12px 20px 8px;
  font-size: 14px;
  color: var(--accent-dark);
  font-weight: 500;
}

.section-item,
.section-item-button {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 20px;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
  cursor: pointer;
  transition: background 0.2s;
}

.section-item-button:hover {
  background: var(--hover-color);
}

.item-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  font-size: 20px;
}

.item-content {
  flex: 1;
}

.item-label {
  font-size: 16px;
  color: var(--text-primary);
  margin-bottom: 2px;
}

.item-value {
  font-size: 14px;
  color: var(--text-secondary);
}

.danger-section {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.danger-button {
  padding: 12px 16px;
  background: none;
  border: 1px solid var(--danger-color);
  color: var(--danger-color);
  border-radius: 8px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 500;
  transition: all 0.2s;
}

.danger-button:hover {
  background: var(--danger-color);
  color: white;
}

/* Group Members Modal */
.members-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1001;
  display: flex;
  justify-content: center;
  align-items: center;
}

.members-modal {
  width: 100%;
  max-width: 500px;
  height: 80vh;
  max-height: 600px;
  background: var(--bg-primary);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Confirm Modal */
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
</style>
