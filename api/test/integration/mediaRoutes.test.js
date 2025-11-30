const request = require('supertest');
const { expect } = require('chai');
const mongoose = require('mongoose');
const User = require('../../src/models/User');
const { app } = require('../../src/index');

describe('Media Routes', () => {
  let token;

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
    const user = await User.create({
      email: 'mediauser@example.com',
      username: 'mediauser',
      password: 'password123'
    });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'mediauser@example.com',
        password: 'password123'
      });

    token = loginRes.body.token;
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  it('GET /api/media - 200', async () => {
    const res = await request(app)
      .get('/api/media')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body).to.have.property('media');
  });

  it('GET /api/media - 401 without token', async () => {
    await request(app)
      .get('/api/media')
      .expect(401);
  });
});
