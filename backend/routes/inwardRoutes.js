const express = require('express');
const router = express.Router();
const {
  createInward,
  getInwards,
  getInwardById,
  updateInward,
  updateInwardStatus,
  deleteInward
} = require('../controllers/inwardController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Protect all routes below
router.use(protect);

router.route('/')
  .get(getInwards)
  .post(upload.single('file'), createInward);

router.route('/:id')
  .get(getInwardById)
  .put(upload.single('file'), updateInward)
  .delete(authorize('admin'), deleteInward);

router.patch('/:id/status', updateInwardStatus);

module.exports = router;
