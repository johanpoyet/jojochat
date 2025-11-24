<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { ArrowLeft, Monitor, Smartphone, Tablet, Trash2, Shield } from 'lucide-vue-next'

const emit = defineEmits(['close'])

const authStore = useAuthStore()

const sessions = ref([])
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  await fetchSessions()
})

const fetchSessions = async () => {
  loading.value = true
  error.value = ''

  try {
    const response = await fetch(`${authStore.API_URL}/api/auth/sessions`, {
      headers: { 'Authorization': `Bearer ${authStore.token}` }
    })

    const data = await response.json()
    if (response.ok) {
      sessions.value = data.sessions
    } else {
      error.value = data.error
    }
  } catch (err) {
    error.value = 'Failed to load sessions'
  } finally {
    loading.value = false
  }
}

const getDeviceIcon = (device) => {
  switch (device) {
    case 'mobile': return Smartphone
    case 'tablet': return Tablet
    default: return Monitor
  }
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const revokeSession = async (sessionId) => {
  try {
    const response = await fetch(`${authStore.API_URL}/api/auth/sessions/${sessionId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authStore.token}` }
    })

    if (response.ok) {
      sessions.value = sessions.value.filter(s => s._id !== sessionId)
    }
  } catch (err) {
    error.value = 'Failed to revoke session'
  }
}

const revokeAllSessions = async () => {
  if (!confirm('This will log out all other devices. Continue?')) return

  try {
    const response = await fetch(`${authStore.API_URL}/api/auth/sessions`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authStore.token}` }
    })

    if (response.ok) {
      await fetchSessions()
    }
  } catch (err) {
    error.value = 'Failed to revoke sessions'
  }
}
</script>

<template>
  <div class="sessions-view">
    <div class="sessions-header">
      <button @click="emit('close')" class="btn-back">
        <ArrowLeft :size="24" />
      </button>
      <h2>Active Sessions</h2>
    </div>

    <div class="sessions-content">
      <div class="security-notice">
        <Shield :size="24" />
        <p>These are the devices currently logged into your account. You can log out any session you don't recognize.</p>
      </div>

      <div v-if="loading" class="loading">Loading sessions...</div>

      <div v-else-if="error" class="error-message">{{ error }}</div>

      <div v-else>
        <div v-if="sessions.length > 1" class="revoke-all">
          <button @click="revokeAllSessions" class="btn-revoke-all">
            Log out all other devices
          </button>
        </div>

        <div class="sessions-list">
          <div v-for="session in sessions" :key="session._id" class="session-item">
            <div class="session-icon">
              <component :is="getDeviceIcon(session.device)" :size="24" />
            </div>
            <div class="session-info">
              <span class="session-device">{{ session.device || 'Unknown device' }}</span>
              <span class="session-details">
                {{ session.ip || 'Unknown IP' }}
              </span>
              <span class="session-date">
                Last activity: {{ formatDate(session.lastActivity) }}
              </span>
            </div>
            <button @click="revokeSession(session._id)" class="btn-revoke">
              <Trash2 :size="18" />
            </button>
          </div>
        </div>

        <div v-if="sessions.length === 0" class="no-sessions">
          No active sessions found
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sessions-view {
  width: 100%;
  height: 100%;
  background: #f0f2f5;
  display: flex;
  flex-direction: column;
}

.sessions-header {
  background: #008069;
  color: white;
  padding: 60px 20px 20px;
  display: flex;
  align-items: center;
  gap: 20px;
}

.sessions-header h2 {
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

.sessions-content {
  flex: 1;
  overflow-y: auto;
}

.security-notice {
  display: flex;
  gap: 16px;
  padding: 20px;
  background: #e7f8f5;
  margin: 10px;
  border-radius: 8px;
}

.security-notice svg {
  color: #00a884;
  flex-shrink: 0;
}

.security-notice p {
  margin: 0;
  font-size: 14px;
  color: #111b21;
}

.loading {
  padding: 40px;
  text-align: center;
  color: #667781;
}

.error-message {
  background: #fee2e2;
  color: #dc2626;
  padding: 12px 20px;
  margin: 10px;
  border-radius: 8px;
}

.revoke-all {
  padding: 10px 20px;
}

.btn-revoke-all {
  width: 100%;
  padding: 12px;
  background: #fee2e2;
  color: #dc2626;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  cursor: pointer;
}

.btn-revoke-all:hover {
  background: #fecaca;
}

.sessions-list {
  background: white;
  margin-top: 10px;
}

.session-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f2f5;
}

.session-icon {
  width: 48px;
  height: 48px;
  background: #f0f2f5;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #667781;
}

.session-info {
  flex: 1;
}

.session-device {
  display: block;
  font-size: 16px;
  color: #111b21;
  text-transform: capitalize;
}

.session-details {
  display: block;
  font-size: 13px;
  color: #667781;
  margin-top: 2px;
}

.session-date {
  display: block;
  font-size: 12px;
  color: #8696a0;
  margin-top: 2px;
}

.btn-revoke {
  background: none;
  border: none;
  color: #dc2626;
  cursor: pointer;
  padding: 8px;
}

.btn-revoke:hover {
  background: #fee2e2;
  border-radius: 50%;
}

.no-sessions {
  padding: 40px;
  text-align: center;
  color: #667781;
}
</style>
