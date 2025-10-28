var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/storageUtils.ts
var storageUtils_exports = {};
__export(storageUtils_exports, {
  PER_VIDEO_LIMITS: () => PER_VIDEO_LIMITS,
  STORAGE_QUOTAS: () => STORAGE_QUOTAS,
  formatBytes: () => formatBytes,
  getPerVideoLimit: () => getPerVideoLimit,
  getRemainingStorage: () => getRemainingStorage,
  getStoragePercentage: () => getStoragePercentage,
  getStorageQuota: () => getStorageQuota,
  getStorageTierInfo: () => getStorageTierInfo,
  hasStorageQuota: () => hasStorageQuota
});
function getStorageQuota(tier) {
  const normalizedTier = tier?.toLowerCase();
  return STORAGE_QUOTAS[normalizedTier] || STORAGE_QUOTAS.free;
}
function getPerVideoLimit(tier) {
  const normalizedTier = tier?.toLowerCase();
  return PER_VIDEO_LIMITS[normalizedTier] || PER_VIDEO_LIMITS.free;
}
function hasStorageQuota(currentUsage, fileSize, subscriptionTier) {
  const quota = getStorageQuota(subscriptionTier);
  return currentUsage + fileSize <= quota;
}
function getRemainingStorage(currentUsage, subscriptionTier) {
  const quota = getStorageQuota(subscriptionTier);
  return Math.max(0, quota - currentUsage);
}
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}
function getStoragePercentage(currentUsage, subscriptionTier) {
  const quota = getStorageQuota(subscriptionTier);
  if (quota === 0) return 0;
  return Math.min(100, Math.round(currentUsage / quota * 100));
}
function getStorageTierInfo(subscriptionTier) {
  const quota = getStorageQuota(subscriptionTier);
  const quotaFormatted = formatBytes(quota);
  let tierName = "Free";
  if (subscriptionTier === "enthusiast") {
    tierName = "BJJ Enthusiast";
  } else if (subscriptionTier === "gym_pro") {
    tierName = "Gym Pro";
  }
  return { quota, quotaFormatted, tierName };
}
var STORAGE_QUOTAS, PER_VIDEO_LIMITS;
var init_storageUtils = __esm({
  "server/storageUtils.ts"() {
    "use strict";
    STORAGE_QUOTAS = {
      free: 10 * 1024 * 1024 * 1024,
      // 10 GB total storage
      enthusiast: 75 * 1024 * 1024 * 1024,
      // 75 GB total storage
      gym_pro: 150 * 1024 * 1024 * 1024
      // 150 GB total storage
    };
    PER_VIDEO_LIMITS = {
      free: 100 * 1024 * 1024,
      // 100 MB per video
      enthusiast: 500 * 1024 * 1024,
      // 500 MB per video
      gym_pro: 500 * 1024 * 1024
      // 500 MB per video
    };
  }
});

// server/r2Storage.ts
var r2Storage_exports = {};
__export(r2Storage_exports, {
  deleteFromR2: () => deleteFromR2,
  getR2FileSize: () => getR2FileSize,
  getR2SignedUrl: () => getR2SignedUrl,
  r2FileExists: () => r2FileExists,
  uploadToR2: () => uploadToR2
});
import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
function getR2Client() {
  if (!process.env.R2_ENDPOINT) {
    throw new Error("R2_ENDPOINT environment variable is not set");
  }
  if (!process.env.R2_ACCESS_KEY_ID) {
    throw new Error("R2_ACCESS_KEY_ID environment variable is not set");
  }
  if (!process.env.R2_SECRET_ACCESS_KEY) {
    throw new Error("R2_SECRET_ACCESS_KEY environment variable is not set");
  }
  return new S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
    }
  });
}
async function uploadToR2(fileBuffer, fileName, contentType) {
  const key = `videos/${Date.now()}-${fileName}`;
  const client = getR2Client();
  await client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType
    })
  );
  const publicUrl = process.env.R2_PUBLIC_URL || "https://pub-d4f8dc9cccab4b579387a4fe9c0abf18.r2.dev";
  const url = `${publicUrl}/${key}`;
  return { url, key };
}
async function deleteFromR2(key) {
  const client = getR2Client();
  await client.send(
    new DeleteObjectCommand({
      Bucket: R2_BUCKET,
      Key: key
    })
  );
}
async function getR2FileSize(key) {
  const client = getR2Client();
  const response = await client.send(
    new HeadObjectCommand({
      Bucket: R2_BUCKET,
      Key: key
    })
  );
  return response.ContentLength || 0;
}
async function getR2SignedUrl(key, expiresIn = 3600) {
  const client = getR2Client();
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key
  });
  return await getSignedUrl(client, command, { expiresIn });
}
async function r2FileExists(key) {
  try {
    const client = getR2Client();
    await client.send(
      new HeadObjectCommand({
        Bucket: R2_BUCKET,
        Key: key
      })
    );
    return true;
  } catch (error) {
    return false;
  }
}
var R2_BUCKET;
var init_r2Storage = __esm({
  "server/r2Storage.ts"() {
    "use strict";
    R2_BUCKET = process.env.R2_BUCKET_NAME || "itsjournal-videos";
  }
});

// server/index.ts
import express3 from "express";

// server/routes.ts
import express from "express";
import { createServer } from "http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  appNotes: () => appNotes,
  authIdentities: () => authIdentities,
  belts: () => belts,
  classes: () => classes,
  drawings: () => drawings,
  gamePlans: () => gamePlans,
  gymMemberships: () => gymMemberships,
  gyms: () => gyms,
  insertAppNoteSchema: () => insertAppNoteSchema,
  insertAuthIdentitySchema: () => insertAuthIdentitySchema,
  insertBeltSchema: () => insertBeltSchema,
  insertClassSchema: () => insertClassSchema,
  insertDrawingSchema: () => insertDrawingSchema,
  insertGamePlanSchema: () => insertGamePlanSchema,
  insertGymMembershipSchema: () => insertGymMembershipSchema,
  insertGymSchema: () => insertGymSchema,
  insertNoteLikeSchema: () => insertNoteLikeSchema,
  insertNoteSchema: () => insertNoteSchema,
  insertPasswordResetTokenSchema: () => insertPasswordResetTokenSchema,
  insertProfileSchema: () => insertProfileSchema,
  insertTrainingVideoSchema: () => insertTrainingVideoSchema,
  insertUserSchema: () => insertUserSchema,
  insertVideoSchema: () => insertVideoSchema,
  insertWeeklyCommitmentSchema: () => insertWeeklyCommitmentSchema,
  noteLikes: () => noteLikes,
  notes: () => notes,
  passwordResetTokens: () => passwordResetTokens,
  profiles: () => profiles,
  trainingVideos: () => trainingVideos,
  users: () => users,
  videos: () => videos,
  weeklyCommitments: () => weeklyCommitments
});
import { pgTable, text, serial, integer, timestamp, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var classes = pgTable("classes", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull(),
  time: text("time").notNull(),
  // Time in HH:MM format (24-hour)
  duration: integer("duration").notNull(),
  // in minutes
  classType: text("class_type").notNull(),
  instructor: text("instructor").notNull(),
  trainingPartners: text("training_partners").array(),
  techniquesFocused: text("techniques_focused"),
  // Rolling tracking fields
  rollingPartners: text("rolling_partners").array(),
  // Partners you rolled with
  yourSubmissions: integer("your_submissions").default(0),
  // Subs you got
  partnerSubmissions: integer("partner_submissions").default(0),
  // Subs your partners got
  cardioRating: integer("cardio_rating"),
  // 1-5 scale for how you felt
  userId: integer("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow()
});
var videos = pgTable("videos", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  url: text("url").notNull(),
  category: text("category").notNull(),
  tags: text("tags").array(),
  isFavorite: integer("is_favorite").default(0),
  // 0 = false, 1 = true
  duration: text("duration"),
  // e.g., "12:45"
  thumbnailUrl: text("thumbnail_url"),
  createdAt: timestamp("created_at").defaultNow()
});
var notes = pgTable("notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: text("content").notNull(),
  tags: text("tags").array(),
  linkedClassId: integer("linked_class_id"),
  linkedVideoId: integer("linked_video_id"),
  userId: integer("user_id").notNull().references(() => users.id),
  // Direct integer reference to users table
  isShared: integer("is_shared").default(0),
  // 0 = private, 1 = shared to community
  gymId: integer("gym_id").references(() => gyms.id),
  // If shared to a specific gym
  sharedWithUsers: text("shared_with_users").array(),
  // array of user IDs
  videoUrl: text("video_url"),
  // URL to uploaded video file
  videoFileName: text("video_file_name"),
  // Original filename
  videoFileSize: integer("video_file_size"),
  // File size in bytes
  videoThumbnail: text("video_thumbnail"),
  // Thumbnail URL
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var drawings = pgTable("drawings", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  canvasData: text("canvas_data").notNull(),
  // JSON string of canvas data
  linkedNoteId: integer("linked_note_id"),
  linkedClassId: integer("linked_class_id"),
  userId: integer("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow()
});
var belts = pgTable("belts", {
  id: serial("id").primaryKey(),
  belt: text("belt").notNull(),
  // white, blue, purple, brown, black
  stripes: integer("stripes").notNull().default(0),
  // 0-4 stripes
  promotionDate: timestamp("promotion_date").notNull(),
  instructor: text("instructor"),
  notes: text("notes"),
  userId: integer("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow()
});
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").unique().notNull(),
  password: text("password"),
  // Nullable - Supabase Auth handles passwords
  firstName: text("first_name"),
  lastName: text("last_name"),
  subscriptionTier: text("subscription_tier").default("free"),
  // free, enthusiast, gym_pro
  stripeCustomerId: text("stripe_customer_id"),
  // Stripe customer ID
  stripeSubscriptionId: text("stripe_subscription_id"),
  // Stripe subscription ID
  subscriptionStatus: text("subscription_status").default("free"),
  // free, premium, active
  subscriptionPlan: text("subscription_plan"),
  // Added for RevenueCat subscription plans
  revenuecatCustomerId: text("revenuecat_customer_id"),
  // Added for RevenueCat integration
  subscriptionExpiresAt: timestamp("subscription_expires_at"),
  gymApprovalStatus: text("gym_approval_status").default("none"),
  // none, pending, approved, rejected
  classCount: integer("class_count").default(0),
  // Track classes logged for free tier limit
  noteCount: integer("note_count").default(0),
  // Track notes created for free tier limit
  weeklyShareCount: integer("weekly_share_count").default(0),
  // Track community shares this week
  shareResetDate: timestamp("share_reset_date"),
  // When to reset weekly share count
  storageUsed: integer("storage_used").default(0),
  // Total video storage used in bytes
  role: text("role").default("user"),
  // user, admin
  createdAt: timestamp("created_at").defaultNow(),
  supabaseUid: varchar("supabase_uid").unique()
  // Link to Supabase Auth
});
var profiles = pgTable("profiles", {
  id: varchar("id").primaryKey()
  // UUID format to match Supabase auth.users(id)
});
var authIdentities = pgTable("auth_identities", {
  userId: integer("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  supabaseUid: varchar("supabase_uid").unique().notNull()
});
var appNotes = pgTable("app_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: text("content").notNull(),
  tags: text("tags").array(),
  linkedClassId: integer("linked_class_id"),
  linkedVideoId: integer("linked_video_id"),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  isShared: integer("is_shared").default(0),
  // 0 = private, 1 = shared
  sharedWithUsers: text("shared_with_users").array(),
  // array of user IDs
  videoUrl: text("video_url"),
  // URL to uploaded video file
  videoFileName: text("video_file_name"),
  // Original filename
  videoFileSize: integer("video_file_size"),
  // File size in bytes
  videoThumbnail: text("video_thumbnail"),
  // Thumbnail URL
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var weeklyCommitments = pgTable("weekly_commitments", {
  id: serial("id").primaryKey(),
  weekStartDate: timestamp("week_start_date").notNull(),
  // Sunday of the week
  targetClasses: integer("target_classes").notNull(),
  completedClasses: integer("completed_classes").default(0),
  isCompleted: integer("is_completed").default(0),
  // 0 = false, 1 = true
  userId: integer("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var trainingVideos = pgTable("training_videos", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  videoUrl: text("video_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  uploadedBy: integer("uploaded_by").references(() => users.id).notNull(),
  isPublic: integer("is_public").default(1),
  // 0 = private, 1 = public
  tags: text("tags").array(),
  category: text("category"),
  duration: integer("duration"),
  // in seconds
  views: integer("views").default(0),
  likes: integer("likes").default(0),
  createdAt: timestamp("created_at").defaultNow()
});
var passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  token: text("token").notNull().unique(),
  userId: integer("user_id").references(() => users.id).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  used: integer("used").default(0),
  // 0 = not used, 1 = used
  createdAt: timestamp("created_at").defaultNow()
});
var noteLikes = pgTable("note_likes", {
  id: serial("id").primaryKey(),
  noteId: varchar("note_id").references(() => notes.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow()
});
var gamePlans = pgTable("game_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: integer("user_id").references(() => users.id).notNull(),
  planName: text("plan_name").notNull(),
  // e.g., "Guard Passing Strategy", "Closed Guard Game"
  moveName: text("move_name").notNull(),
  // The specific technique/move
  description: text("description"),
  // Detailed notes about the move
  parentId: varchar("parent_id"),
  // Self-reference for tree structure, null for root moves
  moveOrder: integer("move_order").default(0),
  // Order among siblings
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var gyms = pgTable("gyms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  // Unique code to join gym
  ownerId: integer("owner_id").references(() => users.id).notNull(),
  // Admin who created the gym
  createdAt: timestamp("created_at").defaultNow()
});
var gymMemberships = pgTable("gym_memberships", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  gymId: integer("gym_id").references(() => gyms.id).notNull(),
  role: text("role").notNull().default("member"),
  // 'admin' or 'member'
  createdAt: timestamp("created_at").defaultNow()
});
var insertClassSchema = createInsertSchema(classes).omit({
  id: true,
  createdAt: true
}).extend({
  // Make some fields optional for easier form submission
  date: z.coerce.date(),
  // Convert string dates to Date objects
  trainingPartners: z.array(z.string()).optional(),
  techniquesFocused: z.string().optional()
});
var insertVideoSchema = createInsertSchema(videos).omit({
  id: true,
  createdAt: true
}).extend({
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isFavorite: z.number().optional(),
  duration: z.string().optional(),
  thumbnailUrl: z.string().optional()
});
var insertNoteSchema = createInsertSchema(notes).omit({
  id: true,
  createdAt: true,
  updatedAt: true
}).extend({
  tags: z.array(z.string()).optional(),
  linkedClassId: z.number().optional(),
  linkedVideoId: z.number().optional(),
  userId: z.string().optional(),
  // UUID format to match database structure
  isShared: z.number().optional(),
  gymId: z.number().optional(),
  // Optional gym ID for gym-specific sharing
  sharedWithUsers: z.array(z.string()).optional()
});
var insertDrawingSchema = createInsertSchema(drawings).omit({
  id: true,
  createdAt: true
}).extend({
  linkedNoteId: z.number().optional(),
  linkedClassId: z.number().optional()
});
var insertBeltSchema = createInsertSchema(belts).omit({
  id: true,
  createdAt: true
}).extend({
  promotionDate: z.coerce.date(),
  instructor: z.string().optional(),
  notes: z.string().optional()
});
var insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true
}).extend({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  subscriptionStatus: z.enum(["free", "premium", "active", "paused"]).optional(),
  subscriptionExpiresAt: z.date().optional(),
  supabaseId: z.string().optional()
  // Accept Supabase UUID
});
var insertProfileSchema = createInsertSchema(profiles);
var insertAuthIdentitySchema = createInsertSchema(authIdentities);
var insertAppNoteSchema = createInsertSchema(appNotes).omit({
  id: true,
  createdAt: true,
  updatedAt: true
}).extend({
  tags: z.array(z.string()).optional(),
  linkedClassId: z.number().optional(),
  linkedVideoId: z.number().optional(),
  isShared: z.number().optional(),
  sharedWithUsers: z.array(z.string()).optional()
});
var insertWeeklyCommitmentSchema = createInsertSchema(weeklyCommitments).omit({
  id: true,
  createdAt: true
}).extend({
  weekStartDate: z.coerce.date(),
  targetClasses: z.number().min(1).max(10),
  completedClasses: z.number().default(0),
  isCompleted: z.number().default(0)
});
var insertTrainingVideoSchema = createInsertSchema(trainingVideos).omit({
  id: true,
  createdAt: true
}).extend({
  description: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  tags: z.array(z.string()).optional(),
  category: z.string().optional(),
  duration: z.number().optional(),
  views: z.number().default(0),
  likes: z.number().default(0)
});
var insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).omit({
  id: true,
  createdAt: true
});
var insertNoteLikeSchema = createInsertSchema(noteLikes).omit({
  id: true,
  createdAt: true
});
var insertGamePlanSchema = createInsertSchema(gamePlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true
}).extend({
  description: z.string().optional(),
  parentId: z.string().optional(),
  moveOrder: z.number().optional()
});
var insertGymSchema = createInsertSchema(gyms).omit({
  id: true,
  createdAt: true
}).extend({
  code: z.string().optional(),
  ownerId: z.number().optional()
});
var insertGymMembershipSchema = createInsertSchema(gymMemberships).omit({
  id: true,
  createdAt: true
}).extend({
  role: z.enum(["admin", "member"]).default("member")
});

