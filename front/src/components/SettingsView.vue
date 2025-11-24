<script setup>
import { ref, onMounted } from 'vue'
import { useSettingsStore } from '../stores/settings'
import { useAuthStore } from '../stores/auth'
import {
  ArrowLeft, Moon, Sun, Bell, BellOff, Volume2, VolumeX,
  Keyboard, Lock, LogOut, Trash2, Shield, ChevronRight
} from 'lucide-vue-next'

const emit = defineEmits(['close', 'show-sessions'])

const settingsStore = useSettingsStore()
const authStore = useAuthStore()

const showChangePassword = ref(false)
const showDeleteAccount = ref(false)
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const deletePassword = ref('')
const loading = ref(false)
const error = ref('')
const success = ref('')

onMounted(() => {
  settingsStore.init()
})

const handleChangePassword = async () => {
  error.value = ''
  success.value = ''

  if (!currentPassword.value || !newPassword.value || !confirmPassword.value) {
    error.value = 'All fields are required'
    return
  }

  if (newPassword.value !== confirmPassword.value) {
    error.value = 'Passwords do not match'
    return
  }

  if (newPassword.value.length < 6) {
    error.value = 'Password must be at least 6 characters'
    return
  }

  loading.value = true

  try {
    const response = await fetch(`${authStore.API_URL}/api/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      },
      body: JSON.stringify({
        currentPassword: currentPassword.value,
        newPassword: newPassword.value
      })
    })

    const data = await response.json()

    if (response.ok) {
      success.value = 'Password changed successfully'
      currentPassword.value = ''
      newPassword.value = ''
      confirmPassword.value = ''
      setTimeout(() => {
        showChangePassword.value = false
        success.value = ''
      }, 2000)
    } else {
      error.value = data.error
    }
  } catch (err) {
    error.value = 'Network error'
  } finally {
    loading.value = false
  }
}

const handleDeleteAccount = async () => {
  error.value = ''

  if (!deletePassword.value) {
    error.value = 'Password is required'
    return
  }

  loading.value = true

  try {
    const response = await fetch(`${authStore.API_URL}/api/auth/account`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      },
      body: JSON.stringify({ password: deletePassword.value })
    })

    if (response.ok) {
      authStore.logout()
    } else {
      const data = await response.json()
      error.value = data.error
    }
  } catch (err) {
    error.value = 'Network error'
  } finally {
    loading.value = false
  }
}

const handleLogout = () => {
  authStore.logout()
}
</script>

<template>
  <div class="settings-view">
    <div class="settings-header">
      <button @click="emit('close')" class="btn-back">
        <ArrowLeft :size="24" />
      </button>
      <h2>Settings</h2>
    </div>

    <div class="settings-content">
      <div class="settings-section">
        <h3>Appearance</h3>

        <div class="setting-item" @click="settingsStore.toggleDarkMode()">
          <div class="setting-icon" :class="{ active: settingsStore.darkMode }">
            <Moon v-if="settingsStore.darkMode" :size="22" />
            <Sun v-else :size="22" />
          </div>
          <div class="setting-info">
            <span class="setting-name">Dark Mode</span>
            <span class="setting-desc">{{ settingsStore.darkMode ? 'On' : 'Off' }}</span>
          </div>
          <div class="toggle" :class="{ active: settingsStore.darkMode }">
            <div class="toggle-knob"></div>
          </div>
        </div>
      </div>

      <div class="settings-section">
        <h3>Notifications</h3>

        <div class="setting-item" @click="settingsStore.setNotifications(!settingsStore.notifications)">
          <div class="setting-icon" :class="{ active: settingsStore.notifications }">
            <Bell v-if="settingsStore.notifications" :size="22" />
            <BellOff v-else :size="22" />
          </div>
          <div class="setting-info">
            <span class="setting-name">Push Notifications</span>
            <span class="setting-desc">{{ settingsStore.notifications ? 'Enabled' : 'Disabled' }}</span>
          </div>
          <div class="toggle" :class="{ active: settingsStore.notifications }">
            <div class="toggle-knob"></div>
          </div>
        </div>

        <div class="setting-item" @click="settingsStore.setSoundEnabled(!settingsStore.soundEnabled)">
          <div class="setting-icon" :class="{ active: settingsStore.soundEnabled }">
            <Volume2 v-if="settingsStore.soundEnabled" :size="22" />
            <VolumeX v-else :size="22" />
          </div>
          <div class="setting-info">
            <span class="setting-name">Message Sounds</span>
            <span class="setting-desc">{{ settingsStore.soundEnabled ? 'On' : 'Off' }}</span>
          </div>
          <div class="toggle" :class="{ active: settingsStore.soundEnabled }">
            <div class="toggle-knob"></div>
          </div>
        </div>
      </div>

      <div class="settings-section">
        <h3>Chat</h3>

        <div class="setting-item" @click="settingsStore.setEnterToSend(!settingsStore.enterToSend)">
          <div class="setting-icon" :class="{ active: settingsStore.enterToSend }">
            <Keyboard :size="22" />
          </div>
          <div class="setting-info">
            <span class="setting-name">Enter to Send</span>
            <span class="setting-desc">Press Enter to send messages</span>
          </div>
          <div class="toggle" :class="{ active: settingsStore.enterToSend }">
            <div class="toggle-knob"></div>
          </div>
        </div>
      </div>

      <div class="settings-section">
        <h3>Security</h3>

        <div class="setting-item" @click="emit('show-sessions')">
          <div class="setting-icon">
            <Shield :size="22" />
          </div>
          <div class="setting-info">
            <span class="setting-name">Active Sessions</span>
            <span class="setting-desc">Manage your logged-in devices</span>
          </div>
          <ChevronRight :size="20" class="chevron" />
        </div>

        <div class="setting-item" @click="showChangePassword = true">
          <div class="setting-icon">
            <Lock :size="22" />
          </div>
          <div class="setting-info">
            <span class="setting-name">Change Password</span>
            <span class="setting-desc">Update your password</span>
          </div>
          <ChevronRight :size="20" class="chevron" />
        </div>
      </div>

      <div class="settings-section">
        <h3>Account</h3>

        <div class="setting-item danger" @click="handleLogout">
          <div class="setting-icon danger">
            <LogOut :size="22" />
          </div>
          <div class="setting-info">
            <span class="setting-name">Log Out</span>
            <span class="setting-desc">Sign out of your account</span>
          </div>
        </div>

        <div class="setting-item danger" @click="showDeleteAccount = true">
          <div class="setting-icon danger">
            <Trash2 :size="22" />
          </div>
          <div class="setting-info">
            <span class="setting-name">Delete Account</span>
            <span class="setting-desc">Permanently delete your account</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showChangePassword" class="modal-overlay" @click.self="showChangePassword = false">
      <div class="modal-content">
        <h3>Change Password</h3>

        <div v-if="error" class="error-message">{{ error }}</div>
        <div v-if="success" class="success-message">{{ success }}</div>

        <div class="form-group">
          <label>Current Password</label>
          <input v-model="currentPassword" type="password" placeholder="Enter current password" />
        </div>

        <div class="form-group">
          <label>New Password</label>
          <input v-model="newPassword" type="password" placeholder="Enter new password" />
        </div>

        <div class="form-group">
          <label>Confirm New Password</label>
          <input v-model="confirmPassword" type="password" placeholder="Confirm new password" />
        </div>

        <div class="modal-actions">
          <button @click="showChangePassword = false" class="btn-cancel">Cancel</button>
          <button @click="handleChangePassword" class="btn-save" :disabled="loading">
            {{ loading ? 'Saving...' : 'Save' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="showDeleteAccount" class="modal-overlay" @click.self="showDeleteAccount = false">
      <div class="modal-content danger">
        <h3>Delete Account</h3>
        <p class="warning-text">
          This action is permanent and cannot be undone. All your messages, contacts, and data will be deleted.
        </p>

        <div v-if="error" class="error-message">{{ error }}</div>

        <div class="form-group">
          <label>Enter your password to confirm</label>
          <input v-model="deletePassword" type="password" placeholder="Password" />
        </div>

        <div class="modal-actions">
          <button @click="showDeleteAccount = false" class="btn-cancel">Cancel</button>
          <button @click="handleDeleteAccount" class="btn-delete" :disabled="loading">
            {{ loading ? 'Deleting...' : 'Delete Account' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-view {
  width: 100%;
  height: 100%;
  background: #f0f2f5;
  display: flex;
  flex-direction: column;
}

.settings-header {
  background: #008069;
  color: white;
  padding: 60px 20px 20px;
  display: flex;
  align-items: center;
  gap: 20px;
}

.settings-header h2 {
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

.settings-content {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 20px;
}

.settings-section {
  margin-top: 10px;
}

.settings-section h3 {
  padding: 14px 20px 8px;
  margin: 0;
  font-size: 14px;
  color: #008069;
  font-weight: 500;
}

.setting-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 20px;
  background: white;
  cursor: pointer;
  transition: background 0.2s;
  border-bottom: 1px solid #f0f2f5;
}

.setting-item:hover {
  background: #f5f6f6;
}

.setting-item.danger .setting-name {
  color: #dc2626;
}

.setting-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #f0f2f5;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #667781;
}

.setting-icon.active {
  background: #e7f8f5;
  color: #00a884;
}

.setting-icon.danger {
  background: #fee2e2;
  color: #dc2626;
}

.setting-info {
  flex: 1;
}

.setting-name {
  display: block;
  font-size: 16px;
  color: #111b21;
}

.setting-desc {
  display: block;
  font-size: 13px;
  color: #667781;
  margin-top: 2px;
}

.toggle {
  width: 44px;
  height: 24px;
  background: #d1d7db;
  border-radius: 12px;
  position: relative;
  transition: background 0.2s;
}

.toggle.active {
  background: #00a884;
}

.toggle-knob {
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  position: absolute;
  top: 2px;
  left: 2px;
  transition: transform 0.2s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}

.toggle.active .toggle-knob {
  transform: translateX(20px);
}

.chevron {
  color: #667781;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  padding: 24px;
  width: 90%;
  max-width: 400px;
}

.modal-content h3 {
  margin: 0 0 20px 0;
  font-size: 18px;
  color: #111b21;
}

.modal-content.danger h3 {
  color: #dc2626;
}

.warning-text {
  color: #667781;
  font-size: 14px;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-size: 14px;
  color: #667781;
  margin-bottom: 8px;
}

.form-group input {
  width: 100%;
  padding: 12px;
  border: 1px solid #e9edef;
  border-radius: 8px;
  font-size: 15px;
  box-sizing: border-box;
}

.form-group input:focus {
  outline: none;
  border-color: #00a884;
}

.error-message {
  background: #fee2e2;
  color: #dc2626;
  padding: 12px;
  border-radius: 8px;
  font-size: 14px;
  margin-bottom: 16px;
}

.success-message {
  background: #d1fae5;
  color: #059669;
  padding: 12px;
  border-radius: 8px;
  font-size: 14px;
  margin-bottom: 16px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

.btn-cancel {
  background: none;
  border: none;
  color: #667781;
  padding: 12px 24px;
  cursor: pointer;
  font-size: 15px;
}

.btn-save {
  background: #00a884;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 15px;
}

.btn-save:disabled {
  opacity: 0.5;
}

.btn-delete {
  background: #dc2626;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 15px;
}

.btn-delete:disabled {
  opacity: 0.5;
}
</style>
