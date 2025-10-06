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
    const { data, error } = await supabase
      .from('classes')
      .insert({
        ...classData,
        user_id: userId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
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
    const { data, error } = await supabase
      .from('notes')
      .insert({
        ...noteData,
        user_id: userId,
      })
      .select()
      .single();

    if (error) throw error;
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
        ...beltData,
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
      .update(beltData)
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
    // Get the start of the current week (Sunday)
    const today = new Date();
    const dayOfWeek = today.getDay();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - dayOfWeek);
    weekStart.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('weekly_commitments')
      .select('*')
      .eq('user_id', userId)
      .eq('week_start_date', weekStart.toISOString())
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async create(userId: number, commitmentData: any) {
    const { data, error } = await supabase
      .from('weekly_commitments')
      .insert({
        ...commitmentData,
        user_id: userId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(commitmentId: number, userId: number, commitmentData: any) {
    const { data, error } = await supabase
      .from('weekly_commitments')
      .update(commitmentData)
      .eq('id', commitmentId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
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
