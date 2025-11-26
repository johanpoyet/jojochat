<script setup>
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth'

const emit = defineEmits(['switch-to-login'])

const authStore = useAuthStore()

const email = ref('')
const username = ref('')
const password = ref('')
const confirmPassword = ref('')
const error = ref('')
const loading = ref(false)

const handleRegister = async () => {
  error.value = ''

  if (!email.value || !username.value || !password.value || !confirmPassword.value) {
    error.value = 'All fields are required'
    return
  }

  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match'
    return
  }

  if (password.value.length < 6) {
    error.value = 'Password must be at least 6 characters'
    return
  }

  if (username.value.length < 3) {
    error.value = 'Username must be at least 3 characters'
    return
  }

  loading.value = true

  try {
    const response = await fetch(`${authStore.API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.value,
        username: username.value,
        password: password.value
      })
    })

    const data = await response.json()

    if (!response.ok) {
      error.value = data.error || 'Registration failed'
      return
    }

    authStore.setAuth(data.token, data.user)
  } catch (err) {
    error.value = 'Network error. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="app-backdrop">
    <div class="app-window">
      <div class="window-header" aria-hidden="true">
        <div class="window-controls">
          <span class="window-dot dot-close"></span>
          <span class="window-dot dot-minimize"></span>
          <span class="window-dot dot-fullscreen"></span>
        </div>
      </div>

      <div class="register-container">
        <div class="register-box">
      <div class="register-header">
        <h1>WhatsApp</h1>
        <p>Create your account</p>
      </div>

      <form @submit.prevent="handleRegister" class="register-form">
        <div v-if="error" class="error-message">{{ error }}</div>

        <div class="form-group">
          <input
            v-model="email"
            type="email"
            placeholder="Email"
            autocomplete="email"
          />
        </div>

        <div class="form-group">
          <input
            v-model="username"
            type="text"
            placeholder="Username"
            autocomplete="username"
          />
        </div>

        <div class="form-group">
          <input
            v-model="password"
            type="password"
            placeholder="Password"
            autocomplete="new-password"
          />
        </div>

        <div class="form-group">
          <input
            v-model="confirmPassword"
            type="password"
            placeholder="Confirm Password"
            autocomplete="new-password"
          />
        </div>

        <button type="submit" class="btn-register" :disabled="loading">
          {{ loading ? 'Creating account...' : 'Create Account' }}
        </button>
      </form>

      <div class="login-link">
        <span>Already have an account?</span>
        <button @click="emit('switch-to-login')" class="btn-link">Sign in</button>
      </div>
    </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.app-backdrop {
  width: 100vw;
  height: 100vh;
  background: radial-gradient(circle at top, #f5f7fb 0%, #d7dde4 45%, #bac4cf 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(12px, 3vw, 36px);
}

.app-window {
  width: min(92vw, 700px);
  height: min(92vh, 700px);
  background: #ffffff;
  border-radius: 22px;
  box-shadow:
    0 45px 95px rgba(15, 23, 42, 0.25),
    0 25px 45px rgba(15, 23, 42, 0.12);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(15, 23, 42, 0.06);
  position: relative;
}

.window-header {
  height: 42px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  background: linear-gradient(135deg, #fdfdfd, #f3f6f8);
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
}

.window-controls {
  display: flex;
  gap: 8px;
}

.window-dot {
  width: 12px;
  height: 12px;
  border-radius: 999px;
  display: inline-flex;
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: inset 0 0 2px rgba(0, 0, 0, 0.25);
}

.dot-close {
  background: #ff5f57;
  border-color: #e0483f;
}

.dot-minimize {
  background: #febc2e;
  border-color: #e0a323;
}

.dot-fullscreen {
  background: #28c940;
  border-color: #1e9f31;
}

.register-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #00a884 0%, #128C7E 100%);
  padding: 20px;
}

.register-box {
  background: white;
  border-radius: 12px;
  padding: 40px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.register-header {
  text-align: center;
  margin-bottom: 30px;
}

.register-header h1 {
  color: #128C7E;
  font-size: 28px;
  margin: 0 0 8px 0;
}

.register-header p {
  color: #667781;
  margin: 0;
}

.register-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group input {
  width: 100%;
  padding: 14px 16px;
  border: 1px solid #d1d7db;
  border-radius: 8px;
  font-size: 15px;
  transition: border-color 0.2s;
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
  text-align: center;
}

.btn-register {
  background: #00a884;
  color: white;
  border: none;
  padding: 14px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
  margin-top: 8px;
}

.btn-register:hover:not(:disabled) {
  background: #008f72;
}

.btn-register:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.login-link {
  text-align: center;
  margin-top: 24px;
  color: #667781;
  font-size: 14px;
}

.btn-link {
  background: none;
  border: none;
  color: #00a884;
  font-weight: 500;
  cursor: pointer;
  margin-left: 4px;
}

.btn-link:hover {
  text-decoration: underline;
}
</style>
