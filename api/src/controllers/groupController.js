const Group = require('../models/Group');
const User = require('../models/User');

const createGroup = async (req, res) => {
  try {
    const { name, description, members } = req.body;
    const creatorId = req.user._id;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Group name is required' });
    }

    const memberIds = members || [];
    const uniqueMembers = [...new Set(memberIds)].filter(id => id !== creatorId.toString());

    const validMembers = await User.find({ _id: { $in: uniqueMembers } });
    if (validMembers.length !== uniqueMembers.length) {
      return res.status(400).json({ error: 'Some members are invalid' });
    }

    const groupMembers = [
      { user: creatorId, role: 'creator', addedBy: creatorId }
    ];

    uniqueMembers.forEach(memberId => {
      groupMembers.push({ user: memberId, role: 'member', addedBy: creatorId });
    });

    const group = await Group.create({
      name: name.trim(),
      description: description?.trim() || '',
      creator: creatorId,
      members: groupMembers
    });

    const populatedGroup = await Group.findById(group._id)
      .populate('creator', 'username avatar')
      .populate('members.user', 'username avatar status');

    // Emit socket event to all group members
    const io = req.app.get('io');
    if (io) {
      // Broadcast to all connected clients - they will filter by membership on client side
      io.emit('group-created', populatedGroup);
    }

    res.status(201).json(populatedGroup);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const getGroups = async (req, res) => {
  try {
    const userId = req.user._id;

    const groups = await Group.find({
      'members.user': userId,
      isActive: true
    })
      .populate('creator', 'username avatar')
      .populate('members.user', 'username avatar status')
      .populate('lastMessage')
      .sort({ updatedAt: -1 });

    res.json({ groups });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const getGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(id)
      .populate('creator', 'username avatar')
      .populate('members.user', 'username avatar status statusMessage')
      .populate('members.addedBy', 'username');

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    if (!group.isMember(userId)) {
      return res.status(403).json({ error: 'Not a member of this group' });
    }

    res.json(group);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const updateGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, avatar, settings } = req.body;
    const userId = req.user._id;

    const group = await Group.findById(id);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    if (!group.canManageMembers(userId)) {
      return res.status(403).json({ error: 'Not authorized to update this group' });
    }

    if (name) group.name = name.trim();
    if (description !== undefined) group.description = description.trim();
    if (avatar !== undefined) group.avatar = avatar;
    if (settings) {
      if (settings.onlyAdminsCanPost !== undefined) {
        group.settings.onlyAdminsCanPost = settings.onlyAdminsCanPost;
      }
      if (settings.onlyAdminsCanEditInfo !== undefined) {
        group.settings.onlyAdminsCanEditInfo = settings.onlyAdminsCanEditInfo;
      }
    }

    await group.save();

    const populatedGroup = await Group.findById(group._id)
      .populate('creator', 'username avatar')
      .populate('members.user', 'username avatar status');

    res.json(populatedGroup);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const deleteGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(id);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    if (group.creator.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Only the creator can delete the group' });
    }

    group.isActive = false;
    await group.save();

    res.json({ message: 'Group deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const addMembers = async (req, res) => {
  try {
    const { id } = req.params;
    const { members } = req.body;
    const userId = req.user._id;

    if (!members || !Array.isArray(members) || members.length === 0) {
      return res.status(400).json({ error: 'Members array is required' });
    }

    const group = await Group.findById(id);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    if (!group.canManageMembers(userId)) {
      return res.status(403).json({ error: 'Not authorized to add members' });
    }

    const existingMemberIds = group.members.map(m => m.user.toString());
    const newMemberIds = members.filter(id => !existingMemberIds.includes(id));

    const validUsers = await User.find({ _id: { $in: newMemberIds } });
    if (validUsers.length !== newMemberIds.length) {
      return res.status(400).json({ error: 'Some users are invalid' });
    }

    newMemberIds.forEach(memberId => {
      group.members.push({ user: memberId, role: 'member', addedBy: userId });
    });

    await group.save();

    const populatedGroup = await Group.findById(group._id)
      .populate('members.user', 'username avatar status');

    res.json({ members: populatedGroup.members });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const removeMember = async (req, res) => {
  try {
    const { id, memberId } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(id);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const targetMember = group.members.find(m => m.user.toString() === memberId);
    if (!targetMember) {
      return res.status(404).json({ error: 'Member not found in group' });
    }

    if (targetMember.role === 'creator') {
      return res.status(400).json({ error: 'Cannot remove the creator' });
    }

    const isRemovingSelf = memberId === userId.toString();
    if (!isRemovingSelf && !group.canManageMembers(userId)) {
      return res.status(403).json({ error: 'Not authorized to remove members' });
    }

    group.members = group.members.filter(m => m.user.toString() !== memberId);
    await group.save();

    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const updateMemberRole = async (req, res) => {
  try {
    const { id, memberId } = req.params;
    const { role } = req.body;
    const userId = req.user._id;

    if (!['admin', 'moderator', 'member'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const group = await Group.findById(id);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    if (group.creator.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Only the creator can change roles' });
    }

    const member = group.members.find(m => m.user.toString() === memberId);
    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }

    if (member.role === 'creator') {
      return res.status(400).json({ error: 'Cannot change creator role' });
    }

    member.role = role;
    await group.save();

    res.json({ message: 'Role updated successfully', role });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const leaveGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(id);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    if (!group.isMember(userId)) {
      return res.status(400).json({ error: 'Not a member of this group' });
    }

    if (group.creator.toString() === userId.toString()) {
      return res.status(400).json({ error: 'Creator cannot leave. Transfer ownership or delete the group.' });
    }

    group.members = group.members.filter(m => m.user.toString() !== userId.toString());
    await group.save();

    res.json({ message: 'Left group successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const getGroupMembers = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(id)
      .populate('creator', 'username avatar email')
      .populate('members.user', 'username avatar email status statusMessage')
      .populate('members.addedBy', 'username');

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    console.log('=== getGroupMembers Debug ===');
    console.log('Requested group ID:', id);
    console.log('Current user ID:', userId.toString());
    console.log('Group name:', group.name);
    console.log('Group members count:', group.members.length);
    console.log('Group members:', group.members.map(m => ({
      id: m.user._id.toString(),
      username: m.user.username,
      role: m.role
    })));

    // Check if user is a member (after populate, we need to use m.user._id)
    const isMember = group.members.some(m => m.user._id.toString() === userId.toString());
    console.log('Is user a member?', isMember);

    if (!isMember) {
      console.log('ERROR: User is not a member');
      return res.status(403).json({
        error: 'Not a member of this group',
        debug: {
          userId: userId.toString(),
          groupMembers: group.members.map(m => m.user._id.toString())
        }
      });
    }

    // Format members data with role information
    const formattedMembers = group.members.map(member => ({
      _id: member.user._id,
      username: member.user.username,
      avatar: member.user.avatar,
      email: member.user.email,
      status: member.user.status,
      statusMessage: member.user.statusMessage,
      role: member.role,
      addedBy: member.addedBy?.username || 'Unknown',
      joinedAt: member.joinedAt
    }));

    res.json({
      members: formattedMembers,
      createdBy: group.creator._id
    });
  } catch (error) {
    console.error('Get group members error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  createGroup,
  getGroups,
  getGroup,
  updateGroup,
  deleteGroup,
  addMembers,
  removeMember,
  updateMemberRole,
  leaveGroup,
  getGroupMembers
};
