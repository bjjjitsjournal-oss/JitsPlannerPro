import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Construct DATABASE_URL from individual PostgreSQL variables
// since DATABASE_URL may still point to old Supabase endpoint
const { PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE } = process.env;

if (!PGHOST || !PGPORT || !PGUSER || !PGPASSWORD || !PGDATABASE) {
  throw new Error("PostgreSQL environment variables are required (PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE)");
}

const connectionString = `postgresql://${PGUSER}:${PGPASSWORD}@${PGHOST}:${PGPORT}/${PGDATABASE}`;

export const pool = new Pool({ connectionString });
export const db = drizzle({ client: pool, schema });