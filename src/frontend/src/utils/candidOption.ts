/**
 * Utility helpers to unwrap common Candid optional encodings.
 * Handles null/undefined, [], [value], and {__kind__: 'None'|'Some'} patterns.
 */

/**
 * Unwraps a Candid optional value to T | null.
 */
export function unwrapOptional<T>(value: unknown): T | null {
  // Handle null/undefined
  if (value === null || value === undefined) {
    return null;
  }

  // Handle array-based optional
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return null;
    }
    if (value.length === 1) {
      return value[0] as T;
    }
    console.warn('Unexpected array length in optional:', value);
    return null;
  }

  // Handle object-based optional with __kind__ discriminator
  if (typeof value === 'object' && value !== null) {
    const obj = value as any;
    
    if (obj.__kind__ === 'None') {
      return null;
    }
    
    if (obj.__kind__ === 'Some') {
      return obj.value as T;
    }
  }

  // Direct value (no wrapper)
  return value as T;
}

/**
 * Ensures bytes are returned as a concrete Uint8Array.
 */
export function normalizeBytes(bytes: unknown): Uint8Array | null {
  if (!bytes) {
    return null;
  }

  if (bytes instanceof Uint8Array) {
    return bytes.length > 0 ? bytes : null;
  }

  if (Array.isArray(bytes)) {
    return bytes.length > 0 ? new Uint8Array(bytes) : null;
  }

  return null;
}

/**
 * Ensures a string field is non-empty or returns null.
 */
export function normalizeString(value: unknown): string | null {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }
  return null;
}
