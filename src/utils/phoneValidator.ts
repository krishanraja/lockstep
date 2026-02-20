import { parsePhoneNumber, isValidPhoneNumber, CountryCode } from 'libphonenumber-js';

export interface PhoneValidationResult {
  isValid: boolean;
  normalized?: string; // E.164 format: +1234567890
  formatted?: string; // Display format: +1 (234) 567-890
  error?: string;
}

/**
 * Validates and normalizes a phone number to E.164 format for Twilio SMS.
 * Defaults to US country code if no country code provided.
 */
export function validateAndNormalizePhone(
  phoneInput: string,
  defaultCountry: CountryCode = 'US'
): PhoneValidationResult {
  if (!phoneInput || !phoneInput.trim()) {
    return {
      isValid: false,
      error: 'Phone number is required',
    };
  }

  const trimmed = phoneInput.trim();

  try {
    // Check if valid phone number
    if (!isValidPhoneNumber(trimmed, defaultCountry)) {
      return {
        isValid: false,
        error: 'Invalid phone number format',
      };
    }

    // Parse and normalize
    const phoneNumber = parsePhoneNumber(trimmed, defaultCountry);
    
    if (!phoneNumber) {
      return {
        isValid: false,
        error: 'Could not parse phone number',
      };
    }

    return {
      isValid: true,
      normalized: phoneNumber.format('E.164'), // +1234567890
      formatted: phoneNumber.formatInternational(), // +1 234 567 8900
    };
  } catch (error) {
    console.error('[phoneValidator] Parse error:', error);
    return {
      isValid: false,
      error: 'Invalid phone number',
    };
  }
}

/**
 * Quick validation check without normalization.
 * Useful for real-time input validation.
 */
export function isPhoneValid(phoneInput: string, defaultCountry: CountryCode = 'US'): boolean {
  if (!phoneInput || !phoneInput.trim()) {
    return false;
  }
  return isValidPhoneNumber(phoneInput.trim(), defaultCountry);
}

/**
 * Format a normalized E.164 phone number for display.
 */
export function formatPhoneForDisplay(e164Phone: string): string {
  try {
    const phoneNumber = parsePhoneNumber(e164Phone);
    return phoneNumber ? phoneNumber.formatInternational() : e164Phone;
  } catch {
    return e164Phone;
  }
}
