import { Router } from 'express';
import { queryAll, queryOne, runSql, getLastInsertId } from '../db/database.js';

const router = Router();

router.post('/start', (req, res) => {
  const { schedule_id } = req.body;
  runSql('INSERT INTO workout_sessions (user_id, schedule_id) VALUES (?, ?)', [req.user.id, schedule_id || null]);
  const id = getLastInsertId('workout_sessions');
  const session = queryOne('SELECT * FROM workout_sessions WHERE id = ?', [id]);
  res.status(201).json(session);
});

// GET /api/workouts/:id
router.get('/:id', (req, res) => {
  const session = queryOne('SELECT * FROM workout_sessions WHERE id = ? AND user_id = ?', [parseInt(req.params.id), req.user.id]);
  if (!session) return res.status(404).json({ error: 'Sesi tidak ditemukan' });

  const sets = queryAll(`
    SELECT sl.*, e.name as exercise_name FROM set_logs sl
    JOIN exercises e ON sl.exercise_id = e.id
    WHERE sl.session_id = ?
    ORDER BY sl.exercise_id, sl.set_number
  `, [session.id]);

  res.json({ ...session, sets });
});

// POST /api/workouts/:id/sets
router.post('/:id/sets', (req, res) => {
  const { exercise_id, set_number, weight_kg, reps } = req.body;
  if (!exercise_id || !set_number) {
    return res.status(400).json({ error: 'exercise_id dan set_number harus diisi' });
  }

  const session = queryOne('SELECT * FROM workout_sessions WHERE id = ? AND user_id = ?', [parseInt(req.params.id), req.user.id]);
  if (!session) return res.status(404).json({ error: 'Sesi tidak ditemukan' });

  runSql(
    'INSERT INTO set_logs (session_id, exercise_id, set_number, weight_kg, reps, completed) VALUES (?, ?, ?, ?, ?, 1)',
    [parseInt(req.params.id), exercise_id, set_number, weight_kg || 0, reps || 0]
  );
  const setId = getLastInsertId('set_logs');

  // Update total volume
  const volume = (weight_kg || 0) * (reps || 0);
  runSql('UPDATE workout_sessions SET total_volume_kg = total_volume_kg + ? WHERE id = ?', [volume, parseInt(req.params.id)]);

  // Check for personal record
  const currentPR = queryOne('SELECT max_weight_kg FROM personal_records WHERE user_id = ? AND exercise_id = ?', [req.user.id, exercise_id]);
  if (!currentPR || weight_kg > currentPR.max_weight_kg) {
    // Delete old PR then insert new one
    runSql('DELETE FROM personal_records WHERE user_id = ? AND exercise_id = ?', [req.user.id, exercise_id]);
    runSql(
      "INSERT INTO personal_records (user_id, exercise_id, max_weight_kg, achieved_at, badge) VALUES (?, ?, ?, datetime('now'), 'gold')",
      [req.user.id, exercise_id, weight_kg]
    );
  }

  const setLog = queryOne('SELECT * FROM set_logs WHERE id = ?', [setId]);
  res.status(201).json(setLog);
});

// PUT /api/workouts/:id/end
router.put('/:id/end', (req, res) => {
  const session = queryOne('SELECT * FROM workout_sessions WHERE id = ? AND user_id = ?', [parseInt(req.params.id), req.user.id]);
  if (!session) return res.status(404).json({ error: 'Sesi tidak ditemukan' });

  const startedAt = new Date(session.started_at);
  const duration = Math.floor((Date.now() - startedAt.getTime()) / 1000);

  runSql("UPDATE workout_sessions SET ended_at = datetime('now'), duration_seconds = ? WHERE id = ?", [duration, parseInt(req.params.id)]);

  const updated = queryOne('SELECT * FROM workout_sessions WHERE id = ?', [parseInt(req.params.id)]);
  res.json(updated);
});

export default router;
