/* ============================================================
   FEEDNOW — Donation Routes
   ============================================================ */

const express = require('express');
const router = express.Router();
const { protect, requireRole } = require('../middleware/auth');
const {
  createDonation,
  getMyDonations,
  getReceivedDonations,
  getDonationById,
  updateDonationStatus,
} = require('../controllers/donationController');

// Donor creates a donation
router.post('/', protect, requireRole('donor'), createDonation);

// Donor views own donations
router.get('/my', protect, requireRole('donor'), getMyDonations);

// NGO views incoming donations
router.get('/received', protect, requireRole('ngo'), getReceivedDonations);

// Any party can view a single donation (controller enforces ownership)
router.get('/:id', protect, getDonationById);

// NGO updates donation status
router.patch('/:id/status', protect, requireRole('ngo'), updateDonationStatus);

module.exports = router;
