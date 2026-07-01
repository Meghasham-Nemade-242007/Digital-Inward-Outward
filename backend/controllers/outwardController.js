const Outward = require('../models/Outward');
const ActivityLog = require('../models/ActivityLog');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');

// Helper to get client IP
const getIp = (req) => {
  return req.ip || req.connection.remoteAddress || '127.0.0.1';
};

// Generate sequential Outward ID
const generateOutwardId = async () => {
  const currentYear = new Date().getFullYear();
  const prefix = `OUT-${currentYear}-`;
  
  // Find the latest outward record for this year
  const lastRecord = await Outward.findOne({
    outwardId: new RegExp(`^${prefix}`)
  }).sort({ createdAt: -1 });

  let sequenceNum = 1;
  if (lastRecord) {
    const lastId = lastRecord.outwardId;
    const parts = lastId.split('-');
    const lastNum = parseInt(parts[2], 10);
    if (!isNaN(lastNum)) {
      sequenceNum = lastNum + 1;
    }
  }

  // Format to 4 digits: e.g., 0001
  const formattedSeq = sequenceNum.toString().padStart(4, '0');
  return `${prefix}${formattedSeq}`;
};

// @desc    Create new Outward entry
// @route   POST /api/outward
// @access  Private
exports.createOutward = async (req, res) => {
  try {
    const {
      receiverName,
      organization,
      address,
      courierService,
      trackingNumber,
      department,
      subject,
      documentType,
      priority,
      remarks
    } = req.body;

    const outwardId = await generateOutwardId();

    // File upload path
    let uploadedFile = null;
    if (req.file) {
      const uploadResult = await uploadToCloudinary(req.file.path, 'outwards');
      uploadedFile = uploadResult.secure_url;
      // Delete temporary local file only if successfully uploaded to Cloudinary
      if (!uploadResult.isFallback) {
        fs.unlinkSync(req.file.path);
      }
    }

    // Generate QR Code content
    const qrData = JSON.stringify({
      type: 'OUTWARD',
      id: outwardId,
      receiver: receiverName,
      org: organization,
      subject: subject,
      dept: department,
      status: 'Prepared'
    });

    const qrCodeDataUrl = await QRCode.toDataURL(qrData);

    // Initial history log
    const initialHistory = [{
      status: 'Prepared',
      updatedBy: req.user._id,
      updatedByName: req.user.name,
      remarks: 'Record prepared'
    }];

    const outward = await Outward.create({
      outwardId,
      receiverName,
      organization,
      address,
      courierService: courierService || '',
      trackingNumber: trackingNumber || '',
      department,
      subject,
      documentType,
      priority,
      remarks,
      uploadedFile,
      qrCode: qrCodeDataUrl,
      history: initialHistory
    });

    // Log Activity
    await ActivityLog.create({
      user: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      action: 'CREATE_OUTWARD',
      details: `Created outward entry ${outwardId} to ${receiverName} (${organization})`,
      ipAddress: getIp(req)
    });

    res.status(201).json({ success: true, data: outward });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all Outward entries with search/filter/pagination
// @route   GET /api/outward
// @access  Private
exports.getOutwards = async (req, res) => {
  try {
    const {
      search,
      department,
      documentType,
      priority,
      status,
      startDate,
      endDate,
      page = 1,
      limit = 10
    } = req.query;

    const query = {};

    // Filter by Search (search ID, Receiver, Org, Subject)
    if (search) {
      query.$or = [
        { outwardId: { $regex: search, $options: 'i' } },
        { receiverName: { $regex: search, $options: 'i' } },
        { organization: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } }
      ];
    }

    // Filters
    if (department) query.department = department;
    if (documentType) query.documentType = documentType;
    if (priority) query.priority = priority;
    if (status) query.status = status;

    // Date range filter
    if (startDate || endDate) {
      query.dispatchDate = {};
      if (startDate) query.dispatchDate.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.dispatchDate.$lte = end;
      }
    }

    // Pagination
    const skip = (page - 1) * limit;

    const count = await Outward.countDocuments(query);
    const records = await Outward.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count,
      pages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      data: records
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single Outward entry by ID
// @route   GET /api/outward/:id
// @access  Private
exports.getOutwardById = async (req, res) => {
  try {
    let query;
    if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      query = { _id: req.params.id };
    } else {
      query = { outwardId: req.params.id };
    }

    const outward = await Outward.findOne(query)
      .populate('history.updatedBy', 'name email role');

    if (!outward) {
      return res.status(404).json({ success: false, message: 'Outward record not found' });
    }

    res.status(200).json({ success: true, data: outward });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update Outward entry
// @route   PUT /api/outward/:id
// @access  Private
exports.updateOutward = async (req, res) => {
  try {
    const {
      receiverName,
      organization,
      address,
      courierService,
      trackingNumber,
      department,
      subject,
      documentType,
      priority,
      remarks
    } = req.body;

    let outward = await Outward.findById(req.params.id);
    if (!outward) {
      return res.status(404).json({ success: false, message: 'Record not found' });
    }

    // Handle new file upload
    let uploadedFile = outward.uploadedFile;
    if (req.file) {
      // Remove old file if it exists
      if (outward.uploadedFile) {
        if (outward.uploadedFile.startsWith('http')) {
          await deleteFromCloudinary(outward.uploadedFile);
        } else {
          const oldPath = path.join(__dirname, '..', outward.uploadedFile);
          if (fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
          }
        }
      }
      const uploadResult = await uploadToCloudinary(req.file.path, 'outwards');
      uploadedFile = uploadResult.secure_url;
      // Delete temporary local file only if successfully uploaded to Cloudinary
      if (!uploadResult.isFallback) {
        fs.unlinkSync(req.file.path);
      }
    }

    // Regnerate QR with updated info (keeping the same outwardId)
    const qrData = JSON.stringify({
      type: 'OUTWARD',
      id: outward.outwardId,
      receiver: receiverName || outward.receiverName,
      org: organization || outward.organization,
      subject: subject || outward.subject,
      dept: department || outward.department,
      status: outward.status
    });
    const qrCodeDataUrl = await QRCode.toDataURL(qrData);

    outward = await Outward.findByIdAndUpdate(
      req.params.id,
      {
        receiverName,
        organization,
        address,
        courierService,
        trackingNumber,
        department,
        subject,
        documentType,
        priority,
        remarks,
        uploadedFile,
        qrCode: qrCodeDataUrl
      },
      { new: true, runValidators: true }
    );

    // Log Activity
    await ActivityLog.create({
      user: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      action: 'UPDATE_OUTWARD',
      details: `Updated details of outward record ${outward.outwardId}`,
      ipAddress: getIp(req)
    });

    res.status(200).json({ success: true, data: outward });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update Outward Status & Tracking history
// @route   PATCH /api/outward/:id/status
// @access  Private
exports.updateOutwardStatus = async (req, res) => {
  try {
    const { status, remarks, courierService, trackingNumber } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Please provide status' });
    }

    const outward = await Outward.findById(req.params.id);
    if (!outward) {
      return res.status(404).json({ success: false, message: 'Record not found' });
    }

    // Append new tracking history log
    outward.status = status;
    if (courierService !== undefined) outward.courierService = courierService;
    if (trackingNumber !== undefined) outward.trackingNumber = trackingNumber;
    
    outward.history.push({
      status,
      updatedBy: req.user._id,
      updatedByName: req.user.name,
      remarks: remarks || 'Status updated'
    });

    // Regenerate QR with updated status
    const qrData = JSON.stringify({
      type: 'OUTWARD',
      id: outward.outwardId,
      receiver: outward.receiverName,
      org: outward.organization,
      subject: outward.subject,
      dept: outward.department,
      status
    });
    outward.qrCode = await QRCode.toDataURL(qrData);

    await outward.save();

    // Log Activity
    await ActivityLog.create({
      user: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      action: 'UPDATE_OUTWARD_STATUS',
      details: `Updated status of outward record ${outward.outwardId} to ${status}`,
      ipAddress: getIp(req)
    });

    res.status(200).json({ success: true, data: outward });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete Outward entry (Admin Only)
// @route   DELETE /api/outward/:id
// @access  Private (Admin Only)
exports.deleteOutward = async (req, res) => {
  try {
    const outward = await Outward.findById(req.params.id);
    if (!outward) {
      return res.status(404).json({ success: false, message: 'Record not found' });
    }

    // Remove file from disk
    if (outward.uploadedFile) {
      if (outward.uploadedFile.startsWith('http')) {
        await deleteFromCloudinary(outward.uploadedFile);
      } else {
        const filePath = path.join(__dirname, '..', outward.uploadedFile);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    }

    await Outward.findByIdAndDelete(req.params.id);

    // Log Activity
    await ActivityLog.create({
      user: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      action: 'DELETE_OUTWARD',
      details: `Deleted outward record ${outward.outwardId}`,
      ipAddress: getIp(req)
    });

    res.status(200).json({ success: true, message: 'Record deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
