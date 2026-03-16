import { initDatabase, runSql, getLastInsertId, queryOne, queryAll, getDb } from './db/database.js';

async function test() {
  await initDatabase();
  console.log('Database initialized');

  runSql('INSERT INTO workout_sessions (user_id) VALUES (?)', [1]);
  
  const db = getDb();
  const res = db.exec('SELECT last_insert_rowid()');
  console.log('db.exec("SELECT last_insert_rowid()"):', res[0].values[0][0]);
  
  const idFromDb = queryAll('SELECT id FROM workout_sessions ORDER BY id DESC LIMIT 1')[0].id;
  console.log('ID from SELECT DESC:', idFromDb);
}

test().catch(console.error);
