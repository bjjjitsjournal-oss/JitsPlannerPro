import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Use DATABASE_URL from environment (Replit provides this)
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

export const pool = new Pool({ 
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Supabase requires SSL
  max: 20, // Maximum pool size
  min: 2, // Minimum pool size (keep connections warm)
  idleTimeoutMillis: 30000, // Close idle connections after 30s
  connectionTimeoutMillis: 10000, // 10s timeout for new connections
  keepAlive: true, // Enable TCP keep-alive
  keepAliveInitialDelayMillis: 10000
});

export const db = drizzle(pool, { schema });