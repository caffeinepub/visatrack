import { useEffect, useState, useRef } from 'react';
import { computeBytesSignature } from '../utils/bytesSignature';

interface UseBlobObjectUrlResult {
  url: string | null;
  error: string | null;
  signature: string;
}

/**
 * Custom hook that creates and manages Blob/Object URLs from binary data.
 * Includes PDF validation and automatic cleanup with extended revocation delay.
 * Returns a signature derived from the bytes to enable reliable change detection.
 * 
 * The signature ensures that when PDF bytes remain unchanged (e.g., when only
 * updating approval status), the same content is displayed without regeneration.
 */
export function useBlobObjectUrl(
  bytes: Uint8Array | number[] | undefined,
  contentType: string | undefined
): UseBlobObjectUrlResult {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [signature, setSignature] = useState<string>('');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousUrlRef = useRef<string | null>(null);

  useEffect(() => {
    const timestamp = new Date().toISOString();
    console.log(`🔍 [useBlobObjectUrl] ${timestamp} Effect triggered:`, {
      hasBytesInput: !!bytes,
      bytesType: bytes ? (bytes instanceof Uint8Array ? 'Uint8Array' : Array.isArray(bytes) ? 'Array' : typeof bytes) : 'undefined',
      bytesLength: bytes?.length || 0,
      contentType,
      previousUrl: previousUrlRef.current ? 'exists' : 'null',
    });

    // Clear any pending cleanup
    if (timeoutRef.current) {
      console.log(`🔍 [useBlobObjectUrl] ${timestamp} Clearing pending cleanup timeout`);
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Revoke previous URL immediately when bytes change
    if (previousUrlRef.current) {
      console.log(`🔍 [useBlobObjectUrl] ${timestamp} Revoking previous URL immediately:`, previousUrlRef.current.substring(0, 50));
      URL.revokeObjectURL(previousUrlRef.current);
      previousUrlRef.current = null;
    }

    // Reset state
    setUrl(null);
    setError(null);

    // Validate input
    if (!bytes || bytes.length === 0) {
      console.log(`🔍 [useBlobObjectUrl] ${timestamp} No bytes provided or empty array`);
      setSignature('empty');
      return;
    }

    if (!contentType) {
      console.log(`🔍 [useBlobObjectUrl] ${timestamp} No content type provided`);
      setError('Content type is required');
      setSignature('no-content-type');
      return;
    }

    try {
      // Convert to Uint8Array if needed and ensure it has a proper ArrayBuffer
      const bytesArray = bytes instanceof Uint8Array 
        ? new Uint8Array(bytes) // Create new instance to ensure proper ArrayBuffer type
        : new Uint8Array(bytes);
      
      console.log(`🔍 [useBlobObjectUrl] ${timestamp} Converted to Uint8Array:`, {
        length: bytesArray.length,
        hasBuffer: !!bytesArray.buffer,
        bufferByteLength: bytesArray.buffer?.byteLength,
      });

      // Compute signature from full bytes for reliable change detection
      const newSignature = computeBytesSignature(bytesArray);
      setSignature(newSignature);

      console.log(`🔍 [useBlobObjectUrl] ${timestamp} Creating Blob URL:`, {
        signature: newSignature,
        size: bytesArray.length,
        contentType,
        firstTenBytes: Array.from(bytesArray.slice(0, 10)),
        lastTenBytes: Array.from(bytesArray.slice(-10)),
      });

      // PDF validation: check for PDF header
      if (contentType === 'application/pdf') {
        console.log(`🔍 [useBlobObjectUrl] ${timestamp} Starting PDF validation...`);
        
        const headerBytes = Array.from(bytesArray.slice(0, 5));
        const header = String.fromCharCode(...headerBytes);
        console.log(`🔍 [useBlobObjectUrl] ${timestamp} PDF Header check:`, {
          headerBytes,
          headerString: header,
          expectedHeader: '%PDF-',
          isValid: header.startsWith('%PDF-'),
        });

        if (!header.startsWith('%PDF-')) {
          const errorMsg = 'Invalid PDF: Missing PDF header';
          setError(errorMsg);
          console.warn(`❌ [useBlobObjectUrl] ${timestamp} ${errorMsg}`);
          return;
        }

        // Check for EOF marker (should be near the end)
        const lastKB = bytesArray.slice(Math.max(0, bytesArray.length - 1024));
        const lastKBStr = String.fromCharCode(...Array.from(lastKB));
        const hasEOF = lastKBStr.includes('%%EOF');
        
        console.log(`🔍 [useBlobObjectUrl] ${timestamp} PDF EOF marker check:`, {
          searchedLastBytes: lastKB.length,
          hasEOFMarker: hasEOF,
          lastKBPreview: lastKBStr.slice(-100),
        });

        if (!hasEOF) {
          const errorMsg = 'Invalid PDF: Missing EOF marker (file may be truncated or corrupted)';
          setError(errorMsg);
          console.warn(`❌ [useBlobObjectUrl] ${timestamp} ${errorMsg}`, {
            bytesLength: bytesArray.length,
            lastKBPreview: lastKBStr.slice(-100),
          });
          return;
        }

        console.log(`✅ [useBlobObjectUrl] ${timestamp} PDF validation passed`);
      }

      // Create Blob and Object URL - use array buffer to avoid type issues
      // This preserves the exact binary content without modification
      console.log(`🔍 [useBlobObjectUrl] ${timestamp} Creating Blob with ArrayBuffer...`);
      const blob = new Blob([bytesArray.buffer], { type: contentType });
      console.log(`🔍 [useBlobObjectUrl] ${timestamp} Blob created:`, {
        size: blob.size,
        type: blob.type,
      });

      const objectUrl = URL.createObjectURL(blob);
      setUrl(objectUrl);
      previousUrlRef.current = objectUrl;

      console.log(`✅ [useBlobObjectUrl] ${timestamp} Blob URL created successfully:`, {
        url: objectUrl.substring(0, 50) + '...',
        signature: newSignature,
        size: bytesArray.length,
        contentType,
        preservedExactBytes: true,
      });

      // Cleanup function with extended delay
      return () => {
        console.log(`🔍 [useBlobObjectUrl] ${timestamp} Cleanup function called for URL:`, objectUrl.substring(0, 50));
        timeoutRef.current = setTimeout(() => {
          URL.revokeObjectURL(objectUrl);
          console.log(`🔍 [useBlobObjectUrl] ${timestamp} Blob URL revoked (delayed):`, objectUrl.substring(0, 50));
        }, 2000); // 2 second delay to prevent premature revocation
      };
    } catch (err) {
      const timestamp = new Date().toISOString();
      const errorMessage = err instanceof Error ? err.message : 'Failed to create Blob URL';
      setError(errorMessage);
      setSignature('error');
      console.error(`❌ [useBlobObjectUrl] ${timestamp} Error creating Blob URL:`, {
        error: err,
        errorMessage,
        errorStack: err instanceof Error ? err.stack : undefined,
      });
    }
  }, [bytes, contentType]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const timestamp = new Date().toISOString();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        console.log(`🔍 [useBlobObjectUrl] ${timestamp} Cleared timeout on unmount`);
      }
      if (previousUrlRef.current) {
        URL.revokeObjectURL(previousUrlRef.current);
        console.log(`🔍 [useBlobObjectUrl] ${timestamp} Cleanup on unmount:`, previousUrlRef.current.substring(0, 50));
      }
    };
  }, []);

  return { url, error, signature };
}
