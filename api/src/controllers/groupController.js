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
      .populate({
        path: 'lastMessage',
        select: 'content createdAt sender deleted',
        populate: { path: 'sender', select: 'username avatar' }
      })
      .sort({ updatedAt: -1 });

    const formattedGroups = groups.map(group => {
      const unreadCount = group.unreadCount.get(userId.toString()) || 0;
      const archived = group.archived.get(userId.toString()) || false;

      return {
        _id: group._id,
        name: group.name,
        description: group.description,
        avatar: group.avatar,
        creator: group.creator,
        members: group.members,
        lastMessage: group.lastMessage && !group.lastMessage.deleted ? {
          content: group.lastMessage.content,
          createdAt: group.lastMessage.createdAt,
          sender: group.lastMessage.sender,
          isSender: group.lastMessage.sender._id.toString() === userId.toString()
        } : null,
        unreadCount,
        archived,
        settings: group.settings,
        isActive: group.isActive,
        createdAt: group.createdAt,
        updatedAt: group.updatedAt
      };
    });

    res.json({ groups: formattedGroups });
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

    const group = await Group.findById(id).populate('members.user', '_id');
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    if (group.creator.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Only the creator can delete the group' });
    }

    // Emit socket event to all group members before deleting
    const io = req.app.get('io');
    if (io) {
      io.emit('group-deleted', { groupId: id });
    }

    group.isActive = false;
    await group.save();

    res.json({ message: 'Group deleted successfully' });
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

    // Only the creator can remove members (except members can remove themselves)
    const isRemovingSelf = memberId === userId.toString();
    const isCreator = group.creator.toString() === userId.toString();

    if (!isRemovingSelf && !isCreator) {
      return res.status(403).json({ error: 'Only the group creator can remove members' });
    }

    group.members = group.members.filter(m => m.user.toString() !== memberId);
    await group.save();

    // Emit socket event to notify the removed member
    const io = req.app.get('io');
    if (io) {
      io.emit('group-member-removed', {
        groupId: id,
        removedMemberId: memberId
      });
    }

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

const archiveGroup = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const group = await Group.findById(id);

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    if (!group.isMember(userId)) {
      return res.status(403).json({ error: 'Not a member of this group' });
    }

    const currentStatus = group.archived.get(userId.toString()) || false;
    group.archived.set(userId.toString(), !currentStatus);

    await group.save();

    res.json({
      message: 'Group archive status updated',
      archived: !currentStatus
    });
  } catch (error) {
    console.error('Archive group error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const addMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId: userToAddId } = req.body;
    const requesterId = req.user._id;

    const group = await Group.findById(id);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Check if requester is a member of the group
    if (!group.isMember(requesterId)) {
      return res.status(403).json({ error: 'Only group members can add new members' });
    }

    // Check if user to add exists
    const userToAdd = await User.findById(userToAddId);
    if (!userToAdd) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user is already a member
    const isAlreadyMember = group.members.some(m => m.user.toString() === userToAddId);
    if (isAlreadyMember) {
      return res.status(400).json({ error: 'User is already a member of this group' });
    }

    // Add the new member
    group.members.push({
      user: userToAddId,
      role: 'member',
      addedBy: requesterId
    });

    await group.save();

    const populatedGroup = await Group.findById(group._id)
      .populate('creator', 'username avatar')
      .populate('members.user', 'username avatar status');

    // Emit socket event to notify all members including the new one
    const io = req.app.get('io');
    if (io) {
      io.emit('group-member-added', {
        groupId: id,
        group: populatedGroup,
        newMemberId: userToAddId
      });
    }

    res.json({
      message: 'Member added successfully',
      group: populatedGroup
    });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  createGroup,
  getGroups,
  getGroup,
  updateGroup,
  deleteGroup,
  removeMember,
  updateMemberRole,
  leaveGroup,
  getGroupMembers,
  archiveGroup,
  addMember
};
