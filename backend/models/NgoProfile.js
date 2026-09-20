/* ============================================================
   FEEDNOW — NGO Profile Model (Fixed)
   ============================================================ */

const mongoose = require('mongoose');

const FOOD_STATUS_OPTIONS = ['NEED_FOOD_NOW', 'CAN_ACCEPT_FOOD', 'CURRENTLY_FULL'];

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
    // What food types the NGO accepts
    foodTypes: {
      type: [String],
      default: ['Vegetarian', 'Vegan'],
    },
    // Current food requirement text (free form notes)
    requirements: {
      type: String,
      trim: true,
    },
    // Current food availability status
    foodStatus: {
      type: String,
      enum: FOOD_STATUS_OPTIONS,
      default: 'CAN_ACCEPT_FOOD',
    },
    // How many meals they currently need
    mealsNeeded: {
      type: Number,
      default: 0,
      min: 0,
    },
    // How many people they serve
    peopleToServe: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Whether the NGO can pick up food themselves
    pickupAvailable: {
      type: Boolean,
      default: false,
    },
    // Quick toggle: show/hide from donor search
    isAcceptingDonations: {
      type: Boolean,
      default: true,
    },
    // Whether admin has verified this NGO
    isVerified: {
      type: Boolean,
      default: false,
    },
    // DARPAN/registration ID
    registrationId: {
      type: String,
      trim: true,
    },
    // Impact stats
    totalMealsReceived: {
      type: Number,
      default: 0,
    },
    totalRescuesCompleted: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('NgoProfile', ngoProfileSchema);
