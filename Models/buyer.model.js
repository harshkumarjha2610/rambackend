const mongoose = require("mongoose");

const buyerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters long"],
      maxlength: [100, "Name cannot exceed 100 characters"]
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"]
    },
    mobile: {
      type: String,
      required: false,
      unique: true,
      sparse: true, // Allows multiple null values
      match: [/^[0-9]{10}$/, "Please provide a valid 10-digit mobile number"]
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters long"],
      select: false // Don't include password in queries by default
    },
    address: {
      type: String,
      trim: true,
      maxlength: [500, "Address cannot exceed 500 characters"]
    },
    pincode: {
      type: String,
      trim: true,
      match: [/^[0-9]{6}$/, "Please provide a valid 6-digit pincode"]
    },
    isActive: {
      type: Boolean,
      default: true
    },
    lastLogin: {
      type: Date
    },
    emailVerified: {
      type: Boolean,
      default: false
    },
    mobileVerified: {
      type: Boolean,
      default: false
    }
  },
  { 
    timestamps: true,
    toJSON: {
      transform: function(doc, ret) {
        delete ret.password;
        return ret;
      }
    }
  }
);

// Indexes for better performance
buyerSchema.index({ email: 1 });
buyerSchema.index({ mobile: 1 });
buyerSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Buyer", buyerSchema);
