<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { ArrowLeft, Camera, Check, X } from 'lucide-vue-next'

const emit = defineEmits(['close'])
const authStore = useAuthStore()

const username = ref('')
const statusMessage = ref('')
const editing = ref(null)
const loading = ref(false)
const error = ref('')

onMounted(() => {
  username.value = authStore.user?.username || ''
  statusMessage.value = authStore.user?.statusMessage || ''
})

const startEdit = (field) => {
  editing.value = field
}

const cancelEdit = () => {
  username.value = authStore.user?.username || ''
  statusMessage.value = authStore.user?.statusMessage || ''
  editing.value = null
}

const saveProfile = async () => {
  loading.value = true
  error.value = ''

  try {
    const response = await fetch(`${authStore.API_URL}/api/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      },
      body: JSON.stringify({
        username: username.value,
        statusMessage: statusMessage.value
      })
    })

    const data = await response.json()

    if (!response.ok) {
      error.value = data.error || 'Failed to update profile'
      return
    }

    authStore.user = { ...authStore.user, ...data }
    editing.value = null
  } catch (err) {
    error.value = 'Network error'
  } finally {
    loading.value = false
  }
}

const handleAvatarUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  // Validate file type
  if (!file.type.startsWith('image/')) {
    error.value = 'Please select an image file'
    return
  }

  // Validate file size (5MB max)
  if (file.size > 5 * 1024 * 1024) {
    error.value = 'Image must be less than 5MB'
    return
  }

  const formData = new FormData()
  formData.append('avatar', file)

  loading.value = true
  error.value = ''

  try {
    const response = await fetch(`${authStore.API_URL}/api/users/avatar`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      },
      body: formData
    })

    const data = await response.json()

    if (response.ok) {
      authStore.user = { ...authStore.user, avatar: data.avatar }
      localStorage.setItem('user', JSON.stringify(authStore.user))
    } else {
      error.value = data.error || 'Failed to upload avatar'
    }
  } catch (err) {
    error.value = 'Network error'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="profile-view">
    <div class="profile-header">
      <button @click="emit('close')" class="btn-back">
        <ArrowLeft :size="24" />
      </button>
      <h2>Profile</h2>
    </div>

    <div class="profile-content">
      <div class="avatar-section">
        <div class="avatar-wrapper">
          <img
            v-if="authStore.user?.avatar"
            :src="`${authStore.API_URL}${authStore.user.avatar}`"
            alt="avatar"
            class="avatar"
          />
          <div v-else class="avatar-placeholder">
            {{ authStore.user?.username?.charAt(0).toUpperCase() }}
          </div>
          <label class="avatar-edit">
            <Camera :size="20" />
            <input type="file" accept="image/*" @change="handleAvatarUpload" hidden />
          </label>
        </div>
      </div>

      <div v-if="error" class="error-message">{{ error }}</div>

      <div class="profile-field">
        <label>Your Name</label>
        <div class="field-content">
          <input
            v-if="editing === 'username'"
            v-model="username"
            type="text"
            @keyup.enter="saveProfile"
          />
          <span v-else>{{ authStore.user?.username }}</span>
          <div class="field-actions">
            <template v-if="editing === 'username'">
              <button @click="saveProfile" :disabled="loading">
                <Check :size="20" />
              </button>
              <button @click="cancelEdit">
                <X :size="20" />
              </button>
            </template>
            <button v-else @click="startEdit('username')" class="btn-edit">
              Edit
            </button>
          </div>
        </div>
      </div>

      <div class="profile-field">
        <label>About</label>
        <div class="field-content">
          <input
            v-if="editing === 'status'"
            v-model="statusMessage"
            type="text"
            maxlength="120"
            @keyup.enter="saveProfile"
          />
          <span v-else>{{ authStore.user?.statusMessage || 'Hey there! I am using WhatsApp.' }}</span>
          <div class="field-actions">
            <template v-if="editing === 'status'">
              <button @click="saveProfile" :disabled="loading">
                <Check :size="20" />
              </button>
              <button @click="cancelEdit">
                <X :size="20" />
              </button>
            </template>
            <button v-else @click="startEdit('status')" class="btn-edit">
              Edit
            </button>
          </div>
        </div>
      </div>

      <div class="profile-field">
        <label>Email</label>
        <div class="field-content">
          <span>{{ authStore.user?.email }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-view {
  width: 100%;
  height: 100%;
  background: var(--bg-primary);
  display: flex;
  flex-direction: column;
}

.profile-header {
  background: var(--accent-dark);
  color: white;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 20px;
}

.profile-header h2 {
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

.profile-content {
  flex: 1;
  overflow-y: auto;
}

.avatar-section {
  background: var(--bg-secondary);
  padding: 28px;
  display: flex;
  justify-content: center;
  margin-bottom: 10px;
}

.avatar-wrapper {
  position: relative;
}

.avatar, .avatar-placeholder {
  width: 200px;
  height: 200px;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-placeholder {
  background: #00a884;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 72px;
  font-weight: 300;
}

.avatar-edit {
  position: absolute;
  bottom: 10px;
  right: 10px;
  background: #00a884;
  color: white;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s;
}

.avatar-edit:hover {
  background: #008f72;
}

.error-message {
  background: #fee2e2;
  color: var(--danger-color);
  padding: 12px 20px;
  margin: 10px 0;
}

.profile-field {
  background: var(--bg-secondary);
  padding: 14px 20px;
  margin-bottom: 1px;
}

.profile-field label {
  display: block;
  color: var(--accent-dark);
  font-size: 14px;
  margin-bottom: 4px;
}

.field-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.field-content span {
  color: var(--text-primary);
  font-size: 17px;
  flex: 1;
}

.field-content input {
  flex: 1;
  border: none;
  border-bottom: 2px solid var(--accent-color);
  padding: 4px 0;
  font-size: 17px;
  outline: none;
  background: transparent;
  color: var(--text-primary);
}

.field-actions {
  display: flex;
  gap: 8px;
}

.field-actions button {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px;
}

.field-actions button:hover {
  color: var(--accent-color);
}

.btn-edit {
  color: var(--accent-color) !important;
  font-size: 14px;
}
</style>
