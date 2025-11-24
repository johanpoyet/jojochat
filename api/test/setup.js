const mongoose = require('mongoose');

before(async function() {
  this.timeout(10000);
  const testDbUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/whatsapp_test';

  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(testDbUri);
  }
});

beforeEach(async function() {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

after(async function() {
  await mongoose.connection.close();
});
