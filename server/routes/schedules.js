import { Router } from 'express';
import { supabase } from '../db/database.js';

const router = Router();

// GET /api/schedules?month=10&year=2023
router.get('/', async (req, res) => {
  const { month, year } = req.query;
  const userId = req.user.id;

  try {
    let query = supabase.from('schedules').select('*').eq('user_id', userId);

    if (month && year) {
      const paddedMonth = String(month).padStart(2, '0');
      const pattern = `${year}-${paddedMonth}-%`;
      query = query.ilike('date', pattern);
    } else {
      query = query.order('date', { ascending: false });
    }

    const { data: schedules, error } = await query;
    if (error) throw error;
    res.json(schedules || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/schedules/:date
router.get('/:date', async (req, res) => {
  try {
    const { data: schedule } = await supabase
      .from('schedules')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('date', req.params.date)
      .single();
    res.json(schedule || null);
  } catch (err) {
    res.json(null);
  }
});

// POST /api/schedules
router.post('/', async (req, res) => {
  const { date, title, type, time_minutes, estimated_calories, exercises_list } = req.body;
  if (!date || !title || !type) {
    return res.status(400).json({ error: 'Tanggal, judul, dan tipe harus diisi' });
  }

  try {
    const { data: existing } = await supabase
      .from('schedules')
      .select('id')
      .eq('user_id', req.user.id)
      .eq('date', date)
      .single();

    if (existing) {
      return res.status(409).json({ error: 'Sudah ada jadwal di tanggal tersebut' });
    }

    const { data: schedule, error } = await supabase
      .from('schedules')
      .insert([{
        user_id: req.user.id,
        date,
        title,
        type,
        time_minutes: time_minutes || null,
        estimated_calories: estimated_calories || null,
        exercises_list: exercises_list ? JSON.stringify(exercises_list) : null
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(schedule);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/schedules/:id
router.put('/:id', async (req, res) => {
  const { title, type, time_minutes, estimated_calories, exercises_list } = req.body;
  const scheduleId = parseInt(req.params.id);

  try {
    const { data: updated, error } = await supabase
      .from('schedules')
      .update({
        title,
        type,
        time_minutes,
        estimated_calories,
        exercises_list: exercises_list ? JSON.stringify(exercises_list) : undefined
      })
      .eq('id', scheduleId)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) return res.status(404).json({ error: 'Jadwal tidak ditemukan' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/schedules/:id
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('schedules')
      .delete()
      .eq('id', parseInt(req.params.id))
      .eq('user_id', req.user.id);

    if (error) return res.status(404).json({ error: 'Jadwal tidak ditemukan' });
    res.json({ message: 'Jadwal berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
