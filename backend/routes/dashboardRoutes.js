/* ============================================================
   FEEDNOW — Dashboard Routes
   ============================================================ */

const express = require('express');
const router = express.Router();
const { protect, requireRole } = require('../middleware/auth');
const { getDonorDashboard, getNgoDashboard } = require('../controllers/dashboardController');

router.get('/donor', protect, requireRole('donor'), getDonorDashboard);
router.get('/ngo', protect, requireRole('ngo'), getNgoDashboard);

module.exports = router;
