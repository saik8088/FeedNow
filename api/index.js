/* ============================================================
   FEEDNOW — Vercel Serverless Function Handler
   ============================================================ */

const app = require('../backend/server');
const connectDB = require('../backend/config/db');

module.exports = async (req, res) => {
  try {
    await connectDB();
  } catch (err) {
    console.error('[Vercel DB Error]', err.message);
  }

  // Ensure request URL starts with /api for Express router matching
  if (!req.url.startsWith('/api')) {
    req.url = '/api' + req.url;
  }

  return app(req, res);
};
