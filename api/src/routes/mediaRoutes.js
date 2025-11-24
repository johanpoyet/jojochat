const express = require('express');
const router = express.Router();
const mediaController = require('../controllers/mediaController');
const authMiddleware = require('../middleware/auth');
const { handleUpload } = require('../middleware/upload');

router.use(authMiddleware);

router.post('/upload', handleUpload, mediaController.uploadMedia);
router.get('/', mediaController.getUserMedia);
router.get('/:id', mediaController.getMedia);
router.delete('/:id', mediaController.deleteMedia);

module.exports = router;
