const express = require('express');
const router = express.Router();
const UserGuide = require('../models/UserGuide');
const { auth, isAdmin } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/userguide';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed.'));
    }
  }
});

// Get all documents (public access)
router.get('/', async (req, res) => {
  try {
    const documents = await UserGuide.find().sort({ createdAt: -1 });
    res.json(documents);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create new document (admin only)
router.post('/', auth, isAdmin, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const document = new UserGuide({
      title: req.body.title,
      description: req.body.description,
      document: {
        filename: req.file.originalname,
        path: req.file.path,
        mimetype: req.file.mimetype,
        size: req.file.size
      }
    });

    const newDocument = await document.save();
    res.status(201).json(newDocument);
  } catch (err) {
    // If there's an error and a file was uploaded, delete it
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, (unlinkErr) => {
        if (unlinkErr) console.error('Error deleting uploaded file:', unlinkErr);
      });
    }
    res.status(400).json({ message: err.message });
  }
});

// Download document
router.get('/:id/document', auth, async (req, res) => {
  try {
    const document = await UserGuide.findById(req.params.id);
    if (!document || !document.document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const filePath = path.join(__dirname, '..', document.document.path);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }

    res.download(filePath, document.document.filename);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update document (admin only)
router.put('/:id', auth, isAdmin, upload.single('document'), async (req, res) => {
  try {
    const document = await UserGuide.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    document.title = req.body.title;
    document.description = req.body.description;
    document.updatedAt = Date.now();

    if (req.file) {
      // Delete old document if it exists
      if (document.document && document.document.path) {
        const oldFilePath = path.join(__dirname, '..', document.document.path);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }

      document.document = {
        filename: req.file.originalname,
        path: req.file.path,
        mimetype: req.file.mimetype,
        size: req.file.size
      };
    }

    const updatedDocument = await document.save();
    res.json(updatedDocument);
  } catch (err) {
    // If there's an error and a new file was uploaded, delete it
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, (unlinkErr) => {
        if (unlinkErr) console.error('Error deleting uploaded file:', unlinkErr);
      });
    }
    res.status(400).json({ message: err.message });
  }
});

// Delete document (admin only)
router.delete('/:id', auth, isAdmin, async (req, res) => {
  try {
    const document = await UserGuide.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Delete document file if it exists
    if (document.document && document.document.path) {
      const filePath = path.join(__dirname, '..', document.document.path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await document.deleteOne();
    res.json({ message: 'Document deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router; 