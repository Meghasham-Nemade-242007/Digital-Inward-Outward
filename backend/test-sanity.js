console.log('🧪 Starting Backend Syntax & Dependency Integrity Verification...');

try {
  // 1. Check Core packages
  console.log('👉 Importing Core Express & Middleware...');
  const express = require('express');
  const cors = require('cors');
  const jwt = require('jsonwebtoken');
  const bcrypt = require('bcryptjs');
  const qrcode = require('qrcode');
  const multer = require('multer');
  
  // 2. Check Models
  console.log('👉 Loading Mongoose Models...');
  const User = require('./models/User');
  const Inward = require('./models/Inward');
  const Outward = require('./models/Outward');
  const ActivityLog = require('./models/ActivityLog');

  // 3. Check Controllers
  console.log('👉 Loading Controllers...');
  const authController = require('./controllers/authController');
  const inwardController = require('./controllers/inwardController');
  const outwardController = require('./controllers/outwardController');
  const userController = require('./controllers/userController');
  const systemController = require('./controllers/systemController');

  // 4. Check Routes
  console.log('👉 Loading Routes...');
  const authRoutes = require('./routes/authRoutes');
  const inwardRoutes = require('./routes/inwardRoutes');
  const outwardRoutes = require('./routes/outwardRoutes');
  const userRoutes = require('./routes/userRoutes');
  const systemRoutes = require('./routes/systemRoutes');

  console.log('\n✅ SANITY VERIFICATION PASSED: All models, controllers, and routes loaded successfully with no compilation errors!');
} catch (error) {
  console.error('\n❌ SANITY VERIFICATION FAILED: Compile or loading error encountered:');
  console.error(error.stack || error);
  process.exit(1);
}
