const { expect } = require('chai');
const User = require('../src/models/User');
const Media = require('../src/models/Media');

require('./setup');

describe.skip('Media Model', function() {
  this.timeout(10000);

  let user;

  beforeEach(async () => {
    user = await User.create({
      email: 'test@example.com',
      username: 'testuser',
      password: 'password123'
    });
  });

  describe('Create media', () => {
    it('should create media record', async () => {
      const media = await Media.create({
        user: user._id,
        filename: 'test-image.jpg',
        originalName: 'my-photo.jpg',
        mimetype: 'image/jpeg',
        size: 1024000,
        url: '/uploads/test-image.jpg'
      });

      expect(media._id).to.exist;
      expect(media.filename).to.equal('test-image.jpg');
      expect(media.originalName).to.equal('my-photo.jpg');
    });

    it('should require user', async () => {
      try {
        await Media.create({
          filename: 'test.jpg',
          originalName: 'test.jpg',
          mimetype: 'image/jpeg',
          size: 1024,
          url: '/uploads/test.jpg'
        });
        expect.fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).to.equal('ValidationError');
      }
    });

    it('should require filename', async () => {
      try {
        await Media.create({
          user: user._id,
          originalName: 'test.jpg',
          mimetype: 'image/jpeg',
          size: 1024,
          url: '/uploads/test.jpg'
        });
        expect.fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).to.equal('ValidationError');
      }
    });
  });

  describe('Media types', () => {
    it('should store video media', async () => {
      const media = await Media.create({
        user: user._id,
        filename: 'video.mp4',
        originalName: 'my-video.mp4',
        mimetype: 'video/mp4',
        size: 10240000,
        url: '/uploads/video.mp4'
      });

      expect(media.mimetype).to.equal('video/mp4');
    });

    it('should store document media', async () => {
      const media = await Media.create({
        user: user._id,
        filename: 'document.pdf',
        originalName: 'report.pdf',
        mimetype: 'application/pdf',
        size: 512000,
        url: '/uploads/document.pdf'
      });

      expect(media.mimetype).to.equal('application/pdf');
    });
  });

  describe('Timestamps', () => {
    it('should have createdAt timestamp', async () => {
      const media = await Media.create({
        user: user._id,
        filename: 'test.jpg',
        originalName: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
        url: '/uploads/test.jpg'
      });

      expect(media.createdAt).to.be.instanceOf(Date);
    });
  });
});
