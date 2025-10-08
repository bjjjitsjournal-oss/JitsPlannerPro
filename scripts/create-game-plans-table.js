import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function createGamePlansTable() {
  console.log('Creating game_plans table in Supabase...');
  
  const { data, error } = await supabase.rpc('exec_sql', {
    query: `
      CREATE TABLE IF NOT EXISTS game_plans (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        plan_name TEXT NOT NULL,
        move_name TEXT NOT NULL,
        description TEXT,
        parent_id VARCHAR REFERENCES game_plans(id) ON DELETE CASCADE,
        move_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_game_plans_user_id ON game_plans(user_id);
      CREATE INDEX IF NOT EXISTS idx_game_plans_plan_name ON game_plans(user_id, plan_name);
      CREATE INDEX IF NOT EXISTS idx_game_plans_parent_id ON game_plans(parent_id);
    `
  });

  if (error) {
    console.error('Error creating table:', error);
    process.exit(1);
  }

  console.log('✅ game_plans table created successfully!');
  process.exit(0);
}

createGamePlansTable();
