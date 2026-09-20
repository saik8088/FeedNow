/* ============================================================
   FEEDNOW — Dashboard Controller (Fixed)
   Supports RescueRequest architecture + backward compatibility
   ============================================================ */

const Donation = require('../models/Donation');
const RescueRequest = require('../models/RescueRequest');
const NgoProfile = require('../models/NgoProfile');

/* ──────────────────────────────────────────────
   GET /api/dashboard/donor
   ────────────────────────────────────────────── */
const getDonorDashboard = async (req, res) => {
  try {
    const uid = req.user._id;

    const donations = await Donation.find({ donorId: uid }).sort({ createdAt: -1 }).lean();

    // Stats calculations
    const activeStatuses = ['AVAILABLE', 'MATCHING', 'PARTIALLY_ACCEPTED', 'READY_FOR_PICKUP'];
    const completedStatuses = ['RESCUED', 'PICKED_UP', 'FULLY_ACCEPTED'];

    const total = donations.length;
    const active = donations.filter((d) => activeStatuses.includes(d.status)).length;
    const completed = donations.filter((d) => completedStatuses.includes(d.status)).length;
    const available = donations.filter((d) => d.status === 'AVAILABLE' || d.status === 'MATCHING').length;

    // Total meals saved
    const totalMealsSaved = donations
      .filter((d) => completedStatuses.includes(d.status))
      .reduce((sum, d) => sum + (d.quantity || 0), 0);

    const stats = {
      total,
      active,
      completed,
      available,
      totalMealsSaved,
      // Backward-compatible keys for existing frontend elements
      pending: available,
      accepted: donations.filter((d) => ['PARTIALLY_ACCEPTED', 'FULLY_ACCEPTED', 'READY_FOR_PICKUP'].includes(d.status)).length,
      coordinated: donations.filter((d) => d.status === 'READY_FOR_PICKUP' || d.status === 'PICKED_UP').length,
      declined: donations.filter((d) => d.status === 'CANCELLED' || d.status === 'EXPIRED').length,
    };

    // Enrich recent 5 donations with rescue requests & matched NGO names
    const recent = await Promise.all(
      donations.slice(0, 5).map(async (d) => {
        const requests = await RescueRequest.find({ donationId: d._id })
          .populate('ngoId', 'name')
          .lean();
        const ngoNames = requests.map((r) => r.ngoId?.name).filter(Boolean).join(', ');
        return {
          ...d,
          ngoName: ngoNames || (d.status === 'AVAILABLE' ? 'Unassigned' : 'Matching...'),
          rescueRequests: requests,
        };
      })
    );

    return res.status(200).json({ success: true, stats, recentDonations: recent });
  } catch (err) {
    console.error('[Dashboard] getDonorDashboard error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
};

/* ──────────────────────────────────────────────
   GET /api/dashboard/ngo
   ────────────────────────────────────────────── */
const getNgoDashboard = async (req, res) => {
  try {
    const uid = req.user._id;

    // Fetch rescue requests allocated to this NGO
    const requests = await RescueRequest.find({ ngoId: uid })
      .sort({ createdAt: -1 })
      .populate('donationId')
      .populate('donorId', 'name email phone')
      .lean();

    const pending = requests.filter((r) => r.status === 'PENDING').length;
    const accepted = requests.filter((r) => r.status === 'ACCEPTED').length;
    const completed = requests.filter((r) => r.status === 'COMPLETED').length;
    const rejected = requests.filter((r) => r.status === 'REJECTED' || r.status === 'CANCELLED').length;
    const total = requests.length;

    const profile = await NgoProfile.findOne({ userId: uid }).lean();

    const stats = {
      total,
      pending,
      accepted,
      completed,
      declined: rejected,
      coordinated: accepted, // mapping for UI
      mealsNeeded: profile?.mealsNeeded || 0,
      totalMealsRescued: profile?.totalMealsRescued || 0,
      foodStatus: profile?.foodStatus || 'CAN_ACCEPT_FOOD',
    };

    // Map requests to recent format compatible with frontend list
    const recent = requests.slice(0, 5).map((r) => {
      const d = r.donationId || {};
      return {
        _id: r._id,
        requestId: r._id,
        donationId: d._id,
        foodName: d.foodName || 'Food Item',
        foodType: d.foodType || 'Vegetarian',
        quantity: r.allocatedQuantity,
        unit: d.unit || 'Meals',
        pickupDeadline: d.pickupDeadline,
        location: d.location || {},
        status: r.status,
        donorId: r.donorId,
        matchScore: r.matchScore,
        distanceKm: r.distanceKm,
        createdAt: r.createdAt,
      };
    });

    return res.status(200).json({
      success: true,
      stats,
      profile,
      recentDonations: recent,
      rescueRequests: requests,
    });
  } catch (err) {
    console.error('[Dashboard] getNgoDashboard error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
};

module.exports = { getDonorDashboard, getNgoDashboard };
