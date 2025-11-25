const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Session = require('../models/Session');
const Message = require('../models/Message');
const Contact = require('../models/Contact');
const Conversation = require('../models/Conversation');

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const register = async (req, res) => {
  try {
    const { email, username, password } = req.body;

    if (!email || !username || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ error: 'Email or username already exists' });
    }

    const user = new User({ email, username, password });
    await user.save();

    const token = generateToken(user._id);

    await Session.createSession(user._id, token, req, 7);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
        status: user.status
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    user.status = 'online';
    user.lastConnection = new Date();
    await user.save();

    const token = generateToken(user._id);

    await Session.createSession(user._id, token, req, 7);

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
        status: user.status
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const logout = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.status = 'offline';
    user.lastConnection = new Date();
    await user.save();

    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      await Session.deactivateSession(token);
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const getSessions = async (req, res) => {
  try {
    const userId = req.user._id;
    const currentToken = req.headers.authorization?.split(' ')[1];

    let currentSessionId = null;
    if (currentToken) {
      const currentSession = await Session.findOne({ token: currentToken, user: userId, isActive: true });
      if (currentSession) {
        currentSessionId = currentSession._id.toString();
      }
    }

    const sessions = await Session.find({ user: userId, isActive: true })
      .sort({ lastActivity: -1 })
      .select('-token');

    console.log(`Found ${sessions.length} active sessions for user ${userId}`);

    res.json({
      sessions: sessions.map(session => ({
        _id: session._id,
        id: session._id,
        ip: session.ip,
        device: session.device,
        userAgent: session.userAgent,
        lastActivity: session.lastActivity,
        createdAt: session.createdAt,
        isCurrent: currentSessionId === session._id.toString()
      }))
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const revokeSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user._id;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    const session = await Session.findOne({ _id: sessionId, user: userId, isActive: true }).select('+token');
    if (!session) {
      return res.status(404).json({ error: 'Session not found or already inactive' });
    }

    const sessionToken = session.token;
    session.isActive = false;
    await session.save();

    const io = req.app.get('io');
    if (io && io.disconnectSessionByToken && sessionToken) {
      io.disconnectSessionByToken(sessionToken);
    }

    res.json({ message: 'Session revoked successfully' });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid session ID format' });
    }
    res.status(500).json({ error: 'Server error' });
  }
};

const revokeAllSessions = async (req, res) => {
  try {
    const userId = req.user._id;
    const currentToken = req.headers.authorization?.split(' ')[1];

    await Session.deactivateAllUserSessions(userId, currentToken);

    res.json({ message: 'All other sessions revoked successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(userId);
    const isValid = await user.comparePassword(currentPassword);
    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    const currentToken = req.headers.authorization?.split(' ')[1];
    await Session.deactivateAllUserSessions(userId, currentToken);

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;
    const userId = req.user._id;

    if (!password) {
      return res.status(400).json({ error: 'Password is required to delete account' });
    }

    const user = await User.findById(userId);
    const isValid = await user.comparePassword(password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    await Session.updateMany({ user: userId }, { isActive: false });
    await Contact.deleteMany({ $or: [{ owner: userId }, { contact: userId }] });
    await Message.updateMany(
      { $or: [{ sender: userId }, { recipient: userId }] },
      { deleted: true, content: '[Deleted account]' }
    );
    await Conversation.deleteMany({ participants: userId });
    await User.findByIdAndDelete(userId);

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  register,
  login,
  logout,
  getSessions,
  revokeSession,
  revokeAllSessions,
  changePassword,
  deleteAccount
};
