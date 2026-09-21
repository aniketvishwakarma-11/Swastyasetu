import { Router, Request, Response } from 'express';
import { prisma } from '../../db';

const router = Router();

/**
 * GET /api/facilities
 * Retrieve list of healthcare facilities
 */
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const facilities = await prisma.facility.findMany({
      orderBy: { name: 'asc' },
    });

    res.status(200).json({
      success: true,
      data: facilities,
    });
  } catch (error: any) {
    console.error('[Facilities Error]', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve facilities list.',
      },
    });
  }
});

export default router;
