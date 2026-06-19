const User = require('../models/User');
const Inward = require('../models/Inward');
const Outward = require('../models/Outward');
const ActivityLog = require('../models/ActivityLog');
const fs = require('fs');
const path = require('path');

// Helper to get client IP
const getIp = (req) => {
  return req.ip || req.connection.remoteAddress || '127.0.0.1';
};

// @desc    Get dashboard metrics & statistical trends
// @route   GET /api/system/stats
// @access  Private
exports.getStats = async (req, res) => {
  try {
    // 1. Core Card Metrics
    const totalInward = await Inward.countDocuments({});
    const totalOutward = await Outward.countDocuments({});
    
    // Pending Documents
    const pendingInward = await Inward.countDocuments({ status: { $nin: ['Completed', 'Rejected'] } });
    const pendingOutward = await Outward.countDocuments({ status: { $nin: ['Delivered', 'Returned'] } });
    const totalPending = pendingInward + pendingOutward;

    // Completed Documents
    const completedInward = await Inward.countDocuments({ status: 'Completed' });
    const completedOutward = await Outward.countDocuments({ status: 'Delivered' });
    const totalCompleted = completedInward + completedOutward;

    // Today's Activity Count
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const todayInward = await Inward.countDocuments({ createdAt: { $gte: startOfToday, $lte: endOfToday } });
    const todayOutward = await Outward.countDocuments({ createdAt: { $gte: startOfToday, $lte: endOfToday } });
    const todayActivities = todayInward + todayOutward;

    // 2. Recent Entries (last 5 of each)
    const recentInwards = await Inward.find({}).sort({ createdAt: -1 }).limit(5).populate('assignedStaff', 'name');
    const recentOutwards = await Outward.find({}).sort({ createdAt: -1 }).limit(5);

    // 3. Monthly statistics (Last 6 Months)
    const monthlyStats = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const year = date.getFullYear();
      const month = date.getMonth();

      const startOfMonth = new Date(year, month, 1);
      const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);

      const inwardCount = await Inward.countDocuments({ createdAt: { $gte: startOfMonth, $lte: endOfMonth } });
      const outwardCount = await Outward.countDocuments({ createdAt: { $gte: startOfMonth, $lte: endOfMonth } });

      const monthName = date.toLocaleString('default', { month: 'short' });
      monthlyStats.push({
        month: `${monthName} ${year}`,
        inward: inwardCount,
        outward: outwardCount
      });
    }

    // 4. Department Distribution (Inward + Outward combined)
    const inwardDeptStats = await Inward.aggregate([
      { $group: { _id: '$department', count: { $sum: 1 } } }
    ]);
    const outwardDeptStats = await Outward.aggregate([
      { $group: { _id: '$department', count: { $sum: 1 } } }
    ]);

    const deptCounts = {};
    inwardDeptStats.forEach(item => {
      if (item._id) deptCounts[item._id] = (deptCounts[item._id] || 0) + item.count;
    });
    outwardDeptStats.forEach(item => {
      if (item._id) deptCounts[item._id] = (deptCounts[item._id] || 0) + item.count;
    });

    const departmentStats = Object.keys(deptCounts).map(dept => ({
      department: dept,
      count: deptCounts[dept]
    })).sort((a, b) => b.count - a.count);

    res.status(200).json({
      success: true,
      data: {
        cards: {
          totalInward,
          totalOutward,
          totalPending,
          totalCompleted,
          todayActivities
        },
        recent: {
          inwards: recentInwards,
          outwards: recentOutwards
        },
        monthlyStats,
        departmentStats
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get activity logs
// @route   GET /api/system/logs
// @access  Private (Admin only)
exports.getActivityLogs = async (req, res) => {
  try {
    const { search, action, page = 1, limit = 20 } = req.query;
    const query = {};

    if (action) {
      query.action = action;
    }

    if (search) {
      query.$or = [
        { userName: { $regex: search, $options: 'i' } },
        { userEmail: { $regex: search, $options: 'i' } },
        { details: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const count = await ActivityLog.countDocuments(query);
    const logs = await ActivityLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count,
      pages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      data: logs
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Backup all collections as a JSON download
// @route   GET /api/system/backup
// @access  Private (Admin only)
exports.backupDatabase = async (req, res) => {
  try {
    const users = await User.find({}).select('+password');
    const inwards = await Inward.find({});
    const outwards = await Outward.find({});
    const logs = await ActivityLog.find({});

    const backupData = {
      version: '1.0.0',
      timestamp: new Date(),
      backupBy: req.user.email,
      collections: {
        users,
        inwards,
        outwards,
        logs
      }
    };

    // Log Activity
    await ActivityLog.create({
      user: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      action: 'DATABASE_BACKUP',
      details: `Generated database backup file`,
      ipAddress: getIp(req)
    });

    // Set headers for file download
    const filename = `backup-inward-outward-${Date.now()}.json`;
    res.setHeader('Content-disposition', `attachment; filename=${filename}`);
    res.setHeader('Content-type', 'application/json');
    res.write(JSON.stringify(backupData, null, 2));
    res.end();
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Restore database from an uploaded JSON backup file
// @route   POST /api/system/restore
// @access  Private (Admin only)
exports.restoreDatabase = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a JSON backup file' });
    }

    const filePath = req.file.path;
    const fileData = fs.readFileSync(filePath, 'utf8');
    let backup;

    try {
      backup = JSON.parse(fileData);
    } catch (e) {
      fs.unlinkSync(filePath); // delete temp file
      return res.status(400).json({ success: false, message: 'Invalid JSON file structure' });
    }

    // Verify structural keys
    if (!backup.collections || !backup.collections.users || !backup.collections.inwards || !backup.collections.outwards) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ success: false, message: 'Invalid backup format. Missing core collections.' });
    }

    // 1. Restore Users
    if (backup.collections.users.length > 0) {
      await User.deleteMany({});
      await User.insertMany(backup.collections.users);
    }

    // 2. Restore Inward records
    await Inward.deleteMany({});
    if (backup.collections.inwards.length > 0) {
      await Inward.insertMany(backup.collections.inwards);
    }

    // 3. Restore Outward records
    await Outward.deleteMany({});
    if (backup.collections.outwards.length > 0) {
      await Outward.insertMany(backup.collections.outwards);
    }

    // 4. Restore Logs
    await ActivityLog.deleteMany({});
    if (backup.collections.logs && backup.collections.logs.length > 0) {
      await ActivityLog.insertMany(backup.collections.logs);
    }

    // Delete temp uploaded file
    fs.unlinkSync(filePath);

    // Log Activity
    await ActivityLog.create({
      user: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      action: 'DATABASE_RESTORE',
      details: `Restored database collections successfully`,
      ipAddress: getIp(req)
    });

    res.status(200).json({
      success: true,
      message: 'Database restored successfully! All collections reloaded.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
