const request = require('supertest');
const { expect } = require('chai');
const mongoose = require('mongoose');
const User = require('../../src/models/User');
const Message = require('../../src/models/Message');
const { app } = require('../../src/index');

describe('Messages Routes', () => {
  let token, userId, otherUserId;

  before(async () => {
    const testDbUri = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/chat-test';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(testDbUri);
    }
  });

  after(async () => {
    await mongoose.connection.dropDatabase();
  });

  beforeEach(async () => {
    const res1 = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'user1@example.com',
        username: 'user1',
        password: 'password123'
      });

    const res2 = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'user2@example.com',
        username: 'user2',
        password: 'password123'
      });

    token = res1.body.token;
    userId = res1.body.user.id || res1.body.user._id;
    otherUserId = res2.body.user.id || res2.body.user._id;
  });

  afterEach(async () => {
    await Message.deleteMany({});
    await User.deleteMany({});
  });

  it('POST /api/messages - 201', async () => {
    const res = await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${token}`)
      .send({
        recipient_id: otherUserId,
        content: 'Hello'
      })
      .expect(201);

    expect(res.body).to.have.property('_id');
    expect(res.body).to.have.property('content', 'Hello');
    expect(res.body).to.have.property('sender');
    expect(res.body).to.have.property('recipient');
  });

  it('POST /api/messages - 401', async () => {
    await request(app)
      .post('/api/messages')
      .send({
        recipient_id: otherUserId,
        content: 'Test'
      })
      .expect(401);
  });

  it('POST /api/messages - 400 (recipient not found)', async () => {
    await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${token}`)
      .send({ recipient_id: '64b8f1f1f1f1f1f1f1f1f1f1', content: 'Hello' })
      .expect(404);
  });

  it('POST /api/messages - 400 (cannot send to self)', async () => {
    await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${token}`)
      .send({ recipient_id: userId, content: 'Me' })
      .expect(400);
  });

  it('POST /api/messages - 400 (content too long)', async () => {
    const long = 'a'.repeat(5001);
    await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${token}`)
      .send({ recipient_id: otherUserId, content: long })
      .expect(400);
  });

  it('GET /api/messages/:user_id - 200', async () => {
    await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${token}`)
      .send({
        recipient_id: otherUserId,
        content: 'Test'
      });

    const res = await request(app)
      .get(`/api/messages/${otherUserId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.messages).to.be.an('array');
    expect(res.body).to.have.property('pagination');
  });

  it('PUT /api/messages/:id - 200 (edit by owner)', async () => {
    const created = await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${token}`)
      .send({
        recipient_id: otherUserId,
        content: 'Original'
      })
      .expect(201);

    const msgId = created.body._id;

    const updated = await request(app)
      .put(`/api/messages/${msgId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Edited' })
      .expect(200);

    expect(updated.body).to.have.property('edited', true);
    expect(updated.body).to.have.property('content', 'Edited');
  });

  it('PUT /api/messages/:id - 403 (edit not owner)', async () => {
    const created = await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${token}`)
      .send({ recipient_id: otherUserId, content: 'Owned' })
      .expect(201);

    const msgId = created.body._id;

    const res2 = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user2@example.com', password: 'password123' })
      .expect(200);
    const token2 = res2.body.token;

    await request(app)
      .put(`/api/messages/${msgId}`)
      .set('Authorization', `Bearer ${token2}`)
      .send({ content: 'Hacked' })
      .expect(403);
  });

  it('DELETE /api/messages/:id - 200 (soft delete by owner)', async () => {
    const created = await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${token}`)
      .send({
        recipient_id: otherUserId,
        content: 'To delete'
      })
      .expect(201);

    const msgId = created.body._id;

    const delRes = await request(app)
      .delete(`/api/messages/${msgId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(delRes.body).to.have.property('message');
  });

  it('DELETE /api/messages/:id - 403 (delete not owner)', async () => {
    const created = await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${token}`)
      .send({ recipient_id: otherUserId, content: 'Owned' })
      .expect(201);

    const msgId = created.body._id;

    const res2 = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user2@example.com', password: 'password123' })
      .expect(200);
    const token2 = res2.body.token;

    await request(app)
      .delete(`/api/messages/${msgId}`)
      .set('Authorization', `Bearer ${token2}`)
      .expect(403);
  });

  it('POST /api/messages/:id/read - 200 (mark as read by recipient)', async () => {
    const created = await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${token}`)
      .send({
        recipient_id: otherUserId,
        content: 'Please read'
      })
      .expect(201);

    const msgId = created.body._id;

    const res2 = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user2@example.com', password: 'password123' })
      .expect(200);

    const token2 = res2.body.token;

    const readRes = await request(app)
      .post(`/api/messages/${msgId}/read`)
      .set('Authorization', `Bearer ${token2}`)
      .expect(200);

    expect(readRes.body).to.have.property('message');
  });

  it('POST /api/messages/:id/read - 403 (not recipient)', async () => {
    const created = await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${token}`)
      .send({ recipient_id: otherUserId, content: 'Read me' })
      .expect(201);

    const msgId = created.body._id;

    await request(app)
      .post(`/api/messages/${msgId}/read`)
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });

  it('GET /api/messages/conversations - 200 (list conversations)', async () => {
    await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${token}`)
      .send({ recipient_id: otherUserId, content: 'Hi' })
      .expect(201);

    const res = await request(app)
      .get('/api/messages/conversations')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body).to.have.property('conversations');
    expect(res.body.conversations).to.be.an('array');
    expect(res.body.conversations.length).to.be.at.least(1);
    const conv = res.body.conversations[0];
    expect(conv).to.have.property('id');
    expect(conv).to.have.property('otherUser');
    expect(conv.otherUser).to.have.property('id');
    expect(conv).to.have.property('unreadCount');
  });

  it.skip('POST /api/messages/:id/react - 200', async () => {
    const msgRes = await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${token}`)
      .send({
        recipient_id: otherUserId,
        content: 'React to this'
      });

    const messageId = msgRes.body._id;

    await request(app)
      .post(`/api/messages/${messageId}/react`)
      .set('Authorization', `Bearer ${token}`)
      .send({ emoji: '👍' })
      .expect(200);
  });

  it.skip('DELETE /api/messages/:id/react - 200', async () => {
    const msgRes = await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${token}`)
      .send({
        recipient_id: otherUserId,
        content: 'React and unreact'
      });

    const messageId = msgRes.body._id;

    await request(app)
      .post(`/api/messages/${messageId}/react`)
      .set('Authorization', `Bearer ${token}`)
      .send({ emoji: '❤️' });

    await request(app)
      .delete(`/api/messages/${messageId}/react`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });

  it.skip('POST /api/messages/:id/forward - 201', async () => {
    const msgRes = await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${token}`)
      .send({
        recipient_id: otherUserId,
        content: 'Forward this message'
      });

    const messageId = msgRes.body._id;

    await request(app)
      .post(`/api/messages/${messageId}/forward`)
      .set('Authorization', `Bearer ${token}`)
      .send({ recipient_ids: [otherUserId] })
      .expect(201);
  });
});
