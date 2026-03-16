import { Router } from 'express';
import { queryAll, queryOne, runSql, getChanges, getLastInsertId } from '../db/database.js';

const router = Router();

// GET /api/admin/users
router.get('/users', (req, res) => {
  const users = queryAll('SELECT id, name, email, role, active_goal, language, created_at FROM users ORDER BY created_at DESC');
  res.json(users);
});

// PUT /api/admin/users/:id
router.put('/users/:id', (req, res) => {
  const { name, email, role, active_goal, language } = req.body;
  const user = queryOne('SELECT id FROM users WHERE id = ?', [req.params.id]);
  if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });

  runSql(`
    UPDATE users SET
      name = COALESCE(?, name),
      email = COALESCE(?, email),
      role = COALESCE(?, role),
      active_goal = COALESCE(?, active_goal),
      language = COALESCE(?, language),
      updated_at = datetime('now')
    WHERE id = ?
  `, [name || null, email || null, role || null, active_goal || null, language || null, parseInt(req.params.id)]);

  const updated = queryOne('SELECT id, name, email, role, active_goal, language FROM users WHERE id = ?', [parseInt(req.params.id)]);
  res.json(updated);
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', (req, res) => {
  if (parseInt(req.params.id) === req.user.id) {
    return res.status(400).json({ error: 'Tidak bisa menghapus akun sendiri' });
  }
  runSql('DELETE FROM users WHERE id = ?', [parseInt(req.params.id)]);
  if (getChanges() === 0) return res.status(404).json({ error: 'User tidak ditemukan' });
  res.json({ message: 'User berhasil dihapus' });
});

// POST /api/admin/exercises
router.post('/exercises', (req, res) => {
  const { name, description, muscle_group, difficulty, image_url } = req.body;
  if (!name || !muscle_group) return res.status(400).json({ error: 'Nama dan kelompok otot harus diisi' });

  runSql(
    'INSERT INTO exercises (name, description, muscle_group, difficulty, image_url) VALUES (?, ?, ?, ?, ?)',
    [name, description || null, muscle_group, difficulty || 'Intermediate', image_url || null]
  );
  const id = getLastInsertId('exercises');
  const exercise = queryOne('SELECT * FROM exercises WHERE id = ?', [id]);
  res.status(201).json(exercise);
});

// PUT /api/admin/exercises/:id
router.put('/exercises/:id', (req, res) => {
  const { name, description, muscle_group, difficulty, image_url } = req.body;
  runSql(`
    UPDATE exercises SET
      name = COALESCE(?, name),
      description = COALESCE(?, description),
      muscle_group = COALESCE(?, muscle_group),
      difficulty = COALESCE(?, difficulty),
      image_url = COALESCE(?, image_url)
    WHERE id = ?
  `, [name || null, description || null, muscle_group || null, difficulty || null, image_url || null, parseInt(req.params.id)]);

  const exercise = queryOne('SELECT * FROM exercises WHERE id = ?', [parseInt(req.params.id)]);
  if (!exercise) return res.status(404).json({ error: 'Exercise tidak ditemukan' });
  res.json(exercise);
});

// DELETE /api/admin/exercises/:id
router.delete('/exercises/:id', (req, res) => {
  runSql('DELETE FROM exercises WHERE id = ?', [parseInt(req.params.id)]);
  if (getChanges() === 0) return res.status(404).json({ error: 'Exercise tidak ditemukan' });
  res.json({ message: 'Exercise berhasil dihapus' });
});

// GET /api/admin/schedules
router.get('/schedules', (req, res) => {
  const schedules = queryAll(`
    SELECT s.*, u.name as user_name FROM schedules s
    JOIN users u ON s.user_id = u.id
    ORDER BY s.date DESC
  `);
  res.json(schedules);
});

// DELETE /api/admin/schedules/:id
router.delete('/schedules/:id', (req, res) => {
  runSql('DELETE FROM schedules WHERE id = ?', [parseInt(req.params.id)]);
  if (getChanges() === 0) return res.status(404).json({ error: 'Schedule tidak ditemukan' });
  res.json({ message: 'Schedule berhasil dihapus' });
});

export default router;
