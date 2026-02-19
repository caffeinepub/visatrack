/**
 * Utility helpers to unwrap common Candid optional encodings and normalize bytes/strings
 */

export function unwrapCandidOption<T>(value: T | null | undefined | [] | { __kind__: 'Some'; value: T } | { __kind__: 'None' }): T | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (Array.isArray(value) && value.length === 0) {
    return null;
  }
  if (typeof value === 'object' && value !== null && '__kind__' in value) {
    if (value.__kind__ === 'None') {
      return null;
    }
    if (value.__kind__ === 'Some' && 'value' in value) {
      return value.value as T;
    }
  }
  return value as T;
}

export function normalizeBytes(bytes: any): Uint8Array | null {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [candidOption] normalizeBytes called`);
  console.log(`[${timestamp}] [candidOption] Input type: ${bytes?.constructor?.name || typeof bytes}`);

  if (!bytes) {
    console.warn(`[${timestamp}] [candidOption] Input is null or undefined`);
    return null;
  }

  // Already a Uint8Array
  if (bytes instanceof Uint8Array) {
    console.log(`[${timestamp}] [candidOption] Input is already Uint8Array, length: ${bytes.length}`);
    return bytes;
  }

  // Handle array-like objects
  if (Array.isArray(bytes)) {
    console.log(`[${timestamp}] [candidOption] Input is Array, length: ${bytes.length}`);
    try {
      const result = new Uint8Array(bytes);
      console.log(`[${timestamp}] [candidOption] Converted Array to Uint8Array, length: ${result.length}`);
      return result;
    } catch (error) {
      console.error(`[${timestamp}] [candidOption] Error converting Array to Uint8Array:`, error);
      return null;
    }
  }

  // Handle objects with numeric keys (like { 0: 37, 1: 80, ... })
  if (typeof bytes === 'object' && bytes !== null) {
    const keys = Object.keys(bytes);
    console.log(`[${timestamp}] [candidOption] Input is object with ${keys.length} keys`);
    
    // Check if it looks like an array-like object with numeric keys
    const isArrayLike = keys.every(key => !isNaN(Number(key)));
    
    if (isArrayLike && keys.length > 0) {
      try {
        const arr = keys.map(key => bytes[key]);
        const result = new Uint8Array(arr);
        console.log(`[${timestamp}] [candidOption] Converted object to Uint8Array, length: ${result.length}`);
        return result;
      } catch (error) {
        console.error(`[${timestamp}] [candidOption] Error converting object to Uint8Array:`, error);
        return null;
      }
    }
  }

  console.warn(`[${timestamp}] [candidOption] Unable to normalize bytes, unsupported format`);
  return null;
}

export function normalizeString(value: any): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (Array.isArray(value) && value.length === 0) {
    return null;
  }
  if (typeof value === 'string') {
    return value;
  }
  return null;
}
