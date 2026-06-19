const express = require('express');
const router = express.Router();
const {
  createOutward,
  getOutwards,
  getOutwardById,
  updateOutward,
  updateOutwardStatus,
  deleteOutward
} = require('../controllers/outwardController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Protect all routes
router.use(protect);

router.route('/')
  .get(getOutwards)
  .post(upload.single('file'), createOutward);

router.route('/:id')
  .get(getOutwardById)
  .put(upload.single('file'), updateOutward)
  .delete(authorize('admin'), deleteOutward);

router.patch('/:id/status', updateOutwardStatus);

module.exports = router;
