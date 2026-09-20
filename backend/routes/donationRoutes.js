/* ============================================================
   FEEDNOW — Donation Routes (Fixed)
   ============================================================ */

const express = require('express');
const router = express.Router();
const { protect, requireRole } = require('../middleware/auth');
const {
  createDonation,
  matchDonation,
  getMyDonations,
  getReceivedDonations,
  getDonationById,
  updateDonation,
  updateDonationStatus,
  getAllDonations,
} = require('../controllers/donationController');

// Donor creates a donation
router.post('/', protect, requireRole('donor'), createDonation);

// Donor triggers matching algorithm
router.post('/:id/match', protect, requireRole('donor'), matchDonation);

// Donor views own donations
router.get('/my', protect, requireRole('donor'), getMyDonations);

// NGO views incoming allocations/donations
router.get('/received', protect, requireRole('ngo'), getReceivedDonations);

// Admin / public view all donations
router.get('/', protect, getAllDonations);

// Get single donation by ID
router.get('/:id', protect, getDonationById);

// Donor updates donation
router.patch('/:id', protect, requireRole('donor'), updateDonation);

// NGO updates donation/rescue request status
router.patch('/:id/status', protect, requireRole('ngo'), updateDonationStatus);

module.exports = router;
