import { supabase } from './supabase';

// Helper to get integer user ID from Supabase UUID
export async function getUserId(supabaseUid: string): Promise<number | null> {
  const { data, error } = await supabase
    .from('auth_identities')
    .select('user_id')
    .eq('supabase_uid', supabaseUid)
    .single();

  if (error || !data) {
    console.error('Failed to get user ID:', error);
    return null;
  }

  return data.user_id;
}

// Classes queries
export const classesQueries = {
  async getAll(userId: number) {
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async create(userId: number, classData: any) {
    // Map camelCase fields to snake_case database columns
    const dbData = {
      date: classData.date,
      time: classData.time,
      duration: classData.duration,
      class_type: classData.classType, // Map to snake_case
      instructor: classData.instructor || '', // Ensure not undefined
      techniques_focused: classData.techniquesFocused || '', // Ensure not undefined
      rolling_partners: classData.rollingPartners || [], // Already an array
      your_submissions: classData.yourSubmissions || 0, // Map to snake_case
      partner_submissions: classData.partnerSubmissions || 0, // Map to snake_case
      cardio_rating: classData.cardioRating || 3, // Map to snake_case
      user_id: userId,
    };

    console.log('Class data being sent to Supabase:', JSON.stringify(dbData, null, 2));

    const { data, error } = await supabase
      .from('classes')
      .insert(dbData)
      .select()
      .single();

    if (error) {
      console.error('Class creation error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      throw error;
    }
    console.log('Class created successfully:', data);
    return data;
  },

  async update(classId: number, userId: number, classData: any) {
    // Map camelCase fields to snake_case database columns
    const dbData = {
      date: classData.date,
      time: classData.time,
      duration: classData.duration,
      class_type: classData.classType,
      instructor: classData.instructor || '',
      techniques_focused: classData.techniquesFocused || '',
      rolling_partners: classData.rollingPartners || [],
      your_submissions: classData.yourSubmissions || 0,
      partner_submissions: classData.partnerSubmissions || 0,
      cardio_rating: classData.cardioRating || 3,
    };

    const { data, error } = await supabase
      .from('classes')
      .update(dbData)
      .eq('id', classId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(classId: number, userId: number) {
    const { error } = await supabase
      .from('classes')
      .delete()
      .eq('id', classId)
      .eq('user_id', userId);

    if (error) throw error;
    return { success: true };
  },
};

// Notes queries
export const notesQueries = {
  async getAll(userId: number) {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getShared() {
    const { data, error } = await supabase
      .from('notes')
      .select(`
        *,
        users!inner(first_name, last_name, email)
      `)
      .eq('is_shared', 1)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async create(userId: number, noteData: any) {
    console.log('Creating note with userId:', userId, 'noteData:', noteData);
    const { data, error } = await supabase
      .from('notes')
      .insert({
        ...noteData,
        user_id: userId,
      })
      .select()
      .single();

    if (error) {
      console.error('Note creation error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      throw error;
    }
    console.log('Note created successfully:', data);
    return data;
  },

  async update(noteId: string, userId: number, noteData: any) {
    const { data, error } = await supabase
      .from('notes')
      .update(noteData)
      .eq('id', noteId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(noteId: string, userId: number) {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', noteId)
      .eq('user_id', userId);

    if (error) throw error;
  },

  async adminDelete(noteId: string) {
    // Admin delete - doesn't check user_id, allows admins to delete any note
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', noteId);

    if (error) throw error;
  },

  async toggleShare(noteId: string, userId: number, isShared: boolean) {
    const { data, error } = await supabase
      .from('notes')
      .update({ is_shared: isShared ? 1 : 0 })
      .eq('id', noteId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

// Belts queries
export const beltsQueries = {
  async getCurrent(userId: number) {
    const { data, error } = await supabase
      .from('belts')
      .select('*')
      .eq('user_id', userId)
      .order('promotion_date', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
    return data;
  },

  async getAll(userId: number) {
    const { data, error } = await supabase
      .from('belts')
      .select('*')
      .eq('user_id', userId)
      .order('promotion_date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async create(userId: number, beltData: any) {
    const { data, error } = await supabase
      .from('belts')
      .insert({
        belt: beltData.belt,
        stripes: beltData.stripes,
        promotion_date: beltData.promotionDate,
        instructor: beltData.instructor,
        notes: beltData.notes,
        user_id: userId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(beltId: number, userId: number, beltData: any) {
    const { data, error } = await supabase
      .from('belts')
      .update({
        belt: beltData.belt,
        stripes: beltData.stripes,
        promotion_date: beltData.promotionDate,
        instructor: beltData.instructor,
        notes: beltData.notes,
      })
      .eq('id', beltId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(beltId: number, userId: number) {
    const { error } = await supabase
      .from('belts')
      .delete()
      .eq('id', beltId)
      .eq('user_id', userId);

    if (error) throw error;
  },
};

// Weekly commitments queries
export const weeklyCommitmentsQueries = {
  async getCurrent(userId: number) {
    // Get the start of the current week (Sunday) in UTC
    const today = new Date();
    const dayOfWeek = today.getUTCDay();
    const daysToSunday = dayOfWeek === 0 ? 0 : -dayOfWeek;
    const weekStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + daysToSunday, 0, 0, 0, 0));
    const weekStartStr = weekStart.toISOString().split('T')[0]; // Just the date part
    
    console.log('getCurrent - Looking for week:', weekStartStr);

    const { data, error } = await supabase
      .from('weekly_commitments')
      .select('*')
      .eq('user_id', userId)
      .gte('week_start_date', weekStartStr)
      .lt('week_start_date', new Date(weekStart.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    console.log('getCurrent - Found:', data, 'Error:', error);
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async create(userId: number, commitmentData: any) {
    console.log('Creating weekly commitment with userId:', userId, 'data:', commitmentData);
    const { data, error } = await supabase
      .from('weekly_commitments')
      .insert({
        week_start_date: commitmentData.weekStartDate,
        target_classes: commitmentData.targetClasses,
        completed_classes: commitmentData.completedClasses || 0,
        is_completed: commitmentData.isCompleted || 0,
        user_id: userId,
      })
      .select()
      .single();

    if (error) {
      console.error('Weekly commitment creation error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      throw error;
    }
    console.log('Weekly commitment created successfully:', data);
    return data;
  },

  async update(commitmentId: number, userId: number, commitmentData: any) {
    console.log('Updating weekly commitment:', commitmentId, 'userId:', userId, 'data:', commitmentData);
    
    // Map camelCase to snake_case for database
    const dbData: any = {};
    if (commitmentData.weekStartDate !== undefined) dbData.week_start_date = commitmentData.weekStartDate;
    if (commitmentData.targetClasses !== undefined) dbData.target_classes = commitmentData.targetClasses;
    if (commitmentData.completedClasses !== undefined) dbData.completed_classes = commitmentData.completedClasses;
    if (commitmentData.isCompleted !== undefined) dbData.is_completed = commitmentData.isCompleted;
    
    const { data, error } = await supabase
      .from('weekly_commitments')
      .update(dbData)
      .eq('id', commitmentId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Weekly commitment update error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      throw error;
    }
    console.log('Weekly commitment updated successfully:', data);
    return data;
  },
};

// User stats queries
export const userStatsQueries = {
  async get(userId: number) {
    // Get total classes count
    const { count: totalClasses } = await supabase
      .from('classes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Get last promotion date
    const { data: lastBelt } = await supabase
      .from('belts')
      .select('promotion_date')
      .eq('user_id', userId)
      .order('promotion_date', { ascending: false })
      .limit(1)
      .single();

    return {
      totalClasses: totalClasses || 0,
      lastPromotionDate: lastBelt?.promotion_date || null,
    };
  },
};

// Drawings queries
export const drawingsQueries = {
  async getAll(userId: number) {
    const { data, error } = await supabase
      .from('drawings')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async create(userId: number, drawingData: any) {
    const { data, error } = await supabase
      .from('drawings')
      .insert({
        ...drawingData,
        user_id: userId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

// Game Plan queries
export const gamePlansQueries = {
  // Get all game plans for a user, organized by plan name
  async getAll(userId: number) {
    const { data, error } = await supabase
      .from('game_plans')
      .select('*')
      .eq('user_id', userId)
      .order('plan_name', { ascending: true })
      .order('move_order', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Get a specific plan tree (all moves for a plan name)
  async getByPlanName(userId: number, planName: string) {
    const { data, error } = await supabase
      .from('game_plans')
      .select('*')
      .eq('user_id', userId)
      .eq('plan_name', planName)
      .order('move_order', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Get children of a specific move
  async getChildren(userId: number, parentId: string) {
    const { data, error } = await supabase
      .from('game_plans')
      .select('*')
      .eq('user_id', userId)
      .eq('parent_id', parentId)
      .order('move_order', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Create a new move
  async create(userId: number, moveData: any) {
    const { data, error } = await supabase
      .from('game_plans')
      .insert({
        user_id: userId,
        plan_name: moveData.planName,
        move_name: moveData.moveName,
        description: moveData.description,
        parent_id: moveData.parentId || null,
        move_order: moveData.moveOrder || 0,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update a move
  async update(moveId: string, userId: number, moveData: any) {
    const { data, error } = await supabase
      .from('game_plans')
      .update({
        move_name: moveData.moveName,
        description: moveData.description,
        move_order: moveData.moveOrder,
      })
      .eq('id', moveId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete a move and all its descendants
  async delete(moveId: string, userId: number) {
    // First get all descendants recursively
    const getAllDescendants = async (parentId: string): Promise<string[]> => {
      const { data } = await supabase
        .from('game_plans')
        .select('id')
        .eq('user_id', userId)
        .eq('parent_id', parentId);

      if (!data || data.length === 0) return [];

      const childIds = data.map(d => d.id);
      const grandchildIds = await Promise.all(
        childIds.map(id => getAllDescendants(id))
      );

      return [...childIds, ...grandchildIds.flat()];
    };

    const descendantIds = await getAllDescendants(moveId);
    const idsToDelete = [moveId, ...descendantIds];

    const { error } = await supabase
      .from('game_plans')
      .delete()
      .in('id', idsToDelete)
      .eq('user_id', userId);

    if (error) throw error;
    return { deleted: idsToDelete.length };
  },

  // Get unique plan names for a user
  async getPlanNames(userId: number) {
    const { data, error } = await supabase
      .from('game_plans')
      .select('plan_name')
      .eq('user_id', userId)
      .order('plan_name', { ascending: true });

    if (error) throw error;
    
    // Return unique plan names
    const uniquePlans = [...new Set((data || []).map(d => d.plan_name))];
    return uniquePlans;
  },
};
