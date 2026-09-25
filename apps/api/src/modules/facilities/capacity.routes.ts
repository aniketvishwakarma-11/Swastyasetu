import { Router, Request, Response } from 'express';
import { prisma } from '../../db';
import { requireAuth, requireRole } from '../../middleware/auth.middleware';

const router = Router();

export interface FacilityCapacityData {
  facilityId: string;
  facilityName: string;
  facilityCode: string;
  facilityType: string;
  district: string;
  icu: {
    total: number;
    available: number;
    occupied: number;
    ventilators: {
      total: number;
      available: number;
    };
  };
  oxygen: {
    total: number;
    available: number;
    occupied: number;
  };
  general: {
    total: number;
    available: number;
    occupied: number;
  };
  lastUpdatedAt: string;
  lastUpdatedBy?: string | null;
}

export interface SpecialistData {
  id: string;
  facilityId: string;
  specialty: string;
  specialistName: string;
  isOnDuty: boolean;
  contactPhone?: string | null;
  shiftStart?: string | null;
  shiftEnd?: string | null;
  notes?: string | null;
}

export interface ReadinessResponse {
  facilities: (FacilityCapacityData & { specialists: SpecialistData[] })[];
}

/**
 * GET /api/facilities/capacity
 * Get live bed capacity and specialist readiness across all district facilities
 */
router.get('/capacity', requireAuth, async (_req: Request, res: Response): Promise<void> => {
  try {
    // Fetch all facilities with their capacity and specialist data
    const facilities = await prisma.facility.findMany({
      where: {
        type: { in: ['DISTRICT_HOSPITAL', 'PRIVATE_CLINIC'] },
      },
      include: {
        capacity: true,
        specialists: true,
      },
      orderBy: { name: 'asc' },
    });

    const capacityData: ReadinessResponse = {
      facilities: facilities.map((fac) => ({
        facilityId: fac.id,
        facilityName: fac.name,
        facilityCode: fac.code,
        facilityType: fac.type,
        district: fac.district,
        icu: {
          total: fac.capacity?.icuTotal || 0,
          available: fac.capacity?.icuAvailable || 0,
          occupied: (fac.capacity?.icuTotal || 0) - (fac.capacity?.icuAvailable || 0),
          ventilators: {
            total: fac.capacity?.ventilatorTotal || 0,
            available: fac.capacity?.ventilatorAvailable || 0,
          },
        },
        oxygen: {
          total: fac.capacity?.oxygenTotal || 0,
          available: fac.capacity?.oxygenAvailable || 0,
          occupied: (fac.capacity?.oxygenTotal || 0) - (fac.capacity?.oxygenAvailable || 0),
        },
        general: {
          total: fac.capacity?.generalTotal || 0,
          available: fac.capacity?.generalAvailable || 0,
          occupied: (fac.capacity?.generalTotal || 0) - (fac.capacity?.generalAvailable || 0),
        },
        lastUpdatedAt: fac.capacity?.lastUpdatedAt?.toISOString() || new Date().toISOString(),
        lastUpdatedBy: fac.capacity?.lastUpdatedBy,
        specialists: (fac.specialists || []).map((s) => ({
          id: s.id,
          facilityId: s.facilityId,
          specialty: s.specialty,
          specialistName: s.specialistName,
          isOnDuty: s.isOnDuty,
          contactPhone: s.contactPhone,
          shiftStart: s.shiftStart,
          shiftEnd: s.shiftEnd,
          notes: s.notes,
        })),
      })),
    };

    res.status(200).json({
      success: true,
      data: capacityData,
    });
  } catch (error: any) {
    console.error('[Facility Capacity GET Error]', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve facility capacity.', details: error.message },
    });
  }
});

/**
 * PUT /api/facilities/capacity
 * Update facility capacity and specialist roster (Admin/Coordinator only)
 * Body can contain multiple facility updates
 */
