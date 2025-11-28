const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.post('/', groupController.createGroup);
router.get('/', groupController.getGroups);
router.get('/:id', groupController.getGroup);
router.put('/:id', groupController.updateGroup);
router.delete('/:id', groupController.deleteGroup);

router.get('/:id/members', groupController.getGroupMembers);
router.post('/:id/members', groupController.addMember);
router.delete('/:id/members/:memberId', groupController.removeMember);
router.put('/:id/members/:memberId/role', groupController.updateMemberRole);
router.post('/:id/leave', groupController.leaveGroup);
router.post('/:id/archive', groupController.archiveGroup);

module.exports = router;
