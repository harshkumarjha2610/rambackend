const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  buyerId: {
    type: String,
    required: true
  },
  // ✅ ADD THESE FIELDS
  sellerId: {
    type: String,
    default: null
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Seller',
    default: null
  },
  respondedAt: {
    type: Date,
    default: null
  },
  // ✅ END NEW FIELDS
  items: [{
    medicineId: {
      type: String,
      required: false
    },
    name: {
      type: String,
      required: false
    },
    manufacturer: {
      type: String,
      required: false
    },
    price: {
      type: Number,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    }
  }],
  totalAmount: {
    type: Number,
    required: true
  },
  prescriptionImage: {
    type: String,
    default: null
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    },
    address: {
      type: String,
      required: false
    }
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'confirmed', 'shipped', 'delivered', 'cancelled'], // ✅ Added 'accepted' and 'rejected'
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

orderSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Order', orderSchema);
