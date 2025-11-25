const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const User = require('../models/User');
const Group = require('../models/Group');

const createMessage = async (req, res) => {
  try {
    const { recipient_id, content, replyTo } = req.body;
    const senderId = req.user._id;

    if (!recipient_id || !content) {
      return res.status(400).json({ error: 'Recipient and content are required' });
    }

    if (content.length > 5000) {
      return res.status(400).json({ error: 'Message content too long (max 5000 characters)' });
    }

    const recipient = await User.findById(recipient_id);
    if (!recipient) {
      return res.status(404).json({ error: 'Recipient not found' });
    }

    if (senderId.toString() === recipient_id) {
      return res.status(400).json({ error: 'Cannot send message to yourself' });
    }

    // Check if sender is blocked by recipient
    if (recipient.blockedUsers && recipient.blockedUsers.includes(senderId)) {
      return res.status(403).json({ error: 'Cannot send message to this user' });
    }

    // Check if recipient is blocked by sender
    const sender = await User.findById(senderId);
    if (sender.blockedUsers && sender.blockedUsers.includes(recipient_id)) {
      return res.status(403).json({ error: 'Cannot send message to this user' });
    }

    // Verify replyTo message exists if provided
    if (replyTo) {
      const replyToMessage = await Message.findById(replyTo);
      if (!replyToMessage) {
        return res.status(404).json({ error: 'Reply message not found' });
      }
    }

    const message = await Message.create({
      sender: senderId,
      recipient: recipient_id,
      content,
      status: 'sent',
      ...(replyTo && { replyTo })
    });

    const conversation = await Conversation.findOrCreate(senderId.toString(), recipient_id);
    conversation.lastMessage = message._id;
    const currentCount = conversation.unreadCount.get(recipient_id) || 0;
    conversation.unreadCount.set(recipient_id, currentCount + 1);
    await conversation.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'username avatar')
      .populate('recipient', 'username avatar')
      .populate({
        path: 'replyTo',
        populate: { path: 'sender', select: 'username avatar' }
      });

    res.status(201).json(populatedMessage);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const getMessagesByUser = async (req, res) => {
  try {
    const { user_id } = req.params;
    const currentUserId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30;
    const skip = (page - 1) * limit;

    const otherUser = await User.findById(user_id);
    if (!otherUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, recipient: user_id },
        { sender: user_id, recipient: currentUserId }
      ],
      deleted: false
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('sender', 'username avatar')
      .populate('recipient', 'username avatar')
      .populate({
        path: 'replyTo',
        populate: { path: 'sender', select: 'username avatar' }
      });

    await Message.updateMany(
      {
        sender: user_id,
        recipient: currentUserId,
        status: { $ne: 'read' }
      },
      { status: 'read' }
    );

    const conversation = await Conversation.findOne({
      participants: { $all: [currentUserId, user_id] }
    });

    if (conversation) {
      conversation.unreadCount.set(currentUserId.toString(), 0);
      await conversation.save();
    }

    const total = await Message.countDocuments({
      $or: [
        { sender: currentUserId, recipient: user_id },
        { sender: user_id, recipient: currentUserId }
      ],
      deleted: false
    });

    res.json({
      messages,
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

const updateMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Content is required' });
    }

    if (content.length > 5000) {
      return res.status(400).json({ error: 'Message content too long (max 5000 characters)' });
    }

    const message = await Message.findById(id);

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (message.sender.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Not authorized to edit this message' });
    }

    if (message.deleted) {
      return res.status(400).json({ error: 'Cannot edit deleted message' });
    }

    message.content = content;
    message.edited = true;
    await message.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'username avatar')
      .populate('recipient', 'username avatar');

    res.json(populatedMessage);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(id);

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (message.sender.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Not authorized to delete this message' });
    }

    message.deleted = true;
    await message.save();

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(id);

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (message.recipient.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Not authorized to mark this message as read' });
    }

    if (message.status !== 'read') {
      message.status = 'read';
      await message.save();

      const conversation = await Conversation.findOne({
        participants: { $all: [message.sender, message.recipient] }
      });

      if (conversation) {
        const currentCount = conversation.unreadCount.get(userId.toString()) || 0;
        conversation.unreadCount.set(userId.toString(), Math.max(0, currentCount - 1));
        await conversation.save();
      }
    }

    res.json({ message: 'Message marked as read' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const getGroupMessages = async (req, res) => {
  try {
    const { group_id } = req.params;
    const currentUserId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const group = await Group.findById(group_id);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    if (!group.isMember(currentUserId)) {
      return res.status(403).json({ error: 'Not a member of this group' });
    }

    const messages = await Message.find({
      group: group_id,
      deleted: false
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('sender', 'username avatar')
      .populate({
        path: 'replyTo',
        populate: { path: 'sender', select: 'username avatar' }
      });

    const total = await Message.countDocuments({
      group: group_id,
      deleted: false
    });

    res.json({
      messages,
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

const searchMessages = async (req, res) => {
  try {
    const { query, conversationId, senderId } = req.query;
    const currentUserId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    // Build search filter
    const filter = {
      deleted: false,
      content: { $regex: query, $options: 'i' }
    };

    // Filter by conversation (user or group)
    if (conversationId) {
      const isGroup = conversationId.startsWith('group-');
      if (isGroup) {
        const groupId = conversationId.replace('group-', '');
        filter.group = groupId;
      } else {
        filter.$or = [
          { sender: currentUserId, recipient: conversationId },
          { sender: conversationId, recipient: currentUserId }
        ];
      }
    } else {
      // Search in all user's conversations
      filter.$or = [
        { sender: currentUserId },
        { recipient: currentUserId }
      ];
    }

    // Filter by sender
    if (senderId) {
      filter.sender = senderId;
    }

    const messages = await Message.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('sender', 'username avatar')
      .populate('recipient', 'username avatar')
      .populate('group', 'name avatar');

    const total = await Message.countDocuments(filter);

    res.json({
      messages,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Search messages error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  createMessage,
  getMessagesByUser,
  getGroupMessages,
  updateMessage,
  deleteMessage,
  markAsRead,
  searchMessages
};
