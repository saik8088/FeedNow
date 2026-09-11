/* ============================================================
   FEEDNOW — Notification Controller
   ============================================================ */

const mongoose = require('mongoose');
const Notification = require('../models/Notification');

/* ──────────────────────────────────────────────
   GET /api/notifications  — get my notifications
   ────────────────────────────────────────────── */
const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 });
    const unreadCount = notifications.filter((n) => !n.read).length;
    return res.status(200).json({ success: true, count: notifications.length, unreadCount, notifications });
  } catch (err) {
    console.error('[Notifications] getMyNotifications error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/* ──────────────────────────────────────────────
   PATCH /api/notifications/:id/read
   ────────────────────────────────────────────── */
const markOneRead = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid notification ID' });
    }

    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { read: true },
      { new: true }
    );

    if (!notif) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    return res.status(200).json({ success: true, notification: notif });
  } catch (err) {
    console.error('[Notifications] markOneRead error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/* ──────────────────────────────────────────────
   PATCH /api/notifications/read-all
   ────────────────────────────────────────────── */
const markAllRead = async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user._id, read: false }, { read: true });
    return res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    console.error('[Notifications] markAllRead error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getMyNotifications, markOneRead, markAllRead };
