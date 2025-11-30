const request = require('supertest');
const { expect } = require('chai');
const mongoose = require('mongoose');
const { app } = require('../../src/index');
const User = require('../../src/models/User');
const Notification = require('../../src/models/Notification');

describe('Notifications Routes', () => {
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
      .send({ email: 'n1@example.com', username: 'nuser1', password: 'password123' })
      .expect(201);
    const res2 = await request(app)
      .post('/api/auth/register')
      .send({ email: 'n2@example.com', username: 'nuser2', password: 'password123' })
      .expect(201);

    token = res1.body.token;
    userId = res1.body.user.id || res1.body.user._id;
    otherUserId = res2.body.user.id || res2.body.user._id;

    await Notification.create([
      { recipient: userId, sender: otherUserId, type: 'message', content: 'Hello', read: false },
      { recipient: userId, sender: otherUserId, type: 'message_read', read: false }
    ]);
  });

  afterEach(async () => {
    await Notification.deleteMany({});
    await User.deleteMany({});
  });

  it('GET /api/notifications - 200 returns list and unreadCount', async () => {
    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body).to.have.property('notifications');
    expect(res.body.notifications).to.be.an('array');
    expect(res.body).to.have.property('unreadCount').that.is.a('number');
    expect(res.body).to.have.property('pagination');
  });

  it('POST /api/notifications/:id/read - 200 marks one as read', async () => {
    const notif = await Notification.findOne({ recipient: userId });

    const res = await request(app)
      .post(`/api/notifications/${notif._id}/read`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body).to.have.property('message');
    const updated = await Notification.findById(notif._id);
    expect(updated.read).to.equal(true);
  });

  it('POST /api/notifications/:id/read - 404 when not owned', async () => {
    const other = await Notification.create({ recipient: otherUserId, sender: userId, type: 'message' });

    await request(app)
      .post(`/api/notifications/${other._id}/read`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  it('POST /api/notifications/read-all - 200 marks all as read', async () => {
    await request(app)
      .post('/api/notifications/read-all')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const unread = await Notification.countDocuments({ recipient: userId, read: false });
    expect(unread).to.equal(0);
  });

  it('DELETE /api/notifications/:id - 200 deletes one', async () => {
    const notif = await Notification.findOne({ recipient: userId });

    const res = await request(app)
      .delete(`/api/notifications/${notif._id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body).to.have.property('message');
    const exists = await Notification.findById(notif._id);
    expect(exists).to.equal(null);
  });

  it('GET /api/notifications - 401 when no token', async () => {
    await request(app)
      .get('/api/notifications')
      .expect(401);
  });
});


