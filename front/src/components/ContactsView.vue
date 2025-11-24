<script setup>
import { ref, onMounted, computed } from 'vue'
import { useContactsStore } from '../stores/contacts'
import { ArrowLeft, Search, UserPlus, MoreVertical, Ban, Trash2, Edit2, X } from 'lucide-vue-next'

const emit = defineEmits(['close', 'start-chat'])
const contactsStore = useContactsStore()

const searchQuery = ref('')
const searchResults = ref([])
const searching = ref(false)
const showAddContact = ref(false)
const showBlocked = ref(false)
const editingContact = ref(null)
const newNickname = ref('')
const contextMenu = ref({ show: false, contact: null, x: 0, y: 0 })

onMounted(() => {
  contactsStore.fetchContacts()
})

const filteredContacts = computed(() => {
  const list = showBlocked.value ? contactsStore.blockedContacts : contactsStore.contacts
  if (!searchQuery.value) return list
  const q = searchQuery.value.toLowerCase()
  return list.filter(c =>
    c.contact.username.toLowerCase().includes(q) ||
    (c.nickname && c.nickname.toLowerCase().includes(q))
  )
})

const handleSearch = async () => {
  if (!searchQuery.value.trim()) {
    searchResults.value = []
    return
  }
  searching.value = true
  const result = await contactsStore.searchUsers(searchQuery.value)
  if (result.success) {
    searchResults.value = result.users
  }
  searching.value = false
}

const handleAddContact = async (user) => {
  const result = await contactsStore.addContact(user._id)
  if (result.success) {
    showAddContact.value = false
    searchQuery.value = ''
    searchResults.value = []
  }
}

const showContextMenu = (event, contact) => {
  event.preventDefault()
  contextMenu.value = {
    show: true,
    contact,
    x: event.clientX,
    y: event.clientY
  }
}

const closeContextMenu = () => {
  contextMenu.value.show = false
}

const startEdit = (contact) => {
  editingContact.value = contact
  newNickname.value = contact.nickname || ''
  closeContextMenu()
}

const saveNickname = async () => {
  if (editingContact.value) {
    await contactsStore.updateNickname(editingContact.value._id, newNickname.value)
    editingContact.value = null
  }
}

const handleBlock = async (contact) => {
  await contactsStore.blockContact(contact._id)
  closeContextMenu()
}

const handleUnblock = async (contact) => {
  await contactsStore.unblockContact(contact._id)
}

const handleDelete = async (contact) => {
  await contactsStore.removeContact(contact._id)
  closeContextMenu()
}

const startChat = (contact) => {
  emit('start-chat', contact.contact)
}
</script>

<template>
  <div class="contacts-view" @click="closeContextMenu">
    <div class="contacts-header">
      <button @click="emit('close')" class="btn-back">
        <ArrowLeft :size="24" />
      </button>
      <h2>{{ showBlocked ? 'Blocked Contacts' : 'Contacts' }}</h2>
      <button @click="showAddContact = true" class="btn-add" v-if="!showBlocked">
        <UserPlus :size="24" />
      </button>
    </div>

    <div class="contacts-tabs">
      <button :class="{ active: !showBlocked }" @click="showBlocked = false">
        Contacts ({{ contactsStore.contacts.length }})
      </button>
      <button :class="{ active: showBlocked }" @click="showBlocked = true">
        Blocked ({{ contactsStore.blockedContacts.length }})
      </button>
    </div>

    <div class="search-box">
      <Search :size="20" />
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search contacts..."
        @input="showAddContact && handleSearch()"
      />
    </div>

    <div v-if="showAddContact" class="add-contact-panel">
      <div class="panel-header">
        <h3>Add New Contact</h3>
        <button @click="showAddContact = false"><X :size="20" /></button>
      </div>
      <div class="search-users">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search users by username..."
          @input="handleSearch"
        />
      </div>
      <div class="search-results" v-if="searchResults.length">
        <div
          v-for="user in searchResults"
          :key="user._id"
          class="user-item"
          @click="handleAddContact(user)"
        >
          <div class="user-avatar">
            <img v-if="user.avatar" :src="user.avatar" :alt="user.username" />
            <span v-else>{{ user.username.charAt(0).toUpperCase() }}</span>
          </div>
          <div class="user-info">
            <span class="username">{{ user.username }}</span>
            <span class="email">{{ user.email }}</span>
          </div>
          <UserPlus :size="20" class="add-icon" />
        </div>
      </div>
      <div v-else-if="searchQuery && !searching" class="no-results">
        No users found
      </div>
    </div>

    <div class="contacts-list" v-if="!showAddContact">
      <div v-if="contactsStore.loading" class="loading">Loading...</div>
      <div v-else-if="filteredContacts.length === 0" class="no-contacts">
        {{ showBlocked ? 'No blocked contacts' : 'No contacts yet' }}
      </div>
      <div
        v-else
        v-for="contact in filteredContacts"
        :key="contact._id"
        class="contact-item"
        @click="!showBlocked && startChat(contact)"
        @contextmenu="showContextMenu($event, contact)"
      >
        <div class="contact-avatar">
          <img v-if="contact.contact.avatar" :src="contact.contact.avatar" :alt="contact.contact.username" />
          <span v-else>{{ contact.contact.username.charAt(0).toUpperCase() }}</span>
        </div>
        <div class="contact-info">
          <span class="contact-name">
            {{ contact.nickname || contact.contact.username }}
          </span>
          <span class="contact-status" v-if="contact.nickname">
            @{{ contact.contact.username }}
          </span>
        </div>
        <button v-if="showBlocked" @click.stop="handleUnblock(contact)" class="btn-unblock">
          Unblock
        </button>
        <button v-else @click.stop="showContextMenu($event, contact)" class="btn-more">
          <MoreVertical :size="20" />
        </button>
      </div>
    </div>

    <div
      v-if="contextMenu.show"
      class="context-menu"
      :style="{ top: contextMenu.y + 'px', left: contextMenu.x + 'px' }"
      @click.stop
    >
      <button @click="startEdit(contextMenu.contact)">
        <Edit2 :size="16" /> Edit nickname
      </button>
      <button @click="handleBlock(contextMenu.contact)">
        <Ban :size="16" /> Block
      </button>
      <button @click="handleDelete(contextMenu.contact)" class="danger">
        <Trash2 :size="16" /> Remove
      </button>
    </div>

    <div v-if="editingContact" class="edit-modal" @click.self="editingContact = null">
      <div class="edit-content">
        <h3>Edit Nickname</h3>
        <input
          v-model="newNickname"
          type="text"
          placeholder="Enter nickname..."
          @keyup.enter="saveNickname"
        />
        <div class="edit-actions">
          <button @click="editingContact = null" class="btn-cancel">Cancel</button>
          <button @click="saveNickname" class="btn-save">Save</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.contacts-view {
  width: 100%;
  height: 100%;
  background: #f0f2f5;
  display: flex;
  flex-direction: column;
}

