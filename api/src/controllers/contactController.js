const Contact = require('../models/Contact');
const User = require('../models/User');

const addContact = async (req, res) => {
  try {
    const { contact_id, nickname } = req.body;
    const ownerId = req.user._id;

    if (!contact_id) {
      return res.status(400).json({ error: 'Contact ID is required' });
    }

    if (contact_id === ownerId.toString()) {
      return res.status(400).json({ error: 'Cannot add yourself as contact' });
    }

    const contactUser = await User.findById(contact_id);
    if (!contactUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const existingContact = await Contact.findOne({ owner: ownerId, contact: contact_id });
    if (existingContact) {
      return res.status(400).json({ error: 'Contact already exists' });
    }

    const contact = await Contact.create({
      owner: ownerId,
      contact: contact_id,
      nickname: nickname || null
    });

    const populatedContact = await Contact.findById(contact._id)
      .populate('contact', 'username email avatar status statusMessage');

    res.status(201).json(populatedContact);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const getContacts = async (req, res) => {
  try {
    const ownerId = req.user._id;
    const { blocked } = req.query;

    const filter = { owner: ownerId };
    if (blocked === 'true') {
      filter.blocked = true;
    } else if (blocked === 'false') {
      filter.blocked = false;
    }

    const contacts = await Contact.find(filter)
      .populate('contact', 'username email avatar status statusMessage lastConnection')
      .sort({ createdAt: -1 });

    res.json({ contacts });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const getContact = async (req, res) => {
  try {
    const { id } = req.params;
    const ownerId = req.user._id;

    const contact = await Contact.findOne({ _id: id, owner: ownerId })
      .populate('contact', 'username email avatar status statusMessage lastConnection');

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.json(contact);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const updateContact = async (req, res) => {
  try {
    const { id } = req.params;
    const { nickname } = req.body;
    const ownerId = req.user._id;

    const contact = await Contact.findOne({ _id: id, owner: ownerId });
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    if (nickname !== undefined) {
      contact.nickname = nickname;
    }

    await contact.save();

    const populatedContact = await Contact.findById(contact._id)
      .populate('contact', 'username email avatar status statusMessage');

    res.json(populatedContact);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const deleteContact = async (req, res) => {
  try {
    const { id } = req.params;
    const ownerId = req.user._id;

    const contact = await Contact.findOneAndDelete({ _id: id, owner: ownerId });
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const blockContact = async (req, res) => {
  try {
    const { id } = req.params;
    const ownerId = req.user._id;

    const contact = await Contact.findOne({ _id: id, owner: ownerId });
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    if (contact.blocked) {
      return res.status(400).json({ error: 'Contact is already blocked' });
    }

    contact.blocked = true;
    contact.blockedAt = new Date();
    await contact.save();

    res.json({ message: 'Contact blocked successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const unblockContact = async (req, res) => {
  try {
    const { id } = req.params;
    const ownerId = req.user._id;

    const contact = await Contact.findOne({ _id: id, owner: ownerId });
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    if (!contact.blocked) {
      return res.status(400).json({ error: 'Contact is not blocked' });
    }

    contact.blocked = false;
    contact.blockedAt = null;
    await contact.save();

    res.json({ message: 'Contact unblocked successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const searchContacts = async (req, res) => {
  try {
    const { q } = req.query;
    const ownerId = req.user._id;

    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const contacts = await Contact.find({ owner: ownerId, blocked: false })
      .populate({
        path: 'contact',
        match: { username: { $regex: q, $options: 'i' } },
        select: 'username email avatar status statusMessage'
      });

    const filteredContacts = contacts.filter(c => c.contact !== null);

    res.json({ contacts: filteredContacts });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  addContact,
  getContacts,
  getContact,
  updateContact,
  deleteContact,
  blockContact,
  unblockContact,
  searchContacts
};
