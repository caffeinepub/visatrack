/**
 * Utility that computes a deterministic FNV-1a hash signature from byte arrays
 * with comprehensive diagnostic logging
 */

export function computeBytesSignature(bytes: Uint8Array | null | undefined): string {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [bytesSignature] computeBytesSignature called`);

  // Validate input
  if (!bytes) {
    console.warn(`[${timestamp}] [bytesSignature] Input is null or undefined`);
    return 'null';
  }

  if (bytes.length === 0) {
    console.warn(`[${timestamp}] [bytesSignature] Input is empty array`);
    return 'empty';
  }

  if (!(bytes instanceof Uint8Array)) {
    console.error(`[${timestamp}] [bytesSignature] Invalid input type: expected Uint8Array, got ${typeof bytes}`);
    return 'invalid-type';
  }

  console.log(`[${timestamp}] [bytesSignature] Computing signature for ${bytes.length} bytes`);

  // FNV-1a hash parameters
  const FNV_PRIME = 0x01000193;
  const FNV_OFFSET = 0x811c9dc5;

  let hash = FNV_OFFSET;

  // Hash the bytes
  for (let i = 0; i < bytes.length; i++) {
    hash ^= bytes[i];
    hash = Math.imul(hash, FNV_PRIME);
  }

  // Convert to unsigned 32-bit integer and then to hex string
  const signature = (hash >>> 0).toString(16).padStart(8, '0');
  
  console.log(`[${timestamp}] [bytesSignature] Signature computed: ${signature}`);
  console.log(`[${timestamp}] [bytesSignature] First 5 bytes: [${Array.from(bytes.slice(0, 5)).join(', ')}]`);
  console.log(`[${timestamp}] [bytesSignature] Last 5 bytes: [${Array.from(bytes.slice(-5)).join(', ')}]`);

  return signature;
}
