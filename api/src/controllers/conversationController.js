const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    const conversations = await Conversation.find({
      participants: userId
    })
      .populate('participants', 'username avatar status')
      .populate({
        path: 'lastMessage',
        select: 'content createdAt sender recipient'
      })
      .sort({ updatedAt: -1 });

    const formattedConversations = conversations.map(conv => {
      const otherUser = conv.participants.find(
        p => p._id.toString() !== userId.toString()
      );

      const unreadCount = conv.unreadCount.get(userId.toString()) || 0;

      return {
        id: conv._id,
        otherUser: {
          id: otherUser._id,
          username: otherUser.username,
          avatar: otherUser.avatar,
          status: otherUser.status
        },
        lastMessage: conv.lastMessage ? {
          content: conv.lastMessage.content,
          createdAt: conv.lastMessage.createdAt,
          isSender: conv.lastMessage.sender.toString() === userId.toString()
        } : null,
        unreadCount,
        updatedAt: conv.updatedAt
      };
    });

    res.json({ conversations: formattedConversations });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getConversations };
