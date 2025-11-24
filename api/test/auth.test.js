const request = require('supertest');
const { expect } = require('chai');
const mongoose = require('mongoose');
const express = require('express');
const User = require('../src/models/User');

require('./setup');

const app = express();
app.use(express.json());

const authController = require('../src/controllers/authController');
const authMiddleware = require('../src/middleware/auth');

app.post('/register', authController.register);
app.post('/login', authController.login);
app.post('/logout', authMiddleware, authController.logout);
app.post('/change-password', authMiddleware, authController.changePassword);

describe('Auth Controller', function() {
  this.timeout(10000);

  describe('POST /register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/register')
        .send({
          email: 'test@example.com',
          username: 'testuser',
          password: 'password123'
        });

      expect(res.status).to.equal(201);
      expect(res.body).to.have.property('token');
      expect(res.body.user).to.have.property('email', 'test@example.com');
    });

    it('should return error if fields are missing', async () => {
      const res = await request(app)
        .post('/register')
        .send({ email: 'test@example.com' });

      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('error');
    });

    it('should return error for invalid email', async () => {
      const res = await request(app)
        .post('/register')
        .send({
          email: 'invalid-email',
          username: 'testuser',
          password: 'password123'
        });

      expect(res.status).to.equal(400);
      expect(res.body.error).to.include('email');
    });

    it('should return error for short username', async () => {
      const res = await request(app)
        .post('/register')
        .send({
          email: 'test@example.com',
          username: 'ab',
          password: 'password123'
        });

      expect(res.status).to.equal(400);
    });

    it('should return error for duplicate email', async () => {
      await User.create({
        email: 'test@example.com',
        username: 'existinguser',
        password: 'password123'
      });

      const res = await request(app)
        .post('/register')
        .send({
          email: 'test@example.com',
          username: 'newuser',
          password: 'password123'
        });

      expect(res.status).to.equal(400);
      expect(res.body.error).to.include('exists');
    });
  });

  describe('POST /login', () => {
    beforeEach(async () => {
      await User.create({
        email: 'login@example.com',
        username: 'loginuser',
        password: 'password123'
      });
    });

    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/login')
        .send({
          email: 'login@example.com',
          password: 'password123'
        });

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('token');
      expect(res.body.user.email).to.equal('login@example.com');
    });

    it('should return error for invalid email', async () => {
      const res = await request(app)
        .post('/login')
        .send({
          email: 'wrong@example.com',
          password: 'password123'
        });

      expect(res.status).to.equal(401);
    });

    it('should return error for invalid password', async () => {
      const res = await request(app)
        .post('/login')
        .send({
          email: 'login@example.com',
          password: 'wrongpassword'
        });

      expect(res.status).to.equal(401);
    });

    it('should return error if fields are missing', async () => {
      const res = await request(app)
        .post('/login')
        .send({ email: 'login@example.com' });

      expect(res.status).to.equal(400);
    });
  });
});
