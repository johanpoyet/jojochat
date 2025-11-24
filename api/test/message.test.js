const { expect } = require('chai');
const User = require('../src/models/User');
const Message = require('../src/models/Message');
const Conversation = require('../src/models/Conversation');

require('./setup');

describe('Message Model', function() {
  this.timeout(10000);

  let user1, user2, conversation;

  beforeEach(async () => {
    user1 = await User.create({
      email: 'user1@example.com',
      username: 'user1',
      password: 'password123'
    });

    user2 = await User.create({
      email: 'user2@example.com',
      username: 'user2',
      password: 'password123'
    });

    conversation = await Conversation.create({
      participants: [user1._id, user2._id]
    });
  });

  describe('Create message', () => {
    it('should create a text message', async () => {
      const message = await Message.create({
        conversation: conversation._id,
        sender: user1._id,
        recipient: user2._id,
        content: 'Hello world',
        type: 'text'
      });

      expect(message._id).to.exist;
      expect(message.content).to.equal('Hello world');
      expect(message.type).to.equal('text');
    });

    it('should create an image message', async () => {
      const message = await Message.create({
        conversation: conversation._id,
        sender: user1._id,
        recipient: user2._id,
        content: '',
        type: 'image',
        mediaUrl: 'http://example.com/image.jpg'
      });

      expect(message.type).to.equal('image');
      expect(message.mediaUrl).to.equal('http://example.com/image.jpg');
    });

    it('should set default status to sent', async () => {
      const message = await Message.create({
        conversation: conversation._id,
        sender: user1._id,
        recipient: user2._id,
        content: 'Test'
      });

      expect(message.status).to.equal('sent');
    });
  });

  describe('Reactions', () => {
    it('should add reaction to message', async () => {
      const message = await Message.create({
        conversation: conversation._id,
        sender: user1._id,
        recipient: user2._id,
        content: 'Test message'
      });

      message.reactions.push({
        user: user2._id,
        emoji: '👍'
      });

      await message.save();

      expect(message.reactions).to.have.lengthOf(1);
      expect(message.reactions[0].emoji).to.equal('👍');
    });
  });

  describe('Message status', () => {
    it('should update message status', async () => {
      const message = await Message.create({
        conversation: conversation._id,
        sender: user1._id,
        recipient: user2._id,
        content: 'Test message'
      });

      message.status = 'read';
      await message.save();

      const updated = await Message.findById(message._id);
      expect(updated.status).to.equal('read');
    });
  });

  describe('Soft delete', () => {
    it('should mark message as deleted', async () => {
      const message = await Message.create({
        conversation: conversation._id,
        sender: user1._id,
        recipient: user2._id,
        content: 'Test message'
      });

      message.deleted = true;
      message.deletedAt = new Date();
      await message.save();

      const updated = await Message.findById(message._id);
      expect(updated.deleted).to.be.true;
    });
  });
});
