/* ============================================================
   FEEDNOW — RescueRequest Controller
   Handles NGO acceptance, rejection, completion and tracking
   ============================================================ */

const mongoose = require('mongoose');
const RescueRequest = require('../models/RescueRequest');
const Donation = require('../models/Donation');
const NgoProfile = require('../models/NgoProfile');
const Notification = require('../models/Notification');

// Helper: safe notification
const notify = async (userId, type, message, donationId, rescueRequestId) => {
  try {
    await Notification.create({ userId, type, message, donationId, rescueRequestId });
  } catch (err) {
    console.error('[Notification] error:', err.message);
  }
};

/* ──────────────────────────────────────────────
   GET /api/rescue-requests/my
   NGO gets their requests; Donor gets requests for their donations
   ────────────────────────────────────────────── */
const getMyRescueRequests = async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === 'ngo') {
      filter.ngoId = req.user._id;
    } else if (req.user.role === 'donor') {
      filter.donorId = req.user._id;
    }

    const requests = await RescueRequest.find(filter)
      .sort({ createdAt: -1 })
      .populate('donationId')
      .populate('donorId', 'name email phone')
      .populate('ngoId', 'name email phone')
      .lean();

    return res.status(200).json({
      success: true,
      count: requests.length,
      rescueRequests: requests,
    });
  } catch (err) {
    console.error('[RescueRequest] getMyRescueRequests error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/* ──────────────────────────────────────────────
   GET /api/rescue-requests/:id
   ────────────────────────────────────────────── */
const getRescueRequestById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid ID' });
    }

    const request = await RescueRequest.findById(req.params.id)
      .populate('donationId')
      .populate('donorId', 'name email phone')
      .populate('ngoId', 'name email phone');

    if (!request) {
      return res.status(404).json({ success: false, message: 'Rescue request not found' });
    }

    const uid = req.user._id.toString();
    const isDonor = request.donorId._id.toString() === uid;
    const isNgo = request.ngoId._id.toString() === uid;
    const isAdmin = req.user.role === 'admin';

    if (!isDonor && !isNgo && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    return res.status(200).json({ success: true, rescueRequest: request });
  } catch (err) {
    console.error('[RescueRequest] getRescueRequestById error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/* ──────────────────────────────────────────────
   PATCH /api/rescue-requests/:id/accept
   NGO accepts the rescue request
   ────────────────────────────────────────────── */
const acceptRescueRequest = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid ID' });
    }

    const request = await RescueRequest.findById(req.params.id).populate('donationId');
    if (!request) {
      return res.status(404).json({ success: false, message: 'Rescue request not found' });
    }

    if (request.ngoId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the assigned NGO can accept' });
    }

    if (request.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `Cannot accept request with status "${request.status}"`,
      });
    }

    const { pickupMethod, ngoNote } = req.body;
    if (pickupMethod && ['NGO_COLLECTS', 'DONOR_DELIVERS', 'DISCUSS'].includes(pickupMethod)) {
      request.pickupMethod = pickupMethod;
    }
    if (ngoNote) request.ngoNote = ngoNote;

    request.status = 'ACCEPTED';
    await request.save();

    // Update NGO profile: reduce mealsNeeded
    const ngoProfile = await NgoProfile.findOne({ userId: req.user._id });
    if (ngoProfile) {
      ngoProfile.mealsNeeded = Math.max(0, (ngoProfile.mealsNeeded || 0) - request.allocatedQuantity);
      if (ngoProfile.mealsNeeded === 0) {
        ngoProfile.foodStatus = 'CURRENTLY_FULL';
      }
      await ngoProfile.save();
    }

    // Check donation overall status
    const donation = await Donation.findById(request.donationId._id || request.donationId);
    if (donation) {
      // Find all requests for this donation
      const allRequests = await RescueRequest.find({ donationId: donation._id });
      const allAcceptedOrCompleted = allRequests.every(
        (r) => r.status === 'ACCEPTED' || r.status === 'COMPLETED'
      );
      if (allAcceptedOrCompleted && donation.remainingQuantity <= 0) {
        donation.status = 'READY_FOR_PICKUP';
      } else {
        donation.status = 'PARTIALLY_ACCEPTED';
      }
      await donation.save();

      // Notify donor
      await notify(
        donation.donorId,
        'RESCUE_REQUEST_ACCEPTED',
        `NGO accepted ${request.allocatedQuantity} ${donation.unit} of "${donation.foodName}". Ready for pickup!`,
        donation._id,
        request._id
      );
    }

    return res.status(200).json({
      success: true,
      message: 'Rescue request accepted',
      rescueRequest: request,
    });
  } catch (err) {
    console.error('[RescueRequest] acceptRescueRequest error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
};

/* ──────────────────────────────────────────────
   PATCH /api/rescue-requests/:id/reject
   NGO declines the rescue request -> quantity returned to donation
   ────────────────────────────────────────────── */
const rejectRescueRequest = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid ID' });
    }

    const request = await RescueRequest.findById(req.params.id).populate('donationId');
    if (!request) {
      return res.status(404).json({ success: false, message: 'Rescue request not found' });
    }

    if (request.ngoId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the assigned NGO can reject' });
    }

    if (request.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `Cannot reject request with status "${request.status}"`,
      });
    }

    const { ngoNote } = req.body;
    if (ngoNote) request.ngoNote = ngoNote;

    request.status = 'REJECTED';
    await request.save();

    // Return quantity to donation
    const donation = await Donation.findById(request.donationId._id || request.donationId);
    if (donation) {
      donation.remainingQuantity = (donation.remainingQuantity || 0) + request.allocatedQuantity;
      // Revert status if needed
      if (donation.status === 'FULLY_ACCEPTED') {
        donation.status = 'PARTIALLY_ACCEPTED';
      } else if (donation.remainingQuantity === donation.quantity) {
        donation.status = 'AVAILABLE';
      }
      await donation.save();

      // Notify donor
      await notify(
        donation.donorId,
        'RESCUE_REQUEST_REJECTED',
        `An NGO was unable to accept ${request.allocatedQuantity} meals of "${donation.foodName}". The meals are back in available inventory.`,
        donation._id,
        request._id
      );
    }

    return res.status(200).json({
      success: true,
      message: 'Rescue request rejected; food returned to pool',
      rescueRequest: request,
    });
  } catch (err) {
    console.error('[RescueRequest] rejectRescueRequest error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
};

/* ──────────────────────────────────────────────
   PATCH /api/rescue-requests/:id/complete
   Confirm pickup / delivery completed
   ────────────────────────────────────────────── */
const completeRescueRequest = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid ID' });
    }

    const request = await RescueRequest.findById(req.params.id).populate('donationId');
    if (!request) {
      return res.status(404).json({ success: false, message: 'Rescue request not found' });
    }

    const uid = req.user._id.toString();
    const isDonor = request.donorId.toString() === uid;
    const isNgo = request.ngoId.toString() === uid;
    const isAdmin = req.user.role === 'admin';

    if (!isDonor && !isNgo && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (request.status !== 'ACCEPTED') {
      return res.status(400).json({
        success: false,
        message: `Only ACCEPTED requests can be completed. Current: "${request.status}"`,
      });
    }

    request.status = 'COMPLETED';
    request.completedAt = new Date();
    await request.save();

    // Update NGO profile impact stats
    const ngoProfile = await NgoProfile.findOne({ userId: request.ngoId });
    if (ngoProfile) {
      ngoProfile.totalMealsRescued = (ngoProfile.totalMealsRescued || 0) + request.allocatedQuantity;
      ngoProfile.totalRescues = (ngoProfile.totalRescues || 0) + 1;
      ngoProfile.peopleServed = (ngoProfile.peopleServed || 0) + request.allocatedQuantity;
      await ngoProfile.save();
    }

    // Check donation: if all active requests are COMPLETED
    const donation = await Donation.findById(request.donationId._id || request.donationId);
    if (donation) {
      const allRequests = await RescueRequest.find({
        donationId: donation._id,
        status: { $in: ['ACCEPTED', 'COMPLETED', 'PENDING'] },
      });
      const allDone = allRequests.every((r) => r.status === 'COMPLETED');
      if (allDone) {
        donation.status = 'RESCUED';
        donation.impactMealsSaved = (donation.impactMealsSaved || 0) + donation.quantity;
        donation.impactPeopleServed = (donation.impactPeopleServed || 0) + donation.quantity;
        await donation.save();
      }

      // Notifications
      await notify(
        donation.donorId,
        'DONATION_COMPLETED',
        `Rescue completed! ${request.allocatedQuantity} meals of "${donation.foodName}" successfully delivered.`,
        donation._id,
        request._id
      );
      await notify(
        request.ngoId,
        'DONATION_COMPLETED',
        `Rescue completed for "${donation.foodName}" (${request.allocatedQuantity} meals). Thank you for saving food!`,
        donation._id,
        request._id
      );
    }

    return res.status(200).json({
      success: true,
      message: 'Rescue marked as completed!',
      rescueRequest: request,
    });
  } catch (err) {
    console.error('[RescueRequest] completeRescueRequest error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
};

/* ──────────────────────────────────────────────
   GET /api/rescue-requests/donation/:donationId
   Get all rescue requests for a specific donation (Donor or Admin)
   ────────────────────────────────────────────── */
const getRequestsByDonation = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.donationId)) {
      return res.status(400).json({ success: false, message: 'Invalid donation ID' });
    }

    const requests = await RescueRequest.find({ donationId: req.params.donationId })
      .populate('ngoId', 'name email phone')
      .populate({
        path: 'ngoId',
        populate: { path: 'userId' },
      })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({ success: true, count: requests.length, rescueRequests: requests });
  } catch (err) {
    console.error('[RescueRequest] getRequestsByDonation error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getMyRescueRequests,
  getRescueRequestById,
  acceptRescueRequest,
  rejectRescueRequest,
  completeRescueRequest,
  getRequestsByDonation,
};
