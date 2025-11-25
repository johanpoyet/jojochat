const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');
const { avatarUpload } = require('../middleware/upload');

router.get('/search', authMiddleware, userController.searchUsers);
router.get('/sessions', authMiddleware, userController.getUserSessions);
router.get('/sessions/history', authMiddleware, userController.getConnectionHistory);
router.delete('/sessions/:sessionId', authMiddleware, userController.deactivateSession);
router.get('/blocked', authMiddleware, userController.getBlockedUsers);
router.post('/block/:id', authMiddleware, userController.blockUser);
router.post('/unblock/:id', authMiddleware, userController.unblockUser);
router.get('/:id', authMiddleware, userController.getUserById);
router.get('/', authMiddleware, userController.getUsers);
router.put('/profile', authMiddleware, userController.updateProfile);
router.post('/avatar', authMiddleware, avatarUpload.single('avatar'), userController.uploadAvatar);
router.delete('/avatar', authMiddleware, userController.deleteAvatar);
router.delete('/account', authMiddleware, userController.deleteAccount);

module.exports = router;
