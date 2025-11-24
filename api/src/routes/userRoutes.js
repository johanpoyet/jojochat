const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');

router.get('/search', authMiddleware, userController.searchUsers);
router.get('/:id', authMiddleware, userController.getUserById);
router.get('/', authMiddleware, userController.getUsers);
router.put('/profile', authMiddleware, userController.updateProfile);

module.exports = router;
