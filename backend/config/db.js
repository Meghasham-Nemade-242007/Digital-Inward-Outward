const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const connUri = process.env.MONGODB_URI;
    
    // Check if the placeholder Atlas URI is still there or if MONGODB_URI is empty
    if (!connUri || connUri.includes('cluster.mongodb.net') && connUri.includes('user:password')) {
      console.warn('\n⚠️  WARNING: MONGODB_URI in backend/.env is using the default placeholder or is empty.');
      console.warn('⚠️  Please configure a valid MongoDB Atlas connection string in backend/.env to connect to your database.\n');
      
      // We will attempt to connect to a local fallback database for testing or local usage
      const fallbackUri = 'mongodb://127.0.0.1:27017/inward_outward';
      console.log(`Connecting to local MongoDB fallback: ${fallbackUri}`);
      await mongoose.connect(fallbackUri);
      console.log('✅ Connected to Local MongoDB Fallback Database successfully.');
      return;
    }

    const conn = await mongoose.connect(connUri);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
