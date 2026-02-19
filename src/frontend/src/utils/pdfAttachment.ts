/**
 * Shared utilities for handling PDF attachments in the UI.
 * Provides safe, browser-compatible helpers for viewing and downloading PDFs from in-memory bytes.
 */

/**
 * Validates that the provided bytes represent a valid PDF file.
 * Checks for the PDF header (%PDF-) at the start and EOF marker near the end.
 * 
 * @param bytes - The bytes to validate
 * @returns An object with { isValid: boolean, error?: string }
 */
export function validatePDFBytes(bytes: Uint8Array | number[] | undefined): { isValid: boolean; error?: string } {
  const timestamp = new Date().toISOString();
  console.log(`🔍 [validatePDFBytes] ${timestamp} Starting validation:`, {
    hasBytesInput: !!bytes,
    bytesType: bytes ? (bytes instanceof Uint8Array ? 'Uint8Array' : Array.isArray(bytes) ? 'Array' : typeof bytes) : 'undefined',
    bytesLength: bytes?.length || 0,
  });

  if (!bytes || bytes.length === 0) {
    console.warn(`❌ [validatePDFBytes] ${timestamp} No PDF data available`);
    return { isValid: false, error: 'No PDF data available' };
  }

  const bytesArray = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  console.log(`🔍 [validatePDFBytes] ${timestamp} Converted to Uint8Array, length: ${bytesArray.length}`);

  // Check minimum size (a valid PDF should be at least a few hundred bytes)
  if (bytesArray.length < 100) {
    console.warn(`❌ [validatePDFBytes] ${timestamp} PDF file is too small: ${bytesArray.length} bytes`);
    return { isValid: false, error: 'PDF file is too small to be valid' };
  }

  // Check for PDF header: %PDF- (bytes: 37, 80, 68, 70, 45)
  const headerBytes = [bytesArray[0], bytesArray[1], bytesArray[2], bytesArray[3], bytesArray[4]];
  const hasPDFHeader = 
    bytesArray[0] === 37 &&  // %
    bytesArray[1] === 80 &&  // P
    bytesArray[2] === 68 &&  // D
    bytesArray[3] === 70 &&  // F
    bytesArray[4] === 45;    // -

  const headerString = String.fromCharCode(...headerBytes);
  console.log(`🔍 [validatePDFBytes] ${timestamp} PDF Header check:`, {
    headerBytes,
    headerString,
    expectedHeader: '%PDF-',
    hasPDFHeader,
  });

  if (!hasPDFHeader) {
    console.warn(`❌ [validatePDFBytes] ${timestamp} Invalid PDF file: missing PDF header`);
    return { 
      isValid: false, 
      error: 'Invalid PDF file: missing PDF header. The file may be corrupted or not a valid PDF.' 
    };
  }

  // Check for EOF marker (%%EOF) in the last 1024 bytes
  // EOF marker bytes: 37, 37, 69, 79, 70 (%%EOF)
  const searchStart = Math.max(0, bytesArray.length - 1024);
  let hasEOFMarker = false;
  let eofPosition = -1;
  
  console.log(`🔍 [validatePDFBytes] ${timestamp} Searching for EOF marker in last ${bytesArray.length - searchStart} bytes...`);
  
  for (let i = searchStart; i < bytesArray.length - 4; i++) {
    if (
      bytesArray[i] === 37 &&     // %
      bytesArray[i + 1] === 37 && // %
      bytesArray[i + 2] === 69 && // E
      bytesArray[i + 3] === 79 && // O
      bytesArray[i + 4] === 70    // F
    ) {
      hasEOFMarker = true;
      eofPosition = i;
      break;
    }
  }

  console.log(`🔍 [validatePDFBytes] ${timestamp} EOF marker check:`, {
    hasEOFMarker,
    eofPosition,
    searchedBytes: bytesArray.length - searchStart,
    lastTenBytes: Array.from(bytesArray.slice(-10)),
  });

  if (!hasEOFMarker) {
    const lastKB = bytesArray.slice(Math.max(0, bytesArray.length - 1024));
    const lastKBStr = String.fromCharCode(...Array.from(lastKB));
    console.warn(`❌ [validatePDFBytes] ${timestamp} Invalid PDF file: missing EOF marker`, {
      lastKBPreview: lastKBStr.slice(-100),
    });
    return { 
      isValid: false, 
      error: 'Invalid PDF file: missing EOF marker. The file may be incomplete or corrupted.' 
    };
  }

  console.log(`✅ [validatePDFBytes] ${timestamp} PDF validation passed`);
  return { isValid: true };
}

/**
 * Opens a PDF attachment in a new browser tab/window.
 * Creates a Blob URL from the provided bytes and opens it.
 * Validates PDF bytes before attempting to open.
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
 * @throws Error if PDF validation fails
 */
