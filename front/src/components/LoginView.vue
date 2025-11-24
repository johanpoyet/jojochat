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
</template>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100vw;
  height: 100vh;
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