// server/db.ts
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
var DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}
var pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
  // Supabase requires SSL
});
var db = drizzle(pool, { schema: schema_exports });

// server/storage.ts
import { eq, desc, asc, ilike, and, or, lt, count } from "drizzle-orm";
var DatabaseStorage = class {
  // Users
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || void 0;
  }
  async getUserByEmail(email) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || void 0;
  }
  async createUser(userData) {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }
  async updateUser(id, userData) {
    const [user] = await db.update(users).set(userData).where(eq(users.id, id)).returning();
    return user || void 0;
  }
  // Classes
  async getClasses(userId) {
    if (userId) {
      return db.select().from(classes).where(eq(classes.userId, userId)).orderBy(desc(classes.date));
    }
    return db.select().from(classes).orderBy(desc(classes.date));
  }
  async getClass(id) {
    const [classItem] = await db.select().from(classes).where(eq(classes.id, id));
    return classItem || void 0;
  }
  async createClass(classData) {
    const [classItem] = await db.insert(classes).values(classData).returning();
    return classItem;
  }
  async updateClass(id, classData) {
    const [classItem] = await db.update(classes).set(classData).where(eq(classes.id, id)).returning();
    return classItem || void 0;
  }
  async deleteClass(id) {
    const result = await db.delete(classes).where(eq(classes.id, id));
    return (result.rowCount || 0) > 0;
  }
  // Notes - using persistent Supabase database storage
  async getNotes(userId) {
    if (userId) {
      return db.select().from(notes).where(eq(notes.userId, userId)).orderBy(desc(notes.createdAt)).limit(50);
    }
    return db.select().from(notes).orderBy(desc(notes.createdAt)).limit(50);
  }
  async getNote(id) {
    const [note] = await db.select().from(notes).where(eq(notes.id, id));
    return note || void 0;
  }
  async createNote(noteData) {
    const [note] = await db.insert(notes).values(noteData).returning();
    return note;
  }
  async updateNote(id, noteData) {
    const [note] = await db.update(notes).set(noteData).where(eq(notes.id, id)).returning();
    return note || void 0;
  }
  async deleteNote(id) {
    const result = await db.delete(notes).where(eq(notes.id, id));
    return (result.rowCount || 0) > 0;
  }
  // Videos  
  async getVideos(userId) {
    return db.select().from(videos).orderBy(desc(videos.createdAt));
  }
  async getVideo(id) {
    const [video] = await db.select().from(videos).where(eq(videos.id, id));
    return video || void 0;
  }
  async createVideo(videoData) {
    const [video] = await db.insert(videos).values(videoData).returning();
    return video;
  }
  async updateVideo(id, videoData) {
    const [video] = await db.update(videos).set(videoData).where(eq(videos.id, id)).returning();
    return video || void 0;
  }
  async deleteVideo(id) {
    const result = await db.delete(videos).where(eq(videos.id, id));
    return (result.rowCount || 0) > 0;
  }
  // Drawings
  async getDrawings(userId) {
    return db.select().from(drawings).orderBy(desc(drawings.createdAt));
  }
  async getDrawing(id) {
    const [drawing] = await db.select().from(drawings).where(eq(drawings.id, id));
    return drawing || void 0;
  }
  async createDrawing(drawingData) {
    const [drawing] = await db.insert(drawings).values(drawingData).returning();
    return drawing;
  }
  async updateDrawing(id, drawingData) {
    const [drawing] = await db.update(drawings).set(drawingData).where(eq(drawings.id, id)).returning();
    return drawing || void 0;
  }
  async deleteDrawing(id) {
    const result = await db.delete(drawings).where(eq(drawings.id, id));
    return (result.rowCount || 0) > 0;
  }
  // Belts
  async getBelts(userId) {
    if (userId) {
      return db.select().from(belts).where(eq(belts.userId, userId)).orderBy(desc(belts.promotionDate));
    }
    return db.select().from(belts).orderBy(desc(belts.promotionDate));
  }
  async getBelt(id) {
    const [belt] = await db.select().from(belts).where(eq(belts.id, id));
    return belt || void 0;
  }
  async createBelt(beltData) {
    const [belt] = await db.insert(belts).values(beltData).returning();
    return belt;
  }
  async updateBelt(id, beltData) {
    const [belt] = await db.update(belts).set(beltData).where(eq(belts.id, id)).returning();
    return belt || void 0;
  }
  async deleteBelt(id) {
    const result = await db.delete(belts).where(eq(belts.id, id));
    return (result.rowCount || 0) > 0;
  }
  // Weekly Commitments
  async getWeeklyCommitments(userId) {
    if (userId) {
      return db.select().from(weeklyCommitments).where(eq(weeklyCommitments.userId, userId)).orderBy(desc(weeklyCommitments.weekStartDate));
    }
    return db.select().from(weeklyCommitments).orderBy(desc(weeklyCommitments.weekStartDate));
  }
  async getCurrentWeekCommitment(userId) {
    const now = /* @__PURE__ */ new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    startOfWeek.setHours(0, 0, 0, 0);
    if (userId) {
      const [commitment2] = await db.select().from(weeklyCommitments).where(and(eq(weeklyCommitments.userId, userId), eq(weeklyCommitments.weekStartDate, startOfWeek)));
      return commitment2 || void 0;
    }
    const [commitment] = await db.select().from(weeklyCommitments).where(eq(weeklyCommitments.weekStartDate, startOfWeek));
    return commitment || void 0;
  }
  async createWeeklyCommitment(commitmentData) {
    const [commitment] = await db.insert(weeklyCommitments).values(commitmentData).returning();
    return commitment;
  }
  async updateWeeklyCommitment(id, commitmentData) {
    const [commitment] = await db.update(weeklyCommitments).set(commitmentData).where(eq(weeklyCommitments.id, id)).returning();
    return commitment || void 0;
  }
  async deleteWeeklyCommitment(id) {
    const result = await db.delete(weeklyCommitments).where(eq(weeklyCommitments.id, id));
    return (result.rowCount || 0) > 0;
  }
  // Training Videos
  async getTrainingVideos() {
    return db.select().from(trainingVideos).orderBy(desc(trainingVideos.id));
  }
  async getTrainingVideo(id) {
    const [video] = await db.select().from(trainingVideos).where(eq(trainingVideos.id, id));
    return video || void 0;
  }
  async createTrainingVideo(videoData) {
    const [video] = await db.insert(trainingVideos).values(videoData).returning();
    return video;
  }
  async updateTrainingVideo(id, videoData) {
    const [video] = await db.update(trainingVideos).set(videoData).where(eq(trainingVideos.id, id)).returning();
    return video || void 0;
  }
  async deleteTrainingVideo(id) {
    const result = await db.delete(trainingVideos).where(eq(trainingVideos.id, id));
    return (result.rowCount || 0) > 0;
  }
  // Note Sharing
  async toggleNoteSharing(noteId, userId) {
    const note = await this.getNote(noteId);
    if (!note || note.userId !== userId) return void 0;
    const newValue = note.isShared ? 0 : 1;
    const [updatedNote] = await db.update(notes).set({ isShared: newValue }).where(eq(notes.id, noteId)).returning();
    return updatedNote || void 0;
  }
  async getSharedNotes() {
    const results = await db.select({
      // All note fields
      id: notes.id,
      title: notes.title,
      content: notes.content,
      tags: notes.tags,
      linkedClassId: notes.linkedClassId,
      linkedVideoId: notes.linkedVideoId,
      userId: notes.userId,
      isShared: notes.isShared,
      gymId: notes.gymId,
      sharedWithUsers: notes.sharedWithUsers,
      videoUrl: notes.videoUrl,
      videoFileName: notes.videoFileName,
      videoFileSize: notes.videoFileSize,
      videoThumbnail: notes.videoThumbnail,
      createdAt: notes.createdAt,
      updatedAt: notes.updatedAt,
      // User info fields
      authorFirstName: users.firstName,
      authorLastName: users.lastName,
      authorEmail: users.email,
      // Like count (use COUNT with group by)
      likeCount: count(noteLikes.id)
    }).from(notes).leftJoin(users, eq(notes.userId, users.id)).leftJoin(noteLikes, eq(notes.id, noteLikes.noteId)).where(eq(notes.isShared, 1)).groupBy(
      notes.id,
      users.firstName,
      users.lastName,
      users.email
    ).orderBy(desc(notes.createdAt)).limit(50);
    return results.map((r) => ({
      id: r.id,
      title: r.title,
      content: r.content,
      tags: r.tags,
      linkedClassId: r.linkedClassId,
      linkedVideoId: r.linkedVideoId,
      userId: r.userId,
      isShared: r.isShared,
      gymId: r.gymId,
      sharedWithUsers: r.sharedWithUsers,
      videoUrl: r.videoUrl,
      videoFileName: r.videoFileName,
      videoFileSize: r.videoFileSize,
      videoThumbnail: r.videoThumbnail,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      author: r.authorEmail ? {
        firstName: r.authorFirstName,
        lastName: r.authorLastName,
        email: r.authorEmail
      } : null,
      likeCount: Number(r.likeCount)
    }));
  }
  // Password Reset Tokens
  async createPasswordResetToken(userId, token, expiresAt) {
    const [resetToken] = await db.insert(passwordResetTokens).values({
      userId,
      token,
      expiresAt,
      used: 0
    }).returning();
    return resetToken;
  }
  async getPasswordResetToken(token) {
    const [resetToken] = await db.select().from(passwordResetTokens).where(eq(passwordResetTokens.token, token));
    return resetToken || void 0;
  }
  async markPasswordResetTokenAsUsed(tokenId) {
    await db.update(passwordResetTokens).set({ used: 1 }).where(eq(passwordResetTokens.id, tokenId));
  }
  async deleteExpiredPasswordResetTokens() {
    const now = /* @__PURE__ */ new Date();
    await db.delete(passwordResetTokens).where(
      and(eq(passwordResetTokens.used, 1), lt(passwordResetTokens.expiresAt, now))
    );
  }
  // Note Likes
  async likeNote(noteId, userId) {
    try {
      await db.insert(noteLikes).values({ noteId, userId });
      return true;
    } catch {
      return false;
    }
  }
  async unlikeNote(noteId, userId) {
    const result = await db.delete(noteLikes).where(and(eq(noteLikes.noteId, noteId), eq(noteLikes.userId, userId)));
    return (result.rowCount || 0) > 0;
  }
  async getNoteLikes(noteId) {
    return db.select().from(noteLikes).where(eq(noteLikes.noteId, noteId));
  }
  async getUserNoteLikes(userId) {
    return db.select().from(noteLikes).where(eq(noteLikes.userId, userId));
  }
  async isNoteLikedByUser(noteId, userId) {
    const [like] = await db.select().from(noteLikes).where(and(eq(noteLikes.noteId, noteId), eq(noteLikes.userId, userId)));
    return !!like;
  }
  async getNoteWithLikes(noteId, userId) {
    const note = await this.getNote(noteId);
    if (!note) return void 0;
    const likes = await this.getNoteLikes(noteId);
    const isLikedByUser = userId ? await this.isNoteLikedByUser(noteId, userId) : false;
    return {
      ...note,
      likeCount: likes.length,
      isLikedByUser
    };
  }
  // Helper methods
  async getVideosByCategory(category) {
    return db.select().from(videos).where(eq(videos.category, category));
  }
  async searchVideos(query) {
    return db.select().from(videos).where(
      or(
        ilike(videos.title, `%${query}%`),
        ilike(videos.description, `%${query}%`)
      )
    );
  }
  async searchNotes(query, userId) {
    const searchCondition = or(
      ilike(notes.title, `%${query}%`),
      ilike(notes.content, `%${query}%`)
    );
    if (userId) {
      return db.select().from(notes).where(and(eq(notes.userId, userId), searchCondition)).orderBy(desc(notes.createdAt));
    }
    return db.select().from(notes).where(searchCondition).orderBy(desc(notes.createdAt));
  }
  async shareNote(noteId, targetUserId) {
    try {
      const note = await this.getNote(noteId);
      if (!note) return false;
      const sharedUsers = note.sharedWithUsers || [];
      if (!sharedUsers.includes(targetUserId.toString())) {
        sharedUsers.push(targetUserId.toString());
        await db.update(notes).set({ sharedWithUsers: sharedUsers }).where(eq(notes.id, noteId));
      }
      return true;
    } catch {
      return false;
    }
  }
  async getClassStats(userId) {
    const userClasses = await this.getClasses(userId);
    const userBelts = await this.getBelts(userId);
    const currentBelt = userBelts[0];
    return {
      totalClasses: userClasses.length,
      lastPromotionDate: currentBelt?.promotionDate?.toISOString(),
      currentBelt: currentBelt?.belt,
      currentStripes: currentBelt?.stripes
    };
  }
  async getCurrentBelt(userId) {
    if (userId) {
      const userBelts = await this.getBelts(userId);
      return userBelts[0];
    }
    const allBelts = await this.getBelts();
    return allBelts[0];
  }
  // Game Plans Implementation
  async getGamePlans(userId) {
    return db.select().from(gamePlans).where(eq(gamePlans.userId, userId)).orderBy(asc(gamePlans.planName), asc(gamePlans.moveOrder));
  }
  async getGamePlanNames(userId) {
    const plans = await db.select({ planName: gamePlans.planName }).from(gamePlans).where(eq(gamePlans.userId, userId)).orderBy(asc(gamePlans.planName));
    const uniquePlans = [...new Set(plans.map((p) => p.planName))];
    return uniquePlans;
  }
  async getGamePlanByName(userId, planName) {
    return db.select().from(gamePlans).where(and(
      eq(gamePlans.userId, userId),
      eq(gamePlans.planName, planName)
    )).orderBy(asc(gamePlans.moveOrder));
  }
  async createGamePlanMove(userId, moveData) {
    const [gamePlan] = await db.insert(gamePlans).values({
      userId,
      planName: moveData.planName,
      moveName: moveData.moveName,
      description: moveData.description,
      parentId: moveData.parentId || null,
      moveOrder: moveData.moveOrder || 0
    }).returning();
    return gamePlan;
  }
  async updateGamePlanMove(moveId, userId, moveData) {
    const [updated] = await db.update(gamePlans).set({
      moveName: moveData.moveName,
      description: moveData.description,
      moveOrder: moveData.moveOrder,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(and(
      eq(gamePlans.id, moveId),
      eq(gamePlans.userId, userId)
    )).returning();
    return updated || void 0;
  }
  async deleteGamePlanMove(moveId, userId) {
    const getAllDescendants = async (parentId) => {
      const children = await db.select({ id: gamePlans.id }).from(gamePlans).where(and(
        eq(gamePlans.userId, userId),
        eq(gamePlans.parentId, parentId)
      ));
      if (children.length === 0) return [];
      const childIds = children.map((c) => c.id);
      const grandchildIds = await Promise.all(
        childIds.map((id) => getAllDescendants(id))
      );
      return [...childIds, ...grandchildIds.flat()];
    };
    const descendantIds = await getAllDescendants(moveId);
    const allIds = [moveId, ...descendantIds];
    const result = await db.delete(gamePlans).where(and(
      eq(gamePlans.userId, userId),
      // Delete the move and all its descendants
      or(...allIds.map((id) => eq(gamePlans.id, id)))
    ));
    return result.rowCount ? result.rowCount > 0 : false;
  }
  // Gym Management
  async createGym(gymData) {
    const [gym] = await db.insert(gyms).values(gymData).returning();
    return gym;
  }
  async getGymByCode(code) {
    const [gym] = await db.select().from(gyms).where(eq(gyms.code, code));
    return gym || void 0;
  }
  async getAllGyms() {
    return await db.select().from(gyms).orderBy(desc(gyms.createdAt));
  }
  async getUserGyms(userId) {
    const memberships = await db.select({
      gym: gyms,
      role: gymMemberships.role
    }).from(gymMemberships).innerJoin(gyms, eq(gymMemberships.gymId, gyms.id)).where(eq(gymMemberships.userId, userId));
    return memberships.map((m) => ({ ...m.gym, userRole: m.role }));
  }
  async deleteGym(gymId) {
    await db.delete(gymMemberships).where(eq(gymMemberships.gymId, gymId));
    await db.update(notes).set({ gymId: null }).where(eq(notes.gymId, gymId));
    const result = await db.delete(gyms).where(eq(gyms.id, gymId));
    return result.rowCount ? result.rowCount > 0 : false;
  }
  async getGymNotes(gymId) {
    const gymNotes = await db.select({
      note: notes,
      user: users
    }).from(notes).innerJoin(users, eq(notes.userId, users.id)).where(eq(notes.gymId, gymId)).orderBy(desc(notes.createdAt));
    return gymNotes.map((gn) => ({
      ...gn.note,
      author: {
        firstName: gn.user.firstName,
        lastName: gn.user.lastName,
        email: gn.user.email
      }
    }));
  }
  async shareNoteToGym(noteId, gymId) {
    await db.update(notes).set({ gymId, isShared: 0 }).where(eq(notes.id, noteId));
  }
  async unshareNoteFromGym(noteId) {
    await db.update(notes).set({ gymId: null }).where(eq(notes.id, noteId));
  }
  async createGymMembership(membershipData) {
    const [membership] = await db.insert(gymMemberships).values(membershipData).returning();
    return membership;
  }
  async getGymMembership(userId, gymId) {
    const [membership] = await db.select().from(gymMemberships).where(and(
      eq(gymMemberships.userId, userId),
      eq(gymMemberships.gymId, gymId)
    ));
    return membership || void 0;
  }
  async updateUserStripeCustomer(userId, stripeCustomerId) {
    const [user] = await db.update(users).set({ stripeCustomerId }).where(eq(users.id, userId)).returning();
    return user || void 0;
  }
  async updateUserSubscription(userId, data) {
    const [user] = await db.update(users).set(data).where(eq(users.id, userId)).returning();
    return user || void 0;
  }
};
var storage = new DatabaseStorage();

// server/openaiService.ts
import OpenAI from "openai";
var openaiClient = null;
function getOpenAIClient() {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key not configured. Please add OPENAI_API_KEY to your environment secrets.");
    }
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
}
async function generateBJJCounterMoves(currentMove, position, context = "") {
  try {
    const openai = getOpenAIClient();
    const prompt = `You are a Brazilian Jiu-Jitsu expert. Given the following scenario, suggest 3-5 realistic counter moves or responses.

Position: ${position}
Current Move/Attack: ${currentMove}
${context ? `Additional Context: ${context}` : ""}

Provide practical BJJ counter techniques that would be appropriate responses. For each counter move, include:
1. The name of the technique
2. A brief description of how to execute it

Respond with JSON in this format: 
{
  "counterMoves": [
    {"moveName": "technique name", "description": "how to execute"},
    ...
  ]
}`;
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are a Brazilian Jiu-Jitsu expert coach providing technical counter move suggestions. Always provide realistic, practical techniques."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 2048
    });
    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result.counterMoves || [];
  } catch (error) {
    console.error("OpenAI counter move generation error:", error);
    if (error?.message?.includes("apiKey")) {
      throw new Error("OpenAI API key not configured. Please add OPENAI_API_KEY to your environment secrets.");
    }
    throw new Error("Failed to generate counter moves: " + error.message);
  }
}

