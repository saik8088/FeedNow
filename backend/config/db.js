/* ============================================================
   FEEDNOW — MongoDB Connection (Serverless-Safe)
   ============================================================ */

const mongoose = require('mongoose');

let cachedConnection = null;

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }
  if (cachedConnection) {
    return cachedConnection;
  }

  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/feednow';

  try {
    cachedConnection = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[DB] MongoDB connected: ${cachedConnection.connection.host}`);
    return cachedConnection;
  } catch (error) {
    console.error(`[DB] Connection error: ${error.message}`);
    // Never call process.exit(1) in a serverless environment (causes FUNCTION_INVOCATION_FAILED)
  }
};

module.exports = connectDB;
