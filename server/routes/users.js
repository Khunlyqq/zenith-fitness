import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { queryOne, runSql } from '../db/database.js';

const router = Router();

// GET /api/users/profile
router.get('/profile', (req, res) => {
  const user = queryOne(`
    SELECT id, name, email, role, avatar_url, height_cm, weight_kg, target_weight_kg,
           body_fat_pct, active_goal, language, two_factor_enabled, created_at
    FROM users WHERE id = ?
  `, [req.user.id]);
  if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });
  res.json(user);
});

// PUT /api/users/profile
router.put('/profile', (req, res) => {
  const { name, avatar_url, active_goal, language } = req.body;
  runSql(`
    UPDATE users SET
      name = COALESCE(?, name),
      avatar_url = COALESCE(?, avatar_url),
      active_goal = COALESCE(?, active_goal),
      language = COALESCE(?, language),
      updated_at = datetime('now')
    WHERE id = ?
  `, [name || null, avatar_url || null, active_goal || null, language || null, req.user.id]);

  const user = queryOne('SELECT id, name, email, role, avatar_url, active_goal, language FROM users WHERE id = ?', [req.user.id]);
  res.json(user);
});

// PUT /api/users/biometrics
router.put('/biometrics', (req, res) => {
  const { height_cm, weight_kg, target_weight_kg } = req.body;
  runSql(`
    UPDATE users SET
      height_cm = COALESCE(?, height_cm),
      weight_kg = COALESCE(?, weight_kg),
      target_weight_kg = COALESCE(?, target_weight_kg),
      updated_at = datetime('now')
    WHERE id = ?
  `, [height_cm || null, weight_kg || null, target_weight_kg || null, req.user.id]);

  res.json({ message: 'Biometrics diperbarui' });
});

// PUT /api/users/password
router.put('/password', (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Password lama dan baru harus diisi' });
  }

  const user = queryOne('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
  if (!bcrypt.compareSync(currentPassword, user.password_hash)) {
    return res.status(401).json({ error: 'Password lama salah' });
  }

  const hash = bcrypt.hashSync(newPassword, 10);
  runSql("UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?", [hash, req.user.id]);
  res.json({ message: 'Password berhasil diubah' });
});

// DELETE /api/users/account
router.delete('/account', (req, res) => {
  runSql('DELETE FROM users WHERE id = ?', [req.user.id]);
  res.json({ message: 'Akun berhasil dihapus' });
});

export default router;
