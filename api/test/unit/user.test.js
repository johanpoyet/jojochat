const { expect } = require('chai');
const mongoose = require('mongoose');
const User = require('../../src/models/User');

describe('User Model', () => {
  before(async () => {
    const testDbUri = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/chat-test';
    await mongoose.connect(testDbUri);
  });

  after(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  describe('Validation', () => {
    it('should create valid user', async () => {
      const user = await User.create({
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123'
      });

      expect(user.email).to.equal('test@example.com');
      expect(user.username).to.equal('testuser');
    });

    it('should fail without email', async () => {
      try {
        await User.create({ username: 'test', password: 'password123' });
        expect.fail('Should fail');
      } catch (error) {
        expect(error.name).to.equal('ValidationError');
      }
    });

    it('should fail without username', async () => {
      try {
        await User.create({ email: 'test@example.com', password: 'password123' });
        expect.fail('Should fail');
      } catch (error) {
        expect(error.name).to.equal('ValidationError');
      }
    });
  });

  describe('Password Hashing', () => {
    it('should hash password', async () => {
      const plainPassword = 'myPassword123';
      const user = await User.create({
        email: 'hash@example.com',
        username: 'hashuser',
        password: plainPassword
      });

      expect(user.password).to.not.equal(plainPassword);
      expect(user.password).to.have.lengthOf(60);
    });

    it('should compare password correctly', async () => {
      const plainPassword = 'correctPassword';
      const user = await User.create({
        email: 'compare@example.com',
        username: 'compareuser',
        password: plainPassword
      });

      const isMatch = await user.comparePassword(plainPassword);
      expect(isMatch).to.be.true;
    });
  });
});
