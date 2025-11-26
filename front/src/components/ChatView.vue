<script setup>
import { onMounted, ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useChatStore } from '../stores/chat'
import { useGroupsStore } from '../stores/groups'
import ConversationList from './ConversationList.vue'
import ChatWindow from './ChatWindow.vue'
import StatusView from './StatusView.vue'
import SettingsView from './SettingsView.vue'
import ProfileView from './ProfileView.vue'
import SessionsView from './SessionsView.vue'
import BlockedContactsView from './BlockedContactsView.vue'

const authStore = useAuthStore()
const chatStore = useChatStore()
const groupsStore = useGroupsStore()

const showStatus = ref(false)
const showSettings = ref(false)
const showProfile = ref(false)
const showSessions = ref(false)
const showBlockedContacts = ref(false)

onMounted(async () => {
  chatStore.setupSocketListeners()
  groupsStore.setupSocketListeners()
  await chatStore.getUsers()
  await chatStore.getConversations()
  await groupsStore.fetchGroups()
})

const handleLogout = () => {
  authStore.logout()
}

const handleShowSettings = () => {
  showSettings.value = true
}

const handleShowProfile = () => {
  showProfile.value = true
}

const handleShowSessions = () => {
  showSettings.value = false
  showSessions.value = true
}

const handleShowBlockedContacts = () => {
  showSettings.value = false
  showBlockedContacts.value = true
}

const handleCloseSettings = () => {
  showSettings.value = false
}

const handleCloseProfile = () => {
  showProfile.value = false
}

const handleCloseSessions = () => {
  showSessions.value = false
  showSettings.value = true
}

const handleCloseBlockedContacts = () => {
  showBlockedContacts.value = false
  showSettings.value = true
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

      <div class="chat-container">
        <StatusView :show="showStatus" @close="showStatus = false" />

        <!-- Settings Views -->
        <div v-if="showSettings" class="settings-overlay" @click.self="handleCloseSettings">
          <SettingsView
            @close="handleCloseSettings"
            @show-sessions="handleShowSessions"
            @show-blocked-contacts="handleShowBlockedContacts"
          />
        </div>

        <div v-if="showProfile" class="settings-overlay" @click.self="handleCloseProfile">
          <ProfileView @close="handleCloseProfile" />
        </div>

        <div v-if="showSessions" class="settings-overlay" @click.self="handleCloseSessions">
          <SessionsView @close="handleCloseSessions" />
        </div>

        <div v-if="showBlockedContacts" class="settings-overlay" @click.self="handleCloseBlockedContacts">
          <BlockedContactsView @close="handleCloseBlockedContacts" />
        </div>

        <ConversationList
          @logout="handleLogout"
          @show-status="showStatus = true"
          @show-settings="handleShowSettings"
          @show-profile="handleShowProfile"
        />
        <ChatWindow />
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
  width: min(92vw, 1400px);
  height: min(92vh, 900px);
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

.chat-container {
  display: flex;
  flex: 1;
  width: 100%;
  height: 100%;
  margin: 0;
  background: #d1d7db;
  position: relative;
  overflow: hidden;
  border-radius: 0 0 22px 22px;
}

.chat-container::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 127px;
  background-color: #00a884;
  z-index: -1;
}

.settings-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.settings-overlay > * {
  width: 100%;
  max-width: 600px;
  height: 100%;
  max-height: 90vh;
  background: var(--bg-secondary);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

@media (max-width: 1024px) {
  .app-window {
    width: 100%;
    height: 100%;
    border-radius: 0;
  }

  .app-backdrop {
    padding: 0;
  }

  .chat-container {
    border-radius: 0;
  }
}

@media (min-width: 1441px) {
  .chat-container {
    box-sizing: border-box;
  }

  .chat-container > * {
    box-shadow:
      0 17px 50px 0 rgba(11, 20, 26, 0.19),
      0 12px 15px 0 rgba(11, 20, 26, 0.24);
  }
}
</style>
