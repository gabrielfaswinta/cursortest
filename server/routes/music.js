import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import Music from '../models/Music.js';
import User from '../models/User.js';
import { authenticateToken, requireRole, requireArtistVerification, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = process.env.UPLOAD_PATH || './uploads';
    const subDir = file.fieldname === 'coverArt' ? 'covers' : 'music';
    const fullPath = path.join(uploadPath, subDir);
    
    // Create directory if it doesn't exist
    fs.mkdirSync(fullPath, { recursive: true });
    cb(null, fullPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'audioFile') {
      if (file.mimetype.startsWith('audio/')) {
        cb(null, true);
      } else {
        cb(new Error('Only audio files are allowed for music upload'));
      }
    } else if (file.fieldname === 'coverArt') {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed for cover art'));
      }
    } else {
      cb(new Error('Unexpected field'));
    }
  }
});

// Get music library with filtering and pagination
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      genre,
      search,
      businessType,
      mood,
      tempo,
      explicit,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (page - 1) * limit;
    const query = {
      status: 'published',
      isActive: true,
      'lmkInfo.complianceStatus': 'approved'
    };

    // Apply filters
    if (genre) {
      query.genre = { $in: Array.isArray(genre) ? genre : [genre] };
    }

    if (businessType) {
      query.$or = [
        { 'businessLicense.allowedBusinessTypes': { $size: 0 } },
        { 'businessLicense.allowedBusinessTypes': businessType }
      ];
    }

    if (mood) {
      query['metadata.mood'] = { $in: Array.isArray(mood) ? mood : [mood] };
    }

    if (tempo) {
      query['metadata.tempo'] = tempo;
    }

    if (explicit !== undefined) {
      query['metadata.explicit'] = explicit === 'true';
    }

    // Text search
    if (search) {
      query.$text = { $search: search };
    }

    // Sort configuration
    const sortConfig = {};
    sortConfig[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const [music, total] = await Promise.all([
      Music.find(query)
        .populate('artist', 'name artistInfo.stageName')
        .sort(sortConfig)
        .skip(skip)
        .limit(parseInt(limit)),
      Music.countDocuments(query)
    ]);

    res.json({
      music,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      },
      filters: {
        availableGenres: await Music.distinct('genre', { status: 'published', isActive: true }),
        availableBusinessTypes: await Music.distinct('businessLicense.allowedBusinessTypes'),
        availableMoods: await Music.distinct('metadata.mood'),
        availableTempos: await Music.distinct('metadata.tempo')
      }
    });

  } catch (error) {
    console.error('Get music error:', error);
    res.status(500).json({
      message: 'Failed to fetch music',
      code: 'FETCH_MUSIC_ERROR'
    });
  }
});

// Get single music by ID
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const music = await Music.findById(req.params.id)
      .populate('artist', 'name artistInfo.stageName artistInfo.lmkMemberNumber');

    if (!music) {
      return res.status(404).json({
        message: 'Music not found',
        code: 'MUSIC_NOT_FOUND'
      });
    }

    // Check if music is available for current user's business type
    if (req.user?.role === 'business') {
      const isAvailable = music.isAvailableForBusiness(req.user.businessInfo?.businessType);
      if (!isAvailable) {
        return res.status(403).json({
          message: 'Music not available for your business type',
          code: 'MUSIC_NOT_AVAILABLE'
        });
      }
    }

    res.json(music);

  } catch (error) {
    console.error('Get music by ID error:', error);
    res.status(500).json({
      message: 'Failed to fetch music',
      code: 'FETCH_MUSIC_ERROR'
    });
  }
});