// server/routes.ts
import { z as z2 } from "zod";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { eq as eq2, and as and2, sql as sql3 } from "drizzle-orm";
import { createClient } from "@supabase/supabase-js";
import * as nodemailer2 from "nodemailer";
import fs from "fs";
import path from "path";
import crypto from "crypto";

// server/emailService.ts
import * as nodemailer from "nodemailer";
var transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});
var sendEmail = async (options) => {
  try {
    const mailOptions = {
      from: `"Jits Journal" <${process.env.GMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || ""
    };
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.messageId);
    return true;
  } catch (error) {
    console.error("Email sending failed:", error);
    return false;
  }
};
var sendWelcomeEmail = async (userEmail, firstName) => {
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
        <h2>Hey ${firstName}! \u{1F94B}</h2>
        
        <p>Welcome to the Jits Journal family! We're excited to have you join thousands of BJJ practitioners who are already using our app to track their progress and improve their game.</p>
        
        <div class="features">
          <div class="feature">
            <h3>\u{1F4DA} Class Tracking</h3>
            <p>Log your training sessions, techniques, and progress</p>
          </div>
          <div class="feature">
            <h3>\u{1F3AF} Weekly Goals</h3>
            <p>Set and track your weekly training commitments</p>
          </div>
          <div class="feature">
            <h3>\u{1F4DD} Technique Notes</h3>
            <p>Record insights, tips, and technique breakdowns</p>
          </div>
          <div class="feature">
            <h3>\u{1F3C6} Belt Progress</h3>
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
          <a href="${process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}` : "https://jitsjournal.com"}" class="cta-button">Start Training Now</a>
        </div>
        
        <p>Need help getting started? Just reply to this email and our team will be happy to assist you!</p>
        
        <p>Train hard, stay consistent, and remember - every black belt was once a white belt who never gave up.</p>
        
        <p>Best regards,<br>
        The Jits Journal Team</p>
      </div>
      
      <div class="footer">
        <p>\xA9 2025 Jits Journal. All rights reserved.</p>
        <p>This email was sent because you signed up for Jits Journal.</p>
      </div>
    </body>
    </html>
  `;
  const text2 = `
    Welcome to Jits Journal, ${firstName}!
    
    Your ultimate BJJ training companion is ready to help you track your progress and improve your game.
    
    Features you'll love:
    - Class Tracking: Log your training sessions and progress
    - Weekly Goals: Set and track your training commitments
    - Technique Notes: Record insights and technique breakdowns
    - Belt Progress: Track promotions and stripe achievements
    
    Ready to start? Visit ${process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}` : "https://jitsjournal.com"} and begin your journey!
    
    Need help? Just reply to this email.
    
    Train hard and stay consistent!
    
    Best regards,
    The Jits Journal Team
  `;
  return await sendEmail({
    to: userEmail,
    subject,
    html,
    text: text2
  });
};
var sendInvitationEmail = async (recipientEmail, senderName) => {
  const signupUrl = `${process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}` : "https://jitsjournal.com"}/signup`;
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
          content: '\u2713';
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
        <h1>You're Invited! \u{1F94B}</h1>
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
        <p>\xA9 2025 Jits Journal. All rights reserved.</p>
        <p>You received this email because ${senderName} invited you to join Jits Journal.</p>
      </div>
    </body>
    </html>
  `;
  const text2 = `
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
    text: text2
  });
};
var sendPasswordResetEmail = async (userEmail, firstName, resetToken) => {
  const subject = "Reset Your Jits Journal Password";
  const resetUrl = `${process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}` : "https://jitsjournal.com"}/reset-password?token=${resetToken}`;
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
          <strong>\u26A0\uFE0F Important:</strong>
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
        <p>\xA9 2025 Jits Journal. All rights reserved.</p>
        <p>This email was sent because a password reset was requested for your account.</p>
      </div>
    </body>
    </html>
  `;
  const text2 = `
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
    text: text2
  });
};

