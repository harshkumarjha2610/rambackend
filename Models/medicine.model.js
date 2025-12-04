const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  manufacturer: {
    type: String,
    required: true,
    trim: true,
  },
  inStock: {
    type: Boolean,
    default: true,
  },
  category: {
    type: String,
    required: true,
    trim: true,
  },
});

module.exports = mongoose.model('Medicine', medicineSchema);