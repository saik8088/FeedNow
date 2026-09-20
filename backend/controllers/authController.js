/* ============================================================
   FEEDNOW — Auth Controller
   ============================================================ */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const NgoProfile = require('../models/NgoProfile');

// Generate JWT
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// Helper: safe user object (no password)
const safeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.phone,
  createdAt: user.createdAt,
});

/* ──────────────────────────────────────────────
   POST /api/auth/signup
   ────────────────────────────────────────────── */
const signup = async (req, res) => {
  try {
    const { name, email, password, role, phone, organizationName } = req.body;

    // Validate required fields
    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Name, email, password and role are required' });
    }
    if (!['donor', 'ngo', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Role must be donor, ngo, or admin' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    // Prevent duplicate email
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // Create user (password hashed via pre-save hook)
    const user = await User.create({ name, email, password, role, phone });

    // If NGO, create an initial profile record
    if (role === 'ngo') {
      await NgoProfile.create({
        userId: user._id,
        organizationName: organizationName || name,
        phone: phone || '',
      });
    }

    const token = generateToken(user._id, user.role);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: safeUser(user),
    });
  } catch (err) {
    console.error('[Auth] Signup error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error during signup' });
  }
};

/* ──────────────────────────────────────────────
   POST /api/auth/login
   ────────────────────────────────────────────── */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    // Find user with password field
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = generateToken(user._id, user.role);

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: safeUser(user),
    });
  } catch (err) {
    console.error('[Auth] Login error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

/* ──────────────────────────────────────────────
   GET /api/auth/me  (protected)
   ────────────────────────────────────────────── */
const getMe = async (req, res) => {
  try {
    return res.status(200).json({ success: true, user: safeUser(req.user) });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { signup, login, getMe };
