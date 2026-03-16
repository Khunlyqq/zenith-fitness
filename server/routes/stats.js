import { Router } from 'express';
import { supabase } from '../db/database.js';

const router = Router();

// GET /api/stats/volume?period=1M
router.get('/volume', async (req, res) => {
  const period = req.query.period || '1M';
  let days;
  switch (period) {
    case '1W': days = 7; break;
    case '3M': days = 90; break;
    case 'All': days = 3650; break;
    default: days = 30;
  }

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  try {
    const { data: sessions, error } = await supabase
      .from('workout_sessions')
      .select('started_at, total_volume_kg')
      .eq('user_id', req.user.id)
      .not('ended_at', 'is', null)
      .gte('started_at', startDate.toISOString());

    if (error) throw error;

    // Group by date in JS
    const grouped = sessions.reduce((acc, s) => {
      const date = s.started_at.split('T')[0];
      acc[date] = (acc[date] || 0) + (s.total_volume_kg || 0);
      return acc;
    }, {});

    const data = Object.entries(grouped).map(([date, volume]) => ({ date, volume })).sort((a,b) => a.date.localeCompare(b.date));
    const totalVolume = data.reduce((sum, d) => sum + d.volume, 0);

    res.json({ total_volume: totalVolume, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/stats/body-weight?period=1M
router.get('/body-weight', async (req, res) => {
  const period = req.query.period || '1M';
  let days;
  switch (period) {
    case '1W': days = 7; break;
    case '3M': days = 90; break;
    case 'All': days = 3650; break;
    default: days = 30;
  }

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startStr = startDate.toISOString().split('T')[0];

  try {
    const { data, error } = await supabase
      .from('body_stats')
      .select('date, weight_kg, body_fat_pct')
      .eq('user_id', req.user.id)
      .gte('date', startStr)
      .order('date', { ascending: true });

    if (error) throw error;

    const latest = data[data.length - 1];
    const oldest = data[0];
    const change = latest && oldest ? +(latest.weight_kg - oldest.weight_kg).toFixed(1) : 0;

    res.json({ latest_weight: latest?.weight_kg || 0, change_kg: change, data: data || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/stats/personal-records
router.get('/personal-records', async (req, res) => {
  try {
    const { data: records, error } = await supabase
      .from('personal_records')
      .select(`
        *,
        exercises (name, muscle_group)
      `)
      .eq('user_id', req.user.id)
      .order('achieved_at', { ascending: false });

    if (error) throw error;
    
    // Flatten the result to match old API
    const flattened = records.map(r => ({
      ...r,
      exercise_name: r.exercises?.name,
      muscle_group: r.exercises?.muscle_group
    }));

    res.json(flattened);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
