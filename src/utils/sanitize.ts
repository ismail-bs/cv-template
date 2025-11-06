/**
 * Sanitize input to prevent XSS attacks in templates
 */
export function sanitizeString(value: string): string {
  if (typeof value !== 'string') {
    return '';
  }

  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Check if a value should be considered empty
 * Empty values: null, undefined, empty string, '@', 'none' (case-insensitive)
 */
export function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) {
    return true;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '' || trimmed === '@' || trimmed.toLowerCase() === 'none') {
      return true;
    }
    // Check for placeholder patterns like @field_name
    if (/^@[a-zA-Z_]+$/.test(trimmed)) {
      return true;
    }
  }

  return false;
}

/**
 * Normalize whitespace in a string
 */
export function normalizeWhitespace(value: string): string {
  if (typeof value !== 'string') {
    return '';
  }

  return value
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Format phone number with country code if missing
 * Assumes South African numbers (+27) if no country code present
 */
export function formatPhoneNumber(phone: string | undefined): string | undefined {
  if (!phone) {
    return undefined;
  }

  const trimmed = phone.trim();
  
  // Already has country code (starts with +)
  if (trimmed.startsWith('+')) {
    return trimmed;
  }

  // Remove leading 0 if present and add +27
  if (trimmed.startsWith('0')) {
    return `+27${trimmed.substring(1)}`;
  }

  // If no + or 0, assume it needs +27
  return `+27${trimmed}`;
}

/**
 * Process a field: trim, normalize, and check if empty
 * Returns the processed value or undefined if empty
 */
export function processField(value: unknown): string | undefined {
  if (isEmpty(value)) {
    return undefined;
  }

  if (typeof value === 'string') {
    const processed = value.trim();
    return processed === '' ? undefined : processed;
  }

  return undefined;
}

