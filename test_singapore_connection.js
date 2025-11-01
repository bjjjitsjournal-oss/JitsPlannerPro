/**
 * Test connection to Singapore database
 */

import { neon } from '@neondatabase/serverless';

const singaporeUrl = process.env.SINGAPORE_DATABASE_URL;

if (!singaporeUrl) {
  console.error('❌ SINGAPORE_DATABASE_URL not set');
  process.exit(1);
}

console.log('🔍 Testing connection to Singapore database...');
console.log('Host: db.vsuiumdimczjkbioywtw.supabase.co\n');

const sql = neon(singaporeUrl);

try {
  const result = await sql`SELECT version()`;
  console.log('✅ Connection successful!');
  console.log('Database version:', result[0].version);
  console.log('\nSingapore database is ready for migration!\n');
} catch (error) {
  console.error('❌ Connection failed:', error.message);
  console.log('\n⚠️  Possible issues:');
  console.log('1. Supabase project still provisioning (wait 2-3 minutes)');
  console.log('2. Wrong hostname - double-check your connection string');
  console.log('3. Wrong password\n');
  process.exit(1);
}
