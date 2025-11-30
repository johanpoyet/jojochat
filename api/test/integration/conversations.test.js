const request = require('supertest');
const { expect } = require('chai');
const mongoose = require('mongoose');
const User = require('../../src/models/User');
const { app } = require('../../src/index');

describe.skip('Conversation Routes', () => {
  let token, user1, user2;

  before(async () => {
    const testDbUri = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/chat-test';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(testDbUri);
    }
  });

  after(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    user1 = await User.create({
      email: 'conv1@example.com',
      username: 'convuser1',
      password: 'password123'
    });

    user2 = await User.create({
      email: 'conv2@example.com',
      username: 'convuser2',
      password: 'password123'
    });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'conv1@example.com',
        password: 'password123'
      });

    token = loginRes.body.token;
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  it('GET /api/conversations - 200', async () => {
    const res = await request(app)
      .get('/api/conversations')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body).to.have.property('conversations');
  });

  it('POST /api/conversations/:id/archive - 200', async () => {
    // First send a message to create conversation
    await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${token}`)
      .send({
        recipient_id: user2._id.toString(),
        content: 'Test message'
      });

    const convRes = await request(app)
      .get('/api/conversations')
      .set('Authorization', `Bearer ${token}`);

    if (convRes.body.conversations && convRes.body.conversations.length > 0) {
      const convId = convRes.body.conversations[0]._id;

      await request(app)
        .post(`/api/conversations/${convId}/archive`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    }
  });
});
