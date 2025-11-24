const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  unreadCount: {
    type: Map,
    of: Number,
    default: {}
  }
}, {
  timestamps: true
});

conversationSchema.index({ participants: 1 });

conversationSchema.statics.findOrCreate = async function(userId1, userId2) {
  const participants = [userId1, userId2].sort();

  let conversation = await this.findOne({
    participants: { $all: participants, $size: 2 }
  });

  if (!conversation) {
    conversation = await this.create({
      participants,
      unreadCount: {
        [userId1]: 0,
        [userId2]: 0
      }
    });
  }

  return conversation;
};

module.exports = mongoose.model('Conversation', conversationSchema);
