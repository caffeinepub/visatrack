import type { ApplicationStatus } from '../backend';

/**
 * Normalizes the raw backend response from getApplicationStatus into ApplicationStatus | null.
 * Handles various Candid binding shapes that may be returned:
 * - null or undefined → null
 * - { __kind__: 'None' } → null
 * - { __kind__: 'Some', value: T } → T
 * - [] → null
 * - [value] → value
 * - direct object → object
 */
export function normalizeApplicationStatusResult(
  rawResponse: unknown
): ApplicationStatus | null {
  // Handle null/undefined
  if (rawResponse === null || rawResponse === undefined) {
    return null;
  }

  // Handle array-based optional (Candid binding variant)
  if (Array.isArray(rawResponse)) {
    if (rawResponse.length === 0) {
      return null;
    }
    if (rawResponse.length === 1) {
      return rawResponse[0] as ApplicationStatus;
    }
    console.warn('Unexpected array length in getApplicationStatus response:', rawResponse);
    return null;
  }

  // Handle object-based optional with __kind__ discriminator
  if (typeof rawResponse === 'object' && rawResponse !== null) {
    const obj = rawResponse as any;
    
    if (obj.__kind__ === 'None') {
      return null;
    }
    
    if (obj.__kind__ === 'Some' && obj.value) {
      return obj.value as ApplicationStatus;
    }

    // Direct object (no wrapper) - assume it's the ApplicationStatus
    if ('applicationId' in obj && 'applicantEmail' in obj) {
      return obj as ApplicationStatus;
    }
  }

  console.warn('Unexpected response shape from getApplicationStatus:', rawResponse);
  return null;
}
