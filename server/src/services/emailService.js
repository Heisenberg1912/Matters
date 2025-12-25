import nodemailer from 'nodemailer';

// Create reusable transporter (lazy-loaded)
let transporter = null;
let initializationAttempted = false;

// Get email configuration from environment variables (called at runtime, not module load)
const getEmailConfig = () => ({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS, // Support both EMAIL_PASSWORD and EMAIL_PASS
  },
});

const getFromEmail = () => process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@matters.com';
const getFromName = () => process.env.EMAIL_FROM_NAME || 'Matters - Construction Management';

const createTransporter = () => {
  if (initializationAttempted) {
    return transporter;
  }

  initializationAttempted = true;
  const EMAIL_CONFIG = getEmailConfig();

  console.log('Email config check:', {
    user: EMAIL_CONFIG.auth.user ? '✓ Found' : '✗ Missing',
    pass: EMAIL_CONFIG.auth.pass ? '✓ Found' : '✗ Missing',
    host: EMAIL_CONFIG.host,
    port: EMAIL_CONFIG.port
  });

  if (!EMAIL_CONFIG.auth.user || !EMAIL_CONFIG.auth.pass) {
    console.warn('⚠️  Email service not configured. Set EMAIL_USER and EMAIL_PASSWORD (or EMAIL_PASS) in .env');
    return null;
  }

  try {
    transporter = nodemailer.createTransport(EMAIL_CONFIG);
    console.log('✅ Email service initialized');
    return transporter;
  } catch (error) {
    console.error('❌ Failed to initialize email service:', error.message);
    return null;
  }
};

/**
 * Send email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @param {string} options.text - Plain text content (optional)
 * @returns {Promise<boolean>} - Success status
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  // Lazy-load transporter on first use
  if (!transporter && !initializationAttempted) {
    createTransporter();
  }

  if (!transporter) {
    console.log('📧 Email would be sent to:', to);
    console.log('   Subject:', subject);
    console.log('   (Email service not configured - check .env)');
    return false;
  }

  try {
    const info = await transporter.sendMail({
      from: `"${getFromName()}" <${getFromEmail()}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    });

    console.log('✅ Email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Failed to send email:', error.message);
    return false;
  }
};

/**
 * Send password reset email
 * @param {string} email - User email
 * @param {string} name - User name
 * @param {string} resetUrl - Password reset URL
 * @returns {Promise<boolean>} - Success status
 */
export const sendPasswordResetEmail = async (email, name, resetUrl) => {
  const subject = 'Reset Your Password - Matters';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
          background-color: #f4f4f4;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background: #ffffff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
          background: #010101;
          color: #ffffff;
          padding: 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 600;
        }
        .content {
          padding: 40px 30px;
        }
        .content h2 {
          color: #010101;
          font-size: 24px;
          margin-top: 0;
          margin-bottom: 20px;
        }
        .content p {
          margin: 16px 0;
          color: #555;
        }
        .button {
          display: inline-block;
          padding: 14px 32px;
          background: #cfe0ad;
          color: #000000;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          margin: 24px 0;
          text-align: center;
        }
        .button:hover {
          background: #bfd09d;
        }
        .info-box {
          background: #f8f9fa;
          border-left: 4px solid #cfe0ad;
          padding: 16px;
          margin: 24px 0;
          border-radius: 4px;
        }
        .info-box p {
          margin: 8px 0;
          font-size: 14px;
        }
        .footer {
          background: #f8f9fa;
          padding: 20px 30px;
          text-align: center;
          font-size: 14px;
          color: #777;
        }
        .footer p {
          margin: 8px 0;
        }
        .link {
          color: #cfe0ad;
          word-break: break-all;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Matters</h1>
          <p style="margin: 8px 0 0 0; opacity: 0.9;">Construction Management Platform</p>
        </div>

        <div class="content">
          <h2>Reset Your Password</h2>
          <p>Hi ${name},</p>
          <p>We received a request to reset your password for your Matters account. Click the button below to reset it:</p>

          <div style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </div>

          <div class="info-box">
            <p><strong>⏱️ This link will expire in 1 hour</strong></p>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p class="link">${resetUrl}</p>
          </div>

          <p><strong>Didn't request a password reset?</strong></p>
          <p>If you didn't request this, you can safely ignore this email. Your password will remain unchanged.</p>
        </div>

        <div class="footer">
          <p>This email was sent by Matters - Construction Management Platform</p>
          <p>For support, please contact us or visit our help center</p>
          <p style="margin-top: 16px; font-size: 12px; color: #999;">
            © ${new Date().getFullYear()} Matters. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Reset Your Password - Matters

Hi ${name},

We received a request to reset your password for your Matters account.

Reset your password by clicking this link:
${resetUrl}

This link will expire in 1 hour.

If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.

---
This email was sent by Matters - Construction Management Platform
© ${new Date().getFullYear()} Matters. All rights reserved.
  `;

  return sendEmail({
    to: email,
    subject,
    html,
    text,
  });
};

/**
 * Send welcome email
 * @param {string} email - User email
 * @param {string} name - User name
 * @returns {Promise<boolean>} - Success status
 */
export const sendWelcomeEmail = async (email, name) => {
  const subject = 'Welcome to Matters!';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #010101; color: #fff; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .button { display: inline-block; padding: 12px 24px; background: #cfe0ad; color: #000; text-decoration: none; border-radius: 4px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to Matters!</h1>
        </div>
        <div class="content">
          <p>Hi ${name},</p>
          <p>Thank you for joining Matters - your all-in-one construction management platform.</p>
          <p>Get started by creating your first project and explore all the features we offer.</p>
          <p>If you have any questions, feel free to reach out to our support team.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to: email, subject, html });
};

export default {
  sendEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
};
