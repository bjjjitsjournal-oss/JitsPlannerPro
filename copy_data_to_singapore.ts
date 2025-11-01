/**
 * Copy all data from Sydney to Singapore database
 */

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
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
  const singaporePassword = process.env.SINGAPORE_DB_PASSWORD;
  if (!singaporePassword) {
    console.error('❌ SINGAPORE_DB_PASSWORD not set');
    console.log('\nSet it first:');
    console.log('  export SINGAPORE_DB_PASSWORD="your_password"\n');
    process.exit(1);
  }

  const singaporeUrl = `postgresql://postgres:${singaporePassword}@${SINGAPORE_HOST}:5432/postgres`;

  const sydneySql = neon(sydneyUrl);
  const singaporeSql = neon(singaporeUrl);

  const sydneyDb = drizzle(sydneySql, { schema });
  const singaporeDb = drizzle(singaporeSql, { schema });

  try {
    console.log('📡 Connecting to both databases...');
    
    // Test connections
    await sydneySql`SELECT 1`;
    console.log('✅ Connected to Sydney');
    
    await singaporeSql`SELECT 1`;
    console.log('✅ Connected to Singapore\n');

    // Copy users
    console.log('👤 Copying users...');
    const users = await sydneyDb.select().from(schema.users);
    for (const user of users) {
      await singaporeDb.insert(schema.users).values(user).onConflictDoNothing();
    }
    console.log(`   ✅ Copied ${users.length} users\n`);

    // Copy classes
    console.log('🥋 Copying classes...');
    const classes = await sydneyDb.select().from(schema.classes);
    for (const classItem of classes) {
      await singaporeDb.insert(schema.classes).values(classItem).onConflictDoNothing();
    }
    console.log(`   ✅ Copied ${classes.length} classes\n`);

    // Copy notes
    console.log('📝 Copying notes...');
    const notes = await sydneyDb.select().from(schema.notes);
    for (const note of notes) {
      await singaporeDb.insert(schema.notes).values(note).onConflictDoNothing();
    }
    console.log(`   ✅ Copied ${notes.length} notes\n`);

    // Copy belts
    console.log('🥋 Copying belt progression...');
    const belts = await sydneyDb.select().from(schema.belts);
    for (const belt of belts) {
      await singaporeDb.insert(schema.belts).values(belt).onConflictDoNothing();
    }
    console.log(`   ✅ Copied ${belts.length} belt records\n`);

    // Copy weekly goals
    console.log('🎯 Copying weekly goals...');
    const weeklyGoals = await sydneyDb.select().from(schema.weeklyGoals);
    for (const goal of weeklyGoals) {
      await singaporeDb.insert(schema.weeklyGoals).values(goal).onConflictDoNothing();
    }
    console.log(`   ✅ Copied ${weeklyGoals.length} goals\n`);

    // Copy game plans
    console.log('🎮 Copying game plans...');
    const gamePlans = await sydneyDb.select().from(schema.gamePlans);
    for (const plan of gamePlans) {
      await singaporeDb.insert(schema.gamePlans).values(plan).onConflictDoNothing();
    }
    console.log(`   ✅ Copied ${gamePlans.length} game plans\n`);

    // Copy game plan nodes
    console.log('🌳 Copying game plan nodes...');
    const nodes = await sydneyDb.select().from(schema.gamePlanNodes);
    for (const node of nodes) {
      await singaporeDb.insert(schema.gamePlanNodes).values(node).onConflictDoNothing();
    }
    console.log(`   ✅ Copied ${nodes.length} nodes\n`);

    // Copy gyms
    console.log('🏋️ Copying gyms...');
    const gyms = await sydneyDb.select().from(schema.gyms);
    for (const gym of gyms) {
      await singaporeDb.insert(schema.gyms).values(gym).onConflictDoNothing();
    }
    console.log(`   ✅ Copied ${gyms.length} gyms\n`);

    // Copy gym memberships
    console.log('👥 Copying gym memberships...');
    const memberships = await sydneyDb.select().from(schema.gymMemberships);
    for (const membership of memberships) {
      await singaporeDb.insert(schema.gymMemberships).values(membership).onConflictDoNothing();
    }
    console.log(`   ✅ Copied ${memberships.length} memberships\n`);

    console.log('🎉 Data migration complete!\n');
    console.log('📋 Summary:');
    console.log(`   - ${users.length} users`);
    console.log(`   - ${classes.length} classes`);
    console.log(`   - ${notes.length} notes`);
    console.log(`   - ${belts.length} belt records`);
    console.log(`   - ${weeklyGoals.length} weekly goals`);
    console.log(`   - ${gamePlans.length} game plans`);
    console.log(`   - ${nodes.length} game plan nodes`);
    console.log(`   - ${gyms.length} gyms`);
    console.log(`   - ${memberships.length} gym memberships\n`);

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

copyData();
