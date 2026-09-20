/* ============================================================
   FEEDNOW — Donation Model (Fixed)
   Supports full rescue workflow with partial allocation
   ============================================================ */

const mongoose = require('mongoose');

const VALID_STATUSES = [
  'AVAILABLE',        // Just posted, awaiting matching
  'MATCHING',         // Matching in progress
  'REQUESTED',        // At least one rescue request created
  'PARTIALLY_ACCEPTED', // Some quantity accepted, some still available
  'FULLY_ACCEPTED',   // All quantity accepted by NGOs
  'READY_FOR_PICKUP', // Donor confirmed ready for pickup
  'PICKED_UP',        // NGO has picked up
  'RESCUED',          // Fully rescued / completed
  'EXPIRED',          // Past pickup deadline without rescue
  'CANCELLED',        // Cancelled by donor
];

const URGENCY_LEVELS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

const donationSchema = new mongoose.Schema(
  {
    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    foodName: {
      type: String,
      required: [true, 'Food name is required'],
      trim: true,
    },
    foodType: {
      type: String,
      required: [true, 'Food type is required'],
      enum: ['Vegetarian', 'Non-Vegetarian', 'Vegan', 'Other'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity (number of meals) is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    unit: {
      type: String,
      enum: ['Meals', 'Plates', 'Packs', 'Kilograms', 'Other'],
      default: 'Meals',
    },
    remainingQuantity: {
      type: Number,
      default: function () { return this.quantity; },
    },
    preparedAt: {
      type: Date,
      default: Date.now,
    },
    pickupDeadline: {
      type: Date,
      required: [true, 'Pickup deadline is required'],
    },
    // Location of food (donor's location)
    location: {
      address: { type: String, trim: true },
      latitude: { type: Number, default: 12.9352 },  // Default: Bengaluru
      longitude: { type: Number, default: 77.6245 },
    },
    notes: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: VALID_STATUSES,
      default: 'AVAILABLE',
    },
    urgencyLevel: {
      type: String,
      enum: URGENCY_LEVELS,
      default: 'MEDIUM',
    },
    // Impact tracking
    impactMealsSaved: {
      type: Number,
      default: 0,
    },
    impactPeopleServed: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Auto-calculate urgency based on time remaining before pickupDeadline
donationSchema.pre('save', function (next) {
  if (this.pickupDeadline) {
    const now = new Date();
    const minutesLeft = (this.pickupDeadline - now) / 60000;
    if (minutesLeft <= 30) this.urgencyLevel = 'CRITICAL';
    else if (minutesLeft <= 60) this.urgencyLevel = 'HIGH';
    else if (minutesLeft <= 120) this.urgencyLevel = 'MEDIUM';
    else this.urgencyLevel = 'LOW';
  }
  // Sync remainingQuantity on new document
  if (this.isNew && this.remainingQuantity === undefined) {
    this.remainingQuantity = this.quantity;
  }
  next();
});

module.exports = mongoose.model('Donation', donationSchema);
