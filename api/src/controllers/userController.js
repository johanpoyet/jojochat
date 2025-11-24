const User = require('../models/User');

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

module.exports = { getUserById, getUsers, updateProfile, searchUsers };
