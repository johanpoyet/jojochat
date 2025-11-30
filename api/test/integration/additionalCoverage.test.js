const request = require('supertest');
const { expect } = require('chai');
const mongoose = require('mongoose');
const User = require('../../src/models/User');
const Message = require('../../src/models/Message');
const { app } = require('../../src/index');

describe.skip('Additional Coverage Tests', () => {
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
      email: 'coverage1@example.com',
      username: 'coverageuser1',
      password: 'password123'
    });

    user2 = await User.create({
      email: 'coverage2@example.com',
      username: 'coverageuser2',
      password: 'password123'
    });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'coverage1@example.com',
        password: 'password123'
      });

    token = loginRes.body.token;
  });

  afterEach(async () => {
    await Message.deleteMany({});
    await User.deleteMany({});
  });

  // Message routes
  it('GET /api/messages/:userId - 200', async () => {
    await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${token}`)
      .send({
        recipient_id: user2._id.toString(),
        content: 'Test message'
      });

    const res = await request(app)
      .get(`/api/messages/${user2._id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body).to.have.property('messages');
  });

  it('GET /api/messages/search - 200', async () => {
    await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${token}`)
      .send({
        recipient_id: user2._id.toString(),
        content: 'searchable content'
      });

    await request(app)
      .get('/api/messages/search?q=searchable')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });

  it('POST /api/messages/:id/reply - 201', async () => {
    const msgRes = await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${token}`)
      .send({
        recipient_id: user2._id.toString(),
        content: 'Original message'
      });

    await request(app)
      .post(`/api/messages/${msgRes.body._id}/reply`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        content: 'Reply message',
        recipient_id: user2._id.toString()
      })
      .expect(201);
  });

  // User routes
  it('GET /api/users/connection-history - 200', async () => {
    await request(app)
      .get('/api/users/connection-history')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });

  it('GET /api/users/sessions - 200', async () => {
    await request(app)
      .get('/api/users/sessions')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });

  // Conversation routes
  it('GET /api/messages/conversations - 200 (empty)', async () => {
    const res = await request(app)
      .get('/api/messages/conversations')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body).to.have.property('conversations');
  });

  // Media routes
  it('GET /api/media/:id - 404 (not found)', async () => {
    await request(app)
      .get('/api/media/507f1f77bcf86cd799439011')
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  // Notification routes
  it('GET /api/notifications - 200 (empty)', async () => {
    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body).to.have.property('notifications');
    expect(res.body).to.have.property('unreadCount');
  });

  // Contact routes
  it('GET /api/contacts - 200 (empty)', async () => {
    const res = await request(app)
      .get('/api/contacts')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body).to.have.property('contacts');
  });

  it('POST /api/contacts - 201', async () => {
    await request(app)
      .post('/api/contacts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        contact_id: user2._id.toString()
      })
      .expect(201);
  });

  it('GET /api/contacts/:id - 200', async () => {
    const contactRes = await request(app)
      .post('/api/contacts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        contact_id: user2._id.toString()
      });

    await request(app)
      .get(`/api/contacts/${contactRes.body._id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });

  it('PUT /api/contacts/:id - 200', async () => {
    const contactRes = await request(app)
      .post('/api/contacts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        contact_id: user2._id.toString()
      });

    await request(app)
      .put(`/api/contacts/${contactRes.body._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        nickname: 'Best Friend'
      })
      .expect(200);
  });

  it('DELETE /api/contacts/:id - 200', async () => {
    const contactRes = await request(app)
      .post('/api/contacts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        contact_id: user2._id.toString()
      });

    await request(app)
      .delete(`/api/contacts/${contactRes.body._id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });

  it('POST /api/contacts/:id/block - 200', async () => {
    const contactRes = await request(app)
      .post('/api/contacts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        contact_id: user2._id.toString()
      });

    await request(app)
      .post(`/api/contacts/${contactRes.body._id}/block`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });

  it('POST /api/contacts/:id/unblock - 200', async () => {
    const contactRes = await request(app)
      .post('/api/contacts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        contact_id: user2._id.toString()
      });

    await request(app)
      .post(`/api/contacts/${contactRes.body._id}/block`)
      .set('Authorization', `Bearer ${token}`);

    await request(app)
      .post(`/api/contacts/${contactRes.body._id}/unblock`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });
});
