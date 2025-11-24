const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const conversationController = require('../controllers/conversationController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.post('/', messageController.createMessage);
router.get('/conversations', conversationController.getConversations);
router.get('/:user_id', messageController.getMessagesByUser);
router.put('/:id', messageController.updateMessage);
router.delete('/:id', messageController.deleteMessage);
router.post('/:id/read', messageController.markAsRead);

module.exports = router;
