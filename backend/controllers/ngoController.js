/* ============================================================
   FEEDNOW — NGO Controller
   ============================================================ */

const mongoose = require('mongoose');
const NgoProfile = require('../models/NgoProfile');
const User = require('../models/User');

// Simple Haversine distance formula (returns km)
const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/* ──────────────────────────────────────────────
   GET /api/ngos   — list all NGOs (any auth'd user)
   ────────────────────────────────────────────── */
const getAllNgos = async (req, res) => {
  try {
    const profiles = await NgoProfile.find({ isAcceptingDonations: true }).populate('userId', 'name email');
    return res.status(200).json({ success: true, count: profiles.length, ngos: profiles });
  } catch (err) {
    console.error('[NGO] getAllNgos error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/* ──────────────────────────────────────────────
   GET /api/ngos/nearby?latitude=&longitude=&radius=
   ────────────────────────────────────────────── */
const getNearbyNgos = async (req, res) => {
  try {
    const { latitude, longitude, radius = 20 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ success: false, message: 'latitude and longitude are required' });
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    const rad = parseFloat(radius);

    const profiles = await NgoProfile.find({ isAcceptingDonations: true }).populate('userId', 'name email');

    const nearby = profiles
      .map((p) => {
        const distance = haversineDistance(lat, lon, p.latitude, p.longitude);
        return { ...p.toObject(), distance: Math.round(distance * 10) / 10 };
      })
      .filter((p) => p.distance <= rad)
      .sort((a, b) => a.distance - b.distance);

    return res.status(200).json({ success: true, count: nearby.length, ngos: nearby });
  } catch (err) {
    console.error('[NGO] getNearbyNgos error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/* ──────────────────────────────────────────────
   GET /api/ngos/profile   — own NGO profile (NGO only)
   ────────────────────────────────────────────── */
const getMyProfile = async (req, res) => {
  try {
    const profile = await NgoProfile.findOne({ userId: req.user._id }).populate('userId', 'name email');
    if (!profile) {
      return res.status(404).json({ success: false, message: 'NGO profile not found' });
    }
    return res.status(200).json({ success: true, profile });
  } catch (err) {
    console.error('[NGO] getMyProfile error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/* ──────────────────────────────────────────────
   PUT /api/ngos/profile   — update own NGO profile
   ────────────────────────────────────────────── */
const updateMyProfile = async (req, res) => {
  try {
    const allowed = [
      'organizationName', 'description', 'phone', 'address',
      'city', 'latitude', 'longitude', 'foodTypes', 'requirements',
      'pickupAvailable', 'isAcceptingDonations',
    ];
    const updates = {};
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    });

    const profile = await NgoProfile.findOneAndUpdate(
      { userId: req.user._id },
      updates,
      { new: true, upsert: true, runValidators: true }
    );

    return res.status(200).json({ success: true, message: 'Profile updated', profile });
  } catch (err) {
    console.error('[NGO] updateMyProfile error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/* ──────────────────────────────────────────────
   GET /api/ngos/:id   — public NGO profile
   ────────────────────────────────────────────── */
const getNgoById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid NGO ID' });
    }
    // id could be userId or NgoProfile _id — try both
    let profile = await NgoProfile.findById(req.params.id).populate('userId', 'name email');
    if (!profile) {
      profile = await NgoProfile.findOne({ userId: req.params.id }).populate('userId', 'name email');
    }
    if (!profile) {
      return res.status(404).json({ success: false, message: 'NGO not found' });
    }
    return res.status(200).json({ success: true, profile });
  } catch (err) {
    console.error('[NGO] getNgoById error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getAllNgos, getNearbyNgos, getMyProfile, updateMyProfile, getNgoById };
