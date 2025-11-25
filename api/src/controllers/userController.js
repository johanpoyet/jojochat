const User = require('../models/User');
const Session = require('../models/Session');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Contact = require('../models/Contact');
const path = require('path');
const fs = require('fs');

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user._id,
      username: user.username,
      avatar: user.avatar,
      status: user.status,
      statusMessage: user.statusMessage
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const users = await User.find()
      .select('-password')
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments();

    res.json({
      users: users.map(user => ({
        id: user._id,
        username: user.username,
        avatar: user.avatar,
        status: user.status,
        statusMessage: user.statusMessage
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { username, avatar, statusMessage } = req.body;
    const userId = req.user._id;

    const updateData = {};
    if (username) {
      if (username.length < 3) {
        return res.status(400).json({ error: 'Username must be at least 3 characters' });
      }
      const existingUser = await User.findOne({ username, _id: { $ne: userId } });
      if (existingUser) {
        return res.status(400).json({ error: 'Username already taken' });
      }
      updateData.username = username;
    }
    if (avatar !== undefined) updateData.avatar = avatar;
    if (statusMessage !== undefined) updateData.statusMessage = statusMessage;

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    ).select('-password');

    res.json({
      id: user._id,
      email: user.email,
      username: user.username,
      avatar: user.avatar,
      status: user.status,
      statusMessage: user.statusMessage
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const users = await User.find({
      username: { $regex: q, $options: 'i' }
    }).select('-password').limit(20);

    res.json({
      users: users.map(user => ({
        id: user._id,
        username: user.username,
        avatar: user.avatar,
        status: user.status,
        statusMessage: user.statusMessage
      }))
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Get user's active sessions
const getUserSessions = async (req, res) => {
  try {
    const userId = req.user._id;

    const sessions = await Session.find({ user: userId, isActive: true })
      .sort({ lastActivity: -1 })
      .select('-token');

    res.json({
      sessions: sessions.map(session => ({
        id: session._id,
        ip: session.ip,
        device: session.device,
        userAgent: session.userAgent,
        lastActivity: session.lastActivity,
        createdAt: session.createdAt
      }))
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Get user's connection history
const getConnectionHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const sessions = await Session.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-token');

    const total = await Session.countDocuments({ user: userId });

    res.json({
      sessions: sessions.map(session => ({
        id: session._id,
        ip: session.ip,
        device: session.device,
        userAgent: session.userAgent,
        isActive: session.isActive,
        lastActivity: session.lastActivity,
        createdAt: session.createdAt
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Deactivate a specific session
const deactivateSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user._id;

    const session = await Session.findOne({ _id: sessionId, user: userId });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    session.isActive = false;
    await session.save();

    res.json({ message: 'Session deactivated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const uploadAvatar = async (req, res) => {
  try {
    const userId = req.user._id;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Delete old avatar if exists
    const user = await User.findById(userId);
    if (user.avatar) {
      const oldAvatarPath = path.join(__dirname, '../../uploads', user.avatar);
      if (fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath);
      }
    }

    // Update user with new avatar path
    const avatarPath = `/uploads/avatars/${req.file.filename}`;
    user.avatar = avatarPath;
    await user.save();

    res.json({
      message: 'Avatar uploaded successfully',
      avatar: avatarPath
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const deleteAvatar = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.avatar) {
      const avatarPath = path.join(__dirname, '../../uploads', user.avatar);
      if (fs.existsSync(avatarPath)) {
        fs.unlinkSync(avatarPath);
      }
      user.avatar = null;
      await user.save();
    }

    res.json({ message: 'Avatar deleted successfully' });
  } catch (error) {
    console.error('Delete avatar error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const deleteAccount = async (req, res) => {
  try {
    const userId = req.user._id;
    const { password } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    if (user.avatar) {
      const avatarPath = path.join(__dirname, '../../uploads', user.avatar);
      if (fs.existsSync(avatarPath)) {
        fs.unlinkSync(avatarPath);
      }
    }

    await Session.deleteMany({ user: userId });
    await Contact.deleteMany({ $or: [{ user: userId }, { contact: userId }] });
    await Message.deleteMany({ $or: [{ sender: userId }, { recipient: userId }] });
    await Conversation.deleteMany({ participants: userId });

    await User.findByIdAndDelete(userId);

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const blockUser = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id: blockedUserId } = req.params;

    if (userId.toString() === blockedUserId) {
      return res.status(400).json({ error: 'You cannot block yourself' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const blockedUser = await User.findById(blockedUserId);
    if (!blockedUser) {
      return res.status(404).json({ error: 'User to block not found' });
    }

    if (user.blockedUsers.includes(blockedUserId)) {
      return res.status(400).json({ error: 'User is already blocked' });
    }

    user.blockedUsers.push(blockedUserId);
    await user.save();

    res.json({ message: 'User blocked successfully' });
  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const unblockUser = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id: blockedUserId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.blockedUsers.includes(blockedUserId)) {
      return res.status(400).json({ error: 'User is not blocked' });
    }

    user.blockedUsers = user.blockedUsers.filter(
      id => id.toString() !== blockedUserId
    );
    await user.save();

    res.json({ message: 'User unblocked successfully' });
  } catch (error) {
    console.error('Unblock user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const getBlockedUsers = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).populate('blockedUsers', '-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const blockedUsers = user.blockedUsers.map(blockedUser => ({
      _id: blockedUser._id,
      username: blockedUser.username,
      email: blockedUser.email,
      avatar: blockedUser.avatar
    }));

    res.json({ blockedUsers });
  } catch (error) {
    console.error('Get blocked users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  getUserById,
  getUsers,
  updateProfile,
  searchUsers,
  getUserSessions,
  getConnectionHistory,
  deactivateSession,
  uploadAvatar,
  deleteAvatar,
  deleteAccount,
  blockUser,
  unblockUser,
  getBlockedUsers
};
