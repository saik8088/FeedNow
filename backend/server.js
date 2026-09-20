/* ============================================================
   FEEDNOW — Express Server
   Node.js + Express + MongoDB + Mongoose
   ============================================================ */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

// ── Connect to MongoDB
connectDB();

// ── CORS — allow requests from the frontend (file:// and localhost)
app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'http://localhost:5500',
      'http://127.0.0.1:5500',
      'http://localhost:8080',
      'null', // file:// protocol
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// Accept all origins during development (comment out in production)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
    return res.status(200).json({});
  }
  next();
});

// ── Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'FeedNow API running' });
});

// ── Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/ngos', require('./routes/ngoRoutes'));
app.use('/api/donations', require('./routes/donationRoutes'));
app.use('/api/rescue-requests', require('./routes/rescueRequestRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));

// ── 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.url} not found` });
});

// ── Global error handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err.message);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// ── Start
const PORT = process.env.PORT || 5000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[Server] FeedNow API running on http://localhost:${PORT}`);
  });
}

module.exports = app;
