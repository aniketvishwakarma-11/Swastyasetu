import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import { prisma } from '../db';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  facilityId?: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-min-32-chars-long';

/**
 * Middleware to require valid JWT token in Authorization: Bearer <token>
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // In development or demo mode, support fallback to seeded clinician user if token is missing
      if (process.env.DEMO_MODE === 'true' || process.env.NODE_ENV !== 'production') {
        const fallbackUser =
          (await prisma.user.findFirst({
            where: { role: UserRole.CLINICIAN },
            select: { id: true, name: true, email: true, role: true, facilityId: true },
          })) ||
          (await prisma.user.findFirst({
            select: { id: true, name: true, email: true, role: true, facilityId: true },
          }));

        if (fallbackUser) {
          req.user = fallbackUser;
          next();
          return;
        }
      }

      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required. Please provide a valid Bearer token.',
        },
      });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: UserRole };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, name: true, email: true, role: true, facilityId: true },
    });

    if (!user) {
      if (process.env.DEMO_MODE === 'true' || process.env.NODE_ENV !== 'production') {
        const fallbackUser = await prisma.user.findFirst({
          where: { role: UserRole.CLINICIAN },
          select: { id: true, name: true, email: true, role: true, facilityId: true },
        });
        if (fallbackUser) {
          req.user = fallbackUser;
          next();
          return;
        }
      }

      res.status(401).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User associated with this token no longer exists.',
        },
      });
      return;
    }

    req.user = user;
    next();
  } catch (error: any) {
    if (process.env.DEMO_MODE === 'true' || process.env.NODE_ENV !== 'production') {
      const fallbackUser = await prisma.user.findFirst({
        where: { role: UserRole.CLINICIAN },
        select: { id: true, name: true, email: true, role: true, facilityId: true },
      });
      if (fallbackUser) {
        req.user = fallbackUser;
        next();
        return;
      }
    }

    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired authentication token.',
        details: error.message,
      },
    });
  }
}

/**
 * Middleware to enforce Role-Based Access Control (RBAC)
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required prior to role verification.',
        },
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Access denied. Requires one of [${allowedRoles.join(', ')}], but your role is '${req.user.role}'.`,
          requiredRoles: allowedRoles,
          currentRole: req.user.role,
        },
      });
      return;
    }

    next();
  };
}
