/* ============================================================
   FEEDNOW — Notification Routes
   ============================================================ */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getMyNotifications,
  markOneRead,
  markAllRead,
} = require('../controllers/notificationController');

router.get('/', protect, getMyNotifications);
router.patch('/read-all', protect, markAllRead);
router.patch('/:id/read', protect, markOneRead);

module.exports = router;
