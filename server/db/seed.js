import { initDatabase, queryAll, queryOne, runSql, getLastInsertId } from './database.js';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('🌱 Seeding database...');
  await initDatabase();

  // --- Seed Admin User ---
  const adminPassword = bcrypt.hashSync('admin123', 10);
  const userPassword = bcrypt.hashSync('user123', 10);

  const existingAdmin = queryOne('SELECT id FROM users WHERE email = ?', ['admin@zenith.com']);
  if (!existingAdmin) {
    runSql(
      'INSERT INTO users (name, email, password_hash, role, height_cm, weight_kg, target_weight_kg, body_fat_pct, active_goal, language) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      ['Admin Zenith', 'admin@zenith.com', adminPassword, 'admin', 175, 75, 70, 15, 'Maintenance', 'id']
    );
  }

  const existingUser = queryOne('SELECT id FROM users WHERE email = ?', ['andi@example.com']);
  if (!existingUser) {
    runSql(
      'INSERT INTO users (name, email, password_hash, role, height_cm, weight_kg, target_weight_kg, body_fat_pct, active_goal, language) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      ['Andi Pratama', 'andi@example.com', userPassword, 'user', 175, 72, 68, 18, 'Fat Loss', 'id']
    );
  }

  console.log('✅ Users seeded (admin@zenith.com / admin123, andi@example.com / user123)');

  // --- Seed Exercises ---
  const exercises = [
    ['Barbell Bench Press', 'Latihan utama untuk otot dada bagian tengah.', 'Chest', 'Intermediate', null],
    ['Dumbbell Bench Press', 'Target otot dada dengan kontrol beban independen.', 'Chest', 'Intermediate', null],
    ['Incline Bench Press', 'Menargetkan otot dada bagian atas.', 'Chest', 'Intermediate', null],
    ['Cable Crossovers', 'Latihan isolasi dada dengan kabel.', 'Chest', 'Beginner', null],
    ['Chest Press Machine', 'Latihan dada dengan mesin.', 'Chest', 'Beginner', null],
    ['Push-ups', 'Latihan bodyweight untuk dada dan trisep.', 'Chest', 'Beginner', null],
    ['Dips', 'Latihan komposit untuk dada bawah dan trisep.', 'Chest', 'Intermediate', null],
    ['Incline Fly', 'Isolasi dada atas dengan dumbbell.', 'Chest', 'Intermediate', null],
    ['Conventional Deadlift', 'Latihan untuk rantai posterior dan inti.', 'Back', 'Advanced', null],
    ['Barbell Rows', 'Latihan pull untuk punggung tengah.', 'Back', 'Intermediate', null],
    ['Lat Pulldown', 'Latihan untuk lebar punggung.', 'Back', 'Beginner', null],
    ['Pull-ups', 'Latihan bodyweight untuk punggung dan bisep.', 'Back', 'Advanced', null],
    ['Barbell Back Squat', 'King of exercises untuk kaki.', 'Legs', 'Advanced', null],
    ['Leg Press', 'Latihan mesin untuk paha dan bokong.', 'Legs', 'Beginner', null],
    ['Calves Raise', 'Latihan isolasi untuk betis.', 'Legs', 'Beginner', null],
    ['Overhead Press', 'Latihan komposit untuk bahu.', 'Shoulders', 'Intermediate', null],
    ['Lateral Raise', 'Isolasi bahu samping.', 'Shoulders', 'Beginner', null],
    ['Bicep Curl', 'Isolasi bisep dengan dumbbell.', 'Arms', 'Beginner', null],
    ['Tricep Pushdown', 'Isolasi trisep dengan kabel.', 'Arms', 'Beginner', null],
  ];

  const existingEx = queryOne('SELECT COUNT(*) as cnt FROM exercises');
  if (existingEx.cnt === 0) {
    for (const [name, desc, group, diff, img] of exercises) {
      runSql('INSERT INTO exercises (name, description, muscle_group, difficulty, image_url) VALUES (?, ?, ?, ?, ?)', [name, desc, group, diff, img]);
    }
    console.log(`✅ ${exercises.length} exercises seeded`);
  }

  // Get user ID for Andi
  const andi = queryOne('SELECT id FROM users WHERE email = ?', ['andi@example.com']);
  if (!andi) { console.log('⚠️ User Andi not found, skipping data seeding'); process.exit(0); }
  const userId = andi.id;

  // --- Seed Schedules ---
  const existingSch = queryOne('SELECT COUNT(*) as cnt FROM schedules WHERE user_id = ?', [userId]);
  if (existingSch.cnt === 0) {
    const schedules = [
      [userId, '2023-10-06', 'Push Day', 'Push', 60, 400, JSON.stringify(['Bench Press', 'Incline Fly', 'Dips', 'Push-ups'])],
      [userId, '2023-10-11', 'Chest Day', 'Chest', 45, 350, JSON.stringify(['Incline Bench', 'Cable Crossovers', 'Chest Press'])],
      [userId, '2023-10-13', 'Leg Day', 'Legs', 75, 500, JSON.stringify(['Squats', 'Leg Press', 'Calves Raise'])],
      [userId, '2023-10-16', 'Pull Day', 'Pull', 60, 380, JSON.stringify(['Deadlift', 'Barbell Rows', 'Pull-ups'])],
      [userId, '2023-10-20', 'Push Day', 'Push', 60, 400, JSON.stringify(['Bench Press', 'Overhead Press', 'Dips'])],
      [userId, '2023-10-25', 'Leg Day', 'Legs', 75, 500, JSON.stringify(['Squats', 'Leg Press', 'Calves Raise'])],
    ];
    for (const s of schedules) {
      runSql('INSERT INTO schedules (user_id, date, title, type, time_minutes, estimated_calories, exercises_list) VALUES (?, ?, ?, ?, ?, ?, ?)', s);
    }
    console.log('✅ Schedules seeded');
  }

  // --- Seed Nutrition ---
  const today = new Date().toISOString().split('T')[0];
  const existingNut = queryOne('SELECT id FROM nutrition_logs WHERE user_id = ? AND date = ?', [userId, today]);
  if (!existingNut) {
    runSql('INSERT INTO nutrition_logs (user_id, date, protein_g, carbs_g, fat_g, calories, water_ml) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, today, 145, 210, 52, 2450, 1250]);
    console.log('✅ Nutrition seeded');
  }

  // --- Seed Body Stats ---
  const existingBS = queryOne('SELECT COUNT(*) as cnt FROM body_stats WHERE user_id = ?', [userId]);
  if (existingBS.cnt === 0) {
    const stats = [
      [userId, '2023-09-01', 73.7, 18.5],
      [userId, '2023-09-08', 73.2, 18.2],
      [userId, '2023-09-15', 73.0, 18.0],
      [userId, '2023-09-22', 72.8, 17.8],
      [userId, '2023-10-01', 72.5, 17.5],
      [userId, today, 72.5, 17.5],
    ];
    for (const s of stats) {
      runSql('INSERT INTO body_stats (user_id, date, weight_kg, body_fat_pct) VALUES (?, ?, ?, ?)', s);
    }
    console.log('✅ Body stats seeded');
  }

  // --- Seed Personal Records ---
  const existingPR = queryOne('SELECT COUNT(*) as cnt FROM personal_records WHERE user_id = ?', [userId]);
  if (existingPR.cnt === 0) {
    runSql('INSERT INTO personal_records (user_id, exercise_id, max_weight_kg, achieved_at, badge) VALUES (?, ?, ?, ?, ?)',
      [userId, 1, 125, '2023-08-12', 'gold']);
    runSql('INSERT INTO personal_records (user_id, exercise_id, max_weight_kg, achieved_at, badge) VALUES (?, ?, ?, ?, ?)',
      [userId, 9, 180, '2023-07-28', 'silver']);
    runSql('INSERT INTO personal_records (user_id, exercise_id, max_weight_kg, achieved_at, badge) VALUES (?, ?, ?, ?, ?)',
      [userId, 13, 145, '2023-09-05', 'gold']);
    console.log('✅ Personal records seeded');
  }

  console.log('\n🎉 Database seeded successfully!');
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seed error:', err);
  process.exit(1);
});