.contacts-header {
  background: #008069;
  color: white;
  padding: 60px 20px 20px;
  display: flex;
  align-items: center;
  gap: 20px;
}

.contacts-header h2 {
  flex: 1;
  margin: 0;
  font-size: 19px;
  font-weight: 500;
}

.btn-back, .btn-add {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 8px;
  margin: -8px;
}

.contacts-tabs {
  display: flex;
  background: white;
  border-bottom: 1px solid #e9edef;
}

.contacts-tabs button {
  flex: 1;
  padding: 14px;
  border: none;
  background: none;
  color: #667781;
  font-size: 14px;
  cursor: pointer;
  border-bottom: 2px solid transparent;
}

.contacts-tabs button.active {
  color: #008069;
  border-bottom-color: #008069;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  background: white;
  margin: 8px;
  border-radius: 8px;
}

.search-box input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 15px;
}

.search-box svg {
  color: #667781;
}

.contacts-list {
  flex: 1;
  overflow-y: auto;
  background: white;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 12px 20px;
  cursor: pointer;
  transition: background 0.2s;
}

.contact-item:hover {
  background: #f0f2f5;
}

.contact-avatar {
  width: 49px;
  height: 49px;
  border-radius: 50%;
  overflow: hidden;
  background: #00a884;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
}

.contact-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.contact-info {
  flex: 1;
}

.contact-name {
  display: block;
  font-size: 17px;
  color: #111b21;
}

.contact-status {
  display: block;
  font-size: 13px;
  color: #667781;
}

.btn-more {
  background: none;
  border: none;
  color: #667781;
  cursor: pointer;
  padding: 8px;
}

.btn-unblock {
  background: #00a884;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
}

.context-menu {
  position: fixed;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.2);
  z-index: 1000;
  overflow: hidden;
}

.context-menu button {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 20px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 14px;
  color: #111b21;
}

.context-menu button:hover {
  background: #f0f2f5;
}

.context-menu button.danger {
  color: #dc2626;
}

.add-contact-panel {
  background: white;
  margin: 8px;
  border-radius: 8px;
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e9edef;
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
}

.panel-header button {
  background: none;
  border: none;
  cursor: pointer;
  color: #667781;
}

.search-users {
  padding: 12px;
}

.search-users input {
  width: 100%;
  padding: 10px 16px;
  border: 1px solid #e9edef;
  border-radius: 8px;
  font-size: 15px;
  box-sizing: border-box;
}

.search-results {
  max-height: 300px;
  overflow-y: auto;
}

.user-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
}

.user-item:hover {
  background: #f0f2f5;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #00a884;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  overflow: hidden;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-info {
  flex: 1;
}

.user-info .username {
  display: block;
  font-weight: 500;
}

.user-info .email {
  display: block;
  font-size: 13px;
  color: #667781;
}

.add-icon {
  color: #00a884;
}

.no-results, .no-contacts, .loading {
  padding: 40px;
  text-align: center;
  color: #667781;
}

.edit-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.edit-content {
  background: white;
  padding: 24px;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
}

.edit-content h3 {
  margin: 0 0 16px 0;
}

.edit-content input {
  width: 100%;
  padding: 12px;
  border: 1px solid #e9edef;
  border-radius: 8px;
  font-size: 15px;
  box-sizing: border-box;
}

.edit-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
}

.btn-cancel {
  background: none;
  border: none;
  color: #667781;
  cursor: pointer;
  padding: 10px 20px;
}

.btn-save {
  background: #00a884;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
}
</style>
