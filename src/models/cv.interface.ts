/**
 * CV Data Interface
 * All fields are optional as per requirements
 */
export interface CVData {
  // Personal Information
  full_name?: string;
  designation?: string; // Job title/designation
  phone?: string;
  email?: string;
  physical_address?: string;
  photo_url?: string; // URL or base64 image data
  splash_image?: string; // URL for background splash image

  // Career Objective
  career_goal?: string;

  // Education
  education_matric?: string;
  tertiary_education?: string;

  // Certifications and Qualifications
  certificates?: string;
  other_qualifications?: string;

  // Skills and Languages
  skills?: string;
  languages?: string;

  // Work Experience (up to 5 positions)
  cv_format_type_full_1?: string;
  job_duration_1?: string;
  job_duties_1?: string;

  cv_format_type_full_2?: string;
  job_duration_2?: string;
  job_duties_2?: string;

  cv_format_type_full_3?: string;
  job_duration_3?: string;
  job_duties_3?: string;

  cv_format_type_full_4?: string;
  job_duration_4?: string;
  job_duties_4?: string;

  cv_format_type_full_5?: string;
  job_duration_5?: string;
  job_duties_5?: string;

  // References (up to 5)
  reference_1?: string;
  reference_2?: string;
  reference_3?: string;
  reference_4?: string;
  reference_5?: string;

  // Additional Experience
  additional_experience?: string;
}

/**
 * Processed CV Data for template rendering
 */
export interface ProcessedCVData {
  full_name?: string;
  designation?: string; // Job title/designation
  phone?: string;
  email?: string;
  physical_address?: string;
  phone_centered?: boolean; // True if email is missing
  photo_url?: string; // URL or base64 image data
  splash_image?: string; // URL for background splash image

  // Content mode for adaptive layout
  contentMode?: 'standard' | 'sparse';

  career_goal?: string;

  education_matric?: string;
  tertiary_education?: string;

  training_certificates_heading?: string;
  training_cert_bullet?: string;
  other_qualifications_bullet?: string;

  skills?: string;
  languages?: string;

  // Work Experience
  work_experience_1?: {
    title: string;
    duration: string;
    duties: string;
  };
  work_experience_2?: {
    title: string;
    duration: string;
    duties: string;
  };
  work_experience_3?: {
    title: string;
    duration: string;
    duties: string;
  };
  work_experience_4?: {
    title: string;
    duration: string;
    duties: string;
  };
  work_experience_5?: {
    title: string;
    duration: string;
    duties: string;
  };

  // References
  reference_1?: string;
  reference_2?: string;
  reference_3?: string;
  reference_4?: string;
  reference_5?: string;

  Additional_Experience_heading?: string;
  additional_experience?: string;
}

/**
 * API Response for base64 endpoint
 */
export interface Base64PDFResponse {
  pdfBase64: string;
}

/**
 * API Error Response
 */
export interface ErrorResponse {
  error: string;
}

