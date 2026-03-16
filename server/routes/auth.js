import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { queryOne, runSql, getLastInsertId } from '../db/database.js';
import { JWT_SECRET, authenticate } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/register
router.post('/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Semua field harus diisi' });
  }

  const existing = queryOne('SELECT id FROM users WHERE email = ?', [email]);
  if (existing) {
    return res.status(409).json({ error: 'Email sudah terdaftar' });
  }

  const hash = bcrypt.hashSync(password, 10);
  runSql('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)', [name, email, hash]);
  const id = getLastInsertId('users');

  const token = jwt.sign({ id, role: 'user' }, JWT_SECRET, { expiresIn: '7d' });
  res.status(201).json({ token, user: { id, name, email, role: 'user' } });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email dan password harus diisi' });
  }

  const user = queryOne('SELECT * FROM users WHERE email = ?', [email]);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Email atau password salah' });
  }

  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar_url: user.avatar_url,
    },
  });
});

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => {
  const user = queryOne('SELECT id, name, email, role, avatar_url, language, active_goal FROM users WHERE id = ?', [req.user.id]);
  if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });
  res.json(user);
});

export default router;
