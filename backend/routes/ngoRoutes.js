/* ============================================================
   FEEDNOW — NGO Routes
   ============================================================ */

const express = require('express');
const router = express.Router();
const { protect, requireRole } = require('../middleware/auth');
const {
  getAllNgos,
  getNearbyNgos,
  getMyProfile,
  updateMyProfile,
  getNgoById,
} = require('../controllers/ngoController');

// Public but auth required (donors browse NGOs)
router.get('/', protect, getAllNgos);
router.get('/nearby', protect, getNearbyNgos);

// NGO-only profile management (must be before /:id to avoid conflict)
router.get('/profile', protect, requireRole('ngo'), getMyProfile);
router.put('/profile', protect, requireRole('ngo'), updateMyProfile);

// Any authenticated user can view a specific NGO
router.get('/:id', protect, getNgoById);

module.exports = router;
