const mongoose = require('mongoose');

const getTestDbUri = () =>
  process.env.MONGODB_URI ||
  process.env.MONGODB_URI_TEST ||
  process.env.MONGODB_TEST_URI ||
  'mongodb://localhost:27017/chat-test';

const ensureConnection = async () => {
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(getTestDbUri());
  }
};

exports.mochaHooks = {
  async beforeAll() {
    this.timeout(10000);
    await ensureConnection();
  },

  async beforeEach() {
    await ensureConnection();
    if (mongoose.connection.readyState === 1) {
      const collections = mongoose.connection.collections;
      for (const key in collections) {
        await collections[key].deleteMany({});
      }
    }
  },

  async afterAll() {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  }
};
