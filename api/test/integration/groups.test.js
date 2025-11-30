const request = require('supertest');
const { expect } = require('chai');
const mongoose = require('mongoose');
const User = require('../../src/models/User');
const Group = require('../../src/models/Group');
const { app } = require('../../src/index');

describe('Group Routes', () => {
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
      email: 'group1@example.com',
      username: 'groupuser1',
      password: 'password123'
    });

    user2 = await User.create({
      email: 'group2@example.com',
      username: 'groupuser2',
      password: 'password123'
    });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'group1@example.com',
        password: 'password123'
      });

    token = loginRes.body.token;
  });

  afterEach(async () => {
    await Group.deleteMany({});
    await User.deleteMany({});
  });

  it('POST /api/groups - 201', async () => {
    const res = await request(app)
      .post('/api/groups')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Test Group',
        description: 'A test group'
      })
      .expect(201);

    expect(res.body).to.have.property('name');
    expect(res.body.name).to.equal('Test Group');
  });

  it('POST /api/groups - 400 missing name', async () => {
    await request(app)
      .post('/api/groups')
      .set('Authorization', `Bearer ${token}`)
      .send({
        description: 'No name group'
      })
      .expect(400);
  });

  it('GET /api/groups - 200', async () => {
    await request(app)
      .post('/api/groups')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'My Group',
        description: 'Test'
      });

    const res = await request(app)
      .get('/api/groups')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body).to.have.property('groups');
    expect(res.body.groups).to.be.an('array');
  });

  it.skip('GET /api/groups/:id - 200', async () => {
    const groupRes = await request(app)
      .post('/api/groups')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Get Group',
        description: 'Test'
      });

    const groupId = groupRes.body._id;

    const res = await request(app)
      .get(`/api/groups/${groupId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body).to.have.property('name');
    expect(res.body.name).to.equal('Get Group');
  });

  it('PUT /api/groups/:id - 200', async () => {
    const groupRes = await request(app)
      .post('/api/groups')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Original Name',
        description: 'Original desc'
      });

    const groupId = groupRes.body._id;

    const res = await request(app)
      .put(`/api/groups/${groupId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Updated Name',
        description: 'Updated desc'
      })
      .expect(200);

    expect(res.body.name).to.equal('Updated Name');
    expect(res.body.description).to.equal('Updated desc');
  });

  it.skip('POST /api/groups/:id/members - 200', async () => {
    const groupRes = await request(app)
      .post('/api/groups')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Add Members Group'
      });

    const groupId = groupRes.body._id;

    await request(app)
      .post(`/api/groups/${groupId}/members`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        members: [user2._id.toString()]
      })
      .expect(200);
  });

  it('DELETE /api/groups/:id - 200', async () => {
    const groupRes = await request(app)
      .post('/api/groups')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Delete Group'
      });

    const groupId = groupRes.body._id;

    await request(app)
      .delete(`/api/groups/${groupId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });

  it('GET /api/groups/:id/members - 200', async () => {
    const groupRes = await request(app)
      .post('/api/groups')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Members Group'
      });

    const groupId = groupRes.body._id;

    const res = await request(app)
      .get(`/api/groups/${groupId}/members`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body).to.have.property('members');
    expect(res.body.members).to.be.an('array');
  });
});
