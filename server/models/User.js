import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['user', 'business', 'artist', 'admin'],
    default: 'user'
  },
  avatar: {
    type: String,
    default: null
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  // Business-specific fields
  businessInfo: {
    companyName: String,
    businessType: {
      type: String,
      enum: ['restaurant', 'retail', 'office', 'hotel', 'cafe', 'gym', 'other']
    },
    taxId: String,
    address: {
      street: String,
      city: String,
      province: String,
      postalCode: String,
      country: {
        type: String,
        default: 'Indonesia'
      }
    },
    contactPerson: {
      name: String,
      phone: String,
      position: String
    },
    licenseStatus: {
      type: String,
      enum: ['pending', 'active', 'suspended', 'expired'],
      default: 'pending'
    },
    lmkRegistrationNumber: String,
    subscriptionPlan: {
      type: String,
      enum: ['basic', 'premium', 'enterprise'],
      default: 'basic'
    },
    maxSimultaneousPlays: {
      type: Number,
      default: 1
    }
  },
  // Artist-specific fields
  artistInfo: {
    stageName: String,
    genre: [String],
    bio: String,
    socialLinks: {
      instagram: String,
      twitter: String,
      youtube: String,
      spotify: String
    },
    lmkMemberNumber: String,
    bankAccount: {
      accountName: String,
      accountNumber: String,
      bankName: String,
      swiftCode: String
    }
  },
  preferences: {
    language: {
      type: String,
      default: 'id'
    },
    timezone: {
      type: String,
      default: 'Asia/Jakarta'
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      royaltyReports: {
        type: Boolean,
        default: true
      },
      licenseExpiry: {
        type: Boolean,
        default: true
      }
    }
  },
  lastLogin: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for business queries
userSchema.index({ 'businessInfo.licenseStatus': 1 });
userSchema.index({ role: 1, isVerified: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Update timestamp on save
userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Get public profile
userSchema.methods.getPublicProfile = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.businessInfo?.taxId;
  delete userObject.artistInfo?.bankAccount;
  return userObject;
};

// Check if business license is valid
userSchema.methods.hasValidLicense = function() {
  if (this.role !== 'business') return false;
  return this.businessInfo?.licenseStatus === 'active';
};

export default mongoose.model('User', userSchema);