import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './auth'

export const useChatStore = defineStore('chat', () => {
  const authStore = useAuthStore()

  const conversations = ref([])
  const selectedUser = ref(null)
  const messages = ref([])
  const users = ref([])
  const typingUsers = ref([])

  const getUsers = async () => {
    const response = await fetch(`${authStore.API_URL}/api/users`, {
      headers: { 'Authorization': `Bearer ${authStore.token}` }
    })
    const data = await response.json()
    users.value = data.users.filter(u => u.id !== authStore.user.id)
  }

  const getConversations = async () => {
    const response = await fetch(`${authStore.API_URL}/api/messages/conversations`, {
      headers: { 'Authorization': `Bearer ${authStore.token}` }
    })
    const data = await response.json()
    conversations.value = data.conversations
  }

  const getMessages = async (userId) => {
    const response = await fetch(`${authStore.API_URL}/api/messages/${userId}`, {
      headers: { 'Authorization': `Bearer ${authStore.token}` }
    })
    const data = await response.json()
    messages.value = data.messages.reverse()
  }

  const sendMessage = (content, type = 'text', mediaUrl = null) => {
    if (!selectedUser.value || !authStore.socket) return

    authStore.socket.emit('send-message', {
      recipient_id: selectedUser.value.id,
      content,
      type,
      mediaUrl
    })
  }

  const addReaction = (messageId, emoji) => {
    if (!authStore.socket) return
    authStore.socket.emit('add-reaction', { message_id: messageId, emoji })
  }

  const removeReaction = (messageId, emoji) => {
    if (!authStore.socket) return
    authStore.socket.emit('remove-reaction', { message_id: messageId, emoji })
  }

  const editMessage = (messageId, content) => {
    if (!authStore.socket) return
    authStore.socket.emit('edit-message', { message_id: messageId, content })
  }

  const deleteMessage = (messageId) => {
    if (!authStore.socket) return
    authStore.socket.emit('delete-message', { message_id: messageId })
  }

  const selectUser = async (user) => {
    selectedUser.value = user
    await getMessages(user.id)
  }

  const setupSocketListeners = () => {
    if (!authStore.socket) return

    authStore.socket.on('new-message', (message) => {
      if (selectedUser.value &&
          (message.sender._id === selectedUser.value.id ||
           message.recipient._id === selectedUser.value.id)) {
        messages.value.push(message)
      }
      getConversations()
    })

    authStore.socket.on('message-sent', (message) => {
      messages.value.push(message)
      getConversations()
    })

    authStore.socket.on('user-typing', ({ userId }) => {
      if (!typingUsers.value.includes(userId)) {
        typingUsers.value.push(userId)
      }
    })

    authStore.socket.on('user-stop-typing', ({ userId }) => {
      typingUsers.value = typingUsers.value.filter(id => id !== userId)
    })

    authStore.socket.on('message-read-confirmation', () => {
      getConversations()
    })

    authStore.socket.on('user-online', ({ userId }) => {
      const user = users.value.find(u => u.id === userId)
      if (user) user.status = 'online'
    })

    authStore.socket.on('user-offline', ({ userId }) => {
      const user = users.value.find(u => u.id === userId)
      if (user) user.status = 'offline'
    })

    authStore.socket.on('reaction-added', (data) => {
      const message = messages.value.find(m => m._id === data.message_id)
      if (message) {
        if (!message.reactions) message.reactions = []
        if (data.oldEmoji) {
          message.reactions = message.reactions.filter(
            r => !(r.user === data.user_id && r.emoji === data.oldEmoji)
          )
        }
        const alreadyExists = message.reactions.some(
          r => r.user === data.user_id && r.emoji === data.emoji
        )
        if (!alreadyExists) {
          message.reactions.push({ user: data.user_id, emoji: data.emoji })
        }
      }
    })

    authStore.socket.on('reaction-removed', (data) => {
      const message = messages.value.find(m => m._id === data.message_id)
      if (message && message.reactions) {
        message.reactions = message.reactions.filter(
          r => !(r.user === data.user_id && r.emoji === data.emoji)
        )
      }
    })

    authStore.socket.on('message-edited', (data) => {
      const message = messages.value.find(m => m._id === data.message_id)
      if (message) {
        message.content = data.content
        message.editedAt = data.editedAt
      }
    })

    authStore.socket.on('message-deleted', (data) => {
      const message = messages.value.find(m => m._id === data.message_id)
      if (message) {
        message.deleted = true
        message.content = 'This message was deleted'
      }
    })
  }

  const isTyping = computed(() => {
    return selectedUser.value && typingUsers.value.includes(selectedUser.value.id)
  })

  return {
    conversations,
    selectedUser,
    messages,
    users,
    typingUsers,
    isTyping,
    getUsers,
    getConversations,
    getMessages,
    sendMessage,
    addReaction,
    removeReaction,
    editMessage,
    deleteMessage,
    selectUser,
    setupSocketListeners
  }
})
