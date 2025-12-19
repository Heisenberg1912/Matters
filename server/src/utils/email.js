import nodemailer from 'nodemailer';

// Create transporter
let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  return transporter;
};

/**
 * Send email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text content
 * @param {string} options.html - HTML content
 * @param {Array} options.attachments - Email attachments
 */
export const sendEmail = async ({ to, subject, text, html, attachments }) => {
  try {
    // Check if email is configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('Email not configured - skipping email send');
      console.log('Would send email:', { to, subject });
      return { success: true, mock: true };
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || `"Matters" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
      attachments,
    };

    const info = await getTransporter().sendMail(mailOptions);
    console.log('Email sent:', info.messageId);

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error('Email send error:', error);
    throw error;
  }
};

/**
 * Send welcome email
 * @param {Object} user - User object
 */
export const sendWelcomeEmail = async (user) => {
  const clientUrl = process.env.CLIENT_BASE_URL || process.env.PUBLIC_CLIENT_URL;

  return sendEmail({
    to: user.email,
    subject: 'Welcome to Matters!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3B82F6; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background: #3B82F6; color: white; text-decoration: none; border-radius: 6px; }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Matters!</h1>
          </div>
          <div class="content">
            <p>Hi ${user.name},</p>
            <p>Thank you for joining Matters - your construction project management companion.</p>
            <p>With Matters, you can:</p>
            <ul>
              <li>Track your construction projects from ideation to handover</li>
              <li>Manage budgets and expenses</li>
              <li>Upload and organize site photos</li>
              <li>Get AI-powered insights and weather recommendations</li>
            </ul>
            <p>
              <a href="${clientUrl}" class="button">Get Started</a>
            </p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Matters. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  });
};

/**
 * Send project invitation email
 * @param {Object} options - Invitation options
 */
export const sendProjectInvitation = async ({ to, projectName, inviterName, role, inviteUrl }) => {
  return sendEmail({
    to,
    subject: `You've been invited to join ${projectName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3B82F6; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background: #3B82F6; color: white; text-decoration: none; border-radius: 6px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Project Invitation</h1>
          </div>
          <div class="content">
            <p>Hi,</p>
            <p><strong>${inviterName}</strong> has invited you to join the project <strong>${projectName}</strong> as a <strong>${role}</strong>.</p>
            <p>Click the button below to accept the invitation:</p>
            <p>
              <a href="${inviteUrl}" class="button">Accept Invitation</a>
            </p>
            <p>If you didn't expect this invitation, you can safely ignore this email.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  });
};

/**
 * Send bill notification email
 * @param {Object} options - Bill notification options
 */
export const sendBillNotification = async ({ to, billNumber, projectName, amount, dueDate }) => {
  return sendEmail({
    to,
    subject: `New Bill Added - ${billNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3B82F6; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .details { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Bill Added</h1>
          </div>
          <div class="content">
            <p>A new bill has been added to your project.</p>
            <div class="details">
              <p><strong>Bill Number:</strong> ${billNumber}</p>
              <p><strong>Project:</strong> ${projectName}</p>
              <p><strong>Amount:</strong> ₹${amount.toLocaleString()}</p>
              ${dueDate ? `<p><strong>Due Date:</strong> ${new Date(dueDate).toLocaleDateString()}</p>` : ''}
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
  });
};

/**
 * Send stage completion notification
 * @param {Object} options - Stage notification options
 */
export const sendStageCompletionNotification = async ({ to, stageName, projectName, completedBy }) => {
  return sendEmail({
    to,
    subject: `Stage Completed - ${stageName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #22C55E; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Stage Completed!</h1>
          </div>
          <div class="content">
            <p>Great news! The <strong>${stageName}</strong> stage has been marked as completed for project <strong>${projectName}</strong>.</p>
            ${completedBy ? `<p>Completed by: ${completedBy}</p>` : ''}
          </div>
        </div>
      </body>
      </html>
    `,
  });
};

export default {
  sendEmail,
  sendWelcomeEmail,
  sendProjectInvitation,
  sendBillNotification,
  sendStageCompletionNotification,
};
