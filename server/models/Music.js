import mongoose from 'mongoose';

const musicSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  artist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  album: {
    type: String,
    trim: true
  },
  genre: [{
    type: String,
    trim: true
  }],
  duration: {
    type: Number, // in seconds
    required: true
  },
  audioFile: {
    filename: String,
    originalName: String,
    path: String,
    size: Number,
    mimeType: String
  },
  coverArt: {
    filename: String,
    path: String,
    size: Number
  },
  // LMK and Royalty Information
  lmkInfo: {
    isrcCode: {
      type: String,
      unique: true,
      sparse: true // allows multiple null values
    },
    lmkRegistrationNumber: String,
    registrationDate: Date,
    copyrightOwner: {
      name: String,
      lmkMemberNumber: String,
      sharePercentage: {
        type: Number,
        default: 100,
        min: 0,
        max: 100
      }
    },
    publishers: [{
      name: String,
      lmkMemberNumber: String,
      sharePercentage: Number
    }],
    composers: [{
      name: String,
      lmkMemberNumber: String,
      sharePercentage: Number
    }],
    lyricists: [{
      name: String,
      lmkMemberNumber: String,
      sharePercentage: Number
    }],
    complianceStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'expired'],
      default: 'pending'
    },
    royaltyRate: {
      mechanical: {
        type: Number,
        default: 0.001 // per play
      },
      performance: {
        type: Number,
        default: 0.001 // per play
      },
      synchronization: {
        type: Number,
        default: 0.005 // per commercial use
      }
    }
  },
  // Business Licensing
  businessLicense: {
    licenseType: {
      type: String,
      enum: ['background', 'foreground', 'commercial', 'promotional'],
      default: 'background'
    },
    allowedBusinessTypes: [{
      type: String,
      enum: ['restaurant', 'retail', 'office', 'hotel', 'cafe', 'gym', 'other']
    }],
    restrictions: {
      maxSimultaneousPlays: {
        type: Number,
        default: 10
      },
      timeOfDayRestrictions: {
        startHour: Number, // 0-23
        endHour: Number    // 0-23
      },
      geographicRestrictions: [String] // provinces/regions
    },
    pricing: {
      basePrice: {
        type: Number,
        default: 0
      },
      pricePerPlay: {
        type: Number,
        default: 0.001
      },
      bulkDiscounts: [{
        minPlays: Number,
        discountPercentage: Number
      }]
    }
  },
  // Metadata
  metadata: {
    language: String,
    explicit: {
      type: Boolean,
      default: false
    },
    mood: [String],
    tempo: {
      type: String,
      enum: ['slow', 'moderate', 'fast', 'variable']
    },
    energy: {
      type: String,
      enum: ['low', 'moderate', 'high']
    },
    tags: [String],
    description: String
  },
  // Analytics
  analytics: {
    totalPlays: {
      type: Number,
      default: 0
    },
    uniqueListeners: {
      type: Number,
      default: 0
    },
    businessPlays: {
      type: Number,
      default: 0
    },
    lastPlayed: Date,
    popularityScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  // Status and Availability
  status: {
    type: String,
    enum: ['draft', 'review', 'published', 'archived'],
    default: 'draft'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  publishedAt: Date,
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
musicSchema.index({ title: 'text', artist: 'text', album: 'text' });
musicSchema.index({ 'lmkInfo.complianceStatus': 1 });
musicSchema.index({ status: 1, isActive: 1 });
musicSchema.index({ genre: 1 });
musicSchema.index({ 'analytics.popularityScore': -1 });
musicSchema.index({ 'businessLicense.allowedBusinessTypes': 1 });

// Update timestamp on save
musicSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Virtual for formatted duration
musicSchema.virtual('formattedDuration').get(function() {
  const minutes = Math.floor(this.duration / 60);
  const seconds = this.duration % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
});

// Method to check if music is available for business type
musicSchema.methods.isAvailableForBusiness = function(businessType) {
  if (!this.isActive || this.status !== 'published') return false;
  if (this.lmkInfo.complianceStatus !== 'approved') return false;
  
  return this.businessLicense.allowedBusinessTypes.length === 0 || 
         this.businessLicense.allowedBusinessTypes.includes(businessType);
};

// Method to calculate royalty for a play
musicSchema.methods.calculateRoyalty = function(playType = 'background') {
  const baseRate = this.lmkInfo.royaltyRate;
  
  switch (playType) {
    case 'commercial':
      return baseRate.synchronization;
    case 'performance':
      return baseRate.performance;
    default:
      return baseRate.mechanical;
  }
};

// Static method to find music by LMK compliance
musicSchema.statics.findCompliantMusic = function() {
  return this.find({
    status: 'published',
    isActive: true,
    'lmkInfo.complianceStatus': 'approved'
  });
};

export default mongoose.model('Music', musicSchema);