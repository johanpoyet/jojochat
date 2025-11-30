const { expect } = require('chai');
const User = require('../../src/models/User');
const Message = require('../../src/models/Message');

require('../setup');

describe('Message Model', () => {
  let sender;
  let recipient;

  beforeEach(async () => {
    sender = await User.create({
      email: 'sender@example.com',
      username: 'sender',
      password: 'password123'
    });

    recipient = await User.create({
      email: 'recipient@example.com',
      username: 'recipient',
      password: 'password123'
    });
  });

  describe('Validation', () => {
    it('should create valid message', async () => {
      const message = await Message.create({
        sender: sender._id,
        recipient: recipient._id,
        content: 'Test message'
      });

      expect(message.content).to.equal('Test message');
      expect(message.status).to.equal('sent');
    });

    it('should fail without content', async () => {
      let error;
      try {
        await Message.create({
          sender: sender._id,
          recipient: recipient._id
        });
      } catch (err) {
        error = err;
      }
      expect(error).to.exist;
      expect(error.name).to.equal('ValidationError');
    });

    it('should fail with empty content', async () => {
      let error;
      try {
        await Message.create({
          sender: sender._id,
          recipient: recipient._id,
          content: ''
        });
      } catch (err) {
        error = err;
      }
      expect(error).to.exist;
      expect(error.name).to.equal('ValidationError');
    });
  });
});
