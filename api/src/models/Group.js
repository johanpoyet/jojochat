const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['creator', 'admin', 'moderator', 'member'],
    default: 'member'
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { _id: false });

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500,
    default: ''
  },
  avatar: {
    type: String,
    default: null
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [memberSchema],
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  unreadCount: {
    type: Map,
    of: Number,
    default: () => new Map()
  },
  archived: {
    type: Map,
    of: Boolean,
    default: () => new Map()
  },
  settings: {
    onlyAdminsCanPost: {
      type: Boolean,
      default: false
    },
    onlyAdminsCanEditInfo: {
      type: Boolean,
      default: true
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

groupSchema.index({ 'members.user': 1 });
groupSchema.index({ creator: 1 });

groupSchema.methods.isMember = function(userId) {
  return this.members.some(m => m.user.toString() === userId.toString());
};

groupSchema.methods.getMemberRole = function(userId) {
  const member = this.members.find(m => m.user.toString() === userId.toString());
  return member ? member.role : null;
};

groupSchema.methods.canManageMembers = function(userId) {
  const role = this.getMemberRole(userId);
  return ['creator', 'admin'].includes(role);
};

groupSchema.methods.canModerate = function(userId) {
  const role = this.getMemberRole(userId);
  return ['creator', 'admin', 'moderator'].includes(role);
};

groupSchema.methods.canPost = function(userId) {
  if (!this.isMember(userId)) return false;
  if (!this.settings.onlyAdminsCanPost) return true;
  return this.canModerate(userId);
};

module.exports = mongoose.model('Group', groupSchema);
