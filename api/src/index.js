require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const messageRoutes = require('./routes/messageRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const contactRoutes = require('./routes/contactRoutes');
const groupRoutes = require('./routes/groupRoutes');
const mediaRoutes = require('./routes/mediaRoutes');
const socketHandler = require('./socket/socketHandler');
const path = require('path');

const app = express();
// initialize Sentry (if configured)
const { initSentry, Sentry } = require('./config/sentry');
initSentry(app);
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

if (process.env.NODE_ENV !== 'test') {
  connectDB();
}

// Sentry request/tracing handlers should come early in the middleware chain
if (process.env.SENTRY_DSN) {
  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.tracingHandler());
}

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.static('public'));

// Health endpoint for CI/CD checks
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/media', mediaRoutes);

socketHandler(io);

app.set('io', io);

const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Sentry error handler should be registered after all routes/middlewares
if (process.env.SENTRY_DSN) {
  app.use(Sentry.Handlers.errorHandler());

  // capture unhandled rejections and uncaught exceptions
  process.on('unhandledRejection', (reason) => {
    try {
      Sentry.captureException(reason);
      // best-effort flush before exit in some deploy scenarios
      Sentry.flush(2000).then(() => {});
    } catch (e) {
      console.error('Failed to report unhandledRejection to Sentry', e);
    }
  });

  process.on('uncaughtException', (err) => {
    try {
      Sentry.captureException(err);
      Sentry.flush(2000).then(() => process.exit(1));
    } catch (e) {
      console.error('Failed to report uncaughtException to Sentry', e);
      process.exit(1);
    }
  });
}

module.exports = { app, server, io };
