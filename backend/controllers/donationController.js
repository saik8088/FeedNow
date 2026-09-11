/* ============================================================
   FEEDNOW — Donation Controller
   ============================================================ */

const mongoose = require('mongoose');
const Donation = require('../models/Donation');
const NgoProfile = require('../models/NgoProfile');
const Notification = require('../models/Notification');

// Valid status transitions
const TRANSITIONS = {
  PENDING: ['ACCEPTED', 'DECLINED'],
  ACCEPTED: ['COORDINATED'],
  COORDINATED: ['COMPLETED'],
  DECLINED: [],
  COMPLETED: [],
};

// Helper: create a notification
const createNotification = async (userId, type, message, donationId) => {
  try {
    await Notification.create({ userId, type, message, donationId });
  } catch (err) {
    console.error('[Notification] create error:', err.message);
  }
};

/* ──────────────────────────────────────────────
   POST /api/donations   (donor only)
   ────────────────────────────────────────────── */
const createDonation = async (req, res) => {
  try {
    const { ngoId, foodName, foodType, quantity, preparedAt, pickupDeadline, pickupAddress, notes } = req.body;

    if (!ngoId || !foodName || !foodType || !quantity || !pickupDeadline) {
      return res.status(400).json({ success: false, message: 'ngoId, foodName, foodType, quantity and pickupDeadline are required' });
    }
    if (!mongoose.isValidObjectId(ngoId)) {
      return res.status(400).json({ success: false, message: 'Invalid NGO ID' });
    }

    // Confirm NGO exists (support both User ID and NgoProfile ID)
    let ngoProfile = await NgoProfile.findOne({ userId: ngoId });
    let recipientUserId = ngoId;
    if (!ngoProfile) {
      ngoProfile = await NgoProfile.findById(ngoId);
      if (ngoProfile) {
        recipientUserId = ngoProfile.userId;
      }
    }
    if (!ngoProfile) {
      return res.status(404).json({ success: false, message: 'NGO not found' });
    }

    const donation = await Donation.create({
      donorId: req.user._id,
      ngoId: recipientUserId,
      foodName,
      foodType,
      quantity,
      preparedAt: preparedAt || new Date(),
      pickupDeadline,
      pickupAddress,
      notes,
    });

    // Notify NGO of new donation
    await createNotification(
      ngoId,
      'DONATION_CREATED',
      `You received a new food donation request: ${foodName} (${quantity}).`,
      donation._id
    );

    return res.status(201).json({ success: true, message: 'Donation created', donation });
  } catch (err) {
    console.error('[Donation] createDonation error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/* ──────────────────────────────────────────────
   GET /api/donations/my   (donor — own donations)
   ────────────────────────────────────────────── */
const getMyDonations = async (req, res) => {
  try {
    const donations = await Donation.find({ donorId: req.user._id })
      .sort({ createdAt: -1 })
      .populate('ngoId', 'name');

    // Attach NGO organization name from profile
    const NgoProfile = require('../models/NgoProfile');
    const enriched = await Promise.all(
      donations.map(async (d) => {
        const profile = await NgoProfile.findOne({ userId: d.ngoId }).select('organizationName');
        return {
          ...d.toObject(),
          ngoName: profile ? profile.organizationName : d.ngoId?.name || 'NGO',
        };
      })
    );

    return res.status(200).json({ success: true, count: enriched.length, donations: enriched });
  } catch (err) {
    console.error('[Donation] getMyDonations error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/* ──────────────────────────────────────────────
   GET /api/donations/received   (NGO — donations sent to this NGO)
   ────────────────────────────────────────────── */
const getReceivedDonations = async (req, res) => {
  try {
    const donations = await Donation.find({ ngoId: req.user._id })
      .sort({ createdAt: -1 })
      .populate('donorId', 'name email phone');

    return res.status(200).json({ success: true, count: donations.length, donations });
  } catch (err) {
    console.error('[Donation] getReceivedDonations error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/* ──────────────────────────────────────────────
   GET /api/donations/:id
   ────────────────────────────────────────────── */
const getDonationById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid donation ID' });
    }

    const donation = await Donation.findById(req.params.id)
      .populate('donorId', 'name email phone')
      .populate('ngoId', 'name email');

    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation not found' });
    }

    // Only donor or the assigned NGO can view
    const uid = req.user._id.toString();
    if (donation.donorId._id.toString() !== uid && donation.ngoId._id.toString() !== uid) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Attach NGO organization name
    const NgoProfile = require('../models/NgoProfile');
    const profile = await NgoProfile.findOne({ userId: donation.ngoId._id }).select('organizationName');

    return res.status(200).json({
      success: true,
      donation: {
        ...donation.toObject(),
        ngoName: profile ? profile.organizationName : donation.ngoId?.name || 'NGO',
      },
    });
  } catch (err) {
    console.error('[Donation] getDonationById error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/* ──────────────────────────────────────────────
   PATCH /api/donations/:id/status
   ────────────────────────────────────────────── */
const updateDonationStatus = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid donation ID' });
    }

    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }

    const donation = await Donation.findById(req.params.id);
    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation not found' });
    }

    const uid = req.user._id.toString();
    const role = req.user.role;

    // Role-based permission on which statuses can be set
    const allowedByNgo = ['ACCEPTED', 'DECLINED', 'COORDINATED', 'COMPLETED'];
    const allowedByDonor = []; // donors cannot change status via this endpoint

    if (role === 'ngo') {
      if (donation.ngoId.toString() !== uid) {
        return res.status(403).json({ success: false, message: 'You can only manage your own donations' });
      }
      if (!allowedByNgo.includes(status)) {
        return res.status(400).json({ success: false, message: 'NGOs cannot set this status' });
      }
    } else {
      return res.status(403).json({ success: false, message: 'Only NGOs can update donation status' });
    }

    // Validate transition
    const validNext = TRANSITIONS[donation.status] || [];
    if (!validNext.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot transition from ${donation.status} to ${status}`,
      });
    }

    donation.status = status;
    await donation.save();

    // Send notifications based on new status
    const notifMap = {
      ACCEPTED: {
        recipientId: donation.donorId,
        type: 'DONATION_ACCEPTED',
        msg: `Your food donation "${donation.foodName}" was accepted by the NGO.`,
      },
      DECLINED: {
        recipientId: donation.donorId,
        type: 'DONATION_DECLINED',
        msg: `Your food donation "${donation.foodName}" was declined by the NGO.`,
      },
      COORDINATED: {
        recipientId: donation.donorId,
        type: 'DONATION_COORDINATED',
        msg: `Pickup for "${donation.foodName}" has been coordinated by the NGO.`,
      },
      COMPLETED: {
        recipientId: donation.donorId,
        type: 'DONATION_COMPLETED',
        msg: `Your donation "${donation.foodName}" has been completed successfully. Thank you!`,
      },
    };

    if (notifMap[status]) {
      const { recipientId, type, msg } = notifMap[status];
      await createNotification(recipientId, type, msg, donation._id);
    }

    return res.status(200).json({ success: true, message: `Status updated to ${status}`, donation });
  } catch (err) {
    console.error('[Donation] updateDonationStatus error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { createDonation, getMyDonations, getReceivedDonations, getDonationById, updateDonationStatus };
