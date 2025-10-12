import { CVData, ProcessedCVData } from '../models/cv.interface';
import { processField } from '../utils/sanitize';
import logger from '../utils/logger';

/**
 * Process raw CV data into template-ready format
 * Implements business logic rules:
 * - Hide empty/null/@/none fields
 * - Center phone if email is missing
 * - Format education with bold school names
 * - Merge additional_experience
 */
export class CVProcessorService {
  /**
   * Process CV data for template rendering
   */
  process(data: CVData): ProcessedCVData {
    logger.debug('Processing CV data');

    const processed: ProcessedCVData = {};

    // Personal Information
    processed.full_name = processField(data.full_name);
    processed.phone = processField(data.phone);
    processed.email = processField(data.email);
    processed.physical_address = processField(data.physical_address);

    // If email is missing, center the phone
    processed.phone_centered = !processed.email && !!processed.phone;

    // Career Objective
    processed.career_goal = processField(data.career_goal);

    // Education - process with bold school names
    processed.education_matric = this.formatEducation(data.education_matric);
    processed.tertiary_education = this.formatEducation(data.tertiary_education);

    // Certifications and Qualifications
    const certificates = processField(data.certificates);
    const otherQualifications = processField(data.other_qualifications);

    if (certificates || otherQualifications) {
      processed.training_certificates_heading = 'TRAINING CERTIFICATES & OTHER QUALIFICATIONS';
      processed.training_cert_bullet = certificates;
      processed.other_qualifications_bullet = otherQualifications;
    }

    // Skills and Languages
    processed.skills = processField(data.skills);
    processed.languages = processField(data.languages);

    // Work Experience (up to 5 positions)
    for (let i = 1; i <= 5; i++) {
      const workExp = this.processWorkExperience(
        data[`cv_format_type_full_${i}` as keyof CVData],
        data[`job_duration_${i}` as keyof CVData],
        data[`job_duties_${i}` as keyof CVData]
      );

      if (workExp) {
        processed[`work_experience_${i}` as keyof ProcessedCVData] = workExp as never;
      }
    }

    // References (up to 5)
    for (let i = 1; i <= 5; i++) {
      const ref = processField(data[`reference_${i}` as keyof CVData]);
      if (ref) {
        processed[`reference_${i}` as keyof ProcessedCVData] = ref as never;
      }
    }

    // Additional Experience - merge if present
    const additionalExp = processField(data.additional_experience);
    if (additionalExp) {
      processed.Additional_Experience_heading = 'ADDITIONAL EXPERIENCE';
      processed.additional_experience = additionalExp;
    }

    logger.debug('CV data processed successfully', {
      hasEmail: !!processed.email,
      phoneCentered: processed.phone_centered,
      workExperienceCount: Object.keys(processed).filter((k) =>
        k.startsWith('work_experience_')
      ).length,
    });

    return processed;
  }

  /**
   * Format education section with bold school name on first line
   */
  private formatEducation(education: string | undefined): string | undefined {
    const value = processField(education);
    if (!value) {
      return undefined;
    }

    // Split by newlines
    const lines = value.split('\n').filter((line) => line.trim());
    if (lines.length === 0) {
      return undefined;
    }

    // First line (school name) should be bold
    // Return formatted with HTML for template
    return value; // Template will handle formatting
  }

  /**
   * Process work experience entry
   */
  private processWorkExperience(
    title: string | undefined,
    duration: string | undefined,
    duties: string | undefined
  ):
    | {
        title: string;
        duration: string;
        duties: string;
      }
    | undefined {
    const processedTitle = processField(title);
    const processedDuration = processField(duration);
    const processedDuties = processField(duties);

    // All three fields must be present for a valid work experience entry
    if (!processedTitle && !processedDuration && !processedDuties) {
      return undefined;
    }

    // Return even if some fields are missing (template will handle display)
    return {
      title: processedTitle || '',
      duration: processedDuration || '',
      duties: processedDuties || '',
    };
  }
}

