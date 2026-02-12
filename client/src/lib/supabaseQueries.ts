import { supabase } from './supabase';
import { Capacitor } from '@capacitor/core';

const API_BASE_URL = Capacitor.isNativePlatform()
  ? 'https://jitsjournal-backend.onrender.com'
  : (import.meta.env.VITE_API_BASE_URL || '');

// Helper to get auth token and supabase user ID for API calls
async function getAuthInfo(): Promise<{ token: string | null; supabaseId: string | null }> {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    token: session?.access_token || null,
    supabaseId: session?.user?.id || null,
  };
}

// Build URL with supabaseId query param for mobile auth
function buildUrl(endpoint: string, supabaseId: string | null): string {
  const base = `${API_BASE_URL}${endpoint}`;
  if (supabaseId && Capacitor.isNativePlatform()) {
    return `${base}${base.includes('?') ? '&' : '?'}supabaseId=${supabaseId}`;
  }
  return base;
}

// Helper to get integer user ID from Supabase UUID - using backend API
export async function getUserId(supabaseUid: string): Promise<number | null> {
  try {
    const { token } = await getAuthInfo();
    // Use path param format matching backend: /api/user/by-supabase-id/:supabaseId
    // Use API_BASE_URL for native platform compatibility (hits Render backend)
    const url = `${API_BASE_URL}/api/user/by-supabase-id/${supabaseUid}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.error('Failed to get user ID:', response.status);
      return null;
    }
    
    const data = await response.json();
    return data.id || data.userId || null;
  } catch (error) {
    console.error('Failed to get user ID:', error);
    return null;
  }
}

// Classes queries
export const classesQueries = {
  async getAll(userId: string | number) {
    const { token, supabaseId } = await getAuthInfo();
    const url = buildUrl('/api/classes', supabaseId);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch classes');
    }
    
    const data = await response.json();
    
    // Transform snake_case to camelCase for frontend (with fallbacks for both formats)
    return (data || []).map((classItem: any) => ({
      ...classItem,
      classType: classItem.classType || classItem.class_type,
      techniquesFocused: classItem.techniquesFocused || classItem.techniques_focused,
      rollingPartners: classItem.rollingPartners || classItem.rolling_partners,
      yourSubmissions: classItem.yourSubmissions ?? classItem.your_submissions,
      partnerSubmissions: classItem.partnerSubmissions ?? classItem.partner_submissions,
      cardioRating: classItem.cardioRating ?? classItem.cardio_rating,
    }));
  },

  async create(userId: number, classData: any) {
    const { token, supabaseId } = await getAuthInfo();
    const url = buildUrl('/api/classes', supabaseId);
    
    console.log('Creating class via backend API:', url, classData);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        date: classData.date,
        time: classData.time,
        duration: classData.duration,
        classType: classData.classType,
        instructor: classData.instructor || '',
        techniquesFocused: classData.techniquesFocused || '',
        rollingPartners: classData.rollingPartners || [],
        yourSubmissions: classData.yourSubmissions || 0,
        partnerSubmissions: classData.partnerSubmissions || 0,
        cardioRating: classData.cardioRating || 3,
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('Class creation error:', error);
      throw new Error('Failed to create class');
    }
    
    const data = await response.json();
    console.log('Class created successfully:', data);
    
    return {
      ...data,
      classType: data.classType || data.class_type,
      techniquesFocused: data.techniquesFocused || data.techniques_focused,
      rollingPartners: data.rollingPartners || data.rolling_partners,
      yourSubmissions: data.yourSubmissions || data.your_submissions,
      partnerSubmissions: data.partnerSubmissions || data.partner_submissions,
      cardioRating: data.cardioRating || data.cardio_rating,
    };
  },

  async update(classId: number, userId: number, classData: any) {
    const { token, supabaseId } = await getAuthInfo();
    const url = buildUrl(`/api/classes/${classId}`, supabaseId);
    
    console.log('Updating class via backend API:', url, classData);
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        date: classData.date,
        time: classData.time,
        duration: classData.duration,
        classType: classData.classType,
        instructor: classData.instructor || '',
        techniquesFocused: classData.techniquesFocused || '',
        rollingPartners: classData.rollingPartners || [],
        yourSubmissions: classData.yourSubmissions || 0,
        partnerSubmissions: classData.partnerSubmissions || 0,
        cardioRating: classData.cardioRating || 3,
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('Class update error:', error);
      throw new Error('Failed to update class');
    }
    
    const data = await response.json();
    console.log('Class updated successfully:', data);
    
    return {
      ...data,
      classType: data.classType || data.class_type,
      techniquesFocused: data.techniquesFocused || data.techniques_focused,
      rollingPartners: data.rollingPartners || data.rolling_partners,
      yourSubmissions: data.yourSubmissions || data.your_submissions,
      partnerSubmissions: data.partnerSubmissions || data.partner_submissions,
      cardioRating: data.cardioRating || data.cardio_rating,
    };
  },

  async delete(classId: number, userId: number) {
    const { token, supabaseId } = await getAuthInfo();
    const url = buildUrl(`/api/classes/${classId}`, supabaseId);
    
    console.log('Deleting class via backend API:', url);
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('Class delete error:', error);
      throw new Error('Failed to delete class');
    }
    
    return { success: true };
  },
};

// Notes queries - using backend API
export const notesQueries = {
  async getAll(userId: number) {
    const { token, supabaseId } = await getAuthInfo();
    const url = buildUrl('/api/notes', supabaseId);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) throw new Error('Failed to fetch notes');
    const data = await response.json();
    
    return (data || []).map((note: any) => ({
      ...note,
      userId: note.userId || note.user_id,
      linkedClassId: note.linkedClassId || note.linked_class_id,
      linkedVideoId: note.linkedVideoId || note.linked_video_id,
      isShared: note.isShared || note.is_shared,
      sharedWithUsers: note.sharedWithUsers || note.shared_with_users,
      videoUrl: note.videoUrl || note.video_url,
      videoFileName: note.videoFileName || note.video_file_name,
      videoThumbnail: note.videoThumbnail || note.video_thumbnail,
      createdAt: note.createdAt || note.created_at,
      updatedAt: note.updatedAt || note.updated_at,
    }));
  },

  async getShared() {
    const { token, supabaseId } = await getAuthInfo();
    const url = buildUrl('/api/notes/shared', supabaseId);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) throw new Error('Failed to fetch shared notes');
    return await response.json() || [];
  },

  async create(userId: number, noteData: any) {
    const { token, supabaseId } = await getAuthInfo();
    const url = buildUrl('/api/notes', supabaseId);
    
    console.log('Creating note via backend API:', url, noteData);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: noteData.title || '',
        content: noteData.content || '',
        tags: noteData.tags && noteData.tags.length > 0 ? noteData.tags : null,
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('Note creation error:', error);
      throw new Error('Failed to create note');
    }
    
    const data = await response.json();
    console.log('Note created successfully:', data);
    return data;
  },

  async update(noteId: string, userId: number, noteData: any) {
    const { token, supabaseId } = await getAuthInfo();
    const url = buildUrl(`/api/notes/${noteId}`, supabaseId);
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(noteData),
    });
    
    if (!response.ok) throw new Error('Failed to update note');
    return await response.json();
  },

  async delete(noteId: string, userId: number) {
    const { token, supabaseId } = await getAuthInfo();
    const url = buildUrl(`/api/notes/${noteId}`, supabaseId);
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) throw new Error('Failed to delete note');
  },

  async adminDelete(noteId: string) {
    const { token, supabaseId } = await getAuthInfo();
    const url = buildUrl(`/api/notes/${noteId}/admin`, supabaseId);
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) throw new Error('Failed to admin delete note');
  },

  async toggleShare(noteId: string, userId: number, isShared: boolean) {
    const { token, supabaseId } = await getAuthInfo();
    const url = buildUrl(`/api/notes/${noteId}/toggle-sharing`, supabaseId);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ isShared: isShared ? 1 : 0 }),
    });
    
    if (!response.ok) throw new Error('Failed to toggle note share');
    return await response.json();
  },
};

// Belts queries - using backend API
export const beltsQueries = {
  async getCurrent(userId: number) {
    const { token, supabaseId } = await getAuthInfo();
    const url = buildUrl('/api/belts/current', supabaseId);
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error('Failed to fetch current belt');
    }
    const data = await response.json();
    return data ? {
      ...data,
      promotionDate: data.promotion_date,
    } : null;
  },

  async getAll(userId: number) {
    const { token, supabaseId } = await getAuthInfo();
    const url = buildUrl('/api/belts', supabaseId);
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) throw new Error('Failed to fetch belts');
    const data = await response.json();
    return (data || []).map((belt: any) => ({
      ...belt,
      promotionDate: belt.promotion_date,
    }));
  },

  async create(userId: number, beltData: any) {
    const { token, supabaseId } = await getAuthInfo();
    const url = buildUrl('/api/belts', supabaseId);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        belt: beltData.belt,
        stripes: beltData.stripes,
        promotion_date: beltData.promotionDate,
        instructor: beltData.instructor,
        notes: beltData.notes,
      }),
    });
    if (!response.ok) throw new Error('Failed to create belt');
    const data = await response.json();
    return {
      ...data,
      promotionDate: data.promotion_date,
    };
  },

  async update(beltId: number, userId: number, beltData: any) {
    const { token, supabaseId } = await getAuthInfo();
    const url = buildUrl(`/api/belts/${beltId}`, supabaseId);
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        belt: beltData.belt,
        stripes: beltData.stripes,
        promotion_date: beltData.promotionDate,
        instructor: beltData.instructor,
        notes: beltData.notes,
      }),
    });
    if (!response.ok) throw new Error('Failed to update belt');
    const data = await response.json();
    return {
      ...data,
      promotionDate: data.promotion_date,
    };
  },

  async delete(beltId: number, userId: number) {
    const { token, supabaseId } = await getAuthInfo();
    const url = buildUrl(`/api/belts/${beltId}`, supabaseId);
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) throw new Error('Failed to delete belt');
  },
};

// Weekly commitments queries - using backend API
export const weeklyCommitmentsQueries = {
  async getCurrent(userId: string | number) {
    const { token, supabaseId } = await getAuthInfo();
    const url = buildUrl('/api/weekly-commitments/current', supabaseId);
    console.log('getCurrent - Fetching from backend API:', url);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error('Failed to fetch current weekly commitment');
    }
    
    const data = await response.json();
    console.log('getCurrent - Found:', data);
    
    return data ? {
      ...data,
      weekStartDate: data.weekStartDate || data.week_start_date,
      targetClasses: data.targetClasses || data.target_classes,
      completedClasses: data.completedClasses || data.completed_classes,
      isCompleted: data.isCompleted || data.is_completed,
    } : null;
  },

  async create(userId: string | number, commitmentData: any) {
    const { token, supabaseId } = await getAuthInfo();
    const url = buildUrl('/api/weekly-commitments', supabaseId);
    console.log('📝 Creating weekly commitment:', { 
      url, 
      hasToken: !!token, 
      supabaseId,
      isNative: Capacitor.isNativePlatform(),
      commitmentData 
    });
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        weekStartDate: commitmentData.weekStartDate,
        targetClasses: commitmentData.targetClasses,
        completedClasses: commitmentData.completedClasses || 0,
        isCompleted: commitmentData.isCompleted || 0,
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('Weekly commitment creation error:', error);
      throw new Error('Failed to create weekly commitment');
    }
    
    const data = await response.json();
    console.log('Weekly commitment created successfully:', data);
    
    return {
      ...data,
      weekStartDate: data.weekStartDate || data.week_start_date,
      targetClasses: data.targetClasses || data.target_classes,
      completedClasses: data.completedClasses || data.completed_classes,
      isCompleted: data.isCompleted || data.is_completed,
    };
  },

  async update(commitmentId: number, userId: string | number, commitmentData: any) {
    const { token, supabaseId } = await getAuthInfo();
    const url = buildUrl(`/api/weekly-commitments/${commitmentId}`, supabaseId);
    console.log('Updating weekly commitment via backend API:', url, commitmentData);
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        weekStartDate: commitmentData.weekStartDate,
        targetClasses: commitmentData.targetClasses,
        completedClasses: commitmentData.completedClasses,
        isCompleted: commitmentData.isCompleted,
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('Weekly commitment update error:', error);
      throw new Error('Failed to update weekly commitment');
    }
    
    const data = await response.json();
    console.log('Weekly commitment updated successfully:', data);
    
    return {
      ...data,
      weekStartDate: data.weekStartDate || data.week_start_date,
      targetClasses: data.targetClasses || data.target_classes,
      completedClasses: data.completedClasses || data.completed_classes,
      isCompleted: data.isCompleted || data.is_completed,
    };
  },
};

// User stats queries - using backend API
export const userStatsQueries = {
  async get(userId: number) {
    const { token, supabaseId } = await getAuthInfo();
    const url = buildUrl('/api/user-stats', supabaseId);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      return { totalClasses: 0, lastPromotionDate: null };
    }
    
    const data = await response.json();
    return {
      totalClasses: data.totalClasses || 0,
      lastPromotionDate: data.lastPromotionDate || null,
    };
  },
};

// Drawings queries - using backend API
export const drawingsQueries = {
  async getAll(userId: number) {
    const { token, supabaseId } = await getAuthInfo();
    const url = buildUrl('/api/drawings', supabaseId);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) throw new Error('Failed to fetch drawings');
    return await response.json() || [];
  },

  async create(userId: number, drawingData: any) {
    const { token, supabaseId } = await getAuthInfo();
    const url = buildUrl('/api/drawings', supabaseId);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(drawingData),
    });
    
    if (!response.ok) throw new Error('Failed to create drawing');
    return await response.json();
  },
};

// Game Plan queries - using backend API
export const gamePlansQueries = {
  // Get all game plans for a user
  async getAll(userId: number) {
    const { token, supabaseId } = await getAuthInfo();
    const url = buildUrl('/api/game-plans', supabaseId);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) throw new Error('Failed to fetch game plans');
    return await response.json() || [];
  },

  // Get a specific plan tree (all moves for a plan name)
  async getByPlanName(userId: number, planName: string) {
    const { token, supabaseId } = await getAuthInfo();
    const url = buildUrl(`/api/game-plans/${encodeURIComponent(planName)}`, supabaseId);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) throw new Error('Failed to fetch game plan');
    return await response.json() || [];
  },

  // Get children of a specific move (filter from getAll on frontend since no dedicated endpoint)
  async getChildren(userId: number, parentId: string) {
    const allPlans = await this.getAll(userId);
    return allPlans.filter((plan: any) => plan.parent_id === parentId || plan.parentId === parentId);
  },

  // Create a new move
  async create(userId: number, moveData: any) {
    const { token, supabaseId } = await getAuthInfo();
    const url = buildUrl('/api/game-plans', supabaseId);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        planName: moveData.planName,
        moveName: moveData.moveName,
        description: moveData.description,
        parentId: moveData.parentId || null,
        moveOrder: moveData.moveOrder || 0,
      }),
    });
    
    if (!response.ok) throw new Error('Failed to create game plan move');
    return await response.json();
  },

  // Update a move
  async update(moveId: string, userId: number, moveData: any) {
    const { token, supabaseId } = await getAuthInfo();
    const url = buildUrl(`/api/game-plans/${moveId}`, supabaseId);
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        moveName: moveData.moveName,
        description: moveData.description,
        moveOrder: moveData.moveOrder,
      }),
    });
    
    if (!response.ok) throw new Error('Failed to update game plan move');
    return await response.json();
  },

  // Delete a move and all its descendants
  async delete(moveId: string, userId: number) {
    const { token, supabaseId } = await getAuthInfo();
    const url = buildUrl(`/api/game-plans/${moveId}`, supabaseId);
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) throw new Error('Failed to delete game plan move');
    return await response.json();
  },

  // Get unique plan names for a user
  async getPlanNames(userId: number) {
    const { token, supabaseId } = await getAuthInfo();
    const url = buildUrl('/api/game-plans/names', supabaseId);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) throw new Error('Failed to fetch game plan names');
    return await response.json() || [];
  },
};
