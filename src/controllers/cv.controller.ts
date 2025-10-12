import { Request, Response } from 'express';
import { CVData } from '../models/cv.interface';
import { CVProcessorService } from '../services/cv-processor.service';
import { PDFGeneratorService } from '../services/pdf-generator.service';
import logger from '../utils/logger';

/**
 * CV Controller
 * Handles CV to PDF generation requests
 */
export class CVController {
  private cvProcessor: CVProcessorService;
  private pdfGenerator: PDFGeneratorService;

  constructor(
    cvProcessor: CVProcessorService,
    pdfGenerator: PDFGeneratorService
  ) {
    this.cvProcessor = cvProcessor;
    this.pdfGenerator = pdfGenerator;
  }

  /**
   * Generate PDF and return as binary stream
   * POST /cv/generate
   */
  async generatePDF(req: Request, res: Response): Promise<void> {
    try {
      logger.info('Received request to generate PDF', {
        ip: req.ip,
        contentLength: req.headers['content-length'],
      });

      const cvData: CVData = req.body;

      // Process CV data
      const processedData = this.cvProcessor.process(cvData);

      // Generate PDF
      const pdfBuffer = await this.pdfGenerator.generatePDF(processedData);

      // Send PDF as binary stream
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Length', pdfBuffer.length);
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="cv.pdf"'
      );

      logger.info('PDF generated and sent successfully', {
        size: pdfBuffer.length,
      });

      res.send(pdfBuffer);
    } catch (error) {
      logger.error('Error generating PDF', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Generate PDF and return as base64 encoded string
   * POST /cv/generate/base64
   */
  async generatePDFBase64(req: Request, res: Response): Promise<void> {
    try {
      logger.info('Received request to generate PDF (base64)', {
        ip: req.ip,
        contentLength: req.headers['content-length'],
      });

      const cvData: CVData = req.body;

      // Process CV data
      const processedData = this.cvProcessor.process(cvData);

      // Generate PDF
      const pdfBuffer = await this.pdfGenerator.generatePDF(processedData);

      // Convert to base64
      const pdfBase64 = pdfBuffer.toString('base64');

      logger.info('PDF generated and converted to base64 successfully', {
        originalSize: pdfBuffer.length,
        base64Size: pdfBase64.length,
      });

      res.status(200).json({
        pdfBase64,
      });
    } catch (error) {
      logger.error('Error generating PDF (base64)', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}

