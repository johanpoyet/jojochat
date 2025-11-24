<script setup>
import { ref, computed } from 'vue'
import { useGroupsStore } from '../stores/groups'
import { useContactsStore } from '../stores/contacts'
import { X, Check, Users } from 'lucide-vue-next'

const emit = defineEmits(['close', 'created'])

const groupsStore = useGroupsStore()
const contactsStore = useContactsStore()

const step = ref(1)
const groupName = ref('')
const groupDescription = ref('')
const selectedMembers = ref([])
const loading = ref(false)
const error = ref('')

const isValidName = computed(() => groupName.value.trim().length >= 3)

const toggleMember = (contact) => {
  const index = selectedMembers.value.findIndex(m => m._id === contact.contact._id)
  if (index === -1) {
    selectedMembers.value.push(contact.contact)
  } else {
    selectedMembers.value.splice(index, 1)
  }
}

const isSelected = (contact) => {
  return selectedMembers.value.some(m => m._id === contact.contact._id)
}

const nextStep = () => {
  if (step.value === 1 && isValidName.value) {
    step.value = 2
  }
}

const prevStep = () => {
  if (step.value === 2) {
    step.value = 1
  }
}

const createGroup = async () => {
  if (!isValidName.value) return

  loading.value = true
  error.value = ''

  const memberIds = selectedMembers.value.map(m => m._id)
  const result = await groupsStore.createGroup(
    groupName.value.trim(),
    groupDescription.value.trim(),
    memberIds
  )

  loading.value = false

  if (result.success) {
    emit('created', result.group)
  } else {
    error.value = result.error
  }
}
</script>

<template>
  <div class="modal-overlay" @click.self="emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h2>{{ step === 1 ? 'New Group' : 'Add Members' }}</h2>
        <button @click="emit('close')" class="btn-close">
          <X :size="24" />
        </button>
      </div>

      <div v-if="error" class="error-message">{{ error }}</div>

      <div v-if="step === 1" class="step-content">
        <div class="group-icon">
          <Users :size="48" />
        </div>

        <div class="form-group">
          <label>Group Name</label>
          <input
            v-model="groupName"
            type="text"
            placeholder="Enter group name"
            maxlength="50"
            @keyup.enter="nextStep"
          />
          <span class="char-count">{{ groupName.length }}/50</span>
        </div>

        <div class="form-group">
          <label>Description (optional)</label>
          <textarea
            v-model="groupDescription"
            placeholder="Group description..."
            maxlength="200"
            rows="3"
          ></textarea>
          <span class="char-count">{{ groupDescription.length }}/200</span>
        </div>

        <div class="modal-actions">
          <button @click="emit('close')" class="btn-cancel">Cancel</button>
          <button @click="nextStep" class="btn-next" :disabled="!isValidName">
            Next
          </button>
        </div>
      </div>

      <div v-if="step === 2" class="step-content">
        <div v-if="selectedMembers.length" class="selected-members">
          <div
            v-for="member in selectedMembers"
            :key="member._id"
            class="selected-chip"
          >
            <span>{{ member.username }}</span>
            <button @click="selectedMembers = selectedMembers.filter(m => m._id !== member._id)">
              <X :size="14" />
            </button>
          </div>
        </div>

        <div class="contacts-list">
          <div v-if="contactsStore.contacts.length === 0" class="no-contacts">
            No contacts available
          </div>
          <div
            v-for="contact in contactsStore.contacts"
            :key="contact._id"
            class="contact-item"
            :class="{ selected: isSelected(contact) }"
            @click="toggleMember(contact)"
          >
            <div class="contact-avatar">
              <img v-if="contact.contact.avatar" :src="contact.contact.avatar" :alt="contact.contact.username" />
              <span v-else>{{ contact.contact.username.charAt(0).toUpperCase() }}</span>
            </div>
            <div class="contact-info">
              <span class="contact-name">{{ contact.nickname || contact.contact.username }}</span>
            </div>
            <div class="checkbox" :class="{ checked: isSelected(contact) }">
              <Check v-if="isSelected(contact)" :size="16" />
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button @click="prevStep" class="btn-cancel">Back</button>
          <button @click="createGroup" class="btn-create" :disabled="loading">
            {{ loading ? 'Creating...' : 'Create Group' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 450px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e9edef;
}

.modal-header h2 {
  margin: 0;
  font-size: 18px;
  color: #111b21;
}

.btn-close {
  background: none;
  border: none;
  cursor: pointer;
  color: #667781;
  padding: 4px;
}

.error-message {
  background: #fee2e2;
  color: #dc2626;
  padding: 12px 20px;
  font-size: 14px;
}

.step-content {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.group-icon {
  width: 100px;
  height: 100px;
  background: #00a884;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  margin: 0 auto 24px;
}

.form-group {
  margin-bottom: 20px;
  position: relative;
}

.form-group label {
  display: block;
  color: #008069;
  font-size: 14px;
  margin-bottom: 8px;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #e9edef;
  border-radius: 8px;
  font-size: 15px;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #00a884;
}

.char-count {
  position: absolute;
  right: 12px;
  bottom: 12px;
  font-size: 12px;
  color: #667781;
}

textarea {
  resize: none;
}

.selected-members {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e9edef;
}

.selected-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #00a884;
  color: white;
  padding: 6px 10px;
  border-radius: 16px;
  font-size: 14px;
}

.selected-chip button {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 0;
  display: flex;
}

.contacts-list {
  max-height: 300px;
  overflow-y: auto;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  cursor: pointer;
  border-radius: 8px;
  transition: background 0.2s;
}

.contact-item:hover {
  background: #f0f2f5;
}

.contact-item.selected {
  background: #e7f8f5;
}

.contact-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #00a884;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 16px;
  overflow: hidden;
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
  font-size: 16px;
  color: #111b21;
}

.checkbox {
  width: 22px;
  height: 22px;
  border: 2px solid #d1d7db;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.checkbox.checked {
  background: #00a884;
  border-color: #00a884;
  color: white;
}

.no-contacts {
  text-align: center;
  color: #667781;
  padding: 40px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e9edef;
}

.btn-cancel {
  background: none;
  border: none;
  color: #667781;
  padding: 12px 24px;
  cursor: pointer;
  font-size: 15px;
}

.btn-next,
.btn-create {
  background: #00a884;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 15px;
}

.btn-next:disabled,
.btn-create:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
