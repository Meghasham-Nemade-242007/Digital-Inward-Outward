const nodemailer = require('nodemailer');

/**
 * Send email using SMTP
 * @param {Object} options - Email options
 * @param {string} options.email - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 */
const sendEmail = async (options) => {
  // Validate SMTP configuration
  if (
    !process.env.EMAIL_HOST ||
    !process.env.EMAIL_PORT ||
    !process.env.EMAIL_USER ||
    !process.env.EMAIL_PASS
  ) {
    throw new Error('SMTP configuration missing: Please check EMAIL_HOST, EMAIL_PORT, EMAIL_USER, and EMAIL_PASS in your env.');
  }

  // Create transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT, 10),
    secure: parseInt(process.env.EMAIL_PORT, 10) === 465, // true for 465, false for other ports (like 587)
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    // For local testing with self-signed certificates or dev setups
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === 'production'
    }
  });

  // Format the sender (from) address robustly
  const senderEmail = process.env.EMAIL_USER;
  let senderName = 'Inward Outward System';
  if (process.env.EMAIL_FROM) {
    // Extract name if EMAIL_FROM is formatted like "Display Name" <email@addr.com>
    // or keep the simple display name string.
    const nameMatch = process.env.EMAIL_FROM.match(/^"?([^"<]+)"?\s*(<.*>)?$/);
    if (nameMatch && nameMatch[1]) {
      senderName = nameMatch[1].trim();
    }
  }

  // Mail details
  const mailOptions = {
    from: `"${senderName}" <${senderEmail}>`,
    to: options.email,
    subject: options.subject,
    html: options.html
  };

  // Send mail
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
