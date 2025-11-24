const request = require('supertest');
const { expect } = require('chai');
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../src/models/User');
const Group = require('../src/models/Group');

require('./setup');

const app = express();
app.use(express.json());

const groupController = require('../src/controllers/groupController');
const authMiddleware = require('../src/middleware/auth');

app.get('/groups', authMiddleware, groupController.getGroups);
app.post('/groups', authMiddleware, groupController.createGroup);
app.get('/groups/:id', authMiddleware, groupController.getGroup);
app.put('/groups/:id', authMiddleware, groupController.updateGroup);
app.delete('/groups/:id', authMiddleware, groupController.deleteGroup);
app.post('/groups/:id/members', authMiddleware, groupController.addMember);
app.delete('/groups/:id/members/:userId', authMiddleware, groupController.removeMember);
app.post('/groups/:id/leave', authMiddleware, groupController.leaveGroup);

process.env.JWT_SECRET = 'test-secret';

describe('Group Controller', function() {
  this.timeout(10000);

  let user1, user2, token;

  beforeEach(async () => {
    user1 = await User.create({
      email: 'user1@example.com',
      username: 'user1',
      password: 'password123'
    });

    user2 = await User.create({
      email: 'user2@example.com',
      username: 'user2',
      password: 'password123'
    });

    token = jwt.sign({ userId: user1._id }, process.env.JWT_SECRET);
  });

  describe('POST /groups', () => {
    it('should create a new group', async () => {
      const res = await request(app)
        .post('/groups')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Test Group',
          description: 'A test group'
        });

      expect(res.status).to.equal(201);
      expect(res.body.name).to.equal('Test Group');
      expect(res.body.members).to.have.lengthOf(1);
    });

    it('should return error for missing name', async () => {
      const res = await request(app)
        .post('/groups')
        .set('Authorization', `Bearer ${token}`)
        .send({ description: 'A test group' });

      expect(res.status).to.equal(400);
    });

    it('should create group with initial members', async () => {
      const res = await request(app)
        .post('/groups')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Test Group',
          members: [user2._id.toString()]
        });

      expect(res.status).to.equal(201);
      expect(res.body.members).to.have.lengthOf(2);
    });
  });

  describe('GET /groups', () => {
    it('should return user groups', async () => {
      await Group.create({
        name: 'Test Group',
        members: [{ user: user1._id, role: 'creator' }]
      });

      const res = await request(app)
        .get('/groups')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('array').with.lengthOf(1);
    });
  });

  describe('GET /groups/:id', () => {
    it('should return group details', async () => {
      const group = await Group.create({
        name: 'Test Group',
        members: [{ user: user1._id, role: 'creator' }]
      });

      const res = await request(app)
        .get(`/groups/${group._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).to.equal(200);
      expect(res.body.name).to.equal('Test Group');
    });

    it('should return 404 for non-existent group', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app)
        .get(`/groups/${fakeId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).to.equal(404);
    });
  });

  describe('PUT /groups/:id', () => {
    it('should update group as creator', async () => {
      const group = await Group.create({
        name: 'Test Group',
        members: [{ user: user1._id, role: 'creator' }]
      });

      const res = await request(app)
        .put(`/groups/${group._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated Group' });

      expect(res.status).to.equal(200);
      expect(res.body.name).to.equal('Updated Group');
    });
  });

  describe('POST /groups/:id/members', () => {
    it('should add member to group', async () => {
      const group = await Group.create({
        name: 'Test Group',
        members: [{ user: user1._id, role: 'creator' }]
      });

      const res = await request(app)
        .post(`/groups/${group._id}/members`)
        .set('Authorization', `Bearer ${token}`)
        .send({ userId: user2._id.toString() });

      expect(res.status).to.equal(200);
      expect(res.body.members).to.have.lengthOf(2);
    });
  });

  describe('DELETE /groups/:id/members/:userId', () => {
    it('should remove member from group', async () => {
      const group = await Group.create({
        name: 'Test Group',
        members: [
          { user: user1._id, role: 'creator' },
          { user: user2._id, role: 'member' }
        ]
      });

      const res = await request(app)
        .delete(`/groups/${group._id}/members/${user2._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).to.equal(200);
      expect(res.body.members).to.have.lengthOf(1);
    });
  });

  describe('POST /groups/:id/leave', () => {
    it('should allow member to leave group', async () => {
      const group = await Group.create({
        name: 'Test Group',
        members: [
          { user: user2._id, role: 'creator' },
          { user: user1._id, role: 'member' }
        ]
      });

      const res = await request(app)
        .post(`/groups/${group._id}/leave`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).to.equal(200);
    });
  });

  describe('DELETE /groups/:id', () => {
    it('should delete group as creator', async () => {
      const group = await Group.create({
        name: 'Test Group',
        members: [{ user: user1._id, role: 'creator' }]
      });

      const res = await request(app)
        .delete(`/groups/${group._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).to.equal(200);
    });

    it('should not allow non-creator to delete', async () => {
      const group = await Group.create({
        name: 'Test Group',
        members: [
          { user: user2._id, role: 'creator' },
          { user: user1._id, role: 'member' }
        ]
      });

      const res = await request(app)
        .delete(`/groups/${group._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).to.equal(403);
    });
  });
});
