/* ============================================================
   FEEDNOW — Dashboard Controller
   ============================================================ */

const Donation = require('../models/Donation');

/* ──────────────────────────────────────────────
   GET /api/dashboard/donor
   ────────────────────────────────────────────── */
const getDonorDashboard = async (req, res) => {
  try {
    const uid = req.user._id;
    const NgoProfile = require('../models/NgoProfile');

    const donations = await Donation.find({ donorId: uid }).sort({ createdAt: -1 });

    const stats = {
      total: donations.length,
      pending: donations.filter((d) => d.status === 'PENDING').length,
      accepted: donations.filter((d) => d.status === 'ACCEPTED').length,
      coordinated: donations.filter((d) => d.status === 'COORDINATED').length,
      completed: donations.filter((d) => d.status === 'COMPLETED').length,
      declined: donations.filter((d) => d.status === 'DECLINED').length,
    };

    // Enrich recent 5 donations with NGO name
    const recent = await Promise.all(
      donations.slice(0, 5).map(async (d) => {
        const profile = await NgoProfile.findOne({ userId: d.ngoId }).select('organizationName');
        return {
          ...d.toObject(),
          ngoName: profile ? profile.organizationName : 'NGO',
        };
      })
    );

    return res.status(200).json({ success: true, stats, recentDonations: recent });
  } catch (err) {
    console.error('[Dashboard] getDonorDashboard error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/* ──────────────────────────────────────────────
   GET /api/dashboard/ngo
   ────────────────────────────────────────────── */
const getNgoDashboard = async (req, res) => {
  try {
    const uid = req.user._id;

    const donations = await Donation.find({ ngoId: uid })
      .sort({ createdAt: -1 })
      .populate('donorId', 'name email');

    const stats = {
      total: donations.length,
      pending: donations.filter((d) => d.status === 'PENDING').length,
      accepted: donations.filter((d) => d.status === 'ACCEPTED').length,
      coordinated: donations.filter((d) => d.status === 'COORDINATED').length,
      completed: donations.filter((d) => d.status === 'COMPLETED').length,
      declined: donations.filter((d) => d.status === 'DECLINED').length,
    };

    const recent = donations.slice(0, 5);

    return res.status(200).json({ success: true, stats, recentDonations: recent });
  } catch (err) {
    console.error('[Dashboard] getNgoDashboard error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getDonorDashboard, getNgoDashboard };
