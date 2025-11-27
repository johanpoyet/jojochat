import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from './auth'

export const useGroupsStore = defineStore('groups', () => {
  const groups = ref([])
  const currentGroup = ref(null)
  const loading = ref(false)
  const error = ref(null)

  const authStore = useAuthStore()

  const fetchGroups = async () => {
    loading.value = true
    error.value = null

    try {
      const response = await fetch(`${authStore.API_URL}/api/groups`, {
        headers: { 'Authorization': `Bearer ${authStore.token}` }
      })

      const data = await response.json()
      if (response.ok) {
        groups.value = data.groups || data
      } else {
        error.value = data.error
      }
    } catch (err) {
      error.value = 'Network error'
    } finally {
      loading.value = false
    }
  }

  const getGroup = async (groupId) => {
    try {
      const response = await fetch(`${authStore.API_URL}/api/groups/${groupId}`, {
        headers: { 'Authorization': `Bearer ${authStore.token}` }
      })

      const data = await response.json()
      if (response.ok) {
        currentGroup.value = data
        return { success: true, group: data }
      }
      return { success: false, error: data.error }
    } catch (err) {
      return { success: false, error: 'Network error' }
    }
  }

  const createGroup = async (name, description = '', memberIds = []) => {
    try {
      const response = await fetch(`${authStore.API_URL}/api/groups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authStore.token}`
        },
        body: JSON.stringify({ name, description, members: memberIds })
      })

      const data = await response.json()
      if (response.ok) {
        // Don't add here, the socket event 'group-created' will handle it
        return { success: true, group: data }
      }
      return { success: false, error: data.error }
    } catch (err) {
      return { success: false, error: 'Network error' }
    }
  }

  const updateGroup = async (groupId, updates) => {
    try {
      const response = await fetch(`${authStore.API_URL}/api/groups/${groupId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authStore.token}`
        },
        body: JSON.stringify(updates)
      })

      const data = await response.json()
      if (response.ok) {
        const index = groups.value.findIndex(g => g._id === groupId)
        if (index !== -1) groups.value[index] = data
        if (currentGroup.value?._id === groupId) currentGroup.value = data
        return { success: true, group: data }
      }
      return { success: false, error: data.error }
    } catch (err) {
      return { success: false, error: 'Network error' }
    }
  }

  const deleteGroup = async (groupId) => {
    try {
      const response = await fetch(`${authStore.API_URL}/api/groups/${groupId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authStore.token}` }
      })

      if (response.ok) {
        groups.value = groups.value.filter(g => g._id !== groupId)
        if (currentGroup.value?._id === groupId) currentGroup.value = null
        return { success: true }
      }
      const data = await response.json()
      return { success: false, error: data.error }
    } catch (err) {
      return { success: false, error: 'Network error' }
    }
  }

  const addMember = async (groupId, userId) => {
    try {
      const response = await fetch(`${authStore.API_URL}/api/groups/${groupId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authStore.token}`
        },
        body: JSON.stringify({ members: [userId] })
      })

      const data = await response.json()
      if (response.ok) {
        if (currentGroup.value?._id === groupId) currentGroup.value = data
        return { success: true, group: data }
      }
      return { success: false, error: data.error }
    } catch (err) {
      return { success: false, error: 'Network error' }
    }
  }

  const removeMember = async (groupId, userId) => {
    try {
      const response = await fetch(`${authStore.API_URL}/api/groups/${groupId}/members/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authStore.token}` }
      })

      const data = await response.json()
      if (response.ok) {
        if (currentGroup.value?._id === groupId) currentGroup.value = data
        return { success: true, group: data }
      }
      return { success: false, error: data.error }
    } catch (err) {
      return { success: false, error: 'Network error' }
    }
  }

  const updateMemberRole = async (groupId, userId, role) => {
    try {
      const response = await fetch(`${authStore.API_URL}/api/groups/${groupId}/members/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authStore.token}`
        },
        body: JSON.stringify({ role })
      })

      const data = await response.json()
      if (response.ok) {
        if (currentGroup.value?._id === groupId) currentGroup.value = data
        return { success: true, group: data }
      }
      return { success: false, error: data.error }
    } catch (err) {
      return { success: false, error: 'Network error' }
    }
  }

  const leaveGroup = async (groupId) => {
    try {
      const response = await fetch(`${authStore.API_URL}/api/groups/${groupId}/leave`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authStore.token}` }
      })

      if (response.ok) {
        groups.value = groups.value.filter(g => g._id !== groupId)
        if (currentGroup.value?._id === groupId) currentGroup.value = null
        return { success: true }
      }
      const data = await response.json()
      return { success: false, error: data.error }
    } catch (err) {
      return { success: false, error: 'Network error' }
    }
  }

  const updateGroupLastMessage = (groupId, message, isCurrentUser) => {
    const group = groups.value.find(g => g._id === groupId)
    if (group) {
      // Update last message
      group.lastMessage = {
        content: message.content,
        createdAt: message.createdAt,
        sender: message.sender,
        isSender: isCurrentUser,
        deleted: false
      }

      // Increment unread count if not current user
      if (!isCurrentUser) {
        group.unreadCount = (group.unreadCount || 0) + 1
      }

      // Move group to top of list
      const index = groups.value.findIndex(g => g._id === groupId)
      if (index > 0) {
        groups.value.splice(index, 1)
        groups.value.unshift(group)
      }
    }
  }

  const resetUnreadCount = (groupId) => {
    const group = groups.value.find(g => g._id === groupId)
    if (group) {
      group.unreadCount = 0
    }
  }

  const archiveGroup = async (groupId) => {
    try {
      const response = await fetch(`${authStore.API_URL}/api/groups/${groupId}/archive`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authStore.token}` }
      })

      if (response.ok) {
        const data = await response.json()
        const group = groups.value.find(g => g._id === groupId)
        if (group) {
          group.archived = data.archived
        }
      }
    } catch (error) {
      console.error('Failed to archive group:', error)
    }
  }

  const setupSocketListeners = () => {
    if (!authStore.socket || !authStore.user) return

    const userId = authStore.user.id || authStore.user._id

    // Listen for new groups created where this user is a member
    authStore.socket.on('group-created', (group) => {
      console.log('Group created event received:', group)

      // Check if current user is a member of this group
      const isMember = group.members.some(m => {
        const memberId = m.user?._id || m.user
        return memberId === userId || memberId.toString() === userId.toString()
      })

      if (isMember) {
        console.log('User is member of this group, adding to list')
        // Check if group already exists in the list
        const exists = groups.value.some(g => g._id === group._id)
        if (!exists) {
          groups.value.unshift(group)
        }
      }
    })

    // Listen for groups being deleted
    authStore.socket.on('group-deleted', (data) => {
      console.log('Group deleted event received:', data)
      const { groupId } = data

      // Remove the group from the list
      groups.value = groups.value.filter(g => g._id !== groupId)

      // If this was the currently selected group, clear the selection
      if (currentGroup.value?._id === groupId) {
        currentGroup.value = null
      }
    })

    // Listen for new group messages
    authStore.socket.on('new-group-message', (data) => {
      const { group_id, message } = data
      const isCurrentUser = message.sender._id === userId
      updateGroupLastMessage(group_id, message, isCurrentUser)
    })

    // Listen for messages sent by current user
    authStore.socket.on('message-sent', (message) => {
      if (message.group) {
        const groupId = typeof message.group === 'string' ? message.group : message.group._id
        updateGroupLastMessage(groupId, message, true)
      }
    })

    // Listen for deleted messages
    authStore.socket.on('message-deleted', async (data) => {
      // Refresh groups to update last message if it was deleted
      await fetchGroups()
    })
  }

  return {
    groups,
    currentGroup,
    loading,
    error,
    fetchGroups,
    getGroup,
    createGroup,
    updateGroup,
    deleteGroup,
    addMember,
    removeMember,
    updateMemberRole,
    leaveGroup,
    updateGroupLastMessage,
    resetUnreadCount,
    archiveGroup,
    setupSocketListeners
  }
})
