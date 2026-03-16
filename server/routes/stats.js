import { Router } from 'express';
import { queryAll, queryOne } from '../db/database.js';

const router = Router();

// GET /api/stats/volume?period=1M
router.get('/volume', (req, res) => {
  const period = req.query.period || '1M';
  let days;
  switch (period) {
    case '1W': days = 7; break;
    case '3M': days = 90; break;
    case 'All': days = 3650; break;
    default: days = 30;
  }

  const data = queryAll(`
    SELECT date(started_at) as date, SUM(total_volume_kg) as volume
    FROM workout_sessions
    WHERE user_id = ? AND ended_at IS NOT NULL
    AND started_at >= datetime('now', '-' || ? || ' days')
    GROUP BY date(started_at)
    ORDER BY date ASC
  `, [req.user.id, days]);

  const totalVolume = data.reduce((sum, d) => sum + (d.volume || 0), 0);
  res.json({ total_volume: totalVolume, data });
});

// GET /api/stats/body-weight?period=1M
router.get('/body-weight', (req, res) => {
  const period = req.query.period || '1M';
  let days;
  switch (period) {
    case '1W': days = 7; break;
    case '3M': days = 90; break;
    case 'All': days = 3650; break;
    default: days = 30;
  }

  const data = queryAll(`
    SELECT date, weight_kg, body_fat_pct FROM body_stats
    WHERE user_id = ? AND date >= date('now', '-' || ? || ' days')
    ORDER BY date ASC
  `, [req.user.id, days]);

  const latest = data[data.length - 1];
  const oldest = data[0];
  const change = latest && oldest ? +(latest.weight_kg - oldest.weight_kg).toFixed(1) : 0;

  res.json({ latest_weight: latest?.weight_kg || 0, change_kg: change, data });
});

// GET /api/stats/personal-records
router.get('/personal-records', (req, res) => {
  const records = queryAll(`
    SELECT pr.*, e.name as exercise_name, e.muscle_group
    FROM personal_records pr
    JOIN exercises e ON pr.exercise_id = e.id
    WHERE pr.user_id = ?
    ORDER BY pr.achieved_at DESC
  `, [req.user.id]);
  res.json(records);
});

export default router;
