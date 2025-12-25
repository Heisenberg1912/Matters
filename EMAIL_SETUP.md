# Email Setup Guide

This guide will help you configure email sending for password reset and other notifications in Matters.

## Overview

The email service uses **Nodemailer** to send emails via SMTP. You can use any email provider (Gmail, Outlook, SendGrid, etc.).

## Quick Start

### 1. Configure Environment Variables

Copy the email configuration from `.env.example` to your `.env` file (or create a `.env` file in the `server` directory if you don't have one):

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=noreply@matters.com
EMAIL_FROM_NAME=Matters - Construction Management
FRONTEND_URL=http://localhost:5173
```

### 2. Choose Your Email Provider

## Option 1: Gmail (Recommended for Development)

### Step-by-step:

1. **Enable 2-Factor Authentication** on your Google account
2. **Generate an App Password**:
   - Go to: https://myaccount.google.com/security
   - Click "2-Step Verification"
   - Scroll down and click "App passwords"
   - Select "Mail" and "Other (Custom name)"
   - Enter "Matters App" as the name
   - Copy the 16-character password

3. **Update your `.env` file**:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your.email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
EMAIL_FROM=your.email@gmail.com
EMAIL_FROM_NAME=Matters
FRONTEND_URL=http://localhost:5173
```

## Option 2: Outlook/Office 365

```env
EMAIL_HOST=smtp.office365.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your.email@outlook.com
EMAIL_PASSWORD=your-password
EMAIL_FROM=your.email@outlook.com
EMAIL_FROM_NAME=Matters
FRONTEND_URL=http://localhost:5173
```

## Option 3: SendGrid (Recommended for Production)

1. Sign up at https://sendgrid.com (free tier: 100 emails/day)
2. Create an API Key in Settings > API Keys
3. Update `.env`:

```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=apikey
EMAIL_PASSWORD=your-sendgrid-api-key
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=Matters
FRONTEND_URL=https://yourdomain.com
```

## Option 4: AWS SES (Production)

```env
EMAIL_HOST=email-smtp.us-east-1.amazonaws.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-aws-smtp-username
EMAIL_PASSWORD=your-aws-smtp-password
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=Matters
FRONTEND_URL=https://yourdomain.com
```

## Option 5: Custom SMTP Server

```env
EMAIL_HOST=smtp.yourprovider.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-username
EMAIL_PASSWORD=your-password
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=Matters
FRONTEND_URL=https://yourdomain.com
```

## Configuration Variables Explained

| Variable | Description | Example |
|----------|-------------|---------|
| `EMAIL_HOST` | SMTP server hostname | `smtp.gmail.com` |
| `EMAIL_PORT` | SMTP port (587 for TLS, 465 for SSL) | `587` |
| `EMAIL_SECURE` | Use SSL/TLS (true for port 465, false for 587) | `false` |
| `EMAIL_USER` | SMTP username (usually your email) | `user@gmail.com` |
| `EMAIL_PASSWORD` | SMTP password or app password | `your-password` |
| `EMAIL_FROM` | Sender email address | `noreply@matters.com` |
| `EMAIL_FROM_NAME` | Sender name displayed to recipients | `Matters` |
| `FRONTEND_URL` | Your frontend URL (for reset links) | `http://localhost:5173` |

## Testing the Email Service

### 1. Start your server
```bash
cd server
npm run dev
```

### 2. Request a password reset
- Go to http://localhost:5173/forgot-password
- Enter a test email (e.g., `customer@matters.com`)
- Click "Send Reset Link"

### 3. Check the server console

You should see output like:
```
==============================================
PASSWORD RESET REQUEST
==============================================
User: John Customer (customer@matters.com)
Reset Link: http://localhost:5173/reset-password?token=abc123...
Email sent: Yes
Token expires in 1 hour
==============================================
```

### 4. Check your email inbox

If configured correctly, you should receive a professional password reset email.

## Troubleshooting

### Email not being sent?

**Check the console output:**
- If you see `Email sent: No (check email configuration)`, the email service is not configured
- Check that all environment variables are set correctly
- Restart your server after updating `.env`

**Common issues:**

1. **Gmail "Less secure app access" error**
   - Solution: Use App Passwords (see Gmail setup above)
   - Don't use your regular Gmail password

2. **Authentication failed**
   - Verify EMAIL_USER and EMAIL_PASSWORD are correct
   - Make sure there are no extra spaces in `.env` file

3. **Connection timeout**
   - Check EMAIL_HOST and EMAIL_PORT
   - Verify your firewall isn't blocking port 587/465
   - Try using port 465 with EMAIL_SECURE=true

4. **Email lands in spam**
   - For production, use a proper domain email
   - Configure SPF, DKIM, and DMARC records
   - Use a dedicated email service like SendGrid or AWS SES

## Development Mode (No Email Configuration)

If you don't configure email settings, the app will still work:
- Password reset links will be logged to the console only
- You can copy the link from the console and paste it in your browser
- Perfect for development/testing without email setup

## Production Recommendations

For production deployments:

1. **Use a dedicated email service** (SendGrid, AWS SES, Mailgun)
2. **Use your own domain** for EMAIL_FROM (e.g., `noreply@yourdomain.com`)
3. **Set up DNS records** (SPF, DKIM, DMARC) to prevent spam filtering
4. **Use environment variables** - never commit credentials to git
5. **Enable FRONTEND_URL** with your production domain
6. **Monitor email delivery** - most services provide dashboards

## Email Templates

The system includes a professional HTML email template for password reset. To customize:

Edit the template in [server/src/services/emailService.js](server/src/services/emailService.js)

## Adding More Email Types

To send other types of emails (welcome, notifications, etc.), use the email service:

```javascript
import { sendEmail, sendWelcomeEmail } from '../services/emailService.js';

// Send custom email
await sendEmail({
  to: 'user@example.com',
  subject: 'Your Subject',
  html: '<h1>Hello</h1><p>Email content</p>',
  text: 'Hello, Email content'
});

// Send welcome email
await sendWelcomeEmail('user@example.com', 'User Name');
```

## Support

If you encounter issues:
1. Check the server console for error messages
2. Verify all environment variables are set
3. Test with a simple Gmail account first
4. Check the email service documentation for your provider

---

**Note:** Always keep your email credentials secure and never commit them to version control!
