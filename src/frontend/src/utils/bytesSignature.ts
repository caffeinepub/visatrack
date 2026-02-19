/**
 * Computes a deterministic signature (hash) from a byte array using FNV-1a algorithm.
 * This signature is used to detect when PDF bytes have changed, enabling reliable
 * change detection without comparing entire byte arrays.
 * 
 * The FNV-1a hash is fast, simple, and provides good distribution for our use case.
 * 
 * @param bytes - The byte array to hash
 * @returns A hexadecimal string representing the hash signature
 */
export function computeBytesSignature(bytes: Uint8Array | number[] | undefined): string {
  const timestamp = new Date().toISOString();
  
  if (!bytes || bytes.length === 0) {
    console.log(`🔍 [computeBytesSignature] ${timestamp} Empty or undefined bytes, returning 'empty'`);
    return 'empty';
  }

  console.log(`🔍 [computeBytesSignature] ${timestamp} Computing signature:`, {
    bytesLength: bytes.length,
    bytesType: bytes instanceof Uint8Array ? 'Uint8Array' : Array.isArray(bytes) ? 'Array' : typeof bytes,
  });

  try {
    // FNV-1a hash parameters (32-bit)
    const FNV_PRIME = 0x01000193;
    let hash = 0x811c9dc5; // FNV offset basis

    // Convert to Uint8Array if needed
    const bytesArray = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);

    // Hash all bytes
    for (let i = 0; i < bytesArray.length; i++) {
      hash ^= bytesArray[i];
      hash = Math.imul(hash, FNV_PRIME);
    }

    // Convert to unsigned 32-bit integer and then to hex
    const signature = (hash >>> 0).toString(16).padStart(8, '0');
    
    console.log(`✅ [computeBytesSignature] ${timestamp} Signature computed:`, {
      signature,
      bytesLength: bytesArray.length,
      firstTenBytes: Array.from(bytesArray.slice(0, 10)),
      lastTenBytes: Array.from(bytesArray.slice(-10)),
    });

    return signature;
  } catch (error) {
    console.error(`❌ [computeBytesSignature] ${timestamp} Error computing signature:`, error);
    return 'error';
  }
}
