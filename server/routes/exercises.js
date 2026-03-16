import { Router } from 'express';
import { supabase } from '../db/database.js';

const router = Router();

// GET /api/exercises?muscle_group=Chest&q=bench
router.get('/', async (req, res) => {
  const { muscle_group, q } = req.query;
  
  try {
    let query = supabase.from('exercises').select('*');

    if (muscle_group) {
      query = query.eq('muscle_group', muscle_group);
    }

    if (q) {
      query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%`);
    }

    const { data: exercises, error } = await query.order('muscle_group').order('name');
    if (error) throw error;
    res.json(exercises || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/exercises/:id
router.get('/:id', async (req, res) => {
  try {
    const { data: exercise, error } = await supabase
      .from('exercises')
      .select('*')
      .eq('id', parseInt(req.params.id))
      .single();

    if (error || !exercise) return res.status(404).json({ error: 'Exercise tidak ditemukan' });
    res.json(exercise);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