router.put('/capacity', requireAuth, requireRole('ADMIN', 'REFERRAL_COORDINATOR'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { facilities } = req.body;

    if (!Array.isArray(facilities) || facilities.length === 0) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'facilities array is required' },
      });
      return;
    }

    const results = await prisma.$transaction(async (tx) => {
      const updated: any[] = [];

      for (const fac of facilities) {
        const { facilityId, icuTotal, icuAvailable, oxygenTotal, oxygenAvailable, generalTotal, generalAvailable, ventilatorTotal, ventilatorAvailable, specialists } = fac;

        // Validate facility exists
        const facility = await tx.facility.findUnique({ where: { id: facilityId } });
        if (!facility) {
          throw new Error(`Facility ${facilityId} not found`);
        }

        // Upsert FacilityCapacity
        const capacity = await tx.facilityCapacity.upsert({
          where: { facilityId },
          create: {
            facilityId,
            icuTotal: icuTotal || 0,
            icuAvailable: icuAvailable || 0,
            oxygenTotal: oxygenTotal || 0,
            oxygenAvailable: oxygenAvailable || 0,
            generalTotal: generalTotal || 0,
            generalAvailable: generalAvailable || 0,
            ventilatorTotal: ventilatorTotal || 0,
            ventilatorAvailable: ventilatorAvailable || 0,
            lastUpdatedBy: req.user!.id,
          },
          update: {
            icuTotal: icuTotal ?? undefined,
            icuAvailable: icuAvailable ?? undefined,
            oxygenTotal: oxygenTotal ?? undefined,
            oxygenAvailable: oxygenAvailable ?? undefined,
            generalTotal: generalTotal ?? undefined,
            generalAvailable: generalAvailable ?? undefined,
            ventilatorTotal: ventilatorTotal ?? undefined,
            ventilatorAvailable: ventilatorAvailable ?? undefined,
            lastUpdatedBy: req.user!.id,
          },
        });

        // Update Specialist Roster if provided
        let updatedSpecialists: any[] = [];
        if (Array.isArray(specialists)) {
          for (const spec of specialists) {
            if (spec.id) {
              // Update existing
              const updated = await tx.specialistRoster.update({
                where: { id: spec.id },
                data: {
                  isOnDuty: spec.isOnDuty,
                  specialistName: spec.specialistName,
                  contactPhone: spec.contactPhone,
                  shiftStart: spec.shiftStart,
                  shiftEnd: spec.shiftEnd,
                  notes: spec.notes,
                },
              });
              updatedSpecialists.push(updated);
            } else {
              // Create new
              const created = await tx.specialistRoster.create({
                data: {
                  facilityId,
                  specialty: spec.specialty,
                  specialistName: spec.specialistName,
                  isOnDuty: spec.isOnDuty ?? false,
                  contactPhone: spec.contactPhone,
                  shiftStart: spec.shiftStart,
                  shiftEnd: spec.shiftEnd,
                  notes: spec.notes,
                },
              });
              updatedSpecialists.push(created);
            }
          }
        }

        // Log AuditEvent
        await tx.auditEvent.create({
          data: {
            eventId: `EVT-CAP-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            actorId: req.user!.id,
            actorRole: req.user!.role,
            facilityId,
            eventType: 'FACILITY_CAPACITY_UPDATED',
            entityType: 'FACILITY_CAPACITY',
            entityId: capacity.id,
            metadata: {
              icuAvailable: capacity.icuAvailable,
              oxygenAvailable: capacity.oxygenAvailable,
              generalAvailable: capacity.generalAvailable,
              specialistCount: updatedSpecialists.filter(s => s.isOnDuty).length,
            },
          },
        });

        updated.push({
          facilityId,
          capacity,
          specialists: updatedSpecialists,
        });
      }
      return updated;
    });

    res.status(200).json({
      success: true,
      message: 'Facility capacity and specialist roster updated successfully.',
      data: results,
    });
  } catch (error: any) {
    console.error('[Facility Capacity PUT Error]', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update facility capacity.', details: error.message },
    });
  }
});

/**
 * GET /api/facilities/capacity/:facilityId
 * Get capacity for a single facility
 */
router.get('/capacity/:facilityId', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { facilityId } = req.params;

    const facility = await prisma.facility.findUnique({
      where: { id: facilityId },
      include: {
        capacity: true,
        specialists: true,
      },
    });

    if (!facility) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Facility not found.' },
      });
      return;
    }

    const data = {
      facilityId: facility.id,
      facilityName: facility.name,
      facilityCode: facility.code,
      facilityType: facility.type,
      district: facility.district,
      icu: {
        total: facility.capacity?.icuTotal || 0,
        available: facility.capacity?.icuAvailable || 0,
        occupied: (facility.capacity?.icuTotal || 0) - (facility.capacity?.icuAvailable || 0),
        ventilators: {
          total: facility.capacity?.ventilatorTotal || 0,
          available: facility.capacity?.ventilatorAvailable || 0,
        },
      },
      oxygen: {
        total: facility.capacity?.oxygenTotal || 0,
        available: facility.capacity?.oxygenAvailable || 0,
        occupied: (facility.capacity?.oxygenTotal || 0) - (facility.capacity?.oxygenAvailable || 0),
      },
      general: {
        total: facility.capacity?.generalTotal || 0,
        available: facility.capacity?.generalAvailable || 0,
        occupied: (facility.capacity?.generalTotal || 0) - (facility.capacity?.generalAvailable || 0),
      },
      lastUpdatedAt: facility.capacity?.lastUpdatedAt?.toISOString() || new Date().toISOString(),
      specialists: (facility.specialists || []).map((s) => ({
        id: s.id,
        facilityId: s.facilityId,
        specialty: s.specialty,
        specialistName: s.specialistName,
        isOnDuty: s.isOnDuty,
        contactPhone: s.contactPhone,
        shiftStart: s.shiftStart,
        shiftEnd: s.shiftEnd,
        notes: s.notes,
      })),
    };

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error('[Single Facility Capacity GET Error]', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve facility capacity.' },
    });
  }
});

export default router;