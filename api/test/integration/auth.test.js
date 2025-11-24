const request = require('supertest');
const { expect } = require('chai');
const mongoose = require('mongoose');
const User = require('../../src/models/User');
const { app } = require('../../src/index');

describe('Auth Routes', () => {
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

  afterEach(async () => {
    await User.deleteMany({});
  });

  it('POST /api/auth/register - 201', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'newuser@example.com',
        username: 'newuser',
        password: 'password123'
      })
      .expect(201);

    expect(res.body).to.have.property('token');
    expect(res.body.user).to.not.have.property('password');
  });

  it('POST /api/auth/register - 400', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com' })
      .expect(400);
  });

  it('POST /api/auth/register - 400 invalid email', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'invalid', username: 'xxy', password: 'password123' })
      .expect(400);
  });

  it('POST /api/auth/register - 400 duplicate email/username', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'dup@example.com', username: 'dupuser', password: 'p123456' })
      .expect(201);

    await request(app)
      .post('/api/auth/register')
      .send({ email: 'dup@example.com', username: 'dupuser', password: 'p123456' })
      .expect(400);
  });

  it('POST /api/auth/login - 200', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        email: 'login@example.com',
        username: 'loginuser',
        password: 'password123'
      });

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'login@example.com',
        password: 'password123'
      })
      .expect(200);

    expect(res.body).to.have.property('token');
  });

  it('POST /api/auth/login - 401', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        username: 'testuser',
        password: 'correctpassword'
      });

    await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'wrongpassword'
      })
      .expect(401);
  });

  it('POST /api/auth/logout - 200', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'logout@example.com',
        username: 'logoutuser',
        password: 'password123'
      })
      .expect(201);

    const token = res.body.token;

    await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });
});
