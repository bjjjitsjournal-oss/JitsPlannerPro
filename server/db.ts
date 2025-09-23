import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Supabase database connection - using working connection string
const SUPABASE_CONNECTION_STRING = "postgresql://postgres.umotigprfosrrjwpxlnp:u5QmZ2dHCuDpQZES@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres";

export const pool = new Pool({ 
  connectionString: SUPABASE_CONNECTION_STRING,
  ssl: { rejectUnauthorized: false } // Supabase requires SSL
});

export const db = drizzle(pool, { schema });