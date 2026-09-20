/* ============================================================
   FEEDNOW — Admin Routes
   ============================================================ */

const express = require('express');
const router = express.Router();
const { protect, requireRole } = require('../middleware/auth');
const {
  getStats,
  getVerificationRequests,
  getUsers,
  verifyUser,
  rejectUser,
  getDonations,
  getRescueRequests,
} = require('../controllers/adminController');

// All admin routes require admin role
router.use(protect, requireRole('admin'));

router.get('/stats', getStats);
router.get('/verification-requests', getVerificationRequests);
router.get('/users', getUsers);
router.patch('/users/:id/verify', verifyUser);
router.patch('/users/:id/reject', rejectUser);
router.get('/donations', getDonations);
router.get('/rescue-requests', getRescueRequests);

module.exports = router;
