/* ============================================================
   FEEDNOW — Admin Routes
   ============================================================ */

const express = require('express');
const router = express.Router();
const { protect, requireRole } = require('../middleware/auth');
const {
  getStats,
  getUsers,
  verifyUser,
  getDonations,
  getRescueRequests,
} = require('../controllers/adminController');

// All admin routes require admin role
router.use(protect, requireRole('admin'));

router.get('/stats', getStats);
router.get('/users', getUsers);
router.patch('/users/:id/verify', verifyUser);
router.get('/donations', getDonations);
router.get('/rescue-requests', getRescueRequests);

module.exports = router;
