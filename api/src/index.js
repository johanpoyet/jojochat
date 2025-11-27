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
const server = http.createServer(app);
const { initSentry, captureError } = require('./config/sentry');
initSentry(app);
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

app.use((err, req, res, next) => {
  captureError(err, {
    method: req.method,
    url: req.url,
    userId: req.user?._id
  });
  res.status(err.statusCode || 500).json({
    error: err.message || 'Server error'
  });
});

const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

if (process.env.SENTRY_DSN) {
  process.on('unhandledRejection', (reason) => {
    captureError(reason instanceof Error ? reason : new Error(String(reason)));
  });

  process.on('uncaughtException', (err) => {
    captureError(err);
    process.exit(1);
  });
}

module.exports = { app, server, io };
