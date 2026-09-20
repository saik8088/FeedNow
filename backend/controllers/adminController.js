/* ============================================================
   FEEDNOW — Admin Controller
   Platform statistics, user management, and system overview
   ============================================================ */

const User = require('../models/User');
const Donation = require('../models/Donation');
const RescueRequest = require('../models/RescueRequest');
const NgoProfile = require('../models/NgoProfile');

/* ──────────────────────────────────────────────
   GET /api/admin/stats
   ────────────────────────────────────────────── */
const getStats = async (req, res) => {
  try {
    const [
      totalUsers, totalDonors, totalNgos,
      totalDonations, activeDonations, rescuedDonations,
      totalRescueRequests, completedRescueRequests,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'donor' }),
      User.countDocuments({ role: 'ngo' }),
      Donation.countDocuments(),
      Donation.countDocuments({ status: { $in: ['AVAILABLE', 'MATCHING', 'PARTIALLY_ACCEPTED', 'READY_FOR_PICKUP'] } }),
      Donation.countDocuments({ status: 'RESCUED' }),
      RescueRequest.countDocuments(),
      RescueRequest.countDocuments({ status: 'COMPLETED' }),
    ]);

    const mealAgg = await Donation.aggregate([
      { $match: { status: { $in: ['RESCUED', 'PICKED_UP', 'FULLY_ACCEPTED'] } } },
      { $group: { _id: null, totalMeals: { $sum: '$quantity' } } },
    ]);
    const totalMealsSaved = mealAgg[0]?.totalMeals || 0;

    return res.status(200).json({
      success: true,
      stats: {
        totalUsers, totalDonors, totalNgos,
        totalDonations, activeDonations, rescuedDonations,
        totalRescueRequests, completedRescueRequests, totalMealsSaved,
      },
    });
  } catch (err) {
    console.error('[Admin] getStats error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/* ──────────────────────────────────────────────
   GET /api/admin/verification-requests
   Returns all donors & NGOs with verification status
   ────────────────────────────────────────────── */
const getVerificationRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { role: { $in: ['donor', 'ngo'] } };
    if (status) filter.verificationStatus = status;

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();

    const enriched = await Promise.all(
      users.map(async (u) => {
        if (u.role === 'ngo') {
          const profile = await NgoProfile.findOne({ userId: u._id }).lean();
          return { ...u, ngoProfile: profile };
        }
        return u;
      })
    );

    return res.status(200).json({ success: true, count: enriched.length, users: enriched });
  } catch (err) {
    console.error('[Admin] getVerificationRequests error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/* ──────────────────────────────────────────────
   GET /api/admin/users
   ────────────────────────────────────────────── */
const getUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const filter = {};
    if (role) filter.role = role;

    const users = await User.find(filter).select('-password').sort({ createdAt: -1 }).lean();

    const enriched = await Promise.all(
      users.map(async (u) => {
        if (u.role === 'ngo') {
          const profile = await NgoProfile.findOne({ userId: u._id }).lean();
          return { ...u, ngoProfile: profile };
        }
        return u;
      })
    );

    return res.status(200).json({ success: true, count: enriched.length, users: enriched });
  } catch (err) {
    console.error('[Admin] getUsers error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/* ──────────────────────────────────────────────
   PATCH /api/admin/users/:id/verify
   Approve a Donor or NGO registration
   ────────────────────────────────────────────── */
const verifyUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const approve = req.body.isVerified !== false; // default true unless explicitly false
    user.isVerified = approve;
    user.verificationStatus = approve ? 'verified' : 'pending';
    user.rejectionReason = null;
    await user.save();

    if (user.role === 'ngo') {
      await NgoProfile.updateOne({ userId: user._id }, { isVerified: approve });
    }

    return res.status(200).json({
      success: true,
      message: approve ? `${user.name} has been approved` : `${user.name} reset to pending`,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role, isVerified: user.isVerified, verificationStatus: user.verificationStatus },
    });
  } catch (err) {
    console.error('[Admin] verifyUser error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/* ──────────────────────────────────────────────
   PATCH /api/admin/users/:id/reject
   Reject a Donor or NGO with a reason
   ────────────────────────────────────────────── */
const rejectUser = async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ success: false, message: 'Rejection reason is required' });

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.isVerified = false;
    user.verificationStatus = 'rejected';
    user.rejectionReason = reason;
    await user.save();

    if (user.role === 'ngo') {
      await NgoProfile.updateOne({ userId: user._id }, { isVerified: false });
    }

    return res.status(200).json({
      success: true,
      message: `${user.name} has been rejected`,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role, isVerified: false, verificationStatus: 'rejected', rejectionReason: reason },
    });
  } catch (err) {
    console.error('[Admin] rejectUser error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/* ──────────────────────────────────────────────
   GET /api/admin/donations
   ────────────────────────────────────────────── */
const getDonations = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const donations = await Donation.find(filter)
      .populate('donorId', 'name email phone')
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({ success: true, count: donations.length, donations });
  } catch (err) {
    console.error('[Admin] getDonations error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/* ──────────────────────────────────────────────
   GET /api/admin/rescue-requests
   ────────────────────────────────────────────── */
const getRescueRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const requests = await RescueRequest.find(filter)
      .populate('donationId')
      .populate('donorId', 'name email')
      .populate('ngoId', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({ success: true, count: requests.length, rescueRequests: requests });
  } catch (err) {
    console.error('[Admin] getRescueRequests error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getStats,
  getVerificationRequests,
  getUsers,
  verifyUser,
  rejectUser,
  getDonations,
  getRescueRequests,
};
