/**
 * Shared utilities for handling PDF attachments with comprehensive diagnostic logging
 */

export function isPdfValid(bytes: Uint8Array): boolean {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [pdfAttachment] isPdfValid called`);
  console.log(`[${timestamp}] [pdfAttachment] Bytes length: ${bytes.length}`);
  console.log(`[${timestamp}] [pdfAttachment] Bytes type: ${bytes.constructor.name}`);

  if (!bytes || bytes.length === 0) {
    console.warn(`[${timestamp}] [pdfAttachment] Validation failed: Empty or null bytes`);
    return false;
  }

  // Check for PDF header (%PDF-) at the start
  const header = String.fromCharCode(...bytes.slice(0, 5));
  console.log(`[${timestamp}] [pdfAttachment] PDF header: "${header}"`);
  
  if (!header.startsWith('%PDF-')) {
    console.warn(`[${timestamp}] [pdfAttachment] Validation failed: Invalid PDF header. Expected "%PDF-", got "${header}"`);
    return false;
  }

  // Check for EOF marker (%%EOF) near the end
  // Look in the last 1024 bytes for the EOF marker
  const searchStart = Math.max(0, bytes.length - 1024);
  const endSection = String.fromCharCode(...bytes.slice(searchStart));
  const hasEOF = endSection.includes('%%EOF');
  
  console.log(`[${timestamp}] [pdfAttachment] Searching for %%EOF in last ${bytes.length - searchStart} bytes`);
  console.log(`[${timestamp}] [pdfAttachment] EOF marker found: ${hasEOF}`);

  if (!hasEOF) {
    console.warn(`[${timestamp}] [pdfAttachment] Validation failed: Missing %%EOF marker`);
    return false;
  }

  console.log(`[${timestamp}] [pdfAttachment] PDF validation passed`);
  return true;
}

export function openPdfInNewTab(bytes: Uint8Array, filename: string): void {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [pdfAttachment] openPdfInNewTab called for "${filename}"`);
  console.log(`[${timestamp}] [pdfAttachment] Bytes length: ${bytes.length}`);

  try {
    const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
    console.log(`[${timestamp}] [pdfAttachment] Blob created, size: ${blob.size}`);
    
    const url = URL.createObjectURL(blob);
    console.log(`[${timestamp}] [pdfAttachment] Object URL created: ${url}`);
    
    const newWindow = window.open(url, '_blank');
    
    if (!newWindow) {
      console.error(`[${timestamp}] [pdfAttachment] Failed to open new window (popup blocked?)`);
      throw new Error('Failed to open PDF in new tab. Please check your popup blocker settings.');
    }
    
    console.log(`[${timestamp}] [pdfAttachment] PDF opened in new tab successfully`);
    
    // Clean up the URL after a delay
    setTimeout(() => {
      URL.revokeObjectURL(url);
      console.log(`[${timestamp}] [pdfAttachment] Object URL revoked`);
    }, 1000);
  } catch (error) {
    console.error(`[${timestamp}] [pdfAttachment] Error opening PDF:`, error);
    throw error;
  }
}

export function downloadPdf(bytes: Uint8Array, filename: string): void {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [pdfAttachment] downloadPdf called for "${filename}"`);
  console.log(`[${timestamp}] [pdfAttachment] Bytes length: ${bytes.length}`);

  try {
    const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
    console.log(`[${timestamp}] [pdfAttachment] Blob created, size: ${blob.size}`);
    
    const url = URL.createObjectURL(blob);
    console.log(`[${timestamp}] [pdfAttachment] Object URL created: ${url}`);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log(`[${timestamp}] [pdfAttachment] Download triggered successfully`);
    
    // Clean up the URL after a delay
    setTimeout(() => {
      URL.revokeObjectURL(url);
      console.log(`[${timestamp}] [pdfAttachment] Object URL revoked`);
    }, 1000);
  } catch (error) {
    console.error(`[${timestamp}] [pdfAttachment] Error downloading PDF:`, error);
    throw error;
  }
}
