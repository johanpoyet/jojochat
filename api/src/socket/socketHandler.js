const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const Notification = require('../models/Notification');
const Group = require('../models/Group');
const Contact = require('../models/Contact');
const { retryOperation, handleSocketError } = require('./errorHandler');

const connectedUsers = new Map();
const tokenToSocket = new Map();
const typingUsers = new Map();

const socketHandler = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user._id.toString();
      socket.user = user;
      socket.token = token;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket) => {
    console.log(`User connected: ${socket.userId}`);

    connectedUsers.set(socket.userId, socket.id);
    if (socket.token) {
      tokenToSocket.set(socket.token, socket.id);
    }

    // Log all incoming events for debugging
    socket.onAny((eventName, ...args) => {
      console.log(`[Socket Event] ${eventName}`, args);
    });

    await User.findByIdAndUpdate(socket.userId, {
      status: 'online',
      lastConnection: new Date()
    });

    io.emit('user-online', {
      userId: socket.userId,
      status: 'online'
    });

    socket.on('send-message', async (data) => {
      try {
        const { recipient_id, content, type = 'text', mediaUrl = null } = data;

        if (!recipient_id) {
          return socket.emit('error', { message: 'Recipient is required' });
        }

        if (!content && !mediaUrl) {
          return socket.emit('error', { message: 'Content or media is required' });
        }

        if (content && content.length > 5000) {
          return socket.emit('error', { message: 'Message too long' });
        }

        const recipient = await User.findById(recipient_id);
        if (!recipient) {
          return socket.emit('error', { message: 'Recipient not found' });
        }

        // Check if sender is blocked by recipient
        if (recipient.blockedUsers && recipient.blockedUsers.includes(socket.userId)) {
          return socket.emit('error', { message: 'Cannot send message to this user' });
        }

        // Check if recipient is blocked by sender
        const sender = await User.findById(socket.userId);
        if (sender.blockedUsers && sender.blockedUsers.some(id => id.toString() === recipient_id)) {
          return socket.emit('error', { message: 'Cannot send message to this user' });
        }

        const message = await retryOperation(async () => {
          return await Message.create({
            sender: socket.userId,
            recipient: recipient_id,
            content: content || '',
            type,
            mediaUrl,
            status: 'sent'
          });
        });

        const conversation = await retryOperation(async () => {
          return await Conversation.findOrCreate(socket.userId, recipient_id);
        });

        conversation.lastMessage = message._id;
        const currentCount = conversation.unreadCount.get(recipient_id) || 0;
        conversation.unreadCount.set(recipient_id, currentCount + 1);

        await retryOperation(async () => {
          return await conversation.save();
        });

        const populatedMessage = await Message.findById(message._id)
          .populate('sender', 'username avatar')
          .populate('recipient', 'username avatar');

        socket.emit('message-sent', populatedMessage);

        const notification = await Notification.create({
          recipient: recipient_id,
          sender: socket.userId,
          type: 'message',
          message: message._id,
          content: content.substring(0, 100)
        });

        const recipientSocketId = connectedUsers.get(recipient_id);
        if (recipientSocketId) {
          io.to(recipientSocketId).emit('new-message', populatedMessage);
          io.to(recipientSocketId).emit('notification', {
            type: 'message',
            message: populatedMessage,
            notification_id: notification._id
          });
        }
      } catch (error) {
        handleSocketError(socket, error, 'send-message');
      }
    });

    socket.on('message-read', async (data) => {
      try {
        const { message_id } = data;

        const message = await Message.findById(message_id);

        if (!message) {
          return socket.emit('error', { message: 'Message not found' });
        }

        if (message.recipient.toString() !== socket.userId) {
          return socket.emit('error', { message: 'Not authorized' });
        }

        if (message.status !== 'read') {
          message.status = 'read';
          await message.save();

          const conversation = await Conversation.findOne({
            participants: { $all: [message.sender, message.recipient] }
          });

          if (conversation) {
            const currentCount = conversation.unreadCount.get(socket.userId) || 0;
            conversation.unreadCount.set(socket.userId, Math.max(0, currentCount - 1));
            await conversation.save();
          }

          const notification = await Notification.create({
            recipient: message.sender,
            sender: socket.userId,
            type: 'message_read',
            message: message._id
          });

          const senderSocketId = connectedUsers.get(message.sender.toString());
          if (senderSocketId) {
            io.to(senderSocketId).emit('message-read-confirmation', {
              message_id,
              reader_id: socket.userId
            });
            io.to(senderSocketId).emit('notification', {
              type: 'message_read',
              message_id,
              reader_id: socket.userId,
              notification_id: notification._id
            });
          }
        }
      } catch (error) {
        handleSocketError(socket, error, 'message-read');
      }
    });

    socket.on('typing', (data) => {
      const { recipient_id } = data;

      if (!recipient_id) return;

      const typingKey = `${socket.userId}-${recipient_id}`;

      if (typingUsers.has(typingKey)) {
        clearTimeout(typingUsers.get(typingKey));
      }

      const recipientSocketId = connectedUsers.get(recipient_id);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('user-typing', {
          userId: socket.userId,
          username: socket.user.username
        });
      }

      const timeout = setTimeout(() => {
        typingUsers.delete(typingKey);
        if (recipientSocketId) {
          io.to(recipientSocketId).emit('user-stop-typing', {
            userId: socket.userId
          });
        }
      }, 3000);

      typingUsers.set(typingKey, timeout);
    });

    socket.on('stop-typing', (data) => {
      const { recipient_id } = data;

      if (!recipient_id) return;

      const typingKey = `${socket.userId}-${recipient_id}`;

      if (typingUsers.has(typingKey)) {
        clearTimeout(typingUsers.get(typingKey));
        typingUsers.delete(typingKey);
      }

      const recipientSocketId = connectedUsers.get(recipient_id);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('user-stop-typing', {
          userId: socket.userId
        });
      }
    });

    socket.on('get-user-status', async (data) => {
      const { user_id } = data;

      try {
        const user = await User.findById(user_id).select('status lastConnection');

        if (user) {
          socket.emit('user-status', {
            userId: user_id,
            status: user.status,
            lastConnection: user.lastConnection
          });
        }
      } catch (error) {
        handleSocketError(socket, error, 'get-user-status');
      }
    });

    socket.on('send-group-message', async (data) => {
      try {
        console.log('[send-group-message] Start', { userId: socket.userId, data });
        const { group_id, content, type = 'text', mediaUrl = null, replyTo = null } = data;

        if (!group_id) {
          console.log('[send-group-message] Error: No group_id');
          return socket.emit('error', { message: 'Group ID is required' });
        }

        console.log('[send-group-message] Finding group:', group_id);
        const group = await Group.findById(group_id);
        console.log('[send-group-message] Group found:', group ? 'Yes' : 'No');

        if (!group || !group.isActive) {
          console.log('[send-group-message] Error: Group not found or inactive');
          return socket.emit('error', { message: 'Group not found' });
        }

        console.log('[send-group-message] Checking if user is member');
        const isMember = group.isMember(socket.userId);
        console.log('[send-group-message] Is member:', isMember);

        if (!isMember) {
          console.log('[send-group-message] Error: Not a member');
          return socket.emit('error', { message: 'Not a member of this group' });
        }

        console.log('[send-group-message] Checking if user can post');
        const canPost = group.canPost(socket.userId);
        console.log('[send-group-message] Can post:', canPost);

        if (!canPost) {
          console.log('[send-group-message] Error: Not authorized to post');
          return socket.emit('error', { message: 'Not authorized to post in this group' });
        }

        console.log('[send-group-message] Creating message');
        const message = await Message.create({
          sender: socket.userId,
          group: group_id,
          content,
          type,
          mediaUrl,
          replyTo,
          status: 'sent'
        });
        console.log('[send-group-message] Message created:', message._id);

        group.lastMessage = message._id;
        await group.save();

        const populatedMessage = await Message.findById(message._id)
          .populate('sender', 'username avatar')
          .populate('group', 'name avatar')
          .populate('replyTo');

        console.log('[send-group-message] Emitting message-sent');
        socket.emit('message-sent', populatedMessage);

        console.log('[send-group-message] Broadcasting to members');
        group.members.forEach(member => {
          if (member.user.toString() !== socket.userId) {
            const memberSocketId = connectedUsers.get(member.user.toString());
            if (memberSocketId) {
              io.to(memberSocketId).emit('new-group-message', {
                group_id,
                message: populatedMessage
              });
            }
          }
        });
        console.log('[send-group-message] Done');
      } catch (error) {
        console.error('[send-group-message] Error:', error);
        handleSocketError(socket, error, 'send-group-message');
      }
    });

    socket.on('join-group-room', async (data) => {
      const { group_id } = data;
      const group = await Group.findById(group_id);
      if (group && group.isMember(socket.userId)) {
        socket.join(`group:${group_id}`);
      }
    });

    socket.on('leave-group-room', (data) => {
      const { group_id } = data;
      socket.leave(`group:${group_id}`);
    });

    socket.on('add-reaction', async (data) => {
      try {
        const { message_id, emoji } = data;

        if (!message_id || !emoji) {
          return socket.emit('error', { message: 'Message ID and emoji are required' });
        }

        const message = await Message.findById(message_id);
        if (!message) {
          return socket.emit('error', { message: 'Message not found' });
        }

        const existingReaction = message.reactions.find(
          r => r.user.toString() === socket.userId
        );

        let oldEmoji = null;
        if (existingReaction) {
          if (existingReaction.emoji === emoji) {
            return socket.emit('error', { message: 'Already reacted with this emoji' });
          }
          oldEmoji = existingReaction.emoji;
          message.reactions = message.reactions.filter(
            r => r.user.toString() !== socket.userId
          );
        }

        message.reactions.push({ user: socket.userId, emoji });
        await message.save();

        const reactionData = {
          message_id,
          user_id: socket.userId,
          username: socket.user.username,
          emoji,
          oldEmoji
        };

        socket.emit('reaction-added', reactionData);

        if (message.recipient) {
          // Send to the OTHER participant (not the one who added the reaction)
          const otherUserId = message.sender.toString() === socket.userId
            ? message.recipient.toString()
            : message.sender.toString();
          const otherSocketId = connectedUsers.get(otherUserId);
          if (otherSocketId) {
            io.to(otherSocketId).emit('reaction-added', reactionData);
          }
        } else if (message.group) {
          socket.to(`group:${message.group}`).emit('reaction-added', reactionData);
        }
      } catch (error) {
        handleSocketError(socket, error, 'add-reaction');
      }
    });

    socket.on('remove-reaction', async (data) => {
      try {
        const { message_id, emoji } = data;

        const message = await Message.findById(message_id);
        if (!message) {
          return socket.emit('error', { message: 'Message not found' });
        }

        message.reactions = message.reactions.filter(
          r => !(r.user.toString() === socket.userId && r.emoji === emoji)
        );
        await message.save();

        const reactionData = { message_id, user_id: socket.userId, emoji };

        socket.emit('reaction-removed', reactionData);

        if (message.recipient) {
          // Send to the OTHER participant (not the one who removed the reaction)
          const otherUserId = message.sender.toString() === socket.userId
            ? message.recipient.toString()
            : message.sender.toString();
          const otherSocketId = connectedUsers.get(otherUserId);
          if (otherSocketId) {
            io.to(otherSocketId).emit('reaction-removed', reactionData);
          }
        } else if (message.group) {
          socket.to(`group:${message.group}`).emit('reaction-removed', reactionData);
        }
      } catch (error) {
        handleSocketError(socket, error, 'remove-reaction');
      }
    });

    socket.on('edit-message', async (data) => {
      try {
        const { message_id, content } = data;

        if (!content || content.trim().length === 0) {
          return socket.emit('error', { message: 'Content is required' });
        }

        const message = await Message.findById(message_id);
        if (!message) {
          return socket.emit('error', { message: 'Message not found' });
        }

        if (message.sender.toString() !== socket.userId) {
          return socket.emit('error', { message: 'Not authorized' });
        }

        message.content = content;
        message.edited = true;
        message.editedAt = new Date();
        await message.save();

        const editData = {
          message_id,
          content,
          edited: true,
          editedAt: message.editedAt
        };

        socket.emit('message-edited', editData);

        if (message.recipient) {
          const recipientSocketId = connectedUsers.get(message.recipient.toString());
          if (recipientSocketId) {
            io.to(recipientSocketId).emit('message-edited', editData);
          }
        } else if (message.group) {
          socket.to(`group:${message.group}`).emit('message-edited', editData);
        }
      } catch (error) {
        handleSocketError(socket, error, 'edit-message');
      }
    });

    socket.on('delete-message', async (data) => {
      try {
        const { message_id } = data;

        const message = await Message.findById(message_id);
        if (!message) {
          return socket.emit('error', { message: 'Message not found' });
        }

        if (message.sender.toString() !== socket.userId) {
          return socket.emit('error', { message: 'Not authorized' });
        }

        message.deleted = true;
        message.deletedAt = new Date();
        await message.save();

        const deleteData = { message_id };

        socket.emit('message-deleted', deleteData);

        if (message.recipient) {
          const recipientSocketId = connectedUsers.get(message.recipient.toString());
          if (recipientSocketId) {
            io.to(recipientSocketId).emit('message-deleted', deleteData);
          }
        } else if (message.group) {
          socket.to(`group:${message.group}`).emit('message-deleted', deleteData);
        }
      } catch (error) {
        handleSocketError(socket, error, 'delete-message');
      }
    });

    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.userId}`);

      connectedUsers.delete(socket.userId);
      if (socket.token) {
        tokenToSocket.delete(socket.token);
      }

      for (const [key, timeout] of typingUsers.entries()) {
        if (key.startsWith(socket.userId)) {
          clearTimeout(timeout);
          typingUsers.delete(key);
        }
      }

      await User.findByIdAndUpdate(socket.userId, {
        status: 'offline',
        lastConnection: new Date()
      });

      io.emit('user-offline', {
        userId: socket.userId,
        status: 'offline',
        lastConnection: new Date()
      });
    });
  });

  io.disconnectSessionByToken = (token) => {
    const socketId = tokenToSocket.get(token);
    if (socketId) {
      const socket = io.sockets.sockets.get(socketId);
      if (socket) {
        socket.emit('session-revoked');
        socket.disconnect(true);
      }
    }
  };
};

module.exports = socketHandler;
