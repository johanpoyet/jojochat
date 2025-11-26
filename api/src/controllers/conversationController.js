const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');

const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get current user with blocked users list
    const currentUser = await User.findById(userId).select('blockedUsers');

    const conversations = await Conversation.find({
      participants: userId
    })
      .populate('participants', 'username avatar status blockedUsers')
      .populate({
        path: 'lastMessage',
        select: 'content createdAt sender recipient deleted',
        match: { deleted: { $ne: true } }
      })
      .sort({ updatedAt: -1 });

    const formattedConversations = conversations
      .filter(conv => {
        const otherUser = conv.participants.find(
          p => p._id.toString() !== userId.toString()
        );

        if (!otherUser) return false;

        // Filter out conversations with blocked users
        const isBlockedByMe = currentUser.blockedUsers && currentUser.blockedUsers.some(
          id => id.toString() === otherUser._id.toString()
        );
        const isBlockingMe = otherUser.blockedUsers && otherUser.blockedUsers.some(
          id => id.toString() === userId.toString()
        );

        return !isBlockedByMe && !isBlockingMe;
      })
      .map(conv => {
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
          lastMessage: conv.lastMessage && !conv.lastMessage.deleted ? {
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
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const deleteConversation = async (req, res) => {
  try {
    const userId = req.user._id;
    const { conversationId } = req.params;

    // Find the conversation
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Check if user is a participant
    const isParticipant = conversation.participants.some(
      p => p.toString() === userId.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Delete all messages in the conversation
    await Message.deleteMany({ conversation: conversationId });

    // Delete the conversation
    await Conversation.findByIdAndDelete(conversationId);

    res.json({ message: 'Conversation deleted successfully' });
  } catch (error) {
    console.error('Delete conversation error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getConversations, deleteConversation };
