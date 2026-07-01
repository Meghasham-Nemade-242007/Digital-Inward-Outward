const Inward = require('../models/Inward');
const ActivityLog = require('../models/ActivityLog');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');

// Helper to get client IP
const getIp = (req) => {
  return req.ip || req.connection.remoteAddress || '127.0.0.1';
};

// Generate sequential Inward ID
const generateInwardId = async () => {
  const currentYear = new Date().getFullYear();
  const prefix = `IN-${currentYear}-`;
  
  // Find the latest inward record for this year
  const lastRecord = await Inward.findOne({
    inwardId: new RegExp(`^${prefix}`)
  }).sort({ createdAt: -1 });

  let sequenceNum = 1;
  if (lastRecord) {
    const lastId = lastRecord.inwardId;
    const parts = lastId.split('-');
    const lastNum = parseInt(parts[2], 10);
    if (!isNaN(lastNum)) {
      sequenceNum = lastNum + 1;
    }
  }

  // Format to 4 digits: e.g., 0001, 0012
  const formattedSeq = sequenceNum.toString().padStart(4, '0');
  return `${prefix}${formattedSeq}`;
};

// @desc    Create new Inward entry
// @route   POST /api/inward
// @access  Private
exports.createInward = async (req, res) => {
  try {
    const {
      senderName,
      organization,
      subject,
      department,
      documentType,
      priority,
      remarks,
      assignedStaff
    } = req.body;

    const inwardId = await generateInwardId();
    
    // File upload path
    let uploadedFile = null;
    if (req.file) {
      const uploadResult = await uploadToCloudinary(req.file.path, 'inwards');
      uploadedFile = uploadResult.secure_url;
      // Delete temporary local file only if successfully uploaded to Cloudinary
      if (!uploadResult.isFallback) {
        fs.unlinkSync(req.file.path);
      }
    }

    // Generate QR Code content
    const qrData = JSON.stringify({
      type: 'INWARD',
      id: inwardId,
      sender: senderName,
      org: organization,
      subject: subject,
      dept: department,
      status: 'Pending'
    });

    const qrCodeDataUrl = await QRCode.toDataURL(qrData);

    // Initial history log
    const initialHistory = [{
      status: 'Pending',
      updatedBy: req.user._id,
      updatedByName: req.user.name,
      remarks: 'Record created'
    }];

    const inward = await Inward.create({
      inwardId,
      senderName,
      organization,
      subject,
      department,
      documentType,
      priority,
      remarks,
      assignedStaff: assignedStaff || null,
      uploadedFile,
      qrCode: qrCodeDataUrl,
      history: initialHistory
    });

    // Log Activity
    await ActivityLog.create({
      user: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      action: 'CREATE_INWARD',
      details: `Created inward entry ${inwardId} from ${senderName} (${organization})`,
      ipAddress: getIp(req)
    });

    res.status(201).json({ success: true, data: inward });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all Inward entries with search/filter/pagination
// @route   GET /api/inward
// @access  Private
exports.getInwards = async (req, res) => {
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

    // Filter by Search (search ID, Sender, Org, Subject)
    if (search) {
      query.$or = [
        { inwardId: { $regex: search, $options: 'i' } },
        { senderName: { $regex: search, $options: 'i' } },
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
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) {
        // Set end date to end of that day (23:59:59)
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    // Pagination
    const skip = (page - 1) * limit;

    const count = await Inward.countDocuments(query);
    const records = await Inward.find(query)
      .populate('assignedStaff', 'name email department')
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

// @desc    Get single Inward entry by ID (Database ObjectId or inwardId)
// @route   GET /api/inward/:id
// @access  Private
exports.getInwardById = async (req, res) => {
  try {
    let query;
    if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      query = { _id: req.params.id };
    } else {
      query = { inwardId: req.params.id };
    }

    const inward = await Inward.findOne(query)
      .populate('assignedStaff', 'name email department')
      .populate('history.updatedBy', 'name email role');

    if (!inward) {
      return res.status(404).json({ success: false, message: 'Inward record not found' });
    }

    res.status(200).json({ success: true, data: inward });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update Inward entry
// @route   PUT /api/inward/:id
// @access  Private
exports.updateInward = async (req, res) => {
  try {
    const {
      senderName,
      organization,
      subject,
      department,
      documentType,
      priority,
      remarks,
      assignedStaff
    } = req.body;

    let inward = await Inward.findById(req.params.id);
    if (!inward) {
      return res.status(404).json({ success: false, message: 'Record not found' });
    }

    // Handle new file upload
    let uploadedFile = inward.uploadedFile;
    if (req.file) {
      // Remove old file if it exists
      if (inward.uploadedFile) {
        if (inward.uploadedFile.startsWith('http')) {
          await deleteFromCloudinary(inward.uploadedFile);
        } else {
          const oldPath = path.join(__dirname, '..', inward.uploadedFile);
          if (fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
          }
        }
      }
      const uploadResult = await uploadToCloudinary(req.file.path, 'inwards');
      uploadedFile = uploadResult.secure_url;
      // Delete temporary local file only if successfully uploaded to Cloudinary
      if (!uploadResult.isFallback) {
        fs.unlinkSync(req.file.path);
      }
    }

    // Regnerate QR with updated info (keeping the same inwardId)
    const qrData = JSON.stringify({
      type: 'INWARD',
      id: inward.inwardId,
      sender: senderName || inward.senderName,
      org: organization || inward.organization,
      subject: subject || inward.subject,
      dept: department || inward.department,
      status: inward.status
    });
    const qrCodeDataUrl = await QRCode.toDataURL(qrData);

    inward = await Inward.findByIdAndUpdate(
      req.params.id,
      {
        senderName,
        organization,
        subject,
        department,
        documentType,
        priority,
        remarks,
        assignedStaff: assignedStaff || null,
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
      action: 'UPDATE_INWARD',
      details: `Updated details of inward record ${inward.inwardId}`,
      ipAddress: getIp(req)
    });

    res.status(200).json({ success: true, data: inward });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update Inward Status & Tracking history
// @route   PATCH /api/inward/:id/status
// @access  Private
exports.updateInwardStatus = async (req, res) => {
  try {
    const { status, remarks } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Please provide status' });
    }

    const inward = await Inward.findById(req.params.id);
    if (!inward) {
      return res.status(404).json({ success: false, message: 'Record not found' });
    }

    // Append new tracking history log
    inward.status = status;
    inward.history.push({
      status,
      updatedBy: req.user._id,
      updatedByName: req.user.name,
      remarks: remarks || 'Status updated'
    });

    // Regenerate QR with updated status
    const qrData = JSON.stringify({
      type: 'INWARD',
      id: inward.inwardId,
      sender: inward.senderName,
      org: inward.organization,
      subject: inward.subject,
      dept: inward.department,
      status
    });
    inward.qrCode = await QRCode.toDataURL(qrData);

    await inward.save();

    // Log Activity
    await ActivityLog.create({
      user: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      action: 'UPDATE_INWARD_STATUS',
      details: `Updated status of inward record ${inward.inwardId} to ${status}`,
      ipAddress: getIp(req)
    });

    res.status(200).json({ success: true, data: inward });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete Inward entry (Admin Only)
// @route   DELETE /api/inward/:id
// @access  Private (Admin Only)
exports.deleteInward = async (req, res) => {
  try {
    const inward = await Inward.findById(req.params.id);
    if (!inward) {
      return res.status(404).json({ success: false, message: 'Record not found' });
    }

    // Remove file from disk
    if (inward.uploadedFile) {
      if (inward.uploadedFile.startsWith('http')) {
        await deleteFromCloudinary(inward.uploadedFile);
      } else {
        const filePath = path.join(__dirname, '..', inward.uploadedFile);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    }

    await Inward.findByIdAndDelete(req.params.id);

    // Log Activity
    await ActivityLog.create({
      user: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      action: 'DELETE_INWARD',
      details: `Deleted inward record ${inward.inwardId}`,
      ipAddress: getIp(req)
    });

    res.status(200).json({ success: true, message: 'Record deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
