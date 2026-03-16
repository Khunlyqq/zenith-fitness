import { Router } from 'express';
import { supabase } from '../db/database.js';

const router = Router();

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, email, role, active_goal, language, created_at')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(users || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/users/:id
router.put('/users/:id', async (req, res) => {
  const { name, email, role, active_goal, language } = req.body;
  const userId = parseInt(req.params.id);

  try {
    const { data: updated, error } = await supabase
      .from('users')
      .update({
        name,
        email,
        role,
        active_goal,
        language,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select('id, name, email, role, active_goal, language')
      .single();

    if (error) return res.status(404).json({ error: 'User tidak ditemukan' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', async (req, res) => {
  const userId = parseInt(req.params.id);
  if (userId === req.user.id) {
    return res.status(400).json({ error: 'Tidak bisa menghapus akun sendiri' });
  }

  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);
    if (error) return res.status(404).json({ error: 'User tidak ditemukan' });
    res.json({ message: 'User berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/exercises
router.post('/exercises', async (req, res) => {
  const { name, description, muscle_group, difficulty, image_url } = req.body;
  if (!name || !muscle_group) return res.status(400).json({ error: 'Nama dan kelompok otot harus diisi' });

  try {
    const { data: exercise, error } = await supabase
      .from('exercises')
      .insert([{
        name,
        description,
        muscle_group,
        difficulty: difficulty || 'Intermediate',
        image_url
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(exercise);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/exercises/:id
router.put('/exercises/:id', async (req, res) => {
  const { name, description, muscle_group, difficulty, image_url } = req.body;
  const exerciseId = parseInt(req.params.id);

  try {
    const { data: updated, error } = await supabase
      .from('exercises')
      .update({
        name,
        description,
        muscle_group,
        difficulty,
        image_url
      })
      .eq('id', exerciseId)
      .select()
      .single();

    if (error) return res.status(404).json({ error: 'Exercise tidak ditemukan' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/exercises/:id
router.delete('/exercises/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('exercises')
      .delete()
      .eq('id', parseInt(req.params.id));
    if (error) return res.status(404).json({ error: 'Exercise tidak ditemukan' });
    res.json({ message: 'Exercise berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/schedules
router.get('/schedules', async (req, res) => {
  try {
    const { data: schedules, error } = await supabase
      .from('schedules')
      .select(`
        *,
        users (name)
      `)
      .order('date', { ascending: false });

    if (error) throw error;
    
    const flattened = schedules.map(s => ({
      ...s,
      user_name: s.users?.name
    }));

    res.json(flattened);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/schedules/:id
router.delete('/schedules/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('schedules')
      .delete()
      .eq('id', parseInt(req.params.id));
    if (error) return res.status(404).json({ error: 'Schedule tidak ditemukan' });
    res.json({ message: 'Schedule berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
