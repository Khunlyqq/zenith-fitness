import { Router } from 'express';
import { queryOne, runSql } from '../db/database.js';

const router = Router();

// GET /api/nutrition/today
router.get('/today', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const nutrition = queryOne('SELECT * FROM nutrition_logs WHERE user_id = ? AND date = ?', [req.user.id, today]);
  res.json(nutrition || { protein_g: 0, carbs_g: 0, fat_g: 0, calories: 0, water_ml: 0 });
});

// POST /api/nutrition/log
router.post('/log', (req, res) => {
  const { protein_g, carbs_g, fat_g, calories } = req.body;
  const today = new Date().toISOString().split('T')[0];

  const existing = queryOne('SELECT id FROM nutrition_logs WHERE user_id = ? AND date = ?', [req.user.id, today]);
  if (existing) {
    runSql(`
      UPDATE nutrition_logs SET
        protein_g = protein_g + COALESCE(?, 0),
        carbs_g = carbs_g + COALESCE(?, 0),
        fat_g = fat_g + COALESCE(?, 0),
        calories = calories + COALESCE(?, 0)
      WHERE id = ?
    `, [protein_g || 0, carbs_g || 0, fat_g || 0, calories || 0, existing.id]);
  } else {
    runSql(
      'INSERT INTO nutrition_logs (user_id, date, protein_g, carbs_g, fat_g, calories) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, today, protein_g || 0, carbs_g || 0, fat_g || 0, calories || 0]
    );
  }

  const updated = queryOne('SELECT * FROM nutrition_logs WHERE user_id = ? AND date = ?', [req.user.id, today]);
  res.json(updated);
});

export default router;
