/**
 * Copy all data from Sydney to Singapore database
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './shared/schema.js';

const SINGAPORE_HOST = 'db.vsuiumdimczjkbioywtw.supabase.co';

async function copyData() {
  console.log('📦 Copying data from Sydney to Singapore...\n');

  // Sydney database (existing)
  const sydneyUrl = process.env.DATABASE_URL;
  if (!sydneyUrl) {
    console.error('❌ DATABASE_URL not set');
    process.exit(1);
  }

  // Singapore database (new)
  const singaporeUrl = process.env.SINGAPORE_DATABASE_URL;
  if (!singaporeUrl) {
    console.error('❌ SINGAPORE_DATABASE_URL not set');
    console.log('\nMake sure the secret is set in Replit Secrets\n');
    process.exit(1);
  }

  const sydneySql = postgres(sydneyUrl, { ssl: 'require' });
  const singaporeSql = postgres(singaporeUrl, { ssl: 'require' });

  const sydneyDb = drizzle(sydneySql, { schema });
  const singaporeDb = drizzle(singaporeSql, { schema });

  try {
    console.log('📡 Connecting to both databases...');
    console.log('✅ Connected to Sydney');
    console.log('✅ Connected to Singapore\n');

    // Copy tables in order to satisfy foreign key constraints
    
    // 1. Users (no dependencies)
    console.log('👤 Copying users...');
    const users = await sydneyDb.select().from(schema.users);
    for (const user of users) {
      await singaporeDb.insert(schema.users).values(user).onConflictDoNothing();
    }
    console.log(`   ✅ Copied ${users.length} users\n`);

    // 2. Gyms (depends on users via ownerId)
    console.log('🏋️ Copying gyms...');
    const gyms = await sydneyDb.select().from(schema.gyms);
    for (const gym of gyms) {
      await singaporeDb.insert(schema.gyms).values(gym).onConflictDoNothing();
    }
    console.log(`   ✅ Copied ${gyms.length} gyms\n`);

    // 3. Gym memberships (depends on users and gyms)
    console.log('👥 Copying gym memberships...');
    const memberships = await sydneyDb.select().from(schema.gymMemberships);
    for (const membership of memberships) {
      await singaporeDb.insert(schema.gymMemberships).values(membership).onConflictDoNothing();
    }
    console.log(`   ✅ Copied ${memberships.length} memberships\n`);

    // 4. Belts (depends on users)
    console.log('🥋 Copying belt progression...');
    const belts = await sydneyDb.select().from(schema.belts);
    for (const belt of belts) {
      await singaporeDb.insert(schema.belts).values(belt).onConflictDoNothing();
    }
    console.log(`   ✅ Copied ${belts.length} belt records\n`);

    // 5. Weekly commitments (depends on users)
    console.log('🎯 Copying weekly commitments...');
    const weeklyCommitments = await sydneyDb.select().from(schema.weeklyCommitments);
    for (const commitment of weeklyCommitments) {
      await singaporeDb.insert(schema.weeklyCommitments).values(commitment).onConflictDoNothing();
    }
    console.log(`   ✅ Copied ${weeklyCommitments.length} commitments\n`);

    // 6. Game plans (depends on users)
    console.log('🎮 Copying game plans...');
    const gamePlans = await sydneyDb.select().from(schema.gamePlans);
    for (const plan of gamePlans) {
      await singaporeDb.insert(schema.gamePlans).values(plan).onConflictDoNothing();
    }
    console.log(`   ✅ Copied ${gamePlans.length} game plans\n`);

    // 7. Classes (depends on users)
    console.log('🥋 Copying classes...');
    const classes = await sydneyDb.select().from(schema.classes);
    for (const classItem of classes) {
      await singaporeDb.insert(schema.classes).values(classItem).onConflictDoNothing();
    }
    console.log(`   ✅ Copied ${classes.length} classes\n`);

    // 8. Notes (depends on users, classes, and gyms)
    console.log('📝 Copying notes...');
    const notes = await sydneyDb.select().from(schema.notes);
    for (const note of notes) {
      await singaporeDb.insert(schema.notes).values(note).onConflictDoNothing();
    }
    console.log(`   ✅ Copied ${notes.length} notes\n`);

    console.log('🎉 Data migration complete!\n');
    console.log('📋 Summary:');
    console.log(`   - ${users.length} users`);
    console.log(`   - ${classes.length} classes`);
    console.log(`   - ${notes.length} notes`);
    console.log(`   - ${belts.length} belt records`);
    console.log(`   - ${weeklyCommitments.length} weekly commitments`);
    console.log(`   - ${gamePlans.length} game plans`);
    console.log(`   - ${gyms.length} gyms`);
    console.log(`   - ${memberships.length} gym memberships\n`);

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

copyData();
