import { useEffect, useState } from 'react';
import { computeBytesSignature } from '../utils/bytesSignature';
import { isPdfValid } from '../utils/pdfAttachment';

/**
 * Custom React hook that creates and manages Blob/Object URLs from binary data
 * with extensive diagnostic logging at every step
 */
export function useBlobObjectUrl(bytes: Uint8Array | null | undefined, mimeType: string = 'application/pdf'): string | null {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);

  useEffect(() => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [useBlobObjectUrl] Effect triggered`);
    console.log(`[${timestamp}] [useBlobObjectUrl] Input bytes:`, bytes ? `${bytes.length} bytes` : 'null/undefined');
    console.log(`[${timestamp}] [useBlobObjectUrl] MIME type: ${mimeType}`);

    // Validate input
    if (!bytes || bytes.length === 0) {
      console.warn(`[${timestamp}] [useBlobObjectUrl] Invalid input: bytes is null, undefined, or empty`);
      setObjectUrl(null);
      return;
    }

    // Check if bytes is a valid Uint8Array
    if (!(bytes instanceof Uint8Array)) {
      console.error(`[${timestamp}] [useBlobObjectUrl] Invalid input type: expected Uint8Array, got ${typeof bytes}`);
      setObjectUrl(null);
      return;
    }

    console.log(`[${timestamp}] [useBlobObjectUrl] Bytes validation passed`);
    console.log(`[${timestamp}] [useBlobObjectUrl] First 10 bytes: [${Array.from(bytes.slice(0, 10)).join(', ')}]`);
    console.log(`[${timestamp}] [useBlobObjectUrl] Last 10 bytes: [${Array.from(bytes.slice(-10)).join(', ')}]`);

    // Compute signature to detect content changes
    const newSignature = computeBytesSignature(bytes);
    console.log(`[${timestamp}] [useBlobObjectUrl] Computed signature: ${newSignature}`);
    console.log(`[${timestamp}] [useBlobObjectUrl] Previous signature: ${signature}`);

    // Only recreate blob if content changed
    if (newSignature === signature) {
      console.log(`[${timestamp}] [useBlobObjectUrl] Signature unchanged, skipping blob recreation`);
      return;
    }

    console.log(`[${timestamp}] [useBlobObjectUrl] Signature changed, creating new blob`);

    // Validate PDF structure if MIME type is PDF
    if (mimeType === 'application/pdf') {
      const isValid = isPdfValid(bytes);
      if (!isValid) {
        console.error(`[${timestamp}] [useBlobObjectUrl] PDF validation failed`);
        setObjectUrl(null);
        setSignature(newSignature);
        return;
      }
      console.log(`[${timestamp}] [useBlobObjectUrl] PDF validation passed`);
    }

    // Revoke old URL if it exists
    if (objectUrl) {
      console.log(`[${timestamp}] [useBlobObjectUrl] Revoking old object URL: ${objectUrl}`);
      URL.revokeObjectURL(objectUrl);
    }

    try {
      // Create blob with proper MIME type
      const blob = new Blob([bytes as BlobPart], { type: mimeType });
      console.log(`[${timestamp}] [useBlobObjectUrl] Blob created successfully`);
      console.log(`[${timestamp}] [useBlobObjectUrl] Blob size: ${blob.size} bytes`);
      console.log(`[${timestamp}] [useBlobObjectUrl] Blob type: ${blob.type}`);

      // Create object URL
      const url = URL.createObjectURL(blob);
      console.log(`[${timestamp}] [useBlobObjectUrl] Object URL created: ${url}`);

      setObjectUrl(url);
      setSignature(newSignature);
      console.log(`[${timestamp}] [useBlobObjectUrl] State updated with new URL and signature`);
    } catch (error) {
      console.error(`[${timestamp}] [useBlobObjectUrl] Error creating blob/URL:`, error);
      setObjectUrl(null);
      setSignature(newSignature);
    }

    // Cleanup function
    return () => {
      if (objectUrl) {
        const cleanupTimestamp = new Date().toISOString();
        console.log(`[${cleanupTimestamp}] [useBlobObjectUrl] Cleanup: revoking object URL: ${objectUrl}`);
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [bytes, mimeType]); // Removed signature and objectUrl from dependencies to prevent loops

  return objectUrl;
}
