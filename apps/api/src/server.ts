import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Load .env from monorepo root FIRST — before Prisma client is initialized
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') }); // fallback

import express, { Request, Response } from 'express';
import cors from 'cors';
import authRoutes from './modules/auth/auth.routes';
import facilitiesRoutes from './modules/facilities/facilities.routes';
import rbacTestRoutes from './modules/test/rbac-test.routes';
import referralsRoutes from './modules/referrals/referrals.routes';
import syncRoutes from './modules/sync/sync.routes';
import identityRoutes from './modules/identity/identity.routes';
import documentsRoutes from './modules/documents/documents.routes';
import vitalsRoutes from './modules/vitals/vitals.routes';
import followupsRoutes from './modules/followups/followups.routes';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded clinical documents statically from local folder
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

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
app.use('/api/referrals', referralsRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/identity', identityRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/vitals', vitalsRoutes);
app.use('/api/follow-ups', followupsRoutes);
app.use('/api/test', rbacTestRoutes);

// Check if frontend build exists to serve full-stack monolith
const candidatePaths = [
  path.resolve(__dirname, '../../web/dist'),
  path.resolve(__dirname, '../../../apps/web/dist'),
  path.resolve(process.cwd(), 'apps/web/dist'),
];
const webDistPath = candidatePaths.find((p) => fs.existsSync(path.join(p, 'index.html')));

if (webDistPath && (process.env.SERVE_FRONTEND === 'true' || process.env.NODE_ENV === 'production')) {
  console.log(`[SwasthyaSetu API] Serving frontend bundle from ${webDistPath}`);
  app.use(express.static(webDistPath));
  app.get('*', (req: Request, res: Response, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(webDistPath, 'index.html'));
  });
} else {
  // Root information when frontend is hosted separately
  app.get('/', (_req: Request, res: Response) => {
    res.json({
      name: 'SwasthyaSetu API',
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
}

// Start server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[SwasthyaSetu API] Server running on port ${PORT}`);
    console.log(`[SwasthyaSetu API] Health check at http://localhost:${PORT}/api/health`);
  });
}

export default app;
