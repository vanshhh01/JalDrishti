import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import complaintRoutes from './routes/complaints.js';
import analyticsRoutes from './routes/analytics.js';
import notificationRoutes from './routes/notifications.js';
import teamsRoutes from './routes/teams.js';
import publicRoutes from './routes/public.js';
import { seedConsumptionData } from './services/analyticsService.js';
import { autoSeedMunicipalTeams } from './services/teamService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    system: 'JalDrishti Smart Water Intelligence System',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/complaints', complaintRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/teams', teamsRoutes);
app.use('/api/public', publicRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Start Server
app.listen(PORT, async () => {
  console.log(`====================================================`);
  console.log(`🌊 JalDrishti Backend API running on port ${PORT}`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`✨ Autonomous Municipal Water Intelligence Platform`);
  console.log(`====================================================`);
  
  // Auto-seed initial consumption zones and municipal teams if empty
  try {
    await seedConsumptionData();
    await autoSeedMunicipalTeams();
    console.log(`✅ Municipal consumption baseline zones and field teams verified/seeded.`);
  } catch (err) {
    console.warn(`⚠️ Seed warning:`, err.message);
  }
});
