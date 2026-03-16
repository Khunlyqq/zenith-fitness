import 'dotenv/config';
import { supabase } from './db/database.js';

async function testConnection() {
  console.log('🔍 Testing Supabase connection...');
  console.log('URL:', process.env.SUPABASE_URL ? '✅ Present' : '❌ Missing');
  console.log('KEY:', process.env.SUPABASE_KEY ? '✅ Present' : '❌ Missing');

  try {
    const { data, error } = await supabase.from('users').select('id').limit(1);
    
    if (error) {
      if (error.code === '42P01') {
        console.log('❌ Error: Tables not found. Did you run the SQL script in Supabase?');
      } else {
        console.error('❌ Supabase error:', error.message);
      }
      return;
    }
    
    console.log('✅ Connection successful! Supabase is responding.');
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
  }
}

testConnection();
