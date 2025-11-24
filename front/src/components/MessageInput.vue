<script setup lang="ts">
import { ref } from 'vue'
// @ts-expect-error - JS store without type declarations
import { useChatStore } from '../stores/chat'
// @ts-expect-error - JS store without type declarations
import { useAuthStore } from '../stores/auth'
import { Smile, Plus, Mic, Send, Image, FileText, X } from 'lucide-vue-next'

const chatStore = useChatStore()
const authStore = useAuthStore()
const message = ref('')
const typingTimeout = ref<number | null>(null)
const showAttachMenu = ref(false)
const selectedFile = ref<File | null>(null)
const filePreview = ref<string | null>(null)
const uploading = ref(false)

const handleInput = () => {
  if (!authStore.socket || !chatStore.selectedUser) return

  authStore.socket.emit('typing', {
    recipient_id: chatStore.selectedUser.id
  })

  if (typingTimeout.value) {
    clearTimeout(typingTimeout.value)
  }

  typingTimeout.value = setTimeout(() => {
    authStore.socket.emit('stop-typing', {
      recipient_id: chatStore.selectedUser.id
    })
  }, 2000)
}

const sendMessage = async () => {
  if (!message.value.trim() && !selectedFile.value) return

  if (selectedFile.value) {
    await sendMediaMessage()
  } else {
    chatStore.sendMessage(message.value)
    message.value = ''
  }

  if (typingTimeout.value) {
    clearTimeout(typingTimeout.value)
  }

  if (authStore.socket && chatStore.selectedUser) {
    authStore.socket.emit('stop-typing', {
      recipient_id: chatStore.selectedUser.id
    })
  }
}

const handleFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  selectedFile.value = file
  showAttachMenu.value = false

  if (file.type.startsWith('image/')) {
    const reader = new FileReader()
    reader.onload = (e) => {
      filePreview.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
  } else {
    filePreview.value = null
  }
}

const clearFile = () => {
  selectedFile.value = null
  filePreview.value = null
}

const sendMediaMessage = async () => {
  if (!selectedFile.value) return

  uploading.value = true

  try {
    const formData = new FormData()
    formData.append('file', selectedFile.value)

    const response = await fetch(`${authStore.API_URL}/api/media/upload`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${authStore.token}` },
      body: formData
    })

    const data = await response.json()

    if (response.ok) {
      const messageType = selectedFile.value.type.startsWith('image/') ? 'image' :
                         selectedFile.value.type.startsWith('video/') ? 'video' :
                         selectedFile.value.type.startsWith('audio/') ? 'audio' : 'document'

      chatStore.sendMessage(message.value || '', messageType, data.url)
      message.value = ''
      clearFile()
    }
  } catch (err) {
    console.error('Upload failed:', err)
  } finally {
    uploading.value = false
  }
}

const getFileIcon = (file: File) => {
  if (file.type.startsWith('image/')) return 'Image'
  return 'Document'
}
</script>

<template>
  <div class="message-input-container">
    <div v-if="selectedFile" class="file-preview">
      <div class="preview-content">
        <img v-if="filePreview" :src="filePreview" alt="Preview" class="preview-image" />
        <div v-else class="preview-file">
          <FileText :size="32" />
          <span>{{ selectedFile.name }}</span>
        </div>
      </div>
      <button @click="clearFile" class="btn-clear">
        <X :size="20" />
      </button>
    </div>

    <div class="message-input">
      <button class="btn-icon" title="Emoji">
        <Smile :size="24" />
      </button>

      <div class="attach-container">
        <button class="btn-icon" title="Attach" @click="showAttachMenu = !showAttachMenu">
          <Plus :size="24" />
        </button>
        <div v-if="showAttachMenu" class="attach-menu">
          <label class="attach-option">
            <Image :size="20" />
            <span>Photos & Videos</span>
            <input type="file" accept="image/*,video/*" @change="handleFileSelect" hidden />
          </label>
          <label class="attach-option">
            <FileText :size="20" />
            <span>Document</span>
            <input type="file" @change="handleFileSelect" hidden />
          </label>
        </div>
      </div>

      <input
        v-model="message"
        @input="handleInput"
        @keyup.enter="sendMessage"
        type="text"
        :placeholder="selectedFile ? 'Add a caption...' : 'Type a message'"
        :disabled="!chatStore.selectedUser"
      />

      <button
        v-if="message.trim() || selectedFile"
        class="btn-icon"
        @click="sendMessage"
        :disabled="!chatStore.selectedUser || uploading"
        title="Send"
      >
        <Send :size="24" />
      </button>
      <button v-else class="btn-icon" title="Voice Message">
        <Mic :size="24" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.message-input-container {
  background: #f0f2f5;
}

.file-preview {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px;
  background: #e9edef;
  border-bottom: 1px solid #d1d7db;
}

.preview-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.preview-image {
  max-height: 60px;
  max-width: 100px;
  border-radius: 8px;
  object-fit: cover;
}

.preview-file {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #54656f;
}

.preview-file span {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
}

.btn-clear {
  background: none;
  border: none;
  color: #54656f;
  cursor: pointer;
  padding: 8px;
}

.btn-clear:hover {
  color: #dc2626;
}

.message-input {
  padding: 5px 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 62px;
  box-sizing: border-box;
}

.btn-icon {
  background: none;
  border: none;
  color: #54656f;
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.3s;
}

.btn-icon:hover {
  color: #128C7E;
}

.btn-icon:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.attach-container {
  position: relative;
}

.attach-menu {
  position: absolute;
  bottom: 100%;
  left: 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  min-width: 180px;
  margin-bottom: 8px;
}

.attach-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  color: #54656f;
  transition: background 0.2s;
}

.attach-option:hover {
  background: #f0f2f5;
  color: #128C7E;
}

.attach-option span {
  font-size: 14px;
}

.message-input input {
  flex: 1;
  border: none;
  background: white;
  padding: 9px 12px;
  border-radius: 8px;
  font-size: 15px;
  outline: none;
  font-family: inherit;
  min-height: 20px;
  line-height: 20px;
}

.message-input input:disabled {
  background: #e9edef;
  cursor: not-allowed;
}

.message-input input::placeholder {
  color: #667781;
}
</style>
