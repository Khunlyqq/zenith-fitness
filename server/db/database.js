import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'zenith.db');

let db;

export async function initDatabase() {
  const SQL = await initSqlJs();

  // Load existing DB file or create new
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      avatar_url TEXT,
      height_cm REAL,
      weight_kg REAL,
      target_weight_kg REAL,
      body_fat_pct REAL,
      active_goal TEXT DEFAULT 'Fat Loss',
      language TEXT DEFAULT 'id',
      two_factor_enabled INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      muscle_group TEXT NOT NULL,
      difficulty TEXT DEFAULT 'Intermediate',
      image_url TEXT
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      time_minutes INTEGER,
      estimated_calories INTEGER,
      exercises_list TEXT,
      UNIQUE(user_id, date)
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS workout_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      schedule_id INTEGER,
      started_at TEXT DEFAULT (datetime('now')),
      ended_at TEXT,
      total_volume_kg REAL DEFAULT 0,
      duration_seconds INTEGER DEFAULT 0
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS set_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL,
      exercise_id INTEGER NOT NULL,
      set_number INTEGER NOT NULL,
      weight_kg REAL,
      reps INTEGER,
      completed INTEGER DEFAULT 0
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS nutrition_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      protein_g REAL DEFAULT 0,
      carbs_g REAL DEFAULT 0,
      fat_g REAL DEFAULT 0,
      calories REAL DEFAULT 0,
      water_ml INTEGER DEFAULT 0,
      UNIQUE(user_id, date)
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS personal_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      exercise_id INTEGER NOT NULL,
      max_weight_kg REAL NOT NULL,
      achieved_at TEXT NOT NULL,
      badge TEXT
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS body_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      weight_kg REAL,
      body_fat_pct REAL,
      UNIQUE(user_id, date)
    );
  `);

  saveDatabase();
  return db;
}

export function saveDatabase() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

// Helper: convert sql.js result to array of objects
export function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

export function queryOne(sql, params = []) {
  const results = queryAll(sql, params);
  return results[0] || null;
}

export function runSql(sql, params = []) {
  db.run(sql, params);
  saveDatabase();
}

export function getLastInsertId(tableName) {
  try {
    // Try last_insert_rowid first
    const res = db.exec('SELECT last_insert_rowid()');
    const id = res[0].values[0][0];
    console.log(`[DB DEBUG] last_insert_rowid for ${tableName}:`, id);
    
    if (id !== 0) return id;
    
    // Fallback for sql.js weirdness: get max id from table if provided
    if (tableName) {
      const fallbackRes = db.exec(`SELECT MAX(id) as id FROM ${tableName}`);
      const fallbackId = fallbackRes[0].values[0][0];
      console.log(`[DB DEBUG] MAX(id) fallback for ${tableName}:`, fallbackId);
      return fallbackId || 0;
    }
  } catch (err) {
    console.error(`[DB DEBUG] Error in getLastInsertId for ${tableName}:`, err);
  }
  
  return 0;
}

export function getChanges() {
  const result = queryOne('SELECT changes() as cnt');
  return result?.cnt || 0;
}

export function getDb() {
  return db;
}
