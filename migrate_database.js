/**
 * Direct Database Migration Script
 * Copies all data from Sydney database to Singapore database
 */

import pkg from 'pg';
const { Client } = pkg;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

async function migrate() {
  console.log(`${colors.blue}🚀 Jits Journal Database Migration${colors.reset}`);
  console.log(`${colors.blue}From: Sydney → To: Singapore${colors.reset}\n`);

  // Check for required environment variables
  const sydneyUrl = process.env.DATABASE_URL;
  const singaporeUrl = process.env.SINGAPORE_DATABASE_URL;

  if (!sydneyUrl) {
    console.error(`${colors.red}❌ ERROR: DATABASE_URL not set (Sydney database)${colors.reset}`);
    process.exit(1);
  }

  if (!singaporeUrl) {
    console.error(`${colors.red}❌ ERROR: SINGAPORE_DATABASE_URL not set${colors.reset}`);
    console.log(`\n${colors.yellow}Please set it first:${colors.reset}`);
    console.log(`  export SINGAPORE_DATABASE_URL='postgresql://postgres...'\n`);
    process.exit(1);
  }

  // Connect to both databases
  console.log(`${colors.blue}📡 Connecting to databases...${colors.reset}`);
  
  const sydneyClient = new Client({ connectionString: sydneyUrl });
  const singaporeClient = new Client({ connectionString: singaporeUrl });

  try {
    await sydneyClient.connect();
    console.log(`${colors.green}✅ Connected to Sydney database${colors.reset}`);

    await singaporeClient.connect();
    console.log(`${colors.green}✅ Connected to Singapore database${colors.reset}\n`);

    // Get all table names
    const tablesResult = await sydneyClient.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `);

    const tables = tablesResult.rows.map(row => row.tablename);
    console.log(`${colors.blue}📊 Found ${tables.length} tables to migrate:${colors.reset}`);
    tables.forEach(table => console.log(`   - ${table}`));
    console.log('');

    // Migrate each table
    for (const table of tables) {
      console.log(`${colors.yellow}⏳ Migrating table: ${table}${colors.reset}`);

      // Get data from Sydney
      const dataResult = await sydneyClient.query(`SELECT * FROM "${table}"`);
      const rows = dataResult.rows;

      if (rows.length === 0) {
        console.log(`${colors.blue}   ℹ️  No data to migrate${colors.reset}`);
        continue;
      }

      // Get column names
      const columns = Object.keys(rows[0]);

      // Insert data into Singapore
      for (const row of rows) {
        const values = columns.map(col => row[col]);
        const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
        const columnNames = columns.map(col => `"${col}"`).join(', ');

        await singaporeClient.query(
          `INSERT INTO "${table}" (${columnNames}) VALUES (${placeholders})
           ON CONFLICT DO NOTHING`,
          values
        );
      }

      console.log(`${colors.green}   ✅ Migrated ${rows.length} rows${colors.reset}`);
    }

    console.log(`\n${colors.green}🎉 Migration complete!${colors.reset}`);
    console.log(`${colors.green}All data copied from Sydney to Singapore${colors.reset}\n`);

  } catch (error) {
    console.error(`\n${colors.red}❌ Migration failed:${colors.reset}`, error.message);
    process.exit(1);
  } finally {
    await sydneyClient.end();
    await singaporeClient.end();
  }
}

migrate();
