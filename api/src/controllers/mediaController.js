const Media = require('../models/Media');
const fs = require('fs');
const path = require('path');

const uploadMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { filename, originalname, mimetype, size } = req.file;
    const type = Media.getTypeFromMimetype(mimetype);
    const url = `/uploads/${filename}`;

    const media = await Media.create({
      filename,
      originalName: originalname,
      mimetype,
      size,
      url,
      type,
      uploader: req.user._id
    });

    res.status(201).json({
      id: media._id,
      url: media.url,
      type: media.type,
      originalName: media.originalName,
      size: media.size
    });
  } catch (error) {
    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }
    res.status(500).json({ error: 'Server error' });
  }
};

const getMedia = async (req, res) => {
  try {
    const { id } = req.params;

    const media = await Media.findById(id);
    if (!media) {
      return res.status(404).json({ error: 'Media not found' });
    }

    res.json(media);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const deleteMedia = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const media = await Media.findById(id);
    if (!media) {
      return res.status(404).json({ error: 'Media not found' });
    }

    if (media.uploader.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Not authorized to delete this media' });
    }

    const filePath = path.join(__dirname, '../../uploads', media.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await Media.findByIdAndDelete(id);

    res.json({ message: 'Media deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const getUserMedia = async (req, res) => {
  try {
    const userId = req.user._id;
    const { type } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = { uploader: userId };
    if (type && ['image', 'video', 'audio', 'document'].includes(type)) {
      filter.type = type;
    }

    const media = await Media.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Media.countDocuments(filter);

    res.json({
      media,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  uploadMedia,
  getMedia,
  deleteMedia,
  getUserMedia
};
