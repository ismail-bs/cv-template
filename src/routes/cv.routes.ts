import { Router } from 'express';
import { CVController } from '../controllers/cv.controller';
import { authenticateApiKey } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { asyncHandler } from '../middleware/error.middleware';
import { cvSchema } from '../validation/cv.schema';
import { CVProcessorService } from '../services/cv-processor.service';
import { PDFGeneratorService } from '../services/pdf-generator.service';

/**
 * Create CV routes
 */
export function createCVRoutes(
  cvProcessor: CVProcessorService,
  pdfGenerator: PDFGeneratorService
): Router {
  const router = Router();
  const cvController = new CVController(cvProcessor, pdfGenerator);

  /**
   * POST /cv/generate
   * Generate PDF and return as binary stream
   */
  router.post(
    '/generate',
    authenticateApiKey,
    validateRequest(cvSchema),
    asyncHandler(async (req, res) => {
      await cvController.generatePDF(req, res);
    })
  );

  /**
   * POST /cv/generate/base64
   * Generate PDF and return as base64 encoded string
   */
  router.post(
    '/generate/base64',
    authenticateApiKey,
    validateRequest(cvSchema),
    asyncHandler(async (req, res) => {
      await cvController.generatePDFBase64(req, res);
    })
  );

  return router;
}

