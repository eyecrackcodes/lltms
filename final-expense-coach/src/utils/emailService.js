const nodemailer = require("nodemailer");

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
      tls: {
        rejectUnauthorized: true
      }
    });
  }

  async verifyConnection() {
    try {
      await this.transporter.verify();
      console.log('SMTP connection verified successfully');
      return true;
    } catch (error) {
      console.error('SMTP connection verification failed:', error);
      return false;
    }
  }

  async sendEmail(to, subject, html) {
    try {
      const mailOptions = {
        from: process.env.SMTP_FROM_EMAIL,
        to,
        subject,
        html,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error("Error sending email:", error);
      return { success: false, error: error.message };
    }
  }

  async sendPasswordResetEmail(to, resetToken) {
    const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            .container {
              padding: 20px;
              max-width: 600px;
              margin: 0 auto;
              font-family: Arial, sans-serif;
            }
            .button {
              background-color: #4CAF50;
              border: none;
              color: white;
              padding: 15px 32px;
              text-align: center;
              text-decoration: none;
              display: inline-block;
              font-size: 16px;
              margin: 4px 2px;
              cursor: pointer;
              border-radius: 4px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Password Reset Request</h1>
            <p>You requested a password reset for your Final Expense Coach account.</p>
            <p>Click the button below to reset your password:</p>
            <a href="${resetLink}" class="button">Reset Password</a>
            <p>If you didn't request this password reset, please ignore this email or contact support if you have concerns.</p>
            <p>This reset link will expire in 1 hour for security purposes.</p>
            <hr>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p>${resetLink}</p>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail(to, "Password Reset Request - Final Expense Coach", html);
  }

  async sendWelcomeEmail(to, name) {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            .container {
              padding: 20px;
              max-width: 600px;
              margin: 0 auto;
              font-family: Arial, sans-serif;
            }
            .highlight {
              color: #4CAF50;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Welcome to Final Expense Coach!</h1>
            <p>Hello ${name},</p>
            <p>Thank you for joining Final Expense Coach. We're excited to have you as part of our community!</p>
            <h2>Getting Started</h2>
            <ul>
              <li>Complete your profile setup</li>
              <li>Explore our training materials</li>
              <li>Connect with your team members</li>
              <li>Review our sales scripts and resources</li>
            </ul>
            <p>If you have any questions or need assistance, our support team is here to help.</p>
            <p>Best regards,<br>The Final Expense Coach Team</p>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail(to, "Welcome to Final Expense Coach!", html);
  }

  async sendCallGradingNotification(to, agentName, score, feedback) {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            .container {
              padding: 20px;
              max-width: 600px;
              margin: 0 auto;
              font-family: Arial, sans-serif;
            }
            .score {
              font-size: 24px;
              font-weight: bold;
              color: ${score >= 80 ? '#4CAF50' : score >= 60 ? '#FFA500' : '#FF0000'};
            }
            .feedback {
              background-color: #f5f5f5;
              padding: 15px;
              border-radius: 4px;
              margin: 10px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Call Grading Results</h1>
            <p>Hello ${agentName},</p>
            <p>Your recent call has been evaluated. Here are your results:</p>
            <p>Overall Score: <span class="score">${score}%</span></p>
            <div class="feedback">
              <h2>Feedback</h2>
              ${feedback}
            </div>
            <p>Login to your dashboard to view the complete evaluation and access additional training resources.</p>
            <p>Keep up the great work!</p>
            <p>Best regards,<br>Your Sales Coach</p>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail(to, "Call Grading Results - Final Expense Coach", html);
  }
}

// Create and verify single instance
const emailService = new EmailService();
emailService.verifyConnection();

module.exports = emailService;