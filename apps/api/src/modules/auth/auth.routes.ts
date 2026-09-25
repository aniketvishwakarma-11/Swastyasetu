import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { UserRole } from '@prisma/client';
import { prisma } from '../../db';
import { requireAuth } from '../../middleware/auth.middleware';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-min-32-chars-long';

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.nativeEnum(UserRole, { errorMap: () => ({ message: 'Invalid role. Must be PHC_USER, CLINICIAN, REFERRAL_COORDINATOR, or ADMIN' }) }),
  facilityId: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const DEMO_LOGIN_USERS = {
  'phc_doctor@swastyasetu.gov.in': {
    id: '00000000-0000-0000-0000-000000000101',
    name: 'Dr. Rajesh Sharma',
    role: UserRole.PHC_USER,
    facilityId: '00000000-0000-0000-0000-000000000001',
    facility: {
      id: '00000000-0000-0000-0000-000000000001',
      code: 'PHC-KHED',
      name: 'Primary Health Centre Khed',
      type: 'PHC',
      district: 'Pune',
    },
  },
  'hospital_doctor@swastyasetu.gov.in': {
    id: '00000000-0000-0000-0000-000000000102',
    name: 'Dr. Priya Deshmukh',
    role: UserRole.CLINICIAN,
    facilityId: '00000000-0000-0000-0000-000000000002',
    facility: {
      id: '00000000-0000-0000-0000-000000000002',
      code: 'DIST-HOSP',
      name: 'Aundh District Hospital',
      type: 'DISTRICT_HOSPITAL',
      district: 'Pune',
    },
  },
  'coordinator@swastyasetu.gov.in': {
    id: '00000000-0000-0000-0000-000000000104',
    name: 'Vikram Solanki',
    role: UserRole.REFERRAL_COORDINATOR,
    facilityId: '00000000-0000-0000-0000-000000000002',
    facility: {
      id: '00000000-0000-0000-0000-000000000002',
      code: 'DIST-HOSP',
      name: 'Aundh District Hospital',
      type: 'DISTRICT_HOSPITAL',
      district: 'Pune',
    },
  },
  'triage_coordinator@swastyasetu.gov.in': {
    id: '00000000-0000-0000-0000-000000000104',
    name: 'Vikram Solanki',
    role: UserRole.REFERRAL_COORDINATOR,
    facilityId: '00000000-0000-0000-0000-000000000002',
    facility: {
      id: '00000000-0000-0000-0000-000000000002',
      code: 'DIST-HOSP',
      name: 'Aundh District Hospital',
      type: 'DISTRICT_HOSPITAL',
      district: 'Pune',
    },
  },
  'admin@swastyasetu.gov.in': {
    id: '00000000-0000-0000-0000-000000000103',
    name: 'System Admin',
    role: UserRole.ADMIN,
    facilityId: null,
    facility: null,
  },
} as const;

/**
 * POST /api/auth/signup
 * Register a new healthcare user with an assigned role and facility
 */
router.post('/signup', async (req: Request, res: Response): Promise<void> => {
  try {
    const validated = signupSchema.parse(req.body);

    const existing = await prisma.user.findUnique({
      where: { email: validated.email.toLowerCase() },
    });

    if (existing) {
      res.status(409).json({
        success: false,
        error: {
          code: 'USER_EXISTS',
          message: 'An account with this email address already exists.',
        },
      });
      return;
    }

    // Verify facility exists if provided
    if (validated.facilityId) {
      const facility = await prisma.facility.findUnique({
        where: { id: validated.facilityId },
      });
      if (!facility) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_FACILITY',
            message: 'Specified facility does not exist.',
          },
        });
        return;
      }
    }

    const passwordHash = await bcrypt.hash(validated.password, 10);

    const user = await prisma.user.create({
      data: {
        name: validated.name,
        email: validated.email.toLowerCase(),
        passwordHash,
        role: validated.role,
        facilityId: validated.facilityId || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        facilityId: true,
        facility: {
          select: { id: true, code: true, name: true, type: true, district: true },
        },
        createdAt: true,
      },
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      data: {
        user,
        token,
      },
      message: 'User registered successfully',
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.errors[0]?.message || 'Invalid input data',
          details: error.errors,
        },
      });
      return;
    }

    console.error('[Signup Error]', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Registration failed due to a server error.',
      },
    });
  }
});

