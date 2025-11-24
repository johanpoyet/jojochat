require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Message = require('../src/models/Message');
const Conversation = require('../src/models/Conversation');

const users = [
  {
    email: 'alice@example.com',
    username: 'alice',
    password: 'password123',
    avatar: 'https://i.pravatar.cc/150?img=1',
    status: 'online'
  },
  {
    email: 'bob@example.com',
    username: 'bob',
    password: 'password123',
    avatar: 'https://i.pravatar.cc/150?img=2',
    status: 'offline'
  },
  {
    email: 'charlie@example.com',
    username: 'charlie',
    password: 'password123',
    avatar: 'https://i.pravatar.cc/150?img=3',
    status: 'online'
  },
  {
    email: 'diana@example.com',
    username: 'diana',
    password: 'password123',
    avatar: 'https://i.pravatar.cc/150?img=4',
    status: 'offline'
  },
  {
    email: 'edward@example.com',
    username: 'edward',
    password: 'password123',
    avatar: 'https://i.pravatar.cc/150?img=5',
    status: 'online'
  }
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    await User.deleteMany({});
    await Message.deleteMany({});
    await Conversation.deleteMany({});
    console.log('Cleared existing data');

    const createdUsers = await User.create(users);
    console.log(`Created ${createdUsers.length} users`);

    const messages = [
      {
        sender: createdUsers[0]._id,
        recipient: createdUsers[1]._id,
        content: 'Hey Bob! How are you doing?',
        status: 'read'
      },
      {
        sender: createdUsers[1]._id,
        recipient: createdUsers[0]._id,
        content: 'Hi Alice! I\'m doing great, thanks for asking!',
        status: 'read'
      },
      {
        sender: createdUsers[0]._id,
        recipient: createdUsers[1]._id,
        content: 'That\'s awesome! Want to grab coffee later?',
        status: 'delivered'
      },
      {
        sender: createdUsers[2]._id,
        recipient: createdUsers[0]._id,
        content: 'Alice, did you finish the project?',
        status: 'read'
      },
      {
        sender: createdUsers[0]._id,
        recipient: createdUsers[2]._id,
        content: 'Yes Charlie, just submitted it!',
        status: 'sent'
      },
      {
        sender: createdUsers[3]._id,
        recipient: createdUsers[4]._id,
        content: 'Edward, can you help me with the code?',
        status: 'read'
      },
      {
        sender: createdUsers[4]._id,
        recipient: createdUsers[3]._id,
        content: 'Sure Diana, what do you need help with?',
        status: 'read'
      },
      {
        sender: createdUsers[3]._id,
        recipient: createdUsers[4]._id,
        content: 'I\'m stuck on the authentication part',
        status: 'delivered'
      },
      {
        sender: createdUsers[1]._id,
        recipient: createdUsers[2]._id,
        content: 'Charlie, are you coming to the meeting?',
        status: 'sent'
      },
      {
        sender: createdUsers[2]._id,
        recipient: createdUsers[3]._id,
        content: 'Diana, check out this new library I found!',
        status: 'sent'
      }
    ];

    const createdMessages = await Message.create(messages);
    console.log(`Created ${createdMessages.length} messages`);

    const conversationPairs = [
      [createdUsers[0]._id, createdUsers[1]._id],
      [createdUsers[0]._id, createdUsers[2]._id],
      [createdUsers[3]._id, createdUsers[4]._id],
      [createdUsers[1]._id, createdUsers[2]._id],
      [createdUsers[2]._id, createdUsers[3]._id]
    ];

    for (const [user1, user2] of conversationPairs) {
      const messagesInConv = createdMessages.filter(msg =>
        (msg.sender.equals(user1) && msg.recipient.equals(user2)) ||
        (msg.sender.equals(user2) && msg.recipient.equals(user1))
      );

      if (messagesInConv.length > 0) {
        const lastMsg = messagesInConv[messagesInConv.length - 1];

        const unreadForUser1 = messagesInConv.filter(
          msg => msg.recipient.equals(user1) && msg.status !== 'read'
        ).length;

        const unreadForUser2 = messagesInConv.filter(
          msg => msg.recipient.equals(user2) && msg.status !== 'read'
        ).length;

        await Conversation.create({
          participants: [user1, user2],
          lastMessage: lastMsg._id,
          unreadCount: {
            [user1.toString()]: unreadForUser1,
            [user2.toString()]: unreadForUser2
          }
        });
      }
    }

    console.log(`Created ${conversationPairs.length} conversations`);

    console.log('\nSeed data created successfully!');
    console.log('\nTest credentials:');
    console.log('Email: alice@example.com | Password: password123');
    console.log('Email: bob@example.com | Password: password123');
    console.log('Email: charlie@example.com | Password: password123');
    console.log('Email: diana@example.com | Password: password123');
    console.log('Email: edward@example.com | Password: password123');

    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedDatabase();
