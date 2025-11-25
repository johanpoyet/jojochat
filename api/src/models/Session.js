const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  token: {
    type: String,
    required: true
  },
  ip: {
    type: String,
    default: null
  },
  userAgent: {
    type: String,
    default: null
  },
  device: {
    type: String,
    default: 'unknown'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

sessionSchema.index({ user: 1 });
sessionSchema.index({ token: 1 });
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

sessionSchema.statics.createSession = async function(userId, token, req, expiresInDays = 7) {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress;
  const userAgent = req.headers['user-agent'] || 'unknown';

  let device = 'desktop';
  const ua = userAgent.toLowerCase();
  
  // Mobile detection
  if (/android|webos|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua)) {
    // Check if it's a tablet (Android tablets usually have 'Mobile' in UA but are tablets)
    if (/ipad|android(?!.*mobile)|tablet/i.test(ua)) {
      device = 'tablet';
    } else {
      device = 'mobile';
    }
  } else if (/ipad|tablet/i.test(ua)) {
    device = 'tablet';
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);

  return this.create({
    user: userId,
    token,
    ip,
    userAgent,
    device,
    expiresAt
  });
};

sessionSchema.statics.deactivateSession = async function(token) {
  return this.findOneAndUpdate({ token }, { isActive: false });
};

sessionSchema.statics.deactivateAllUserSessions = async function(userId, exceptToken = null) {
  const query = { user: userId, isActive: true };
  if (exceptToken) {
    query.token = { $ne: exceptToken };
  }
  return this.updateMany(query, { isActive: false });
};

module.exports = mongoose.model('Session', sessionSchema);
