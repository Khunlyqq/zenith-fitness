import { Router } from 'express';
import { supabase } from '../db/database.js';

const router = Router();

// GET /api/nutrition/today
router.get('/today', async (req, res) => {
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

// POST /api/nutrition/log
router.post('/log', async (req, res) => {
  const { protein_g, carbs_g, fat_g, calories } = req.body;
  const today = new Date().toISOString().split('T')[0];
  const userId = req.user.id;

  try {
    const { data: existing } = await supabase
      .from('nutrition_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .single();

    if (existing) {
      const { data: updated, error } = await supabase
        .from('nutrition_logs')
        .update({
          protein_g: (existing.protein_g || 0) + (protein_g || 0),
          carbs_g: (existing.carbs_g || 0) + (carbs_g || 0),
          fat_g: (existing.fat_g || 0) + (fat_g || 0),
          calories: (existing.calories || 0) + (calories || 0)
        })
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      res.json(updated);
    } else {
      const { data: inserted, error } = await supabase
        .from('nutrition_logs')
        .insert([{
          user_id: userId,
          date: today,
          protein_g: protein_g || 0,
          carbs_g: carbs_g || 0,
          fat_g: fat_g || 0,
          calories: calories || 0
        }])
        .select()
        .single();
      if (error) throw error;
      res.json(inserted);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
