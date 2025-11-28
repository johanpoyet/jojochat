<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useContactsStore } from '../stores/contacts'
import { useGroupsStore } from '../stores/groups'
import { ArrowLeft, Crown, User, Shield, X, UserPlus } from 'lucide-vue-next'

const props = defineProps({
  group: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close'])

const authStore = useAuthStore()
const contactsStore = useContactsStore()
const groupsStore = useGroupsStore()
const members = ref([])
const availableUsers = ref([])
const loading = ref(true)
const loadingUsers = ref(false)
const error = ref('')
const showAddUsers = ref(false)

const groupCreatorId = ref(null)
const confirmModal = ref({ show: false, title: '', message: '', onConfirm: null })

const isCurrentUserCreator = computed(() => {
  const creatorId = groupCreatorId.value || props.group.creator || props.group.createdBy
  const userId = authStore.user?.id

  return creatorId === userId ||
         creatorId?._id === userId
})

onMounted(async () => {
  await fetchMembers()
})

const fetchMembers = async () => {
  loading.value = true
  error.value = ''

  console.log('=== fetchMembers Debug ===')
  console.log('Group object:', props.group)
  console.log('Group ID:', props.group._id)
  console.log('API URL:', `${authStore.API_URL}/api/groups/${props.group._id}/members`)

  try {
    const response = await fetch(`${authStore.API_URL}/api/groups/${props.group._id}/members`, {
      headers: { 'Authorization': `Bearer ${authStore.token}` }
    })

    console.log('Response status:', response.status)

    if (response.ok) {
      const data = await response.json()
      console.log('Success! Members:', data)
      members.value = data.members || []
      groupCreatorId.value = data.createdBy
    } else {
      const data = await response.json()
      console.error('Error response:', data)
      error.value = data.error || 'Failed to load members'
      if (data.debug) {
        console.error('Debug info:', data.debug)
      }
    }
  } catch (err) {
    console.error('Network error:', err)
    error.value = 'Network error'
  } finally {
    loading.value = false
  }
}

const isCreator = (memberId) => {
  const creatorId = groupCreatorId.value || props.group.creator || props.group.createdBy
  return memberId === creatorId ||
         memberId === creatorId?._id ||
         memberId?.toString() === creatorId?.toString()
}

const isGroupAdmin = (member) => {
  return member.role === 'admin' || member.role === 'moderator'
}

const getMemberRole = (member) => {
  if (member.role === 'creator') return 'Creator'
  if (member.role === 'admin') return 'Admin'
  if (member.role === 'moderator') return 'Moderator'
  return 'Member'
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

const removeMember = async (memberId, memberUsername) => {
  // Only creator can remove members
  if (!isCurrentUserCreator.value) return

  showConfirm(
    'Remove Member',
    `Are you sure you want to remove ${memberUsername} from the group?`,
    async () => {
      try {
        const response = await fetch(`${authStore.API_URL}/api/groups/${props.group._id}/members/${memberId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${authStore.token}` }
        })

        if (response.ok) {
          members.value = members.value.filter(m => m._id !== memberId)
        } else {
          const data = await response.json()
          error.value = data.error || 'Failed to remove member'
        }
      } catch (err) {
        error.value = 'Network error'
      }
    }
  )
}

const fetchAvailableUsers = async () => {
  loadingUsers.value = true
  try {
    const result = await contactsStore.getAllUsers()
    if (result.success) {
      // Filter out users who are already members of the group
      const memberIds = members.value.map(m => m._id.toString())
      availableUsers.value = result.users.filter(user => {
        const userId = user.id || user._id
        return !memberIds.includes(userId.toString())
      })
    } else {
      error.value = result.error || 'Failed to load users'
    }
  } catch (err) {
    error.value = 'Network error'
  } finally {
    loadingUsers.value = false
  }
}

const toggleAddUsers = async () => {
  showAddUsers.value = !showAddUsers.value
  if (showAddUsers.value && availableUsers.value.length === 0) {
    await fetchAvailableUsers()
  }
}

const addUserToGroup = async (userId, username) => {
  try {
    const result = await groupsStore.addMemberToGroup(props.group._id, userId)
    if (result.success) {
      // Refresh members list
      await fetchMembers()
      // Refresh available users list
      await fetchAvailableUsers()
    } else {
      error.value = result.error || 'Failed to add member'
    }
  } catch (err) {
    error.value = 'Network error'
  }
}
</script>

<template>
  <div class="group-members">
    <div class="members-header">
      <button @click="emit('close')" class="btn-back">
        <ArrowLeft :size="24" />
      </button>
      <h2>{{ group.name }} Members</h2>
    </div>

    <div class="members-count">
      {{ members.length }} {{ members.length === 1 ? 'member' : 'members' }}
    </div>

    <!-- Add Users Section (For all members) -->
    <div class="add-users-section">
      <button @click="toggleAddUsers" class="btn-add-users">
        <UserPlus :size="20" />
        <span>{{ showAddUsers ? 'Hide Available Users' : 'Add New Members' }}</span>
      </button>
    </div>

    <div class="members-content">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading members...</p>
      </div>

      <div v-else-if="error" class="error-state">
        <p>{{ error }}</p>
        <button @click="fetchMembers" class="btn-retry">Retry</button>
      </div>

      <div v-else class="members-list">
        <div class="section-title">Current Members</div>
        <div
          v-for="member in members"
          :key="member._id"
          class="member-item"
        >
          <div class="member-avatar">
            <img
              v-if="member.avatar"
              :src="`${authStore.API_URL}${member.avatar}`"
              alt="avatar"
            />
            <div v-else class="avatar-placeholder">
              {{ member.username?.charAt(0).toUpperCase() }}
            </div>
          </div>

          <div class="member-info">
            <div class="member-name">
              {{ member.username }}
              <span v-if="member._id === authStore.user?.id" class="you-label">(You)</span>
            </div>
            <div class="member-role" :class="{ 'role-creator': member.role === 'creator', 'role-admin': isGroupAdmin(member) }">
              <Crown v-if="member.role === 'creator'" :size="14" />
              <Shield v-else-if="isGroupAdmin(member)" :size="14" />
              <User v-else :size="14" />
              <span>{{ getMemberRole(member) }}</span>
            </div>
          </div>

          <button
            v-if="isCurrentUserCreator && member.role !== 'creator' && member._id !== authStore.user?.id"
            @click="removeMember(member._id, member.username)"
            class="btn-remove"
          >
            Remove
          </button>
        </div>

        <!-- Available Users to Add -->
        <div v-if="showAddUsers" class="available-users-section">
          <div class="section-title">Add Members</div>

          <div v-if="loadingUsers" class="loading-state">
            <div class="spinner"></div>
            <p>Loading users...</p>
          </div>

          <div v-else-if="availableUsers.length === 0" class="empty-state">
            <p>All users are already members of this group.</p>
          </div>

          <div v-else class="available-users-list">
            <div
              v-for="user in availableUsers"
              :key="user.id || user._id"
              class="user-item"
            >
              <div class="member-avatar">
                <img
                  v-if="user.avatar"
                  :src="`${authStore.API_URL}${user.avatar}`"
                  alt="avatar"
                />
                <div v-else class="avatar-placeholder">
                  {{ user.username?.charAt(0).toUpperCase() }}
                </div>
              </div>

              <div class="member-info">
                <div class="member-name">{{ user.username }}</div>
                <div class="user-status">{{ user.statusMessage || 'Available' }}</div>
              </div>

              <button
                @click="addUserToGroup(user.id || user._id, user.username)"
                class="btn-add"
              >
                <UserPlus :size="16" />
                Add
              </button>
            </div>
          </div>
        </div>
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
.group-members {
  width: 100%;
  height: 100%;
  background: var(--bg-primary);
  display: flex;
  flex-direction: column;
}

.members-header {
  background: var(--accent-dark);
  color: white;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 20px;
}

.members-header h2 {
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

.members-count {
  background: var(--bg-secondary);
  padding: 12px 20px;
  font-size: 14px;
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border-color);
}

.add-users-section {
  background: var(--bg-secondary);
  padding: 12px 20px;
  border-bottom: 1px solid var(--border-color);
}

.btn-add-users {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  background: var(--accent-color);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background 0.2s;
}

.btn-add-users:hover {
  background: var(--accent-dark);
}

.members-content {
  flex: 1;
  overflow-y: auto;
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  color: var(--text-secondary);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border-color);
  border-top-color: var(--accent-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.btn-retry {
  margin-top: 12px;
  padding: 8px 16px;
  background: var(--accent-color);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.btn-retry:hover {
  background: var(--accent-dark);
}

.members-list {
  background: var(--bg-secondary);
}

.section-title {
  padding: 16px 20px 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--accent-dark);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.available-users-section {
  margin-top: 16px;
  border-top: 2px solid var(--border-color);
}

.empty-state {
  padding: 32px 20px;
  text-align: center;
  color: var(--text-secondary);
  font-size: 14px;
}

.available-users-list {
  background: var(--bg-secondary);
}

.user-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  border-bottom: 1px solid var(--border-color);
  transition: background 0.2s;
}

.user-item:hover {
  background: var(--hover-color);
}

.user-status {
  font-size: 13px;
  color: var(--text-secondary);
}

.btn-add {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: var(--accent-color);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-add:hover {
  background: var(--accent-dark);
  transform: scale(1.05);
}

.member-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  border-bottom: 1px solid var(--border-color);
  transition: background 0.2s;
}

.member-item:hover {
  background: var(--hover-color);
}

.member-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.member-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  background: #00a884;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 500;
}

.member-info {
  flex: 1;
  min-width: 0;
}

.member-name {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 2px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.you-label {
  font-size: 13px;
  font-weight: 400;
  color: var(--text-secondary);
}

.member-role {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: var(--text-secondary);
}

.role-creator {
  color: #f59e0b;
}

.role-admin {
  color: #3b82f6;
}

.btn-remove {
  padding: 6px 12px;
  background: none;
  border: 1px solid var(--danger-color);
  color: var(--danger-color);
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.btn-remove:hover {
  background: var(--danger-color);
  color: white;
}

/* Custom Modal */
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
