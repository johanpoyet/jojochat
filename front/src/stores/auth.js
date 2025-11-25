import { defineStore } from 'pinia'
import { ref } from 'vue'
import { io } from 'socket.io-client'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(JSON.parse(localStorage.getItem('user')) || null)
  const token = ref(localStorage.getItem('token') || null)
  const socket = ref(null)
  const isAuthenticated = ref(!!token.value && !!user.value)

  const API_URL = 'http://localhost:3000'

  const register = async (email, username, password) => {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, username, password })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Registration failed')
    }

    const data = await response.json()
    token.value = data.token
    user.value = data.user
    isAuthenticated.value = true
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))

    connectSocket()

    return data
  }

  const login = async (email, password) => {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Login failed')
    }

    const data = await response.json()
    token.value = data.token
    user.value = data.user
    isAuthenticated.value = true
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))

    connectSocket()

    return data
  }

  const updateProfile = async (data) => {
    // Update user profile data
    const response = await fetch(`${API_URL}/api/users/profile`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token.value}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Update failed')
    }

    const updatedUser = await response.json()
    user.value = updatedUser
    localStorage.setItem('user', JSON.stringify(updatedUser))
    return updatedUser
  }

  const logout = async () => {
    if (token.value) {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token.value}`,
          'Content-Type': 'application/json'
        }
      })
    }

    if (socket.value) {
      socket.value.disconnect()
    }

    user.value = null
    token.value = null
    isAuthenticated.value = false
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  const connectSocket = () => {
    if (!token.value) return

    socket.value = io(API_URL, {
      auth: { token: token.value }
    })

    socket.value.on('connect', () => {
      console.log('Socket connected')
    })

    socket.value.on('disconnect', () => {
      console.log('Socket disconnected')
    })

    socket.value.on('error', (error) => {
      console.error('Socket error:', error)
    })

    socket.value.on('session-revoked', () => {
      logout()
    })
  }

  if (token.value && !socket.value) {
    connectSocket()
  }

  return {
    user,
    token,
    socket,
    isAuthenticated,
    register,
    login,
    updateProfile,
    logout,
    API_URL
  }
})