/**
 * POST /api/auth/login
 * Authenticate user and issue JWT token
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const validated = loginSchema.parse(req.body);

    const demoUser = DEMO_LOGIN_USERS[validated.email.toLowerCase() as keyof typeof DEMO_LOGIN_USERS];
    if (demoUser && validated.password === 'password123') {
      try {
        const dbUser = await prisma.user.findUnique({
          where: { email: validated.email.toLowerCase() },
          include: {
            facility: {
              select: { id: true, code: true, name: true, type: true, district: true },
            },
          },
        });

        if (dbUser) {
          const token = jwt.sign(
            { id: dbUser.id, email: dbUser.email, role: dbUser.role, name: dbUser.name },
            JWT_SECRET,
            { expiresIn: '7d' }
          );
          const { passwordHash: _, ...safeUser } = dbUser;
          res.status(200).json({
            success: true,
            data: { user: safeUser, token },
            message: 'Demo authentication successful',
          });
          return;
        }
      } catch (dbErr) {
        console.warn('[Demo login DB lookup fallback]', dbErr);
      }

      const user = {
        id: demoUser.id,
        name: demoUser.name,
        role: demoUser.role,
        facilityId: demoUser.facilityId,
        facility: demoUser.facility,
        email: validated.email.toLowerCase(),
        createdAt: new Date().toISOString(),
      };
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role, name: user.name },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(200).json({
        success: true,
        data: { user, token },
        message: 'Demo authentication successful',
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email: validated.email.toLowerCase() },
      include: {
        facility: {
          select: { id: true, code: true, name: true, type: true, district: true },
        },
      },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Incorrect email or password.',
        },
      });
      return;
    }

    const isMatch = await bcrypt.compare(validated.password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Incorrect email or password.',
        },
      });
      return;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { passwordHash: _, ...safeUser } = user;

    res.status(200).json({
      success: true,
      data: {
        user: safeUser,
        token,
      },
      message: 'Authentication successful',
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.errors[0]?.message || 'Invalid credentials format',
        },
      });
      return;
    }

    console.error('[Login Error]', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Authentication failed due to an unexpected server error.',
      },
    });
  }
});

/**
 * GET /api/auth/me
 * Return current authenticated user profile
 */
router.get('/me', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    let user = null;

    if (req.user?.id) {
      try {
        user = await prisma.user.findUnique({
          where: { id: req.user.id },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            facilityId: true,
            facility: {
              select: { id: true, code: true, name: true, type: true, district: true },
            },
            createdAt: true,
          },
        });
      } catch (err) {
        console.warn('[GET /me id lookup warn]', err);
      }
    }

    if (!user && req.user?.email) {
      try {
        user = await prisma.user.findUnique({
          where: { email: req.user.email.toLowerCase() },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            facilityId: true,
            facility: {
              select: { id: true, code: true, name: true, type: true, district: true },
            },
            createdAt: true,
          },
        });
      } catch (err) {
        console.warn('[GET /me email lookup warn]', err);
      }
    }

    if (!user && req.user?.email) {
      const demo = DEMO_LOGIN_USERS[req.user.email.toLowerCase() as keyof typeof DEMO_LOGIN_USERS];
      if (demo) {
        user = {
          id: demo.id,
          name: demo.name,
          email: req.user.email.toLowerCase(),
          role: demo.role,
          facilityId: demo.facilityId,
          facility: demo.facility,
          createdAt: new Date().toISOString(),
        } as any;
      }
    }

    if (!user) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User profile not found' },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve profile' },
    });
  }
});

/**
 * POST /api/auth/oauth-sync
 * Synchronize Google OAuth login with database user and issue system JWT
 */
router.post('/oauth-sync', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, name } = req.body;
    if (!email) {
      res.status(400).json({
        success: false,
        error: { code: 'MISSING_EMAIL', message: 'Email is required for OAuth synchronization' },
      });
      return;
    }

    const cleanEmail = email.toLowerCase().trim();

    let user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: {
        facility: {
          select: { id: true, code: true, name: true, type: true, district: true },
        },
      },
    });

    if (!user) {
      // Auto-provision user if logging in via Google for the first time
      const defaultFacility = await prisma.facility.findFirst({
        where: { type: 'PHC' },
      });

      const defaultPasswordHash = await bcrypt.hash(`OAuth-${Date.now()}-${Math.random()}`, 10);

      user = await prisma.user.create({
        data: {
          name: name || cleanEmail.split('@')[0],
          email: cleanEmail,
          passwordHash: defaultPasswordHash,
          role: UserRole.PHC_USER, // default frontline staff role
          facilityId: defaultFacility?.id || null,
        },
        include: {
          facility: {
            select: { id: true, code: true, name: true, type: true, district: true },
          },
        },
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { passwordHash: _, ...safeUser } = user;

    res.status(200).json({
      success: true,
      data: {
        user: safeUser,
        token,
      },
      message: 'OAuth session synchronized successfully',
    });
  } catch (error: any) {
    console.error('[OAuth Sync Error]', error);
    res.status(500).json({
      success: false,
      error: { code: 'OAUTH_SYNC_FAILED', message: error.message || 'Failed to sync OAuth user' },
    });
  }
});

export default router;

