const request = require('supertest');
const { expect } = require('chai');
const mongoose = require('mongoose');
const User = require('../../src/models/User');
const { app } = require('../../src/index');

describe('Users Routes', () => {
  let token;

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
    await User.create([
      { email: 'alice@example.com', username: 'alice', password: 'pass123' },
      { email: 'bob@example.com', username: 'bob', password: 'pass123' }
    ]);

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123'
      });

    token = res.body.token;
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  it('GET /api/users - 200', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.users).to.be.an('array');
    expect(res.body.users.length).to.be.at.least(3);
    res.body.users.forEach(user => {
      expect(user).to.not.have.property('password');
    });
  });

  it('GET /api/users - 401', async () => {
    await request(app)
      .get('/api/users')
      .expect(401);
  });

  it('GET /api/users/search - 200', async () => {
    const res = await request(app)
      .get('/api/users/search?q=alice')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.users).to.be.an('array');
  });

  it('GET /api/users/:id - 404 (not found)', async () => {
    await request(app)
      .get('/api/users/64b8f1f1f1f1f1f1f1f1f1f1')
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  it('PUT /api/users/profile - 400 (username too short)', async () => {
    await request(app)
      .put('/api/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ username: 'ab' })
      .expect(400);
  });

  it('PUT /api/users/profile - 400 (username already taken)', async () => {
    // Ensure an existing user 'alice' is present (created in beforeEach)
    await request(app)
      .put('/api/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ username: 'alice' })
      .expect(400);
  });

  it('GET /api/users/search - 400 (missing q)', async () => {
    await request(app)
      .get('/api/users/search')
      .set('Authorization', `Bearer ${token}`)
      .expect(400);
  });

  it('GET /api/users/:id - 200 (found)', async () => {
    const user = await User.create({
      email: 'found@example.com',
      username: 'founduser',
      password: 'password123'
    });

    const res = await request(app)
      .get(`/api/users/${user._id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.username).to.equal('founduser');
  });

  it('PUT /api/users/profile - 200 (update bio)', async () => {
    await request(app)
      .put('/api/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ bio: 'This is my bio' })
      .expect(200);
  });

  it('GET /api/users/blocked - 200', async () => {
    await request(app)
      .get('/api/users/blocked')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });

  it('POST /api/users/:id/block - 200', async () => {
    const userToBlock = await User.create({
      email: 'blockme@example.com',
      username: 'blockmeuser',
      password: 'password123'
    });

    await request(app)
      .post(`/api/users/block/${userToBlock._id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });

  it('POST /api/users/:id/unblock - 200', async () => {
    const userToUnblock = await User.create({
      email: 'unblockme@example.com',
      username: 'unblockmeuser',
      password: 'password123'
    });

    // First block
    await request(app)
      .post(`/api/users/block/${userToUnblock._id}`)
      .set('Authorization', `Bearer ${token}`);

    // Then unblock
    await request(app)
      .post(`/api/users/unblock/${userToUnblock._id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });
});