// Upload new music (artists only)
router.post('/upload', requireArtistVerification, upload.fields([
  { name: 'audioFile', maxCount: 1 },
  { name: 'coverArt', maxCount: 1 }
]), async (req, res) => {
  try {
    const {
      title,
      album,
      genre,
      duration,
      lmkInfo,
      businessLicense,
      metadata
    } = req.body;

    // Validate required fields
    if (!title || !duration) {
      return res.status(400).json({
        message: 'Title and duration are required',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    // Check if audio file was uploaded
    if (!req.files?.audioFile) {
      return res.status(400).json({
        message: 'Audio file is required',
        code: 'MISSING_AUDIO_FILE'
      });
    }

    const audioFile = req.files.audioFile[0];
    const coverArt = req.files.coverArt?.[0];

    // Parse JSON fields
    const parsedLmkInfo = lmkInfo ? JSON.parse(lmkInfo) : {};
    const parsedBusinessLicense = businessLicense ? JSON.parse(businessLicense) : {};
    const parsedMetadata = metadata ? JSON.parse(metadata) : {};
    const parsedGenre = genre ? JSON.parse(genre) : [];

    // Create music document
    const music = new Music({
      title,
      artist: req.user._id,
      album,
      genre: Array.isArray(parsedGenre) ? parsedGenre : [parsedGenre],
      duration: parseInt(duration),
      audioFile: {
        filename: audioFile.filename,
        originalName: audioFile.originalname,
        path: audioFile.path,
        size: audioFile.size,
        mimeType: audioFile.mimetype
      },
      coverArt: coverArt ? {
        filename: coverArt.filename,
        path: coverArt.path,
        size: coverArt.size
      } : undefined,
      lmkInfo: {
        ...parsedLmkInfo,
        copyrightOwner: {
          name: req.user.artistInfo?.stageName || req.user.name,
          lmkMemberNumber: req.user.artistInfo?.lmkMemberNumber,
          sharePercentage: 100
        }
      },
      businessLicense: parsedBusinessLicense,
      metadata: parsedMetadata,
      status: 'review' // Start in review status
    });

    await music.save();

    res.status(201).json({
      message: 'Music uploaded successfully',
      music: {
        id: music._id,
        title: music.title,
        status: music.status
      }
    });

  } catch (error) {
    console.error('Music upload error:', error);

    // Clean up uploaded files if database save failed
    if (req.files) {
      Object.values(req.files).flat().forEach(file => {
        fs.unlink(file.path, (err) => {
          if (err) console.error('Failed to delete uploaded file:', err);
        });
      });
    }

    res.status(500).json({
      message: 'Failed to upload music',
      code: 'UPLOAD_ERROR'
    });
  }
});

// Update music information (artist only, own music)
router.put('/:id', requireArtistVerification, async (req, res) => {
  try {
    const music = await Music.findById(req.params.id);

    if (!music) {
      return res.status(404).json({
        message: 'Music not found',
        code: 'MUSIC_NOT_FOUND'
      });
    }

    // Check ownership
    if (music.artist.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: 'You can only update your own music',
        code: 'UNAUTHORIZED_UPDATE'
      });
    }

    // Prevent updating sensitive fields
    const allowedUpdates = [
      'title', 'album', 'genre', 'metadata', 'businessLicense'
    ];

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const updatedMusic = await Music.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Music updated successfully',
      music: updatedMusic
    });

  } catch (error) {
    console.error('Music update error:', error);
    res.status(500).json({
      message: 'Failed to update music',
      code: 'UPDATE_ERROR'
    });
  }
});

// Get music analytics (artist only, own music)
router.get('/:id/analytics', requireArtistVerification, async (req, res) => {
  try {
    const music = await Music.findById(req.params.id);

    if (!music) {
      return res.status(404).json({
        message: 'Music not found',
        code: 'MUSIC_NOT_FOUND'
      });
    }

    // Check ownership
    if (music.artist.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: 'You can only view analytics for your own music',
        code: 'UNAUTHORIZED_ACCESS'
      });
    }

    // Get detailed analytics from royalty transactions
    const RoyaltyTransaction = (await import('../models/RoyaltyTransaction.js')).default;
    
    const analytics = await RoyaltyTransaction.aggregate([
      { $match: { music: music._id } },
      {
        $group: {
          _id: null,
          totalPlays: { $sum: 1 },
          totalRoyalties: { $sum: '$royaltyInfo.calculatedAmount' },
          uniqueBusinesses: { $addToSet: '$business' },
          averageRoyaltyPerPlay: { $avg: '$royaltyInfo.calculatedAmount' },
          playsByType: {
            $push: {
              type: '$playInfo.playType',
              date: '$playInfo.playDate'
            }
          }
        }
      }
    ]);

    res.json({
      basic: music.analytics,
      detailed: analytics[0] || {
        totalPlays: 0,
        totalRoyalties: 0,
        uniqueBusinesses: [],
        averageRoyaltyPerPlay: 0,
        playsByType: []
      }
    });

  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      message: 'Failed to fetch analytics',
      code: 'ANALYTICS_ERROR'
    });
  }
});

// Admin routes for music management
router.put('/:id/approve', requireRole('admin'), async (req, res) => {
  try {
    const music = await Music.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          status: 'published',
          'lmkInfo.complianceStatus': 'approved',
          publishedAt: new Date()
        }
      },
      { new: true }
    );

    if (!music) {
      return res.status(404).json({
        message: 'Music not found',
        code: 'MUSIC_NOT_FOUND'
      });
    }

    res.json({
      message: 'Music approved and published',
      music
    });

  } catch (error) {
    console.error('Music approval error:', error);
    res.status(500).json({
      message: 'Failed to approve music',
      code: 'APPROVAL_ERROR'
    });
  }
});

router.put('/:id/reject', requireRole('admin'), async (req, res) => {
  try {
    const { reason } = req.body;

    const music = await Music.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          status: 'archived',
          'lmkInfo.complianceStatus': 'rejected',
          'metadata.rejectionReason': reason
        }
      },
      { new: true }
    );

    if (!music) {
      return res.status(404).json({
        message: 'Music not found',
        code: 'MUSIC_NOT_FOUND'
      });
    }

    res.json({
      message: 'Music rejected',
      music
    });

  } catch (error) {
    console.error('Music rejection error:', error);
    res.status(500).json({
      message: 'Failed to reject music',
      code: 'REJECTION_ERROR'
    });
  }
});

// Get pending music for admin review
router.get('/admin/pending', requireRole('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const [music, total] = await Promise.all([
      Music.find({ status: 'review' })
        .populate('artist', 'name artistInfo.stageName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Music.countDocuments({ status: 'review' })
    ]);

    res.json({
      music,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get pending music error:', error);
    res.status(500).json({
      message: 'Failed to fetch pending music',
      code: 'FETCH_PENDING_ERROR'
    });
  }
});

export default router;