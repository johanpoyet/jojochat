<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { ArrowLeft, Monitor, Smartphone, Tablet, Trash2, Shield } from 'lucide-vue-next'

const emit = defineEmits(['close'])

const authStore = useAuthStore()

const sessions = ref([])
const loading = ref(true)
const error = ref('')
const success = ref('')

onMounted(async () => {
  await fetchSessions()
})

const fetchSessions = async () => {
  loading.value = true
  error.value = ''
  success.value = ''

  try {
    const response = await fetch(`${authStore.API_URL}/api/auth/sessions`, {
      headers: { 'Authorization': `Bearer ${authStore.token}` }
    })

    const data = await response.json()
    if (response.ok) {
      sessions.value = data.sessions || []
    } else {
      error.value = data.error || 'Erreur lors du chargement'
    }
  } catch (err) {
    error.value = 'Échec du chargement des sessions'
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

const getDeviceName = (device) => {
  const names = {
    'mobile': 'Mobile',
    'tablet': 'Tablette',
    'desktop': 'Ordinateur',
    'unknown': 'Appareil inconnu'
  }
  return names[device] || 'Appareil inconnu'
}

const formatDate = (date) => {
  if (!date) return 'Unknown'
  try {
    return new Date(date).toLocaleDateString('fr-FR', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (e) {
    return 'Invalid date'
  }
}

const revokeSession = async (sessionId) => {
  if (!sessionId) {
    error.value = 'ID de session invalide'
    return
  }

  const session = sessions.value.find(s => (s._id || s.id) === sessionId)
  const isCurrent = session?.isCurrent

  if (!confirm('Êtes-vous sûr de vouloir déconnecter cet appareil ?')) return

  error.value = ''
  loading.value = true

  try {
    const response = await fetch(`${authStore.API_URL}/api/auth/sessions/${sessionId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authStore.token}` }
    })

    const data = await response.json()

    if (response.ok) {
      // If we revoked the current session, logout
      if (isCurrent) {
        success.value = 'Session déconnectée avec succès'
        setTimeout(() => {
          authStore.logout()
        }, 1000)
        return
      }
      // Remove the session from the list
      sessions.value = sessions.value.filter(s => {
        const id = s._id || s.id
        return id !== sessionId
      })
      success.value = 'Appareil déconnecté avec succès'
      setTimeout(() => {
        success.value = ''
      }, 3000)
    } else {
      error.value = data.error || 'Échec de la révocation de la session'
      setTimeout(() => {
        error.value = ''
      }, 5000)
    }
  } catch (err) {
    error.value = 'Erreur réseau lors de la révocation de la session'
  } finally {
    loading.value = false
  }
}

const revokeAllSessions = async () => {
  if (!confirm('Cela déconnectera tous les autres appareils. Continuer ?')) return

  try {
    const response = await fetch(`${authStore.API_URL}/api/auth/sessions`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authStore.token}` }
    })

    if (response.ok) {
      await fetchSessions()
    }
  } catch (err) {
    error.value = 'Échec de la révocation des sessions'
  }
}
</script>

<template>
  <div class="sessions-view">
    <div class="sessions-header">
      <button @click="emit('close')" class="btn-back">
        <ArrowLeft :size="24" />
      </button>
      <h2>Sessions actives</h2>
    </div>

    <div class="sessions-content">
      <div class="security-notice">
        <Shield :size="24" />
        <p>Voici les appareils actuellement connectés à votre compte. Vous pouvez déconnecter toute session que vous ne reconnaissez pas.</p>
      </div>

      <div v-if="loading" class="loading">Chargement des sessions...</div>

      <div v-if="success" class="success-message">{{ success }}</div>
      <div v-if="error" class="error-message">{{ error }}</div>

      <div v-else>
        <div v-if="sessions.filter(s => !s.isCurrent).length > 0" class="revoke-all">
          <button @click="revokeAllSessions" class="btn-revoke-all">
            Déconnecter tous les autres appareils
          </button>
        </div>

        <div class="sessions-list">
          <div v-for="session in sessions" :key="session._id || session.id" class="session-item" :class="{ 'current-session': session.isCurrent }">
            <div class="session-icon">
              <component :is="getDeviceIcon(session.device)" :size="24" />
            </div>
            <div class="session-info">
              <div class="session-header">
                <span class="session-device">{{ getDeviceName(session.device) }}</span>
                <span v-if="session.isCurrent" class="current-badge">Appareil actuel</span>
              </div>
              <span class="session-details">
                {{ session.ip || 'IP inconnue' }}
              </span>
              <span class="session-date">
                Dernière activité : {{ formatDate(session.lastActivity) }}
              </span>
            </div>
            <button 
              v-if="!session.isCurrent" 
              @click="revokeSession(session._id || session.id)" 
              class="btn-revoke"
              title="Déconnecter cet appareil"
              :disabled="loading"
            >
              <Trash2 :size="18" />
            </button>
          </div>
        </div>

        <div v-if="sessions.length === 0" class="no-sessions">
          Aucune session active trouvée
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sessions-view {
  width: 100%;
  height: 100%;
  background: var(--bg-primary);
  display: flex;
  flex-direction: column;
}

.sessions-header {
  background: var(--accent-dark);
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
  color: var(--accent-color);
  flex-shrink: 0;
}

.security-notice p {
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

.success-message {
  background: #d1fae5;
  color: #059669;
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
  background: var(--bg-secondary);
  margin-top: 10px;
}

.session-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
}

.session-item.current-session {
  background: #e7f8f5;
}

.session-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.current-badge {
  background: var(--accent-color);
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
}

.session-icon {
  width: 48px;
  height: 48px;
  background: var(--bg-tertiary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
}

.session-info {
  flex: 1;
}

.session-device {
  display: block;
  font-size: 16px;
  color: var(--text-primary);
  text-transform: capitalize;
}

.session-details {
  display: block;
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 2px;
}

.session-date {
  display: block;
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 2px;
}

.btn-revoke {
  background: none;
  border: none;
  color: var(--danger-color);
  cursor: pointer;
  padding: 8px;
}

.btn-revoke:hover:not(:disabled) {
  background: #fee2e2;
  border-radius: 50%;
}

.btn-revoke:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.no-sessions {
  padding: 40px;
  text-align: center;
  color: var(--text-secondary);
}
</style>
