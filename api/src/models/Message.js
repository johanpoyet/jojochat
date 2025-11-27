const mongoose = require('mongoose');

const reactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  emoji: {
    type: String,
    required: true,
    maxlength: 10
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    default: null
  },
  type: {
    type: String,
    enum: ['text', 'image', 'video', 'audio', 'document', 'system'],
    default: 'text'
  },
  content: {
    type: String,
    maxlength: 5000,
    required: function() {
      return this.type === 'text';
    },
    validate: {
      validator: function(v) {
        // If type is text, content cannot be empty
        if (this.type === 'text') {
          return v && v.trim().length > 0;
        }
        return true;
      },
      message: 'Content cannot be empty for text messages'
    }
  },
  mediaUrl: {
    type: String,
    default: null
  },
  media: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Media',
    default: null
  },
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  reactions: [reactionSchema],
  status: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'read'],
    default: 'sent'
  },
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  edited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date,
    default: null
  },
  deleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

messageSchema.index({ sender: 1, recipient: 1 });
messageSchema.index({ group: 1, createdAt: -1 });
messageSchema.index({ replyTo: 1 });

messageSchema.pre('validate', function(next) {
  if (!this.recipient && !this.group) {
    next(new Error('Message must have either recipient or group'));
  } else {
    next();
  }
});

module.exports = mongoose.model('Message', messageSchema);
