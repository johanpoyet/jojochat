<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from './stores/auth'
import { useSettingsStore } from './stores/settings'
import LoginView from './components/LoginView.vue'
import RegisterView from './components/RegisterView.vue'
import ChatView from './components/ChatView.vue'
import { ref } from 'vue'

const authStore = useAuthStore()
const settingsStore = useSettingsStore()

const showRegister = ref(false)

onMounted(() => {
  settingsStore.init()
  if (authStore.token && !authStore.socket) {
    authStore.connectSocket()
  }
})
</script>

<template>
  <div id="app">
    <template v-if="!authStore.isAuthenticated">
      <RegisterView v-if="showRegister" @switch-to-login="showRegister = false" />
      <LoginView v-else @switch-to-register="showRegister = true" />
    </template>
    <ChatView v-else />
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  font-family: 'Segoe UI', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app {
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  margin: 0;
  padding: 0;
}

:root {
  --bg-primary: #f0f2f5;
  --bg-secondary: #ffffff;
  --bg-tertiary: #e9edef;
  --text-primary: #111b21;
  --text-secondary: #667781;
  --accent-color: #00a884;
  --accent-dark: #008069;
  --border-color: #e9edef;
  --hover-color: #f5f6f6;
  --danger-color: #dc2626;
  --message-out: #d9fdd3;
  --message-in: #ffffff;
}

:root.dark-mode {
  --bg-primary: #111b21;
  --bg-secondary: #202c33;
  --bg-tertiary: #2a3942;
  --text-primary: #e9edef;
  --text-secondary: #8696a0;
  --accent-color: #00a884;
  --accent-dark: #005c4b;
  --border-color: #2a3942;
  --hover-color: #2a3942;
  --danger-color: #f87171;
  --message-out: #005c4b;
  --message-in: #202c33;
}
</style>
