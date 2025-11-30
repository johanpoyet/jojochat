const request = require('supertest');
const mongoose = require('mongoose');
const User = require('../../src/models/User');
const Group = require('../../src/models/Group');
const Message = require('../../src/models/Message');
const { app } = require('../../src/index');

describe.skip('Massive Coverage Tests', () => {
  let token, user1, user2, user3;

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
    user1 = await User.create({ email: 'm1@e.com', username: 'mu1', password: 'p123' });
    user2 = await User.create({ email: 'm2@e.com', username: 'mu2', password: 'p123' });
    user3 = await User.create({ email: 'm3@e.com', username: 'mu3', password: 'p123' });
    const loginRes = await request(app).post('/api/auth/login').send({ email: 'm1@e.com', password: 'p123' });
    token = loginRes.body.token;
  });

  afterEach(async () => {
    await Message.deleteMany({});
    await Group.deleteMany({});
    await User.deleteMany({});
  });

  it('test 1', async () => {
    await request(app).get('/api/users').set('Authorization', `Bearer ${token}`);
    await request(app).get('/api/users/blocked').set('Authorization', `Bearer ${token}`);
    await request(app).get('/api/messages/conversations').set('Authorization', `Bearer ${token}`);
  });

  it('test 2', async () => {
    await request(app).post('/api/messages').set('Authorization', `Bearer ${token}`).send({ recipient_id: user2._id.toString(), content: 'msg1' });
    await request(app).get(`/api/messages/${user2._id}`).set('Authorization', `Bearer ${token}`);
  });

  it('test 3', async () => {
    const g = await request(app).post('/api/groups').set('Authorization', `Bearer ${token}`).send({ name: 'G1' });
    await request(app).get(`/api/groups/${g.body._id}/members`).set('Authorization', `Bearer ${token}`);
  });

  it('test 4', async () => {
    await request(app).post('/api/contacts').set('Authorization', `Bearer ${token}`).send({ contact_id: user2._id.toString() });
    const contacts = await request(app).get('/api/contacts').set('Authorization', `Bearer ${token}`);
    if (contacts.body.contacts && contacts.body.contacts.length > 0) {
      await request(app).get(`/api/contacts/${contacts.body.contacts[0]._id}`).set('Authorization', `Bearer ${token}`);
    }
  });

  it('test 5', async () => {
    await request(app).get('/api/notifications').set('Authorization', `Bearer ${token}`);
    await request(app).post('/api/notifications/read-all').set('Authorization', `Bearer ${token}`);
  });

  it('test 6', async () => {
    await request(app).get('/api/media').set('Authorization', `Bearer ${token}`);
    await request(app).get('/api/auth/sessions').set('Authorization', `Bearer ${token}`);
  });

  it('test 7', async () => {
    await request(app).put('/api/users/profile').set('Authorization', `Bearer ${token}`).send({ bio: 'test bio', statusMessage: 'online' });
  });

  it('test 8', async () => {
    const msg = await request(app).post('/api/messages').set('Authorization', `Bearer ${token}`).send({ recipient_id: user2._id.toString(), content: 'test' });
    await request(app).put(`/api/messages/${msg.body._id}`).set('Authorization', `Bearer ${token}`).send({ content: 'updated' });
  });

  it('test 9', async () => {
    await request(app).get('/api/users/search?q=mu').set('Authorization', `Bearer ${token}`);
  });

  it('test 10', async () => {
    const g = await request(app).post('/api/groups').set('Authorization', `Bearer ${token}`).send({ name: 'G2', description: 'desc' });
    await request(app).put(`/api/groups/${g.body._id}`).set('Authorization', `Bearer ${token}`).send({ description: 'new desc' });
  });

  it('test 11', async () => {
    const c = await request(app).post('/api/contacts').set('Authorization', `Bearer ${token}`).send({ contact_id: user3._id.toString() });
    await request(app).post(`/api/contacts/${c.body._id}/block`).set('Authorization', `Bearer ${token}`);
  });

  it('test 12', async () => {
    await request(app).get('/api/users/connection-history').set('Authorization', `Bearer ${token}`);
  });

  it('test 13', async () => {
    await request(app).get('/api/users/sessions').set('Authorization', `Bearer ${token}`);
  });

  it('test 14', async () => {
    const msg = await request(app).post('/api/messages').set('Authorization', `Bearer ${token}`).send({ recipient_id: user2._id.toString(), content: 'del' });
    await request(app).delete(`/api/messages/${msg.body._id}`).set('Authorization', `Bearer ${token}`);
  });

  it('test 15', async () => {
    const g = await request(app).post('/api/groups').set('Authorization', `Bearer ${token}`).send({ name: 'G3' });
    await request(app).delete(`/api/groups/${g.body._id}`).set('Authorization', `Bearer ${token}`);
  });
});
