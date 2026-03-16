import { Router } from 'express';
import { supabase } from '../db/database.js';

const router = Router();

// GET /api/dashboard/summary
router.get('/summary', async (req, res) => {
  const userId = req.user.id;
  const today = new Date().toISOString().split('T')[0];

  try {
    const { data: user } = await supabase
      .from('users')
      .select('weight_kg')
      .eq('id', userId)
      .single();

    const { data: nutrition } = await supabase
      .from('nutrition_logs')
      .select('calories, water_ml')
      .eq('user_id', userId)
      .eq('date', today)
      .single();

    const { count: sessionCount } = await supabase
      .from('workout_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .not('ended_at', 'is', null);

    // Calculate streak (dates from workout_sessions)
    const { data: recentSessions } = await supabase
      .from('workout_sessions')
      .select('started_at')
      .eq('user_id', userId)
      .not('ended_at', 'is', null)
      .order('started_at', { ascending: false })
      .limit(30);

    const uniqueDates = [...new Set(recentSessions?.map(s => s.started_at.split('T')[0]) || [])];
    
    let streak = 0;
    const todayDate = new Date();
    for (let i = 0; i < uniqueDates.length; i++) {
      const expected = new Date(todayDate);
      expected.setDate(expected.getDate() - i);
      const expectedStr = expected.toISOString().split('T')[0];
      if (uniqueDates[i] === expectedStr) {
        streak++;
      } else if (i === 0) {
        // If first one isn't today, check if it was yesterday
        const yesterday = new Date(todayDate);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        if (uniqueDates[i] === yesterdayStr) {
           // Streak continues from yesterday
           continue; 
        } else {
           break;
        }
      } else {
        break;
      }
    }

    res.json({
      streak,
      calories: nutrition?.calories || 0,
      weight_kg: user?.weight_kg || 0,
      water_ml: nutrition?.water_ml || 0,
      total_workouts: sessionCount || 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dashboard/nutrition/today
router.get('/nutrition/today', async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  try {
    const { data: nutrition } = await supabase
      .from('nutrition_logs')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('date', today)
      .single();

    res.json(nutrition || { protein_g: 0, carbs_g: 0, fat_g: 0, calories: 0, water_ml: 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/dashboard/hydration
router.post('/hydration', async (req, res) => {
  const { amount_ml } = req.body;
  const today = new Date().toISOString().split('T')[0];
  const userId = req.user.id;

  try {
    const { data: existing } = await supabase
      .from('nutrition_logs')
      .select('id, water_ml')
      .eq('user_id', userId)
      .eq('date', today)
      .single();

    if (existing) {
      const { data: updated, error } = await supabase
        .from('nutrition_logs')
        .update({ water_ml: (existing.water_ml || 0) + (amount_ml || 250) })
        .eq('id', existing.id)
        .select('water_ml')
        .single();
      if (error) throw error;
      res.json({ water_ml: updated.water_ml });
    } else {
      const { data: inserted, error } = await supabase
        .from('nutrition_logs')
        .insert([{ user_id: userId, date: today, water_ml: amount_ml || 250 }])
        .select('water_ml')
        .single();
      if (error) throw error;
      res.json({ water_ml: inserted.water_ml });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dashboard/body-stats
router.get('/body-stats', async (req, res) => {
  try {
    const { data: stats } = await supabase
      .from('body_stats')
      .select('date, weight_kg, body_fat_pct')
      .eq('user_id', req.user.id)
      .order('date', { ascending: false })
      .limit(10);
      
    res.json(stats || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dashboard/next-session
router.get('/next-session', async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  try {
    const { data: next } = await supabase
      .from('schedules')
      .select('*')
      .eq('user_id', req.user.id)
      .gte('date', today)
      .order('date', { ascending: true })
      .limit(1)
      .single();

    res.json(next || null);
  } catch (err) {
    res.json(null); // Silent fail for UI simplicity
  }
});

// POST /api/dashboard/body-stats
router.post('/body-stats', async (req, res) => {
  const { weight_kg, body_fat_pct } = req.body;
  if (!weight_kg && !body_fat_pct) {
    return res.status(400).json({ error: 'At least one of weight_kg or body_fat_pct is required' });
  }
  const today = new Date().toISOString().split('T')[0];
  const userId = req.user.id;

  try {
    const { data: existing } = await supabase
      .from('body_stats')
      .select('id')
      .eq('user_id', userId)
      .eq('date', today)
      .single();

    if (existing) {
      await supabase
        .from('body_stats')
        .update({ weight_kg, body_fat_pct })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('body_stats')
        .insert([{ user_id: userId, date: today, weight_kg, body_fat_pct }]);
    }

    // Also update user profile weight
    if (weight_kg) {
      await supabase
        .from('users')
        .update({ weight_kg, updated_at: new Date().toISOString() })
        .eq('id', userId);
    }

    const { data: stats } = await supabase
      .from('body_stats')
      .select('date, weight_kg, body_fat_pct')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(10);

    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
