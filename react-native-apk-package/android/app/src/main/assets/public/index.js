var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  belts: () => belts,
  classes: () => classes,
  drawings: () => drawings,
  insertBeltSchema: () => insertBeltSchema,
  insertClassSchema: () => insertClassSchema,
  insertDrawingSchema: () => insertDrawingSchema,
  insertNoteSchema: () => insertNoteSchema,
  insertTrainingVideoSchema: () => insertTrainingVideoSchema,
  insertUserSchema: () => insertUserSchema,
  insertVideoSchema: () => insertVideoSchema,
  insertWeeklyCommitmentSchema: () => insertWeeklyCommitmentSchema,
  notes: () => notes,
  trainingVideos: () => trainingVideos,
  users: () => users,
  videos: () => videos,
  weeklyCommitments: () => weeklyCommitments
});
import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var classes = pgTable("classes", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull(),
  duration: integer("duration").notNull(),
  // in minutes
  classType: text("class_type").notNull(),
  instructor: text("instructor").notNull(),
  trainingPartners: text("training_partners").array(),
  techniquesFocused: text("techniques_focused"),
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
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  tags: text("tags").array(),
  linkedClassId: integer("linked_class_id"),
  linkedVideoId: integer("linked_video_id"),
  userId: integer("user_id").references(() => users.id),
  isShared: integer("is_shared").default(0),
  // 0 = private, 1 = shared
  sharedWithUsers: text("shared_with_users").array(),
  // array of user IDs
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
  createdAt: timestamp("created_at").defaultNow()
});
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").unique().notNull(),
  password: text("password").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  revenueCatCustomerId: text("revenue_cat_customer_id").unique(),
  subscriptionStatus: text("subscription_status").default("free"),
  // free, premium
  subscriptionPlan: text("subscription_plan"),
  // monthly, annual
  subscriptionExpiresAt: timestamp("subscription_expires_at"),
  createdAt: timestamp("created_at").defaultNow()
});
var weeklyCommitments = pgTable("weekly_commitments", {
  id: serial("id").primaryKey(),
  weekStartDate: timestamp("week_start_date").notNull(),
  // Monday of the week
  targetClasses: integer("target_classes").notNull(),
  completedClasses: integer("completed_classes").default(0),
  isCompleted: integer("is_completed").default(0),
  // 0 = false, 1 = true
  createdAt: timestamp("created_at").defaultNow()
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
  userId: z.number().optional(),
  isShared: z.number().optional(),
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
  revenueCatCustomerId: z.string().optional(),
  subscriptionStatus: z.enum(["free", "premium"]).optional(),
  subscriptionPlan: z.enum(["monthly", "annual"]).optional(),
  subscriptionExpiresAt: z.date().optional()
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

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle({ client: pool, schema: schema_exports });

// server/storage.ts
import { eq, desc, ilike, and } from "drizzle-orm";
var DatabaseStorage = class {
  // Users
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  async getUserByEmail(email) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }
  async createUser(userData) {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }
  async updateUser(id, userData) {
    const [user] = await db.update(users).set(userData).where(eq(users.id, id)).returning();
    return user;
  }
  // Classes
  async getClasses(userId) {
    return await db.select().from(classes).orderBy(desc(classes.date));
  }
  async getClass(id) {
    const [cls] = await db.select().from(classes).where(eq(classes.id, id));
    return cls;
  }
  async createClass(classData) {
    const [cls] = await db.insert(classes).values(classData).returning();
    return cls;
  }
  async updateClass(id, classData) {
    const [cls] = await db.update(classes).set(classData).where(eq(classes.id, id)).returning();
    return cls;
  }
  async deleteClass(id) {
    const result = await db.delete(classes).where(eq(classes.id, id));
    return result.rowCount > 0;
  }
  // Videos
  async getVideos() {
    return await db.select().from(videos).orderBy(desc(videos.createdAt));
  }
  async getVideo(id) {
    const [video] = await db.select().from(videos).where(eq(videos.id, id));
    return video;
  }
  async getVideosByCategory(category) {
    return await db.select().from(videos).where(eq(videos.category, category));
  }
  async searchVideos(query) {
    return await db.select().from(videos).where(ilike(videos.title, `%${query}%`));
  }
  async createVideo(videoData) {
    const [video] = await db.insert(videos).values(videoData).returning();
    return video;
  }
  async updateVideo(id, videoData) {
    const [video] = await db.update(videos).set(videoData).where(eq(videos.id, id)).returning();
    return video;
  }
  async deleteVideo(id) {
    const result = await db.delete(videos).where(eq(videos.id, id));
    return result.rowCount > 0;
  }
  // Notes with user support
  async getNotes(userId) {
    if (userId) {
      return await db.select().from(notes).where(eq(notes.userId, userId)).orderBy(desc(notes.createdAt));
    }
    return await db.select().from(notes).orderBy(desc(notes.createdAt));
  }
  async getNote(id) {
    const [note] = await db.select().from(notes).where(eq(notes.id, id));
    return note;
  }
  async searchNotes(query, userId) {
    const condition = userId ? and(ilike(notes.title, `%${query}%`), eq(notes.userId, userId)) : ilike(notes.title, `%${query}%`);
    return await db.select().from(notes).where(condition);
  }
  async createNote(noteData) {
    const [note] = await db.insert(notes).values(noteData).returning();
    return note;
  }
  async updateNote(id, noteData) {
    const [note] = await db.update(notes).set(noteData).where(eq(notes.id, id)).returning();
    return note;
  }
  async deleteNote(id) {
    const result = await db.delete(notes).where(eq(notes.id, id));
    return result.rowCount > 0;
  }
  async shareNote(noteId, targetUserId) {
    const [note] = await db.update(notes).set({
      isShared: 1,
      sharedWithUsers: [targetUserId.toString()]
    }).where(eq(notes.id, noteId)).returning();
    return !!note;
  }
  // Drawings
  async getDrawings() {
    return await db.select().from(drawings).orderBy(desc(drawings.createdAt));
  }
  async getDrawing(id) {
    const [drawing] = await db.select().from(drawings).where(eq(drawings.id, id));
    return drawing;
  }
  async createDrawing(drawingData) {
    const [drawing] = await db.insert(drawings).values(drawingData).returning();
    return drawing;
  }
  async updateDrawing(id, drawingData) {
    const [drawing] = await db.update(drawings).set(drawingData).where(eq(drawings.id, id)).returning();
    return drawing;
  }
  async deleteDrawing(id) {
    const result = await db.delete(drawings).where(eq(drawings.id, id));
    return result.rowCount > 0;
  }
  // Belts
  async getBelts() {
    return await db.select().from(belts).orderBy(desc(belts.promotionDate));
  }
  async getBelt(id) {
    const [belt] = await db.select().from(belts).where(eq(belts.id, id));
    return belt;
  }
  async getCurrentBelt() {
    const [belt] = await db.select().from(belts).orderBy(desc(belts.promotionDate)).limit(1);
    return belt;
  }
  async createBelt(beltData) {
    const [belt] = await db.insert(belts).values(beltData).returning();
    return belt;
  }
  async updateBelt(id, beltData) {
    const [belt] = await db.update(belts).set(beltData).where(eq(belts.id, id)).returning();
    return belt;
  }
  async deleteBelt(id) {
    const result = await db.delete(belts).where(eq(belts.id, id));
    return result.rowCount > 0;
  }
  // Statistics
  async getClassStats() {
    const now = /* @__PURE__ */ new Date();
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const allClasses = await db.select().from(classes);
    const weeklyClasses = allClasses.filter(
      (cls) => cls.date >= weekStart
    ).length;
    const monthlyClasses = allClasses.filter(
      (cls) => cls.date >= monthStart
    ).length;
    const totalHours = allClasses.reduce((sum, cls) => sum + cls.duration, 0) / 60;
    return {
      weeklyClasses,
      totalHours,
      monthlyClasses
    };
  }
  // Weekly Commitments
  async getWeeklyCommitments() {
    return await db.select().from(weeklyCommitments).orderBy(desc(weeklyCommitments.weekStartDate));
  }
  async getCurrentWeekCommitment() {
    const now = /* @__PURE__ */ new Date();
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    weekStart.setHours(0, 0, 0, 0);
    const [commitment] = await db.select().from(weeklyCommitments).where(eq(weeklyCommitments.weekStartDate, weekStart)).limit(1);
    return commitment;
  }
  async createWeeklyCommitment(commitmentData) {
    const [commitment] = await db.insert(weeklyCommitments).values(commitmentData).returning();
    return commitment;
  }
  async updateWeeklyCommitment(id, commitmentData) {
    const [commitment] = await db.update(weeklyCommitments).set(commitmentData).where(eq(weeklyCommitments.id, id)).returning();
    return commitment;
  }
  async deleteWeeklyCommitment(id) {
    const result = await db.delete(weeklyCommitments).where(eq(weeklyCommitments.id, id));
    return result.rowCount > 0;
  }
  // Training Videos
  async getTrainingVideos() {
    return await db.select().from(trainingVideos).orderBy(desc(trainingVideos.createdAt));
  }
  async getTrainingVideo(id) {
    const [video] = await db.select().from(trainingVideos).where(eq(trainingVideos.id, id));
    return video;
  }
  async createTrainingVideo(videoData) {
    const [video] = await db.insert(trainingVideos).values(videoData).returning();
    return video;
  }
  async updateTrainingVideo(id, videoData) {
    const [video] = await db.update(trainingVideos).set(videoData).where(eq(trainingVideos.id, id)).returning();
    return video;
  }
  async deleteTrainingVideo(id) {
    const result = await db.delete(trainingVideos).where(eq(trainingVideos.id, id));
    return result.rowCount > 0;
  }
};
var storage = new DatabaseStorage();

// server/routes.ts
import { z as z2 } from "zod";
async function registerRoutes(app2) {
  app2.get("/api/classes", async (req, res) => {
    try {
      const classes2 = await storage.getClasses();
      res.json(classes2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch classes" });
    }
  });
  app2.post("/api/classes", async (req, res) => {
    try {
      const classData = insertClassSchema.parse(req.body);
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
  app2.get("/api/videos", async (req, res) => {
    try {
      const { category, search } = req.query;
      let videos2;
      if (search) {
        videos2 = await storage.searchVideos(search);
      } else if (category) {
        videos2 = await storage.getVideosByCategory(category);
      } else {
        videos2 = await storage.getVideos();
      }
      res.json(videos2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch videos" });
    }
  });
  app2.post("/api/videos", async (req, res) => {
    try {
      const videoData = insertVideoSchema.parse(req.body);
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
  app2.get("/api/notes", async (req, res) => {
    try {
      const { search } = req.query;
      let notes2;
      if (search) {
        notes2 = await storage.searchNotes(search);
      } else {
        notes2 = await storage.getNotes();
      }
      res.json(notes2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notes" });
    }
  });
  app2.post("/api/notes", async (req, res) => {
    try {
      const noteData = insertNoteSchema.parse(req.body);
      const newNote = await storage.createNote(noteData);
      res.status(201).json(newNote);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        res.status(400).json({ message: "Invalid note data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create note" });
      }
    }
  });
  app2.put("/api/notes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const noteData = insertNoteSchema.partial().parse(req.body);
      const updatedNote = await storage.updateNote(id, noteData);
      if (!updatedNote) {
        return res.status(404).json({ message: "Note not found" });
      }
      res.json(updatedNote);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        res.status(400).json({ message: "Invalid note data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update note" });
      }
    }
  });
  app2.delete("/api/notes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteNote(id);
      if (!deleted) {
        return res.status(404).json({ message: "Note not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete note" });
    }
  });
  app2.get("/api/drawings", async (req, res) => {
    try {
      const drawings2 = await storage.getDrawings();
      res.json(drawings2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch drawings" });
    }
  });
  app2.post("/api/drawings", async (req, res) => {
    try {
      const drawingData = insertDrawingSchema.parse(req.body);
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
  app2.get("/api/belts", async (req, res) => {
    try {
      const belts2 = await storage.getBelts();
      res.json(belts2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch belts" });
    }
  });
  app2.get("/api/belts/current", async (req, res) => {
    try {
      const currentBelt = await storage.getCurrentBelt();
      res.json(currentBelt);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch current belt" });
    }
  });
  app2.post("/api/belts", async (req, res) => {
    try {
      const beltData = insertBeltSchema.parse(req.body);
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
  app2.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getClassStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });
  app2.get("/api/weekly-commitments", async (req, res) => {
    try {
      const commitments = await storage.getWeeklyCommitments();
      res.json(commitments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch weekly commitments" });
    }
  });
  app2.get("/api/weekly-commitments/current", async (req, res) => {
    try {
      const commitment = await storage.getCurrentWeekCommitment();
      res.json(commitment || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch current week commitment" });
    }
  });
  app2.post("/api/weekly-commitments", async (req, res) => {
    try {
      const commitmentData = insertWeeklyCommitmentSchema.parse(req.body);
      const newCommitment = await storage.createWeeklyCommitment(commitmentData);
      res.status(201).json(newCommitment);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        res.status(400).json({ message: "Invalid commitment data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create weekly commitment" });
      }
    }
  });
  app2.put("/api/weekly-commitments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const commitmentData = insertWeeklyCommitmentSchema.partial().parse(req.body);
      const updatedCommitment = await storage.updateWeeklyCommitment(id, commitmentData);
      if (!updatedCommitment) {
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
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
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
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
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
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
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
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
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
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 5e3;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
