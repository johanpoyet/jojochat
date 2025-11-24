import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useSettingsStore = defineStore('settings', () => {
  const darkMode = ref(false)
  const notifications = ref(true)
  const soundEnabled = ref(true)
  const enterToSend = ref(true)

  const init = () => {
    const saved = localStorage.getItem('app-settings')
    if (saved) {
      const settings = JSON.parse(saved)
      darkMode.value = settings.darkMode ?? false
      notifications.value = settings.notifications ?? true
      soundEnabled.value = settings.soundEnabled ?? true
      enterToSend.value = settings.enterToSend ?? true
    }
    applyDarkMode()
  }

  const save = () => {
    localStorage.setItem('app-settings', JSON.stringify({
      darkMode: darkMode.value,
      notifications: notifications.value,
      soundEnabled: soundEnabled.value,
      enterToSend: enterToSend.value
    }))
  }

  const applyDarkMode = () => {
    if (darkMode.value) {
      document.documentElement.classList.add('dark-mode')
    } else {
      document.documentElement.classList.remove('dark-mode')
    }
  }

  const toggleDarkMode = () => {
    darkMode.value = !darkMode.value
    applyDarkMode()
    save()
  }

  const setNotifications = (value) => {
    notifications.value = value
    save()
  }

  const setSoundEnabled = (value) => {
    soundEnabled.value = value
    save()
  }

  const setEnterToSend = (value) => {
    enterToSend.value = value
    save()
  }

  watch([darkMode, notifications, soundEnabled, enterToSend], save, { deep: true })

  return {
    darkMode,
    notifications,
    soundEnabled,
    enterToSend,
    init,
    toggleDarkMode,
    setNotifications,
    setSoundEnabled,
    setEnterToSend
  }
})
