import { Router } from 'express';
import { queryAll, queryOne, runSql } from '../db/database.js';

const router = Router();

// GET /api/dashboard/summary
router.get('/summary', (req, res) => {
  const userId = req.user.id;
  const today = new Date().toISOString().split('T')[0];

  const user = queryOne('SELECT weight_kg FROM users WHERE id = ?', [userId]);
  const nutrition = queryOne('SELECT calories, water_ml FROM nutrition_logs WHERE user_id = ? AND date = ?', [userId, today]);
  const sessions = queryOne('SELECT COUNT(*) as count FROM workout_sessions WHERE user_id = ? AND ended_at IS NOT NULL', [userId]);

  // Calculate streak
  const recentSessions = queryAll(`
    SELECT DISTINCT date(started_at) as d FROM workout_sessions
    WHERE user_id = ? AND ended_at IS NOT NULL
    ORDER BY d DESC LIMIT 30
  `, [userId]);

  let streak = 0;
  const todayDate = new Date();
  for (let i = 0; i < recentSessions.length; i++) {
    const expected = new Date(todayDate);
    expected.setDate(expected.getDate() - i);
    const expectedStr = expected.toISOString().split('T')[0];
    if (recentSessions[i]?.d === expectedStr) {
      streak++;
    } else {
      break;
    }
  }

  res.json({
    streak,
    calories: nutrition?.calories || 0,
    weight_kg: user?.weight_kg || 0,
    water_ml: nutrition?.water_ml || 0,
    total_workouts: sessions?.count || 0,
  });
});

// GET /api/dashboard/nutrition/today
router.get('/nutrition/today', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const nutrition = queryOne('SELECT * FROM nutrition_logs WHERE user_id = ? AND date = ?', [req.user.id, today]);
  res.json(nutrition || { protein_g: 0, carbs_g: 0, fat_g: 0, calories: 0, water_ml: 0 });
});

// POST /api/dashboard/hydration
router.post('/hydration', (req, res) => {
  const { amount_ml } = req.body;
  const today = new Date().toISOString().split('T')[0];

  const existing = queryOne('SELECT id, water_ml FROM nutrition_logs WHERE user_id = ? AND date = ?', [req.user.id, today]);
  if (existing) {
    runSql('UPDATE nutrition_logs SET water_ml = water_ml + ? WHERE id = ?', [amount_ml || 250, existing.id]);
  } else {
    runSql('INSERT INTO nutrition_logs (user_id, date, water_ml) VALUES (?, ?, ?)', [req.user.id, today, amount_ml || 250]);
  }

  const updated = queryOne('SELECT water_ml FROM nutrition_logs WHERE user_id = ? AND date = ?', [req.user.id, today]);
  res.json({ water_ml: updated.water_ml });
});

// GET /api/dashboard/body-stats
router.get('/body-stats', (req, res) => {
  const stats = queryAll(`
    SELECT date, weight_kg, body_fat_pct FROM body_stats
    WHERE user_id = ? ORDER BY date DESC LIMIT 10
  `, [req.user.id]);
  res.json(stats);
});

// GET /api/dashboard/next-session
router.get('/next-session', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const next = queryOne('SELECT * FROM schedules WHERE user_id = ? AND date >= ? ORDER BY date ASC LIMIT 1', [req.user.id, today]);
  res.json(next || null);
});

// POST /api/dashboard/body-stats
router.post('/body-stats', (req, res) => {
  const { weight_kg, body_fat_pct } = req.body;
  if (!weight_kg && !body_fat_pct) {
    return res.status(400).json({ error: 'At least one of weight_kg or body_fat_pct is required' });
  }
  const today = new Date().toISOString().split('T')[0];
  const userId = req.user.id;

  const existing = queryOne('SELECT id FROM body_stats WHERE user_id = ? AND date = ?', [userId, today]);
  if (existing) {
    runSql(`UPDATE body_stats SET
      weight_kg = COALESCE(?, weight_kg),
      body_fat_pct = COALESCE(?, body_fat_pct)
      WHERE id = ?`, [weight_kg || null, body_fat_pct || null, existing.id]);
  } else {
    runSql('INSERT INTO body_stats (user_id, date, weight_kg, body_fat_pct) VALUES (?, ?, ?, ?)',
      [userId, today, weight_kg || null, body_fat_pct || null]);
  }

  // Also update user profile weight
  if (weight_kg) {
    runSql("UPDATE users SET weight_kg = ?, updated_at = datetime('now') WHERE id = ?", [weight_kg, userId]);
  }

  const stats = queryAll('SELECT date, weight_kg, body_fat_pct FROM body_stats WHERE user_id = ? ORDER BY date DESC LIMIT 10', [userId]);
  res.json(stats);
});

export default router;
