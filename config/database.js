const mongoose = require('mongoose');

let isConnected = false;

async function connectDB() {
  if (isConnected) {
    return mongoose.connection;
  }

  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/pinboard';

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 4000
    });
    isConnected = true;
    console.log(`✅ MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn.connection;
  } catch (error) {
    console.warn(`⚠️ MongoDB connection warning (${error.message}). Running with fallback support.`);
    isConnected = false;
    return null;
  }
}

function getIsConnected() {
  return isConnected && mongoose.connection.readyState === 1;
}

module.exports = {
  connectDB,
  getIsConnected
};
