import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { supabase } from '../db/database.js';

const router = Router();

// GET /api/users/profile
router.get('/profile', async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select(`
        id, name, email, role, avatar_url, height_cm, weight_kg, target_weight_kg,
        body_fat_pct, active_goal, language, two_factor_enabled, created_at
      `)
      .eq('id', req.user.id)
      .single();

    if (error || !user) return res.status(404).json({ error: 'User tidak ditemukan' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/profile
router.put('/profile', async (req, res) => {
  const { name, avatar_url, active_goal, language } = req.body;
  const userId = req.user.id;

  try {
    const { data: updated, error } = await supabase
      .from('users')
      .update({
        name,
        avatar_url,
        active_goal,
        language,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select('id, name, email, role, avatar_url, active_goal, language')
      .single();

    if (error) throw error;
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/biometrics
router.put('/biometrics', async (req, res) => {
  const { height_cm, weight_kg, target_weight_kg } = req.body;
  try {
    const { error } = await supabase
      .from('users')
      .update({
        height_cm,
        weight_kg,
        target_weight_kg,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.user.id);

    if (error) throw error;
    res.json({ message: 'Biometrics diperbarui' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/password
router.put('/password', async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Password lama dan baru harus diisi' });
  }

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('password_hash')
      .eq('id', req.user.id)
      .single();

    if (error || !user || !bcrypt.compareSync(currentPassword, user.password_hash)) {
      return res.status(401).json({ error: 'Password lama salah' });
    }

    const hash = bcrypt.hashSync(newPassword, 10);
    await supabase
      .from('users')
      .update({ password_hash: hash, updated_at: new Date().toISOString() })
      .eq('id', req.user.id);

    res.json({ message: 'Password berhasil diubah' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/users/account
router.delete('/account', async (req, res) => {
  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', req.user.id);
    if (error) throw error;
    res.json({ message: 'Akun berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
