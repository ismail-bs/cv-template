import puppeteer, { Browser, Page } from 'puppeteer';
import handlebars from 'handlebars';
import fs from 'fs/promises';
import path from 'path';
import { config } from '../config';
import { ProcessedCVData } from '../models/cv.interface';
import logger from '../utils/logger';
import { AppError } from '../middleware/error.middleware';

/**
 * Font cache for base64 encoded fonts
 */
const fontCache: Map<string, string> = new Map();

/**
 * PDF Generation Service using Puppeteer and Handlebars
 */
export class PDFGeneratorService {
  private templateCache: Map<string, HandlebarsTemplateDelegate> = new Map();

  /**
   * Initialize Puppeteer browser instance
   * Note: We create a new browser for each PDF generation to avoid connection issues
   */
  async initialize(): Promise<void> {
    // No-op: We create a new browser instance for each PDF generation
    // to avoid connection issues and ensure clean state
    logger.info('PDF generator service initialized (browser will be created per request)');
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
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorName = error instanceof Error ? error.name : 'Unknown';
        
        // Log to console for immediate visibility
        console.error('PDF Generation Error:', {
          error: errorMessage,
          errorName,
          stack: error instanceof Error ? error.stack : undefined,
          attempt: attempts,
        });
        
        logger.warn(`PDF generation attempt ${attempts} failed`, {
          error: errorMessage,
          errorName,
          stack: error instanceof Error ? error.stack : undefined,
        });

        // If browser connection closed, wait a bit longer before retry
        if (errorName === 'ConnectionClosedError' || errorMessage.includes('Connection closed')) {
          logger.info('Browser connection closed, waiting before retry');
          await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds
        }

        if (attempts >= maxAttempts) {
          logger.error('PDF generation failed after all retry attempts', {
            attempts,
            error: errorMessage,
            errorName,
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
    // Create a new browser instance for each request to avoid connection issues
    let browser: Browser | null = null;
    let page: Page | null = null;

    try {
      // Create a fresh browser instance for each request
      logger.debug('Creating new browser instance for PDF generation');
      console.log('Launching Puppeteer browser...');
      
      try {
        logger.debug('Launching Puppeteer browser with args...');
        browser = await puppeteer.launch({
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-web-security',
            '--disable-software-rasterizer',
            '--disable-extensions',
          ],
          timeout: 60000, // 60 second timeout
          protocolTimeout: 60000,
        });
        
        logger.debug('Browser launched, setting up event listeners...');
        
        // Add event listeners to catch disconnection
        browser.on('disconnected', () => {
          logger.error('Browser disconnected unexpectedly');
        });
        
        const process = browser.process();
        if (process) {
          process.on('close', (code, signal) => {
            logger.error('Browser process closed', { code, signal });
          });
          
          process.on('error', (error) => {
            logger.error('Browser process error', { error: error.message });
          });
          
          process.on('exit', (code, signal) => {
            logger.error('Browser process exited', { code, signal });
          });
        }
        
        logger.debug('Browser launch complete');
        
      } catch (launchError) {
        logger.error('Failed to launch browser', {
          error: launchError instanceof Error ? launchError.message : 'Unknown',
          errorName: launchError instanceof Error ? launchError.name : 'Unknown',
          stack: launchError instanceof Error ? launchError.stack : undefined,
        });
        throw launchError;
      }

      logger.debug('Browser launched successfully, checking connection...');
      
      // Check if browser is connected
      if (!browser.isConnected()) {
        throw new Error('Browser is not connected after launch');
      }
      
      logger.debug('Browser is connected, waiting for initialization...');
      
      // Wait longer for browser to fully initialize and verify it's ready
      let retries = 0;
      const maxRetries = 5;
      while (retries < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 500));
        if (browser.isConnected()) {
          try {
            // Try to get browser version to verify it's ready
            const version = await browser.version();
            logger.debug('Browser ready', { version });
            break;
          } catch (e) {
            retries++;
            if (retries >= maxRetries) {
              throw new Error('Browser not ready after initialization');
            }
          }
        } else {
          throw new Error('Browser disconnected during initialization');
        }
      }

      logger.debug('Creating new page...');
      
      try {
        // Check connection again before creating page
        if (!browser.isConnected()) {
          const error = new Error('Browser connection lost before creating page');
          logger.error('Browser not connected before page creation', {
            browserProcess: browser.process() ? 'exists' : 'null',
            browserPID: browser.process()?.pid,
          });
          throw error;
        }
        
        logger.debug('Attempting to create new page...', {
          browserConnected: browser.isConnected(),
          browserProcess: browser.process() ? 'exists' : 'null',
        });
        
        // Use Promise.race to timeout if page creation takes too long
        page = await Promise.race([
          browser.newPage(),
          new Promise<Page>((_, reject) => 
            setTimeout(() => reject(new Error('Page creation timeout')), 10000)
          )
        ]);
        logger.debug('Page created successfully');
      } catch (pageError) {
        const errorDetails = {
          error: pageError instanceof Error ? pageError.message : 'Unknown',
          errorName: pageError instanceof Error ? pageError.name : 'Unknown',
          browserConnected: browser.isConnected(),
          browserProcess: browser.process() ? 'exists' : 'null',
          browserPID: browser.process()?.pid,
          stack: pageError instanceof Error ? pageError.stack : undefined,
        };
        
        // Log to console for immediate visibility
        console.error('=== PAGE CREATION ERROR ===');
        console.error(JSON.stringify(errorDetails, null, 2));
        console.error('=== END ERROR ===');
        
        logger.error('Error creating page', errorDetails);
        throw pageError;
      }

      // Enable images and set user agent
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      // Load and compile template
      const template = await this.loadTemplate(config.templateName);

      // Load fonts as base64
      const fonts = await this.getFontsBase64();

      // Add font base64 data to template data
      const templateData = {
        ...data,
        ...fonts,
      };

      // Render HTML with data
      let html: string;
      try {
        html = template(templateData);
        logger.debug('Template rendered successfully', { htmlLength: html.length });
      } catch (error) {
        logger.error('Template rendering failed', { error });
        throw new Error(`Template rendering failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Set content and generate PDF
      try {
        await page.setContent(html, {
          waitUntil: 'networkidle0',
          timeout: config.puppeteerTimeout,
        });
        logger.debug('Page content set successfully');
      } catch (error) {
        logger.error('Failed to set page content', { 
          error: error instanceof Error ? error.message : 'Unknown error',
          errorName: error instanceof Error ? error.name : 'Unknown'
        });
        throw error;
      }

      // Wait a bit more to ensure all images are loaded
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Generate PDF
      let pdf: Buffer;
      try {
        const pdfResult = await page.pdf({
          format: 'A4',
          printBackground: true,
          margin: {
            top: '0mm',
            right: '0mm',
            bottom: '0mm',
            left: '0mm',
          },
        });
        pdf = Buffer.from(pdfResult);
        logger.debug('PDF generated successfully', { pdfSize: pdf.length });
      } catch (error) {
        logger.error('Failed to generate PDF', { 
          error: error instanceof Error ? error.message : 'Unknown error',
          errorName: error instanceof Error ? error.name : 'Unknown'
        });
        throw error;
      }

      return Buffer.from(pdf);
    } catch (error) {
      logger.error('Error in generatePDFInternal', {
        error: error instanceof Error ? error.message : 'Unknown error',
        errorName: error instanceof Error ? error.name : 'Unknown',
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    } finally {
      if (page) {
        try {
          await page.close();
        } catch (e) {
          logger.warn('Error closing page', { error: e });
        }
      }
      if (browser) {
        try {
          await browser.close();
        } catch (e) {
          logger.warn('Error closing browser', { error: e });
        }
      }
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
   * Load font file and convert to base64
   */
  private async loadFontAsBase64(fontPath: string): Promise<string> {
    if (fontCache.has(fontPath)) {
      return fontCache.get(fontPath)!;
    }

    try {
      const fontBuffer = await fs.readFile(fontPath);
      const base64 = fontBuffer.toString('base64');
      fontCache.set(fontPath, base64);
      return base64;
    } catch (error) {
      logger.warn(`Failed to load font: ${fontPath}`, { error });
      return '';
    }
  }

  /**
   * Get base64 encoded fonts for template
   */
  private async getFontsBase64(): Promise<{
    openSansRegular: string;
    openSansBold: string;
    openSansSemibold: string;
    ralewayRegular: string;
    ralewayBold: string;
    ralewaySemibold: string;
  }> {
    const fontsDir = path.join(process.cwd(), 'fonts');
    
    return {
      openSansRegular: await this.loadFontAsBase64(path.join(fontsDir, 'Font_open-sans', 'OpenSans-Regular.ttf')),
      openSansBold: await this.loadFontAsBase64(path.join(fontsDir, 'Font_open-sans', 'OpenSans-Bold.ttf')),
      openSansSemibold: await this.loadFontAsBase64(path.join(fontsDir, 'Font_open-sans', 'OpenSans-Semibold.ttf')),
      ralewayRegular: await this.loadFontAsBase64(path.join(fontsDir, 'Font_raleway', 'Raleway-Regular.ttf')),
      ralewayBold: await this.loadFontAsBase64(path.join(fontsDir, 'Font_raleway', 'Raleway-Bold.ttf')),
      ralewaySemibold: await this.loadFontAsBase64(path.join(fontsDir, 'Font_raleway', 'Raleway-SemiBold.ttf')),
    };
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

    // Helper for OR operation
    if (!handlebars.helpers['or']) {
      handlebars.registerHelper('or', function (...args: unknown[]) {
        // Remove the options object (last argument)
        const values = args.slice(0, -1);
        return values.some(v => v !== null && v !== undefined && v !== '' && v !== false);
      });
    }

    // Helper to split string
    if (!handlebars.helpers['split']) {
      handlebars.registerHelper('split', function (str: string, delimiter: string) {
        if (!str) return [];
        return str.split(delimiter);
      });
    }

    // Helper to trim string
    if (!handlebars.helpers['trim']) {
      handlebars.registerHelper('trim', function (str: unknown) {
        if (!str || typeof str !== 'string') return '';
        return str.trim();
      });
    }

    // Helper to split languages (handles both comma and & separator)
    if (!handlebars.helpers['splitLanguages']) {
      handlebars.registerHelper('splitLanguages', function (str: unknown) {
        if (!str || typeof str !== 'string') return [];
        // Split by comma first, then by & if no comma found
        if (str.includes(',')) {
          return str.split(',');
        } else if (str.includes('&')) {
          return str.split('&');
        }
        // If no separator, return as single item
        return [str];
      });
    }

    // Helper to format multiline text
    if (!handlebars.helpers['nl2br']) {
      handlebars.registerHelper('nl2br', function (text: unknown) {
        if (!text || typeof text !== 'string') return '';
        const lines = text.split('\n');
        let result = '';
        lines.forEach((line, index) => {
          if (line.trim()) {
            if (index === 0) {
              result += `<div class="ref-name">${handlebars.escapeExpression(line)}</div>`;
            } else {
              result += `<div class="ref-detail">${handlebars.escapeExpression(line)}</div>`;
            }
          }
        });
        return new handlebars.SafeString(result);
      });
    }

    // Helper to bold first line
    if (!handlebars.helpers['boldFirstLine']) {
      handlebars.registerHelper('boldFirstLine', function (text: unknown) {
        if (!text || typeof text !== 'string') return '';
        const lines = text.split('\n');
        if (lines.length === 0) return '';
        
        let result = `<div class="timeline-title">${handlebars.escapeExpression(lines[0])}</div>`;

        for (let i = 1; i < lines.length; i++) {
          if (lines[i].trim()) {
            if (i === 1) {
              result += `<div class="timeline-subtitle">${handlebars.escapeExpression(lines[i])}</div>`;
            } else if (lines[i].match(/\d{4}/)) {
              result += `<div class="timeline-date">${handlebars.escapeExpression(lines[i])}</div>`;
            } else {
              result += `<div class="timeline-desc">${handlebars.escapeExpression(lines[i])}</div>`;
            }
          }
        }
        
        return new handlebars.SafeString(result);
      });
    }

    // Helper to compare values (for eq/equals)
    if (!handlebars.helpers['eq']) {
      handlebars.registerHelper('eq', function (a: unknown, b: unknown) {
        return a === b;
      });
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    // No browser instance to clean up - each request creates its own
    logger.info('PDF generator service cleanup complete');
  }
}

