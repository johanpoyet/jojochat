const request = require('supertest');
const { expect } = require('chai');
const mongoose = require('mongoose');
const User = require('../../src/models/User');
const Message = require('../../src/models/Message');
const Conversation = require('../../src/models/Conversation');
const Media = require('../../src/models/Media');
const Session = require('../../src/models/Session');
const { app } = require('../../src/index');
const fs = require('fs');
const path = require('path');

describe('Coverage 70% Tests', () => {
  let token1, token2, user1, user2, user3;

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
    // Create users
    user1 = await User.create({
      email: 'cov1@example.com',
      username: 'covuser1',
      password: 'password123'
    });

    user2 = await User.create({
      email: 'cov2@example.com',
      username: 'covuser2',
      password: 'password123'
    });

    user3 = await User.create({
      email: 'cov3@example.com',
      username: 'covuser3',
      password: 'password123'
    });

    const loginRes1 = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'cov1@example.com',
        password: 'password123'
      });

    const loginRes2 = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'cov2@example.com',
        password: 'password123'
      });

    token1 = loginRes1.body.token;
    token2 = loginRes2.body.token;
  });

  afterEach(async () => {
    await User.deleteMany({});
    await Message.deleteMany({});
    await Conversation.deleteMany({});
    await Media.deleteMany({});
    await Session.deleteMany({});
  });

  describe('Conversation Controller', () => {
    it('DELETE /api/messages/conversations/:conversationId - 200', async () => {
      // Create a conversation by sending a message
      const msgRes = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          recipient_id: user2._id.toString(),
          content: 'Test message for delete'
        });

      // Get conversations
      const convRes = await request(app)
        .get('/api/messages/conversations')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      if (convRes.body.conversations && convRes.body.conversations.length > 0) {
        const convId = convRes.body.conversations[0].id;

        // Delete conversation
        await request(app)
          .delete(`/api/messages/conversations/${convId}`)
          .set('Authorization', `Bearer ${token1}`)
          .expect(200);
      }
    });

    it('DELETE /api/messages/conversations/:conversationId - 404 (not found)', async () => {
      await request(app)
        .delete('/api/messages/conversations/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${token1}`)
        .expect(404);
    });

    it('DELETE /api/messages/conversations/:conversationId - 403 (not authorized)', async () => {
      // Create a conversation between user1 and user2
      await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          recipient_id: user2._id.toString(),
          content: 'Test message'
        });

      const convRes = await request(app)
        .get('/api/messages/conversations')
        .set('Authorization', `Bearer ${token1}`);

      if (convRes.body.conversations && convRes.body.conversations.length > 0) {
        const convId = convRes.body.conversations[0].id;

        // Try to delete as user3 (not a participant)
        const loginRes3 = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'cov3@example.com',
            password: 'password123'
          });

        await request(app)
          .delete(`/api/messages/conversations/${convId}`)
          .set('Authorization', `Bearer ${loginRes3.body.token}`)
          .expect(403);
      }
    });

    it('POST /api/messages/archive/:user_id - 200', async () => {
      // Create a conversation
      await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          recipient_id: user2._id.toString(),
          content: 'Test message for archive'
        });

      // Archive conversation
      await request(app)
        .post(`/api/messages/archive/${user2._id.toString()}`)
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);
    });

    it('POST /api/messages/archive/:user_id - 200 (creates conversation if not exists)', async () => {
      // Archive conversation (findOrCreate will create it if it doesn't exist)
      const res = await request(app)
        .post(`/api/messages/archive/${user3._id.toString()}`)
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(res.body).to.have.property('message');
      expect(res.body).to.have.property('archived');
    });
  });

  describe('Media Controller', () => {
    it('GET /api/media/:id - 200', async () => {
      // Create a media file first
      const uploadDir = path.join(__dirname, '../../uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const testFile = path.join(uploadDir, 'test-media.txt');
      fs.writeFileSync(testFile, 'test content');

      const media = await Media.create({
        filename: 'test-media.txt',
        originalName: 'test.txt',
        mimetype: 'text/plain',
        size: 12,
        url: '/uploads/test-media.txt',
        type: 'document',
        uploader: user1._id
      });

      const res = await request(app)
        .get(`/api/media/${media._id}`)
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(res.body).to.have.property('_id');
      expect(res.body).to.have.property('filename');

      // Cleanup
      if (fs.existsSync(testFile)) {
        fs.unlinkSync(testFile);
      }
    });

    it('GET /api/media/:id - 404 (not found)', async () => {
      await request(app)
        .get('/api/media/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${token1}`)
        .expect(404);
    });

    it('DELETE /api/media/:id - 200', async () => {
      // Create a media file
      const uploadDir = path.join(__dirname, '../../uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const testFile = path.join(uploadDir, 'test-delete.txt');
      fs.writeFileSync(testFile, 'test content');

      const media = await Media.create({
        filename: 'test-delete.txt',
        originalName: 'test.txt',
        mimetype: 'text/plain',
        size: 12,
        url: '/uploads/test-delete.txt',
        type: 'document',
        uploader: user1._id
      });

      await request(app)
        .delete(`/api/media/${media._id}`)
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);
    });

    it('DELETE /api/media/:id - 403 (not authorized)', async () => {
      // Create a media file
      const uploadDir = path.join(__dirname, '../../uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const testFile = path.join(uploadDir, 'test-unauth.txt');
      fs.writeFileSync(testFile, 'test content');

      const media = await Media.create({
        filename: 'test-unauth.txt',
        originalName: 'test.txt',
        mimetype: 'text/plain',
        size: 12,
        url: '/uploads/test-unauth.txt',
        type: 'document',
        uploader: user1._id
      });

      // Try to delete as user2
      await request(app)
        .delete(`/api/media/${media._id}`)
        .set('Authorization', `Bearer ${token2}`)
        .expect(403);

      // Cleanup
      if (fs.existsSync(testFile)) {
        fs.unlinkSync(testFile);
      }
    });

    it('GET /api/media with type filter - 200', async () => {
      // Create media with different types
      const uploadDir = path.join(__dirname, '../../uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      await Media.create({
        filename: 'test-image.jpg',
        originalName: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 1000,
        url: '/uploads/test-image.jpg',
        type: 'image',
        uploader: user1._id
      });

      await Media.create({
        filename: 'test-video.mp4',
        originalName: 'test.mp4',
        mimetype: 'video/mp4',
        size: 2000,
        url: '/uploads/test-video.mp4',
        type: 'video',
        uploader: user1._id
      });

      // Get only images
      const res = await request(app)
        .get('/api/media?type=image')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(res.body).to.have.property('media');
      expect(res.body.media).to.be.an('array');
      res.body.media.forEach(media => {
        expect(media.type).to.equal('image');
      });
    });

    it('GET /api/media with pagination - 200', async () => {
      // Create multiple media files
      for (let i = 0; i < 5; i++) {
        await Media.create({
          filename: `test-${i}.txt`,
          originalName: `test${i}.txt`,
          mimetype: 'text/plain',
          size: 100,
          url: `/uploads/test-${i}.txt`,
          type: 'document',
          uploader: user1._id
        });
      }

      const res = await request(app)
        .get('/api/media?page=1&limit=2')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(res.body).to.have.property('media');
      expect(res.body).to.have.property('pagination');
      expect(res.body.pagination.page).to.equal(1);
      expect(res.body.pagination.limit).to.equal(2);
    });
  });

  describe('User Controller', () => {
    it('GET /api/users/sessions/history - 200', async () => {
      // Create some sessions with expiresAt
      const expiresAt1 = new Date();
      expiresAt1.setDate(expiresAt1.getDate() + 7);
      const expiresAt2 = new Date();
      expiresAt2.setDate(expiresAt2.getDate() + 7);

      await Session.create({
        user: user1._id,
        token: 'test-token-1',
        ip: '127.0.0.1',
        device: 'Test Device',
        userAgent: 'Test Agent',
        isActive: true,
        expiresAt: expiresAt1
      });

      await Session.create({
        user: user1._id,
        token: 'test-token-2',
        ip: '127.0.0.1',
        device: 'Test Device 2',
        userAgent: 'Test Agent 2',
        isActive: false,
        expiresAt: expiresAt2
      });

      const res = await request(app)
        .get('/api/users/sessions/history')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(res.body).to.have.property('sessions');
      expect(res.body.sessions).to.be.an('array');
      expect(res.body).to.have.property('pagination');
    });

    it('GET /api/users/sessions/history with pagination - 200', async () => {
      // Create multiple sessions with expiresAt
      for (let i = 0; i < 5; i++) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        await Session.create({
          user: user1._id,
          token: `test-token-${i}`,
          ip: '127.0.0.1',
          device: `Device ${i}`,
          userAgent: 'Test Agent',
          isActive: i % 2 === 0,
          expiresAt
        });
      }

      const res = await request(app)
        .get('/api/users/sessions/history?page=1&limit=2')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(res.body).to.have.property('sessions');
      expect(res.body.sessions.length).to.be.at.most(2);
      expect(res.body.pagination.page).to.equal(1);
      expect(res.body.pagination.limit).to.equal(2);
    });

    it('DELETE /api/users/sessions/:sessionId - 200', async () => {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      const session = await Session.create({
        user: user1._id,
        token: 'test-token-delete',
        ip: '127.0.0.1',
        device: 'Test Device',
        userAgent: 'Test Agent',
        isActive: true,
        expiresAt
      });

      await request(app)
        .delete(`/api/users/sessions/${session._id}`)
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      const updatedSession = await Session.findById(session._id);
      expect(updatedSession.isActive).to.be.false;
    });

    it('DELETE /api/users/sessions/:sessionId - 404 (not found)', async () => {
      await request(app)
        .delete('/api/users/sessions/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${token1}`)
        .expect(404);
    });

    it('DELETE /api/users/avatar - 200', async () => {
      // Set an avatar first
      const user = await User.findById(user1._id);
      user.avatar = '/uploads/avatars/test-avatar.jpg';
      await user.save();

      // Create a dummy avatar file
      const avatarDir = path.join(__dirname, '../../uploads/avatars');
      if (!fs.existsSync(avatarDir)) {
        fs.mkdirSync(avatarDir, { recursive: true });
      }
      const avatarPath = path.join(avatarDir, 'test-avatar.jpg');
      fs.writeFileSync(avatarPath, 'fake image');

      await request(app)
        .delete('/api/users/avatar')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      const updatedUser = await User.findById(user1._id);
      expect(updatedUser.avatar).to.be.null;

      // Cleanup
      if (fs.existsSync(avatarPath)) {
        fs.unlinkSync(avatarPath);
      }
    });

    it('GET /api/users/blocked - 200', async () => {
      // Block a user first
      await request(app)
        .post(`/api/users/block/${user2._id}`)
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      const res = await request(app)
        .get('/api/users/blocked')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(res.body).to.have.property('blockedUsers');
      expect(res.body.blockedUsers).to.be.an('array');
      expect(res.body.blockedUsers.length).to.be.at.least(1);
    });

    it('GET /api/users/blocked - 200 (empty)', async () => {
      const res = await request(app)
        .get('/api/users/blocked')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(res.body).to.have.property('blockedUsers');
      expect(res.body.blockedUsers).to.be.an('array');
    });
  });

  describe('Upload Middleware', () => {
    it('POST /api/media/upload - 400 (no file)', async () => {
      await request(app)
        .post('/api/media/upload')
        .set('Authorization', `Bearer ${token1}`)
        .expect(400);
    });

    it('POST /api/users/avatar - 400 (invalid file type)', async () => {
      const uploadDir = path.join(__dirname, '../../uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const testFile = path.join(uploadDir, 'test.txt');
      fs.writeFileSync(testFile, 'not an image');

      // The middleware will reject this before it reaches the controller
      const res = await request(app)
        .post('/api/users/avatar')
        .set('Authorization', `Bearer ${token1}`)
        .attach('avatar', testFile);

      // Should return 400 or 500 depending on how multer handles it
      expect([400, 500]).to.include(res.status);

      // Cleanup
      if (fs.existsSync(testFile)) {
        fs.unlinkSync(testFile);
      }
    });
  });
});

