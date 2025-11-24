import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from './auth'

export const useContactsStore = defineStore('contacts', () => {
  const contacts = ref([])
  const blockedContacts = ref([])
  const loading = ref(false)
  const error = ref(null)

  const authStore = useAuthStore()

  const fetchContacts = async () => {
    loading.value = true
    error.value = null

    try {
      const response = await fetch(`${authStore.API_URL}/api/contacts`, {
        headers: { 'Authorization': `Bearer ${authStore.token}` }
      })

      const data = await response.json()
      if (response.ok) {
        contacts.value = data.filter(c => !c.blocked)
        blockedContacts.value = data.filter(c => c.blocked)
      } else {
        error.value = data.error
      }
    } catch (err) {
      error.value = 'Network error'
    } finally {
      loading.value = false
    }
  }

  const addContact = async (userId, nickname = null) => {
    try {
      const response = await fetch(`${authStore.API_URL}/api/contacts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authStore.token}`
        },
        body: JSON.stringify({ contactId: userId, nickname })
      })

      const data = await response.json()
      if (response.ok) {
        contacts.value.push(data)
        return { success: true, contact: data }
      }
      return { success: false, error: data.error }
    } catch (err) {
      return { success: false, error: 'Network error' }
    }
  }

  const removeContact = async (contactId) => {
    try {
      const response = await fetch(`${authStore.API_URL}/api/contacts/${contactId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authStore.token}` }
      })

      if (response.ok) {
        contacts.value = contacts.value.filter(c => c._id !== contactId)
        return { success: true }
      }
      const data = await response.json()
      return { success: false, error: data.error }
    } catch (err) {
      return { success: false, error: 'Network error' }
    }
  }

  const updateNickname = async (contactId, nickname) => {
    try {
      const response = await fetch(`${authStore.API_URL}/api/contacts/${contactId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authStore.token}`
        },
        body: JSON.stringify({ nickname })
      })

      const data = await response.json()
      if (response.ok) {
        const index = contacts.value.findIndex(c => c._id === contactId)
        if (index !== -1) contacts.value[index] = data
        return { success: true }
      }
      return { success: false, error: data.error }
    } catch (err) {
      return { success: false, error: 'Network error' }
    }
  }

  const blockContact = async (contactId) => {
    try {
      const response = await fetch(`${authStore.API_URL}/api/contacts/${contactId}/block`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authStore.token}` }
      })

      if (response.ok) {
        const contact = contacts.value.find(c => c._id === contactId)
        if (contact) {
          contact.blocked = true
          contacts.value = contacts.value.filter(c => c._id !== contactId)
          blockedContacts.value.push(contact)
        }
        return { success: true }
      }
      const data = await response.json()
      return { success: false, error: data.error }
    } catch (err) {
      return { success: false, error: 'Network error' }
    }
  }

  const unblockContact = async (contactId) => {
    try {
      const response = await fetch(`${authStore.API_URL}/api/contacts/${contactId}/unblock`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authStore.token}` }
      })

      if (response.ok) {
        const contact = blockedContacts.value.find(c => c._id === contactId)
        if (contact) {
          contact.blocked = false
          blockedContacts.value = blockedContacts.value.filter(c => c._id !== contactId)
          contacts.value.push(contact)
        }
        return { success: true }
      }
      const data = await response.json()
      return { success: false, error: data.error }
    } catch (err) {
      return { success: false, error: 'Network error' }
    }
  }

  const searchUsers = async (query) => {
    try {
      const response = await fetch(`${authStore.API_URL}/api/contacts/search?q=${encodeURIComponent(query)}`, {
        headers: { 'Authorization': `Bearer ${authStore.token}` }
      })

      const data = await response.json()
      if (response.ok) {
        return { success: true, users: data }
      }
      return { success: false, error: data.error }
    } catch (err) {
      return { success: false, error: 'Network error' }
    }
  }

  return {
    contacts,
    blockedContacts,
    loading,
    error,
    fetchContacts,
    addContact,
    removeContact,
    updateNickname,
    blockContact,
    unblockContact,
    searchUsers
  }
})
