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
  <div class="chat-container">
    <StatusView :show="showStatus" @close="showStatus = false" />

    <!-- Settings Views -->
    <div v-if="showSettings" class="settings-overlay">
      <SettingsView
        @close="handleCloseSettings"
        @show-sessions="handleShowSessions"
        @show-blocked-contacts="handleShowBlockedContacts"
      />
    </div>

    <div v-if="showProfile" class="settings-overlay">
      <ProfileView @close="handleCloseProfile" />
    </div>

    <div v-if="showSessions" class="settings-overlay">
      <SessionsView @close="handleCloseSessions" />
    </div>

    <div v-if="showBlockedContacts" class="settings-overlay">
      <BlockedContactsView @close="handleCloseBlockedContacts" />
    </div>

    <ConversationList
      @logout="handleLogout"
      @show-status="showStatus = true"
      @show-settings="handleShowSettings"
    />
    <ChatWindow />
  </div>
</template>

<style scoped>
.chat-container {
  display: flex;
  width: 100vw;
  height: 100vh;
  margin: 0;
  background: #d1d7db;
  position: relative;
  overflow: hidden;
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

@media (min-width: 1441px) {
  .chat-container {
    padding: 19px;
    box-sizing: border-box;
  }

  .chat-container > * {
    box-shadow: 0 17px 50px 0 rgba(11,20,26,.19), 0 12px 15px 0 rgba(11,20,26,.24);
  }
}
</style>
