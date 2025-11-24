const { expect } = require('chai');
const User = require('../src/models/User');

require('./setup');

describe('User Model', function() {
  this.timeout(10000);

  describe('Validation', () => {
    it('should create a valid user', async () => {
      const user = new User({
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123'
      });

      const savedUser = await user.save();
      expect(savedUser._id).to.exist;
      expect(savedUser.email).to.equal('test@example.com');
      expect(savedUser.username).to.equal('testuser');
    });

    it('should hash password before saving', async () => {
      const user = new User({
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123'
      });

      await user.save();
      expect(user.password).to.not.equal('password123');
    });

    it('should require email', async () => {
      const user = new User({
        username: 'testuser',
        password: 'password123'
      });

      try {
        await user.save();
        expect.fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).to.equal('ValidationError');
      }
    });

    it('should require username', async () => {
      const user = new User({
        email: 'test@example.com',
        password: 'password123'
      });

      try {
        await user.save();
        expect.fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).to.equal('ValidationError');
      }
    });
  });

  describe('Password comparison', () => {
    it('should return true for correct password', async () => {
      const user = await User.create({
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123'
      });

      const isValid = await user.comparePassword('password123');
      expect(isValid).to.be.true;
    });

    it('should return false for incorrect password', async () => {
      const user = await User.create({
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123'
      });

      const isValid = await user.comparePassword('wrongpassword');
      expect(isValid).to.be.false;
    });
  });

  describe('Default values', () => {
    it('should set default status to offline', async () => {
      const user = await User.create({
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123'
      });

      expect(user.status).to.equal('offline');
    });
  });
});
