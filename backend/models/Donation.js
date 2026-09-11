/* ============================================================
   FEEDNOW — Donation Model
   ============================================================ */

const mongoose = require('mongoose');

const VALID_STATUSES = ['PENDING', 'ACCEPTED', 'DECLINED', 'COORDINATED', 'COMPLETED'];

const donationSchema = new mongoose.Schema(
  {
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
      type: String,
      required: [true, 'Quantity is required'],
      trim: true,
    },
    preparedAt: {
      type: Date,
    },
    pickupDeadline: {
      type: Date,
      required: [true, 'Pickup deadline is required'],
    },
    pickupAddress: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    imageUrl: {
      type: String,
    },
    status: {
      type: String,
      enum: VALID_STATUSES,
      default: 'PENDING',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Donation', donationSchema);
