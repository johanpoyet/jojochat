const { expect } = require('chai');
const User = require('../src/models/User');
const Session = require('../src/models/Session');

require('./setup');

describe('Session Model', function() {
  this.timeout(10000);

  let user;

  beforeEach(async () => {
    user = await User.create({
      email: 'test@example.com',
      username: 'testuser',
      password: 'password123'
    });
  });

  describe('Create session', () => {
    it('should create a session with token', async () => {
      const session = await Session.create({
        user: user._id,
        token: 'test-token-123',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });

      expect(session._id).to.exist;
      expect(session.token).to.equal('test-token-123');
      expect(session.isActive).to.be.true;
    });

    it('should set default device to unknown', async () => {
      const session = await Session.create({
        user: user._id,
        token: 'test-token-123',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });

      expect(session.device).to.equal('unknown');
    });
  });

  describe('Static methods', () => {
    it('should create session with request info', async () => {
      const mockReq = {
        ip: '127.0.0.1',
        headers: {
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0)'
        }
      };

      const session = await Session.createSession(
        user._id,
        'test-token',
        mockReq
      );

      expect(session.ip).to.equal('127.0.0.1');
      expect(session.device).to.equal('desktop');
    });

    it('should detect mobile device', async () => {
      const mockReq = {
        ip: '127.0.0.1',
        headers: {
          'user-agent': 'Mozilla/5.0 Mobile Safari'
        }
      };

      const session = await Session.createSession(
        user._id,
        'test-token',
        mockReq
      );

      expect(session.device).to.equal('mobile');
    });

    it('should deactivate session', async () => {
      const session = await Session.create({
        user: user._id,
        token: 'test-token-123',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });

      await Session.deactivateSession('test-token-123');

      const updated = await Session.findById(session._id);
      expect(updated.isActive).to.be.false;
    });

    it('should deactivate all user sessions except current', async () => {
      await Session.create({
        user: user._id,
        token: 'token-1',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });

      await Session.create({
        user: user._id,
        token: 'token-2',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });

      await Session.create({
        user: user._id,
        token: 'current-token',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });

      await Session.deactivateAllUserSessions(user._id, 'current-token');

      const sessions = await Session.find({ user: user._id });
      const activeSessions = sessions.filter(s => s.isActive);

      expect(activeSessions).to.have.lengthOf(1);
      expect(activeSessions[0].token).to.equal('current-token');
    });
  });
});
