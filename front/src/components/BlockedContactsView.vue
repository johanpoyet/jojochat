<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useChatStore } from '../stores/chat'
import { ArrowLeft, UserX, Shield, Unlock } from 'lucide-vue-next'

const emit = defineEmits(['close'])

const authStore = useAuthStore()
const chatStore = useChatStore()

const blockedContacts = ref([])
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  await fetchBlockedContacts()
})

const fetchBlockedContacts = async () => {
  loading.value = true
  error.value = ''

  try {
    const response = await fetch(`${authStore.API_URL}/api/users/blocked`, {
      headers: { 'Authorization': `Bearer ${authStore.token}` }
    })

    const data = await response.json()
    if (response.ok) {
      blockedContacts.value = data.blockedUsers || []
    } else {
      error.value = data.error || 'Failed to load blocked contacts'
    }
  } catch (err) {
    error.value = 'Network error'
  } finally {
    loading.value = false
  }
}

const unblockContact = async (userId) => {
  try {
    const response = await fetch(`${authStore.API_URL}/api/users/unblock/${userId}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${authStore.token}` }
    })

    if (response.ok) {
      blockedContacts.value = blockedContacts.value.filter(contact => contact._id !== userId)
      await chatStore.getConversations()
    } else {
      const data = await response.json()
      error.value = data.error || 'Failed to unblock contact'
    }
  } catch (err) {
    error.value = 'Network error'
  }
}

const getAvatarUrl = (contact) => {
  return contact.avatar || null
}

const getInitials = (username) => {
  return username?.charAt(0).toUpperCase() || '?'
}
</script>

<template>
  <div class="blocked-contacts-view">
    <div class="blocked-header">
      <button @click="emit('close')" class="btn-back">
        <ArrowLeft :size="24" />
      </button>
      <h2>Blocked Contacts</h2>
    </div>

    <div class="blocked-content">
      <div class="privacy-notice">
        <Shield :size="24" />
        <p>Blocked contacts cannot send you messages or see your online status. You can unblock them at any time.</p>
      </div>

      <div v-if="loading" class="loading">Loading blocked contacts...</div>

      <div v-else-if="error" class="error-message">{{ error }}</div>

      <div v-else>
        <div v-if="blockedContacts.length === 0" class="no-blocked">
          <UserX :size="48" />
          <p>No blocked contacts</p>
          <span>When you block someone, they'll appear here</span>
        </div>

        <div v-else class="blocked-list">
          <div v-for="contact in blockedContacts" :key="contact._id" class="blocked-item">
            <div class="contact-avatar">
              <img v-if="getAvatarUrl(contact)" :src="getAvatarUrl(contact)" :alt="contact.username" />
              <div v-else class="avatar-placeholder">
                {{ getInitials(contact.username) }}
              </div>
            </div>
            <div class="contact-info">
              <span class="contact-name">{{ contact.username }}</span>
              <span class="contact-email">{{ contact.email }}</span>
            </div>
            <button @click="unblockContact(contact._id)" class="btn-unblock">
              <Unlock :size="18" />
              <span>Unblock</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.blocked-contacts-view {
  width: 100%;
  height: 100%;
  background: var(--bg-primary);
  display: flex;
  flex-direction: column;
}

.blocked-header {
  background: var(--accent-dark);
  color: white;
  padding: 60px 20px 20px;
  display: flex;
  align-items: center;
  gap: 20px;
}

.blocked-header h2 {
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
}

.blocked-content {
  flex: 1;
  overflow-y: auto;
}

.privacy-notice {
  display: flex;
  gap: 16px;
  padding: 20px;
  background: #e7f8f5;
  margin: 10px;
  border-radius: 8px;
}

.privacy-notice svg {
  color: var(--accent-color);
  flex-shrink: 0;
}

.privacy-notice p {
  margin: 0;
  font-size: 14px;
  color: var(--text-primary);
}

.loading {
  padding: 40px;
  text-align: center;
  color: var(--text-secondary);
}

.error-message {
  background: #fee2e2;
  color: var(--danger-color);
  padding: 12px 20px;
  margin: 10px;
  border-radius: 8px;
}

.no-blocked {
  padding: 60px 20px;
  text-align: center;
  color: var(--text-secondary);
}

.no-blocked svg {
  color: var(--text-secondary);
  margin-bottom: 16px;
}

.no-blocked p {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: var(--text-primary);
}

.no-blocked span {
  font-size: 14px;
  color: var(--text-secondary);
}

.blocked-list {
  background: var(--bg-secondary);
  margin-top: 10px;
}

.blocked-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 20px;
  border-bottom: 1px solid var(--border-color);
}

.contact-avatar {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
}

.contact-avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: #d1d7db;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 500;
}

.contact-info {
  flex: 1;
  min-width: 0;
}

.contact-name {
  display: block;
  font-size: 16px;
  color: var(--text-primary);
  font-weight: 500;
  margin-bottom: 2px;
}

.contact-email {
  display: block;
  font-size: 13px;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.btn-unblock {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: var(--accent-color);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background 0.2s;
}

.btn-unblock:hover {
  background: var(--accent-dark);
}

.btn-unblock svg {
  flex-shrink: 0;
}
</style>
