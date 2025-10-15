import * as nodemailer from "nodemailer";

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    const mailOptions = {
      from: `"Jits Journal" <${process.env.GMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || '',
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
};

export const sendWelcomeEmail = async (userEmail: string, firstName: string): Promise<boolean> => {
  const subject = "Welcome to Jits Journal - Your BJJ Journey Starts Here!";
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Jits Journal</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #1e3a8a 0%, #dc2626 100%);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 10px;
          margin-bottom: 30px;
        }
        .belt-icon {
          width: 60px;
          height: 20px;
          background: white;
          margin: 0 auto 20px;
          border-radius: 10px;
          position: relative;
        }
        .belt-icon::before {
          content: '';
          position: absolute;
          left: 10px;
          top: 2px;
          width: 4px;
          height: 16px;
          background: #dc2626;
          border-radius: 2px;
        }
        .content {
          background: #f8fafc;
          padding: 30px;
          border-radius: 10px;
          border-left: 4px solid #dc2626;
        }
        .features {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin: 30px 0;
        }
        .feature {
          background: white;
          padding: 20px;
          border-radius: 8px;
          border: 2px solid #e5e7eb;
          text-align: center;
        }
        .feature h3 {
          color: #1e3a8a;
          margin-bottom: 10px;
        }
        .cta-button {
          display: inline-block;
          background: #dc2626;
          color: white;
          padding: 15px 30px;
          text-decoration: none;
          border-radius: 25px;
          font-weight: bold;
          margin: 20px 0;
          text-align: center;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          color: #6b7280;
        }
        @media (max-width: 500px) {
          .features {
            grid-template-columns: 1fr;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="belt-icon"></div>
        <h1>Welcome to Jits Journal!</h1>
        <p>Your ultimate BJJ training companion</p>
      </div>
      
      <div class="content">
        <h2>Hey ${firstName}! 🥋</h2>
        
        <p>Welcome to the Jits Journal family! We're excited to have you join thousands of BJJ practitioners who are already using our app to track their progress and improve their game.</p>
        
        <div class="features">
          <div class="feature">
            <h3>📚 Class Tracking</h3>
            <p>Log your training sessions, techniques, and progress</p>
          </div>
          <div class="feature">
            <h3>🎯 Weekly Goals</h3>
            <p>Set and track your weekly training commitments</p>
          </div>
          <div class="feature">
            <h3>📝 Technique Notes</h3>
            <p>Record insights, tips, and technique breakdowns</p>
          </div>
          <div class="feature">
            <h3>🏆 Belt Progress</h3>
            <p>Track your belt promotions and stripe achievements</p>
          </div>
        </div>
        
        <p><strong>Ready to start your journey?</strong> Here's what you can do first:</p>
        <ol>
          <li><strong>Set your weekly goal:</strong> How many classes do you want to attend this week?</li>
          <li><strong>Log your first class:</strong> Start tracking your progress immediately</li>
          <li><strong>Add your current belt:</strong> Update your belt and stripe information</li>
          <li><strong>Create your first note:</strong> Document techniques you're working on</li>
        </ol>
        
        <div style="text-align: center;">
          <a href="${process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 'https://jitsjournal.com'}" class="cta-button">Start Training Now</a>
        </div>
        
        <p>Need help getting started? Just reply to this email and our team will be happy to assist you!</p>
        
        <p>Train hard, stay consistent, and remember - every black belt was once a white belt who never gave up.</p>
        
        <p>Best regards,<br>
        The Jits Journal Team</p>
      </div>
      
      <div class="footer">
        <p>© 2025 Jits Journal. All rights reserved.</p>
        <p>This email was sent because you signed up for Jits Journal.</p>
      </div>
    </body>
    </html>
  `;

  const text = `
    Welcome to Jits Journal, ${firstName}!
    
    Your ultimate BJJ training companion is ready to help you track your progress and improve your game.
    
    Features you'll love:
    - Class Tracking: Log your training sessions and progress
    - Weekly Goals: Set and track your training commitments
    - Technique Notes: Record insights and technique breakdowns
    - Belt Progress: Track promotions and stripe achievements
    
    Ready to start? Visit ${process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 'https://jitsjournal.com'} and begin your journey!
    
    Need help? Just reply to this email.
    
    Train hard and stay consistent!
    
    Best regards,
    The Jits Journal Team
  `;

  return await sendEmail({
    to: userEmail,
    subject,
    html,
    text,
  });
};

