import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './modules/auth/auth.routes';
import facilitiesRoutes from './modules/facilities/facilities.routes';
import rbacTestRoutes from './modules/test/rbac-test.routes';

dotenv.config({ path: '../../.env' });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint for network liveness / offline ping detection
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'SwasthyaSetu API',
    timestamp: new Date().toISOString(),
    demoMode: process.env.DEMO_MODE === 'true',
  });
});

// Mounted Modular Routers
app.use('/api/auth', authRoutes);
app.use('/api/facilities', facilitiesRoutes);
app.use('/api/test', rbacTestRoutes);

// Root information
app.get('/', (_req: Request, res: Response) => {
  res.json({
    name: 'SwasthyaSetu / MediVault API',
    version: '1.0.0',
    description: 'Offline-first healthcare continuity layer API with Supabase PostgreSQL and RBAC',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      facilities: '/api/facilities',
      rbacTests: '/api/test',
    },
  });
});

// Start server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[SwasthyaSetu API] Server running on port ${PORT}`);
    console.log(`[SwasthyaSetu API] Health check at http://localhost:${PORT}/api/health`);
  });
}

export default app;
