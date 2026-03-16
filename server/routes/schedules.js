import { Router } from 'express';
import { queryAll, queryOne, runSql, getLastInsertId, getChanges } from '../db/database.js';

const router = Router();

// GET /api/schedules?month=10&year=2023
router.get('/', (req, res) => {
  const { month, year } = req.query;
  let schedules;

  if (month && year) {
    const paddedMonth = String(month).padStart(2, '0');
    const pattern = `${year}-${paddedMonth}-%`;
    schedules = queryAll('SELECT * FROM schedules WHERE user_id = ? AND date LIKE ?', [req.user.id, pattern]);
  } else {
    schedules = queryAll('SELECT * FROM schedules WHERE user_id = ? ORDER BY date DESC', [req.user.id]);
  }

  res.json(schedules);
});

// GET /api/schedules/:date
router.get('/:date', (req, res) => {
  const schedule = queryOne('SELECT * FROM schedules WHERE user_id = ? AND date = ?', [req.user.id, req.params.date]);
  res.json(schedule || null);
});

// POST /api/schedules
router.post('/', (req, res) => {
  const { date, title, type, time_minutes, estimated_calories, exercises_list } = req.body;
  if (!date || !title || !type) {
    return res.status(400).json({ error: 'Tanggal, judul, dan tipe harus diisi' });
  }

  const existing = queryOne('SELECT id FROM schedules WHERE user_id = ? AND date = ?', [req.user.id, date]);
  if (existing) {
    return res.status(409).json({ error: 'Sudah ada jadwal di tanggal tersebut' });
  }

  runSql(
    'INSERT INTO schedules (user_id, date, title, type, time_minutes, estimated_calories, exercises_list) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [req.user.id, date, title, type, time_minutes || null, estimated_calories || null, exercises_list ? JSON.stringify(exercises_list) : null]
  );
  const id = getLastInsertId('schedules');
  const schedule = queryOne('SELECT * FROM schedules WHERE id = ?', [id]);
  res.status(201).json(schedule);
});

// PUT /api/schedules/:id
router.put('/:id', (req, res) => {
  const { title, type, time_minutes, estimated_calories, exercises_list } = req.body;
  const schedule = queryOne('SELECT * FROM schedules WHERE id = ? AND user_id = ?', [parseInt(req.params.id), req.user.id]);
  if (!schedule) return res.status(404).json({ error: 'Jadwal tidak ditemukan' });

  runSql(`
    UPDATE schedules SET
      title = COALESCE(?, title),
      type = COALESCE(?, type),
      time_minutes = COALESCE(?, time_minutes),
      estimated_calories = COALESCE(?, estimated_calories),
      exercises_list = COALESCE(?, exercises_list)
    WHERE id = ?
  `, [title || null, type || null, time_minutes || null, estimated_calories || null, exercises_list ? JSON.stringify(exercises_list) : null, parseInt(req.params.id)]);

  const updated = queryOne('SELECT * FROM schedules WHERE id = ?', [parseInt(req.params.id)]);
  res.json(updated);
});

// DELETE /api/schedules/:id
router.delete('/:id', (req, res) => {
  runSql('DELETE FROM schedules WHERE id = ? AND user_id = ?', [parseInt(req.params.id), req.user.id]);
  if (getChanges() === 0) return res.status(404).json({ error: 'Jadwal tidak ditemukan' });
  res.json({ message: 'Jadwal berhasil dihapus' });
});

export default router;
