import { Router } from 'express';
import { queryAll, queryOne } from '../db/database.js';

const router = Router();

// GET /api/exercises?muscle_group=Chest&q=bench
router.get('/', (req, res) => {
  const { muscle_group, q } = req.query;
  let query = 'SELECT * FROM exercises WHERE 1=1';
  const params = [];

  if (muscle_group) {
    query += ' AND muscle_group = ?';
    params.push(muscle_group);
  }

  if (q) {
    query += ' AND (name LIKE ? OR description LIKE ?)';
    params.push(`%${q}%`, `%${q}%`);
  }

  query += ' ORDER BY muscle_group, name';
  const exercises = queryAll(query, params);
  res.json(exercises);
});

// GET /api/exercises/:id
router.get('/:id', (req, res) => {
  const exercise = queryOne('SELECT * FROM exercises WHERE id = ?', [parseInt(req.params.id)]);
  if (!exercise) return res.status(404).json({ error: 'Exercise tidak ditemukan' });
  res.json(exercise);
});

export default router;
