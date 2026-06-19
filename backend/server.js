const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables (forced restart to load updated SMTP variables)
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Enable CORS
// Since the frontend is in React (Vite defaults to port 5173), we allow all or specific localhost ports.
app.use(cors({
  origin: '*', // For demo portability, or configure specifically e.g. http://localhost:5173
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve file uploads as static directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount routers
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/inward', require('./routes/inwardRoutes'));
app.use('/api/outward', require('./routes/outwardRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/system', require('./routes/systemRoutes'));

// Root path fallback
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the Digital Inward-Outward Management System API',
    version: '1.0.0',
    status: 'Running'
  });
});

// Centralized error handler middleware
app.use((err, req, res, next) => {
  console.error('💥 Server Error Triggered:', err);

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`❌ Unhandled Rejection Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
