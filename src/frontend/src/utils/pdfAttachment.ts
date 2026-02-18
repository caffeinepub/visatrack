/**
 * Shared utilities for handling PDF attachments in the UI.
 * Provides safe, browser-compatible helpers for viewing and downloading PDFs from in-memory bytes.
 */

/**
 * Opens a PDF attachment in a new browser tab/window.
 * Creates a Blob URL from the provided bytes and opens it.
 * 
 * IMPORTANT: The Blob URL is NOT automatically revoked to ensure reliable viewing across all browsers.
 * This is safe because:
 * 1. The URL only exists in the new tab's context
 * 2. Closing the tab releases the memory
 * 3. Page navigation/refresh clears the URL
 * 4. The memory footprint is minimal (one PDF per view action)
 * 
 * @param bytes - The PDF file bytes (Uint8Array or number array)
 * @param contentType - The MIME type (defaults to 'application/pdf')
 * @param filename - Optional filename for debugging/logging
 */
export function openPDFInNewTab(
  bytes: Uint8Array | number[],
  contentType: string = 'application/pdf',
  filename?: string
): void {
  if (!bytes || bytes.length === 0) {
    console.error('[PDF] Cannot open PDF: no bytes available', { filename });
    return;
  }

  try {
    const blob = new Blob([new Uint8Array(bytes)], { type: contentType });
    const url = URL.createObjectURL(blob);

    console.log('[PDF] Opening PDF in new tab', {
      filename,
      bytesLength: bytes.length,
      contentType,
    });

    window.open(url, '_blank');

    // Do NOT revoke the URL immediately - let the browser manage it.
    // The new tab needs the URL to remain valid while loading and displaying the PDF.
    // Memory will be released when the tab is closed or navigated away.
  } catch (error) {
    console.error('[PDF] Error opening PDF:', error, { filename });
    throw error;
  }
}

/**
 * Downloads a PDF attachment using the browser's download mechanism.
 * Creates a Blob URL and triggers a download with the specified filename.
 * 
 * The URL is revoked after a sufficient delay to ensure the download completes
 * across all browsers (including slower connections and larger files).
 * 
 * @param bytes - The PDF file bytes (Uint8Array or number array)
 * @param filename - The filename to use for the download (will ensure .pdf extension)
 * @param contentType - The MIME type (defaults to 'application/pdf')
 */
export function downloadPDF(
  bytes: Uint8Array | number[],
  filename: string,
  contentType: string = 'application/pdf'
): void {
  if (!bytes || bytes.length === 0) {
    console.error('[PDF] Cannot download PDF: no bytes available', { filename });
    return;
  }

  try {
    const blob = new Blob([new Uint8Array(bytes)], { type: contentType });
    const url = URL.createObjectURL(blob);

    // Ensure filename has .pdf extension
    let safeFilename = filename || 'attachment.pdf';
    if (!safeFilename.toLowerCase().endsWith('.pdf')) {
      safeFilename = `${safeFilename}.pdf`;
    }

    console.log('[PDF] Downloading PDF', {
      filename: safeFilename,
      bytesLength: bytes.length,
      contentType,
    });

    const a = document.createElement('a');
    a.href = url;
    a.download = safeFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Delay revocation significantly to ensure download completes across all browsers
    // 10 seconds should be sufficient even for slower connections
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  } catch (error) {
    console.error('[PDF] Error downloading PDF:', error, { filename });
    throw error;
  }
}

/**
 * Creates a Blob URL for embedding a PDF in an <object> or <iframe> tag.
 * The caller is responsible for revoking the URL when done.
 * 
 * @param bytes - The PDF file bytes (Uint8Array or number array)
 * @param contentType - The MIME type (defaults to 'application/pdf')
 * @returns The Blob URL string, or null if bytes are empty
 */
export function createPDFBlobUrl(
  bytes: Uint8Array | number[] | undefined,
  contentType: string = 'application/pdf'
): string | null {
  if (!bytes || bytes.length === 0) {
    return null;
  }

  try {
    const blob = new Blob([new Uint8Array(bytes)], { type: contentType });
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('[PDF] Error creating blob URL:', error);
    return null;
  }
}
