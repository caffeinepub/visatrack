import { useEffect, useState } from 'react';

/**
 * Custom hook that creates and manages a Blob/Object URL from binary data.
 * Automatically cleans up the URL when the component unmounts or when inputs change.
 */
export function useBlobObjectUrl(
  bytes: Uint8Array | number[] | undefined,
  contentType: string | undefined
): string | null {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    // Clean up previous URL if it exists
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
      setObjectUrl(null);
    }

    // Create new URL if we have valid data
    if (bytes && contentType) {
      try {
        const blob = new Blob([new Uint8Array(bytes)], { type: contentType });
        const url = URL.createObjectURL(blob);
        setObjectUrl(url);
      } catch (error) {
        console.error('Error creating Blob URL:', error);
        setObjectUrl(null);
      }
    }

    // Cleanup function
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [bytes, contentType]);

  return objectUrl;
}
