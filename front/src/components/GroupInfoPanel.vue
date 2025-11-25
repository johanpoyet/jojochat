<script setup>
import { ref, computed, onMounted } from 'vue'
import { useGroupsStore } from '../stores/groups'
import { useContactsStore } from '../stores/contacts'
import { useAuthStore } from '../stores/auth'
import {
  X, Edit2, Camera, UserPlus, Shield, ShieldCheck,
  Crown, LogOut, Trash2, MoreVertical, Check
} from 'lucide-vue-next'

const props = defineProps({
  groupId: { type: String, required: true }
})

const emit = defineEmits(['close', 'deleted'])

const groupsStore = useGroupsStore()
const contactsStore = useContactsStore()
const authStore = useAuthStore()

const loading = ref(true)
const editing = ref(null)
const editName = ref('')
const editDescription = ref('')
const showAddMember = ref(false)
const memberMenu = ref({ show: false, member: null, x: 0, y: 0 })

onMounted(async () => {
  await groupsStore.getGroup(props.groupId)
  await contactsStore.fetchContacts()
  loading.value = false
})

const group = computed(() => groupsStore.currentGroup)

const currentUserRole = computed(() => {
  if (!group.value) return null
  const member = group.value.members.find(m => m.user._id === authStore.user?.id)
  return member?.role
})

const canManageMembers = computed(() => {
  return ['creator', 'admin', 'moderator'].includes(currentUserRole.value)
})

const canEditGroup = computed(() => {
  return ['creator', 'admin'].includes(currentUserRole.value)
})

const canDeleteGroup = computed(() => {
  return currentUserRole.value === 'creator'
})

const availableContacts = computed(() => {
  if (!group.value) return []
  const memberIds = group.value.members.map(m => m.user._id)
  return contactsStore.contacts.filter(c => !memberIds.includes(c.contact._id))
})

const getRoleIcon = (role) => {
  switch (role) {
    case 'creator': return Crown
    case 'admin': return ShieldCheck
    case 'moderator': return Shield
    default: return null
  }
}

const startEdit = (field) => {
  editing.value = field
  if (field === 'name') editName.value = group.value.name
  if (field === 'description') editDescription.value = group.value.description || ''
}

const saveEdit = async () => {
  if (editing.value === 'name' && editName.value.trim()) {
    await groupsStore.updateGroup(props.groupId, { name: editName.value.trim() })
  }
  if (editing.value === 'description') {
    await groupsStore.updateGroup(props.groupId, { description: editDescription.value.trim() })
  }
  editing.value = null
}

const addMember = async (contact) => {
  await groupsStore.addMember(props.groupId, contact.contact._id)
  showAddMember.value = false
}

const showMemberMenu = (event, member) => {
  if (member.user._id === authStore.user?.id) return
  if (!canManageMembers.value) return

  event.preventDefault()
  memberMenu.value = {
    show: true,
    member,
    x: event.clientX,
    y: event.clientY
  }
}

const closeMemberMenu = () => {
  memberMenu.value.show = false
}

const removeMember = async () => {
  if (memberMenu.value.member) {
    await groupsStore.removeMember(props.groupId, memberMenu.value.member.user._id)
    closeMemberMenu()
  }
}

const changeRole = async (role) => {
  if (memberMenu.value.member) {
    await groupsStore.updateMemberRole(props.groupId, memberMenu.value.member.user._id, role)
    closeMemberMenu()
  }
}

const leaveGroup = async () => {
  if (confirm('Are you sure you want to leave this group?')) {
    await groupsStore.leaveGroup(props.groupId)
    emit('close')
  }
}

const deleteGroup = async () => {
  if (confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
    await groupsStore.deleteGroup(props.groupId)
    emit('deleted')
  }
}

const handleAvatarUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  const formData = new FormData()
  formData.append('file', file)

  try {
    const response = await fetch(`${authStore.API_URL}/api/media/upload`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${authStore.token}` },
      body: formData
    })

    const data = await response.json()
    if (response.ok) {
      await groupsStore.updateGroup(props.groupId, { avatar: data.url })
    }
  } catch (err) {
    console.error('Failed to upload avatar')
  }
}
</script>

<template>
  <div class="group-info-panel" @click="closeMemberMenu">
    <div class="panel-header">
      <button @click="emit('close')" class="btn-close">
        <X :size="24" />
      </button>
      <h2>Group Info</h2>
    </div>

    <div v-if="loading" class="loading">Loading...</div>

    <div v-else-if="group" class="panel-content">
      <div class="group-avatar-section">
        <div class="avatar-wrapper">
          <img v-if="group.avatar" :src="group.avatar" :alt="group.name" class="group-avatar" />
          <div v-else class="avatar-placeholder">
            {{ group.name.charAt(0).toUpperCase() }}
          </div>
          <label v-if="canEditGroup" class="avatar-edit">
            <Camera :size="20" />
            <input type="file" accept="image/*" @change="handleAvatarUpload" hidden />
          </label>
        </div>
      </div>

      <div class="group-field">
        <div class="field-header">
          <label>Group Name</label>
          <button v-if="canEditGroup && editing !== 'name'" @click="startEdit('name')" class="btn-edit">
            <Edit2 :size="16" />
          </button>
        </div>
        <div v-if="editing === 'name'" class="edit-field">
          <input v-model="editName" @keyup.enter="saveEdit" />
          <button @click="saveEdit"><Check :size="18" /></button>
          <button @click="editing = null"><X :size="18" /></button>
        </div>
        <span v-else class="field-value">{{ group.name }}</span>
      </div>

      <div class="group-field">
        <div class="field-header">
          <label>Description</label>
          <button v-if="canEditGroup && editing !== 'description'" @click="startEdit('description')" class="btn-edit">
            <Edit2 :size="16" />
          </button>
        </div>
        <div v-if="editing === 'description'" class="edit-field">
          <textarea v-model="editDescription" rows="2"></textarea>
          <button @click="saveEdit"><Check :size="18" /></button>
          <button @click="editing = null"><X :size="18" /></button>
        </div>
        <span v-else class="field-value">{{ group.description || 'No description' }}</span>
      </div>

      <div class="members-section">
        <div class="members-header">
          <h3>{{ group.members.length }} members</h3>
          <button v-if="canManageMembers" @click="showAddMember = true" class="btn-add">
            <UserPlus :size="20" />
          </button>
        </div>

        <div v-if="showAddMember" class="add-member-list">
          <div v-if="availableContacts.length === 0" class="no-contacts">
            No contacts to add
          </div>
          <div
            v-for="contact in availableContacts"
            :key="contact._id"
            class="contact-item"
            @click="addMember(contact)"
          >
            <div class="member-avatar">
              <img v-if="contact.contact.avatar" :src="contact.contact.avatar" :alt="contact.contact.username" />
              <span v-else>{{ contact.contact.username.charAt(0).toUpperCase() }}</span>
            </div>
            <span>{{ contact.contact.username }}</span>
            <UserPlus :size="18" class="add-icon" />
          </div>
          <button @click="showAddMember = false" class="btn-cancel-add">Cancel</button>
        </div>

        <div class="members-list">
          <div
            v-for="member in group.members"
            :key="member.user._id"
            class="member-item"
            @contextmenu="showMemberMenu($event, member)"
          >
            <div class="member-avatar">
              <img v-if="member.user.avatar" :src="member.user.avatar" :alt="member.user.username" />
              <span v-else>{{ member.user.username.charAt(0).toUpperCase() }}</span>
            </div>
            <div class="member-info">
              <span class="member-name">
                {{ member.user.username }}
                <span v-if="member.user._id === authStore.user?.id" class="you-badge">You</span>
              </span>
              <span class="member-role" v-if="member.role !== 'member'">
                <component :is="getRoleIcon(member.role)" :size="14" />
                {{ member.role }}
              </span>
            </div>
            <button
              v-if="canManageMembers && member.user._id !== authStore.user?.id"
              @click.stop="showMemberMenu($event, member)"
              class="btn-more"
            >
              <MoreVertical :size="18" />
            </button>
          </div>
        </div>
      </div>

      <div class="actions-section">
        <button @click="leaveGroup" class="btn-leave">
          <LogOut :size="20" />
          Leave Group
        </button>
        <button v-if="canDeleteGroup" @click="deleteGroup" class="btn-delete">
          <Trash2 :size="20" />
          Delete Group
        </button>
      </div>
    </div>

    <div
      v-if="memberMenu.show"
      class="context-menu"
      :style="{ top: memberMenu.y + 'px', left: memberMenu.x + 'px' }"
      @click.stop
    >
      <template v-if="canEditGroup">
        <button @click="changeRole('admin')">Make Admin</button>
        <button @click="changeRole('moderator')">Make Moderator</button>
        <button @click="changeRole('member')">Remove Role</button>
        <hr />
      </template>
      <button @click="removeMember" class="danger">Remove from Group</button>
    </div>
  </div>
</template>

<style scoped>
.group-info-panel {
  width: 100%;
  height: 100%;
  background: #f0f2f5;
  display: flex;
  flex-direction: column;
}

.panel-header {
  background: #008069;
  color: white;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 20px;
}

.panel-header h2 {
  margin: 0;
  font-size: 19px;
  font-weight: 500;
}

.btn-close {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 8px;
  margin: -8px;
}

.loading {
  padding: 40px;
  text-align: center;
  color: #667781;
}

.panel-content {
  flex: 1;
  overflow-y: auto;
}

.group-avatar-section {
  background: white;
  padding: 28px;
  display: flex;
  justify-content: center;
  margin-bottom: 10px;
}

.avatar-wrapper {
  position: relative;
}

.group-avatar, .avatar-placeholder {
  width: 200px;
  height: 200px;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-placeholder {
  background: #00a884;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 72px;
  font-weight: 300;
}

.avatar-edit {
  position: absolute;
  bottom: 10px;
  right: 10px;
  background: #00a884;
  color: white;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.group-field {
  background: white;
  padding: 14px 20px;
  margin-bottom: 1px;
}

.field-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.field-header label {
  color: #008069;
  font-size: 14px;
}

.btn-edit {
  background: none;
  border: none;
  color: #667781;
  cursor: pointer;
}

.field-value {
  color: #111b21;
  font-size: 17px;
}

.edit-field {
  display: flex;
  gap: 8px;
  align-items: center;
}

.edit-field input,
.edit-field textarea {
  flex: 1;
  border: none;
  border-bottom: 2px solid #00a884;
  padding: 4px 0;
  font-size: 17px;
  outline: none;
}

.edit-field textarea {
  resize: none;
}

.edit-field button {
  background: none;
  border: none;
  color: #00a884;
  cursor: pointer;
}

.members-section {
  background: white;
  margin-top: 10px;
}

.members-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  border-bottom: 1px solid #e9edef;
}

.members-header h3 {
  margin: 0;
  font-size: 14px;
  color: #008069;
}

.btn-add {
  background: none;
  border: none;
  color: #00a884;
  cursor: pointer;
}

.add-member-list {
  border-bottom: 1px solid #e9edef;
  padding: 10px;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  cursor: pointer;
  border-radius: 8px;
}

.contact-item:hover {
  background: #f0f2f5;
}

.add-icon {
  margin-left: auto;
  color: #00a884;
}

.btn-cancel-add {
  width: 100%;
  padding: 10px;
  border: none;
  background: none;
  color: #667781;
  cursor: pointer;
}

.no-contacts {
  padding: 20px;
  text-align: center;
  color: #667781;
}

.members-list {
  max-height: 300px;
  overflow-y: auto;
}

.member-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
}

.member-avatar {
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

.member-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.member-info {
  flex: 1;
}

.member-name {
  display: block;
  font-size: 16px;
  color: #111b21;
}

.you-badge {
  background: #e7f8f5;
  color: #00a884;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  margin-left: 8px;
}

.member-role {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #667781;
  text-transform: capitalize;
}

.btn-more {
  background: none;
  border: none;
  color: #667781;
  cursor: pointer;
}

.actions-section {
  margin-top: 10px;
  background: white;
}

.btn-leave,
.btn-delete {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 16px 20px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 16px;
  text-align: left;
}

.btn-leave {
  color: #dc2626;
  border-bottom: 1px solid #e9edef;
}

.btn-delete {
  color: #dc2626;
}

.context-menu {
  position: fixed;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.2);
  z-index: 1000;
  overflow: hidden;
  min-width: 180px;
}

.context-menu button {
  display: block;
  width: 100%;
  padding: 12px 16px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 14px;
  color: #111b21;
  text-align: left;
}

.context-menu button:hover {
  background: #f0f2f5;
}

.context-menu button.danger {
  color: #dc2626;
}

.context-menu hr {
  margin: 0;
  border: none;
  border-top: 1px solid #e9edef;
}
</style>
