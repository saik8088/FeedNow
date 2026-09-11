/* ============================================================
   FEEDNOW — Notification Model
   ============================================================ */

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: [
        'DONATION_CREATED',
        'DONATION_ACCEPTED',
        'DONATION_DECLINED',
        'DONATION_COORDINATED',
        'DONATION_COMPLETED',
      ],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    donationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Donation',
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
