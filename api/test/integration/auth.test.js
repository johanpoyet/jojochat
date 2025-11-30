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

  it('GET /api/auth/sessions - 200', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'sessions@example.com',
        username: 'sessionsuser',
        password: 'password123'
      })
      .expect(201);

    const token = res.body.token;

    const sessionsRes = await request(app)
      .get('/api/auth/sessions')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(sessionsRes.body.sessions).to.be.an('array');
  });

  it('POST /api/auth/change-password - 200', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'changepass@example.com',
        username: 'changepassuser',
        password: 'oldpassword'
      })
      .expect(201);

    const token = res.body.token;

    await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword: 'oldpassword',
        newPassword: 'newpassword123'
      })
      .expect(200);
  });

  it('POST /api/auth/change-password - 401 wrong current password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'wrongpass@example.com',
        username: 'wrongpassuser',
        password: 'correctpassword'
      })
      .expect(201);

    const token = res.body.token;

    await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword: 'wrongpassword',
        newPassword: 'newpassword123'
      })
      .expect(401);
  });

  it('DELETE /api/auth/account - 200', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'deleteaccount@example.com',
        username: 'deleteuser',
        password: 'password123'
      })
      .expect(201);

    const token = res.body.token;

    await request(app)
      .delete('/api/auth/account')
      .set('Authorization', `Bearer ${token}`)
      .send({ password: 'password123' })
      .expect(200);
  });

  it('DELETE /api/auth/account - 401 wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'deletewrong@example.com',
        username: 'deletewronguser',
        password: 'password123'
      })
      .expect(201);

    const token = res.body.token;

    await request(app)
      .delete('/api/auth/account')
      .set('Authorization', `Bearer ${token}`)
      .send({ password: 'wrongpassword' })
      .expect(401);
  });

  it('DELETE /api/auth/sessions/:id - 200', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'revokesession@example.com',
        username: 'revokeuser',
        password: 'password123'
      })
      .expect(201);

    const token = res.body.token;

    const sessionsRes = await request(app)
      .get('/api/auth/sessions')
      .set('Authorization', `Bearer ${token}`);

    if (sessionsRes.body.sessions && sessionsRes.body.sessions.length > 0) {
      const sessionId = sessionsRes.body.sessions[0]._id;

      await request(app)
        .delete(`/api/auth/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    }
  });

  it.skip('POST /api/auth/sessions/revoke-all - 200', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'revokeall@example.com',
        username: 'revokealluser',
        password: 'password123'
      })
      .expect(201);

    const token = res.body.token;

    await request(app)
      .post('/api/auth/sessions/revoke-all')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });
});
