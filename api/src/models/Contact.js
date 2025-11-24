const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  contact: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  nickname: {
    type: String,
    trim: true,
    maxlength: 50,
    default: null
  },
  blocked: {
    type: Boolean,
    default: false
  },
  blockedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

contactSchema.index({ owner: 1, contact: 1 }, { unique: true });
contactSchema.index({ owner: 1, blocked: 1 });

contactSchema.statics.isBlocked = async function(userId1, userId2) {
  const block = await this.findOne({
    $or: [
      { owner: userId1, contact: userId2, blocked: true },
      { owner: userId2, contact: userId1, blocked: true }
    ]
  });
  return !!block;
};

module.exports = mongoose.model('Contact', contactSchema);
