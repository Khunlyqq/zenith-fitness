import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn('[DB WARNING] Supabase credentials missing! Set SUPABASE_URL and SUPABASE_KEY.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function initDatabase() {
  console.log('[DB INFO] Supabase client initialized.');
  // Tables should be created via Supabase Dashboard/SQL Editor.
}

/**
 * Helper to handle Supabase single row results with error checking
 */
export async function queryOne(table, queryBuilder) {
  const { data, error } = await queryBuilder.single();
  if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
    console.error(`[DB ERROR] queryOne on ${table}:`, error.message);
    throw error;
  }
  return data;
}

/**
 * Helper to handle Supabase multi row results with error checking
 */
export async function queryAll(table, queryBuilder) {
  const { data, error } = await queryBuilder;
  if (error) {
    console.error(`[DB ERROR] queryAll on ${table}:`, error.message);
    throw error;
  }
  return data || [];
}
