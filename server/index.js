import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';
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

// Create and configure Express app
export function createApp() {
  const app = express();

  // Global middleware
  app.use(cors());
  app.use(express.json());

  // === API Routes ===
  app.use('/api/auth', authRoutes);
  app.use('/api/users', authenticate, userRoutes);
  app.use('/api/dashboard', authenticate, dashboardRoutes);
  app.use('/api/schedules', authenticate, scheduleRoutes);
  app.use('/api/exercises', authenticate, exerciseRoutes);
  app.use('/api/workouts', authenticate, workoutRoutes);
  app.use('/api/stats', authenticate, statsRoutes);
  app.use('/api/nutrition', authenticate, nutritionRoutes);
  app.use('/api/admin', authenticate, requireAdmin, adminRoutes);

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Global error handler
  app.use((err, req, res, next) => {
    console.error('❌ Error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}

// Export for serverless usage
export { initDatabase };

// Start standalone server (only when NOT on Vercel)
if (!process.env.VERCEL) {
  const isMainModule = process.argv[1] && fileURLToPath(import.meta.url).includes(process.argv[1].replace(/\\/g, '/').split('/').pop());

  if (isMainModule) {
    const PORT = process.env.PORT || 3000;
    const app = createApp();
    
    // Serve frontend static files
    const distPath = path.join(__dirname, '..', 'dist');
    app.use(express.static(distPath));
    app.get(/^(?!\/api).*/, (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });

    initDatabase().then(() => {
      console.log('✅ Database initialized');
      app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Zenith Server running on http://localhost:${PORT}`);
      });
    }).catch(err => {
      console.error('❌ Failed to start:', err);
      process.exit(1);
    });
  }
}
