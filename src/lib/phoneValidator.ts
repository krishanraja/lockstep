import {
  parsePhoneNumberFromString,
  isValidPhoneNumber as libIsValid,
  type CountryCode,
} from 'libphonenumber-js';

const DEFAULT_COUNTRY: CountryCode = 'AU';

export interface PhoneValidationResult {
  valid: boolean;
  e164: string | null;
  display: string | null;
  error?: string;
}

export function validatePhone(
  input: string,
  defaultCountry: CountryCode = DEFAULT_COUNTRY,
): PhoneValidationResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return { valid: false, e164: null, display: null, error: 'Phone number is required' };
  }

  try {
    const phone = parsePhoneNumberFromString(trimmed, defaultCountry);
    if (!phone || !phone.isValid()) {
      return { valid: false, e164: null, display: null, error: 'Invalid phone number' };
    }

    return {
      valid: true,
      e164: phone.format('E.164'),
      display: phone.formatInternational(),
    };
  } catch {
    return { valid: false, e164: null, display: null, error: 'Could not parse phone number' };
  }
}

export function normalizeToE164(
  input: string,
  defaultCountry: CountryCode = DEFAULT_COUNTRY,
): string | null {
  const result = validatePhone(input, defaultCountry);
  return result.e164;
}

export function formatPhoneDisplay(
  e164: string,
): string {
  try {
    const phone = parsePhoneNumberFromString(e164);
    if (phone) return phone.formatInternational();
  } catch {
    // fall through
  }
  return e164;
}

export function isValidPhone(
  input: string,
  defaultCountry: CountryCode = DEFAULT_COUNTRY,
): boolean {
  const trimmed = input.trim();
  if (!trimmed) return false;
  try {
    return libIsValid(trimmed, defaultCountry);
  } catch {
    return false;
  }
}