// server/routes.ts
import Stripe from "stripe";
import multer from "multer";
var JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this-in-production";
var supabaseUrl = process.env.VITE_SUPABASE_URL;
var supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
var supabaseJwtSecret = process.env.SUPABASE_JWT_SECRET;
if (!supabaseUrl || !supabaseServiceKey) {
  console.warn("\xE2\u0161\xA0\xEF\xB8\x8F SUPABASE_SERVICE_ROLE_KEY not configured - Supabase token verification will be disabled");
}
var supabaseAdmin = supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;
var upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 * 1024
    // 5GB limit
  }
});
var authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }
  let decoded = null;
  let isSupabaseToken = false;
  if (supabaseJwtSecret) {
    try {
      const supabaseDecoded = jwt.verify(token, supabaseJwtSecret);
      console.log("Fast local Supabase token verified for:", supabaseDecoded.email);
      decoded = {
        email: supabaseDecoded.email,
        supabaseId: supabaseDecoded.sub
      };
      isSupabaseToken = true;
    } catch (supabaseError) {
      console.log("Not a Supabase token, trying legacy JWT...");
    }
  } else if (supabaseAdmin) {
    try {
      const { data: { user: supabaseUser }, error } = await supabaseAdmin.auth.getUser(token);
      if (supabaseUser && !error) {
        console.log("Slow API Supabase token verified for:", supabaseUser.email);
        decoded = {
          email: supabaseUser.email,
          supabaseId: supabaseUser.id
        };
        isSupabaseToken = true;
      }
    } catch (supabaseError) {
      console.log("Not a Supabase token, trying legacy JWT...");
    }
  }
  if (!decoded) {
    try {
      decoded = jwt.verify(token, JWT_SECRET);
      console.log("\xE2\u0153\u2026 Legacy JWT verified for:", decoded.email);
    } catch (error) {
      console.error("Token verification error:", error.message);
      return res.status(403).json({ message: "Invalid or expired token" });
    }
  }
  try {
    let user;
    if (isSupabaseToken) {
      user = await storage.getUserByEmail(decoded.email);
      if (!user) {
        console.log("Supabase user not found in database, auto-creating:", decoded.email);
        const premiumEmails = ["joe833360@gmail.com", "Joe@cleancutconstructions.com.au", "bjjjitsjournal@gmail.com", "admin@apexbjj.com.au"];
        const adminEmails = ["bjjjitsjournal@gmail.com", "admin@apexbjj.com.au"];
        const isPremiumUser = premiumEmails.includes(decoded.email);
        const isAdmin = adminEmails.includes(decoded.email);
        const tempPassword = await bcrypt.hash("temp-password-" + Date.now(), 10);
        user = await storage.createUser({
          email: decoded.email,
          password: tempPassword,
          firstName: decoded.email.split("@")[0],
          lastName: "",
          subscriptionStatus: isPremiumUser ? "premium" : "free",
          subscriptionExpiresAt: isPremiumUser ? /* @__PURE__ */ new Date("2099-12-31") : null,
          supabaseUid: decoded.supabaseId,
          role: isAdmin ? "admin" : "user"
        });
        console.log("\xE2\u0153\u2026 Auto-created user account for Supabase user:", decoded.email);
      }
    } else {
      user = await storage.getUser(decoded.userId);
      if (!user) {
        console.log("Token valid but user not found in storage, userId:", decoded.userId, "email:", decoded.email);
        const premiumEmails = ["joe833360@gmail.com", "Joe@cleancutconstructions.com.au", "bjjjitsjournal@gmail.com", "admin@apexbjj.com.au"];
        const isPremiumUser = premiumEmails.includes(decoded.email);
        const existingUser = await storage.getUserByEmail(decoded.email);
        if (existingUser) {
          console.log("\xE2\u0153\u2026 Found existing user by email, using that account:", decoded.email);
          user = existingUser;
        } else {
          const tempPassword = await bcrypt.hash("temp-password-" + Date.now(), 10);
          user = await storage.createUser({
            email: decoded.email,
            password: tempPassword,
            firstName: decoded.email.split("@")[0],
            lastName: "",
            subscriptionStatus: isPremiumUser ? "premium" : "free",
            subscriptionExpiresAt: isPremiumUser ? /* @__PURE__ */ new Date("2099-12-31") : null
          });
          console.log("\xE2\u0153\u2026 Auto-restored user account for:", decoded.email, isPremiumUser ? "(premium)" : "(free)");
        }
      }
    }
    req.user = { ...decoded, userId: user.id, email: user.email };
    req.userId = user.id;
    next();
  } catch (error) {
    console.error("User lookup/creation error:", error);
    return res.status(401).json({
      message: "Authentication failed",
      error: error.message
    });
  }
};
var flexibleAuth = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token) {
    let decoded = null;
    let isSupabaseToken = false;
    if (supabaseJwtSecret) {
      try {
        const supabaseDecoded = jwt.verify(token, supabaseJwtSecret);
        console.log("\u26A1 FAST: Local Supabase token verified for:", supabaseDecoded.email);
        decoded = {
          email: supabaseDecoded.email,
          supabaseId: supabaseDecoded.sub
        };
        isSupabaseToken = true;
      } catch (supabaseError) {
      }
    }
    if (!decoded && supabaseAdmin) {
      try {
        const { data: { user: supabaseUser }, error } = await supabaseAdmin.auth.getUser(token);
        if (supabaseUser && !error) {
          console.log("\u{1F40C} SLOW: API Supabase token verified for:", supabaseUser.email);
          decoded = {
            email: supabaseUser.email,
            supabaseId: supabaseUser.id
          };
          isSupabaseToken = true;
        }
      } catch (supabaseError) {
        console.log("Not a Supabase token, trying legacy JWT...");
      }
    }
    if (!decoded) {
      try {
        decoded = jwt.verify(token, JWT_SECRET);
        console.log("\u2705 Legacy JWT verified for:", decoded.email);
      } catch (error) {
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
        console.error("Error loading user from token:", error);
      }
    }
  }
  const supabaseId = req.body?.supabaseId || req.query?.supabaseId;
  if (supabaseId) {
    console.log("\u{1F4F1} Mobile auth: Using supabaseId from", req.body?.supabaseId ? "body" : "query", ":", supabaseId);
    try {
      const result = await pool.query(
        "SELECT * FROM users WHERE supabase_uid = $1",
        [supabaseId]
      );
      if (result.rows.length > 0) {
        const user = result.rows[0];
        req.userId = user.id;
        req.user = user;
        console.log("\u2705 Mobile auth successful for user:", user.id);
        return next();
      }
    } catch (error) {
      console.error("Error in mobile auth:", error);
    }
  }
  return res.status(401).json({ message: "Access token or supabaseId required" });
};
async function registerRoutes(app2) {
  app2.use((req, res, next) => {
    if (req.path.startsWith("/api/")) {
      res.set({
        "Cache-Control": "no-store, no-cache, must-revalidate, private",
        "Pragma": "no-cache",
        "Expires": "0"
      });
    }
    next();
  });
  app2.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const premiumEmails = ["joe833360@gmail.com", "Joe@cleancutconstructions.com.au", "bjjjitsjournal@gmail.com", "admin@apexbjj.com.au"];
      const isPremiumUser = premiumEmails.includes(userData.email);
      const adminEmails = ["bjjjitsjournal@gmail.com", "admin@apexbjj.com.au"];
      const isAdmin = adminEmails.includes(userData.email);
      console.log("Creating user with supabaseId:", userData.supabaseId);
      const newUser = await storage.createUser({
        ...userData,
        supabaseUid: userData.supabaseId,
        // Map supabaseId to supabaseUid for database
        password: hashedPassword,
        subscriptionStatus: isPremiumUser ? "premium" : "free",
        subscriptionExpiresAt: isPremiumUser ? /* @__PURE__ */ new Date("2099-12-31") : null,
        role: isAdmin ? "admin" : "user"
      });
      try {
        await sendWelcomeEmail(newUser.email, newUser.firstName || "");
        console.log(`Welcome email sent to ${newUser.email}`);
      } catch (error) {
        console.error("Failed to send welcome email:", error);
      }
      const token = jwt.sign(
        { userId: newUser.id, email: newUser.email },
        JWT_SECRET,
        { expiresIn: "30d" }
      );
      const { password, ...userWithoutPassword } = newUser;
      res.status(201).json({
        ...userWithoutPassword,
        token
      });
    } catch (error) {
      if (error instanceof z2.ZodError) {
        res.status(400).json({ message: "Invalid user data", errors: error.errors });
      } else {
        console.error("Registration error:", error);
        res.status(500).json({ message: "Failed to create user" });
      }
    }
  });
  app2.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.json({ message: "If the email exists, a reset link has been sent." });
      }
      const resetToken = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1e3);
      await storage.createPasswordResetToken(user.id, resetToken, expiresAt);
      try {
        await sendPasswordResetEmail(user.email, user.firstName || "", resetToken);
        console.log(`Password reset email sent to ${user.email}`);
      } catch (error) {
        console.error("Failed to send password reset email:", error);
        return res.status(500).json({ message: "Failed to send reset email" });
      }
      res.json({ message: "If the email exists, a reset link has been sent." });
    } catch (error) {
      console.error("Password reset error:", error);
      res.status(500).json({ message: "Failed to process password reset request" });
    }
  });
  app2.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      if (!token || !newPassword) {
        return res.status(400).json({ message: "Token and new password are required" });
      }
      if (newPassword.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
      }
      const resetToken = await storage.getPasswordResetToken(token);
      if (!resetToken) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }
      if (/* @__PURE__ */ new Date() > resetToken.expiresAt) {
        return res.status(400).json({ message: "Reset token has expired" });
      }
      if (resetToken.used) {
        return res.status(400).json({ message: "Reset token has already been used" });
      }
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await storage.updateUser(resetToken.userId, { password: hashedPassword });
      await storage.markPasswordResetTokenAsUsed(resetToken.id);
      res.json({ message: "Password has been successfully reset" });
    } catch (error) {
      console.error("Password reset error:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });
  app2.post("/api/auth/supabase-exchange", async (req, res) => {
    try {
      const { supabaseAccessToken } = req.body;
      if (!supabaseAccessToken) {
        return res.status(400).json({ message: "Supabase access token required" });
      }
      if (!supabaseAdmin) {
        return res.status(500).json({ message: "Supabase admin client not configured" });
      }
      const { data: { user: supabaseUser }, error } = await supabaseAdmin.auth.getUser(supabaseAccessToken);
      if (error || !supabaseUser) {
        console.error("Invalid Supabase token:", error?.message);
        return res.status(401).json({ message: "Invalid Supabase token" });
      }
      console.log("\u2705 Supabase token verified for:", supabaseUser.email);
      let user = await storage.getUserByEmail(supabaseUser.email);
      if (!user) {
        console.log("Creating new user for Supabase ID:", supabaseUser.id);
        const premiumEmails = ["joe833360@gmail.com", "Joe@cleancutconstructions.com.au", "bjjjitsjournal@gmail.com", "admin@apexbjj.com.au"];
        const adminEmails = ["bjjjitsjournal@gmail.com", "admin@apexbjj.com.au"];
        const isPremiumUser = premiumEmails.includes(supabaseUser.email);
        const isAdmin = adminEmails.includes(supabaseUser.email);
        const tempPassword = await bcrypt.hash("temp-password-" + Date.now(), 10);
        user = await storage.createUser({
          email: supabaseUser.email,
          password: tempPassword,
          firstName: supabaseUser.user_metadata?.firstName || supabaseUser.email.split("@")[0],
          lastName: supabaseUser.user_metadata?.lastName || "",
          subscriptionStatus: isPremiumUser ? "premium" : "free",
          subscriptionExpiresAt: isPremiumUser ? /* @__PURE__ */ new Date("2099-12-31") : null,
          supabaseUid: supabaseUser.id,
          role: isAdmin ? "admin" : "user"
        });
        console.log("\u2705 Created user account for Supabase user:", supabaseUser.email);
      }
      const token = jwt.sign(
        { userId: user.id, email: user.email, supabaseId: supabaseUser.id },
        JWT_SECRET,
        { expiresIn: "30d" }
      );
      console.log("\u{1F510} Issued server JWT for:", user.email);
      res.json({ token });
    } catch (error) {
      console.error("JWT exchange error:", error);
      res.status(500).json({ message: "Failed to exchange token" });
    }
  });
  app2.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      const premiumEmails = ["joe833360@gmail.com", "Joe@cleancutconstructions.com.au", "bjjjitsjournal@gmail.com", "admin@apexbjj.com.au"];
      const isPremiumUser = premiumEmails.includes(email);
      if (isPremiumUser && !user.subscriptionExpiresAt) {
        const updatedUser = await storage.updateUser(user.id, {
          subscriptionStatus: "premium",
          subscriptionExpiresAt: /* @__PURE__ */ new Date("2099-12-31")
        });
        console.log(`\xE2\u0153\u2026 Auto-upgraded ${email} to premium access`);
        if (updatedUser) {
          Object.assign(user, updatedUser);
        }
      }
      const adminEmails = ["bjjjitsjournal@gmail.com", "admin@apexbjj.com.au"];
      const isAdmin = adminEmails.includes(email);
      if (isAdmin && user.role !== "admin") {
        const updatedUser = await storage.updateUser(user.id, {
          role: "admin"
        });
        console.log(`\xE2\u0153\u2026 Auto-assigned admin role to ${email}`);
        if (updatedUser) {
          Object.assign(user, updatedUser);
        }
      }
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: "30d" }
      );
      const { password: _, ...userWithoutPassword } = user;
      res.json({
        ...userWithoutPassword,
        token
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Failed to login" });
    }
  });
  app2.get("/api/auth/me", authenticateToken, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Failed to get user" });
    }
  });
  app2.post("/api/users/:id/upgrade-premium", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const updatedUser = await storage.updateUser(userId, {
        subscriptionStatus: "premium",
        subscriptionExpiresAt: /* @__PURE__ */ new Date("2099-12-31")
      });
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      console.log(`\xE2\u0153\u2026 Manually upgraded user ${userId} to premium access`);
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Premium upgrade error:", error);
      res.status(500).json({ message: "Failed to upgrade to premium" });
    }
  });
  app2.post("/api/contact", async (req, res) => {
    try {
      const { name, email, subject, message } = req.body;
      if (!name || !email || !subject || !message) {
        return res.status(400).json({ message: "All fields are required" });
      }
      const timestamp2 = (/* @__PURE__ */ new Date()).toISOString();
      const contactData = {
        name,
        email,
        subject,
        message,
        timestamp: timestamp2,
        userAgent: req.headers["user-agent"] || "Unknown",
        ip: req.ip || "Unknown"
      };
      console.log("\n=== NEW CONTACT FORM SUBMISSION ===");
      console.log(`\xF0\u0178\u201C\xA7 From: ${name} (${email})`);
      console.log(`\xF0\u0178\u201C\x9D Subject: ${subject}`);
      console.log(`\xF0\u0178\u2019\xAC Message: ${message}`);
      console.log(`\xE2\x8F\xB0 Time: ${timestamp2}`);
      console.log(`\xF0\u0178\u0152\x8D IP: ${contactData.ip}`);
      console.log("====================================\n");
      try {
        const contactsFile = path.join(process.cwd(), "contact-submissions.json");
        let contacts = [];
        if (fs.existsSync(contactsFile)) {
          const fileData = fs.readFileSync(contactsFile, "utf8");
          contacts = JSON.parse(fileData);
        }
        contacts.push(contactData);
        fs.writeFileSync(contactsFile, JSON.stringify(contacts, null, 2));
        console.log(`\xF0\u0178\u2019\xBE Contact saved to ${contactsFile}`);
      } catch (fileError) {
        console.error("Error saving contact to file:", fileError);
      }
      try {
        const transporter2 = nodemailer2.createTransport({
          service: "gmail",
          auth: {
            user: process.env.GMAIL_USER,
            // bjjjitsjournal@gmail.com
            pass: process.env.GMAIL_APP_PASSWORD
            // Gmail app password
          }
        });
        const mailOptions = {
          from: `"BJJ Jits Journal" <${process.env.GMAIL_USER}>`,
          to: "joe833360@gmail.com",
          subject: `Contact Form: ${subject}`,
          html: `
            <h3>New Contact Form Submission</h3>
            <p><strong>From:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Subject:</strong> ${subject}</p>
            <p><strong>Message:</strong></p>
            <p>${message.replace(/\n/g, "<br>")}</p>
            <p><strong>Time:</strong> ${timestamp2}</p>
            <hr>
            <p><em>Sent from BJJ Jits Journal Contact Form</em></p>
          `,
          replyTo: email
          // User can reply directly to the sender
        };
        await transporter2.sendMail(mailOptions);
        console.log("\xF0\u0178\u201C\xA7 Email sent successfully to joe833360@gmail.com");
      } catch (emailError) {
        console.error("Email sending failed:", emailError);
      }
      res.json({ message: "Message sent successfully" });
    } catch (error) {
      console.error("Contact form error:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });
  app2.get("/api/admin/contacts", async (req, res) => {
    try {
      const contactsFile = path.join(process.cwd(), "contact-submissions.json");
      if (!fs.existsSync(contactsFile)) {
        return res.json([]);
      }
      const fileData = fs.readFileSync(contactsFile, "utf8");
      const contacts = JSON.parse(fileData);
      res.json(contacts.reverse());
    } catch (error) {
      console.error("Error reading contacts:", error);
      res.status(500).json({ message: "Failed to read contacts" });
    }
  });
  app2.get("/api/classes", authenticateToken, async (req, res) => {
    try {
      const userId = req.user.userId;
      const classes2 = await storage.getClasses(userId);
      res.json(classes2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch classes" });
    }
  });
  app2.post("/api/classes", authenticateToken, async (req, res) => {
    try {
      const userId = req.user.userId;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      console.log("\u{1F4CA} Class creation - User subscription info:", {
        userId: user.id,
        subscriptionTier: user.subscriptionTier,
        subscriptionStatus: user.subscriptionStatus,
        email: user.email
      });
      const userTier = user.subscriptionTier || "free";
      if (userTier === "free") {
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
      if (error instanceof z2.ZodError) {
        res.status(400).json({ message: "Invalid class data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create class" });
      }
    }
  });
  app2.put("/api/classes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const classData = insertClassSchema.partial().parse(req.body);
      const updatedClass = await storage.updateClass(id, classData);
      if (!updatedClass) {
        return res.status(404).json({ message: "Class not found" });
      }
      res.json(updatedClass);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        res.status(400).json({ message: "Invalid class data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update class" });
      }
    }
  });
  app2.delete("/api/classes/:id", async (req, res) => {
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
  app2.get("/api/videos", authenticateToken, async (req, res) => {
    try {
      const userId = req.user.userId;
      const { category, search } = req.query;
      let videos2;
      if (search) {
        videos2 = await storage.searchVideos(search, userId);
      } else if (category) {
        videos2 = await storage.getVideosByCategory(category, userId);
      } else {
        videos2 = await storage.getVideos(userId);
      }
      res.json(videos2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch videos" });
    }
  });
  app2.post("/api/videos", authenticateToken, async (req, res) => {
    try {
      const userId = req.user.userId;
      const videoData = insertVideoSchema.parse({ ...req.body, userId });
      const newVideo = await storage.createVideo(videoData);
      res.status(201).json(newVideo);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        res.status(400).json({ message: "Invalid video data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create video" });
      }
    }
  });
  app2.put("/api/videos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const videoData = insertVideoSchema.partial().parse(req.body);
      const updatedVideo = await storage.updateVideo(id, videoData);
      if (!updatedVideo) {
        return res.status(404).json({ message: "Video not found" });
      }
      res.json(updatedVideo);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        res.status(400).json({ message: "Invalid video data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update video" });
      }
    }
  });
  app2.delete("/api/videos/:id", async (req, res) => {
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
  app2.get("/api/notes", flexibleAuth, async (req, res) => {
    const startTime = Date.now();
    try {
      const userId = req.user.id;
      const { search } = req.query;
      let notes2;
      if (search) {
        notes2 = await storage.searchNotes(search, userId);
      } else {
        notes2 = await storage.getNotes(userId);
      }
      const duration = Date.now() - startTime;
      console.log(`\u23F1\uFE0F GET /api/notes completed in ${duration}ms for user ${userId} (${notes2.length} notes)`);
      res.json(notes2);
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`\u274C GET /api/notes failed after ${duration}ms:`, error);
      res.status(500).json({ message: "Failed to fetch notes" });
    }
  });
  app2.post("/api/notes", flexibleAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      console.log("\u{1F4DD} POST /api/notes - Creating note with data:", req.body, "for user:", userId);
      const noteData = {
        title: req.body.title,
        content: req.body.content,
        tags: req.body.tags || [],
        linkedClassId: req.body.linkedClassId || null,
        linkedVideoId: req.body.linkedVideoId || null,
        userId,
        // Use integer user ID directly
        isShared: req.body.isShared ? Number(req.body.isShared) : 0,
        // Coerce to integer
        sharedWithUsers: req.body.sharedWithUsers || []
      };
      const newNote = await storage.createNote(noteData);
      console.log("Note created successfully:", newNote);
      res.status(201).json(newNote);
    } catch (error) {
      console.error("Error creating note:", error);
      res.status(500).json({ message: "Failed to create note", error: error?.message || "Unknown error" });
    }
  });
  app2.put("/api/notes/:id", flexibleAuth, async (req, res) => {
    try {
      const id = req.params.id;
      const userId = req.user.id;
      const noteData = req.body;
      console.log("\u270F\uFE0F PUT /api/notes/:id - Updating note:", id, "for user:", userId, "with data:", noteData);
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
  app2.delete("/api/notes/:id", flexibleAuth, async (req, res) => {
    try {
      const id = req.params.id;
      const userId = req.user.id;
      console.log("\u{1F5D1}\uFE0F DELETE /api/notes/:id - Deleting note:", id, "for user:", userId, "body:", req.body);
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
  app2.delete("/api/notes/:id/admin", authenticateToken, async (req, res) => {
    try {
      const id = req.params.id;
      const userEmail = req.user.email;
      const adminEmails = ["Bjjjitsjournal@gmail.com", "bjjjitsjournal@gmail.com", "admin@apexbjj.com.au"];
      if (!adminEmails.includes(userEmail)) {
        return res.status(403).json({ message: "Admin access required" });
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
  app2.get("/api/notes/shared", flexibleAuth, async (req, res) => {
    const startTime = Date.now();
    try {
      const userId = req.user.id;
      const sharedNotes = await storage.getSharedNotes();
      const totalDuration = Date.now() - startTime;
      console.log(`\u23F1\uFE0F GET /api/notes/shared completed in ${totalDuration}ms (${sharedNotes.length} notes) - OPTIMIZED with JOIN`);
      res.json(sharedNotes.map((note) => ({
        ...note,
        isLikedByUser: false
        // TODO: Add user-specific like status in future optimization
      })));
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`\u274C GET /api/notes/shared failed after ${duration}ms:`, error);
      res.status(500).json({ message: "Failed to fetch shared notes" });
    }
  });
  app2.post("/api/notes/:id/toggle-sharing", flexibleAuth, async (req, res) => {
    try {
      const noteId = req.params.id;
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const note = await storage.getNote(noteId);
      if (!note) {
        return res.status(404).json({ message: "Note not found" });
      }
      if (note.isShared === 0) {
        if (user.subscriptionStatus === "free" || !user.subscriptionStatus) {
          return res.status(403).json({
            message: "Community sharing is a Premium feature. Upgrade to share notes with the community!"
          });
        }
        const today = /* @__PURE__ */ new Date();
        const dayOfWeek = today.getUTCDay();
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const weekStart = new Date(Date.UTC(
          today.getUTCFullYear(),
          today.getUTCMonth(),
          today.getUTCDate() - daysToMonday,
          0,
          0,
          0,
          0
        ));
        const allUserNotes = await storage.getNotes(userId);
        const sharesThisWeek = allUserNotes.filter((n) => {
          if (n.isShared !== 1 || !n.createdAt) return false;
          const shareDate = new Date(n.createdAt);
          return shareDate >= weekStart;
        }).length;
        let weeklyLimit = 0;
        if (user.subscriptionStatus === "premium" || user.subscriptionStatus === "active") {
          weeklyLimit = 1;
        } else if (user.subscriptionTier === "gym_pro") {
          weeklyLimit = 3;
        }
        if (sharesThisWeek >= weeklyLimit) {
          return res.status(403).json({
            message: `You've reached your weekly limit of ${weeklyLimit} community ${weeklyLimit === 1 ? "share" : "shares"}. Try again next week!`
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
  app2.post("/api/invite-friend", async (req, res) => {
    try {
      let userId = null;
      const supabaseId = req.query.supabaseId || req.body.supabaseId;
      if (supabaseId) {
        console.log("\u{1F4F1} Mobile auth: Using supabaseId:", supabaseId);
        const result = await pool.query(
          "SELECT * FROM users WHERE supabase_uid = $1",
          [supabaseId]
        );
        if (result.rows.length > 0) {
          userId = result.rows[0].id;
          console.log("\u2705 Mobile auth successful for user:", userId);
        }
      }
      if (!userId && req.user) {
        userId = req.user.userId;
        console.log("\u{1F510} Web auth successful for user:", userId);
      }
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      const sender = await db.select().from(users).where(eq2(users.id, userId)).limit(1);
      const senderName = sender[0] ? `${sender[0].firstName} ${sender[0].lastName}` : "Your training partner";
      const success = await sendInvitationEmail(email, senderName);
      if (success) {
        console.log(`\u2705 Invitation email sent to ${email} from ${senderName}`);
        res.json({
          message: "Invitation sent successfully",
          invitedEmail: email
        });
      } else {
        console.error(`\u274C Failed to send invitation email to ${email}`);
        res.status(500).json({ message: "Failed to send invitation" });
      }
    } catch (error) {
      console.error("Error sending invitation:", error);
      res.status(500).json({ message: "Failed to send invitation" });
    }
  });
  app2.get("/api/health", (req, res) => {
    res.status(200).json({
      status: "ok",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      version: "v1.0.75"
    });
  });
  app2.get("/api/health/r2", (req, res) => {
    const r2Status = {
      endpoint: !!process.env.R2_ENDPOINT,
      accessKeyId: !!process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: !!process.env.R2_SECRET_ACCESS_KEY,
      bucketName: !!process.env.R2_BUCKET_NAME,
      version: "v1.0.75",
      deployedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    res.json(r2Status);
  });
  app2.post("/api/notes/:id/upload-video", (req, res, next) => {
    upload.single("video")(req, res, (err) => {
      if (err) {
        console.error("\u274C Multer error:", err.message);
        return res.status(400).json({
          message: err.message || "File upload failed",
          error: "UPLOAD_ERROR"
        });
      }
      next();
    });
  }, async (req, res) => {
    try {
      console.log("\u{1F4F9} Video upload started");
      console.log("Request body keys:", Object.keys(req.body));
      console.log("File present:", !!req.file);
      const noteId = req.params.id;
      const file = req.file;
      const { fileName, fileSize, userId, thumbnail } = req.body;
      if (!userId) {
        console.error("\u274C No userId in request");
        return res.status(401).json({ message: "User ID required" });
      }
      if (!file) {
        console.error("\u274C No video file in request");
        return res.status(400).json({ message: "No video file provided" });
      }
      const parsedUserId = parseInt(userId);
      const parsedFileSize = parseInt(fileSize) || file.size;
      console.log(`\u{1F4F9} Video upload request for note ${noteId} by user ${parsedUserId}`);
      console.log(`\u{1F4F9} File name: ${fileName || file.originalname}`);
      console.log(`\u{1F4F9} File size: ${parsedFileSize} bytes (${(parsedFileSize / 1024 / 1024).toFixed(2)} MB)`);
      console.log(`\u{1F4F9} MIME type: ${file.mimetype}`);
      console.log("\u{1F4F9} Checking user and storage quota...");
      const [user] = await db.select().from(users).where(eq2(users.id, parsedUserId)).limit(1);
      if (!user) {
        console.error("\u274C User not found in database");
        return res.status(404).json({ message: "User not found" });
      }
      console.log(`\u{1F4F9} User subscription tier: ${user.subscriptionTier || "free"}`);
      console.log(`\u{1F4F9} Current storage used: ${user.storageUsed || 0} bytes`);
      const { hasStorageQuota: hasStorageQuota2, formatBytes: formatBytes2, getStorageTierInfo: getStorageTierInfo2, getPerVideoLimit: getPerVideoLimit2 } = await Promise.resolve().then(() => (init_storageUtils(), storageUtils_exports));
      const perVideoLimit = getPerVideoLimit2(user.subscriptionTier || "free");
      if (parsedFileSize > perVideoLimit) {
        console.error(`\u274C Video file too large: ${formatBytes2(parsedFileSize)} exceeds limit of ${formatBytes2(perVideoLimit)}`);
        return res.status(413).json({
          message: `Video file too large. Maximum ${formatBytes2(perVideoLimit)} per video for your plan.`,
          fileSize: formatBytes2(parsedFileSize),
          limit: formatBytes2(perVideoLimit),
          exceeded: true
        });
      }
      if (!hasStorageQuota2(user.storageUsed || 0, parsedFileSize, user.subscriptionTier || "free")) {
        const tierInfo = getStorageTierInfo2(user.subscriptionTier || "free");
        console.error("\u274C Storage quota exceeded");
        return res.status(413).json({
          message: `Storage quota exceeded. ${tierInfo.tierName} plan allows ${tierInfo.quotaFormatted}.`,
          currentUsage: formatBytes2(user.storageUsed || 0),
          quota: tierInfo.quotaFormatted,
          exceeded: true
        });
      }
      console.log("\u{1F4F9} Starting upload to R2...");
      let url, key;
      try {
        const { uploadToR2: uploadToR22 } = await Promise.resolve().then(() => (init_r2Storage(), r2Storage_exports));
        ({ url, key } = await uploadToR22(
          file.buffer,
          fileName || file.originalname,
          file.mimetype
        ));
        console.log("\u2705 Upload to R2 successful");
        console.log(`\u{1F4F9} R2 URL: ${url}`);
        console.log(`\u{1F4F9} R2 Key: ${key}`);
      } catch (r2Error) {
        console.error("\u274C R2 upload failed:", r2Error.message);
        return res.status(500).json({
          message: r2Error.message || "R2 storage configuration error",
          error: "R2_CONFIG_ERROR"
        });
      }
      console.log("\u{1F4F9} Updating note in database...");
      const [updatedNote] = await db.update(notes).set({
        videoUrl: url,
        videoFileName: fileName || file.originalname,
        videoFileSize: parsedFileSize,
        videoThumbnail: thumbnail || null,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(and2(
        eq2(notes.id, noteId),
        eq2(notes.userId, parsedUserId)
      )).returning();
      if (!updatedNote) {
        console.error("\u274C Note not found or access denied");
        return res.status(404).json({ message: "Note not found or access denied" });
      }
      console.log("\u{1F4F9} Updating storage usage...");
      await db.update(users).set({
        storageUsed: (user.storageUsed || 0) + parsedFileSize
      }).where(eq2(users.id, parsedUserId));
      const newStorageUsed = (user.storageUsed || 0) + parsedFileSize;
      console.log(`\u2705 Video uploaded successfully! New storage usage: ${formatBytes2(newStorageUsed)}`);
      res.json({
        message: "Video uploaded successfully",
        note: updatedNote,
        storageUsed: newStorageUsed
      });
    } catch (error) {
      console.error("\u274C Error uploading video to note:", error);
      console.error("\u274C Error stack:", error.stack);
      console.error("\u274C Error message:", error.message);
      res.status(500).json({ message: "Failed to upload video", error: error.message });
    }
  });
  app2.delete("/api/notes/:id/video", async (req, res) => {
    try {
      const noteId = req.params.id;
      const userId = parseInt(req.query.userId);
      if (!userId || isNaN(userId)) {
        return res.status(401).json({ message: "User ID required" });
      }
      const [note] = await db.select().from(notes).where(and2(
        eq2(notes.id, noteId),
        eq2(notes.userId, userId)
      )).limit(1);
      if (!note) {
        return res.status(404).json({ message: "Note not found or access denied" });
      }
      const videoFileSize = note.videoFileSize || 0;
      const videoUrl = note.videoUrl;
      if (videoUrl) {
        try {
          if (videoUrl.includes(process.env.R2_ENDPOINT || "") || !videoUrl.includes("supabase.co")) {
            const { deleteFromR2: deleteFromR22 } = await Promise.resolve().then(() => (init_r2Storage(), r2Storage_exports));
            const urlObj = new URL(videoUrl);
            const pathParts = urlObj.pathname.substring(1).split("/");
            const key = pathParts.slice(1).join("/");
            await deleteFromR22(key);
            console.log("\u2705 File deleted from R2");
          } else if (videoUrl.includes("supabase.co") && supabaseAdmin) {
            const urlParts = videoUrl.split("/storage/v1/object/public/");
            if (urlParts.length === 2) {
              const fullPath = urlParts[1];
              const pathParts = fullPath.split("/");
              const bucket = pathParts[0];
              const filePath = pathParts.slice(1).join("/");
              console.log(`Deleting file from Supabase Storage: ${bucket}/${filePath}`);
              const { error: deleteError } = await supabaseAdmin.storage.from(bucket).remove([filePath]);
              if (deleteError) {
                console.error("Error deleting from Supabase Storage:", deleteError);
              } else {
                console.log("\u2705 File deleted from Supabase Storage");
              }
            }
          }
        } catch (storageError) {
          console.error("Error processing storage deletion:", storageError);
        }
      }
      const [updatedNote] = await db.update(notes).set({
        videoUrl: null,
        videoFileName: null,
        videoFileSize: null,
        videoThumbnail: null,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(and2(
        eq2(notes.id, noteId),
        eq2(notes.userId, userId)
      )).returning();
      if (videoFileSize > 0) {
        await db.update(users).set({
          storageUsed: sql3`GREATEST(0, ${users.storageUsed} - ${videoFileSize})`
        }).where(eq2(users.id, userId));
        const { formatBytes: formatBytes2 } = await Promise.resolve().then(() => (init_storageUtils(), storageUtils_exports));
        console.log(`Storage usage decreased by ${formatBytes2(videoFileSize)}`);
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
  app2.post("/api/notes/:id/like", authenticateToken, async (req, res) => {
    try {
      const noteId = parseInt(req.params.id);
      const userId = req.user.userId;
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
  app2.delete("/api/notes/:id/like", authenticateToken, async (req, res) => {
    try {
      const noteId = parseInt(req.params.id);
      const userId = req.user.userId;
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
  app2.get("/api/notes/:id/likes", authenticateToken, async (req, res) => {
    try {
      const noteId = parseInt(req.params.id);
      const userId = req.user.userId;
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
  app2.get("/api/user/by-supabase-id/:supabaseId", async (req, res) => {
    try {
      const { supabaseId } = req.params;
      console.log("Looking up user by Supabase ID:", supabaseId);
      const result = await pool.query(
        "SELECT * FROM users WHERE supabase_uid = $1",
        [supabaseId]
      );
      if (result.rows.length > 0) {
        console.log("Found user:", result.rows[0].id);
        let user = result.rows[0];
        const adminEmails = ["bjjjitsjournal@gmail.com", "admin@apexbjj.com.au"];
        const isAdmin = adminEmails.includes(user.email);
        if (isAdmin && user.role !== "admin") {
          const updatedUser = await storage.updateUser(user.id, {
            role: "admin"
          });
          console.log(`\xE2\u0153\u2026 Auto-assigned admin role to ${user.email}`);
          if (updatedUser) {
            user = updatedUser;
          }
        }
        res.json(user);
      } else {
        console.log("User not found");
        res.status(404).json({ message: "User not found" });
      }
    } catch (error) {
      console.error("Error fetching user by Supabase ID:", error);
      res.status(500).json({ message: "Error fetching user: " + error.message });
    }
  });
  app2.get("/api/user-stats", authenticateToken, async (req, res) => {
    try {
      const userId = req.user.userId;
      const classes2 = await storage.getClasses(userId);
      const totalClasses = classes2.length;
      const belts2 = await storage.getBelts(userId);
      const currentBelt = belts2.length > 0 ? belts2[0] : null;
      const lastPromotionDate = currentBelt?.createdAt || null;
      res.json({
        totalClasses,
        lastPromotionDate,
        currentBelt: currentBelt ? {
          belt: currentBelt.belt,
          stripes: currentBelt.stripes
        } : null
      });
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ message: "Error fetching user stats: " + error.message });
    }
  });
  app2.delete("/api/user/delete-account", flexibleAuth, async (req, res) => {
    try {
      const userId = req.user.userId;
      console.log(`\u{1F5D1}\uFE0F Deleting account for user ID: ${userId}`);
      await pool.query("DELETE FROM classes WHERE user_id = $1", [userId]);
      await pool.query("DELETE FROM notes WHERE user_id = $1", [userId]);
      await pool.query("DELETE FROM belts WHERE user_id = $1", [userId]);
      await pool.query("DELETE FROM weekly_goals WHERE user_id = $1", [userId]);
      await pool.query("DELETE FROM drawings WHERE user_id = $1", [userId]);
      await pool.query("DELETE FROM game_plans WHERE user_id = $1", [userId]);
      await pool.query("DELETE FROM gym_memberships WHERE user_id = $1", [userId]);
      await pool.query("DELETE FROM users WHERE id = $1", [userId]);
      console.log(`\u2705 Successfully deleted account for user ID: ${userId}`);
      res.json({ message: "Account and all data successfully deleted" });
    } catch (error) {
      console.error("Error deleting account:", error);
      res.status(500).json({ message: "Failed to delete account: " + error.message });
    }
  });
  app2.get("/api/drawings", authenticateToken, async (req, res) => {
    try {
      const userId = req.user.userId;
      const drawings2 = await storage.getDrawings(userId);
      res.json(drawings2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch drawings" });
    }
  });
  app2.post("/api/drawings", authenticateToken, async (req, res) => {
    try {
      const userId = req.user.userId;
      const drawingData = insertDrawingSchema.parse({ ...req.body, userId });
      const newDrawing = await storage.createDrawing(drawingData);
      res.status(201).json(newDrawing);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        res.status(400).json({ message: "Invalid drawing data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create drawing" });
      }
    }
  });
  app2.put("/api/drawings/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const drawingData = insertDrawingSchema.partial().parse(req.body);
      const updatedDrawing = await storage.updateDrawing(id, drawingData);
      if (!updatedDrawing) {
        return res.status(404).json({ message: "Drawing not found" });
      }
      res.json(updatedDrawing);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        res.status(400).json({ message: "Invalid drawing data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update drawing" });
      }
    }
  });
  app2.delete("/api/drawings/:id", async (req, res) => {
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
  app2.get("/api/belts", authenticateToken, async (req, res) => {
    try {
      const userId = req.user.userId;
      const belts2 = await storage.getBelts(userId);
      res.json(belts2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch belts" });
    }
  });
  app2.get("/api/belts/current", authenticateToken, async (req, res) => {
    try {
      const userId = req.user.userId;
      const currentBelt = await storage.getCurrentBelt(userId);
      res.json(currentBelt);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch current belt" });
    }
  });
  app2.post("/api/belts", authenticateToken, async (req, res) => {
    try {
      const userId = req.user.userId;
      const beltData = insertBeltSchema.parse({ ...req.body, userId });
      const newBelt = await storage.createBelt(beltData);
      res.status(201).json(newBelt);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        res.status(400).json({ message: "Invalid belt data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create belt" });
      }
    }
  });
  app2.put("/api/belts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const beltData = insertBeltSchema.partial().parse(req.body);
      const updatedBelt = await storage.updateBelt(id, beltData);
      if (!updatedBelt) {
        return res.status(404).json({ message: "Belt not found" });
      }
      res.json(updatedBelt);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        res.status(400).json({ message: "Invalid belt data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update belt" });
      }
    }
  });
  app2.patch("/api/belts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const beltData = insertBeltSchema.partial().parse(req.body);
      const updatedBelt = await storage.updateBelt(id, beltData);
      if (!updatedBelt) {
        return res.status(404).json({ message: "Belt not found" });
      }
      res.json(updatedBelt);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        res.status(400).json({ message: "Invalid belt data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update belt" });
      }
    }
  });
  app2.delete("/api/belts/:id", async (req, res) => {
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
  app2.get("/api/stats", authenticateToken, async (req, res) => {
    try {
      const userId = req.user.userId;
      const userClasses = await storage.getClasses(userId);
      const now = /* @__PURE__ */ new Date();
      const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const weeklyClasses = userClasses.filter((cls) => cls.date >= weekStart).length;
      const monthlyClasses = userClasses.filter((cls) => cls.date >= monthStart).length;
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
  app2.get("/api/weekly-commitments", authenticateToken, async (req, res) => {
    try {
      const userId = req.user.userId;
      const commitments = await storage.getWeeklyCommitments(userId);
      res.json(commitments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch weekly commitments" });
    }
  });
  app2.get("/api/weekly-commitments/current", authenticateToken, async (req, res) => {
    try {
      const userId = req.user.userId;
      console.log("\xF0\u0178\u201D\x8D GET /api/weekly-commitments/current called for userId:", userId);
      const commitment = await storage.getCurrentWeekCommitment(userId);
      console.log("\xF0\u0178\u201D\x8D getCurrentWeekCommitment returned:", commitment ? commitment.id : "null");
      res.set({
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0"
      });
      res.json(commitment || null);
    } catch (error) {
      console.error("\xE2\x9D\u0152 Error in GET /api/weekly-commitments/current:", error);
      res.status(500).json({ message: "Failed to fetch current week commitment" });
    }
  });
  app2.post("/api/weekly-commitments", authenticateToken, async (req, res) => {
    try {
      const userId = req.user.userId;
      console.log("\xF0\u0178\u201D\xA5 POST /api/weekly-commitments called with data:", req.body, "userId:", userId);
      const commitmentData = insertWeeklyCommitmentSchema.parse({ ...req.body, userId });
      const newCommitment = await storage.createWeeklyCommitment(commitmentData);
      console.log("\xE2\u0153\u2026 Created new commitment:", newCommitment.id);
      res.set({
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0"
      });
      res.status(201).json(newCommitment);
    } catch (error) {
      console.error("\xE2\x9D\u0152 Error in POST /api/weekly-commitments:", error);
      if (error instanceof z2.ZodError) {
        res.status(400).json({ message: "Invalid commitment data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create weekly commitment" });
      }
    }
  });
  app2.put("/api/weekly-commitments/:id", authenticateToken, async (req, res) => {
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
      if (error instanceof z2.ZodError) {
        res.status(400).json({ message: "Invalid commitment data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update weekly commitment" });
      }
    }
  });
  app2.get("/api/training-videos", async (req, res) => {
    try {
      const videos2 = await storage.getTrainingVideos();
      res.json(videos2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch training videos" });
    }
  });
  app2.post("/api/training-videos", async (req, res) => {
    try {
      const videoData = insertTrainingVideoSchema.parse(req.body);
      const newVideo = await storage.createTrainingVideo(videoData);
      res.status(201).json(newVideo);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        res.status(400).json({ message: "Invalid video data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create training video" });
      }
    }
  });
  app2.get("/api/training-videos/:id", async (req, res) => {
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
  app2.put("/api/training-videos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const videoData = insertTrainingVideoSchema.partial().parse(req.body);
      const updatedVideo = await storage.updateTrainingVideo(id, videoData);
      if (!updatedVideo) {
        return res.status(404).json({ message: "Training video not found" });
      }
      res.json(updatedVideo);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        res.status(400).json({ message: "Invalid video data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update training video" });
      }
    }
  });
  app2.delete("/api/training-videos/:id", async (req, res) => {
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
  app2.get("/api/game-plans", authenticateToken, async (req, res) => {
    try {
      const userId = req.userId;
      const gamePlans2 = await storage.getGamePlans(userId);
      res.json(gamePlans2);
    } catch (error) {
      console.error("Error fetching game plans:", error);
      res.status(500).json({ message: "Failed to fetch game plans" });
    }
  });
  app2.get("/api/game-plans/names", authenticateToken, async (req, res) => {
    try {
      const userId = req.userId;
      const planNames = await storage.getGamePlanNames(userId);
      res.json(planNames);
    } catch (error) {
      console.error("Error fetching plan names:", error);
      res.status(500).json({ message: "Failed to fetch plan names" });
    }
  });
  app2.get("/api/game-plans/:planName", authenticateToken, async (req, res) => {
    try {
      const userId = req.userId;
      const planName = req.params.planName;
      const gamePlans2 = await storage.getGamePlanByName(userId, planName);
      res.json(gamePlans2);
    } catch (error) {
      console.error("Error fetching game plan:", error);
      res.status(500).json({ message: "Failed to fetch game plan" });
    }
  });
  app2.post("/api/game-plans", authenticateToken, async (req, res) => {
    try {
      const userId = req.userId;
      const gamePlanData = insertGamePlanSchema.parse(req.body);
      const newMove = await storage.createGamePlanMove(userId, gamePlanData);
      res.status(201).json(newMove);
    } catch (error) {
      console.error("Error creating game plan move:", error);
      if (error instanceof z2.ZodError) {
        res.status(400).json({ message: "Invalid game plan data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create game plan move" });
      }
    }
  });
  app2.put("/api/game-plans/:id", authenticateToken, async (req, res) => {
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
      if (error instanceof z2.ZodError) {
        res.status(400).json({ message: "Invalid game plan data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update game plan move" });
      }
    }
  });
  app2.delete("/api/game-plans/:id", authenticateToken, async (req, res) => {
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
  app2.post("/api/game-plans/ai-suggest", authenticateToken, async (req, res) => {
    try {
      const { currentMove, position, context } = req.body;
      if (!currentMove || !position) {
        return res.status(400).json({
          message: "Missing required fields: currentMove and position are required"
        });
      }
      const counterMoves = await generateBJJCounterMoves(currentMove, position, context);
      res.json({ counterMoves });
    } catch (error) {
      console.error("AI suggestion error:", error);
      res.status(500).json({
        message: error.message || "Failed to generate counter move suggestions"
      });
    }
  });
  app2.get("/api/gyms", flexibleAuth, async (req, res) => {
    try {
      const userId = req.userId;
      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const gyms2 = await storage.getAllGyms();
      res.json(gyms2);
    } catch (error) {
      console.error("Get gyms error:", error);
      res.status(500).json({ message: error.message || "Failed to fetch gyms" });
    }
  });
  app2.post("/api/gyms", flexibleAuth, async (req, res) => {
    try {
      const userId = req.userId;
      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const gymData = insertGymSchema.parse(req.body);
      if (!gymData.code) {
        gymData.code = crypto.randomBytes(4).toString("hex").toUpperCase();
      }
      const newGym = await storage.createGym({
        ...gymData,
        ownerId: userId
      });
      await storage.createGymMembership({
        userId,
        gymId: newGym.id,
        role: "admin"
      });
      res.status(201).json(newGym);
    } catch (error) {
      console.error("Error creating gym:", error);
      if (error instanceof z2.ZodError) {
        res.status(400).json({ message: "Invalid gym data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create gym" });
      }
    }
  });
  app2.delete("/api/gyms/:id", flexibleAuth, async (req, res) => {
    try {
      const userId = req.userId;
      const gymId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      await storage.deleteGym(gymId);
      res.json({ message: "Gym deleted successfully" });
    } catch (error) {
      console.error("Error deleting gym:", error);
      res.status(500).json({ message: "Failed to delete gym" });
    }
  });
  app2.post("/api/gyms/join", flexibleAuth, async (req, res) => {
    try {
      const userId = req.userId;
      const { code } = req.body;
      if (!code) {
        return res.status(400).json({ message: "Gym code is required" });
      }
      const gym = await storage.getGymByCode(code);
      if (!gym) {
        return res.status(404).json({ message: "Invalid gym code" });
      }
      const existingMembership = await storage.getGymMembership(userId, gym.id);
      if (existingMembership) {
        return res.status(400).json({ message: "You are already a member of this gym" });
      }
      const membership = await storage.createGymMembership({
        userId,
        gymId: gym.id,
        role: "member"
      });
      res.status(201).json({ gym, membership });
    } catch (error) {
      console.error("Error joining gym:", error);
      res.status(500).json({ message: "Failed to join gym" });
    }
  });
  app2.get("/api/my-gym", flexibleAuth, async (req, res) => {
    try {
      const userId = req.userId;
      const userGyms = await storage.getUserGyms(userId);
      if (userGyms.length === 0) {
        return res.json(null);
      }
      const gym = userGyms[0];
      const membership = await storage.getGymMembership(userId, gym.id);
      res.json({
        ...gym,
        role: membership?.role || "member"
      });
    } catch (error) {
      console.error("Error getting user gym:", error);
      res.status(500).json({ message: "Failed to get gym membership" });
    }
  });
  app2.get("/api/gym-notes", flexibleAuth, async (req, res) => {
    try {
      const userId = req.userId;
      console.log("\u{1F50D} GET /api/gym-notes - userId:", userId);
      const userGyms = await storage.getUserGyms(userId);
      console.log("\u{1F3CB}\uFE0F User gyms found:", userGyms.length, userGyms);
      if (userGyms.length === 0) {
        console.log("\u26A0\uFE0F User not in any gym");
        return res.json([]);
      }
      const gymId = userGyms[0].id;
      console.log("\u{1F4DD} Fetching notes for gym ID:", gymId);
      const gymNotes = await storage.getGymNotes(gymId);
      console.log("\u2705 Gym notes found:", gymNotes.length);
      res.json(gymNotes);
    } catch (error) {
      console.error("Error getting gym notes:", error);
      res.status(500).json({ message: "Failed to get gym notes" });
    }
  });
  app2.post("/api/notes/:id/share-to-gym", flexibleAuth, async (req, res) => {
    try {
      const userId = req.userId;
      const noteId = req.params.id;
      const note = await storage.getNote(noteId);
      if (!note || note.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to share this note" });
      }
      const userGyms = await storage.getUserGyms(userId);
      if (userGyms.length === 0) {
        return res.status(400).json({ message: "You must be a member of a gym to share notes" });
      }
      const gymMembership = await storage.getGymMembership(userId, userGyms[0].id);
      if (!gymMembership || gymMembership.role !== "admin") {
        return res.status(403).json({ message: "Only gym admins can share notes to the gym" });
      }
      await storage.shareNoteToGym(noteId, userGyms[0].id);
      res.json({ message: "Note shared to gym successfully" });
    } catch (error) {
      console.error("Error sharing note to gym:", error);
      res.status(500).json({ message: "Failed to share note to gym" });
    }
  });
  app2.post("/api/notes/:id/unshare-from-gym", authenticateToken, async (req, res) => {
    try {
      const userId = req.userId;
      const noteId = req.params.id;
      const note = await storage.getNote(noteId);
      if (!note || note.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to modify this note" });
      }
      if (!note.gymId) {
        return res.status(400).json({ message: "Note is not shared to any gym" });
      }
      const gymMembership = await storage.getGymMembership(userId, note.gymId);
      if (!gymMembership || gymMembership.role !== "admin") {
        return res.status(403).json({ message: "Only gym admins can remove notes from the gym" });
      }
      await storage.unshareNoteFromGym(noteId);
      res.json({ message: "Note removed from gym successfully" });
    } catch (error) {
      console.error("Error unsharing note from gym:", error);
      res.status(500).json({ message: "Failed to remove note from gym" });
    }
  });
  app2.delete("/api/gym-notes/:id", flexibleAuth, async (req, res) => {
    try {
      const userId = req.userId;
      const noteId = req.params.id;
      const note = await storage.getNote(noteId);
      if (!note) {
        return res.status(404).json({ message: "Note not found" });
      }
      const userGyms = await storage.getUserGyms(userId);
      if (userGyms.length === 0) {
        return res.status(400).json({ message: "You must be a member of a gym" });
      }
      const gymMembership = await storage.getGymMembership(userId, userGyms[0].id);
      if (!gymMembership || gymMembership.role !== "admin") {
        return res.status(403).json({ message: "Only gym admins can delete gym notes" });
      }
      if (note.gymId !== userGyms[0].id) {
        return res.status(403).json({ message: "This note does not belong to your gym" });
      }
      await storage.deleteNote(noteId);
      res.json({ message: "Gym note deleted successfully" });
    } catch (error) {
      console.error("Error deleting gym note:", error);
      res.status(500).json({ message: "Failed to delete gym note" });
    }
  });
  app2.get("/api/gyms/my-gyms", authenticateToken, async (req, res) => {
    try {
      const userId = req.userId;
      const gyms2 = await storage.getUserGyms(userId);
      res.json(gyms2);
    } catch (error) {
      console.error("Error fetching user gyms:", error);
      res.status(500).json({ message: "Failed to fetch gyms" });
    }
  });
  app2.get("/api/gyms/:gymId/notes", authenticateToken, async (req, res) => {
    try {
      const userId = req.userId;
      const gymId = parseInt(req.params.gymId);
      const membership = await storage.getGymMembership(userId, gymId);
      if (!membership) {
        return res.status(403).json({ message: "You are not a member of this gym" });
      }
      const notes2 = await storage.getGymNotes(gymId);
      res.json(notes2);
    } catch (error) {
      console.error("Error fetching gym notes:", error);
      res.status(500).json({ message: "Failed to fetch gym notes" });
    }
  });
  app2.post("/api/stripe/create-checkout-session", flexibleAuth, async (req, res) => {
    try {
      const userId = req.userId;
      const { tier } = req.body;
      if (!tier) {
        return res.status(400).json({ message: "tier is required" });
      }
      console.log("[Stripe Checkout] Checking price IDs...", {
        STRIPE_ENTHUSIAST_PRICE_ID: process.env.STRIPE_ENTHUSIAST_PRICE_ID,
        VITE_STRIPE_ENTHUSIAST_PRICE_ID: process.env.VITE_STRIPE_ENTHUSIAST_PRICE_ID,
        STRIPE_GYM_PRO_PRICE_ID: process.env.STRIPE_GYM_PRO_PRICE_ID,
        VITE_STRIPE_GYM_PRO_PRICE_ID: process.env.VITE_STRIPE_GYM_PRO_PRICE_ID
      });
      const enthusiastPriceId = process.env.STRIPE_ENTHUSIAST_PRICE_ID || process.env.VITE_STRIPE_ENTHUSIAST_PRICE_ID;
      const gymProPriceId = process.env.STRIPE_GYM_PRO_PRICE_ID || process.env.VITE_STRIPE_GYM_PRO_PRICE_ID;
      if (!enthusiastPriceId || !gymProPriceId) {
        console.error("Missing price IDs:", { enthusiastPriceId, gymProPriceId });
        return res.status(500).json({ message: "Server configuration error: price IDs not set" });
      }
      const TIER_PRICE_MAP = {
        "enthusiast": {
          priceId: enthusiastPriceId,
          name: "BJJ Enthusiast"
        },
        "gym_pro": {
          priceId: gymProPriceId,
          name: "Gym Pro"
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
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: {
            userId: user.id.toString()
          }
        });
        customerId = customer.id;
        await storage.updateUserStripeCustomer(userId, customerId);
      }
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [
          {
            price: tierConfig.priceId,
            quantity: 1
          }
        ],
        success_url: `${process.env.VITE_APP_URL || "http://localhost:5000"}/subscribe/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.VITE_APP_URL || "http://localhost:5000"}/subscribe`,
        metadata: {
          userId: user.id.toString(),
          tier
        }
      });
      res.json({ url: session.url });
    } catch (error) {
      console.error("Error creating checkout session:", error);
      res.status(500).json({ message: error.message || "Failed to create checkout session" });
    }
  });
  app2.post("/api/stripe/webhook", express.raw({ type: "application/json" }), async (req, res) => {
    const sig = req.headers["stripe-signature"];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("\u26A0\uFE0F STRIPE_WEBHOOK_SECRET not configured");
      return res.status(500).send("Webhook secret not configured");
    }
    let event;
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
      console.error("\u26A0\uFE0F Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    try {
      switch (event.type) {
        case "checkout.session.completed":
          const session = event.data.object;
          const userId = parseInt(session.metadata.userId);
          const tier = session.metadata.tier;
          await storage.updateUserSubscription(userId, {
            subscriptionTier: tier,
            stripeSubscriptionId: session.subscription,
            subscriptionStatus: "active"
          });
          console.log(`\u2705 Subscription activated for user ${userId}, tier: ${tier}`);
          break;
        case "customer.subscription.updated":
          const subscription = event.data.object;
          const updateUserId = parseInt(subscription.metadata.userId || "0");
          if (updateUserId) {
            await storage.updateUserSubscription(updateUserId, {
              subscriptionStatus: subscription.status === "active" ? "active" : "paused"
            });
            console.log(`\u2705 Subscription updated for user ${updateUserId}, status: ${subscription.status}`);
          }
          break;
        case "customer.subscription.deleted":
          const canceledSub = event.data.object;
          const cancelUserId = parseInt(canceledSub.metadata.userId || "0");
          if (cancelUserId) {
            await storage.updateUserSubscription(cancelUserId, {
              subscriptionTier: "free",
              subscriptionStatus: "free",
              stripeSubscriptionId: null
            });
            console.log(`\u2705 Subscription canceled for user ${cancelUserId}`);
          }
          break;
        default:
          console.log(`Unhandled event type ${event.type}`);
      }
      res.json({ received: true });
    } catch (error) {
      console.error("Error handling webhook:", error);
      res.status(500).json({ error: error.message });
    }
  });
  app2.get("/api/stripe/subscription-status", flexibleAuth, async (req, res) => {
    try {
      const userId = req.userId;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({
        tier: user.subscriptionTier || "free",
        status: user.subscriptionStatus || "free",
        stripeCustomerId: user.stripeCustomerId,
        stripeSubscriptionId: user.stripeSubscriptionId,
        gymApprovalStatus: user.gymApprovalStatus || "none"
      });
    } catch (error) {
      console.error("Error fetching subscription status:", error);
      res.status(500).json({ message: "Failed to fetch subscription status" });
    }
  });
  app2.get("/api/storage/usage", flexibleAuth, async (req, res) => {
    try {
      const userId = req.userId;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const {
        getStorageQuota: getStorageQuota2,
        getRemainingStorage: getRemainingStorage2,
        getStoragePercentage: getStoragePercentage2,
        formatBytes: formatBytes2,
        getStorageTierInfo: getStorageTierInfo2
      } = await Promise.resolve().then(() => (init_storageUtils(), storageUtils_exports));
      const subscriptionTier = user.subscriptionTier || "free";
      const storageUsed = user.storageUsed || 0;
      const quota = getStorageQuota2(subscriptionTier);
      const remaining = getRemainingStorage2(storageUsed, subscriptionTier);
      const percentage = getStoragePercentage2(storageUsed, subscriptionTier);
      const tierInfo = getStorageTierInfo2(subscriptionTier);
      res.json({
        storageUsed,
        storageUsedFormatted: formatBytes2(storageUsed),
        quota,
        quotaFormatted: tierInfo.quotaFormatted,
        remaining,
        remainingFormatted: formatBytes2(remaining),
        percentage,
        tier: subscriptionTier,
        tierName: tierInfo.tierName
      });
    } catch (error) {
      console.error("Error fetching storage usage:", error);
      res.status(500).json({ message: "Failed to fetch storage usage" });
    }
  });
  app2.use((err, req, res, next) => {
    console.error("\u274C Global error handler caught:", err.message);
    console.error("\u274C Error stack:", err.stack);
    if (res.headersSent) {
      return next(err);
    }
    res.status(err.status || 500).json({
      message: err.message || "Internal server error",
      error: err.name || "SERVER_ERROR"
    });
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express2 from "express";
import fs2 from "fs";
import path3 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path2 from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path2.resolve(import.meta.dirname, "client", "src"),
      "@shared": path2.resolve(import.meta.dirname, "shared"),
      "@assets": path2.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path2.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path2.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path3.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs2.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path3.resolve(import.meta.dirname, "public");
  if (!fs2.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express2.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path3.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express3();
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});
app.use((req, res, next) => {
  if (req.originalUrl === "/api/stripe/webhook") {
    next();
  } else {
    express3.json({ limit: "50mb" })(req, res, next);
  }
});
app.use(express3.urlencoded({ extended: false, limit: "50mb" }));
app.use((req, res, next) => {
  const start = Date.now();
  const path4 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path4.startsWith("/api")) {
      let logLine = `${req.method} ${path4} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    if (status >= 500) {
      console.error("Server error:", err);
    }
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = Number(process.env.PORT) || 5e3;
  server.on("error", (err) => {
    log(`Server startup error: ${err.message}`);
    console.error("Server error:", err);
    process.exit(1);
  });
  if (process.env.NODE_ENV === "production") {
    process.on("unhandledRejection", (reason, promise) => {
      console.error("Unhandled Rejection at:", promise, "reason:", reason);
      process.exit(1);
    });
    process.on("uncaughtException", (error) => {
      console.error("Uncaught Exception:", error);
      process.exit(1);
    });
  } else {
    process.on("unhandledRejection", (reason, promise) => {
      console.error("Unhandled Rejection at:", promise, "reason:", reason);
    });
    process.on("uncaughtException", (error) => {
      console.error("Uncaught Exception:", error);
    });
  }
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });
})();
