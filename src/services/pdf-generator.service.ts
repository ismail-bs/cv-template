import puppeteer, { Browser, Page } from 'puppeteer';
import handlebars from 'handlebars';
import fs from 'fs/promises';
import path from 'path';
import { config } from '../config';
import { ProcessedCVData } from '../models/cv.interface';
import logger from '../utils/logger';
import { AppError } from '../middleware/error.middleware';

/**
 * PDF Generation Service using Puppeteer and Handlebars
 */
export class PDFGeneratorService {
  private browser: Browser | null = null;
  private templateCache: Map<string, HandlebarsTemplateDelegate> = new Map();

  /**
   * Initialize Puppeteer browser instance
   */
  async initialize(): Promise<void> {
    if (this.browser) {
      return;
    }

    try {
      logger.info('Initializing Puppeteer browser');
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
        ],
      });
      logger.info('Puppeteer browser initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Puppeteer browser', { error });
      throw new AppError(500, 'Failed to initialize PDF generator');
    }
  }

  /**
   * Generate PDF from CV data
   * Retries once on failure as per requirements
   */
  async generatePDF(data: ProcessedCVData): Promise<Buffer> {
    let attempts = 0;
    const maxAttempts = config.pdfRetryAttempts + 1;

    while (attempts < maxAttempts) {
      try {
        attempts++;
        logger.debug(`Generating PDF (attempt ${attempts}/${maxAttempts})`);

        const pdf = await this.generatePDFInternal(data);

        logger.info('PDF generated successfully', {
          size: pdf.length,
          attempts,
        });

        return pdf;
      } catch (error) {
        logger.warn(`PDF generation attempt ${attempts} failed`, {
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        if (attempts >= maxAttempts) {
          logger.error('PDF generation failed after all retry attempts', {
            attempts,
            error,
          });
          throw new AppError(
            500,
            'Failed to generate PDF. Please try again later.'
          );
        }

        // Wait a bit before retrying
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    throw new AppError(500, 'Failed to generate PDF');
  }

  /**
   * Internal PDF generation logic
   */
  private async generatePDFInternal(data: ProcessedCVData): Promise<Buffer> {
    if (!this.browser) {
      await this.initialize();
    }

    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    const page: Page = await this.browser.newPage();

    try {
      // Load and compile template
      const template = await this.loadTemplate(config.templateName);

      // Render HTML with data
      const html = template(data);

      // Set content and generate PDF
      await page.setContent(html, {
        waitUntil: 'networkidle0',
        timeout: config.puppeteerTimeout,
      });

      // Generate PDF
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm',
        },
      });

      return Buffer.from(pdf);
    } finally {
      await page.close();
    }
  }

  /**
   * Load and compile Handlebars template
   * Templates are cached after first load
   */
  private async loadTemplate(
    templateName: string
  ): Promise<HandlebarsTemplateDelegate> {
    // Check cache
    if (this.templateCache.has(templateName)) {
      return this.templateCache.get(templateName)!;
    }

    try {
      const templatePath = path.join(config.templateDir, templateName);
      logger.debug('Loading template', { templatePath });

      const templateContent = await fs.readFile(templatePath, 'utf-8');

      // Register Handlebars helpers
      this.registerHelpers();

      // Compile template
      const compiled = handlebars.compile(templateContent, {
        strict: false,
        noEscape: false,
      });

      // Cache compiled template
      this.templateCache.set(templateName, compiled);

      logger.debug('Template loaded and compiled', { templateName });
      return compiled;
    } catch (error) {
      logger.error('Failed to load template', {
        templateName,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new AppError(500, `Failed to load template: ${templateName}`);
    }
  }

  /**
   * Register Handlebars helpers for template logic
   */
  private registerHelpers(): void {
    // Helper to check if value exists
    if (!handlebars.helpers['ifExists']) {
      handlebars.registerHelper('ifExists', function (this: unknown, value: unknown, options: { fn: (context: unknown) => string; inverse: (context: unknown) => string }) {
        if (value && value !== '' && value !== '@' && typeof value === 'string' && value.toLowerCase() !== 'none') {
          return options.fn(this);
        }
        return options.inverse(this);
      });
    }

    // Helper to format multiline text
    if (!handlebars.helpers['nl2br']) {
      handlebars.registerHelper('nl2br', function (text: unknown) {
        if (!text || typeof text !== 'string') return '';
        const escaped = handlebars.escapeExpression(text);
        return new handlebars.SafeString(escaped.replace(/\n/g, '<br>'));
      });
    }

    // Helper to bold first line
    if (!handlebars.helpers['boldFirstLine']) {
      handlebars.registerHelper('boldFirstLine', function (text: unknown) {
        if (!text || typeof text !== 'string') return '';
        const lines = text.split('\n');
        if (lines.length === 0) return '';
        
        const firstLine = `<strong>${handlebars.escapeExpression(lines[0])}</strong>`;
        const remainingLines = lines.slice(1).map((line: string) => handlebars.escapeExpression(line)).join('<br>');
        
        return new handlebars.SafeString(
          remainingLines ? `${firstLine}<br>${remainingLines}` : firstLine
        );
      });
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    if (this.browser) {
      logger.info('Closing Puppeteer browser');
      await this.browser.close();
      this.browser = null;
    }
  }
}

