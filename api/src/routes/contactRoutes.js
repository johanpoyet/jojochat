const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.post('/', contactController.addContact);
router.get('/', contactController.getContacts);
router.get('/search', contactController.searchContacts);
router.get('/:id', contactController.getContact);
router.put('/:id', contactController.updateContact);
router.delete('/:id', contactController.deleteContact);
router.post('/:id/block', contactController.blockContact);
router.post('/:id/unblock', contactController.unblockContact);

module.exports = router;
