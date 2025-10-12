import Joi from 'joi';

/**
 * E.164 phone format pattern (international format)
 * Examples: +27123456789, +1234567890
 */
const phonePattern = /^\+?[1-9]\d{1,14}$/;

/**
 * Basic email RFC pattern
 */
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Joi schema for CV data validation
 * All fields are optional as per requirements
 */
export const cvSchema = Joi.object({
  // Personal Information
  full_name: Joi.string().trim().max(200).optional(),
  phone: Joi.string()
    .trim()
    .pattern(phonePattern)
    .message('Phone must be in E.164 format (e.g., +27123456789)')
    .optional()
    .allow('', null),
  email: Joi.string()
    .trim()
    .pattern(emailPattern)
    .message('Invalid email format')
    .optional()
    .allow('', null),
  physical_address: Joi.string().trim().max(500).optional().allow('', null),

  // Career Objective
  career_goal: Joi.string().trim().max(2000).optional().allow('', null),

  // Education
  education_matric: Joi.string().trim().max(1000).optional().allow('', null),
  tertiary_education: Joi.string().trim().max(1000).optional().allow('', null),

  // Certifications and Qualifications
  certificates: Joi.string().trim().max(2000).optional().allow('', null),
  other_qualifications: Joi.string().trim().max(2000).optional().allow('', null),

  // Skills and Languages
  skills: Joi.string().trim().max(2000).optional().allow('', null),
  languages: Joi.string().trim().max(500).optional().allow('', null),

  // Work Experience Position 1
  cv_format_type_full_1: Joi.string().trim().max(500).optional().allow('', null),
  job_duration_1: Joi.string().trim().max(200).optional().allow('', null),
  job_duties_1: Joi.string().trim().max(5000).optional().allow('', null),

  // Work Experience Position 2
  cv_format_type_full_2: Joi.string().trim().max(500).optional().allow('', null),
  job_duration_2: Joi.string().trim().max(200).optional().allow('', null),
  job_duties_2: Joi.string().trim().max(5000).optional().allow('', null),

  // Work Experience Position 3
  cv_format_type_full_3: Joi.string().trim().max(500).optional().allow('', null),
  job_duration_3: Joi.string().trim().max(200).optional().allow('', null),
  job_duties_3: Joi.string().trim().max(5000).optional().allow('', null),

  // Work Experience Position 4
  cv_format_type_full_4: Joi.string().trim().max(500).optional().allow('', null),
  job_duration_4: Joi.string().trim().max(200).optional().allow('', null),
  job_duties_4: Joi.string().trim().max(5000).optional().allow('', null),

  // Work Experience Position 5
  cv_format_type_full_5: Joi.string().trim().max(500).optional().allow('', null),
  job_duration_5: Joi.string().trim().max(200).optional().allow('', null),
  job_duties_5: Joi.string().trim().max(5000).optional().allow('', null),

  // References
  reference_1: Joi.string().trim().max(1000).optional().allow('', null),
  reference_2: Joi.string().trim().max(1000).optional().allow('', null),
  reference_3: Joi.string().trim().max(1000).optional().allow('', null),
  reference_4: Joi.string().trim().max(1000).optional().allow('', null),
  reference_5: Joi.string().trim().max(1000).optional().allow('', null),

  // Additional Experience
  additional_experience: Joi.string().trim().max(5000).optional().allow('', null),
}).options({
  stripUnknown: true,
  abortEarly: false,
});

