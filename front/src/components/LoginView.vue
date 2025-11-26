<script setup>
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()

const isLogin = ref(true)
const email = ref('')
const username = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

const handleSubmit = async () => {
  error.value = ''
  loading.value = true

  try {
    if (isLogin.value) {
      await authStore.login(email.value, password.value)
    } else {
      await authStore.register(email.value, username.value, password.value)
    }
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

const toggleMode = () => {
  isLogin.value = !isLogin.value
  error.value = ''
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

      <div class="login-container">
        <div class="login-box">
      <div class="login-header">
        <i class="fas fa-comments"></i>
        <h1>Chat App</h1>
      </div>

      <form @submit.prevent="handleSubmit" class="login-form">
        <h2>{{ isLogin ? 'Login' : 'Register' }}</h2>

        <div class="form-group">
          <input
            v-model="email"
            type="email"
            placeholder="Email"
            required
            :disabled="loading"
          />
        </div>

        <div v-if="!isLogin" class="form-group">
          <input
            v-model="username"
            type="text"
            placeholder="Username"
            :required="!isLogin"
            :disabled="loading"
            minlength="3"
          />
        </div>

        <div class="form-group">
          <input
            v-model="password"
            type="password"
            placeholder="Password"
            required
            :disabled="loading"
          />
        </div>

        <div v-if="error" class="error">{{ error }}</div>

        <button type="submit" class="btn-submit" :disabled="loading">
          {{ loading ? 'Loading...' : (isLogin ? 'Login' : 'Register') }}
        </button>

        <p class="toggle-mode">
          {{ isLogin ? "Don't have an account?" : 'Already have an account?' }}
          <a href="#" @click.prevent="toggleMode">
            {{ isLogin ? 'Register' : 'Login' }}
          </a>
        </p>
      </form>
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

.login-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #128C7E 0%, #075E54 100%);
}

.login-box {
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  padding: 3rem;
  width: 90%;
  max-width: 550px;
}

@media (min-width: 768px) {
  .login-box {
    width: 550px;
    padding: 3.5rem;
  }
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.login-header i {
  font-size: 3rem;
  color: #128C7E;
  margin-bottom: 0.5rem;
}

.login-header h1 {
  font-size: 2rem;
  color: #075E54;
  margin: 0;
}

.login-form h2 {
  text-align: center;
  color: #075E54;
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s;
}

.form-group input:focus {
  outline: none;
  border-color: #128C7E;
}

.form-group input:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}

.error {
  color: #dc3545;
  background: #ffe6e6;
  padding: 0.75rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.btn-submit {
  width: 100%;
  padding: 0.75rem;
  background: #128C7E;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s;
}

.btn-submit:hover:not(:disabled) {
  background: #0F7A6F;
}

.btn-submit:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.toggle-mode {
  text-align: center;
  margin-top: 1rem;
  color: #666;
  font-size: 0.9rem;
}

.toggle-mode a {
  color: #128C7E;
  text-decoration: none;
  font-weight: 600;
}

.toggle-mode a:hover {
  text-decoration: underline;
}
</style>
