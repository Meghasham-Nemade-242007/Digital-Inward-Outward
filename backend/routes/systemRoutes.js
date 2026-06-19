const express = require('express');
const router = express.Router();
const {
  getStats,
  getActivityLogs,
  backupDatabase,
  restoreDatabase
} = require('../controllers/systemController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Protect all routes
router.use(protect);

// Combined dashboard statistics (accessible to staff and admin)
router.get('/stats', getStats);

// Admin-only operations
router.get('/logs', authorize('admin'), getActivityLogs);
router.get('/backup', authorize('admin'), backupDatabase);
router.post('/restore', authorize('admin'), upload.backup.single('file'), restoreDatabase);

module.exports = router;
