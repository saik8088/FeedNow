/* ============================================================
   FEEDNOW — NGO Profile Model
   ============================================================ */

const mongoose = require('mongoose');

const ngoProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    organizationName: {
      type: String,
      required: [true, 'Organization name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    latitude: {
      type: Number,
      default: 12.9352, // Default: Koramangala, Bengaluru
    },
    longitude: {
      type: Number,
      default: 77.6245,
    },
    foodTypes: {
      type: [String],
      default: ['Vegetarian', 'Vegan'],
    },
    requirements: {
      type: String,
      trim: true,
    },
    pickupAvailable: {
      type: Boolean,
      default: false,
    },
    isAcceptingDonations: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('NgoProfile', ngoProfileSchema);
