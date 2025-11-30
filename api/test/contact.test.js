const request = require('supertest');
const { expect } = require('chai');
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../src/models/User');
const Contact = require('../src/models/Contact');

require('./setup');

const app = express();
app.use(express.json());

const contactController = require('../src/controllers/contactController');
const authMiddleware = require('../src/middleware/auth');

app.get('/contacts', authMiddleware, contactController.getContacts);
app.post('/contacts', authMiddleware, contactController.addContact);
app.get('/contacts/:id', authMiddleware, contactController.getContact);
app.put('/contacts/:id', authMiddleware, contactController.updateContact);
app.delete('/contacts/:id', authMiddleware, contactController.deleteContact);
app.post('/contacts/:id/block', authMiddleware, contactController.blockContact);
app.post('/contacts/:id/unblock', authMiddleware, contactController.unblockContact);
app.get('/contacts/search', authMiddleware, contactController.searchContacts);

process.env.JWT_SECRET = 'test-secret';

describe('Contact Controller', function() {
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

  describe('GET /contacts', () => {
    it('should return empty array when no contacts', async () => {
      const res = await request(app)
        .get('/contacts')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).to.equal(200);
      expect(res.body.contacts).to.be.an('array').that.is.empty;
    });

    it('should return contacts list', async () => {
      await Contact.create({
        owner: user1._id,
        contact: user2._id
      });

      const res = await request(app)
        .get('/contacts')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).to.equal(200);
      expect(res.body.contacts).to.be.an('array').with.lengthOf(1);
    });
  });

  describe('POST /contacts', () => {
    it('should add a new contact', async () => {
      const res = await request(app)
        .post('/contacts')
        .set('Authorization', `Bearer ${token}`)
        .send({ contact_id: user2._id.toString() });

      expect(res.status).to.equal(201);
      expect(res.body.contact._id.toString()).to.equal(user2._id.toString());
    });

    it('should return error if contact already exists', async () => {
      await Contact.create({
        owner: user1._id,
        contact: user2._id
      });

      const res = await request(app)
        .post('/contacts')
        .set('Authorization', `Bearer ${token}`)
        .send({ contact_id: user2._id.toString() });

      expect(res.status).to.equal(400);
    });

    it('should return error if adding self as contact', async () => {
      const res = await request(app)
        .post('/contacts')
        .set('Authorization', `Bearer ${token}`)
        .send({ contactId: user1._id.toString() });

      expect(res.status).to.equal(400);
    });
  });

  describe('DELETE /contacts/:id', () => {
    it('should remove a contact', async () => {
      const contact = await Contact.create({
        owner: user1._id,
        contact: user2._id
      });

      const res = await request(app)
        .delete(`/contacts/${contact._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).to.equal(200);
    });
  });

  describe('POST /contacts/:id/block', () => {
    it('should block a contact', async () => {
      const contact = await Contact.create({
        owner: user1._id,
        contact: user2._id
      });

      const res = await request(app)
        .post(`/contacts/${contact._id}/block`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).to.equal(200);
      expect(res.body.message).to.equal('Contact blocked successfully');
      const updatedContact = await Contact.findById(contact._id);
      expect(updatedContact.blocked).to.be.true;
    });
  });

  describe('POST /contacts/:id/unblock', () => {
    it('should unblock a contact', async () => {
      const contact = await Contact.create({
        owner: user1._id,
        contact: user2._id,
        blocked: true
      });

      const res = await request(app)
        .post(`/contacts/${contact._id}/unblock`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).to.equal(200);
      expect(res.body.message).to.equal('Contact unblocked successfully');
      const updatedContact = await Contact.findById(contact._id);
      expect(updatedContact.blocked).to.be.false;
    });
  });

  describe('GET /contacts/search', () => {
    it.skip('should search users by username', async () => {
      // Créer un contact d'abord
      await Contact.create({
        owner: user1._id,
        contact: user2._id
      });

      const res = await request(app)
        .get('/contacts/search?q=user2')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).to.equal(200);
      expect(res.body.contacts).to.be.an('array');
    });
  });
});
