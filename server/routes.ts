import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { pool, db } from "./db";

import { insertClassSchema, insertVideoSchema, insertNoteSchema, insertDrawingSchema, insertBeltSchema, insertWeeklyCommitmentSchema, insertTrainingVideoSchema, insertUserSchema, insertGamePlanSchema, insertGymSchema, insertGymMembershipSchema, notes, users } from "@shared/schema";
import { generateBJJCounterMoves } from "./openaiService";
import { z } from "zod";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { eq, and, sql } from "drizzle-orm";
import { createClient } from "@supabase/supabase-js";

import * as nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { sendWelcomeEmail, sendPasswordResetEmail, sendInvitationEmail } from "./emailService";
import Stripe from "stripe";
import multer from "multer";

// JWT secret - in production, use a secure environment variable
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this-in-production";

// Supabase admin client for token verification
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseJwtSecret = process.env.SUPABASE_JWT_SECRET;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('âš ï¸ SUPABASE_SERVICE_ROLE_KEY not configured - Supabase token verification will be disabled');
}

const supabaseAdmin = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// Configure multer for file uploads (using memory storage for R2 upload)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 * 1024, // 5GB limit
  },
});


// Authentication middleware
const authenticateToken = async (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  let decoded: any = null;
  let isSupabaseToken = false;

  // Try Supabase token verification first (only if configured)
  if (supabaseJwtSecret) {
    // FAST: Local JWT verification (< 1ms)
    try {
      const supabaseDecoded = jwt.verify(token, supabaseJwtSecret) as any;
      console.log('Fast local Supabase token verified for:', supabaseDecoded.email);
      decoded = {
        email: supabaseDecoded.email,
        supabaseId: supabaseDecoded.sub,
      };
      isSupabaseToken = true;
    } catch (supabaseError) {
      console.log('Not a Supabase token, trying legacy JWT...');
    }
  } else if (supabaseAdmin) {
    // SLOW: API-based verification (~1500ms) - fallback only
    try {
      const { data: { user: supabaseUser }, error } = await supabaseAdmin.auth.getUser(token);
      
      if (supabaseUser && !error) {
        console.log('Slow API Supabase token verified for:', supabaseUser.email);
        decoded = {
          email: supabaseUser.email,
          supabaseId: supabaseUser.id,
        };
        isSupabaseToken = true;
      }
    } catch (supabaseError) {
      console.log('Not a Supabase token, trying legacy JWT...');
    }
  }

  // Fallback to legacy JWT verification
  if (!decoded) {
    try {
      decoded = jwt.verify(token, JWT_SECRET) as any;
      console.log('âœ… Legacy JWT verified for:', decoded.email);
    } catch (error: any) {
      console.error('Token verification error:', error.message);
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
  }

  try {
    // Find user in database
    let user;
    
    if (isSupabaseToken) {
      // For Supabase tokens, look up by email or supabase_uid
      user = await storage.getUserByEmail(decoded.email);
      
      if (!user) {
        console.log('Supabase user not found in database, auto-creating:', decoded.email);
        
        // Auto-create user account with premium status for known emails
        const premiumEmails = ['joe833360@gmail.com', 'Joe@cleancutconstructions.com.au', 'bjjjitsjournal@gmail.com', 'admin@apexbjj.com.au'];
        const adminEmails = ['bjjjitsjournal@gmail.com', 'admin@apexbjj.com.au'];
        const isPremiumUser = premiumEmails.includes(decoded.email);
        const isAdmin = adminEmails.includes(decoded.email);
        
        const tempPassword = await bcrypt.hash('temp-password-' + Date.now(), 10);
        user = await storage.createUser({
          email: decoded.email,
          password: tempPassword,
          firstName: decoded.email.split('@')[0],
          lastName: '',
          subscriptionStatus: isPremiumUser ? 'premium' : 'free',
          subscriptionExpiresAt: isPremiumUser ? new Date('2099-12-31') : null,
          supabaseUid: decoded.supabaseId,
          role: isAdmin ? 'admin' : 'user',
        });
        
        console.log('âœ… Auto-created user account for Supabase user:', decoded.email);
      }
    } else {
      // For legacy JWT, use userId from token
      user = await storage.getUser(decoded.userId);
      
      if (!user) {
        console.log('Token valid but user not found in storage, userId:', decoded.userId, 'email:', decoded.email);
        
        // Auto-restore user account
        const premiumEmails = ['joe833360@gmail.com', 'Joe@cleancutconstructions.com.au', 'bjjjitsjournal@gmail.com', 'admin@apexbjj.com.au'];
        const isPremiumUser = premiumEmails.includes(decoded.email);
        
        const existingUser = await storage.getUserByEmail(decoded.email);
        if (existingUser) {
          console.log('âœ… Found existing user by email, using that account:', decoded.email);
          user = existingUser;
        } else {
          const tempPassword = await bcrypt.hash('temp-password-' + Date.now(), 10);
          user = await storage.createUser({
            email: decoded.email,
            password: tempPassword,
            firstName: decoded.email.split('@')[0],
            lastName: '',
            subscriptionStatus: isPremiumUser ? 'premium' : 'free',
            subscriptionExpiresAt: isPremiumUser ? new Date('2099-12-31') : null,
          });
          
          console.log('âœ… Auto-restored user account for:', decoded.email, isPremiumUser ? '(premium)' : '(free)');
        }
      }
    }
    
    // Attach user data to request
    req.user = { ...decoded, userId: user.id, email: user.email };
    req.userId = user.id;
    next();
  } catch (error: any) {
    console.error('User lookup/creation error:', error);
    return res.status(401).json({ 
      message: 'Authentication failed',
      error: error.message,
    });
  }
};

// Flexible auth middleware - accepts either Authorization header OR supabaseId in body (for mobile)
const flexibleAuth = async (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  // Try token-based auth first
  if (token) {
    let decoded: any = null;
    let isSupabaseToken = false;

    // FAST PATH: Try local Supabase JWT verification first (< 1ms)
    if (supabaseJwtSecret) {
      try {
        const supabaseDecoded = jwt.verify(token, supabaseJwtSecret) as any;
        console.log('⚡ FAST: Local Supabase token verified for:', supabaseDecoded.email);
        decoded = {
          email: supabaseDecoded.email,
          supabaseId: supabaseDecoded.sub,
        };
        isSupabaseToken = true;
      } catch (supabaseError) {
        // Not a Supabase token or verification failed
      }
    }

    // SLOW PATH: Fallback to API-based Supabase verification (~1500ms)
    if (!decoded && supabaseAdmin) {
      try {
        const { data: { user: supabaseUser }, error } = await supabaseAdmin.auth.getUser(token);
        
        if (supabaseUser && !error) {
          console.log('🐌 SLOW: API Supabase token verified for:', supabaseUser.email);
          decoded = {
            email: supabaseUser.email,
            supabaseId: supabaseUser.id,
          };
          isSupabaseToken = true;
        }
      } catch (supabaseError) {
        console.log('Not a Supabase token, trying legacy JWT...');
      }
    }

    // Legacy JWT fallback
    if (!decoded) {
      try {
        decoded = jwt.verify(token, JWT_SECRET) as any;
        console.log('✅ Legacy JWT verified for:', decoded.email);
      } catch (error: any) {
        // Token invalid, fall through to supabaseId check
      }
    }

    if (decoded) {
      try {
        let user;
        if (isSupabaseToken) {
          user = await storage.getUserByEmail(decoded.email);
        } else {
          user = await storage.getUser(decoded.userId);
        }
        
        if (user) {
          req.userId = user.id;
          req.user = user;
          return next();
        }
      } catch (error) {
        console.error('Error loading user from token:', error);
      }
    }
  }

  // Fallback: Check for supabaseId in body or query params (mobile workaround)
  const supabaseId = req.body?.supabaseId || req.query?.supabaseId;
  if (supabaseId) {
    console.log('📱 Mobile auth: Using supabaseId from', req.body?.supabaseId ? 'body' : 'query', ':', supabaseId);
    
    try {
      // Look up user by Supabase UID
      const result = await pool.query(
        'SELECT * FROM users WHERE supabase_uid = $1',
        [supabaseId]
      );
      
      if (result.rows.length > 0) {
        const user = result.rows[0];
        req.userId = user.id;
        req.user = user;
        console.log('✅ Mobile auth successful for user:', user.id);
        return next();
      }
    } catch (error) {
      console.error('Error in mobile auth:', error);
    }
  }

  return res.status(401).json({ message: 'Access token or supabaseId required' });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Add cache control headers to prevent aggressive caching
  app.use((req, res, next) => {
    // Never cache API responses - this prevents login/auth issues
    if (req.path.startsWith('/api/')) {
      res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
    }
    next();
  });
  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      // Create user with premium access for specific emails
      const premiumEmails = ['joe833360@gmail.com', 'Joe@cleancutconstructions.com.au', 'bjjjitsjournal@gmail.com', 'admin@apexbjj.com.au'];
      const isPremiumUser = premiumEmails.includes(userData.email);
      
      // Assign admin role for specific emails
      const adminEmails = ['bjjjitsjournal@gmail.com', 'admin@apexbjj.com.au'];
      const isAdmin = adminEmails.includes(userData.email);
      
      console.log('Creating user with supabaseId:', userData.supabaseId);
      const newUser = await storage.createUser({
        ...userData,
        supabaseUid: userData.supabaseId, // Map supabaseId to supabaseUid for database
        password: hashedPassword,
        subscriptionStatus: isPremiumUser ? 'premium' : 'free',
        subscriptionExpiresAt: isPremiumUser ? new Date('2099-12-31') : null,
        role: isAdmin ? 'admin' : 'user',
      });
      
      // Send welcome email
      try {
        await sendWelcomeEmail(newUser.email, newUser.firstName || "");
        console.log(`Welcome email sent to ${newUser.email}`);
      } catch (error) {
        console.error("Failed to send welcome email:", error);
        // Continue with registration even if email fails
      }
      
      // Create JWT token (30 days for better mobile experience)
      const token = jwt.sign(
        { userId: newUser.id, email: newUser.email },
        JWT_SECRET,
        { expiresIn: '30d' }
      );
      
      // Return user without password
      const { password, ...userWithoutPassword } = newUser;
      res.status(201).json({
        ...userWithoutPassword,
        token,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid user data", errors: error.errors });
      } else {
        console.error('Registration error:', error);
        res.status(500).json({ message: "Failed to create user" });
      }
    }
  });

  // Password reset request
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      
      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Don't reveal whether email exists
        return res.json({ message: "If the email exists, a reset link has been sent." });
      }
      
      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
      
      // Store reset token
      await storage.createPasswordResetToken(user.id, resetToken, expiresAt);
      
      // Send reset email
      try {
        await sendPasswordResetEmail(user.email, user.firstName || "", resetToken);
        console.log(`Password reset email sent to ${user.email}`);
      } catch (error) {
        console.error("Failed to send password reset email:", error);
        return res.status(500).json({ message: "Failed to send reset email" });
      }
      
      res.json({ message: "If the email exists, a reset link has been sent." });
    } catch (error) {
      console.error('Password reset error:', error);
      res.status(500).json({ message: "Failed to process password reset request" });
    }
  });

  // Password reset verification and update
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return res.status(400).json({ message: "Token and new password are required" });
      }
      
      if (newPassword.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
      }
      
      // Find reset token
      const resetToken = await storage.getPasswordResetToken(token);
      if (!resetToken) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }
      
      // Check if token is expired
      if (new Date() > resetToken.expiresAt) {
        return res.status(400).json({ message: "Reset token has expired" });
      }
      
      // Check if token is already used
      if (resetToken.used) {
        return res.status(400).json({ message: "Reset token has already been used" });
      }
      
      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Update user password
      await storage.updateUser(resetToken.userId, { password: hashedPassword });
      
      // Mark token as used
      await storage.markPasswordResetTokenAsUsed(resetToken.id);
      
      res.json({ message: "Password has been successfully reset" });
    } catch (error) {
      console.error('Password reset error:', error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  app.post("/api/auth/supabase-exchange", async (req, res) => {
    try {
      const { supabaseAccessToken } = req.body;
      
      if (!supabaseAccessToken) {
        return res.status(400).json({ message: "Supabase access token required" });
      }
      
      if (!supabaseAdmin) {
        return res.status(500).json({ message: "Supabase admin client not configured" });
      }
      
      // Verify Supabase token and get user
      const { data: { user: supabaseUser }, error } = await supabaseAdmin.auth.getUser(supabaseAccessToken);
      
      if (error || !supabaseUser) {
        console.error('Invalid Supabase token:', error?.message);
        return res.status(401).json({ message: "Invalid Supabase token" });
      }
      
      console.log('✅ Supabase token verified for:', supabaseUser.email);
      
      // Find or create user in database
      let user = await storage.getUserByEmail(supabaseUser.email!);
      
      if (!user) {
        console.log('Creating new user for Supabase ID:', supabaseUser.id);
        
        const premiumEmails = ['joe833360@gmail.com', 'Joe@cleancutconstructions.com.au', 'bjjjitsjournal@gmail.com', 'admin@apexbjj.com.au'];
        const adminEmails = ['bjjjitsjournal@gmail.com', 'admin@apexbjj.com.au'];
        const isPremiumUser = premiumEmails.includes(supabaseUser.email!);
        const isAdmin = adminEmails.includes(supabaseUser.email!);
        
        const tempPassword = await bcrypt.hash('temp-password-' + Date.now(), 10);
        user = await storage.createUser({
          email: supabaseUser.email!,
          password: tempPassword,
          firstName: supabaseUser.user_metadata?.firstName || supabaseUser.email!.split('@')[0],
          lastName: supabaseUser.user_metadata?.lastName || '',
          subscriptionStatus: isPremiumUser ? 'premium' : 'free',
          subscriptionExpiresAt: isPremiumUser ? new Date('2099-12-31') : null,
          supabaseUid: supabaseUser.id,
          role: isAdmin ? 'admin' : 'user',
        });
        
        console.log('✅ Created user account for Supabase user:', supabaseUser.email);
      }
      
      // Create server-signed JWT (30 days)
      const token = jwt.sign(
        { userId: user.id, email: user.email, supabaseId: supabaseUser.id },
        JWT_SECRET,
        { expiresIn: '30d' }
      );
      
      console.log('🔐 Issued server JWT for:', user.email);
      
      res.json({ token });
    } catch (error) {
      console.error('JWT exchange error:', error);
      res.status(500).json({ message: "Failed to exchange token" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      
      // Find user by email
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      // Auto-upgrade premium users if they don't already have premium
      const premiumEmails = ['joe833360@gmail.com', 'Joe@cleancutconstructions.com.au', 'bjjjitsjournal@gmail.com', 'admin@apexbjj.com.au'];
      const isPremiumUser = premiumEmails.includes(email);
      if (isPremiumUser && !user.subscriptionExpiresAt) {
        const updatedUser = await storage.updateUser(user.id, {
          subscriptionStatus: 'premium',
          subscriptionExpiresAt: new Date('2099-12-31')
        });
        console.log(`âœ… Auto-upgraded ${email} to premium access`);
        
        // Update the user object for the response
        if (updatedUser) {
          Object.assign(user, updatedUser);
        }
      }
      
      // Auto-assign admin role for specific emails
      const adminEmails = ['bjjjitsjournal@gmail.com', 'admin@apexbjj.com.au'];
      const isAdmin = adminEmails.includes(email);
      if (isAdmin && user.role !== 'admin') {
        const updatedUser = await storage.updateUser(user.id, {
          role: 'admin'
        });
        console.log(`âœ… Auto-assigned admin role to ${email}`);
        
        // Update the user object for the response
        if (updatedUser) {
          Object.assign(user, updatedUser);
        }
      }
      
      // Check password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      // Create JWT token (30 days for better mobile experience)
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '30d' }
      );
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      res.json({
        ...userWithoutPassword,
        token,
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: "Failed to login" });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req, res) => {
    try {
      const user = await storage.getUser((req as any).user.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  // Manual premium upgrade endpoint
  app.post("/api/users/:id/upgrade-premium", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const updatedUser = await storage.updateUser(userId, {
        subscriptionStatus: 'premium',
        subscriptionExpiresAt: new Date('2099-12-31')
      });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      console.log(`âœ… Manually upgraded user ${userId} to premium access`);
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Premium upgrade error:', error);
      res.status(500).json({ message: "Failed to upgrade to premium" });
    }
  });

  // Contact form endpoint
  app.post("/api/contact", async (req, res) => {
    try {
      const { name, email, subject, message } = req.body;
      
      if (!name || !email || !subject || !message) {
        return res.status(400).json({ message: "All fields are required" });
      }
      
      // Log detailed contact submission for easy tracking
      const timestamp = new Date().toISOString();
      const contactData = {
        name,
        email, 
        subject,
        message,
        timestamp,
        userAgent: req.headers['user-agent'] || 'Unknown',
        ip: req.ip || 'Unknown'
      };
      
      console.log('\n=== NEW CONTACT FORM SUBMISSION ===');
      console.log(`ðŸ“§ From: ${name} (${email})`);
      console.log(`ðŸ“ Subject: ${subject}`);
      console.log(`ðŸ’¬ Message: ${message}`);
      console.log(`â° Time: ${timestamp}`);
      console.log(`ðŸŒ IP: ${contactData.ip}`);
      console.log('====================================\n');
      
      // Store in a simple JSON file for backup (free alternative to database)
      try {
        const contactsFile = path.join(process.cwd(), 'contact-submissions.json');
        
        let contacts = [];
        if (fs.existsSync(contactsFile)) {
          const fileData = fs.readFileSync(contactsFile, 'utf8');
          contacts = JSON.parse(fileData);
        }
        
        contacts.push(contactData);
        fs.writeFileSync(contactsFile, JSON.stringify(contacts, null, 2));
        console.log(`ðŸ’¾ Contact saved to ${contactsFile}`);
      } catch (fileError) {
        console.error('Error saving contact to file:', fileError);
      }
      
      // Send email using Gmail SMTP (free)
      try {
        
        // Gmail SMTP configuration
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.GMAIL_USER, // bjjjitsjournal@gmail.com
            pass: process.env.GMAIL_APP_PASSWORD, // Gmail app password
          },
        });

        const mailOptions = {
          from: `"BJJ Jits Journal" <${process.env.GMAIL_USER}>`,
          to: 'joe833360@gmail.com',
          subject: `Contact Form: ${subject}`,
          html: `
            <h3>New Contact Form Submission</h3>
            <p><strong>From:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Subject:</strong> ${subject}</p>
            <p><strong>Message:</strong></p>
            <p>${message.replace(/\n/g, '<br>')}</p>
            <p><strong>Time:</strong> ${timestamp}</p>
            <hr>
            <p><em>Sent from BJJ Jits Journal Contact Form</em></p>
          `,
          replyTo: email, // User can reply directly to the sender
        };

        await transporter.sendMail(mailOptions);
        console.log('ðŸ“§ Email sent successfully to joe833360@gmail.com');
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        // Continue with success response even if email fails
      }
      
      res.json({ message: "Message sent successfully" });
    } catch (error) {
      console.error("Contact form error:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Admin endpoint to view contact submissions (for development/testing)
  app.get("/api/admin/contacts", async (req, res) => {
    try {
      const contactsFile = path.join(process.cwd(), 'contact-submissions.json');
      
      if (!fs.existsSync(contactsFile)) {
        return res.json([]);
      }
      
      const fileData = fs.readFileSync(contactsFile, 'utf8');
      const contacts = JSON.parse(fileData);
      
      // Return contacts sorted by most recent first
      res.json(contacts.reverse());
    } catch (error) {
      console.error("Error reading contacts:", error);
      res.status(500).json({ message: "Failed to read contacts" });
    }
  });

  // Classes routes
  app.get("/api/classes", authenticateToken, async (req, res) => {
    try {
      const userId = (req as any).user.userId;
      const classes = await storage.getClasses(userId);
      res.json(classes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch classes" });
    }
  });

  app.post("/api/classes", authenticateToken, async (req, res) => {
    try {
      const userId = (req as any).user.userId;
      
      // Load full user record to check subscription tier
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Debug: Log user subscription info
      console.log('📊 Class creation - User subscription info:', {
        userId: user.id,
        subscriptionTier: user.subscriptionTier,
        subscriptionStatus: user.subscriptionStatus,
        email: user.email
      });
      
      // Check tier limits for free users only
      const userTier = user.subscriptionTier || 'free';
      if (userTier === 'free') {
        const existingClasses = await storage.getClasses(userId);
        if (existingClasses.length >= 3) {
          return res.status(403).json({ 
            message: "Free tier limited to 3 classes. Upgrade to Premium for unlimited classes.",
            limit: 3,
            current: existingClasses.length
          });
        }
      }
      
      const classData = insertClassSchema.parse({ ...req.body, userId });
      const newClass = await storage.createClass(classData);
      res.status(201).json(newClass);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid class data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create class" });
      }
    }
  });

  app.put("/api/classes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const classData = insertClassSchema.partial().parse(req.body);
      const updatedClass = await storage.updateClass(id, classData);
      
      if (!updatedClass) {
        return res.status(404).json({ message: "Class not found" });
      }
      
      res.json(updatedClass);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid class data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update class" });
      }
    }
  });

  app.delete("/api/classes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteClass(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Class not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete class" });
    }
  });

  // Videos routes - with proper authentication and user isolation
  app.get("/api/videos", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const { category, search } = req.query;
      
      let videos;
      if (search) {
        videos = await storage.searchVideos(search as string, userId);
      } else if (category) {
        videos = await storage.getVideosByCategory(category as string, userId);
      } else {
        videos = await storage.getVideos(userId);
      }
      
      res.json(videos);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch videos" });
    }
  });

  app.post("/api/videos", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const videoData = insertVideoSchema.parse({ ...req.body, userId });
      const newVideo = await storage.createVideo(videoData);
      res.status(201).json(newVideo);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid video data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create video" });
      }
    }
  });

  app.put("/api/videos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const videoData = insertVideoSchema.partial().parse(req.body);
      const updatedVideo = await storage.updateVideo(id, videoData);
      
      if (!updatedVideo) {
        return res.status(404).json({ message: "Video not found" });
      }
      
      res.json(updatedVideo);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid video data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update video" });
      }
    }
  });

  app.delete("/api/videos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteVideo(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Video not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete video" });
    }
  });

  // Notes routes - using existing notes table with UUID mapping
  app.get("/api/notes", flexibleAuth, async (req, res) => {
    const startTime = Date.now();
    try {
      const userId = (req as any).user.id; // Integer user ID
      const { search } = req.query;
      
      let notes;
      if (search) {
        notes = await storage.searchNotes(search as string, userId);
      } else {
        notes = await storage.getNotes(userId);
      }
      
      const duration = Date.now() - startTime;
      console.log(`⏱️ GET /api/notes completed in ${duration}ms for user ${userId} (${notes.length} notes)`);
      
      res.json(notes);
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ GET /api/notes failed after ${duration}ms:`, error);
      res.status(500).json({ message: "Failed to fetch notes" });
    }
  });

  app.post("/api/notes", flexibleAuth, async (req, res) => {
    try {
      const userId = (req as any).user.id; // Integer user ID
      console.log("📝 POST /api/notes - Creating note with data:", req.body, "for user:", userId);
      
      const noteData = {
        title: req.body.title,
        content: req.body.content,
        tags: req.body.tags || [],
        linkedClassId: req.body.linkedClassId || null,
        linkedVideoId: req.body.linkedVideoId || null,
        userId: userId, // Use integer user ID directly
        isShared: req.body.isShared ? Number(req.body.isShared) : 0, // Coerce to integer
        sharedWithUsers: req.body.sharedWithUsers || []
      };
      
      const newNote = await storage.createNote(noteData);
      console.log("Note created successfully:", newNote);
      res.status(201).json(newNote);
    } catch (error: any) {
      console.error("Error creating note:", error);
      res.status(500).json({ message: "Failed to create note", error: error?.message || 'Unknown error' });
    }
  });

  app.put("/api/notes/:id", flexibleAuth, async (req, res) => {
    try {
      const id = req.params.id; // UUID string
      const userId = (req as any).user.id; // Integer user ID
      const noteData = req.body; // Parse as partial appNote data
      console.log("✏️ PUT /api/notes/:id - Updating note:", id, "for user:", userId, "with data:", noteData);
      
      // Check if note belongs to the user
      const existingNote = await storage.getNote(id);
      if (!existingNote || existingNote.userId !== userId) {
        return res.status(404).json({ message: "Note not found" });
      }
      
      const updatedNote = await storage.updateNote(id, noteData);
      
      if (!updatedNote) {
        return res.status(404).json({ message: "Note not found" });
      }
      
      res.json(updatedNote);
    } catch (error) {
      res.status(500).json({ message: "Failed to update note" });
    }
  });

  app.delete("/api/notes/:id", flexibleAuth, async (req, res) => {
    try {
      const id = req.params.id; // UUID string
      const userId = (req as any).user.id; // Integer user ID
      console.log("🗑️ DELETE /api/notes/:id - Deleting note:", id, "for user:", userId, "body:", req.body);
      
      // Check if note belongs to the user
      const existingNote = await storage.getNote(id);
      if (!existingNote || existingNote.userId !== userId) {
        return res.status(404).json({ message: "Note not found" });
      }
      
      const deleted = await storage.deleteNote(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Note not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete note" });
    }
  });

  // Admin endpoint for deleting any community note (moderation)
  app.delete("/api/notes/:id/admin", authenticateToken, async (req, res) => {
    try {
      const id = req.params.id; // UUID string
      const userEmail = (req as any).user.email;
      
      // Check if user is admin (bjjjitsjournal@gmail.com - case insensitive)
      const adminEmails = ['Bjjjitsjournal@gmail.com', 'bjjjitsjournal@gmail.com', 'admin@apexbjj.com.au'];
      if (!adminEmails.includes(userEmail)) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      // Admin can delete any note regardless of owner
      const deleted = await storage.deleteNote(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Note not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete note" });
    }
  });

  // Shared notes routes
  app.get("/api/notes/shared", flexibleAuth, async (req, res) => {
    const startTime = Date.now();
    try {
      const userId = (req as any).user.id;
      
      // Optimized: getSharedNotes now uses JOIN - ONE query instead of N+1
      const sharedNotes = await storage.getSharedNotes();
      
      const totalDuration = Date.now() - startTime;
      console.log(`⏱️ GET /api/notes/shared completed in ${totalDuration}ms (${sharedNotes.length} notes) - OPTIMIZED with JOIN`);
      
      // Notes already include author info and like count from the JOIN query
      res.json(sharedNotes.map(note => ({
        ...note,
        isLikedByUser: false // TODO: Add user-specific like status in future optimization
      })));
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ GET /api/notes/shared failed after ${duration}ms:`, error);
      res.status(500).json({ message: "Failed to fetch shared notes" });
    }
  });

  app.post("/api/notes/:id/toggle-sharing", flexibleAuth, async (req, res) => {
    try {
      const noteId = req.params.id; // Keep as string (UUID)
      const userId = (req as any).user.id;
      
      // Get user details to check subscription tier
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if trying to share (not unshare)
      const note = await storage.getNote(noteId);
      if (!note) {
        return res.status(404).json({ message: "Note not found" });
      }
      
      // If note is currently not shared (user is trying to share it)
      if (note.isShared === 0) {
        // FREE TIER: Cannot share to community at all
        if (user.subscriptionStatus === 'free' || !user.subscriptionStatus) {
          return res.status(403).json({ 
            message: "Community sharing is a Premium feature. Upgrade to share notes with the community!" 
          });
        }
        
        // PREMIUM/GYM TIER: Check weekly share limit
        // Calculate current week start (Monday)
        const today = new Date();
        const dayOfWeek = today.getUTCDay();
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const weekStart = new Date(Date.UTC(
          today.getUTCFullYear(), 
          today.getUTCMonth(), 
          today.getUTCDate() - daysToMonday, 
          0, 0, 0, 0
        ));
        
        // Count community shares this week
        const allUserNotes = await storage.getNotes(userId);
        const sharesThisWeek = allUserNotes.filter((n: any) => {
          if (n.isShared !== 1 || !n.createdAt) return false;
          const shareDate = new Date(n.createdAt);
          return shareDate >= weekStart;
        }).length;
        
        // Check limits based on subscription tier
        let weeklyLimit = 0;
        if (user.subscriptionStatus === 'premium' || user.subscriptionStatus === 'active') {
          weeklyLimit = 1; // Premium: 1 per week
        } else if (user.subscriptionTier === 'gym_pro') {
          weeklyLimit = 3; // Gym: 3 per week
        }
        
        if (sharesThisWeek >= weeklyLimit) {
          return res.status(403).json({ 
            message: `You've reached your weekly limit of ${weeklyLimit} community ${weeklyLimit === 1 ? 'share' : 'shares'}. Try again next week!` 
          });
        }
      }
      
      const updatedNote = await storage.toggleNoteSharing(noteId, userId);
      
      if (!updatedNote) {
        return res.status(404).json({ message: "Note not found or unauthorized" });
      }
      
      res.json({
        ...updatedNote,
        message: updatedNote.isShared === 1 ? "Note shared with community!" : "Note made private"
      });
    } catch (error) {
      console.error("Error toggling note sharing:", error);
      res.status(500).json({ message: "Failed to toggle note sharing" });
    }
  });


  // Friend invitation route with Gmail (same as welcome emails)
  app.post("/api/invite-friend", async (req, res) => {
    try {
      // Support both mobile auth (supabaseId) and web auth (token)
      let userId = null;
      
      // Try mobile auth first (supabaseId from query or body)
      const supabaseId = (req.query.supabaseId || req.body.supabaseId) as string;
      if (supabaseId) {
        console.log('📱 Mobile auth: Using supabaseId:', supabaseId);
        
        // Use direct database query (same as /api/user/by-supabase-id endpoint)
        const result = await pool.query(
          'SELECT * FROM users WHERE supabase_uid = $1',
          [supabaseId]
        );
        
        if (result.rows.length > 0) {
          userId = result.rows[0].id;
          console.log('✅ Mobile auth successful for user:', userId);
        }
      }
      
      // If no mobile auth, try token auth
      if (!userId && (req as any).user) {
        userId = (req as any).user.userId;
        console.log('🔐 Web auth successful for user:', userId);
      }

      if (!userId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // Get sender's name for personalization
      const sender = await db.select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      
      const senderName = sender[0] ? `${sender[0].firstName} ${sender[0].lastName}` : 'Your training partner';

      // Send invitation email using Gmail (same as welcome emails)
      const success = await sendInvitationEmail(email, senderName);
      
      if (success) {
        console.log(`✅ Invitation email sent to ${email} from ${senderName}`);
        res.json({ 
          message: "Invitation sent successfully",
          invitedEmail: email 
        });
      } else {
        console.error(`❌ Failed to send invitation email to ${email}`);
        res.status(500).json({ message: "Failed to send invitation" });
      }
    } catch (error) {
      console.error("Error sending invitation:", error);
      res.status(500).json({ message: "Failed to send invitation" });
    }
  });

  // General health check endpoint for monitoring
  app.get("/api/health", (req, res) => {
    res.status(200).json({ 
      status: "ok",
      timestamp: new Date().toISOString(),
      version: "v1.0.75"
    });
  });

  // Health check endpoint for R2 configuration
  app.get("/api/health/r2", (req, res) => {
    const r2Status = {
      endpoint: !!process.env.R2_ENDPOINT,
      accessKeyId: !!process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: !!process.env.R2_SECRET_ACCESS_KEY,
      bucketName: !!process.env.R2_BUCKET_NAME,
      version: "v1.0.75",
      deployedAt: new Date().toISOString()
    };
    res.json(r2Status);
  });

  // Video upload route for notes - uploads to R2 storage
  app.post("/api/notes/:id/upload-video", (req, res, next) => {
    // Wrap multer middleware to catch errors and return JSON
    upload.single('video')(req, res, (err) => {
      if (err) {
        console.error('❌ Multer error:', err.message);
        return res.status(400).json({ 
          message: err.message || 'File upload failed',
          error: 'UPLOAD_ERROR'
        });
      }
      next();
    });
  }, async (req, res) => {
    try {
      console.log('📹 Video upload started');
      console.log('Request body keys:', Object.keys(req.body));
      console.log('File present:', !!req.file);
      
      const noteId = req.params.id; // UUID string
      const file = req.file;
      const { fileName, fileSize, userId, thumbnail } = req.body;
      
      if (!userId) {
        console.error('❌ No userId in request');
        return res.status(401).json({ message: 'User ID required' });
      }

      if (!file) {
        console.error('❌ No video file in request');
        return res.status(400).json({ message: "No video file provided" });
      }
      
      const parsedUserId = parseInt(userId);
      const parsedFileSize = parseInt(fileSize) || file.size;
      
      console.log(`📹 Video upload request for note ${noteId} by user ${parsedUserId}`);
      console.log(`📹 File name: ${fileName || file.originalname}`);
      console.log(`📹 File size: ${parsedFileSize} bytes (${(parsedFileSize / 1024 / 1024).toFixed(2)} MB)`);
      console.log(`📹 MIME type: ${file.mimetype}`);

      // Get user's subscription tier and current storage usage
      console.log('📹 Checking user and storage quota...');
      const [user] = await db.select()
        .from(users)
        .where(eq(users.id, parsedUserId))
        .limit(1);

      if (!user) {
        console.error('❌ User not found in database');
        return res.status(404).json({ message: "User not found" });
      }

      console.log(`📹 User subscription tier: ${user.subscriptionTier || 'free'}`);
      console.log(`📹 Current storage used: ${user.storageUsed || 0} bytes`);

      // Check storage quota and per-video limits
      const { hasStorageQuota, formatBytes, getStorageTierInfo, getPerVideoLimit } = await import('./storageUtils');
      
      // Check per-video file size limit
      const perVideoLimit = getPerVideoLimit(user.subscriptionTier || 'free');
      if (parsedFileSize > perVideoLimit) {
        console.error(`❌ Video file too large: ${formatBytes(parsedFileSize)} exceeds limit of ${formatBytes(perVideoLimit)}`);
        return res.status(413).json({
          message: `Video file too large. Maximum ${formatBytes(perVideoLimit)} per video for your plan.`,
          fileSize: formatBytes(parsedFileSize),
          limit: formatBytes(perVideoLimit),
          exceeded: true
        });
      }
      
      if (!hasStorageQuota(user.storageUsed || 0, parsedFileSize, user.subscriptionTier || 'free')) {
        const tierInfo = getStorageTierInfo(user.subscriptionTier || 'free');
        console.error('❌ Storage quota exceeded');
        return res.status(413).json({ 
          message: `Storage quota exceeded. ${tierInfo.tierName} plan allows ${tierInfo.quotaFormatted}.`,
          currentUsage: formatBytes(user.storageUsed || 0),
          quota: tierInfo.quotaFormatted,
          exceeded: true
        });
      }

      // Upload to R2
      console.log('📹 Starting upload to R2...');
      let url, key;
      try {
        const { uploadToR2 } = await import('./r2Storage');
        ({ url, key } = await uploadToR2(
          file.buffer,
          fileName || file.originalname,
          file.mimetype
        ));
        console.log('✅ Upload to R2 successful');
        console.log(`📹 R2 URL: ${url}`);
        console.log(`📹 R2 Key: ${key}`);
      } catch (r2Error: any) {
        console.error('❌ R2 upload failed:', r2Error.message);
        return res.status(500).json({ 
          message: r2Error.message || 'R2 storage configuration error',
          error: 'R2_CONFIG_ERROR'
        });
      }

      // Update note in database with video URL from R2
      console.log('📹 Updating note in database...');
      const [updatedNote] = await db.update(notes)
        .set({
          videoUrl: url,
          videoFileName: fileName || file.originalname,
          videoFileSize: parsedFileSize,
          videoThumbnail: thumbnail || null,
          updatedAt: new Date()
        })
        .where(and(
          eq(notes.id, noteId),
          eq(notes.userId, parsedUserId)
        ))
        .returning();

      if (!updatedNote) {
        console.error('❌ Note not found or access denied');
        return res.status(404).json({ message: "Note not found or access denied" });
      }

      // Update user's storage usage
      console.log('📹 Updating storage usage...');
      await db.update(users)
        .set({
          storageUsed: (user.storageUsed || 0) + parsedFileSize
        })
        .where(eq(users.id, parsedUserId));

      const newStorageUsed = (user.storageUsed || 0) + parsedFileSize;
      console.log(`✅ Video uploaded successfully! New storage usage: ${formatBytes(newStorageUsed)}`);
      res.json({ 
        message: "Video uploaded successfully",
        note: updatedNote,
        storageUsed: newStorageUsed
      });
    } catch (error: any) {
      console.error("❌ Error uploading video to note:", error);
      console.error("❌ Error stack:", error.stack);
      console.error("❌ Error message:", error.message);
      res.status(500).json({ message: "Failed to upload video", error: error.message });
    }
  });

  // Remove video from note - deletes from R2 or Supabase Storage and updates storage quota
  app.delete("/api/notes/:id/video", async (req, res) => {
    try {
      const noteId = req.params.id; // UUID string
      const userId = parseInt(req.query.userId as string);

      if (!userId || isNaN(userId)) {
        return res.status(401).json({ message: 'User ID required' });
      }

      // First, get the note to retrieve video info
      const [note] = await db.select()
        .from(notes)
        .where(and(
          eq(notes.id, noteId),
          eq(notes.userId, userId)
        ))
        .limit(1);

      if (!note) {
        return res.status(404).json({ message: "Note not found or access denied" });
      }

      const videoFileSize = note.videoFileSize || 0;
      const videoUrl = note.videoUrl;

      // Delete video file from storage (R2 or Supabase)
      if (videoUrl) {
        try {
          // Check if it's an R2 URL (from our endpoint domain) or Supabase URL
          if (videoUrl.includes(process.env.R2_ENDPOINT || '') || !videoUrl.includes('supabase.co')) {
            // Delete from R2
            const { deleteFromR2 } = await import('./r2Storage');
            // Extract key from URL - format: https://{endpoint}/{bucket}/{key}
            const urlObj = new URL(videoUrl);
            const pathParts = urlObj.pathname.substring(1).split('/'); // Remove leading slash and split
            const key = pathParts.slice(1).join('/'); // Skip bucket name, get the rest as key
            await deleteFromR2(key);
            console.log('✅ File deleted from R2');
          } else if (videoUrl.includes('supabase.co') && supabaseAdmin) {
            // Delete from Supabase Storage (legacy videos)
            // URL format: https://{project}.supabase.co/storage/v1/object/public/videos/{path}
            const urlParts = videoUrl.split('/storage/v1/object/public/');
            if (urlParts.length === 2) {
              const fullPath = urlParts[1]; // e.g., "videos/note-videos/uuid-timestamp.mp4"
              const pathParts = fullPath.split('/');
              const bucket = pathParts[0]; // "videos"
              const filePath = pathParts.slice(1).join('/'); // "note-videos/uuid-timestamp.mp4"

              console.log(`Deleting file from Supabase Storage: ${bucket}/${filePath}`);
              
              const { error: deleteError } = await supabaseAdmin.storage
                .from(bucket)
                .remove([filePath]);

              if (deleteError) {
                console.error('Error deleting from Supabase Storage:', deleteError);
              } else {
                console.log('✅ File deleted from Supabase Storage');
              }
            }
          }
        } catch (storageError) {
          console.error('Error processing storage deletion:', storageError);
        }
      }
      
      // Update note to remove video references
      const [updatedNote] = await db.update(notes)
        .set({
          videoUrl: null,
          videoFileName: null,
          videoFileSize: null,
          videoThumbnail: null,
          updatedAt: new Date()
        })
        .where(and(
          eq(notes.id, noteId),
          eq(notes.userId, userId)
        ))
        .returning();

      // Decrease user's storage usage
      if (videoFileSize > 0) {
        await db.update(users)
          .set({
            storageUsed: sql`GREATEST(0, ${users.storageUsed} - ${videoFileSize})`
          })
          .where(eq(users.id, userId));

        const { formatBytes } = await import('./storageUtils');
        console.log(`Storage usage decreased by ${formatBytes(videoFileSize)}`);
      }

      res.json({ 
        message: "Video removed successfully",
        note: updatedNote,
        freedStorage: videoFileSize
      });
    } catch (error) {
      console.error("Error removing video from note:", error);
      res.status(500).json({ message: "Failed to remove video" });
    }
  });

  // Note likes routes
  app.post("/api/notes/:id/like", authenticateToken, async (req, res) => {
    try {
      const noteId = parseInt(req.params.id);
      const userId = (req as any).user.userId;

      const success = await storage.likeNote(noteId, userId);
      
      if (!success) {
        return res.status(400).json({ message: "Note already liked or not found" });
      }

      const likeCount = (await storage.getNoteLikes(noteId)).length;
      
      res.json({ 
        message: "Note liked successfully",
        likeCount,
        isLiked: true
      });
    } catch (error) {
      console.error("Error liking note:", error);
      res.status(500).json({ message: "Failed to like note" });
    }
  });

  app.delete("/api/notes/:id/like", authenticateToken, async (req, res) => {
    try {
      const noteId = parseInt(req.params.id);
      const userId = (req as any).user.userId;

      const success = await storage.unlikeNote(noteId, userId);
      
      if (!success) {
        return res.status(400).json({ message: "Note not liked or not found" });
      }

      const likeCount = (await storage.getNoteLikes(noteId)).length;
      
      res.json({ 
        message: "Note unliked successfully",
        likeCount,
        isLiked: false
      });
    } catch (error) {
      console.error("Error unliking note:", error);
      res.status(500).json({ message: "Failed to unlike note" });
    }
  });

  app.get("/api/notes/:id/likes", authenticateToken, async (req, res) => {
    try {
      const noteId = parseInt(req.params.id);
      const userId = (req as any).user.userId;

      const likeCount = (await storage.getNoteLikes(noteId)).length;
      const isLiked = await storage.isNoteLikedByUser(noteId, userId);
      
      res.json({ 
        likeCount,
        isLiked
      });
    } catch (error) {
      console.error("Error fetching note likes:", error);
      res.status(500).json({ message: "Failed to fetch note likes" });
    }
  });








  // Get user by Supabase UID - No auth required for login
  app.get("/api/user/by-supabase-id/:supabaseId", async (req, res) => {
    try {
      const { supabaseId } = req.params;
      console.log('Looking up user by Supabase ID:', supabaseId);
      
      const result = await pool.query(
        'SELECT * FROM users WHERE supabase_uid = $1',
        [supabaseId]
      );
      
      if (result.rows.length > 0) {
        console.log('Found user:', result.rows[0].id);
        let user = result.rows[0];
        
        // Auto-assign admin role for specific emails
        const adminEmails = ['bjjjitsjournal@gmail.com', 'admin@apexbjj.com.au'];
        const isAdmin = adminEmails.includes(user.email);
        if (isAdmin && user.role !== 'admin') {
          const updatedUser = await storage.updateUser(user.id, {
            role: 'admin'
          });
          console.log(`âœ… Auto-assigned admin role to ${user.email}`);
          
          // Return updated user
          if (updatedUser) {
            user = updatedUser;
          }
        }
        
        res.json(user);
      } else {
        console.log('User not found');
        res.status(404).json({ message: 'User not found' });
      }
    } catch (error: any) {
      console.error('Error fetching user by Supabase ID:', error);
      res.status(500).json({ message: 'Error fetching user: ' + error.message });
    }
  });

  // Get user statistics
  app.get("/api/user-stats", authenticateToken, async (req, res) => {
    try {
      const userId = (req as any).user.userId;
      
      // Get total classes count
      const classes = await storage.getClasses(userId);
      const totalClasses = classes.length;
      
      // Get current belt and last promotion
      const belts = await storage.getBelts(userId);
      const currentBelt = belts.length > 0 ? belts[0] : null;
      const lastPromotionDate = currentBelt?.createdAt || null;
      
      res.json({
        totalClasses,
        lastPromotionDate,
        currentBelt: currentBelt ? {
          belt: currentBelt.belt,
          stripes: currentBelt.stripes
        } : null
      });
    } catch (error: any) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ message: "Error fetching user stats: " + error.message });
    }
  });

  // Delete user account and all data
  app.delete("/api/user/delete-account", flexibleAuth, async (req, res) => {
    try {
      const userId = (req as any).user.userId;
      
      console.log(`🗑️ Deleting account for user ID: ${userId}`);
      
      // Delete all user data from database
      await pool.query('DELETE FROM classes WHERE user_id = $1', [userId]);
      await pool.query('DELETE FROM notes WHERE user_id = $1', [userId]);
      await pool.query('DELETE FROM belts WHERE user_id = $1', [userId]);
      await pool.query('DELETE FROM weekly_goals WHERE user_id = $1', [userId]);
      await pool.query('DELETE FROM drawings WHERE user_id = $1', [userId]);
      await pool.query('DELETE FROM game_plans WHERE user_id = $1', [userId]);
      await pool.query('DELETE FROM gym_memberships WHERE user_id = $1', [userId]);
      
      // Finally delete the user
      await pool.query('DELETE FROM users WHERE id = $1', [userId]);
      
      console.log(`✅ Successfully deleted account for user ID: ${userId}`);
      
      res.json({ message: "Account and all data successfully deleted" });
    } catch (error: any) {
      console.error("Error deleting account:", error);
      res.status(500).json({ message: "Failed to delete account: " + error.message });
    }
  });

  // Drawings routes - with proper authentication 
  app.get("/api/drawings", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const drawings = await storage.getDrawings(userId);
      res.json(drawings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch drawings" });
    }
  });

  app.post("/api/drawings", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const drawingData = insertDrawingSchema.parse({ ...req.body, userId });
      const newDrawing = await storage.createDrawing(drawingData);
      res.status(201).json(newDrawing);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid drawing data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create drawing" });
      }
    }
  });

  app.put("/api/drawings/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const drawingData = insertDrawingSchema.partial().parse(req.body);
      const updatedDrawing = await storage.updateDrawing(id, drawingData);
      
      if (!updatedDrawing) {
        return res.status(404).json({ message: "Drawing not found" });
      }
      
      res.json(updatedDrawing);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid drawing data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update drawing" });
      }
    }
  });

  app.delete("/api/drawings/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteDrawing(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Drawing not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete drawing" });
    }
  });

  // Belt routes
  app.get("/api/belts", authenticateToken, async (req, res) => {
    try {
      const userId = (req as any).user.userId;
      const belts = await storage.getBelts(userId);
      res.json(belts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch belts" });
    }
  });

  app.get("/api/belts/current", authenticateToken, async (req, res) => {
    try {
      const userId = (req as any).user.userId;
      const currentBelt = await storage.getCurrentBelt(userId);
      res.json(currentBelt);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch current belt" });
    }
  });

  app.post("/api/belts", authenticateToken, async (req, res) => {
    try {
      const userId = (req as any).user.userId;
      const beltData = insertBeltSchema.parse({ ...req.body, userId });
      const newBelt = await storage.createBelt(beltData);
      res.status(201).json(newBelt);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid belt data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create belt" });
      }
    }
  });

  app.put("/api/belts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const beltData = insertBeltSchema.partial().parse(req.body);
      const updatedBelt = await storage.updateBelt(id, beltData);
      
      if (!updatedBelt) {
        return res.status(404).json({ message: "Belt not found" });
      }
      
      res.json(updatedBelt);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid belt data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update belt" });
      }
    }
  });

  app.patch("/api/belts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const beltData = insertBeltSchema.partial().parse(req.body);
      const updatedBelt = await storage.updateBelt(id, beltData);
      
      if (!updatedBelt) {
        return res.status(404).json({ message: "Belt not found" });
      }
      
      res.json(updatedBelt);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid belt data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update belt" });
      }
    }
  });

  app.delete("/api/belts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteBelt(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Belt not found" });
      }
      
      res.json({ message: "Belt deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete belt" });
    }
  });

  // Statistics route - with proper authentication and user isolation
  app.get("/api/stats", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      // Get user's classes only for stats calculation
      const userClasses = await storage.getClasses(userId);
      const now = new Date();
      const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const weeklyClasses = userClasses.filter(cls => cls.date >= weekStart).length;
      const monthlyClasses = userClasses.filter(cls => cls.date >= monthStart).length;
      const totalHours = userClasses.reduce((sum, cls) => sum + cls.duration, 0) / 60;
      
      const stats = {
        weeklyClasses,
        totalHours,
        monthlyClasses
      };
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  // Weekly Commitments routes - with proper authentication
  app.get("/api/weekly-commitments", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const commitments = await storage.getWeeklyCommitments(userId);
      res.json(commitments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch weekly commitments" });
    }
  });

  app.get("/api/weekly-commitments/current", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      console.log('ðŸ” GET /api/weekly-commitments/current called for userId:', userId);
      const commitment = await storage.getCurrentWeekCommitment(userId);
      console.log('ðŸ” getCurrentWeekCommitment returned:', commitment ? commitment.id : 'null');
      
      // Ensure no caching by setting appropriate headers
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      
      res.json(commitment || null);
    } catch (error) {
      console.error('âŒ Error in GET /api/weekly-commitments/current:', error);
      res.status(500).json({ message: "Failed to fetch current week commitment" });
    }
  });

  app.post("/api/weekly-commitments", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      console.log('ðŸ”¥ POST /api/weekly-commitments called with data:', req.body, 'userId:', userId);
      const commitmentData = insertWeeklyCommitmentSchema.parse({ ...req.body, userId });
      const newCommitment = await storage.createWeeklyCommitment(commitmentData);
      console.log('âœ… Created new commitment:', newCommitment.id);
      
      // Ensure no caching
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      
      res.status(201).json(newCommitment);
    } catch (error) {
      console.error('âŒ Error in POST /api/weekly-commitments:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid commitment data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create weekly commitment" });
      }
    }
  });

  app.put("/api/weekly-commitments/:id", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const id = parseInt(req.params.id);
      const commitmentData = insertWeeklyCommitmentSchema.partial().parse(req.body);
      const updatedCommitment = await storage.updateWeeklyCommitment(id, commitmentData);
      
      if (!updatedCommitment || updatedCommitment.userId !== userId) {
        return res.status(404).json({ message: "Weekly commitment not found" });
      }
      
      res.json(updatedCommitment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid commitment data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update weekly commitment" });
      }
    }
  });

  // Training Videos routes
  app.get("/api/training-videos", async (req, res) => {
    try {
      const videos = await storage.getTrainingVideos();
      res.json(videos);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch training videos" });
    }
  });

  app.post("/api/training-videos", async (req, res) => {
    try {
      const videoData = insertTrainingVideoSchema.parse(req.body);
      const newVideo = await storage.createTrainingVideo(videoData);
      res.status(201).json(newVideo);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid video data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create training video" });
      }
    }
  });

  app.get("/api/training-videos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const video = await storage.getTrainingVideo(id);
      
      if (!video) {
        return res.status(404).json({ message: "Training video not found" });
      }
      
      res.json(video);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch training video" });
    }
  });

  app.put("/api/training-videos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const videoData = insertTrainingVideoSchema.partial().parse(req.body);
      const updatedVideo = await storage.updateTrainingVideo(id, videoData);
      
      if (!updatedVideo) {
        return res.status(404).json({ message: "Training video not found" });
      }
      
      res.json(updatedVideo);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid video data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update training video" });
      }
    }
  });

  app.delete("/api/training-videos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteTrainingVideo(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Training video not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete training video" });
    }
  });

  // Game Plan routes
  app.get("/api/game-plans", flexibleAuth, async (req, res) => {
    try {
      const userId = req.userId;
      const gamePlans = await storage.getGamePlans(userId);
      res.json(gamePlans);
    } catch (error) {
      console.error("Error fetching game plans:", error);
      res.status(500).json({ message: "Failed to fetch game plans" });
    }
  });

  app.get("/api/game-plans/names", flexibleAuth, async (req, res) => {
    try {
      const userId = req.userId;
      const planNames = await storage.getGamePlanNames(userId);
      res.json(planNames);
    } catch (error) {
      console.error("Error fetching plan names:", error);
      res.status(500).json({ message: "Failed to fetch plan names" });
    }
  });

  app.get("/api/game-plans/:planName", flexibleAuth, async (req, res) => {
    try {
      const userId = req.userId;
      const planName = req.params.planName;
      const gamePlans = await storage.getGamePlanByName(userId, planName);
      res.json(gamePlans);
    } catch (error) {
      console.error("Error fetching game plan:", error);
      res.status(500).json({ message: "Failed to fetch game plan" });
    }
  });

  app.post("/api/game-plans", flexibleAuth, async (req, res) => {
    try {
      const userId = req.userId;
      const gamePlanData = insertGamePlanSchema.parse(req.body);
      const newMove = await storage.createGamePlanMove(userId, gamePlanData);
      res.status(201).json(newMove);
    } catch (error) {
      console.error("Error creating game plan move:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid game plan data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create game plan move" });
      }
    }
  });

  app.put("/api/game-plans/:id", flexibleAuth, async (req, res) => {
    try {
      const userId = req.userId;
      const moveId = req.params.id;
      const moveData = insertGamePlanSchema.partial().parse(req.body);
      const updatedMove = await storage.updateGamePlanMove(moveId, userId, moveData);
      
      if (!updatedMove) {
        return res.status(404).json({ message: "Game plan move not found" });
      }
      
      res.json(updatedMove);
    } catch (error) {
      console.error("Error updating game plan move:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid game plan data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update game plan move" });
      }
    }
  });

  app.delete("/api/game-plans/:id", flexibleAuth, async (req, res) => {
    try {
      const userId = req.userId;
      const moveId = req.params.id;
      const result = await storage.deleteGamePlanMove(moveId, userId);
      
      if (!result) {
        return res.status(404).json({ message: "Game plan move not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting game plan move:", error);
      res.status(500).json({ message: "Failed to delete game plan move" });
    }
  });

  // AI Counter Move Suggestions
  app.post("/api/game-plans/ai-suggest", flexibleAuth, async (req, res) => {
    try {
      const { currentMove, position, context } = req.body;
      
      if (!currentMove || !position) {
        return res.status(400).json({ 
          message: "Missing required fields: currentMove and position are required" 
        });
      }

      const counterMoves = await generateBJJCounterMoves(currentMove, position, context);
      res.json({ counterMoves });
    } catch (error: any) {
      console.error("AI suggestion error:", error);
      res.status(500).json({ 
        message: error.message || "Failed to generate counter move suggestions" 
      });
    }
  });

  // Gym Management Routes
  
  // Get all gyms (admin only)
  app.get("/api/gyms", flexibleAuth, async (req, res) => {
    try {
      const userId = req.userId;
      
      // Check if user is admin
      const user = await storage.getUser(userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const gyms = await storage.getAllGyms();
      res.json(gyms);
    } catch (error: any) {
      console.error("Get gyms error:", error);
      res.status(500).json({ message: error.message || "Failed to fetch gyms" });
    }
  });
  
  // Create a new gym (admin only)
  app.post("/api/gyms", flexibleAuth, async (req, res) => {
    try {
      const userId = req.userId;
      
      // Check if user is admin
      const user = await storage.getUser(userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const gymData = insertGymSchema.parse(req.body);
      
      // Generate unique code if not provided
      if (!gymData.code) {
        gymData.code = crypto.randomBytes(4).toString('hex').toUpperCase();
      }
      
      const newGym = await storage.createGym({
        ...gymData,
        ownerId: userId
      });
      
      // Automatically add creator as admin member
      await storage.createGymMembership({
        userId,
        gymId: newGym.id,
        role: 'admin'
      });
      
      res.status(201).json(newGym);
    } catch (error) {
      console.error("Error creating gym:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid gym data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create gym" });
      }
    }
  });
  
  // Delete a gym (admin only)
  app.delete("/api/gyms/:id", flexibleAuth, async (req, res) => {
    try {
      const userId = req.userId;
      const gymId = parseInt(req.params.id);
      
      // Check if user is admin
      const user = await storage.getUser(userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      // Delete the gym (this should cascade delete memberships and gym notes)
      await storage.deleteGym(gymId);
      
      res.json({ message: "Gym deleted successfully" });
    } catch (error) {
      console.error("Error deleting gym:", error);
      res.status(500).json({ message: "Failed to delete gym" });
    }
  });
  
  // Join a gym with code
  app.post("/api/gyms/join", flexibleAuth, async (req, res) => {
    try {
      const userId = req.userId;
      const { code } = req.body;
      
      if (!code) {
        return res.status(400).json({ message: "Gym code is required" });
      }
      
      // Find gym by code
      const gym = await storage.getGymByCode(code);
      if (!gym) {
        return res.status(404).json({ message: "Invalid gym code" });
      }
      
      // Check if already a member
      const existingMembership = await storage.getGymMembership(userId, gym.id);
      if (existingMembership) {
        return res.status(400).json({ message: "You are already a member of this gym" });
      }
      
      // Create membership
      const membership = await storage.createGymMembership({
        userId,
        gymId: gym.id,
        role: 'member'
      });
      
      res.status(201).json({ gym, membership });
    } catch (error) {
      console.error("Error joining gym:", error);
      res.status(500).json({ message: "Failed to join gym" });
    }
  });

  // Get user's gym membership
  app.get("/api/my-gym", flexibleAuth, async (req, res) => {
    try {
      const userId = req.userId;
      
      // Get user's gym memberships
      const userGyms = await storage.getUserGyms(userId);
      
      if (userGyms.length === 0) {
        return res.json(null);
      }
      
      // Get membership details including role
      const gym = userGyms[0];
      const membership = await storage.getGymMembership(userId, gym.id);
      
      // Return gym with membership role
      res.json({
        ...gym,
        role: membership?.role || 'member'
      });
    } catch (error) {
      console.error("Error getting user gym:", error);
      res.status(500).json({ message: "Failed to get gym membership" });
    }
  });

  // Get gym notes (only for gym members)
  app.get("/api/gym-notes", flexibleAuth, async (req, res) => {
    try {
      const userId = req.userId;
      console.log('🔍 GET /api/gym-notes - userId:', userId);
      
      // Get user's gym memberships
      const userGyms = await storage.getUserGyms(userId);
      console.log('🏋️ User gyms found:', userGyms.length, userGyms);
      
      if (userGyms.length === 0) {
        console.log('⚠️ User not in any gym');
        return res.json([]);
      }
      
      // Get notes for the first gym (users can only be in one gym for now)
      const gymId = userGyms[0].id;
      console.log('📝 Fetching notes for gym ID:', gymId);
      const gymNotes = await storage.getGymNotes(gymId);
      console.log('✅ Gym notes found:', gymNotes.length);
      
      res.json(gymNotes);
    } catch (error) {
      console.error("Error getting gym notes:", error);
      res.status(500).json({ message: "Failed to get gym notes" });
    }
  });

  // Share note to gym (admin only)
  app.post("/api/notes/:id/share-to-gym", flexibleAuth, async (req, res) => {
    try {
      const userId = req.userId;
      const noteId = req.params.id;
      
      // Verify note belongs to user
      const note = await storage.getNote(noteId);
      if (!note || note.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to share this note" });
      }
      
      // Get user's gym
      const userGyms = await storage.getUserGyms(userId);
      if (userGyms.length === 0) {
        return res.status(400).json({ message: "You must be a member of a gym to share notes" });
      }
      
      // Verify user is gym admin
      const gymMembership = await storage.getGymMembership(userId, userGyms[0].id);
      if (!gymMembership || gymMembership.role !== 'admin') {
        return res.status(403).json({ message: "Only gym admins can share notes to the gym" });
      }
      
      // Share note to gym
      await storage.shareNoteToGym(noteId, userGyms[0].id);
      
      res.json({ message: "Note shared to gym successfully" });
    } catch (error) {
      console.error("Error sharing note to gym:", error);
      res.status(500).json({ message: "Failed to share note to gym" });
    }
  });

  // Get gym members (admin only or super admin)
  app.get("/api/gyms/:gymId/members", flexibleAuth, async (req, res) => {
    try {
      const userId = req.userId;
      const gymId = parseInt(req.params.gymId);
      
      // Get current user
      const user = await storage.getUser(userId);
      
      // Check if user is super admin (bjjjitsjournal@gmail.com)
      const isSuperAdmin = user?.email === 'bjjjitsjournal@gmail.com';
      
      // Check if user is gym admin
      const gymMembership = await storage.getGymMembership(userId, gymId);
      const isGymAdmin = gymMembership?.role === 'admin';
      
      if (!isSuperAdmin && !isGymAdmin) {
        return res.status(403).json({ message: "Admin access required to view gym members" });
      }
      
      // Get all gym members with user details
      const members = await storage.getGymMembers(gymId);
      
      res.json(members);
    } catch (error) {
      console.error("Error getting gym members:", error);
      res.status(500).json({ message: "Failed to get gym members" });
    }
  });
  
  // Remove gym member (admin only or super admin)
  app.delete("/api/gyms/:gymId/members/:userId", flexibleAuth, async (req, res) => {
    try {
      const requestUserId = req.userId;
      const gymId = parseInt(req.params.gymId);
      const memberUserId = parseInt(req.params.userId);
      
      // Get current user
      const user = await storage.getUser(requestUserId);
      
      // Check if user is super admin (bjjjitsjournal@gmail.com)
      const isSuperAdmin = user?.email === 'bjjjitsjournal@gmail.com';
      
      // Check if user is gym admin
      const gymMembership = await storage.getGymMembership(requestUserId, gymId);
      const isGymAdmin = gymMembership?.role === 'admin';
      
      if (!isSuperAdmin && !isGymAdmin) {
        return res.status(403).json({ message: "Admin access required to remove gym members" });
      }
      
      // Don't allow removing the gym owner unless super admin
      const gym = await storage.getGym(gymId);
      if (gym?.ownerId === memberUserId && !isSuperAdmin) {
        return res.status(403).json({ message: "Cannot remove gym owner" });
      }
      
      // Remove membership
      await storage.deleteGymMembership(memberUserId, gymId);
      
      res.json({ message: "Member removed successfully" });
    } catch (error) {
      console.error("Error removing gym member:", error);
      res.status(500).json({ message: "Failed to remove gym member" });
    }
  });
  
  // Unshare note from gym (admin only)
  app.post("/api/notes/:id/unshare-from-gym", authenticateToken, async (req, res) => {
    try {
      const userId = req.userId;
      const noteId = req.params.id;
      
      // Verify note belongs to user
      const note = await storage.getNote(noteId);
      if (!note || note.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to modify this note" });
      }
      
      // Get gym from note
      if (!note.gymId) {
        return res.status(400).json({ message: "Note is not shared to any gym" });
      }
      
      // Verify user is gym admin
      const gymMembership = await storage.getGymMembership(userId, note.gymId);
      if (!gymMembership || gymMembership.role !== 'admin') {
        return res.status(403).json({ message: "Only gym admins can remove notes from the gym" });
      }
      
      // Unshare note from gym
      await storage.unshareNoteFromGym(noteId);
      
      res.json({ message: "Note removed from gym successfully" });
    } catch (error) {
      console.error("Error unsharing note from gym:", error);
      res.status(500).json({ message: "Failed to remove note from gym" });
    }
  });

  // Delete gym note (admin only)
  app.delete("/api/gym-notes/:id", flexibleAuth, async (req, res) => {
    try {
      const userId = req.userId;
      const noteId = req.params.id;
      
      // Verify note exists
      const note = await storage.getNote(noteId);
      if (!note) {
        return res.status(404).json({ message: "Note not found" });
      }
      
      // Get user's gym
      const userGyms = await storage.getUserGyms(userId);
      if (userGyms.length === 0) {
        return res.status(400).json({ message: "You must be a member of a gym" });
      }
      
      // Verify user is gym admin
      const gymMembership = await storage.getGymMembership(userId, userGyms[0].id);
      if (!gymMembership || gymMembership.role !== 'admin') {
        return res.status(403).json({ message: "Only gym admins can delete gym notes" });
      }
      
      // Verify note belongs to this gym
      if (note.gymId !== userGyms[0].id) {
        return res.status(403).json({ message: "This note does not belong to your gym" });
      }
      
      // Delete the note
      await storage.deleteNote(noteId);
      
      res.json({ message: "Gym note deleted successfully" });
    } catch (error) {
      console.error("Error deleting gym note:", error);
      res.status(500).json({ message: "Failed to delete gym note" });
    }
  });
  
  // Get user's gyms
  app.get("/api/gyms/my-gyms", authenticateToken, async (req, res) => {
    try {
      const userId = req.userId;
      const gyms = await storage.getUserGyms(userId);
      res.json(gyms);
    } catch (error) {
      console.error("Error fetching user gyms:", error);
      res.status(500).json({ message: "Failed to fetch gyms" });
    }
  });
  
  // Get gym-specific shared notes
  app.get("/api/gyms/:gymId/notes", authenticateToken, async (req, res) => {
    try {
      const userId = req.userId;
      const gymId = parseInt(req.params.gymId);
      
      // Verify user is a member of this gym
      const membership = await storage.getGymMembership(userId, gymId);
      if (!membership) {
        return res.status(403).json({ message: "You are not a member of this gym" });
      }
      
      const notes = await storage.getGymNotes(gymId);
      res.json(notes);
    } catch (error) {
      console.error("Error fetching gym notes:", error);
      res.status(500).json({ message: "Failed to fetch gym notes" });
    }
  });

  // Stripe checkout routes
  app.post("/api/stripe/create-checkout-session", flexibleAuth, async (req, res) => {
    try {
      const userId = req.userId;
      const { tier } = req.body;
      
      if (!tier) {
        return res.status(400).json({ message: "tier is required" });
      }
      
      // Server-side whitelist: map tier to priceId (NEVER trust client)
      console.log('[Stripe Checkout] Checking price IDs...', {
        STRIPE_ENTHUSIAST_PRICE_ID: process.env.STRIPE_ENTHUSIAST_PRICE_ID,
        VITE_STRIPE_ENTHUSIAST_PRICE_ID: process.env.VITE_STRIPE_ENTHUSIAST_PRICE_ID,
        STRIPE_GYM_PRO_PRICE_ID: process.env.STRIPE_GYM_PRO_PRICE_ID,
        VITE_STRIPE_GYM_PRO_PRICE_ID: process.env.VITE_STRIPE_GYM_PRO_PRICE_ID,
      });
      
      const enthusiastPriceId = process.env.STRIPE_ENTHUSIAST_PRICE_ID || process.env.VITE_STRIPE_ENTHUSIAST_PRICE_ID;
      const gymProPriceId = process.env.STRIPE_GYM_PRO_PRICE_ID || process.env.VITE_STRIPE_GYM_PRO_PRICE_ID;
      
      if (!enthusiastPriceId || !gymProPriceId) {
        console.error('Missing price IDs:', { enthusiastPriceId, gymProPriceId });
        return res.status(500).json({ message: "Server configuration error: price IDs not set" });
      }
      
      const TIER_PRICE_MAP: Record<string, { priceId: string; name: string }> = {
        'enthusiast': {
          priceId: enthusiastPriceId,
          name: 'BJJ Enthusiast'
        },
        'gym_pro': {
          priceId: gymProPriceId,
          name: 'Gym Pro'
        }
      };
      
      const tierConfig = TIER_PRICE_MAP[tier];
      if (!tierConfig) {
        return res.status(400).json({ message: "Invalid tier" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
      
      // Create or retrieve Stripe customer
      let customerId = user.stripeCustomerId;
      
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: {
            userId: user.id.toString(),
          },
        });
        customerId = customer.id;
        await storage.updateUserStripeCustomer(userId, customerId);
      }
      
      // Create checkout session with server-validated priceId
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: tierConfig.priceId,
            quantity: 1,
          },
        ],
        success_url: `${process.env.VITE_APP_URL || 'http://localhost:5000'}/subscribe/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.VITE_APP_URL || 'http://localhost:5000'}/subscribe`,
        metadata: {
          userId: user.id.toString(),
          tier: tier,
        },
      });
      
      res.json({ url: session.url });
    } catch (error: any) {
      console.error("Error creating checkout session:", error);
      res.status(500).json({ message: error.message || "Failed to create checkout session" });
    }
  });
  
  // Stripe webhook handler
  app.post("/api/stripe/webhook", express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      console.error("⚠️ STRIPE_WEBHOOK_SECRET not configured");
      return res.status(500).send('Webhook secret not configured');
    }
    
    let event;
    
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err: any) {
      console.error('⚠️ Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    
    // Handle the event
    try {
      switch (event.type) {
        case 'checkout.session.completed':
          const session = event.data.object;
          const userId = parseInt(session.metadata.userId);
          const tier = session.metadata.tier;
          
          // Update user subscription
          await storage.updateUserSubscription(userId, {
            subscriptionTier: tier,
            stripeSubscriptionId: session.subscription as string,
            subscriptionStatus: 'active',
          });
          
          console.log(`✅ Subscription activated for user ${userId}, tier: ${tier}`);
          break;
          
        case 'customer.subscription.updated':
          const subscription = event.data.object;
          const updateUserId = parseInt(subscription.metadata.userId || '0');
          
          if (updateUserId) {
            await storage.updateUserSubscription(updateUserId, {
              subscriptionStatus: subscription.status === 'active' ? 'active' : 'paused',
            });
            console.log(`✅ Subscription updated for user ${updateUserId}, status: ${subscription.status}`);
          }
          break;
          
        case 'customer.subscription.deleted':
          const canceledSub = event.data.object;
          const cancelUserId = parseInt(canceledSub.metadata.userId || '0');
          
          if (cancelUserId) {
            await storage.updateUserSubscription(cancelUserId, {
              subscriptionTier: 'free',
              subscriptionStatus: 'free',
              stripeSubscriptionId: null,
            });
            console.log(`✅ Subscription canceled for user ${cancelUserId}`);
          }
          break;
          
        default:
          console.log(`Unhandled event type ${event.type}`);
      }
      
      res.json({ received: true });
    } catch (error: any) {
      console.error('Error handling webhook:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // Get subscription status
  app.get("/api/stripe/subscription-status", flexibleAuth, async (req, res) => {
    try {
      const userId = req.userId;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({
        tier: user.subscriptionTier || 'free',
        status: user.subscriptionStatus || 'free',
        stripeCustomerId: user.stripeCustomerId,
        stripeSubscriptionId: user.stripeSubscriptionId,
        gymApprovalStatus: user.gymApprovalStatus || 'none',
      });
    } catch (error) {
      console.error("Error fetching subscription status:", error);
      res.status(500).json({ message: "Failed to fetch subscription status" });
    }
  });

  // Get storage usage and quota
  app.get("/api/storage/usage", flexibleAuth, async (req, res) => {
    try {
      const userId = req.userId;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { 
        getStorageQuota, 
        getRemainingStorage, 
        getStoragePercentage, 
        formatBytes,
        getStorageTierInfo 
      } = await import('./storageUtils');
      
      const subscriptionTier = user.subscriptionTier || 'free';
      const storageUsed = user.storageUsed || 0;
      const quota = getStorageQuota(subscriptionTier);
      const remaining = getRemainingStorage(storageUsed, subscriptionTier);
      const percentage = getStoragePercentage(storageUsed, subscriptionTier);
      const tierInfo = getStorageTierInfo(subscriptionTier);
      
      res.json({
        storageUsed,
        storageUsedFormatted: formatBytes(storageUsed),
        quota,
        quotaFormatted: tierInfo.quotaFormatted,
        remaining,
        remainingFormatted: formatBytes(remaining),
        percentage,
        tier: subscriptionTier,
        tierName: tierInfo.tierName,
      });
    } catch (error) {
      console.error("Error fetching storage usage:", error);
      res.status(500).json({ message: "Failed to fetch storage usage" });
    }
  });

  // Global error handler - ensures all errors return JSON instead of HTML
  app.use((err: any, req: any, res: any, next: any) => {
    console.error('❌ Global error handler caught:', err.message);
    console.error('❌ Error stack:', err.stack);
    
    // If headers already sent, delegate to Express default error handler
    if (res.headersSent) {
      return next(err);
    }
    
    // Return JSON error response
    res.status(err.status || 500).json({
      message: err.message || 'Internal server error',
      error: err.name || 'SERVER_ERROR'
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}

