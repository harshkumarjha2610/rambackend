// Models/seller.model.js
const mongoose = require('mongoose');

const sellerSchema = new mongoose.Schema(
  {
    // Basic Information
    ownerName: {
      type: String,
      required: false,
      trim: true,
    },
    pharmacyName: {
      type: String,
      required: false,
      trim: true,
    },
    email: {
      type: String,
      required: false,
      unique: true,
      lowercase: true,
      trim: true,
    },
    mobile: {
      type: String,
      required: false,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: false,
    },

    // Business Information
    gstNumber: {
      type: String,
      required: false,
      unique: true,
      uppercase: true,
      trim: true,
      validate: {
        validator: function (v) {
          return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(
            v
          );
        },
        message: "Invalid GST number format",
      },
    },
    drugLicense1: {
      type: String,
      required: false,
      trim: true,
    },
    drugLicense2: {
      type: String,
      required: false,
      trim: true,
    },

    // Location Information
    location: {
      address: {
        type: String,
        required: false,
        trim: true,
      },
      coordinates: {
        latitude: {
          type: Number,
          required: false,
        },
        longitude: {
          type: Number,
          required: false,
        },
      },
      pincode: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
    },

    // Shop Photos
    shopPhotos: [
      {
        photoId: { type: String, required: false },
        fileName: { type: String, required: false },
        fileUrl: { type: String, required: false },
        fileSize: { type: Number },
        mimeType: { type: String, default: "image/jpeg" },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],

    // Verification Status (flag system)
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    verificationNotes: {
      type: String,
      trim: true,
    },
    verifiedAt: {
      type: Date,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },

    // Document Status
    documentsStatus: {
      gstVerified: { type: Boolean, default: false },
      drugLicense1Verified: { type: Boolean, default: false },
      drugLicense2Verified: { type: Boolean, default: false },
      shopPhotosVerified: { type: Boolean, default: false },
    },

    // Business Details
    businessHours: {
      monday: {
        isOpen: { type: Boolean, default: true },
        openTime: { type: String, default: "09:00" },
        closeTime: { type: String, default: "21:00" },
      },
      tuesday: {
        isOpen: { type: Boolean, default: true },
        openTime: { type: String, default: "09:00" },
        closeTime: { type: String, default: "21:00" },
      },
      wednesday: {
        isOpen: { type: Boolean, default: true },
        openTime: { type: String, default: "09:00" },
        closeTime: { type: String, default: "21:00" },
      },
      thursday: {
        isOpen: { type: Boolean, default: true },
        openTime: { type: String, default: "09:00" },
        closeTime: { type: String, default: "21:00" },
      },
      friday: {
        isOpen: { type: Boolean, default: true },
        openTime: { type: String, default: "09:00" },
        closeTime: { type: String, default: "21:00" },
      },
      saturday: {
        isOpen: { type: Boolean, default: true },
        openTime: { type: String, default: "09:00" },
        closeTime: { type: String, default: "21:00" },
      },
      sunday: {
        isOpen: { type: Boolean, default: false },
        openTime: { type: String, default: "10:00" },
        closeTime: { type: String, default: "18:00" },
      },
    },

    // ✅ DISCOUNT OFFERING - ADDED HERE
    discount: {
      type: Number,
      enum: [5, 10, 12, 15],
      required: false,
      min: 0,
      max: 100,
      validate: {
        validator: function(v) {
          return [5, 10, 12, 15].includes(v);
        },
        message: props => `${props.value} is not a valid discount percentage. Choose from 5%, 10%, 12%, or 15%.`
      }
    },
    discountStatus: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active'
    },
    discountValidFrom: {
      type: Date,
      default: Date.now
    },
    discountNotes: {
      type: String,
      trim: true,
      maxlength: 200
    },

    // Additional Information
    description: { type: String, trim: true, maxlength: 500 },
    specializations: [{ type: String, trim: true }],

    // Rating and Reviews
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 },
    },

    // Account Status
    isActive: { type: Boolean, default: true },
    isSuspended: { type: Boolean, default: false },
    suspensionReason: { type: String, trim: true },
    suspendedAt: { type: Date },
    suspendedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },

    // Performance Metrics
    metrics: {
      totalOrders: { type: Number, default: 0 },
      completedOrders: { type: Number, default: 0 },
      cancelledOrders: { type: Number, default: 0 },
      averageResponseTime: { type: Number, default: 0 }, // in minutes
      lastActiveAt: { type: Date, default: Date.now },
    },

    // FCM Token for Push Notifications
    fcmTokens: [
      {
        token: String,
        deviceType: { type: String, enum: ["android", "ios"] },
        createdAt: { type: Date, default: Date.now },
      },
    ],

    // Reset Password
    resetPasswordToken: String,
    resetPasswordExpires: Date,

    // Email Verification
    emailVerificationToken: String,
    emailVerified: { type: Boolean, default: false },
    emailVerifiedAt: Date,

    // Phone Verification
    phoneVerificationOTP: String,
    phoneVerificationExpires: Date,
    phoneVerified: { type: Boolean, default: false },
    phoneVerifiedAt: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ✅ Pre-save middleware
