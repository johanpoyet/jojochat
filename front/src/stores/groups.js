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
        groups.value.push(data)
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
    leaveGroup
  }
})
