const mongoose = require('mongoose');

const HistorySchema = new mongoose.Schema({
  status: {
    type: String,
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedByName: {
    type: String,
    required: true
  },
  remarks: {
    type: String
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const InwardSchema = new mongoose.Schema({
  inwardId: {
    type: String,
    required: true,
    unique: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  senderName: {
    type: String,
    required: [true, 'Please add sender name'],
    trim: true
  },
  organization: {
    type: String,
    required: [true, 'Please add sender organization'],
    trim: true
  },
  subject: {
    type: String,
    required: [true, 'Please add subject'],
    trim: true
  },
  department: {
    type: String,
    required: [true, 'Please add target department'],
    trim: true
  },
  documentType: {
    type: String,
    enum: ['Letter', 'Invoice', 'Report', 'Parcel', 'Certificate', 'Agreement', 'Complaint', 'Other'],
    required: [true, 'Please select document type']
  },
  priority: {
    type: String,
    enum: ['High', 'Medium', 'Low'],
    required: [true, 'Please select priority level']
  },
  status: {
    type: String,
    enum: ['Pending', 'In Process', 'Approved', 'Completed', 'Rejected'],
    default: 'Pending'
  },
  assignedStaff: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  remarks: {
    type: String,
    trim: true
  },
  uploadedFile: {
    type: String,
    default: null
  },
  qrCode: {
    type: String, // Base64 image string for easy frontend rendering
    default: ''
  },
  history: [HistorySchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Inward', InwardSchema);
