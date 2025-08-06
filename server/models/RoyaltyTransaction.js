import mongoose from 'mongoose';

const royaltyTransactionSchema = new mongoose.Schema({
  music: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Music',
    required: true
  },
  business: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  artist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Play Information
  playInfo: {
    playType: {
      type: String,
      enum: ['background', 'foreground', 'commercial', 'promotional'],
      required: true
    },
    playDate: {
      type: Date,
      required: true,
      default: Date.now
    },
    duration: Number, // actual play duration in seconds
    location: {
      businessName: String,
      address: String,
      city: String,
      province: String
    },
    deviceInfo: {
      deviceId: String,
      ipAddress: String,
      userAgent: String
    }
  },
  // Royalty Calculation
  royaltyInfo: {
    baseRate: {
      type: Number,
      required: true
    },
    calculatedAmount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'IDR'
    },
    // Breakdown for different rights holders
    distribution: {
      artist: {
        amount: Number,
        percentage: Number
      },
      publishers: [{
        lmkMemberNumber: String,
        name: String,
        amount: Number,
        percentage: Number
      }],
      composers: [{
        lmkMemberNumber: String,
        name: String,
        amount: Number,
        percentage: Number
      }],
      lyricists: [{
        lmkMemberNumber: String,
        name: String,
        amount: Number,
        percentage: Number
      }],
      lmkFee: {
        amount: Number,
        percentage: {
          type: Number,
          default: 5 // 5% to LMK
        }
      },
      platformFee: {
        amount: Number,
        percentage: {
          type: Number,
          default: 10 // 10% to platform
        }
      }
    }
  },
  // LMK Compliance
  lmkCompliance: {
    reportingStatus: {
      type: String,
      enum: ['pending', 'reported', 'confirmed', 'disputed'],
      default: 'pending'
    },
    reportedToLMK: Date,
    lmkTransactionId: String,
    lmkConfirmationNumber: String,
    complianceNotes: String
  },
  // Payment Information
  paymentInfo: {
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'disputed', 'refunded'],
      default: 'pending'
    },
    paymentDate: Date,
    paymentMethod: {
      type: String,
      enum: ['bank_transfer', 'digital_wallet', 'credit_card', 'debit'],
      default: 'bank_transfer'
    },
    transactionId: String,
    paymentGatewayResponse: mongoose.Schema.Types.Mixed,
    failureReason: String,
    refundInfo: {
      refundDate: Date,
      refundAmount: Number,
      refundReason: String,
      refundTransactionId: String
    }
  },
  // Billing Period (for batch payments)
  billingPeriod: {
    startDate: Date,
    endDate: Date,
    periodType: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'quarterly'],
      default: 'monthly'
    }
  },
  // Verification and Audit
  verification: {
    isVerified: {
      type: Boolean,
      default: false
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    verificationDate: Date,
    verificationNotes: String,
    auditTrail: [{
      action: String,
      performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      timestamp: {
        type: Date,
        default: Date.now
      },
      details: String
    }]
  },
  // Metadata
  metadata: {
    source: {
      type: String,
      enum: ['web_player', 'mobile_app', 'api', 'bulk_import'],
      default: 'web_player'
    },
    sessionId: String,
    playlistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Playlist'
    },
    tags: [String],
    notes: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for efficient queries
royaltyTransactionSchema.index({ business: 1, 'playInfo.playDate': -1 });
royaltyTransactionSchema.index({ artist: 1, 'paymentInfo.status': 1 });
royaltyTransactionSchema.index({ music: 1, 'playInfo.playDate': -1 });
royaltyTransactionSchema.index({ 'lmkCompliance.reportingStatus': 1 });
royaltyTransactionSchema.index({ 'paymentInfo.status': 1 });
royaltyTransactionSchema.index({ 'billingPeriod.startDate': 1, 'billingPeriod.endDate': 1 });

// Compound indexes for reporting
royaltyTransactionSchema.index({ 
  business: 1, 
  'billingPeriod.startDate': 1, 
  'billingPeriod.endDate': 1 
});
royaltyTransactionSchema.index({ 
  artist: 1, 
  'paymentInfo.status': 1,
  'playInfo.playDate': -1 
});

// Update timestamp on save
royaltyTransactionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Calculate total royalty amount
royaltyTransactionSchema.methods.calculateTotalRoyalty = function() {
  const distribution = this.royaltyInfo.distribution;
  let total = distribution.artist.amount || 0;
  
  // Add publisher amounts
  if (distribution.publishers) {
    total += distribution.publishers.reduce((sum, pub) => sum + (pub.amount || 0), 0);
  }
  
  // Add composer amounts
  if (distribution.composers) {
    total += distribution.composers.reduce((sum, comp) => sum + (comp.amount || 0), 0);
  }
  
  // Add lyricist amounts
  if (distribution.lyricists) {
    total += distribution.lyricists.reduce((sum, lyr) => sum + (lyr.amount || 0), 0);
  }
  
  return total;
};

// Check if payment is overdue
royaltyTransactionSchema.methods.isPaymentOverdue = function() {
  if (this.paymentInfo.status === 'completed') return false;
  
  const daysSincePlay = (new Date() - this.playInfo.playDate) / (1000 * 60 * 60 * 24);
  return daysSincePlay > 30; // 30 days payment term
};

// Static method to get royalty summary for a period
royaltyTransactionSchema.statics.getRoyaltySummary = function(startDate, endDate, filters = {}) {
  const matchStage = {
    'playInfo.playDate': {
      $gte: startDate,
      $lte: endDate
    },
    ...filters
  };

  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalTransactions: { $sum: 1 },
        totalRoyalties: { $sum: '$royaltyInfo.calculatedAmount' },
        totalPlays: { $sum: 1 },
        averageRoyaltyPerPlay: { $avg: '$royaltyInfo.calculatedAmount' },
        uniqueBusinesses: { $addToSet: '$business' },
        uniqueArtists: { $addToSet: '$artist' },
        uniqueSongs: { $addToSet: '$music' }
      }
    },
    {
      $project: {
        totalTransactions: 1,
        totalRoyalties: 1,
        totalPlays: 1,
        averageRoyaltyPerPlay: 1,
        uniqueBusinessCount: { $size: '$uniqueBusinesses' },
        uniqueArtistCount: { $size: '$uniqueArtists' },
        uniqueSongCount: { $size: '$uniqueSongs' }
      }
    }
  ]);
};

// Static method to get pending LMK reports
royaltyTransactionSchema.statics.getPendingLMKReports = function() {
  return this.find({
    'lmkCompliance.reportingStatus': 'pending',
    'paymentInfo.status': 'completed'
  }).populate('music artist business');
};

export default mongoose.model('RoyaltyTransaction', royaltyTransactionSchema);