sellerSchema.pre("save", function (next) {
  if (this.verificationStatus === "approved") {
    this.isVerified = true;
    if (!this.verifiedAt) {
      this.verifiedAt = new Date();
    }
  } else if (this.verificationStatus === "rejected") {
    this.isVerified = false;
  }
  next();
});

// Indexes
sellerSchema.index({ email: 1 });
sellerSchema.index({ mobile: 1 });
sellerSchema.index({ gstNumber: 1 });
sellerSchema.index({ verificationStatus: 1 });
sellerSchema.index({ isActive: 1 });
sellerSchema.index({ "location.coordinates": "2dsphere" });
sellerSchema.index({ discount: 1 }); // ✅ NEW INDEX
sellerSchema.index({ discount: 1, isVerified: 1, isActive: 1 }); // ✅ NEW COMPOUND INDEX

// Virtuals
sellerSchema.virtual("fullAddress").get(function () {
  return `${this.location.address}, ${this.location.city}, ${this.location.state} - ${this.location.pincode}`;
});

sellerSchema.virtual("profileCompletion").get(function () {
  let completed = 0;
  let total = 11; // ✅ UPDATED from 10 to 11
  if (this.ownerName) completed++;
  if (this.pharmacyName) completed++;
  if (this.email) completed++;
  if (this.mobile) completed++;
  if (this.gstNumber) completed++;
  if (this.drugLicense1) completed++;
  if (this.drugLicense2) completed++;
  if (this.location.address) completed++;
  if (this.shopPhotos.length > 0) completed++;
  if (this.description) completed++;
  if (this.discount) completed++; // ✅ NEW LINE
  return Math.round((completed / total) * 100);
});

sellerSchema.virtual("shopPhotoCount").get(function () {
  return this.shopPhotos.length;
});

// ✅ NEW VIRTUAL for discount display
sellerSchema.virtual("discountDisplay").get(function () {
  return `${this.discount}% OFF`;
});

// Methods
sellerSchema.methods.addShopPhoto = function (photoData) {
  this.shopPhotos.push({
    photoId: photoData.photoId,
    fileName: photoData.fileName,
    fileUrl: photoData.fileUrl,
    fileSize: photoData.fileSize,
    mimeType: photoData.mimeType,
  });
  return this.save();
};

sellerSchema.methods.removeShopPhoto = function (photoId) {
  this.shopPhotos = this.shopPhotos.filter(
    (photo) => photo.photoId !== photoId
  );
  return this.save();
};

sellerSchema.methods.updateLastActive = function () {
  this.metrics.lastActiveAt = new Date();
  return this.save();
};

sellerSchema.methods.isOnline = function () {
  const now = new Date();
  const lastActive = this.metrics.lastActiveAt;
  return now - lastActive < 5 * 60 * 1000; // 5 minutes
};

// ✅ NEW METHOD for discount management
sellerSchema.methods.updateDiscount = function (newDiscount) {
  if ([5, 10, 12, 15].includes(newDiscount)) {
    this.discount = newDiscount;
    this.discountValidFrom = new Date();
    return this.save();
  }
  throw new Error('Invalid discount percentage');
};

// ✅ NEW METHOD to toggle discount status
sellerSchema.methods.toggleDiscountStatus = function () {
  this.discountStatus = this.discountStatus === 'active' ? 'inactive' : 'active';
  return this.save();
};

// Static methods
sellerSchema.statics.findByLocation = function (lat, lng, radius = 10) {
  return this.find({
    isActive: true,
    isVerified: true,
    "location.coordinates": {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [parseFloat(lng), parseFloat(lat)],
        },
        $maxDistance: radius * 1000,
      },
    },
  });
};

sellerSchema.statics.findApproved = function () {
  return this.find({ isVerified: true, verificationStatus: "approved" });
};

// ✅ NEW STATIC METHOD - Find sellers by minimum discount
sellerSchema.statics.findByDiscount = function (minDiscount) {
  return this.find({
    isActive: true,
    isVerified: true,
    discount: { $gte: minDiscount },
    discountStatus: 'active'
  }).sort({ discount: -1 }); // Sort by highest discount first
};

// ✅ NEW STATIC METHOD - Find sellers with highest discounts
sellerSchema.statics.findHighestDiscount = function () {
  return this.find({
    isActive: true,
    isVerified: true,
    discountStatus: 'active'
  }).sort({ discount: -1 }).limit(10);
};

// ✅ NEW STATIC METHOD - Find sellers by location with discount filter
sellerSchema.statics.findByLocationAndDiscount = function (lat, lng, minDiscount = 5, radius = 10) {
  return this.find({
    isActive: true,
    isVerified: true,
    discount: { $gte: minDiscount },
    discountStatus: 'active',
    "location.coordinates": {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [parseFloat(lng), parseFloat(lat)],
        },
        $maxDistance: radius * 1000,
      },
    },
  }).sort({ discount: -1 });
};

module.exports = mongoose.model("Seller", sellerSchema);
