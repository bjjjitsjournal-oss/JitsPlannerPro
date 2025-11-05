import pg from 'pg';
import fs from 'fs';

const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres.vsuiumdimczjkbioywtw:westendmazda123@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres'
});

async function runMigration() {
  console.log('Connecting to Singapore Supabase...');
  await client.connect();

  const files = ['MIGRATE-STEP-1.sql','MIGRATE-STEP-2.sql','MIGRATE-STEP-3.sql','MIGRATE-STEP-4.sql','MIGRATE-STEP-5.sql','MIGRATE-STEP-6.sql','MIGRATE-STEP-7.sql'];

  for (const file of files) {
    console.log('Running ' + file);
    const sql = fs.readFileSync(file, 'utf8');
    try {
      await client.query(sql);
      console.log('Done: ' + file);
    } catch (error) {
      console.error('Error in ' + file + ': ' + error.message);
    }
  }

  const u = await client.query('SELECT COUNT(*) FROM users');
  const c = await client.query('SELECT COUNT(*) FROM classes');
  const n = await client.query('SELECT COUNT(*) FROM notes');
  console.log('Users: ' + u.rows[0].count);
  console.log('Classes: ' + c.rows[0].count);
  console.log('Notes: ' + n.rows[0].count);
  await client.end();
}

runMigration().catch(console.error);
