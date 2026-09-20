/* ============================================================
   FEEDNOW — Donation Controller (Fixed)
   Full rescue workflow: create → match → rescue
   ============================================================ */

const mongoose = require('mongoose');
const Donation = require('../models/Donation');
const NgoProfile = require('../models/NgoProfile');
const RescueRequest = require('../models/RescueRequest');
const Notification = require('../models/Notification');
const User = require('../models/User');

// ── Haversine distance formula (returns km)
const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// ── Helper: create a notification (non-blocking)
const notify = async (userId, type, message, donationId, rescueRequestId) => {
  try {
    await Notification.create({ userId, type, message, donationId, rescueRequestId });
  } catch (err) {
    console.error('[Notification] create error:', err.message);
  }
};

// ── Helper: safe donation object for response
const safeDonation = (d) => d.toObject ? d.toObject() : d;

/* ──────────────────────────────────────────────
   POST /api/donations   (donor only)
   Body: { foodName, foodType, quantity, unit, preparedAt, pickupDeadline,
           location: { address, latitude, longitude }, notes }
   ────────────────────────────────────────────── */
const createDonation = async (req, res) => {
  try {
    const { foodName, foodType, quantity, unit, preparedAt, pickupDeadline, location, pickupAddress, notes } = req.body;

    // Validation
    if (!foodName || !foodType || !quantity || !pickupDeadline) {
      return res.status(400).json({
        success: false,
        message: 'foodName, foodType, quantity and pickupDeadline are required',
      });
    }

    const numQty = typeof quantity === 'number' ? quantity : parseFloat(quantity);
    if (isNaN(numQty) || numQty <= 0) {
      return res.status(400).json({ success: false, message: 'Quantity must be a number greater than 0' });
    }

    // Extract unit if string contained unit
    let resolvedUnit = unit;
    if (!resolvedUnit && typeof quantity === 'string') {
      const parts = quantity.trim().split(/\s+/);
      if (parts.length > 1) resolvedUnit = parts.slice(1).join(' ');
    }

    const deadline = new Date(pickupDeadline);
    if (isNaN(deadline.getTime()) || deadline <= new Date()) {
      return res.status(400).json({ success: false, message: 'pickupDeadline must be a valid future date/time' });
    }

    const donation = await Donation.create({
      donorId: req.user._id,
      foodName,
      foodType,
      quantity: numQty,
      unit: resolvedUnit || 'Meals',
      remainingQuantity: numQty,
      preparedAt: preparedAt ? new Date(preparedAt) : new Date(),
      pickupDeadline: deadline,
      location: {
        address: location?.address || pickupAddress || '',
        latitude: location?.latitude || 12.9352,
        longitude: location?.longitude || 77.6245,
      },
      notes: notes || '',
      status: 'AVAILABLE',
    });

    // Notify donor of successful creation
    await notify(
      req.user._id,
      'DONATION_CREATED',
      `Your donation "${foodName}" (${quantity} ${unit || 'Meals'}) was posted successfully. Click "Match NGOs" to find nearby NGOs.`,
      donation._id
    );

    return res.status(201).json({ success: true, message: 'Donation created', donation });
  } catch (err) {
    console.error('[Donation] createDonation error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
};

/* ──────────────────────────────────────────────
   POST /api/donations/:id/match   (donor only)
   Smart NGO matching with partial allocation
   ────────────────────────────────────────────── */
const matchDonation = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid donation ID' });
    }

    const donation = await Donation.findById(req.params.id);
    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation not found' });
    }
    if (donation.donorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    if (!['AVAILABLE', 'PARTIALLY_ACCEPTED'].includes(donation.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot match donation with status ${donation.status}`,
      });
    }
    if (donation.remainingQuantity <= 0) {
      return res.status(400).json({ success: false, message: 'No remaining quantity to match' });
    }
    const now = new Date();
    if (donation.pickupDeadline <= now) {
      donation.status = 'EXPIRED';
      await donation.save();
      return res.status(400).json({ success: false, message: 'Donation has expired' });
    }

    // Get all eligible NGO profiles (not CURRENTLY_FULL, accepting donations)
    const ngoProfiles = await NgoProfile.find({
      isAcceptingDonations: true,
      foodStatus: { $ne: 'CURRENTLY_FULL' },
      mealsNeeded: { $gt: 0 },
    }).populate('userId', 'name email phone');

    if (ngoProfiles.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No eligible NGOs found at this time',
        matches: [],
        donation: safeDonation(donation),
      });
    }

    const donorLat = donation.location?.latitude || 12.9352;
    const donorLon = donation.location?.longitude || 77.6245;

    // Time remaining in hours (for urgency score)
    const hoursLeft = (donation.pickupDeadline - now) / 3600000;

    // ── Score each NGO
    const scored = ngoProfiles.map((profile) => {
      const distKm = haversineDistance(donorLat, donorLon, profile.latitude, profile.longitude);

      // Food type compatibility (1 = match, 0 = no match)
      const foodCompatible = profile.foodTypes.includes(donation.foodType) ? 1 : 0;

      // Availability score (NEED_FOOD_NOW = 1.0, CAN_ACCEPT = 0.6)
      const availScore = profile.foodStatus === 'NEED_FOOD_NOW' ? 1.0 : 0.6;

      // Distance score: inverse (closer = better). Max useful range = 25km
      const distScore = Math.max(0, 1 - distKm / 25);

      // Meal requirement score: how much of donation they need (capped at 1)
      const mealRatioScore = Math.min(1, profile.mealsNeeded / donation.remainingQuantity);

      // Pickup capability score
      const pickupScore = profile.pickupAvailable ? 1.0 : 0.5;

      // Urgency score: higher urgency = prioritize NGOs that need food NOW
      const urgencyScore = donation.urgencyLevel === 'CRITICAL' ? 1.0
        : donation.urgencyLevel === 'HIGH' ? 0.8
        : donation.urgencyLevel === 'MEDIUM' ? 0.6
        : 0.4;

      // Weighted score (must sum to 1.0)
      const totalScore =
        distScore         * 0.30 +
        foodCompatible    * 0.20 +
        mealRatioScore    * 0.20 +
        availScore        * 0.15 +
        pickupScore       * 0.10 +
        urgencyScore      * 0.05;

      return {
        profile,
        score: Math.round(totalScore * 100),
        distanceKm: Math.round(distKm * 10) / 10,
        factors: {
          distance: Math.round(distScore * 100),
          foodCompatibility: Math.round(foodCompatible * 100),
          mealRequirement: Math.round(mealRatioScore * 100),
          availability: Math.round(availScore * 100),
          pickupCapability: Math.round(pickupScore * 100),
          urgency: Math.round(urgencyScore * 100),
        },
        allocatable: Math.min(profile.mealsNeeded, donation.remainingQuantity),
      };
    });

    // Sort by score descending, filter out incompatible food types (score would be 0 on food factor)
    const ranked = scored
      .filter((s) => s.profile.foodTypes.includes(donation.foodType) || s.profile.foodTypes.length === 0)
      .sort((a, b) => b.score - a.score);

    // ── Partial allocation: greedily allocate remaining quantity
    let remaining = donation.remainingQuantity;
    const createdRequests = [];
    const matchResults = [];

    for (const match of ranked) {
      if (remaining <= 0) break;
      if (match.allocatable <= 0) continue;

      const alloc = Math.min(match.allocatable, remaining);

      // Check if a rescue request already exists for this NGO+Donation (avoid duplicates)
      const existing = await RescueRequest.findOne({
        donationId: donation._id,
        ngoId: match.profile.userId._id,
        status: { $in: ['PENDING', 'ACCEPTED'] },
      });
      if (existing) {
        matchResults.push({ ...match, skipped: true, reason: 'Already has active request' });
        continue;
      }

      const request = await RescueRequest.create({
        donationId: donation._id,
        donorId: donation.donorId,
        ngoId: match.profile.userId._id,
        allocatedQuantity: alloc,
        status: 'PENDING',
        matchScore: match.score,
        matchFactors: match.factors,
        distanceKm: match.distanceKm,
      });

      remaining -= alloc;
      createdRequests.push(request);
      matchResults.push({ ...match, allocatedQuantity: alloc, requestId: request._id });

      // Notify NGO
      await notify(
        match.profile.userId._id,
        'RESCUE_REQUEST_CREATED',
        `New rescue request: "${donation.foodName}" (${alloc} ${donation.unit}) from a donor ${match.distanceKm} km away. Match score: ${match.score}%.`,
        donation._id,
        request._id
      );
    }

    // Update donation status and remainingQuantity
    donation.remainingQuantity = remaining;
    if (createdRequests.length > 0) {
      if (remaining <= 0) {
        donation.status = 'FULLY_ACCEPTED';
      } else {
        donation.status = 'PARTIALLY_ACCEPTED';
      }
    } else {
      donation.status = 'MATCHING';
    }
    await donation.save();

    // Notify donor
    if (createdRequests.length > 0) {
      await notify(
        donation.donorId,
        'DONATION_MATCHED',
        `Your donation "${donation.foodName}" was matched with ${createdRequests.length} NGO(s). ${remaining > 0 ? `${remaining} ${donation.unit} still available.` : 'Fully matched!'}`,
        donation._id
      );
    }

    return res.status(200).json({
      success: true,
      message: `Matched with ${createdRequests.length} NGO(s)`,
      matched: createdRequests.length,
      remainingQuantity: remaining,
      donation: safeDonation(donation),
      matches: matchResults.map((m) => ({
        ngoId: m.profile.userId._id,
        organizationName: m.profile.organizationName,
        distanceKm: m.distanceKm,
        score: m.score,
        factors: m.factors,
        allocatedQuantity: m.allocatedQuantity,
        requestId: m.requestId,
        skipped: m.skipped || false,
        reason: m.reason || null,
      })),
    });
  } catch (err) {
    console.error('[Donation] matchDonation error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
};

/* ──────────────────────────────────────────────
   GET /api/donations/my   (donor — own donations)
   ────────────────────────────────────────────── */
const getMyDonations = async (req, res) => {
  try {
    const donations = await Donation.find({ donorId: req.user._id }).sort({ createdAt: -1 });

    // Attach rescue request counts for each donation
    const enriched = await Promise.all(
      donations.map(async (d) => {
        const requests = await RescueRequest.find({ donationId: d._id })
          .populate('ngoId', 'name')
          .lean();
        return {
          ...d.toObject(),
          rescueRequests: requests,
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
   GET /api/donations/:id
   ────────────────────────────────────────────── */
const getDonationById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid donation ID' });
    }

    let donation = await Donation.findById(req.params.id).populate('donorId', 'name email phone');
    if (!donation) {
      // Check if the ID belongs to a RescueRequest
      const reqDoc = await RescueRequest.findById(req.params.id)
        .populate('donationId')
        .populate('donorId', 'name email phone')
        .populate('ngoId', 'name email phone');

      if (reqDoc && reqDoc.donationId) {
        const d = reqDoc.donationId;
        return res.status(200).json({
          success: true,
          donation: {
            _id: reqDoc._id,
            requestId: reqDoc._id,
            donationId: d._id,
            foodName: d.foodName,
            foodType: d.foodType,
            quantity: `${reqDoc.allocatedQuantity} ${d.unit || 'Meals'}`,
            rawQuantity: reqDoc.allocatedQuantity,
            unit: d.unit || 'Meals',
            pickupDeadline: d.pickupDeadline,
            preparedAt: d.preparedAt,
            pickupAddress: d.location?.address || '',
            notes: d.notes || '',
            status: reqDoc.status,
            donorId: reqDoc.donorId,
            ngoId: reqDoc.ngoId,
            matchScore: reqDoc.matchScore,
            distanceKm: reqDoc.distanceKm,
            createdAt: reqDoc.createdAt,
          },
        });
      }
      return res.status(404).json({ success: false, message: 'Donation not found' });
    }

    const uid = req.user._id.toString();
    const role = req.user.role;

    // Donor can view their own, NGOs can view if they have a rescue request, admin can view all
    if (role !== 'admin') {
      if (donation.donorId._id.toString() !== uid) {
        const hasRequest = await RescueRequest.findOne({ donationId: donation._id, ngoId: uid });
        if (!hasRequest) {
          return res.status(403).json({ success: false, message: 'Access denied' });
        }
      }
    }

    const requests = await RescueRequest.find({ donationId: donation._id })
      .populate('ngoId', 'name email phone')
      .lean();

    return res.status(200).json({
      success: true,
      donation: {
        ...donation.toObject(),
        pickupAddress: donation.location?.address || '',
        rescueRequests: requests,
      },
    });
  } catch (err) {
    console.error('[Donation] getDonationById error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/* ──────────────────────────────────────────────
   GET /api/donations/received  (NGO only)
   Returns incoming donation allocations (RescueRequests)
   ────────────────────────────────────────────── */
const getReceivedDonations = async (req, res) => {
  try {
    const requests = await RescueRequest.find({ ngoId: req.user._id })
      .sort({ createdAt: -1 })
      .populate('donationId')
      .populate('donorId', 'name email phone')
      .lean();

    const formatted = requests.map((r) => {
      const d = r.donationId || {};
      return {
        _id: r._id,
        requestId: r._id,
        donationId: d._id,
        foodName: d.foodName || 'Food Item',
        foodType: d.foodType || 'Vegetarian',
        quantity: `${r.allocatedQuantity} ${d.unit || 'Meals'}`,
        rawQuantity: r.allocatedQuantity,
        unit: d.unit || 'Meals',
        pickupDeadline: d.pickupDeadline,
        preparedAt: d.preparedAt,
        pickupAddress: d.location?.address || '',
        notes: d.notes || '',
        status: r.status,
        donorId: r.donorId,
        matchScore: r.matchScore,
        distanceKm: r.distanceKm,
        createdAt: r.createdAt,
      };
    });

    return res.status(200).json({ success: true, count: formatted.length, donations: formatted });
  } catch (err) {
    console.error('[Donation] getReceivedDonations error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/* ──────────────────────────────────────────────
   PATCH /api/donations/:id/status  (NGO updates status)
   Supports ACCEPTED, COORDINATED, COMPLETED, DECLINED
   ────────────────────────────────────────────── */
const updateDonationStatus = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid ID' });
    }

    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }

    // Try finding RescueRequest first
    let request = await RescueRequest.findById(req.params.id).populate('donationId');
    if (!request) {
      // If it was a Donation ID, find the request for this NGO
      request = await RescueRequest.findOne({ donationId: req.params.id, ngoId: req.user._id }).populate('donationId');
    }

    if (!request) {
      return res.status(404).json({ success: false, message: 'Rescue request not found' });
    }

    const donation = await Donation.findById(request.donationId._id || request.donationId);

    if (status === 'ACCEPTED' || status === 'COORDINATED') {
      request.status = 'ACCEPTED';
      await request.save();

      // Update NGO profile: reduce mealsNeeded
      const ngoProfile = await NgoProfile.findOne({ userId: req.user._id });
      if (ngoProfile) {
        ngoProfile.mealsNeeded = Math.max(0, (ngoProfile.mealsNeeded || 0) - request.allocatedQuantity);
        if (ngoProfile.mealsNeeded === 0) ngoProfile.foodStatus = 'CURRENTLY_FULL';
        await ngoProfile.save();
      }

      if (donation) {
        donation.status = donation.remainingQuantity <= 0 ? 'READY_FOR_PICKUP' : 'PARTIALLY_ACCEPTED';
        await donation.save();
        await notify(
          donation.donorId,
          'RESCUE_REQUEST_ACCEPTED',
          `An NGO accepted ${request.allocatedQuantity} ${donation.unit} of "${donation.foodName}". Ready for pickup!`,
          donation._id,
          request._id
        );
      }
    } else if (status === 'DECLINED' || status === 'REJECTED') {
      request.status = 'REJECTED';
      await request.save();

      if (donation) {
        donation.remainingQuantity = (donation.remainingQuantity || 0) + request.allocatedQuantity;
        if (donation.remainingQuantity === donation.quantity) donation.status = 'AVAILABLE';
        else donation.status = 'PARTIALLY_ACCEPTED';
        await donation.save();

        await notify(
          donation.donorId,
          'RESCUE_REQUEST_REJECTED',
          `An NGO was unable to accept ${request.allocatedQuantity} meals of "${donation.foodName}". Returned to inventory.`,
          donation._id,
          request._id
        );
      }
    } else if (status === 'COMPLETED') {
      request.status = 'COMPLETED';
      request.completedAt = new Date();
      await request.save();

      const ngoProfile = await NgoProfile.findOne({ userId: req.user._id });
      if (ngoProfile) {
        ngoProfile.totalMealsRescued = (ngoProfile.totalMealsRescued || 0) + request.allocatedQuantity;
        ngoProfile.totalRescues = (ngoProfile.totalRescues || 0) + 1;
        ngoProfile.peopleServed = (ngoProfile.peopleServed || 0) + request.allocatedQuantity;
        await ngoProfile.save();
      }

      if (donation) {
        const allRequests = await RescueRequest.find({ donationId: donation._id });
        const allDone = allRequests.every((r) => r.status === 'COMPLETED' || r.status === 'REJECTED');
        if (allDone) {
          donation.status = 'RESCUED';
          donation.impactMealsSaved = (donation.impactMealsSaved || 0) + donation.quantity;
          donation.impactPeopleServed = (donation.impactPeopleServed || 0) + donation.quantity;
          await donation.save();
        }

        await notify(
          donation.donorId,
          'DONATION_COMPLETED',
          `Rescue completed! ${request.allocatedQuantity} meals of "${donation.foodName}" successfully delivered.`,
          donation._id,
          request._id
        );
      }
    }

    return res.status(200).json({
      success: true,
      message: `Status updated to ${status}`,
      donation: {
        _id: request._id,
        status: request.status,
      },
    });
  } catch (err) {
    console.error('[Donation] updateDonationStatus error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
};

/* ──────────────────────────────────────────────
   PATCH /api/donations/:id
   Donor can update their donation (if still AVAILABLE)
   ────────────────────────────────────────────── */
const updateDonation = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid donation ID' });
    }

    const donation = await Donation.findById(req.params.id);
    if (!donation) return res.status(404).json({ success: false, message: 'Donation not found' });
    if (donation.donorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    if (!['AVAILABLE', 'MATCHING'].includes(donation.status)) {
      return res.status(400).json({ success: false, message: 'Cannot edit donation after matching has started' });
    }

    const allowed = ['foodName', 'foodType', 'quantity', 'unit', 'preparedAt', 'pickupDeadline', 'location', 'notes'];
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) donation[key] = req.body[key];
    });
    if (req.body.quantity) donation.remainingQuantity = Number(req.body.quantity);

    await donation.save();
    return res.status(200).json({ success: true, message: 'Donation updated', donation });
  } catch (err) {
    console.error('[Donation] updateDonation error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/* ──────────────────────────────────────────────
   GET /api/donations  (admin — all donations)
   ────────────────────────────────────────────── */
const getAllDonations = async (req, res) => {
  try {
    const donations = await Donation.find({})
      .sort({ createdAt: -1 })
      .populate('donorId', 'name email')
      .lean();
    return res.status(200).json({ success: true, count: donations.length, donations });
  } catch (err) {
    console.error('[Donation] getAllDonations error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  createDonation,
  matchDonation,
  getMyDonations,
  getReceivedDonations,
  getDonationById,
  updateDonation,
  updateDonationStatus,
  getAllDonations,
};
