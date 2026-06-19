const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');

// Helper to sign JWT token
const getSignedJwtToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// Helper to get client IP
const getIp = (req) => {
  return req.ip || req.connection.remoteAddress || '127.0.0.1';
};

// @desc    Register a user (First user becomes Admin)
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, department } = req.body;

    // Check if this is the first user in the system. If not, block registration.
    const userCount = await User.countDocuments({});
    if (userCount > 0) {
      return res.status(403).json({
        success: false,
        message: 'Initial administrator account has already been set up. Registration is disabled. Please contact the administrator to request an account.'
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    const role = 'admin';

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      department,
      role
    });

    // Create token
    const token = getSignedJwtToken(user._id);

    // Log activity
    await ActivityLog.create({
      user: user._id,
      userName: user.name,
      userEmail: user.email,
      action: 'REGISTER',
      details: `Account registered as role: ${role}, department: ${department}`,
      ipAddress: getIp(req)
    });

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (user.status === 'inactive') {
      return res.status(403).json({ success: false, message: 'Your account is deactivated. Please contact admin.' });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Create token
    const token = getSignedJwtToken(user._id);

    // Log activity
    await ActivityLog.create({
      user: user._id,
      userName: user.name,
      userEmail: user.email,
      action: 'LOGIN',
      details: `User logged in successfully`,
      ipAddress: getIp(req)
    });

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Global map to hold verification codes in memory for the demo/simulated password reset
const resetCodes = new Map();

// @desc    Forgot password request
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: 'No user registered with this email' });
    }

    // Generate random 6 digit reset code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Save in memory for 10 minutes
    resetCodes.set(email, {
      code: resetCode,
      expires: Date.now() + 10 * 60 * 1000 // 10 minutes
    });

    // Log activity
    await ActivityLog.create({
      user: user._id,
      userName: user.name,
      userEmail: user.email,
      action: 'FORGOT_PASSWORD',
      details: `Password reset code requested`,
      ipAddress: getIp(req)
    });

    // Send actual email using sendEmail utility
    try {
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); line-height: 48px; color: white; font-size: 24px; font-weight: bold; text-align: center;">🔑</div>
            <h2 style="color: #0f172a; margin-top: 12px; font-size: 20px; font-weight: bold; font-family: sans-serif;">Password Reset Request</h2>
            <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Digital Inward-Outward Management System</p>
          </div>
          <div style="color: #334155; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
            <p>Hello ${user.name || 'User'},</p>
            <p>We received a request to reset the password for your account (<strong>${email}</strong>). Use the verification code below to complete your password reset:</p>
            <div style="text-align: center; margin: 28px 0;">
              <span style="display: inline-block; padding: 12px 28px; font-family: monospace; font-size: 32px; font-weight: bold; color: #3b82f6; background-color: #f1f5f9; border-radius: 8px; letter-spacing: 0.15em; border: 1px solid #e2e8f0;">${resetCode}</span>
            </div>
            <p>This code is valid for <strong>10 minutes</strong>. If you did not make this request, you can safely ignore this email.</p>
          </div>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-bottom: 20px;" />
          <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0;">This is an automated security email. Please do not reply directly to this message.</p>
        </div>
      `;

      await sendEmail({
        email: user.email,
        subject: 'Password Reset Verification Code - Inward Outward System',
        html: emailHtml
      });

      res.status(200).json({
        success: true,
        message: 'Password reset code has been sent to your email.'
      });
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      
      // Let user know if config is missing or if delivery itself failed
      const isConfigError = emailError.message && emailError.message.includes('SMTP configuration missing');
      return res.status(isConfigError ? 400 : 500).json({
        success: false,
        message: isConfigError 
          ? 'Email SMTP settings are not configured in the backend .env file. Please define EMAIL_HOST, EMAIL_PORT, EMAIL_USER, and EMAIL_PASS.'
          : `Failed to send email: ${emailError.message || 'Unknown error'}. Please verify your SMTP settings in the .env file.`
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide all details' });
    }

    const resetData = resetCodes.get(email);
    if (!resetData || resetData.code !== code || resetData.expires < Date.now()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification code' });
    }

    // Find user and update
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Change password (schema pre-save middleware will hash it)
    user.password = newPassword;
    await user.save();

    // Clean up code
    resetCodes.delete(email);

    // Log activity
    await ActivityLog.create({
      user: user._id,
      userName: user.name,
      userEmail: user.email,
      action: 'RESET_PASSWORD',
      details: `Password reset successfully using verification code`,
      ipAddress: getIp(req)
    });

    res.status(200).json({
      success: true,
      message: 'Password updated successfully. You can now login.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get currently logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        department: req.user.department
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
