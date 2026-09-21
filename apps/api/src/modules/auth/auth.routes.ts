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
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
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

export default router;
