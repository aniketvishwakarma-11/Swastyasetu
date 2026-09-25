import { Router, Request, Response } from 'express';
import { prisma } from '../../db';
import capacityRoutes from './capacity.routes';

const router = Router();

router.use('/', capacityRoutes);

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
    console.warn('[Facilities Warning] Database query failed, using static facilities fallback:', error.message);
    res.status(200).json({
      success: true,
      data: [
        {
          id: '00000000-0000-0000-0000-000000000001',
          code: 'PHC-KHED',
          name: 'Primary Health Centre Khed',
          type: 'PHC',
          district: 'Pune',
          state: 'Maharashtra',
          phone: '+91 2135 222011',
        },
        {
          id: '00000000-0000-0000-0000-000000000002',
          code: 'DIST-HOSP',
          name: 'Aundh District Hospital',
          type: 'DISTRICT_HOSPITAL',
          district: 'Pune',
          state: 'Maharashtra',
          phone: '+91 20 2728 0432',
        },
        {
          id: '00000000-0000-0000-0000-000000000003',
          code: 'NEXT-CLINIC',
          name: 'Sanjivani Community Clinic',
          type: 'PRIVATE_CLINIC',
          district: 'Pune',
          state: 'Maharashtra',
          phone: '+91 20 2553 1190',
        },
      ],
    });
  }
});

export default router;
