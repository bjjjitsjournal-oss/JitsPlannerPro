import { createClient } from '@supabase/supabase-js';
import { db } from './db';
import { users, profiles } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Supabase Admin API client - using service role key for admin operations
const supabaseUrl = 'https://umotigprfosrrjwpxlnp.supabase.co';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceRoleKey) {
  console.warn('SUPABASE_SERVICE_ROLE_KEY not found - Supabase Admin API will not work');
}

const supabaseAdmin = supabaseServiceRoleKey ? createClient(
  supabaseUrl, 
  supabaseServiceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
) : null;

/**
 * Get or create a Supabase auth user for the given email
 * Returns the UUID from auth.users which can be used for profiles and notes
 */
export async function getOrCreateSupabaseUserId(email: string, password?: string): Promise<string | null> {
  if (!supabaseAdmin) {
    console.error('Supabase Admin client not available - missing service role key');
    return null;
  }

  try {
    // First try to find existing auth user by email
    const { data: existingUsers, error: searchError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (searchError) {
      console.error('Error searching for existing user:', searchError);
      return null;
    }

    const existingUser = existingUsers.users.find(user => user.email === email);
    
    if (existingUser) {
      console.log(`Found existing Supabase auth user: ${existingUser.id}`);
      
      // Ensure profile exists for this user
      await ensureProfileExists(existingUser.id);
      
      return existingUser.id;
    }

    // Create new auth user if not found
    console.log(`Creating new Supabase auth user for: ${email}`);
    
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password || generateRandomPassword(),
      email_confirm: true // Auto-confirm email for admin-created users
    });

    if (createError || !newUser.user) {
      console.error('Error creating Supabase auth user:', createError);
      return null;
    }

    console.log(`Successfully created Supabase auth user: ${newUser.user.id}`);
    
    // Ensure profile exists for the new user
    await ensureProfileExists(newUser.user.id);
    
    return newUser.user.id;

  } catch (error) {
    console.error('Error in getOrCreateSupabaseUserId:', error);
    return null;
  }
}

/**
 * Ensure a profile record exists in the profiles table for the given UUID
 */
async function ensureProfileExists(supabaseUserId: string): Promise<void> {
  try {
    // Check if profile already exists
    const existingProfile = await db.select()
      .from(profiles)
      .where(eq(profiles.id, supabaseUserId))
      .limit(1);

    if (existingProfile.length === 0) {
      console.log(`Creating profile for Supabase user: ${supabaseUserId}`);
      
      // Create profile with the Supabase auth user UUID
      await db.insert(profiles).values({
        id: supabaseUserId
      });
      
      console.log('Profile created successfully');
    } else {
      console.log('Profile already exists');
    }
  } catch (error) {
    console.error('Error ensuring profile exists:', error);
    throw error;
  }
}

/**
 * Update local user record with Supabase user ID
 */
export async function updateUserSupabaseId(localUserId: number, supabaseUserId: string): Promise<void> {
  try {
    await db.update(users)
      .set({ supabaseUserId: supabaseUserId })
      .where(eq(users.id, localUserId));
    
    console.log(`Updated user ${localUserId} with Supabase ID: ${supabaseUserId}`);
  } catch (error) {
    console.error('Error updating user Supabase ID:', error);
    throw error;
  }
}

/**
 * Get Supabase user ID for a local user
 */
export async function getSupabaseUserIdForLocal(localUserId: number): Promise<string | null> {
  try {
    const user = await db.select({ supabaseUserId: users.supabaseUserId, email: users.email })
      .from(users)
      .where(eq(users.id, localUserId))
      .limit(1);

    if (user.length === 0) {
      console.error(`Local user ${localUserId} not found`);
      return null;
    }

    const userData = user[0];
    
    // If we already have a Supabase user ID, return it
    if (userData.supabaseUserId) {
      return userData.supabaseUserId;
    }

    // If not, create/get the Supabase user and update our record
    const supabaseUserId = await getOrCreateSupabaseUserId(userData.email);
    
    if (supabaseUserId) {
      await updateUserSupabaseId(localUserId, supabaseUserId);
    }
    
    return supabaseUserId;
  } catch (error) {
    console.error('Error getting Supabase user ID for local user:', error);
    return null;
  }
}

/**
 * Generate a random password for admin-created users
 */
function generateRandomPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}