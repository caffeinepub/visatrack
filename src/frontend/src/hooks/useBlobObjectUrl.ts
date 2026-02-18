import { useEffect, useState } from 'react';

/**
 * Custom hook that creates and manages a Blob/Object URL from binary data.
 * Automatically cleans up the URL when the component unmounts or when inputs change.
 * Returns { url, error } to distinguish between "no data" and "failed to create URL".
 */
export function useBlobObjectUrl(
  bytes: Uint8Array | number[] | undefined,
  contentType: string | undefined
): { url: string | null; error: string | null } {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Guard: only create URL if we have valid, non-empty data
    if (!bytes || !contentType || (bytes instanceof Uint8Array && bytes.length === 0) || (Array.isArray(bytes) && bytes.length === 0)) {
      setObjectUrl(null);
      setError(null);
      return;
    }

    // Create new URL inside the effect
    let createdUrl: string | null = null;
    try {
      const blob = new Blob([new Uint8Array(bytes)], { type: contentType });
      createdUrl = URL.createObjectURL(blob);
      setObjectUrl(createdUrl);
      setError(null);
    } catch (err) {
      console.error('Error creating Blob URL:', err);
      setObjectUrl(null);
      setError(err instanceof Error ? err.message : 'Failed to create PDF preview');
    }

    // Cleanup function revokes the exact URL created by THIS effect
    return () => {
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [bytes, contentType]);

  return { url: objectUrl, error };
}
