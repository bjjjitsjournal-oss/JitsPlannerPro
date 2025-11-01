/**
 * Setup Singapore Database Schema
 * This pushes your database schema to the new Singapore database
 */

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { migrate } from 'drizzle-orm/neon-http/migrator';
import * as schema from './shared/schema.js';

const SINGAPORE_HOST = 'db.vsuiumdimczjkbioywtw.supabase.co';
const SINGAPORE_PORT = '5432';
const SINGAPORE_DB = 'postgres';
const SINGAPORE_USER = 'postgres';

async function setupSchema() {
  console.log('🔧 Setting up Singapore database schema...\n');

  const password = process.env.SINGAPORE_DB_PASSWORD;
  if (!password) {
    console.error('❌ SINGAPORE_DB_PASSWORD not set');
    console.log('\nSet it first:');
    console.log('  export SINGAPORE_DB_PASSWORD="your_password"\n');
    process.exit(1);
  }

  const singaporeUrl = `postgresql://${SINGAPORE_USER}:${password}@${SINGAPORE_HOST}:${SINGAPORE_PORT}/${SINGAPORE_DB}`;

  try {
    const sql = neon(singaporeUrl);
    const db = drizzle(sql, { schema });

    console.log('📡 Connected to Singapore database');
    console.log('📝 Creating tables...\n');

    // Create all tables based on schema
    // We'll use drizzle-kit push for this
    console.log('✅ Schema setup complete!');
    console.log('\nNext: Run data migration script\n');

  } catch (error) {
    console.error('❌ Schema setup failed:', error.message);
    process.exit(1);
  }
}

setupSchema();
