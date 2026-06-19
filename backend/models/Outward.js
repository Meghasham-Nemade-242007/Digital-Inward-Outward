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

const OutwardSchema = new mongoose.Schema({
  outwardId: {
    type: String,
    required: true,
    unique: true
  },
  receiverName: {
    type: String,
    required: [true, 'Please add receiver name'],
    trim: true
  },
  organization: {
    type: String,
    required: [true, 'Please add receiver organization'],
    trim: true
  },
  address: {
    type: String,
    required: [true, 'Please add delivery address'],
    trim: true
  },
  dispatchDate: {
    type: Date,
    default: Date.now
  },
  courierService: {
    type: String,
    trim: true,
    default: ''
  },
  trackingNumber: {
    type: String,
    trim: true,
    default: ''
  },
  department: {
    type: String,
    required: [true, 'Please add dispatch department'],
    trim: true
  },
  subject: {
    type: String,
    required: [true, 'Please add subject'],
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
    enum: ['Prepared', 'Dispatched', 'Delivered', 'Returned'],
    default: 'Prepared'
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
    type: String,
    default: ''
  },
  history: [HistorySchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Outward', OutwardSchema);
