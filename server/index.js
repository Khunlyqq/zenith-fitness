import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase } from './db/database.js';

// Import routes
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import userRoutes from './routes/users.js';
import dashboardRoutes from './routes/dashboard.js';
import scheduleRoutes from './routes/schedules.js';
import exerciseRoutes from './routes/exercises.js';
import workoutRoutes from './routes/workouts.js';
import statsRoutes from './routes/stats.js';
import nutritionRoutes from './routes/nutrition.js';

// Import middleware
import { authenticate } from './middleware/auth.js';
import { requireAdmin } from './middleware/admin.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// Global middleware
app.use(cors());
app.use(express.json());

// === API Routes ===

// Public
app.use('/api/auth', authRoutes);

// Protected (require login)
app.use('/api/users', authenticate, userRoutes);
app.use('/api/dashboard', authenticate, dashboardRoutes);
app.use('/api/schedules', authenticate, scheduleRoutes);
app.use('/api/exercises', authenticate, exerciseRoutes);
app.use('/api/workouts', authenticate, workoutRoutes);
app.use('/api/stats', authenticate, statsRoutes);
app.use('/api/nutrition', authenticate, nutritionRoutes);

// Admin (require login + admin role)
app.use('/api/admin', authenticate, requireAdmin, adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// === Serve Frontend (production) ===
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));

// SPA fallback — serve index.html for all non-API routes
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// Initialize DB then start server
async function start() {
  await initDatabase();
  console.log('✅ Database initialized');

  app.listen(PORT, '0.0.0.0', () => {
    console.log('');
    console.log('╔══════════════════════════════════════════╗');
    console.log('║        🚀 Zenith Server                  ║');
    console.log(`║        Running on port ${PORT}              ║`);
    console.log(`║        http://localhost:${PORT}               ║`);
    console.log('╚══════════════════════════════════════════╝');
    console.log('');
    console.log(`📁 Serving frontend from: ${distPath}`);
    console.log('📌 API: /api/*');
    console.log('');
  });
}

start().catch(err => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});
