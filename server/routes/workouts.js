import { Router } from 'express';
import { supabase } from '../db/database.js';

const router = Router();

router.post('/start', async (req, res) => {
  const { schedule_id } = req.body;
  try {
    const { data: session, error } = await supabase
      .from('workout_sessions')
      .insert([{ user_id: req.user.id, schedule_id: schedule_id || null }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/workouts/:id
router.get('/:id', async (req, res) => {
  try {
    const { data: session, error } = await supabase
      .from('workout_sessions')
      .select('*')
      .eq('id', parseInt(req.params.id))
      .eq('user_id', req.user.id)
      .single();

    if (error || !session) return res.status(404).json({ error: 'Sesi tidak ditemukan' });

    const { data: sets, error: setsError } = await supabase
      .from('set_logs')
      .select(`
        *,
        exercises (name)
      `)
      .eq('session_id', session.id)
      .order('exercise_id')
      .order('set_number');

    if (setsError) throw setsError;

    // Flatten exercise name
    const flattenedSets = sets.map(s => ({
      ...s,
      exercise_name: s.exercises?.name
    }));

    res.json({ ...session, sets: flattenedSets });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/workouts/:id/sets
router.post('/:id/sets', async (req, res) => {
  const { exercise_id, set_number, weight_kg, reps } = req.body;
  const sessionId = parseInt(req.params.id);

  if (!exercise_id || !set_number) {
    return res.status(400).json({ error: 'exercise_id dan set_number harus diisi' });
  }

  try {
    const { data: session, error: sessErr } = await supabase
      .from('workout_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', req.user.id)
      .single();

    if (sessErr || !session) return res.status(404).json({ error: 'Sesi tidak ditemukan' });

    const { data: setLog, error: setErr } = await supabase
      .from('set_logs')
      .insert([{
        session_id: sessionId,
        exercise_id,
        set_number,
        weight_kg: weight_kg || 0,
        reps: reps || 0,
        completed: 1
      }])
      .select()
      .single();

    if (setErr) throw setErr;

    // Update total volume
    const volume = (weight_kg || 0) * (reps || 0);
    await supabase.rpc('increment_volume', { 
        sess_id: sessionId, 
        inc_val: volume 
    }).catch(async () => {
        // Fallback if RPC doesn't exist: fetch and update
        await supabase
          .from('workout_sessions')
          .update({ total_volume_kg: (session.total_volume_kg || 0) + volume })
          .eq('id', sessionId);
    });

    // Check for personal record
    const { data: currentPR } = await supabase
      .from('personal_records')
      .select('max_weight_kg')
      .eq('user_id', req.user.id)
      .eq('exercise_id', exercise_id)
      .single();

    if (!currentPR || weight_kg > currentPR.max_weight_kg) {
      await supabase
        .from('personal_records')
        .upsert([{
          user_id: req.user.id,
          exercise_id,
          max_weight_kg: weight_kg,
          achieved_at: new Date().toISOString(),
          badge: 'gold'
        }], { onConflict: 'user_id,exercise_id' });
    }

    res.status(201).json(setLog);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/workouts/:id/end
router.put('/:id/end', async (req, res) => {
  const sessionId = parseInt(req.params.id);
  try {
    const { data: session, error: sessErr } = await supabase
      .from('workout_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', req.user.id)
      .single();

    if (sessErr || !session) return res.status(404).json({ error: 'Sesi tidak ditemukan' });

    const startedAt = new Date(session.started_at);
    const duration = Math.floor((Date.now() - startedAt.getTime()) / 1000);

    const { data: updated, error: updErr } = await supabase
      .from('workout_sessions')
      .update({
        ended_at: new Date().toISOString(),
        duration_seconds: duration
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (updErr) throw updErr;
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
