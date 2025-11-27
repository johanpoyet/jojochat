const mongoose = require('mongoose');

exports.mochaHooks = {
  async beforeAll() {
    this.timeout(10000);
    const testDbUri = process.env.MONGODB_URI || process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/whatsapp_test';

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(testDbUri);
    }
  },

  async beforeEach() {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  },

  async afterAll() {
    await mongoose.connection.close();
  }
};
