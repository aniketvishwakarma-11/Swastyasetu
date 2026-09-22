import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';
import { prisma } from '../../db';
import { requireAuth } from '../../middleware/auth.middleware';
import { processClinicalDocumentOcr, CLINICAL_DEMO_PRESETS } from './ocr.service';
import { FieldReviewStatus } from '@prisma/client';

const router = Router();

// Ensure upload directory exists
const uploadsDir = path.resolve(__dirname, '../../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const sanitizedBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueSuffix = `${Date.now()}-${randomUUID().slice(0, 8)}`;
    cb(null, `${sanitizedBase}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|pdf|svg/i;
    const ext = path.extname(file.originalname).toLowerCase();
    const mime = file.mimetype;
    if (allowed.test(ext) || allowed.test(mime)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, WebP, SVG) or PDFs are supported.'));
    }
  },
});

/**
 * POST /api/documents/extract
 * Uploads a clinical document or prescription, runs OCR via Hugging Face Space (or fallback),
 * and creates ClinicalDocument + ClinicalField records in PostgreSQL.
 */
router.post(
  '/extract',
  requireAuth,
  upload.single('file'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { patientId, referralId, documentType = 'DISCHARGE_SUMMARY', presetKey } = req.body;

      if (!patientId) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'patientId is required' },
        });
        return;
      }

      // Verify patient exists (or find/create demo patient)
      let patient = await prisma.patient.findUnique({
        where: { id: patientId },
      });

      if (!patient) {
        patient =
          (await prisma.patient.findFirst({
            where: { name: { contains: 'Ramesh' } },
          })) || (await prisma.patient.findFirst());

        if (!patient) {
          patient = await prisma.patient.create({
            data: {
              name: 'Ramesh Yadav',
              age: 52,
              gender: 'Male',
              village: 'Khed',
              localId: 'ABHA-91-4829-1029-4401',
            },
          });
        }
      }

      let originalFileUrl: string;
      let fileBuffer: Buffer;
      let fileName: string;
      let mimeType: string;

      if (req.file) {
        fileName = req.file.filename;
        originalFileUrl = `/uploads/${req.file.filename}`;
        mimeType = req.file.mimetype;
        fileBuffer = fs.readFileSync(req.file.path);
      } else if (presetKey && CLINICAL_DEMO_PRESETS[presetKey]) {
        // Use demo sample file
        fileName = 'ramesh_stemi_discharge.svg';
        originalFileUrl = '/uploads/samples/ramesh_stemi_discharge.svg';
        mimeType = 'image/svg+xml';
        const samplePath = path.resolve(uploadsDir, 'samples', fileName);
        if (fs.existsSync(samplePath)) {
          fileBuffer = fs.readFileSync(samplePath);
        } else {
          fileBuffer = Buffer.from(CLINICAL_DEMO_PRESETS[presetKey].rawText);
        }
      } else {
        res.status(400).json({
          success: false,
          error: { code: 'FILE_REQUIRED', message: 'Please upload a document file or specify a valid demo presetKey.' },
        });
        return;
      }

      // 1. Process OCR through Hugging Face Space (or Resilient Clinical Fallback)
      const ocrResult = await processClinicalDocumentOcr(
        fileBuffer,
        fileName,
        mimeType,
        presetKey
      );

      // 2. Persist ClinicalDocument in PostgreSQL
      const document = await prisma.clinicalDocument.create({
        data: {
          patientId,
          referralId: referralId || null,
          documentType,
          originalFileUrl,
          ocrText: ocrResult.rawOcrText,
          processingStatus: 'PROCESSED',
          extractedFields: {
            create: ocrResult.fields.map((field) => ({
              fieldName: field.fieldName,
              rawValue: field.rawValue,
              normalizedValue: field.normalizedValue,
              confidence: field.confidence,
              reviewStatus: (field.confidence < 0.90 ? 'NEEDS_REVIEW' : 'AUTO_ACCEPTED') as FieldReviewStatus,
            })),
          },
        },
        include: {
          extractedFields: true,
        },
      });

      // 3. Log AuditEvent (Hard Rule 4: Auditability)
      await prisma.auditEvent.create({
        data: {
          eventId: `EVT-${randomUUID()}`,
          actorId: req.user!.id,
          actorRole: req.user!.role,
          facilityId: req.user!.facilityId || 'UNKNOWN_FACILITY',
          eventType: 'DOCUMENT_OCR_EXTRACTED',
          entityType: 'CLINICAL_DOCUMENT',
          entityId: document.id,
          metadata: {
            engine: ocrResult.engine,
            fieldsCount: ocrResult.fields.length,
            needsReviewCount: ocrResult.fields.filter((f) => f.confidence < 0.9).length,
            documentType,
            patientName: patient.name,
          },
        },
      });

      res.status(201).json({
        success: true,
        message: 'Document OCR processed successfully.',
        data: {
          document,
          engine: ocrResult.engine,
          summary: {
            totalFields: document.extractedFields.length,
            autoAcceptedCount: document.extractedFields.filter((f) => f.reviewStatus === 'AUTO_ACCEPTED').length,
            needsReviewCount: document.extractedFields.filter((f) => f.reviewStatus === 'NEEDS_REVIEW').length,
          },
        },
      });
    } catch (error: any) {
      console.error('[Document OCR Extract Error]', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'OCR_EXTRACTION_FAILED',
          message: 'Failed to process document OCR.',
          details: error.message,
        },
      });
    }
  }
);

/**
 * POST /api/documents/:id/confirm-fields
 * Clinician confirms, edits, or marks fields as verified.
 * Updates ClinicalField records to VERIFIED and records an immutable AuditEvent.
 */
router.post(
  '/:id/confirm-fields',
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { fields, clinicianNotes } = req.body;

      if (!Array.isArray(fields) || fields.length === 0) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'fields array is required' },
        });
        return;
      }

      const existingDoc = await prisma.clinicalDocument.findUnique({
        where: { id },
        include: { patient: true, extractedFields: true },
      });

      if (!existingDoc) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Clinical document not found' },
        });
        return;
      }

      // Execute transactional updates
      const updatedDoc = await prisma.$transaction(
        async (tx) => {
          // 1. Update each verified field concurrently
          await Promise.all(
            fields.map((item) =>
              tx.clinicalField.update({
                where: { id: item.id },
                data: {
                  reviewedValue: item.reviewedValue || item.normalizedValue || item.rawValue,
                  reviewStatus: (item.reviewStatus || 'VERIFIED') as FieldReviewStatus,
                  reviewedById: req.user!.id,
                  reviewedAt: new Date(),
                },
              })
            )
          );

          // 2. Mark ClinicalDocument as VERIFIED
          const doc = await tx.clinicalDocument.update({
            where: { id },
            data: {
              processingStatus: 'VERIFIED',
            },
            include: {
              extractedFields: true,
              patient: true,
            },
          });

          // 3. If linked to an active referral, update referral notes if provided
          if (existingDoc.referralId && clinicianNotes) {
            await tx.referral.update({
              where: { id: existingDoc.referralId },
              data: {
                clinicalSummary: `${clinicianNotes} [Verified from ${existingDoc.documentType}]`,
              },
            });
          }

          // 4. Log Immutable AuditEvent (Hard Rule 4)
          await tx.auditEvent.create({
            data: {
              eventId: `EVT-${randomUUID()}`,
              actorId: req.user!.id,
              actorRole: req.user!.role,
              facilityId: req.user!.facilityId || 'UNKNOWN_FACILITY',
              eventType: 'DOCUMENT_OCR_VERIFIED',
              entityType: 'CLINICAL_DOCUMENT',
              entityId: doc.id,
              metadata: {
                verifiedCount: fields.length,
                clinicianNotes: clinicianNotes || 'Clinician confirmed structured fields',
                patientId: doc.patientId,
                patientName: doc.patient.name,
              },
            },
          });

          return doc;
        },
        {
          maxWait: 10000,
          timeout: 20000,
        }
      );

      res.status(200).json({
        success: true,
        message: 'Clinical fields verified and committed to patient record.',
        data: updatedDoc,
      });
    } catch (error: any) {
      console.error('[Document Confirm Fields Error]', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'VERIFICATION_FAILED',
          message: 'Failed to verify clinical fields.',
          details: error.message,
        },
      });
    }
  }
);

/**
 * GET /api/documents/patient/:patientId
 * Returns all clinical documents and verified fields for a patient.
 */
router.get(
  '/patient/:patientId',
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { patientId } = req.params;

      const documents = await prisma.clinicalDocument.findMany({
        where: { patientId },
        include: {
          extractedFields: {
            include: {
              reviewedBy: {
                select: { id: true, name: true, role: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.status(200).json({
        success: true,
        data: documents,
      });
    } catch (error: any) {
      console.error('[Document GET Patient Error]', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch patient documents' },
      });
    }
  }
);

/**
 * GET /api/documents/:id
 * Retrieve a single document with its extracted fields.
 */
router.get(
  '/:id',
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const document = await prisma.clinicalDocument.findUnique({
        where: { id },
        include: {
          extractedFields: {
            include: {
              reviewedBy: {
                select: { id: true, name: true, role: true },
              },
            },
          },
          patient: true,
          referral: true,
        },
      });

      if (!document) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Clinical document not found' },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: document,
      });
    } catch (error: any) {
      console.error('[Document GET ID Error]', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch document' },
      });
    }
  }
);

export default router;
