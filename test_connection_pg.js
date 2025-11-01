/**
 * Test Singapore connection using pg library
 */

import pkg from 'pg';
const { Client } = pkg;

const singaporeUrl = process.env.SINGAPORE_DATABASE_URL;

if (!singaporeUrl) {
  console.error('❌ SINGAPORE_DATABASE_URL not set');
  process.exit(1);
}

console.log('🔍 Testing connection to Singapore database...');
console.log('Connection string format:', singaporeUrl.replace(/:[^:@]+@/, ':****@'));
console.log('');

const client = new Client({
  connectionString: singaporeUrl,
  ssl: { rejectUnauthorized: false }
});

try {
  await client.connect();
  console.log('✅ Connected successfully!\n');
  
  const result = await client.query('SELECT version()');
  console.log('✅ Database version:', result.rows[0].version.split(' ')[0], result.rows[0].version.split(' ')[1]);
  
  const tables = await client.query(`
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public'
  `);
  console.log('✅ Public tables count:', tables.rows.length);
  
  console.log('\n🎉 Singapore database is ready for migration!\n');
  
  await client.end();
} catch (error) {
  console.error('❌ Connection failed:', error.message);
  console.error('\nFull error:', error);
  process.exit(1);
}