export const sendInvitationEmail = async (
  recipientEmail: string,
  senderName: string
): Promise<boolean> => {
  const signupUrl = `${process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 'https://jitsjournal.com'}/signup`;
  const subject = `${senderName} invited you to BJJ Jits Journal`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>You're Invited to Jits Journal</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #1e3a8a 0%, #dc2626 100%);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 10px;
          margin-bottom: 30px;
        }
        .belt-icon {
          width: 60px;
          height: 20px;
          background: white;
          margin: 0 auto 20px;
          border-radius: 10px;
        }
        .content {
          background: #f8fafc;
          padding: 30px;
          border-radius: 10px;
          border-left: 4px solid #dc2626;
        }
        .features {
          background: white;
          padding: 20px;
          border-radius: 8px;
          border: 2px solid #e5e7eb;
          margin: 20px 0;
        }
        .feature-item {
          margin: 10px 0;
          padding-left: 25px;
          position: relative;
        }
        .feature-item::before {
          content: '✓';
          position: absolute;
          left: 0;
          color: #dc2626;
          font-weight: bold;
        }
        .cta-button {
          display: inline-block;
          background: #dc2626;
          color: white;
          padding: 15px 30px;
          text-decoration: none;
          border-radius: 25px;
          font-weight: bold;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          color: #6b7280;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="belt-icon"></div>
        <h1>You're Invited! 🥋</h1>
        <p>${senderName} wants you to join Jits Journal</p>
      </div>
      
      <div class="content">
        <h2>Your BJJ Training Companion Awaits</h2>
        
        <p><strong>${senderName}</strong> is using Jits Journal to track their Brazilian Jiu-Jitsu progress and thinks you'd love it too!</p>
        
        <div class="features">
          <h3>What You'll Get:</h3>
          <div class="feature-item">Track every class, roll, and technique</div>
          <div class="feature-item">Set weekly training goals and monitor progress</div>
          <div class="feature-item">Create detailed technique notes with video links</div>
          <div class="feature-item">Monitor belt and stripe progression</div>
          <div class="feature-item">Search 1000s of BJJ instructional videos</div>
          <div class="feature-item">Build competition game plans</div>
        </div>
        
        <p>Join thousands of BJJ practitioners who are already improving their game with Jits Journal!</p>
        
        <div style="text-align: center;">
          <a href="${signupUrl}" class="cta-button">Accept Invitation & Sign Up Free</a>
        </div>
        
        <p style="margin-top: 30px; font-style: italic; color: #6b7280;">
          "The journey of a thousand miles begins with a single step. Start tracking your BJJ journey today!"
        </p>
        
        <p>Best regards,<br>
        The Jits Journal Team</p>
      </div>
      
      <div class="footer">
        <p>© 2025 Jits Journal. All rights reserved.</p>
        <p>You received this email because ${senderName} invited you to join Jits Journal.</p>
      </div>
    </body>
    </html>
  `;

  const text = `
    You're Invited to Jits Journal!
    
    ${senderName} wants you to join Jits Journal - the ultimate BJJ training companion.
    
    What You'll Get:
    - Track every class, roll, and technique
    - Set weekly training goals and monitor progress
    - Create detailed technique notes with video links
    - Monitor belt and stripe progression
    - Search 1000s of BJJ instructional videos
    - Build competition game plans
    
    Join thousands of BJJ practitioners improving their game!
    
    Sign up here: ${signupUrl}
    
    Best regards,
    The Jits Journal Team
  `;

  return await sendEmail({
    to: recipientEmail,
    subject,
    html,
    text,
  });
};

export const sendPasswordResetEmail = async (
  userEmail: string,
  firstName: string,
  resetToken: string
): Promise<boolean> => {
  const subject = "Reset Your Jits Journal Password";
  const resetUrl = `${process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 'https://jitsjournal.com'}/reset-password?token=${resetToken}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #1e3a8a 0%, #dc2626 100%);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 10px;
          margin-bottom: 30px;
        }
        .content {
          background: #f8fafc;
          padding: 30px;
          border-radius: 10px;
          border-left: 4px solid #dc2626;
        }
        .reset-button {
          display: inline-block;
          background: #dc2626;
          color: white;
          padding: 15px 30px;
          text-decoration: none;
          border-radius: 25px;
          font-weight: bold;
          margin: 20px 0;
          text-align: center;
        }
        .warning {
          background: #fef3c7;
          border: 1px solid #f59e0b;
          color: #92400e;
          padding: 15px;
          border-radius: 8px;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          color: #6b7280;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Password Reset Request</h1>
        <p>Jits Journal</p>
      </div>
      
      <div class="content">
        <h2>Hey ${firstName}!</h2>
        
        <p>We received a request to reset your password for your Jits Journal account.</p>
        
        <p>If you requested this password reset, click the button below to set a new password:</p>
        
        <div style="text-align: center;">
          <a href="${resetUrl}" class="reset-button">Reset My Password</a>
        </div>
        
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #6b7280;">${resetUrl}</p>
        
        <div class="warning">
          <strong>⚠️ Important:</strong>
          <ul>
            <li>This link will expire in 1 hour for security reasons</li>
            <li>If you didn't request this reset, please ignore this email</li>
            <li>Your current password remains unchanged until you set a new one</li>
          </ul>
        </div>
        
        <p>If you're having trouble with the button above, copy and paste the URL into your web browser.</p>
        
        <p>If you didn't request this password reset, you can safely ignore this email. Your account is secure.</p>
        
        <p>Best regards,<br>
        The Jits Journal Team</p>
      </div>
      
      <div class="footer">
        <p>© 2025 Jits Journal. All rights reserved.</p>
        <p>This email was sent because a password reset was requested for your account.</p>
      </div>
    </body>
    </html>
  `;

  const text = `
    Password Reset Request - Jits Journal
    
    Hey ${firstName}!
    
    We received a request to reset your password for your Jits Journal account.
    
    If you requested this password reset, click the link below to set a new password:
    ${resetUrl}
    
    Important:
    - This link will expire in 1 hour for security reasons
    - If you didn't request this reset, please ignore this email
    - Your current password remains unchanged until you set a new one
    
    If you didn't request this password reset, you can safely ignore this email.
    
    Best regards,
    The Jits Journal Team
  `;

  return await sendEmail({
    to: userEmail,
    subject,
    html,
    text,
  });
};
