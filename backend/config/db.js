const mongoose = require('mongoose');

const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('MONGODB_URI is not set in environment variables.');
    process.exit(1);
  }

  console.log('URI being used:', uri.replace(/:[^:@]+@/, ':****@'));

  try {
    await mongoose.connect(uri);
    console.log(`MongoDB connected: ${mongoose.connection.host}`);
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  }

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected.');
  });
};

module.exports = connectDB;