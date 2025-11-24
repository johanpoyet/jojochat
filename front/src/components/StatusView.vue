<script setup>
import { ref } from 'vue'
import { X, Edit2, Check } from 'lucide-vue-next'
import { useAuthStore } from '../stores/auth'

defineProps({
  show: Boolean
})

const emit = defineEmits(['close'])
const authStore = useAuthStore()

const isEditing = ref(false)
const newStatus = ref('')

const startEditing = () => {
  newStatus.value = authStore.user?.statusMessage || 'Hey there! I am using WhatsApp.'
  isEditing.value = true
}

const saveStatus = async () => {
  if (!newStatus.value.trim()) return
  
  if (typeof authStore.updateProfile !== 'function') {
    console.error('authStore.updateProfile is not a function. Store state:', authStore)
    alert('Please reload the page to apply the latest updates.')
    return
  }

  try {
    await authStore.updateProfile({ statusMessage: newStatus.value })
    isEditing.value = false
  } catch (error) {
    console.error('Failed to update status:', error)
  }
}

const cancelEditing = () => {
  isEditing.value = false
}
</script>

<template>
  <div class="status-view" :class="{ show: show }">
    <div class="status-header">
      <button class="btn-close" @click="emit('close')">
        <X :size="24" color="white" />
      </button>
      <h2>Status</h2>
    </div>
    <div class="status-content">
      <div class="my-status">
        <div class="avatar">
          <img v-if="authStore.user?.avatar" :src="authStore.user.avatar" alt="My Status" />
          <img v-else src="https://ui-avatars.com/api/?name=Me&background=0D8ABC&color=fff" alt="My Status" />
          <span class="plus-icon">+</span>
        </div>
        <div class="status-info">
          <h3>My Status</h3>
          <div v-if="isEditing" class="edit-status">
            <input
              v-model="newStatus"
              @keyup.enter="saveStatus"
              @keyup.esc="cancelEditing"
              type="text"
              placeholder="Add a status update"
              ref="statusInput"
              autoFocus
            />
            <button @click="saveStatus" class="btn-action save">
              <Check :size="20" />
            </button>
            <button @click="cancelEditing" class="btn-action cancel">
              <X :size="20" />
            </button>
          </div>
          <div v-else class="display-status">
            <p>{{ authStore.user?.statusMessage || 'Tap to add status update' }}</p>
            <button @click="startEditing" class="btn-edit">
              <Edit2 :size="16" />
            </button>
          </div>
        </div>
      </div>
      
      <div class="recent-updates">
        <h3>Recent updates</h3>
        <!-- Mock data for now -->
        <div class="status-item">
          <div class="avatar ring">
            <img src="https://ui-avatars.com/api/?name=Alice&background=random" alt="Alice" />
          </div>
          <div class="status-info">
            <h3>Alice</h3>
            <p>Today, 10:23 AM</p>
          </div>
        </div>
        <div class="status-item">
          <div class="avatar ring">
            <img src="https://ui-avatars.com/api/?name=Bob&background=random" alt="Bob" />
          </div>
          <div class="status-info">
            <h3>Bob</h3>
            <p>Today, 09:15 AM</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.status-view {
  position: absolute;
  top: 0;
  left: 0;
  width: 30%; /* Match sidebar width */
  min-width: 340px;
  max-width: 450px;
  height: 100%;
  background: white;
  z-index: 100;
  transform: translateX(-110%);
  transition: transform 0.3s cubic-bezier(0.1, 0.82, 0.25, 1);
  display: flex;
  flex-direction: column;
  border-right: 1px solid #d1d7db;
}

.status-view.show {
  transform: translateX(0);
}

.status-header {
  height: 108px;
  background: #008069;
  padding: 0 20px;
  display: flex;
  align-items: flex-end;
  padding-bottom: 10px;
  gap: 20px;
}

.status-header h2 {
  color: white;
  margin: 0;
  font-size: 19px;
  font-weight: 500;
  margin-bottom: 5px;
}

.btn-close {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  margin-bottom: 5px;
}

.status-content {
  flex: 1;
  overflow-y: auto;
  background: #f0f2f5;
}

.my-status {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: white;
  cursor: pointer;
  margin-bottom: 10px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
}

.recent-updates h3 {
  padding: 15px 16px;
  margin: 0;
  font-size: 14px;
  color: #008069;
  font-weight: 500;
}

.status-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: white;
  cursor: pointer;
  border-bottom: 1px solid #f0f2f5;
}

.status-item:hover, .my-status:hover {
  background: #f5f6f6;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 15px;
  position: relative;
}

.avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.avatar.ring {
  padding: 2px;
  border: 2px solid #008069;
}

.plus-icon {
  position: absolute;
  bottom: 0;
  right: 0;
  background: #008069;
  color: white;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  border: 2px solid white;
}

.status-info {
  flex: 1;
}

.status-info h3 {
  margin: 0;
  font-size: 16px;
  color: #111b21;
  font-weight: 400;
}

.status-info p {
  margin: 0;
  font-size: 13px;
  color: #667781;
  margin-top: 2px;
}

.display-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.btn-edit {
  background: none;
  border: none;
  color: #54656f;
  cursor: pointer;
  padding: 4px;
}

.edit-status {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.edit-status input {
  flex: 1;
  border: none;
  border-bottom: 2px solid #008069;
  outline: none;
  font-size: 13px;
  padding: 4px 0;
}

.btn-action {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-action.save {
  color: #008069;
}

.btn-action.cancel {
  color: #54656f;
}
</style>
