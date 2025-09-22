import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { pool } from "./db";

import { insertClassSchema, insertVideoSchema, insertNoteSchema, insertDrawingSchema, insertBeltSchema, insertWeeklyCommitmentSchema, insertTrainingVideoSchema, insertUserSchema } from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import * as nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { sendWelcomeEmail, sendPasswordResetEmail } from "./emailService";

// JWT secret - in production, use a secure environment variable
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this-in-production";

// UUID namespace for deterministic UUID generation
const UUID_NAMESPACE = "6ba7b810-9dad-11d1-80b4-00c04fd430c8"; // Standard UUID namespace

// Simple deterministic UUID generator for user_id field
function generateUserUuid(userId: number): string {
  // Create deterministic UUID based on user ID - always returns same UUID for same user
  const hash = crypto.createHash('sha256').update(`user-${userId}`).digest('hex');
  
  // Format as proper UUID v4 structure
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    hash.slice(12, 16),
    hash.slice(16, 20),
    hash.slice(20, 32)
  ].join('-');
}

// Just create profile with UUID - skip users table since it has different ID format
async function ensureProfileWithUuid(userUuid: string): Promise<void> {
  const client = await pool.connect();
  
  try {
    // Only create profile record with UUID
    await client.query(`
      INSERT INTO profiles (id)
      VALUES ($1)
      ON CONFLICT (id) DO NOTHING
    `, [userUuid]);
    
    console.log(`✅ Profile ensured for UUID: ${userUuid}`);
  } catch (error) {
    console.error(`❌ Error ensuring profile exists:`, error);
    // Continue anyway - let the database constraint show us what's really needed
  } finally {
    client.release();
  }
}