export function openPDFInNewTab(
  bytes: Uint8Array | number[],
  contentType: string = 'application/pdf',
  filename?: string
): void {
  const timestamp = new Date().toISOString();
  console.log(`🔍 [openPDFInNewTab] ${timestamp} Starting:`, {
    filename,
    bytesLength: bytes.length,
    contentType,
  });

  // Validate PDF bytes first
  const validation = validatePDFBytes(bytes);
  if (!validation.isValid) {
    console.error(`❌ [openPDFInNewTab] ${timestamp} Cannot open PDF: validation failed`, { filename, error: validation.error });
    throw new Error(validation.error || 'Invalid PDF file');
  }

  try {
    const blob = new Blob([new Uint8Array(bytes)], { type: contentType });
    const url = URL.createObjectURL(blob);

    console.log(`✅ [openPDFInNewTab] ${timestamp} Opening PDF in new tab:`, {
      filename,
      bytesLength: bytes.length,
      contentType,
      url: url.substring(0, 50) + '...',
    });

    window.open(url, '_blank');

    // Do NOT revoke the URL immediately - let the browser manage it.
    // The new tab needs the URL to remain valid while loading and displaying the PDF.
    // Memory will be released when the tab is closed or navigated away.
  } catch (error) {
    console.error(`❌ [openPDFInNewTab] ${timestamp} Error opening PDF:`, error, { filename });
    throw error;
  }
}

/**
 * Downloads a PDF attachment using the browser's download mechanism.
 * Creates a Blob URL and triggers a download with the specified filename.
 * Validates PDF bytes before attempting to download.
 * 
 * The URL is revoked after a sufficient delay to ensure the download completes
 * across all browsers (including slower connections and larger files).
 * 
 * @param bytes - The PDF file bytes (Uint8Array or number array)
 * @param filename - The filename to use for the download (will ensure .pdf extension)
 * @param contentType - The MIME type (defaults to 'application/pdf')
 * @throws Error if PDF validation fails
 */
export function downloadPDF(
  bytes: Uint8Array | number[],
  filename: string,
  contentType: string = 'application/pdf'
): void {
  const timestamp = new Date().toISOString();
  console.log(`🔍 [downloadPDF] ${timestamp} Starting:`, {
    filename,
    bytesLength: bytes.length,
    contentType,
  });

  // Validate PDF bytes first
  const validation = validatePDFBytes(bytes);
  if (!validation.isValid) {
    console.error(`❌ [downloadPDF] ${timestamp} Cannot download PDF: validation failed`, { filename, error: validation.error });
    throw new Error(validation.error || 'Invalid PDF file');
  }

  try {
    const blob = new Blob([new Uint8Array(bytes)], { type: contentType });
    const url = URL.createObjectURL(blob);

    // Ensure filename has .pdf extension
    let safeFilename = filename || 'attachment.pdf';
    if (!safeFilename.toLowerCase().endsWith('.pdf')) {
      safeFilename = `${safeFilename}.pdf`;
    }

    console.log(`✅ [downloadPDF] ${timestamp} Downloading PDF:`, {
      filename: safeFilename,
      bytesLength: bytes.length,
      contentType,
      url: url.substring(0, 50) + '...',
    });

    const a = document.createElement('a');
    a.href = url;
    a.download = safeFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Delay revocation significantly to ensure download completes across all browsers
    // 10 seconds should be sufficient even for slower connections
    setTimeout(() => {
      console.log(`🔍 [downloadPDF] ${timestamp} Revoking download URL after delay:`, url.substring(0, 50));
      URL.revokeObjectURL(url);
    }, 10000);
  } catch (error) {
    console.error(`❌ [downloadPDF] ${timestamp} Error downloading PDF:`, error, { filename });
    throw error;
  }
}

/**
 * Downloads raw attachment bytes without PDF validation.
 * Used exclusively for the "Download anyway" action when strict validation fails.
 * 
 * @param bytes - The file bytes (Uint8Array or number array)
 * @param filename - The filename to use for the download
 * @param contentType - The MIME type (defaults to 'application/pdf')
 */
export function downloadRawBytes(
  bytes: Uint8Array | number[],
  filename: string,
  contentType: string = 'application/pdf'
): void {
  const timestamp = new Date().toISOString();
  console.log(`🔍 [downloadRawBytes] ${timestamp} Starting (no validation):`, {
    filename,
    bytesLength: bytes.length,
    contentType,
  });

  if (!bytes || bytes.length === 0) {
    throw new Error('No data available to download');
  }

  try {
    const blob = new Blob([new Uint8Array(bytes)], { type: contentType });
    const url = URL.createObjectURL(blob);

    let safeFilename = filename || 'attachment.pdf';
    if (!safeFilename.toLowerCase().endsWith('.pdf')) {
      safeFilename = `${safeFilename}.pdf`;
    }

    console.log(`✅ [downloadRawBytes] ${timestamp} Downloading raw bytes:`, {
      filename: safeFilename,
      bytesLength: bytes.length,
      url: url.substring(0, 50) + '...',
    });

    const a = document.createElement('a');
    a.href = url;
    a.download = safeFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(() => {
      console.log(`🔍 [downloadRawBytes] ${timestamp} Revoking download URL after delay:`, url.substring(0, 50));
      URL.revokeObjectURL(url);
    }, 10000);
  } catch (error) {
    console.error(`❌ [downloadRawBytes] ${timestamp} Error downloading raw bytes:`, error, { filename });
    throw error;
  }
}
