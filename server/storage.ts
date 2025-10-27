import { 
  classes, videos, notes, drawings, belts, weeklyCommitments, trainingVideos, users, passwordResetTokens, noteLikes, appNotes, authIdentities, gamePlans, gyms, gymMemberships,
  type Class, type InsertClass,
  type Video, type InsertVideo,
  type Note, type InsertNote,
  type Drawing, type InsertDrawing,
  type Belt, type InsertBelt,
  type WeeklyCommitment, type InsertWeeklyCommitment,
  type TrainingVideo, type InsertTrainingVideo,
  type User, type InsertUser,
  type PasswordResetToken, type InsertPasswordResetToken,
  type NoteLike, type InsertNoteLike,
  type AppNote, type InsertAppNote,
  type AuthIdentity, type InsertAuthIdentity,
  type GamePlan, type InsertGamePlan,
  type Gym, type InsertGym,
  type GymMembership, type InsertGymMembership
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, ilike, and, or, lt, sql, count } from "drizzle-orm";

// DTO for notes with enriched data
export interface NoteWithAuthor extends Note {
  author: {
    firstName: string | null;
    lastName: string | null;
    email: string;
  } | null;
  likeCount: number;
}

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(userData: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined>;
  
  // Classes
  getClasses(userId?: number): Promise<Class[]>;
  getClass(id: number): Promise<Class | undefined>;
  createClass(classData: InsertClass): Promise<Class>;
  updateClass(id: number, classData: Partial<InsertClass>): Promise<Class | undefined>;
  deleteClass(id: number): Promise<boolean>;

  // Videos
  getVideos(userId?: number): Promise<Video[]>;
  getVideo(id: number): Promise<Video | undefined>;
  getVideosByCategory(category: string, userId?: number): Promise<Video[]>;
  searchVideos(query: string, userId?: number): Promise<Video[]>;
  createVideo(videoData: InsertVideo): Promise<Video>;
  updateVideo(id: number, videoData: Partial<InsertVideo>): Promise<Video | undefined>;
  deleteVideo(id: number): Promise<boolean>;

  // Notes with user support (using existing notes table with UUID mapping)
  getNotes(userId?: number): Promise<Note[]>;
  getNote(id: string): Promise<Note | undefined>; // UUID id for notes
  searchNotes(query: string, userId?: number): Promise<Note[]>;
  createNote(noteData: InsertNote): Promise<Note>;
  updateNote(id: string, noteData: Partial<InsertNote>): Promise<Note | undefined>; // UUID id
  deleteNote(id: string): Promise<boolean>; // UUID id
  shareNote(noteId: string, targetUserId: number): Promise<boolean>; // UUID id

  // Drawings
  getDrawing(id: number): Promise<Drawing | undefined>;
  createDrawing(drawingData: InsertDrawing): Promise<Drawing>;
  updateDrawing(id: number, drawingData: Partial<InsertDrawing>): Promise<Drawing | undefined>;
  deleteDrawing(id: number): Promise<boolean>;

  // Belts
  getBelts(userId?: number): Promise<Belt[]>;
  getBelt(id: number): Promise<Belt | undefined>;
  getCurrentBelt(userId?: number): Promise<Belt | undefined>;
  createBelt(beltData: InsertBelt): Promise<Belt>;
  updateBelt(id: number, beltData: Partial<InsertBelt>): Promise<Belt | undefined>;
  deleteBelt(id: number): Promise<boolean>;

  // Statistics
  getClassStats(userId?: number): Promise<{
    totalClasses: number;
    lastPromotionDate?: string;
    currentBelt?: string;
    currentStripes?: number;
  }>;

  // Weekly Commitments
  getWeeklyCommitments(userId?: number): Promise<WeeklyCommitment[]>;
  getCurrentWeekCommitment(userId?: number): Promise<WeeklyCommitment | undefined>;
  createWeeklyCommitment(commitmentData: InsertWeeklyCommitment): Promise<WeeklyCommitment>;
  updateWeeklyCommitment(id: number, commitmentData: Partial<InsertWeeklyCommitment>): Promise<WeeklyCommitment | undefined>;
  deleteWeeklyCommitment(id: number): Promise<boolean>;

  // Training Videos
  getTrainingVideos(): Promise<TrainingVideo[]>;
  getTrainingVideo(id: number): Promise<TrainingVideo | undefined>;
  createTrainingVideo(videoData: InsertTrainingVideo): Promise<TrainingVideo>;
  updateTrainingVideo(id: number, videoData: Partial<InsertTrainingVideo>): Promise<TrainingVideo | undefined>;
  deleteTrainingVideo(id: number): Promise<boolean>;

  // Enhanced Note Sharing
  toggleNoteSharing(noteId: string, userId: number): Promise<Note | undefined>;
  getSharedNotes(): Promise<NoteWithAuthor[]>; // Get all publicly shared notes with author info
  getDrawings(userId?: number): Promise<Drawing[]>;

  // Password Reset Tokens
  createPasswordResetToken(userId: number, token: string, expiresAt: Date): Promise<PasswordResetToken>;
  getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  markPasswordResetTokenAsUsed(tokenId: number): Promise<void>;
  deleteExpiredPasswordResetTokens(): Promise<void>;

  // Note Likes
  likeNote(noteId: number, userId: number): Promise<boolean>;
  unlikeNote(noteId: number, userId: number): Promise<boolean>;
  getNoteLikes(noteId: string): Promise<NoteLike[]>;
  getUserNoteLikes(userId: number): Promise<NoteLike[]>;
  isNoteLikedByUser(noteId: string, userId: number): Promise<boolean>;
  getNoteWithLikes(noteId: string, userId?: number): Promise<Note & { likeCount: number; isLikedByUser: boolean } | undefined>;

  // Game Plans
  getGamePlans(userId: number): Promise<GamePlan[]>;
  getGamePlanNames(userId: number): Promise<string[]>;
  getGamePlanByName(userId: number, planName: string): Promise<GamePlan[]>;
  createGamePlanMove(userId: number, moveData: InsertGamePlan): Promise<GamePlan>;
  updateGamePlanMove(moveId: string, userId: number, moveData: Partial<InsertGamePlan>): Promise<GamePlan | undefined>;
  deleteGamePlanMove(moveId: string, userId: number): Promise<boolean>;

  // Gyms
  createGym(gymData: InsertGym): Promise<Gym>;
  getGymByCode(code: string): Promise<Gym | undefined>;
  getAllGyms(): Promise<Gym[]>;
  getUserGyms(userId: number): Promise<Gym[]>;
  deleteGym(gymId: number): Promise<boolean>;
  getGymNotes(gymId: number): Promise<Note[]>;
  shareNoteToGym(noteId: string, gymId: number): Promise<void>;
  unshareNoteFromGym(noteId: string): Promise<void>;
  
  // Gym Memberships
  createGymMembership(membershipData: InsertGymMembership): Promise<GymMembership>;
  getGymMembership(userId: number, gymId: number): Promise<GymMembership | undefined>;
  
  // Stripe subscription methods
  updateUserStripeCustomer(userId: number, stripeCustomerId: string): Promise<User | undefined>;
  updateUserSubscription(userId: number, data: { subscriptionTier?: string; stripeSubscriptionId?: string | null; subscriptionStatus?: string; }): Promise<User | undefined>;
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db.update(users).set(userData).where(eq(users.id, id)).returning();
    return user || undefined;
  }

  // Classes
  async getClasses(userId?: number): Promise<Class[]> {
    if (userId) {
      return db.select().from(classes).where(eq(classes.userId, userId)).orderBy(desc(classes.date));
    }
    return db.select().from(classes).orderBy(desc(classes.date));
  }

  async getClass(id: number): Promise<Class | undefined> {
    const [classItem] = await db.select().from(classes).where(eq(classes.id, id));
    return classItem || undefined;
  }

  async createClass(classData: InsertClass): Promise<Class> {
    const [classItem] = await db.insert(classes).values(classData).returning();
    return classItem;
  }

  async updateClass(id: number, classData: Partial<InsertClass>): Promise<Class | undefined> {
    const [classItem] = await db.update(classes).set(classData).where(eq(classes.id, id)).returning();
    return classItem || undefined;
  }

  async deleteClass(id: number): Promise<boolean> {
    const result = await db.delete(classes).where(eq(classes.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Notes - using persistent Supabase database storage
  async getNotes(userId?: number): Promise<Note[]> {
    if (userId) {
      return db.select().from(notes)
        .where(eq(notes.userId, userId))
        .orderBy(desc(notes.createdAt))
        .limit(50); // Pagination: limit to 50 most recent notes
    }
    return db.select().from(notes)
      .orderBy(desc(notes.createdAt))
      .limit(50); // Pagination: limit to 50 most recent notes
  }

  async getNote(id: string): Promise<Note | undefined> {
    const [note] = await db.select().from(notes).where(eq(notes.id, id));
    return note || undefined;
  }

  async createNote(noteData: InsertNote): Promise<Note> {
    const [note] = await db.insert(notes).values(noteData).returning();
    return note;
  }

  async updateNote(id: string, noteData: Partial<InsertNote>): Promise<Note | undefined> {
    const [note] = await db.update(notes).set(noteData).where(eq(notes.id, id)).returning();
    return note || undefined;
  }

  async deleteNote(id: string): Promise<boolean> {
    const result = await db.delete(notes).where(eq(notes.id, id));
    return (result.rowCount || 0) > 0;
  }



  // Videos  
  async getVideos(userId?: number): Promise<Video[]> {
    return db.select().from(videos).orderBy(desc(videos.createdAt));
  }

  async getVideo(id: number): Promise<Video | undefined> {
    const [video] = await db.select().from(videos).where(eq(videos.id, id));
    return video || undefined;
  }

  async createVideo(videoData: InsertVideo): Promise<Video> {
    const [video] = await db.insert(videos).values(videoData).returning();
    return video;
  }

  async updateVideo(id: number, videoData: Partial<InsertVideo>): Promise<Video | undefined> {
    const [video] = await db.update(videos).set(videoData).where(eq(videos.id, id)).returning();
    return video || undefined;
  }

  async deleteVideo(id: number): Promise<boolean> {
    const result = await db.delete(videos).where(eq(videos.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Drawings
  async getDrawings(userId?: number): Promise<Drawing[]> {
    return db.select().from(drawings).orderBy(desc(drawings.createdAt));
  }

  async getDrawing(id: number): Promise<Drawing | undefined> {
    const [drawing] = await db.select().from(drawings).where(eq(drawings.id, id));
    return drawing || undefined;
  }

  async createDrawing(drawingData: InsertDrawing): Promise<Drawing> {
    const [drawing] = await db.insert(drawings).values(drawingData).returning();
    return drawing;
  }

  async updateDrawing(id: number, drawingData: Partial<InsertDrawing>): Promise<Drawing | undefined> {
    const [drawing] = await db.update(drawings).set(drawingData).where(eq(drawings.id, id)).returning();
    return drawing || undefined;
  }

  async deleteDrawing(id: number): Promise<boolean> {
    const result = await db.delete(drawings).where(eq(drawings.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Belts
  async getBelts(userId?: number): Promise<Belt[]> {
    if (userId) {
      return db.select().from(belts).where(eq(belts.userId, userId)).orderBy(desc(belts.promotionDate));
    }
    return db.select().from(belts).orderBy(desc(belts.promotionDate));
  }

  async getBelt(id: number): Promise<Belt | undefined> {
    const [belt] = await db.select().from(belts).where(eq(belts.id, id));
    return belt || undefined;
  }

  async createBelt(beltData: InsertBelt): Promise<Belt> {
    const [belt] = await db.insert(belts).values(beltData).returning();
    return belt;
  }

  async updateBelt(id: number, beltData: Partial<InsertBelt>): Promise<Belt | undefined> {
    const [belt] = await db.update(belts).set(beltData).where(eq(belts.id, id)).returning();
    return belt || undefined;
  }

  async deleteBelt(id: number): Promise<boolean> {
    const result = await db.delete(belts).where(eq(belts.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Weekly Commitments
  async getWeeklyCommitments(userId?: number): Promise<WeeklyCommitment[]> {
    if (userId) {
      return db.select().from(weeklyCommitments).where(eq(weeklyCommitments.userId, userId)).orderBy(desc(weeklyCommitments.weekStartDate));
    }
    return db.select().from(weeklyCommitments).orderBy(desc(weeklyCommitments.weekStartDate));
  }

  async getCurrentWeekCommitment(userId?: number): Promise<WeeklyCommitment | undefined> {
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    startOfWeek.setHours(0, 0, 0, 0);
    
    if (userId) {
      const [commitment] = await db.select().from(weeklyCommitments)
        .where(and(eq(weeklyCommitments.userId, userId), eq(weeklyCommitments.weekStartDate, startOfWeek)));
      return commitment || undefined;
    }
    
    const [commitment] = await db.select().from(weeklyCommitments)
      .where(eq(weeklyCommitments.weekStartDate, startOfWeek));
    return commitment || undefined;
  }

  async createWeeklyCommitment(commitmentData: InsertWeeklyCommitment): Promise<WeeklyCommitment> {
    const [commitment] = await db.insert(weeklyCommitments).values(commitmentData).returning();
    return commitment;
  }

  async updateWeeklyCommitment(id: number, commitmentData: Partial<InsertWeeklyCommitment>): Promise<WeeklyCommitment | undefined> {
    const [commitment] = await db.update(weeklyCommitments).set(commitmentData).where(eq(weeklyCommitments.id, id)).returning();
    return commitment || undefined;
  }

  async deleteWeeklyCommitment(id: number): Promise<boolean> {
    const result = await db.delete(weeklyCommitments).where(eq(weeklyCommitments.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Training Videos
  async getTrainingVideos(): Promise<TrainingVideo[]> {
    return db.select().from(trainingVideos).orderBy(desc(trainingVideos.id));
  }

  async getTrainingVideo(id: number): Promise<TrainingVideo | undefined> {
    const [video] = await db.select().from(trainingVideos).where(eq(trainingVideos.id, id));
    return video || undefined;
  }

  async createTrainingVideo(videoData: InsertTrainingVideo): Promise<TrainingVideo> {
    const [video] = await db.insert(trainingVideos).values(videoData).returning();
    return video;
  }

  async updateTrainingVideo(id: number, videoData: Partial<InsertTrainingVideo>): Promise<TrainingVideo | undefined> {
    const [video] = await db.update(trainingVideos).set(videoData).where(eq(trainingVideos.id, id)).returning();
    return video || undefined;
  }

  async deleteTrainingVideo(id: number): Promise<boolean> {
    const result = await db.delete(trainingVideos).where(eq(trainingVideos.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Note Sharing
  async toggleNoteSharing(noteId: string, userId: number): Promise<Note | undefined> {
    const note = await this.getNote(noteId);
    if (!note || note.userId !== userId) return undefined;
    
    // Toggle between 0 and 1 (integers matching schema)
    const newValue = note.isShared ? 0 : 1;
    
    const [updatedNote] = await db.update(notes)
      .set({ isShared: newValue })
      .where(eq(notes.id, noteId))
      .returning();
    return updatedNote || undefined;
  }

  async getSharedNotes(): Promise<NoteWithAuthor[]> {
    // Optimized: Use JOIN to get notes with user info and like count in ONE query instead of N+1
    const results = await db
      .select({
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
        likeCount: count(noteLikes.id),
      })
      .from(notes)
      .leftJoin(users, eq(notes.userId, users.id))
      .leftJoin(noteLikes, eq(notes.id, noteLikes.noteId))
      .where(eq(notes.isShared, 1))
      .groupBy(
        notes.id,
        users.firstName,
        users.lastName,
        users.email
      )
      .orderBy(desc(notes.createdAt))
      .limit(50); // Pagination: limit to 50 notes

    // Transform to match NoteWithAuthor interface
    return results.map(r => ({
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
        email: r.authorEmail,
      } : null,
      likeCount: Number(r.likeCount),
    }));
  }

  // Password Reset Tokens
  async createPasswordResetToken(userId: number, token: string, expiresAt: Date): Promise<PasswordResetToken> {
    const [resetToken] = await db.insert(passwordResetTokens).values({
      userId,
      token,
      expiresAt,
      used: 0
    }).returning();
    return resetToken;
  }

  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    const [resetToken] = await db.select().from(passwordResetTokens).where(eq(passwordResetTokens.token, token));
    return resetToken || undefined;
  }

  async markPasswordResetTokenAsUsed(tokenId: number): Promise<void> {
    await db.update(passwordResetTokens)
      .set({ used: 1 })
      .where(eq(passwordResetTokens.id, tokenId));
  }

  async deleteExpiredPasswordResetTokens(): Promise<void> {
    const now = new Date();
    await db.delete(passwordResetTokens).where(
      and(eq(passwordResetTokens.used, 1), lt(passwordResetTokens.expiresAt, now))
    );
  }

  // Note Likes
  async likeNote(noteId: number, userId: number): Promise<boolean> {
    try {
      await db.insert(noteLikes).values({ noteId, userId });
      return true;
    } catch {
      return false;
    }
  }

  async unlikeNote(noteId: number, userId: number): Promise<boolean> {
    const result = await db.delete(noteLikes)
      .where(and(eq(noteLikes.noteId, noteId), eq(noteLikes.userId, userId)));
    return (result.rowCount || 0) > 0;
  }

  async getNoteLikes(noteId: string): Promise<NoteLike[]> {
    return db.select().from(noteLikes).where(eq(noteLikes.noteId, noteId));
  }

  async getUserNoteLikes(userId: number): Promise<NoteLike[]> {
    return db.select().from(noteLikes).where(eq(noteLikes.userId, userId));
  }

  async isNoteLikedByUser(noteId: string, userId: number): Promise<boolean> {
    const [like] = await db.select().from(noteLikes)
      .where(and(eq(noteLikes.noteId, noteId), eq(noteLikes.userId, userId)));
    return !!like;
  }

  async getNoteWithLikes(noteId: string, userId?: number): Promise<Note & { likeCount: number; isLikedByUser: boolean } | undefined> {
    const note = await this.getNote(noteId);
    if (!note) return undefined;
    
    const likes = await this.getNoteLikes(noteId);
    const isLikedByUser = userId ? await this.isNoteLikedByUser(noteId, userId) : false;
    
    return {
      ...note,
      likeCount: likes.length,
      isLikedByUser
    };
  }

  // Helper methods
  async getVideosByCategory(category: string): Promise<Video[]> {
    return db.select().from(videos).where(eq(videos.category, category));
  }

  async searchVideos(query: string): Promise<Video[]> {
    return db.select().from(videos).where(
      or(
        ilike(videos.title, `%${query}%`),
        ilike(videos.description, `%${query}%`)
      )
    );
  }

  async searchNotes(query: string, userId?: number): Promise<Note[]> {
    const searchCondition = or(
      ilike(notes.title, `%${query}%`),
      ilike(notes.content, `%${query}%`)
    );
    
    if (userId) {
      return db.select().from(notes)
        .where(and(eq(notes.userId, userId), searchCondition))
        .orderBy(desc(notes.createdAt));
    }
    
    return db.select().from(notes)
      .where(searchCondition)
      .orderBy(desc(notes.createdAt));
  }

  async shareNote(noteId: string, targetUserId: number): Promise<boolean> {
    try {
      const note = await this.getNote(noteId);
      if (!note) return false;
      
      const sharedUsers = note.sharedWithUsers || [];
      if (!sharedUsers.includes(targetUserId.toString())) {
        sharedUsers.push(targetUserId.toString());
        await db.update(notes)
          .set({ sharedWithUsers: sharedUsers })
          .where(eq(notes.id, noteId));
      }
      return true;
    } catch {
      return false;
    }
  }

  async getClassStats(userId?: number): Promise<{ totalClasses: number; lastPromotionDate?: string; currentBelt?: string; currentStripes?: number; }> {
    const userClasses = await this.getClasses(userId);
    const userBelts = await this.getBelts(userId);
    
    const currentBelt = userBelts[0]; // Most recent belt
    
    return {
      totalClasses: userClasses.length,
      lastPromotionDate: currentBelt?.promotionDate?.toISOString(),
      currentBelt: currentBelt?.belt,
      currentStripes: currentBelt?.stripes
    };
  }

  async getCurrentBelt(userId?: number): Promise<Belt | undefined> {
    if (userId) {
      const userBelts = await this.getBelts(userId);
      return userBelts[0]; // Most recent belt
    }
    const allBelts = await this.getBelts();
    return allBelts[0];
  }

  // Game Plans Implementation
  async getGamePlans(userId: number): Promise<GamePlan[]> {
    return db.select().from(gamePlans)
      .where(eq(gamePlans.userId, userId))
      .orderBy(asc(gamePlans.planName), asc(gamePlans.moveOrder));
  }

  async getGamePlanNames(userId: number): Promise<string[]> {
    const plans = await db.select({ planName: gamePlans.planName })
      .from(gamePlans)
      .where(eq(gamePlans.userId, userId))
      .orderBy(asc(gamePlans.planName));
    
    // Return unique plan names
    const uniquePlans = [...new Set(plans.map(p => p.planName))];
    return uniquePlans;
  }

  async getGamePlanByName(userId: number, planName: string): Promise<GamePlan[]> {
    return db.select().from(gamePlans)
      .where(and(
        eq(gamePlans.userId, userId),
        eq(gamePlans.planName, planName)
      ))
      .orderBy(asc(gamePlans.moveOrder));
  }

  async createGamePlanMove(userId: number, moveData: InsertGamePlan): Promise<GamePlan> {
    const [gamePlan] = await db.insert(gamePlans).values({
      userId,
      planName: moveData.planName,
      moveName: moveData.moveName,
      description: moveData.description,
      parentId: moveData.parentId || null,
      moveOrder: moveData.moveOrder || 0,
    }).returning();
    return gamePlan;
  }

  async updateGamePlanMove(moveId: string, userId: number, moveData: Partial<InsertGamePlan>): Promise<GamePlan | undefined> {
    const [updated] = await db.update(gamePlans)
      .set({
        moveName: moveData.moveName,
        description: moveData.description,
        moveOrder: moveData.moveOrder,
        updatedAt: new Date(),
      })
      .where(and(
        eq(gamePlans.id, moveId),
        eq(gamePlans.userId, userId)
      ))
      .returning();
    
    return updated || undefined;
  }

  async deleteGamePlanMove(moveId: string, userId: number): Promise<boolean> {
    // Recursive function to get all descendant IDs
    const getAllDescendants = async (parentId: string): Promise<string[]> => {
      const children = await db.select({ id: gamePlans.id })
        .from(gamePlans)
        .where(and(
          eq(gamePlans.userId, userId),
          eq(gamePlans.parentId, parentId)
        ));

      if (children.length === 0) return [];

      const childIds = children.map(c => c.id);
      const grandchildIds = await Promise.all(
        childIds.map(id => getAllDescendants(id))
      );

      return [...childIds, ...grandchildIds.flat()];
    };

    // Get all descendants
    const descendantIds = await getAllDescendants(moveId);
    const allIds = [moveId, ...descendantIds];

    // Delete all moves (parent and descendants)
    const result = await db.delete(gamePlans)
      .where(and(
        eq(gamePlans.userId, userId),
        // Delete the move and all its descendants
        or(...allIds.map(id => eq(gamePlans.id, id)))
      ));

    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Gym Management
  async createGym(gymData: InsertGym): Promise<Gym> {
    const [gym] = await db.insert(gyms).values(gymData).returning();
    return gym;
  }

  async getGymByCode(code: string): Promise<Gym | undefined> {
    const [gym] = await db.select().from(gyms).where(eq(gyms.code, code));
    return gym || undefined;
  }

  async getAllGyms(): Promise<Gym[]> {
    return await db.select().from(gyms).orderBy(desc(gyms.createdAt));
  }

  async getUserGyms(userId: number): Promise<Gym[]> {
    const memberships = await db.select({
      gym: gyms,
      role: gymMemberships.role
    })
      .from(gymMemberships)
      .innerJoin(gyms, eq(gymMemberships.gymId, gyms.id))
      .where(eq(gymMemberships.userId, userId));
    
    return memberships.map(m => ({ ...m.gym, userRole: m.role })) as any;
  }

  async deleteGym(gymId: number): Promise<boolean> {
    // Delete gym memberships first
    await db.delete(gymMemberships).where(eq(gymMemberships.gymId, gymId));
    
    // Unshare all notes from this gym
    await db.update(notes)
      .set({ gymId: null })
      .where(eq(notes.gymId, gymId));
    
    // Delete the gym
    const result = await db.delete(gyms).where(eq(gyms.id, gymId));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getGymNotes(gymId: number): Promise<Note[]> {
    const gymNotes = await db.select({
      note: notes,
      user: users
    })
      .from(notes)
      .innerJoin(users, eq(notes.userId, users.id))
      .where(eq(notes.gymId, gymId))
      .orderBy(desc(notes.createdAt));
    
    return gymNotes.map(gn => ({
      ...gn.note,
      author: {
        firstName: gn.user.firstName,
        lastName: gn.user.lastName,
        email: gn.user.email
      }
    })) as any;
  }

  async shareNoteToGym(noteId: string, gymId: number): Promise<void> {
    await db.update(notes)
      .set({ gymId, isShared: 0 })
      .where(eq(notes.id, noteId));
  }

  async unshareNoteFromGym(noteId: string): Promise<void> {
    await db.update(notes)
      .set({ gymId: null })
      .where(eq(notes.id, noteId));
  }

  async createGymMembership(membershipData: InsertGymMembership): Promise<GymMembership> {
    const [membership] = await db.insert(gymMemberships).values(membershipData).returning();
    return membership;
  }

  async getGymMembership(userId: number, gymId: number): Promise<GymMembership | undefined> {
    const [membership] = await db.select()
      .from(gymMemberships)
      .where(and(
        eq(gymMemberships.userId, userId),
        eq(gymMemberships.gymId, gymId)
      ));
    return membership || undefined;
  }
  
  async updateUserStripeCustomer(userId: number, stripeCustomerId: string): Promise<User | undefined> {
    const [user] = await db.update(users)
      .set({ stripeCustomerId })
      .where(eq(users.id, userId))
      .returning();
    return user || undefined;
  }
  
  async updateUserSubscription(userId: number, data: { subscriptionTier?: string; stripeSubscriptionId?: string | null; subscriptionStatus?: string; }): Promise<User | undefined> {
    const [user] = await db.update(users)
      .set(data)
      .where(eq(users.id, userId))
      .returning();
    return user || undefined;
  }
}

// Using in-memory storage as primary storage (database endpoint disabled)
class MemStoragePrimary implements IStorage {
  private users: User[] = [];
  private classes: Class[] = [];
  private videos: Video[] = [];
  private appNotes: AppNote[] = []; // Changed from notes to appNotes to match new schema
  private drawings: Drawing[] = [];
  private belts: Belt[] = [];
  private weeklyCommitments: WeeklyCommitment[] = [];
  private trainingVideos: TrainingVideo[] = [];
  private passwordResetTokens: PasswordResetToken[] = [];
  private noteLikes: NoteLike[] = [];
  private nextId = 1;
  private currentCommitmentId = 1;

  constructor() {
    // Pre-seed with a test user for easier development
    this.initializeTestData();
    // Restore all data from backup files
    setTimeout(() => this.restoreAllDataFromBackup(), 100);
    // Auto-backup data every 30 seconds to prevent loss
    setInterval(() => this.backupAllDataToFiles(), 30000);
  }

  private async initializeTestData() {
    try {
      // Import bcrypt dynamically for ES modules
      const bcrypt = await import('bcrypt');
      const hashedPassword = await bcrypt.hash('password123', 10);
      const joePassword = await bcrypt.hash('jitsjournal2025', 10);
      
      const testUser: User = {
        id: this.nextId++,
        email: 'test@example.com',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
        subscriptionStatus: 'free',
        subscriptionExpiresAt: null,
        createdAt: new Date(),
      };
      
      const joeUser: User = {
        id: this.nextId++,
        email: 'Joe@cleancutconstructions.com.au',
        password: joePassword,
        firstName: 'Joe',
        lastName: 'Clean Cut',
        subscriptionStatus: 'premium',
        subscriptionExpiresAt: new Date('2099-12-31'),
        createdAt: new Date(),
      };

      // Clear any existing joe833360@gmail.com accounts to allow fresh signup
      this.users = this.users.filter(u => u.email !== 'joe833360@gmail.com');
      
      this.users.push(testUser);
      this.users.push(joeUser);
      console.log('✅ Test user initialized: test@example.com / password123');
      console.log('✅ Joe user initialized: Joe@cleancutconstructions.com.au / jitsjournal2025 (premium)');
      console.log('✅ Ready for joe833360@gmail.com fresh signup with auto-premium');
    } catch (error) {
      console.error('Failed to initialize test data:', error);
    }
  }

  // Enhanced backup and restore system for data persistence
  private async backupAllDataToFiles() {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const backupDir = './data/bjj_backup';
      await fs.mkdir(backupDir, { recursive: true });
      
      // Backup all data arrays
      const backupData = {
        users: this.users,
        classes: this.classes,
        notes: this.notes,
        videos: this.videos,
        drawings: this.drawings,
        belts: this.belts,
        trainingVideos: this.trainingVideos,
        passwordResetTokens: this.passwordResetTokens,
        noteLikes: this.noteLikes,
        weeklyCommitments: this.weeklyCommitments,
        nextId: this.nextId,
        currentCommitmentId: this.currentCommitmentId,
        timestamp: new Date().toISOString()
      };
      
      await fs.writeFile(
        path.join(backupDir, 'all_data.json'),
        JSON.stringify(backupData, null, 2)
      );
      
      console.log('🔄 Data backup completed at', new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Failed to backup data:', error);
    }
  }

  private async restoreAllDataFromBackup() {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const backupFile = path.join('./data/bjj_backup', 'all_data.json');
      const backupData = JSON.parse(await fs.readFile(backupFile, 'utf8'));
      
      // Restore all data
      this.users = backupData.users || [];
      this.classes = backupData.classes || [];
      this.notes = backupData.notes || [];
      this.videos = backupData.videos || [];
      this.drawings = backupData.drawings || [];
      this.belts = backupData.belts || [];
      this.trainingVideos = backupData.trainingVideos || [];
      this.passwordResetTokens = backupData.passwordResetTokens || [];
      this.noteLikes = backupData.noteLikes || [];
      this.nextId = backupData.nextId || 1;
      this.currentCommitmentId = backupData.currentCommitmentId || 1;
      
      // Restore weekly commitments array
      this.weeklyCommitments = backupData.weeklyCommitments || [];
      
      console.log('✅ Data restored from backup:', backupData.timestamp);
      console.log(`📊 Restored: ${this.users.length} users, ${this.classes.length} classes, ${this.notes.length} notes`);
    } catch (error) {
      console.log('📝 No backup found or failed to restore, starting fresh:', error instanceof Error ? error.message : String(error));
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.find(user => user.id === id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.users.find(user => user.email === email);
  }


  async createUser(userData: InsertUser): Promise<User> {
    const user: User = {
      id: this.nextId++,
      email: userData.email,
      password: userData.password,
      firstName: userData.firstName || null,
      lastName: userData.lastName || null,
      subscriptionStatus: userData.subscriptionStatus || "free",
      subscriptionExpiresAt: userData.subscriptionExpiresAt || null,
      createdAt: new Date(),
    };
    this.users.push(user);
    return user;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const index = this.users.findIndex(user => user.id === id);
    if (index === -1) return undefined;
    
    this.users[index] = {
      ...this.users[index],
      ...userData,
    };
    return this.users[index];
  }

  // Classes - basic implementations
  async getClasses(userId?: number): Promise<Class[]> {
    return userId ? this.classes.filter(c => c.userId === userId) : this.classes;
  }
  async getClass(id: number): Promise<Class | undefined> {
    return this.classes.find(c => c.id === id);
  }
  async createClass(classData: InsertClass): Promise<Class> {
    const newClass: Class = { 
      id: this.nextId++, 
      ...classData, 
      trainingPartners: classData.trainingPartners || null,
      techniquesFocused: classData.techniquesFocused || null,
      rollingPartners: classData.rollingPartners || null,
      yourSubmissions: classData.yourSubmissions || 0,
      partnerSubmissions: classData.partnerSubmissions || 0,
      cardioRating: classData.cardioRating || null,
      userId: classData.userId || null,
      createdAt: new Date() 
    };
    this.classes.push(newClass);
    return newClass;
  }
  async updateClass(id: number, classData: Partial<InsertClass>): Promise<Class | undefined> {
    const index = this.classes.findIndex(c => c.id === id);
    if (index === -1) return undefined;
    this.classes[index] = { ...this.classes[index], ...classData };
    return this.classes[index];
  }
  async deleteClass(id: number): Promise<boolean> {
    const index = this.classes.findIndex(c => c.id === id);
    if (index === -1) return false;
    this.classes.splice(index, 1);
    return true;
  }

  // Videos
  async getVideos(userId?: number): Promise<Video[]> { return this.videos; }
  async getVideo(id: number): Promise<Video | undefined> { return this.videos.find(v => v.id === id); }
  async getVideosByCategory(category: string, userId?: number): Promise<Video[]> { return this.videos.filter(v => v.category === category); }
  async searchVideos(query: string, userId?: number): Promise<Video[]> { return this.videos.filter(v => v.title.includes(query)); }
  async createVideo(videoData: InsertVideo): Promise<Video> {
    const video: Video = { id: this.nextId++, ...videoData, duration: videoData.duration || null, description: videoData.description || null, tags: videoData.tags || null, isFavorite: videoData.isFavorite || null, thumbnailUrl: videoData.thumbnailUrl || null, createdAt: new Date() };
    this.videos.push(video);
    return video;
  }
  async updateVideo(id: number, videoData: Partial<InsertVideo>): Promise<Video | undefined> {
    const index = this.videos.findIndex(v => v.id === id);
    if (index === -1) return undefined;
    this.videos[index] = { ...this.videos[index], ...videoData };
    return this.videos[index];
  }
  async deleteVideo(id: number): Promise<boolean> {
    const index = this.videos.findIndex(v => v.id === id);
    if (index === -1) return false;
    this.videos.splice(index, 1);
    return true;
  }

  // Notes - using appNotes with integer user IDs
  async getNotes(userId?: number): Promise<AppNote[]> {
    return userId ? this.appNotes.filter(n => n.userId === userId) : this.appNotes;
  }
  async getNote(id: string): Promise<AppNote | undefined> { return this.appNotes.find(n => n.id === id); }
  async searchNotes(query: string, userId?: number): Promise<AppNote[]> {
    let filtered = this.appNotes.filter(n => n.content.includes(query));
    return userId ? filtered.filter(n => n.userId === userId) : filtered;
  }
  async createNote(noteData: InsertAppNote): Promise<AppNote> {
    // Generate UUID for the note ID
    const noteId = this.generateUUID();
    const note: AppNote = { 
      id: noteId, 
      ...noteData, 
      tags: noteData.tags || null, 
      linkedClassId: noteData.linkedClassId || null, 
      linkedVideoId: noteData.linkedVideoId || null, 
      isShared: noteData.isShared || 0, 
      sharedWithUsers: noteData.sharedWithUsers || null, 
      videoUrl: noteData.videoUrl || null, 
      videoFileName: noteData.videoFileName || null, 
      videoThumbnail: noteData.videoThumbnail || null, 
      createdAt: new Date(), 
      updatedAt: new Date() 
    };
    this.appNotes.push(note);
    return note;
  }
  async updateNote(id: string, noteData: Partial<InsertAppNote>): Promise<AppNote | undefined> {
    const index = this.appNotes.findIndex(n => n.id === id);
    if (index === -1) return undefined;
    this.appNotes[index] = { ...this.appNotes[index], ...noteData, updatedAt: new Date() };
    return this.appNotes[index];
  }
  async deleteNote(id: string): Promise<boolean> {
    const index = this.appNotes.findIndex(n => n.id === id);
    if (index === -1) return false;
    this.appNotes.splice(index, 1);
    return true;
  }
  async shareNote(noteId: string, targetUserId: number): Promise<boolean> { return true; }

  // Helper method to generate UUIDs for notes
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Other methods - minimal implementations
  async getDrawings(userId?: number): Promise<Drawing[]> { 
    return this.drawings; 
  }
  async getDrawing(id: number): Promise<Drawing | undefined> { return this.drawings.find(d => d.id === id); }
  async createDrawing(drawingData: InsertDrawing): Promise<Drawing> {
    const drawing: Drawing = { id: this.nextId++, ...drawingData, linkedClassId: drawingData.linkedClassId || null, linkedNoteId: drawingData.linkedNoteId || null, createdAt: new Date() };
    this.drawings.push(drawing);
    return drawing;
  }
  async updateDrawing(id: number, drawingData: Partial<InsertDrawing>): Promise<Drawing | undefined> {
    const index = this.drawings.findIndex(d => d.id === id);
    if (index === -1) return undefined;
    this.drawings[index] = { ...this.drawings[index], ...drawingData };
    return this.drawings[index];
  }
  async deleteDrawing(id: number): Promise<boolean> {
    const index = this.drawings.findIndex(d => d.id === id);
    if (index === -1) return false;
    this.drawings.splice(index, 1);
    return true;
  }

  async getBelts(userId: number): Promise<Belt[]> { return this.belts.filter(b => b.userId === userId); }
  async getCurrentBelt(userId: number): Promise<Belt | undefined> { return this.belts.filter(b => b.userId === userId).sort((a, b) => b.promotionDate.getTime() - a.promotionDate.getTime())[0]; }
  async createBelt(beltData: InsertBelt): Promise<Belt> {
    const belt: Belt = { id: this.nextId++, ...beltData, instructor: beltData.instructor || null, notes: beltData.notes || null, userId: beltData.userId || null, stripes: beltData.stripes || 0, createdAt: new Date() };
    this.belts.push(belt);
    return belt;
  }
  async updateBelt(id: number, beltData: Partial<InsertBelt>): Promise<Belt | undefined> {
    const index = this.belts.findIndex(b => b.id === id);
    if (index === -1) return undefined;
    this.belts[index] = { ...this.belts[index], ...beltData };
    return this.belts[index];
  }
  async deleteBelt(id: number): Promise<boolean> {
    const index = this.belts.findIndex(b => b.id === id);
    if (index === -1) return false;
    this.belts.splice(index, 1);
    return true;
  }


  async getTrainingVideos(): Promise<TrainingVideo[]> { return this.trainingVideos; }
  async createTrainingVideo(videoData: InsertTrainingVideo): Promise<TrainingVideo> {
    const video: TrainingVideo = { id: this.nextId++, ...videoData, duration: videoData.duration || null, description: videoData.description || null, thumbnailUrl: videoData.thumbnailUrl || null, tags: videoData.tags || null, category: videoData.category || null, views: videoData.views || null, likes: videoData.likes || null, isPublic: videoData.isPublic || null, createdAt: new Date() };
    this.trainingVideos.push(video);
    return video;
  }
  async deleteTrainingVideo(id: number): Promise<boolean> {
    const index = this.trainingVideos.findIndex(v => v.id === id);
    if (index === -1) return false;
    this.trainingVideos.splice(index, 1);
    return true;
  }



  // Missing methods to complete interface - getCurrentWeekCommitment moved to proper location below
  async getTrainingVideo(id: number): Promise<TrainingVideo | undefined> {
    return this.trainingVideos.find(v => v.id === id);
  }
  async updateTrainingVideo(id: number, videoData: Partial<InsertTrainingVideo>): Promise<TrainingVideo | undefined> {
    const index = this.trainingVideos.findIndex(v => v.id === id);
    if (index === -1) return undefined;
    this.trainingVideos[index] = { ...this.trainingVideos[index], ...videoData };
    return this.trainingVideos[index];
  }
  async toggleNoteSharing(noteId: string, userId: number): Promise<Note | undefined> {
    const note = this.notes.find(n => n.id === noteId && n.userId === userId);
    if (note) {
      note.isShared = note.isShared === 1 ? 0 : 1;
      note.updatedAt = new Date();
    }
    return note;
  }
  async getSharedNotes(): Promise<Note[]> {
    const sharedNotes = this.notes.filter(n => n.isShared === 1);
    // Include author information and like counts for shared notes
    return sharedNotes.map(note => {
      const author = this.users.find(u => u.id === note.userId);
      const likeCount = this.noteLikes.filter(like => like.noteId === note.id).length;
      
      return {
        ...note,
        author: author ? {
          firstName: author.firstName,
          lastName: author.lastName
        } : null,
        likeCount
      };
    });
  }
  async createPasswordResetToken(userId: number, token: string, expiresAt: Date): Promise<PasswordResetToken> {
    const resetToken: PasswordResetToken = {
      id: this.nextId++,
      userId,
      token,
      expiresAt,
      used: 0,
      createdAt: new Date()
    };
    this.passwordResetTokens.push(resetToken);
    return resetToken;
  }

  // Weekly Commitments methods using array storage

  async getWeeklyCommitments(userId?: number): Promise<WeeklyCommitment[]> {
    const commitments = this.weeklyCommitments;
    if (userId) {
      return commitments.filter(c => c.userId === userId);
    }
    return commitments;
  }

  async getCurrentWeeklyCommitment(userId?: number): Promise<WeeklyCommitment | undefined> {
    const now = new Date();
    const weekStart = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - now.getUTCDay());
    weekStart.setUTCHours(0, 0, 0, 0);
    const targetWeekString = weekStart.toISOString();

    const commitments = this.weeklyCommitments;
    
    console.log(`🔍 getCurrentWeeklyCommitment: Looking for week ${targetWeekString} userId: ${userId}`);
    console.log(`📊 Storage has ${commitments.length} total commitments`);

    if (userId) {
      return commitments.find(c => 
        new Date(c.weekStartDate).toISOString() === targetWeekString && c.userId === userId
      );
    }

    return commitments.find(c => 
      new Date(c.weekStartDate).toISOString() === targetWeekString
    );
  }

  async createWeeklyCommitment(commitmentData: InsertWeeklyCommitment): Promise<WeeklyCommitment> {
    const newCommitment: WeeklyCommitment = {
      id: this.currentCommitmentId++,
      ...commitmentData,
      userId: commitmentData.userId || null,
      completedClasses: commitmentData.completedClasses || null,
      isCompleted: commitmentData.isCompleted || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.weeklyCommitments.push(newCommitment);
    this.saveWeeklyCommitmentsBackup(); // Backup to prevent data loss
    
    console.log('✅ CREATED: Commitment ID', newCommitment.id);
    console.log(`📊 Total storage: ${this.weeklyCommitments.length} commitments`);
    
    return newCommitment;
  }

  async updateWeeklyCommitment(id: number, commitmentData: Partial<InsertWeeklyCommitment>): Promise<WeeklyCommitment | undefined> {
    const index = this.weeklyCommitments.findIndex(c => c.id === id);
    if (index === -1) return undefined;

    const updatedCommitment = { ...this.weeklyCommitments[index], ...commitmentData, updatedAt: new Date() };
    this.weeklyCommitments[index] = updatedCommitment;
    this.saveWeeklyCommitmentsBackup(); // Backup to prevent data loss

    return updatedCommitment;
  }

  async deleteWeeklyCommitment(id: number): Promise<boolean> {
    const index = this.weeklyCommitments.findIndex(c => c.id === id);
    if (index === -1) return false;
    
    this.weeklyCommitments.splice(index, 1);
    this.saveWeeklyCommitmentsBackup(); // Backup to prevent data loss
    return true;
  }

  // Weekly commitments backup/restore to prevent data loss on server restart
  private saveWeeklyCommitmentsBackup() {
    try {
      const backupData = {
        commitments: this.weeklyCommitments,
        currentCommitmentId: this.currentCommitmentId,
        timestamp: new Date().toISOString()
      };
      
      // Save to a JSON file that persists across restarts
      import('fs').then(fs => {
        import('path').then(path => {
          const backupPath = path.join(process.cwd(), 'weekly_commitments_backup.json');
          fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
          console.log(`💾 Weekly commitments backed up to ${backupPath}`);
        });
      }).catch(error => {
        console.error('Failed to backup weekly commitments:', error);
      });
    } catch (error) {
      console.error('Failed to backup weekly commitments:', error);
    }
  }

  private async restoreWeeklyCommitmentsBackup() {
    try {
      const fs = await import('fs');
      const path = await import('path');
      const backupPath = path.join(process.cwd(), 'weekly_commitments_backup.json');
      
      if (fs.existsSync(backupPath)) {
        const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
        
        // Restore commitments
        this.weeklyCommitments = backupData.commitments || [];
        this.currentCommitmentId = backupData.currentCommitmentId || 1;
        
        console.log(`🔄 Restored ${this.weeklyCommitments.length} weekly commitments from backup`);
        console.log(`📅 Backup timestamp: ${backupData.timestamp}`);
      } else {
        console.log('📝 No weekly commitments backup found, starting fresh');
      }
    } catch (error) {
      console.error('Failed to restore weekly commitments backup:', error);
      console.log('📝 Starting with empty weekly commitments');
    }
  }

  // Missing interface methods
  async getBelt(id: number): Promise<Belt | undefined> {
    return this.belts.find(b => b.id === id);
  }

  async getClassStats(userId?: number): Promise<{ totalClasses: number; lastPromotionDate?: string; currentBelt?: string; currentStripes?: number; }> {
    const userClasses = userId ? this.classes.filter(c => c.userId === userId) : this.classes;
    const userBelts = userId ? this.belts.filter(b => b.userId === userId) : this.belts;
    
    const currentBelt = userBelts.sort((a, b) => new Date(b.promotionDate).getTime() - new Date(a.promotionDate).getTime())[0];
    
    return {
      totalClasses: userClasses.length,
      lastPromotionDate: currentBelt?.promotionDate?.toISOString(),
      currentBelt: currentBelt?.belt,
      currentStripes: currentBelt?.stripes
    };
  }

  async getCurrentWeekCommitment(userId?: number): Promise<WeeklyCommitment | undefined> {
    const now = new Date();
    const weekStart = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - now.getUTCDay());
    weekStart.setUTCHours(0, 0, 0, 0);
    
    return this.weeklyCommitments.find(c => {
      const commitmentWeekStart = new Date(c.weekStartDate);
      return commitmentWeekStart.getTime() === weekStart.getTime() && (!userId || c.userId === userId);
    });
  }

  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    return this.passwordResetTokens.find(t => t.token === token);
  }

  async markPasswordResetTokenAsUsed(tokenId: number): Promise<void> {
    const token = this.passwordResetTokens.find(t => t.id === tokenId);
    if (token) {
      token.used = 1;
    }
  }

  async deleteExpiredPasswordResetTokens(): Promise<void> {
    const now = new Date();
    this.passwordResetTokens = this.passwordResetTokens.filter(t => 
      t.used === 0 || new Date(t.expiresAt) > now
    );
  }

  // Note Likes Implementation
  async likeNote(noteId: number, userId: number): Promise<boolean> {
    // Check if already liked
    const existingLike = this.noteLikes.find(like => like.noteId === noteId && like.userId === userId);
    if (existingLike) {
      return false; // Already liked
    }

    const like: NoteLike = {
      id: this.nextId++,
      noteId,
      userId,
      createdAt: new Date()
    };
    
    this.noteLikes.push(like);
    return true;
  }

  async unlikeNote(noteId: number, userId: number): Promise<boolean> {
    const index = this.noteLikes.findIndex(like => like.noteId === noteId && like.userId === userId);
    if (index === -1) {
      return false; // Not liked
    }

    this.noteLikes.splice(index, 1);
    return true;
  }

  async getNoteLikes(noteId: string): Promise<NoteLike[]> {
    return this.noteLikes.filter(like => like.noteId === noteId);
  }

  async getUserNoteLikes(userId: number): Promise<NoteLike[]> {
    return this.noteLikes.filter(like => like.userId === userId);
  }

  async isNoteLikedByUser(noteId: string, userId: number): Promise<boolean> {
    return this.noteLikes.some(like => like.noteId === noteId && like.userId === userId);
  }

  async getNoteWithLikes(noteId: string, userId?: number): Promise<Note & { likeCount: number; isLikedByUser: boolean } | undefined> {
    const note = this.notes.find(n => n.id === noteId);
    if (!note) return undefined;

    const likeCount = this.noteLikes.filter(like => like.noteId === noteId).length;
    const isLikedByUser = userId ? await this.isNoteLikedByUser(noteId, userId) : false;

    return {
      ...note,
      likeCount,
      isLikedByUser
    };
  }

  // Game Plans stub implementations (not used in memory storage mode)
  async getGamePlans(userId: number): Promise<GamePlan[]> {
    return [];
  }

  async getGamePlanNames(userId: number): Promise<string[]> {
    return [];
  }

  async getGamePlanByName(userId: number, planName: string): Promise<GamePlan[]> {
    return [];
  }

  async createGamePlanMove(userId: number, moveData: InsertGamePlan): Promise<GamePlan> {
    throw new Error("Game plans not implemented in memory storage mode");
  }

  async updateGamePlanMove(moveId: string, userId: number, moveData: Partial<InsertGamePlan>): Promise<GamePlan | undefined> {
    return undefined;
  }

  async deleteGamePlanMove(moveId: string, userId: number): Promise<boolean> {
    return false;
  }

  // Gym stub implementations (not used in memory storage mode)
  async createGym(gymData: InsertGym): Promise<Gym> {
    throw new Error("Gyms not implemented in memory storage mode");
  }

  async getGymByCode(code: string): Promise<Gym | undefined> {
    return undefined;
  }

  async getAllGyms(): Promise<Gym[]> {
    return [];
  }

  async getUserGyms(userId: number): Promise<Gym[]> {
    return [];
  }

  async getGymNotes(gymId: number): Promise<Note[]> {
    return [];
  }

  async shareNoteToGym(noteId: string, gymId: number): Promise<void> {
    // Not implemented in memory storage mode
  }

  async unshareNoteFromGym(noteId: string): Promise<void> {
    // Not implemented in memory storage mode
  }

  async createGymMembership(membershipData: InsertGymMembership): Promise<GymMembership> {
    throw new Error("Gym memberships not implemented in memory storage mode");
  }

  async getGymMembership(userId: number, gymId: number): Promise<GymMembership | undefined> {
    return undefined;
  }
  
  async updateUserStripeCustomer(userId: number, stripeCustomerId: string): Promise<User | undefined> {
    throw new Error("Stripe not implemented in memory storage mode");
  }
  
  async updateUserSubscription(userId: number, data: { subscriptionTier?: string; stripeSubscriptionId?: string | null; subscriptionStatus?: string; }): Promise<User | undefined> {
    throw new Error("Stripe not implemented in memory storage mode");
  }
}

// Duplicate storage classes removed - using only MemStoragePrimary above


// Using Supabase database for persistent data storage
// All data will be stored permanently in Supabase PostgreSQL database
export const storage = new DatabaseStorage(); // Using database storage for persistent data

