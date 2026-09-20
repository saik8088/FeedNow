/* ============================================================
   FEEDNOW — Notification Model (Fixed)
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
        // Donation events (sent to donor)
        'DONATION_CREATED',
        'DONATION_MATCHED',
        'DONATION_PARTIALLY_ACCEPTED',
        'DONATION_FULLY_ACCEPTED',
        'DONATION_RESCUED',
        'DONATION_EXPIRED',
        'DONATION_CANCELLED',
        // Rescue request events (sent to NGO)
        'RESCUE_REQUEST_CREATED',
        'RESCUE_REQUEST_ACCEPTED',
        'RESCUE_REQUEST_REJECTED',
        'RESCUE_REQUEST_COMPLETED',
        // Pickup events
        'PICKUP_READY',
        'PICKUP_COMPLETED',
        // Legacy (kept for backward compat)
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
    rescueRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RescueRequest',
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