// Authentication middleware
const authenticateToken = async (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Verify the user still exists in storage, auto-restore if needed
    let user = await storage.getUser(decoded.userId);
    if (!user) {
      console.log('Token valid but user not found in storage, userId:', decoded.userId, 'email:', decoded.email);
      
      // Auto-restore user account with premium status for known emails
      const premiumEmails = ['joe833360@gmail.com', 'Joe@cleancutconstructions.com.au', 'bjjjitsjournal@gmail.com', 'admin@apexbjj.com.au'];
      const isPremiumUser = premiumEmails.includes(decoded.email);
      
      try {
        // Check if user exists by email first (might be ID mismatch after restart)
        const existingUser = await storage.getUserByEmail(decoded.email);
        if (existingUser) {
          console.log('✅ Found existing user by email, using that account:', decoded.email);
          user = existingUser;
          // Update decoded to use correct user ID from database
          decoded.userId = existingUser.id;
        } else {
          // Create a new user account to restore session
          const tempPassword = await bcrypt.hash('temp-password-' + Date.now(), 10);
          user = await storage.createUser({
            email: decoded.email,
            password: tempPassword,
            firstName: decoded.email.split('@')[0], // Use email prefix as name
            lastName: '',
            subscriptionStatus: isPremiumUser ? 'premium' : 'free',
            subscriptionExpiresAt: isPremiumUser ? new Date('2099-12-31') : null,
          });
          
          console.log('✅ Auto-restored user account for:', decoded.email, isPremiumUser ? '(premium)' : '(free)');
        }
      } catch (error) {
        console.error('Failed to auto-restore user:', error);
        return res.status(401).json({ 
          message: 'Account data was lost due to server restart. Please register again with the same email to restore your account.',
          email: decoded.email,
          reason: 'memory_reset'
        });
      }
    }
    
    // Attach both decoded JWT data and actual user record
    req.user = { ...decoded, userId: user.id };
    req.userId = user.id;
    next();
  } catch (error: any) {
    console.error('JWT verification error:', error.message);
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
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
      
      const newUser = await storage.createUser({
        ...userData,
        password: hashedPassword,
        subscriptionStatus: isPremiumUser ? 'premium' : 'free',
        subscriptionExpiresAt: isPremiumUser ? new Date('2099-12-31') : null,
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
        console.log(`✅ Auto-upgraded ${email} to premium access`);
        
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
      
      console.log(`✅ Manually upgraded user ${userId} to premium access`);
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
      console.log(`📧 From: ${name} (${email})`);
      console.log(`📝 Subject: ${subject}`);
      console.log(`💬 Message: ${message}`);
      console.log(`⏰ Time: ${timestamp}`);
      console.log(`🌍 IP: ${contactData.ip}`);
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
        console.log(`💾 Contact saved to ${contactsFile}`);
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
        console.log('📧 Email sent successfully to joe833360@gmail.com');
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

  // Notes routes
  app.get("/api/notes", authenticateToken, async (req, res) => {
    try {
      const userId = (req as any).user.userId; // Integer user ID
      const userUuid = generateUserUuid(userId); // Convert to UUID
      const { search } = req.query;
      
      let notes;
      if (search) {
        notes = await storage.searchNotes(search as string, userUuid);
      } else {
        notes = await storage.getNotes(userUuid);
      }
      
      res.json(notes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notes" });
    }
  });

  app.post("/api/notes", authenticateToken, async (req, res) => {
    try {
      const userId = (req as any).user.userId; // This is an integer
      const userUuid = generateUserUuid(userId); // Convert to UUID
      console.log("Creating note with data:", req.body, "for user:", userId, "UUID:", userUuid);
      
      // Create the profile record with UUID
      await ensureProfileWithUuid(userUuid);
      
      const noteData = {
        title: req.body.title,
        content: req.body.content,
        tags: req.body.tags || [],
        linkedClassId: req.body.linkedClassId || null,
        linkedVideoId: req.body.linkedVideoId || null,
        userId: userUuid, // Use UUID format
        isShared: req.body.isShared || 0,
        sharedWithUsers: req.body.sharedWithUsers || []
      };
      const newNote = await storage.createNote(noteData);
      res.status(201).json(newNote);
    } catch (error: any) {
      console.error("Error creating note:", error);
      res.status(500).json({ message: "Failed to create note", error: error?.message || 'Unknown error' });
    }
  });

  app.put("/api/notes/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = (req as any).user.userId;
      const noteData = insertNoteSchema.partial().parse(req.body);
      
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
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid note data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update note" });
      }
    }
  });

  app.delete("/api/notes/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = (req as any).user.userId;
      
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
      const id = parseInt(req.params.id);
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
  app.get("/api/notes/shared", authenticateToken, async (req, res) => {
    try {
      const userId = (req as any).user.userId;
      const sharedNotes = await storage.getSharedNotes();
      
      // Include user info and like status for shared notes
      const notesWithUserInfo = await Promise.all(
        sharedNotes.map(async (note) => {
          const user = await storage.getUser(note.userId);
          const isLikedByUser = await storage.isNoteLikedByUser(note.id, userId);
          return {
            ...note,
            author: user ? {
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email
            } : null,
            isLikedByUser
          };
        })
      );
      
      res.json(notesWithUserInfo);
    } catch (error) {
      console.error("Error fetching shared notes:", error);
      res.status(500).json({ message: "Failed to fetch shared notes" });
    }
  });

  app.post("/api/notes/:id/toggle-sharing", authenticateToken, async (req, res) => {
    try {
      const noteId = parseInt(req.params.id);
      const userId = (req as any).user.userId;
      
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


  // Friend invitation route
  app.post("/api/invite-friend", authenticateToken, async (req, res) => {
    try {
      const { email } = req.body;
      const userId = (req as any).user.userId;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // In a real app, you would send an actual email invitation here
      // For now, we'll just log it and return success
      console.log(`User ${userId} invited ${email} to join BJJ Jits Journal`);
      
      res.json({ 
        message: "Invitation sent successfully",
        invitedEmail: email 
      });
    } catch (error) {
      console.error("Error sending invitation:", error);
      res.status(500).json({ message: "Failed to send invitation" });
    }
  });

  // Video upload route for notes
  app.post("/api/notes/:id/upload-video", authenticateToken, async (req, res) => {
    try {
      const noteId = parseInt(req.params.id);
      const userId = (req as any).user.userId;
      const { videoDataUrl, fileName, thumbnail } = req.body;
      
      console.log(`Video upload request for note ${noteId} by user ${userId}`);
      console.log(`File name: ${fileName}`);
      console.log(`Video data size: ${videoDataUrl ? videoDataUrl.length : 'No data'}`);
      
      if (!videoDataUrl || !fileName) {
        return res.status(400).json({ message: "Video data and filename are required" });
      }

      // In a real app, you would upload to cloud storage (AWS S3, etc.)
      // For now, we'll store the data URL directly (not recommended for production)
      const videoUrl = videoDataUrl;
      const videoThumbnail = thumbnail || null;

      // Update the note with video information
      console.log('Updating note with video data...');
      const updatedNote = await storage.updateNote(noteId, {
        videoUrl,
        videoFileName: fileName,
        videoThumbnail
      });

      console.log('Updated note result:', updatedNote ? 'Success' : 'Failed');

      if (!updatedNote) {
        return res.status(404).json({ message: "Note not found" });
      }

      console.log('Video upload completed successfully');
      res.json({ 
        message: "Video uploaded successfully",
        note: updatedNote 
      });
    } catch (error) {
      console.error("Error uploading video to note:", error);
      res.status(500).json({ message: "Failed to upload video" });
    }
  });

  // Remove video from note
  app.delete("/api/notes/:id/video", authenticateToken, async (req, res) => {
    try {
      const noteId = parseInt(req.params.id);
      const userId = (req as any).user.userId;

      const updatedNote = await storage.updateNote(noteId, {
        videoUrl: null,
        videoFileName: null,
        videoThumbnail: null
      });

      if (!updatedNote) {
        return res.status(404).json({ message: "Note not found" });
      }

      res.json({ 
        message: "Video removed successfully",
        note: updatedNote 
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
      console.log('🔍 GET /api/weekly-commitments/current called for userId:', userId);
      const commitment = await storage.getCurrentWeekCommitment(userId);
      console.log('🔍 getCurrentWeekCommitment returned:', commitment ? commitment.id : 'null');
      
      // Ensure no caching by setting appropriate headers
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      
      res.json(commitment || null);
    } catch (error) {
      console.error('❌ Error in GET /api/weekly-commitments/current:', error);
      res.status(500).json({ message: "Failed to fetch current week commitment" });
    }
  });

  app.post("/api/weekly-commitments", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      console.log('🔥 POST /api/weekly-commitments called with data:', req.body, 'userId:', userId);
      const commitmentData = insertWeeklyCommitmentSchema.parse({ ...req.body, userId });
      const newCommitment = await storage.createWeeklyCommitment(commitmentData);
      console.log('✅ Created new commitment:', newCommitment.id);
      
      // Ensure no caching
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      
      res.status(201).json(newCommitment);
    } catch (error) {
      console.error('❌ Error in POST /api/weekly-commitments:', error);
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


  const httpServer = createServer(app);
  return httpServer;
}
