import express from 'express';
import RoyaltyTransaction from '../models/RoyaltyTransaction.js';
import Music from '../models/Music.js';
import User from '../models/User.js';
import { requireRole, requireBusinessLicense, requireArtistVerification } from '../middleware/auth.js';

const router = express.Router();

// Record a play and calculate royalty
router.post('/play', requireBusinessLicense, async (req, res) => {
  try {
    const {
      musicId,
      playType = 'background',
      duration,
      location,
      deviceInfo
    } = req.body;

    if (!musicId) {
      return res.status(400).json({
        message: 'Music ID is required',
        code: 'MISSING_MUSIC_ID'
      });
    }

    // Get music and verify it's available for business use
    const music = await Music.findById(musicId).populate('artist');
    if (!music) {
      return res.status(404).json({
        message: 'Music not found',
        code: 'MUSIC_NOT_FOUND'
      });
    }

    // Check if music is compliant and available for business type
    if (!music.isAvailableForBusiness(req.user.businessInfo.businessType)) {
      return res.status(403).json({
        message: 'Music not available for your business type',
        code: 'MUSIC_NOT_AVAILABLE',
        businessType: req.user.businessInfo.businessType,
        allowedTypes: music.businessLicense.allowedBusinessTypes
      });
    }

    // Calculate royalty
    const baseRate = music.calculateRoyalty(playType);
    const calculatedAmount = baseRate;

    // Create royalty distribution
    const distribution = {
      artist: {
        amount: calculatedAmount * 0.7, // 70% to artist
        percentage: 70
      },
      publishers: music.lmkInfo.publishers?.map(pub => ({
        lmkMemberNumber: pub.lmkMemberNumber,
        name: pub.name,
        amount: calculatedAmount * (pub.sharePercentage / 100) * 0.15,
        percentage: pub.sharePercentage
      })) || [],
      composers: music.lmkInfo.composers?.map(comp => ({
        lmkMemberNumber: comp.lmkMemberNumber,
        name: comp.name,
        amount: calculatedAmount * (comp.sharePercentage / 100) * 0.1,
        percentage: comp.sharePercentage
      })) || [],
      lyricists: music.lmkInfo.lyricists?.map(lyr => ({
        lmkMemberNumber: lyr.lmkMemberNumber,
        name: lyr.name,
        amount: calculatedAmount * (lyr.sharePercentage / 100) * 0.05,
        percentage: lyr.sharePercentage
      })) || [],
      lmkFee: {
        amount: calculatedAmount * 0.05, // 5% to LMK
        percentage: 5
      },
      platformFee: {
        amount: calculatedAmount * 0.1, // 10% to platform
        percentage: 10
      }
    };

    // Create royalty transaction
    const royaltyTransaction = new RoyaltyTransaction({
      music: musicId,
      business: req.user._id,
      artist: music.artist._id,
      playInfo: {
        playType,
        playDate: new Date(),
        duration: duration || music.duration,
        location: {
          businessName: req.user.businessInfo.companyName,
          address: location?.address || req.user.businessInfo.address?.street,
          city: location?.city || req.user.businessInfo.address?.city,
          province: location?.province || req.user.businessInfo.address?.province
        },
        deviceInfo
      },
      royaltyInfo: {
        baseRate,
        calculatedAmount,
        currency: 'IDR',
        distribution
      },
      lmkCompliance: {
        reportingStatus: 'pending'
      },
      paymentInfo: {
        status: 'pending'
      },
      metadata: {
        source: 'web_player'
      }
    });

    await royaltyTransaction.save();

    // Update music analytics
    await Music.findByIdAndUpdate(musicId, {
      $inc: {
        'analytics.totalPlays': 1,
        'analytics.businessPlays': 1
      },
      $set: {
        'analytics.lastPlayed': new Date()
      }
    });

    res.status(201).json({
      message: 'Play recorded and royalty calculated',
      transaction: {
        id: royaltyTransaction._id,
        calculatedAmount: calculatedAmount,
        currency: 'IDR',
        playType,
        lmkCompliance: royaltyTransaction.lmkCompliance
      }
    });

  } catch (error) {
    console.error('Play recording error:', error);
    res.status(500).json({
      message: 'Failed to record play',
      code: 'PLAY_RECORD_ERROR'
    });
  }
});

