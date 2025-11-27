import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './auth'
import { useGroupsStore } from './groups'

export const useChatStore = defineStore('chat', () => {
  const authStore = useAuthStore()

  const conversations = ref([])
  const selectedUser = ref(null)
  const selectedGroup = ref(null)
  const messages = ref([])
  const users = ref([])
  const typingUsers = ref([])
  const loading = ref(false)

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

  const getGroupMessages = async (groupId) => {
    const response = await fetch(`${authStore.API_URL}/api/messages/group/${groupId}`, {
      headers: { 'Authorization': `Bearer ${authStore.token}` }
    })
    const data = await response.json()
    messages.value = data.messages.reverse()
  }

  const sendMessage = (content, type = 'text', mediaUrl = null, replyTo = null) => {
    if (!authStore.socket) return

    if (selectedGroup.value) {
      // Envoyer un message de groupe
      console.log('Sending group message:', {
        group_id: selectedGroup.value._id,
        content,
        type,
        mediaUrl,
        replyTo
      })
      authStore.socket.emit('send-group-message', {
        group_id: selectedGroup.value._id,
        content,
        type,
        mediaUrl,
        ...(replyTo && { replyTo })
      })
    } else if (selectedUser.value) {
      // Envoyer un message direct
      authStore.socket.emit('send-message', {
        recipient_id: selectedUser.value.id,
        content,
        type,
        mediaUrl,
        ...(replyTo && { replyTo })
      })
    }
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
    selectedGroup.value = null
    messages.value = []
    loading.value = true

    try {
      await getMessages(user.id)
    } finally {
      loading.value = false
    }
  }

  const selectGroup = async (group) => {
    selectedGroup.value = group
    selectedUser.value = null
    messages.value = []
    loading.value = true

    try {
      await getGroupMessages(group._id)

      if (authStore.socket) {
        authStore.socket.emit('join-group-room', { group_id: group._id })
      }

      // Reset unread count locally
      const groupsStore = useGroupsStore()
      groupsStore.resetUnreadCount(group._id)
    } finally {
      loading.value = false
    }
  }

  const setupSocketListeners = () => {
    if (!authStore.socket) return

    // Listener pour les erreurs WebSocket
    authStore.socket.on('error', (error) => {
      console.error('Socket error:', error)
      alert(`Error: ${error.message || 'Unknown error'}`)
    })

    authStore.socket.on('new-message', (message) => {
      if (selectedUser.value &&
          (message.sender._id === selectedUser.value.id ||
           message.recipient._id === selectedUser.value.id)) {
        messages.value.push(message)
      }
      getConversations()
    })

    authStore.socket.on('new-group-message', (data) => {
      // Si on est dans ce groupe, ajouter le message
      if (selectedGroup.value && data.group_id === selectedGroup.value._id) {
        messages.value.push(data.message)
        // Reset unread count since we're viewing the group
        const groupsStore = useGroupsStore()
        groupsStore.resetUnreadCount(data.group_id)
      }
      // Note: group list update is handled by groups store socket listener
    })

    authStore.socket.on('message-sent', (message) => {
      console.log('Received message-sent:', message)

      // Pour les messages de groupe
      if (message.group && selectedGroup.value) {
        const messageGroupId = typeof message.group === 'string' ? message.group : message.group._id || message.group.toString()
        const selectedGroupId = selectedGroup.value._id
        console.log('Group message comparison:', messageGroupId, '===', selectedGroupId, '=', messageGroupId === selectedGroupId)

        if (messageGroupId === selectedGroupId) {
          console.log('Adding message to group conversation')
          messages.value.push(message)
        }
        // Note: group list update is handled by groups store socket listener
      }
      // Pour les messages directs
      else if (message.recipient && selectedUser.value && message.recipient._id === selectedUser.value.id) {
        console.log('Adding message to direct conversation')
        messages.value.push(message)
      }

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

      const conv = conversations.value.find(c => c.otherUser.id === userId)
      if (conv) conv.otherUser.status = 'online'

      if (selectedUser.value && selectedUser.value.id === userId) {
        selectedUser.value.status = 'online'
      }
    })

    authStore.socket.on('user-offline', ({ userId }) => {
      const user = users.value.find(u => u.id === userId)
      if (user) user.status = 'offline'

      const conv = conversations.value.find(c => c.otherUser.id === userId)
      if (conv) conv.otherUser.status = 'offline'

      if (selectedUser.value && selectedUser.value.id === userId) {
        selectedUser.value.status = 'offline'
      }
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

    authStore.socket.on('message-deleted', async (data) => {
      const message = messages.value.find(m => m._id === data.message_id)
      if (message) {
        message.deleted = true
        message.content = 'This message was deleted'
      }
      await getConversations()
      // Note: group list update for deleted messages is handled by groups store socket listener
    })

    authStore.socket.on('group-deleted', (data) => {
      const { groupId } = data

      // If the deleted group is currently selected, clear selection
      if (selectedGroup.value && selectedGroup.value._id === groupId) {
        selectedGroup.value = null
        messages.value = []
      }
    })
  }

  const isTyping = computed(() => {
    return selectedUser.value && typingUsers.value.includes(selectedUser.value.id)
  })

  return {
    conversations,
    selectedUser,
    selectedGroup,
    messages,
    users,
    typingUsers,
    loading,
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
    selectGroup,
    setupSocketListeners
  }
})
