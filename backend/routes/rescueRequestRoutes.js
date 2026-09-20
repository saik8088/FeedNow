/* ============================================================
   FEEDNOW — RescueRequest Routes
   ============================================================ */

const express = require('express');
const router = express.Router();
const { protect, requireRole } = require('../middleware/auth');
const {
  getMyRescueRequests,
  getRescueRequestById,
  acceptRescueRequest,
  rejectRescueRequest,
  completeRescueRequest,
  getRequestsByDonation,
} = require('../controllers/rescueRequestController');

// All rescue request routes require authentication
router.use(protect);

// Get my rescue requests (NGO gets assigned, Donor gets their donations' requests)
router.get('/my', getMyRescueRequests);

// Get requests for a specific donation
router.get('/donation/:donationId', getRequestsByDonation);

// Get single rescue request
router.get('/:id', getRescueRequestById);

// NGO accepts rescue request
router.patch('/:id/accept', requireRole('ngo'), acceptRescueRequest);

// NGO rejects rescue request
router.patch('/:id/reject', requireRole('ngo'), rejectRescueRequest);

// Mark rescue request as completed
router.patch('/:id/complete', completeRescueRequest);

module.exports = router;