// Get royalty transactions for business
router.get('/transactions', requireBusinessLicense, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      startDate,
      endDate,
      paymentStatus,
      musicId
    } = req.query;

    const skip = (page - 1) * limit;
    const query = { business: req.user._id };

    // Add date filter
    if (startDate || endDate) {
      query['playInfo.playDate'] = {};
      if (startDate) query['playInfo.playDate'].$gte = new Date(startDate);
      if (endDate) query['playInfo.playDate'].$lte = new Date(endDate);
    }

    // Add payment status filter
    if (paymentStatus) {
      query['paymentInfo.status'] = paymentStatus;
    }

    // Add music filter
    if (musicId) {
      query.music = musicId;
    }

    const [transactions, total] = await Promise.all([
      RoyaltyTransaction.find(query)
        .populate('music', 'title artist album duration')
        .populate('artist', 'name artistInfo.stageName')
        .sort({ 'playInfo.playDate': -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      RoyaltyTransaction.countDocuments(query)
    ]);

    res.json({
      transactions,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      message: 'Failed to fetch transactions',
      code: 'FETCH_TRANSACTIONS_ERROR'
    });
  }
});

// Get royalty summary for business
router.get('/summary', requireBusinessLicense, async (req, res) => {
  try {
    const {
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      endDate = new Date()
    } = req.query;

    const summary = await RoyaltyTransaction.getRoyaltySummary(
      new Date(startDate),
      new Date(endDate),
      { business: req.user._id }
    );

    // Get pending payments
    const pendingPayments = await RoyaltyTransaction.aggregate([
      {
        $match: {
          business: req.user._id,
          'paymentInfo.status': 'pending'
        }
      },
      {
        $group: {
          _id: null,
          totalPending: { $sum: '$royaltyInfo.calculatedAmount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Get overdue payments
    const overdueDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const overduePayments = await RoyaltyTransaction.aggregate([
      {
        $match: {
          business: req.user._id,
          'paymentInfo.status': 'pending',
          'playInfo.playDate': { $lt: overdueDate }
        }
      },
      {
        $group: {
          _id: null,
          totalOverdue: { $sum: '$royaltyInfo.calculatedAmount' },
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      summary: summary[0] || {
        totalTransactions: 0,
        totalRoyalties: 0,
        totalPlays: 0,
        averageRoyaltyPerPlay: 0
      },
      pendingPayments: pendingPayments[0] || { totalPending: 0, count: 0 },
      overduePayments: overduePayments[0] || { totalOverdue: 0, count: 0 },
      period: {
        startDate,
        endDate
      }
    });

  } catch (error) {
    console.error('Get summary error:', error);
    res.status(500).json({
      message: 'Failed to fetch summary',
      code: 'FETCH_SUMMARY_ERROR'
    });
  }
});

// Get artist royalty earnings
router.get('/earnings', requireArtistVerification, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      startDate,
      endDate,
      paymentStatus = 'completed'
    } = req.query;

    const skip = (page - 1) * limit;
    const query = { artist: req.user._id };

    // Add date filter
    if (startDate || endDate) {
      query['playInfo.playDate'] = {};
      if (startDate) query['playInfo.playDate'].$gte = new Date(startDate);
      if (endDate) query['playInfo.playDate'].$lte = new Date(endDate);
    }

    // Add payment status filter
    if (paymentStatus) {
      query['paymentInfo.status'] = paymentStatus;
    }

    const [transactions, total] = await Promise.all([
      RoyaltyTransaction.find(query)
        .populate('music', 'title album duration')
        .populate('business', 'name businessInfo.companyName')
        .sort({ 'playInfo.playDate': -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      RoyaltyTransaction.countDocuments(query)
    ]);

    // Calculate total earnings
    const totalEarnings = await RoyaltyTransaction.aggregate([
      {
        $match: {
          artist: req.user._id,
          'paymentInfo.status': 'completed'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$royaltyInfo.distribution.artist.amount' }
        }
      }
    ]);

    res.json({
      transactions,
      totalEarnings: totalEarnings[0]?.total || 0,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get earnings error:', error);
    res.status(500).json({
      message: 'Failed to fetch earnings',
      code: 'FETCH_EARNINGS_ERROR'
    });
  }
});

// Process royalty payment (admin only)
router.post('/process-payment', requireRole('admin'), async (req, res) => {
  try {
    const { transactionIds, paymentMethod = 'bank_transfer' } = req.body;

    if (!transactionIds || !Array.isArray(transactionIds)) {
      return res.status(400).json({
        message: 'Transaction IDs array is required',
        code: 'MISSING_TRANSACTION_IDS'
      });
    }

    const transactions = await RoyaltyTransaction.find({
      _id: { $in: transactionIds },
      'paymentInfo.status': 'pending'
    });

    if (transactions.length === 0) {
      return res.status(404).json({
        message: 'No pending transactions found',
        code: 'NO_PENDING_TRANSACTIONS'
      });
    }

    const updates = [];
    let totalAmount = 0;

    for (const transaction of transactions) {
      totalAmount += transaction.royaltyInfo.calculatedAmount;
      
      const update = {
        'paymentInfo.status': 'processing',
        'paymentInfo.paymentDate': new Date(),
        'paymentInfo.paymentMethod': paymentMethod,
        'paymentInfo.transactionId': `PAY_${Date.now()}_${transaction._id.toString().slice(-6)}`,
        'verification.auditTrail': {
          $push: {
            action: 'payment_initiated',
            performedBy: req.user._id,
            timestamp: new Date(),
            details: `Payment processing initiated for ${transaction.royaltyInfo.calculatedAmount} IDR`
          }
        }
      };

      updates.push({
        updateOne: {
          filter: { _id: transaction._id },
          update: update
        }
      });
    }

    await RoyaltyTransaction.bulkWrite(updates);

    // Here you would integrate with actual payment gateway
    // For demo purposes, we'll simulate payment processing
    setTimeout(async () => {
      try {
        await RoyaltyTransaction.updateMany(
          { _id: { $in: transactionIds } },
          {
            $set: {
              'paymentInfo.status': 'completed',
              'lmkCompliance.reportingStatus': 'reported',
              'lmkCompliance.reportedToLMK': new Date()
            },
            $push: {
              'verification.auditTrail': {
                action: 'payment_completed',
                performedBy: req.user._id,
                timestamp: new Date(),
                details: 'Payment completed and reported to LMK'
              }
            }
          }
        );
      } catch (error) {
        console.error('Payment completion error:', error);
      }
    }, 5000); // Simulate 5 second processing time

    res.json({
      message: 'Payment processing initiated',
      processedTransactions: transactions.length,
      totalAmount,
      currency: 'IDR'
    });

  } catch (error) {
    console.error('Process payment error:', error);
    res.status(500).json({
      message: 'Failed to process payment',
      code: 'PAYMENT_PROCESS_ERROR'
    });
  }
});

// Get LMK compliance report
router.get('/lmk-report', requireRole(['admin', 'artist']), async (req, res) => {
  try {
    const {
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate = new Date(),
      reportingStatus
    } = req.query;

    const matchQuery = {
      'playInfo.playDate': {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    if (req.user.role === 'artist') {
      matchQuery.artist = req.user._id;
    }

    if (reportingStatus) {
      matchQuery['lmkCompliance.reportingStatus'] = reportingStatus;
    }

    const report = await RoyaltyTransaction.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$lmkCompliance.reportingStatus',
          count: { $sum: 1 },
          totalRoyalties: { $sum: '$royaltyInfo.calculatedAmount' },
          totalLMKFees: { $sum: '$royaltyInfo.distribution.lmkFee.amount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const summary = await RoyaltyTransaction.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalTransactions: { $sum: 1 },
          totalRoyalties: { $sum: '$royaltyInfo.calculatedAmount' },
          totalLMKFees: { $sum: '$royaltyInfo.distribution.lmkFee.amount' },
          uniqueArtists: { $addToSet: '$artist' },
          uniqueBusinesses: { $addToSet: '$business' },
          uniqueSongs: { $addToSet: '$music' }
        }
      }
    ]);

    res.json({
      report,
      summary: summary[0] || {},
      period: {
        startDate,
        endDate
      }
    });

  } catch (error) {
    console.error('LMK report error:', error);
    res.status(500).json({
      message: 'Failed to generate LMK report',
      code: 'LMK_REPORT_ERROR'
    });
  }
});

export default router;