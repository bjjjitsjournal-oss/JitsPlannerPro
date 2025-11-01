import { pgTable, text, serial, integer, timestamp, jsonb, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const classes = pgTable("classes", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull(),
  time: text("time").notNull(), // Time in HH:MM format (24-hour)
  duration: integer("duration").notNull(), // in minutes
  classType: text("class_type").notNull(),
  instructor: text("instructor").notNull(),
  trainingPartners: text("training_partners").array(),
  techniquesFocused: text("techniques_focused"),
  // Rolling tracking fields
  rollingPartners: text("rolling_partners").array(), // Partners you rolled with
  yourSubmissions: integer("your_submissions").default(0), // Subs you got
  partnerSubmissions: integer("partner_submissions").default(0), // Subs your partners got
  cardioRating: integer("cardio_rating"), // 1-5 scale for how you felt
  userId: integer("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const videos = pgTable("videos", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  url: text("url").notNull(),
  category: text("category").notNull(),
  tags: text("tags").array(),
  isFavorite: integer("is_favorite").default(0), // 0 = false, 1 = true
  duration: text("duration"), // e.g., "12:45"
  thumbnailUrl: text("thumbnail_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const notes = pgTable("notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: text("content").notNull(),
  tags: text("tags").array(),
  linkedClassId: integer("linked_class_id"),
  linkedVideoId: integer("linked_video_id"),
  userId: integer("user_id").notNull().references(() => users.id), // Direct integer reference to users table
  isShared: integer("is_shared").default(0), // 0 = private, 1 = shared to community
  gymId: integer("gym_id").references(() => gyms.id), // If shared to a specific gym
  sharedWithUsers: text("shared_with_users").array(), // array of user IDs
  videoUrl: text("video_url"), // URL to uploaded video file
  videoFileName: text("video_file_name"), // Original filename
  videoFileSize: integer("video_file_size"), // File size in bytes
  videoThumbnail: text("video_thumbnail"), // Thumbnail URL
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});



export const drawings = pgTable("drawings", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  canvasData: text("canvas_data").notNull(), // JSON string of canvas data
  linkedNoteId: integer("linked_note_id"),
  linkedClassId: integer("linked_class_id"),
  userId: integer("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const belts = pgTable("belts", {
  id: serial("id").primaryKey(),
  belt: text("belt").notNull(), // white, blue, purple, brown, black
  stripes: integer("stripes").notNull().default(0), // 0-4 stripes
  promotionDate: timestamp("promotion_date").notNull(),
  instructor: text("instructor"),
  notes: text("notes"),
  userId: integer("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").unique().notNull(),
  password: text("password"), // Nullable - Supabase Auth handles passwords
  firstName: text("first_name"),
  lastName: text("last_name"),
  subscriptionTier: text("subscription_tier").default("free"), // free, enthusiast, gym_pro
  stripeCustomerId: text("stripe_customer_id"), // Stripe customer ID
  stripeSubscriptionId: text("stripe_subscription_id"), // Stripe subscription ID
  subscriptionStatus: text("subscription_status").default("free"), // free, premium, active
  subscriptionPlan: text("subscription_plan"), // Added for RevenueCat subscription plans
  revenuecatCustomerId: text("revenuecat_customer_id"), // Added for RevenueCat integration
  subscriptionExpiresAt: timestamp("subscription_expires_at"),
  gymApprovalStatus: text("gym_approval_status").default("none"), // none, pending, approved, rejected
  classCount: integer("class_count").default(0), // Track classes logged for free tier limit
  noteCount: integer("note_count").default(0), // Track notes created for free tier limit
  weeklyShareCount: integer("weekly_share_count").default(0), // Track community shares this week
  shareResetDate: timestamp("share_reset_date"), // When to reset weekly share count
  storageUsed: integer("storage_used").default(0), // Total video storage used in bytes
  role: text("role").default("user"), // user, admin
  createdAt: timestamp("created_at").defaultNow(),
  supabaseUid: varchar("supabase_uid").unique(), // Link to Supabase Auth
});

export const profiles = pgTable("profiles", {
  id: varchar("id").primaryKey(), // UUID format to match Supabase auth.users(id)
});

// Identity bridge table to map integer user IDs to Supabase UUIDs
export const authIdentities = pgTable("auth_identities", {
  userId: integer("user_id").primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  supabaseUid: varchar("supabase_uid").unique().notNull(),
});

// Application-owned notes table using integer user IDs instead of problematic profiles FK
export const appNotes = pgTable("app_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: text("content").notNull(),
  tags: text("tags").array(),
  linkedClassId: integer("linked_class_id"),
  linkedVideoId: integer("linked_video_id"),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  isShared: integer("is_shared").default(0), // 0 = private, 1 = shared
  sharedWithUsers: text("shared_with_users").array(), // array of user IDs
  videoUrl: text("video_url"), // URL to uploaded video file
  videoFileName: text("video_file_name"), // Original filename
  videoFileSize: integer("video_file_size"), // File size in bytes
  videoThumbnail: text("video_thumbnail"), // Thumbnail URL
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const weeklyCommitments = pgTable("weekly_commitments", {
  id: serial("id").primaryKey(),
  weekStartDate: timestamp("week_start_date").notNull(), // Sunday of the week
  targetClasses: integer("target_classes").notNull(),
  completedClasses: integer("completed_classes").default(0),
  isCompleted: integer("is_completed").default(0), // 0 = false, 1 = true
  userId: integer("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const trainingVideos = pgTable("training_videos", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  videoUrl: text("video_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  uploadedBy: integer("uploaded_by").references(() => users.id).notNull(),
  isPublic: integer("is_public").default(1), // 0 = private, 1 = public
  tags: text("tags").array(),
  category: text("category"),
  duration: integer("duration"), // in seconds
  views: integer("views").default(0),
  likes: integer("likes").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  token: text("token").notNull().unique(),
  userId: integer("user_id").references(() => users.id).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  used: integer("used").default(0), // 0 = not used, 1 = used
  createdAt: timestamp("created_at").defaultNow(),
});

export const noteLikes = pgTable("note_likes", {
  id: serial("id").primaryKey(),
  noteId: varchar("note_id").references(() => notes.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const gamePlans = pgTable("game_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: integer("user_id").references(() => users.id).notNull(),
  planName: text("plan_name").notNull(), // e.g., "Guard Passing Strategy", "Closed Guard Game"
  moveName: text("move_name").notNull(), // The specific technique/move
  description: text("description"), // Detailed notes about the move
  parentId: varchar("parent_id"), // Self-reference for tree structure, null for root moves
  moveOrder: integer("move_order").default(0), // Order among siblings
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const gyms = pgTable("gyms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(), // Unique code to join gym
  ownerId: integer("owner_id").references(() => users.id).notNull(), // Admin who created the gym
  createdAt: timestamp("created_at").defaultNow(),
});

export const gymMemberships = pgTable("gym_memberships", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  gymId: integer("gym_id").references(() => gyms.id).notNull(),
  role: text("role").notNull().default("member"), // 'admin' or 'member'
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertClassSchema = createInsertSchema(classes).omit({
  id: true,
  createdAt: true,
}).extend({
  // Make some fields optional for easier form submission
  date: z.coerce.date(), // Convert string dates to Date objects
  trainingPartners: z.array(z.string()).optional(),
  techniquesFocused: z.string().optional(),
});

export const insertVideoSchema = createInsertSchema(videos).omit({
  id: true,
  createdAt: true,
}).extend({
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isFavorite: z.number().optional(),
  duration: z.string().optional(),
  thumbnailUrl: z.string().optional(),
});

export const insertNoteSchema = createInsertSchema(notes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  tags: z.array(z.string()).optional(),
  linkedClassId: z.number().optional(),
  linkedVideoId: z.number().optional(),
  userId: z.string().optional(), // UUID format to match database structure
  isShared: z.number().optional(),
  gymId: z.number().optional(), // Optional gym ID for gym-specific sharing
  sharedWithUsers: z.array(z.string()).optional(),
});

export const insertDrawingSchema = createInsertSchema(drawings).omit({
  id: true,
  createdAt: true,
}).extend({
  linkedNoteId: z.number().optional(),
  linkedClassId: z.number().optional(),
});

export const insertBeltSchema = createInsertSchema(belts).omit({
  id: true,
  createdAt: true,
}).extend({
  promotionDate: z.coerce.date(),
  instructor: z.string().optional(),
  notes: z.string().optional(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
}).extend({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  subscriptionStatus: z.enum(["free", "premium", "active", "paused"]).optional(),
  subscriptionExpiresAt: z.date().optional(),
  supabaseId: z.string().optional(), // Accept Supabase UUID
});

export const insertProfileSchema = createInsertSchema(profiles);

export const insertAuthIdentitySchema = createInsertSchema(authIdentities);

export const insertAppNoteSchema = createInsertSchema(appNotes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  tags: z.array(z.string()).optional(),
  linkedClassId: z.number().optional(),
  linkedVideoId: z.number().optional(),
  isShared: z.number().optional(),
  sharedWithUsers: z.array(z.string()).optional(),
});

export const insertWeeklyCommitmentSchema = createInsertSchema(weeklyCommitments).omit({
  id: true,
  createdAt: true,
}).extend({
  weekStartDate: z.coerce.date(),
  targetClasses: z.number().min(1).max(10),
  completedClasses: z.number().default(0),
  isCompleted: z.number().default(0),
});

export const insertTrainingVideoSchema = createInsertSchema(trainingVideos).omit({
  id: true,
  createdAt: true,
}).extend({
  description: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  tags: z.array(z.string()).optional(),
  category: z.string().optional(),
  duration: z.number().optional(),
  views: z.number().default(0),
  likes: z.number().default(0),
});

export type Class = typeof classes.$inferSelect;
export type InsertClass = z.infer<typeof insertClassSchema>;
export type Video = typeof videos.$inferSelect;
export type InsertVideo = z.infer<typeof insertVideoSchema>;
export type Note = typeof notes.$inferSelect;
export type InsertNote = z.infer<typeof insertNoteSchema>;
export type Drawing = typeof drawings.$inferSelect;
export type InsertDrawing = z.infer<typeof insertDrawingSchema>;
export type Belt = typeof belts.$inferSelect;
export type InsertBelt = z.infer<typeof insertBeltSchema>;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type AuthIdentity = typeof authIdentities.$inferSelect;
export type InsertAuthIdentity = z.infer<typeof insertAuthIdentitySchema>;
export type AppNote = typeof appNotes.$inferSelect;
export type InsertAppNote = z.infer<typeof insertAppNoteSchema>;
export type WeeklyCommitment = typeof weeklyCommitments.$inferSelect;
export type InsertWeeklyCommitment = z.infer<typeof insertWeeklyCommitmentSchema>;
export type TrainingVideo = typeof trainingVideos.$inferSelect;
export type InsertTrainingVideo = z.infer<typeof insertTrainingVideoSchema>;

export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).omit({
  id: true,
  createdAt: true,
});

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;

export const insertNoteLikeSchema = createInsertSchema(noteLikes).omit({
  id: true,
  createdAt: true,
});

export type NoteLike = typeof noteLikes.$inferSelect;
export type InsertNoteLike = z.infer<typeof insertNoteLikeSchema>;

export const insertGamePlanSchema = createInsertSchema(gamePlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  description: z.string().optional(),
  parentId: z.string().optional(),
  moveOrder: z.number().optional(),
});

export type GamePlan = typeof gamePlans.$inferSelect;
export type InsertGamePlan = z.infer<typeof insertGamePlanSchema>;

export const insertGymSchema = createInsertSchema(gyms).omit({
  id: true,
  createdAt: true,
}).extend({
  code: z.string().optional(),
  ownerId: z.number().optional(),
});

export type Gym = typeof gyms.$inferSelect;
export type InsertGym = z.infer<typeof insertGymSchema>;

export const insertGymMembershipSchema = createInsertSchema(gymMemberships).omit({
  id: true,
  createdAt: true,
}).extend({
  role: z.enum(["admin", "member"]).default("member"),
});

export type GymMembership = typeof gymMemberships.$inferSelect;
export type InsertGymMembership = z.infer<typeof insertGymMembershipSchema>;
