const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Session = require('../models/Session');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    let session = await Session.findOne({ token, user: user._id, isActive: true });
    
    if (!session) {
      try {
        const inactiveSession = await Session.findOne({ token, user: user._id });
        if (inactiveSession) {
          inactiveSession.isActive = true;
          inactiveSession.lastActivity = new Date();
          session = await inactiveSession.save();
        } else {
          session = await Session.createSession(user._id, token, req, 7);
        }
      } catch (error) {
        console.error('Failed to create session:', error);
      }
    } else {
      session.lastActivity = new Date();
      await session.save();
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

module.exports = authMiddleware;
