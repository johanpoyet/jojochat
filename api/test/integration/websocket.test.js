const { expect } = require('chai');
const mongoose = require('mongoose');
const request = require('supertest');
const { io: ioClient } = require('socket.io-client');
const User = require('../../src/models/User');
const Message = require('../../src/models/Message');
const { app, server } = require('../../src/index');

let BASE_URL = 'http://localhost:3000';

describe('WebSocket', function() {
  this.timeout(20000);
  let token1, token2, user1, user2;
  let socket1, socket2;

  before(async () => {
    const testDbUri = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/chat-test';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(testDbUri);
    }
    if (!server.listening) {
      await new Promise((resolve) => {
        server.listen(0, () => resolve());
      });
      const address = server.address();
      BASE_URL = `http://localhost:${address.port}`;
    }
  });

  after(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    server.close();
  });

  beforeEach(async () => {
    const res1 = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'socket1@example.com',
        username: 'socketuser1',
        password: 'password123'
      });

    const res2 = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'socket2@example.com',
        username: 'socketuser2',
        password: 'password123'
      });

    token1 = res1.body.token;
    token2 = res2.body.token;
    user1 = res1.body.user;
    user2 = res2.body.user;
  });

  afterEach(async () => {
    if (socket1 && socket1.connected) socket1.disconnect();
    if (socket2 && socket2.connected) socket2.disconnect();
    await Message.deleteMany({});
    await User.deleteMany({});
  });

  it('should connect with token', (done) => {
    socket1 = ioClient(BASE_URL, {
      auth: { token: token1 },
      transports: ['websocket']
    });

    socket1.on('connect', () => {
      expect(socket1.connected).to.be.true;
      done();
    });
  });

  it('should reject without token', (done) => {
    socket1 = ioClient(BASE_URL, {
      transports: ['websocket']
    });

    socket1.on('connect_error', (err) => {
      expect(err).to.exist;
      done();
    });
  });

  it('should send and receive message', (done) => {
    socket1 = ioClient(BASE_URL, {
      auth: { token: token1 },
      transports: ['websocket']
    });

    socket2 = ioClient(BASE_URL, {
      auth: { token: token2 },
      transports: ['websocket']
    });

    let count = 0;
    const checkBoth = () => {
      count++;
      if (count === 2) {
        socket1.emit('send-message', {
          recipient_id: user2.id || user2._id,
          content: 'Hello'
        });
      }
    };

    socket1.on('connect', checkBoth);
    socket2.on('connect', checkBoth);

    socket2.on('new-message', (data) => {
      expect(data).to.exist;
      expect(data).to.have.property('content', 'Hello');
      done();
    });
  });

  it('should send user-status on request', (done) => {
    socket1 = ioClient(BASE_URL, { auth: { token: token1 }, transports: ['websocket'] });
    socket2 = ioClient(BASE_URL, { auth: { token: token2 }, transports: ['websocket'] });

    let both = 0;
    const onBoth = () => {
      both++;
      if (both === 2) {
        setTimeout(() => {
          socket1.emit('get-user-status', { user_id: user2.id || user2._id });
        }, 50);
      }
    };
    socket1.on('connect', onBoth);
    socket2.on('connect', onBoth);

    socket1.once('user-status', (payload) => {
      try {
        expect(payload).to.have.property('userId');
        expect(payload).to.have.property('status');
        done();
      } catch (e) { done(e); }
    });
  });

  it('should confirm message-read to sender', async () => {
    const reg1 = await request(app).post('/api/auth/login').send({ email: 'socket1@example.com', password: 'password123' });
    const tokenSender = reg1.body.token || token1;
    const created = await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${tokenSender}`)
      .send({ recipient_id: user2._id || user2.id, content: 'to-read' })
      .expect(201);

    socket1 = ioClient(BASE_URL, { auth: { token: token1 }, transports: ['websocket'] });
    socket2 = ioClient(BASE_URL, { auth: { token: token2 }, transports: ['websocket'] });

    await new Promise((resolve, reject) => {
      let both = 0;
      const onBoth = () => {
        both++;
        if (both === 2) {
          setTimeout(() => {
            socket2.emit('message-read', { message_id: created.body._id });
          }, 50);
        }
      };
      socket1.on('connect', onBoth);
      socket2.on('connect', onBoth);

      socket1.once('message-read-confirmation', (data) => {
        try {
          expect(data).to.have.property('message_id');
          resolve();
        } catch (e) { reject(e); }
      });
    });
  });

  it('should emit user-typing and user-stop-typing', (done) => {
    socket1 = ioClient(BASE_URL, { auth: { token: token1 }, transports: ['websocket'] });
    socket2 = ioClient(BASE_URL, { auth: { token: token2 }, transports: ['websocket'] });

    let both = 0;
    const onBoth = () => {
      both++;
      if (both === 2) {
        socket1.emit('typing', { recipient_id: user2.id || user2._id });
        setTimeout(() => {
          socket1.emit('stop-typing', { recipient_id: user2.id || user2._id });
        }, 30);
      }
    };
    socket1.on('connect', onBoth);
    socket2.on('connect', onBoth);

    let sawTyping = false;
    let sawStop = false;
    const maybeDone = () => { if (sawTyping && sawStop) done(); };

    socket2.once('user-typing', (payload) => { if (payload && payload.userId) { sawTyping = true; maybeDone(); } });
    socket2.once('user-stop-typing', (payload) => { if (payload && payload.userId) { sawStop = true; maybeDone(); } });
  });

  it('should broadcast user-offline on disconnect', (done) => {
    socket1 = ioClient(BASE_URL, { auth: { token: token1 }, transports: ['websocket'] });
    socket2 = ioClient(BASE_URL, { auth: { token: token2 }, transports: ['websocket'] });

    let both = 0;
    const onBoth = () => {
      both++;
      if (both === 2) {
        socket2.once('user-offline', (payload) => {
          try {
            expect(payload).to.have.property('userId');
            expect(payload).to.have.property('status', 'offline');
            done();
          } catch (e) { done(e); }
        });
        setTimeout(() => socket1.disconnect(), 50);
      }
    };
    socket1.on('connect', onBoth);
    socket2.on('connect', onBoth);
  });
});
