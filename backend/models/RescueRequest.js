/* ============================================================
   FEEDNOW — RescueRequest Model
   Represents a single NGO's allocation from a donation
   ============================================================ */

const mongoose = require('mongoose');

const VALID_STATUSES = ['PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'COMPLETED'];
const PICKUP_METHODS = ['NGO_COLLECTS', 'DONOR_DELIVERS', 'DISCUSS'];

const rescueRequestSchema = new mongoose.Schema(
  {
    donationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Donation',
      required: true,
    },
    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    ngoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // How many meals/units allocated to this NGO
    allocatedQuantity: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      enum: VALID_STATUSES,
      default: 'PENDING',
    },
    pickupMethod: {
      type: String,
      enum: PICKUP_METHODS,
      default: 'DISCUSS',
    },
    // Match score details for transparency
    matchScore: {
      type: Number,
      default: 0,
    },
    matchFactors: {
      distance: Number,
      foodCompatibility: Number,
      mealRequirement: Number,
      availability: Number,
      pickupCapability: Number,
      urgency: Number,
    },
    distanceKm: {
      type: Number,
    },
    // Notes from NGO on acceptance/rejection
    ngoNote: {
      type: String,
      trim: true,
    },
    // When pickup was confirmed/completed
    completedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Index for fast lookup
rescueRequestSchema.index({ donationId: 1 });
rescueRequestSchema.index({ ngoId: 1 });
rescueRequestSchema.index({ donorId: 1 });

module.exports = mongoose.model('RescueRequest', rescueRequestSchema);
