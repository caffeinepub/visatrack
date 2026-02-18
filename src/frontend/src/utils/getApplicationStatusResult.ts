import type { ApplicationStatus, PDFData } from '../backend';
import { unwrapOptional, normalizeBytes, normalizeString } from './candidOption';

/**
 * Normalizes the raw backend response from getApplicationStatus into ApplicationStatus | null.
 * Handles various Candid binding shapes and ensures nested attachment fields are properly unwrapped.
 * Ensures attachment has valid bytes, contentType defaults to application/pdf, and filename ends with .pdf.
 */
export function normalizeApplicationStatusResult(
  rawResponse: unknown
): ApplicationStatus | null {
  // First unwrap the top-level optional
  const unwrapped = unwrapOptional<any>(rawResponse);
  
  if (!unwrapped) {
    return null;
  }

  // Ensure it looks like an ApplicationStatus
  if (typeof unwrapped !== 'object' || !('applicationId' in unwrapped) || !('applicantEmail' in unwrapped)) {
    console.warn('Unexpected response shape from getApplicationStatus:', rawResponse);
    return null;
  }

  // Normalize the attachment field if present
  let normalizedAttachment: PDFData | undefined = undefined;
  
  if (unwrapped.attachment) {
    const rawAttachment = unwrapOptional<any>(unwrapped.attachment);
    
    if (rawAttachment) {
      // Unwrap nested optional fields within the attachment
      let filename = normalizeString(unwrapOptional(rawAttachment.filename)) || 'attachment.pdf';
      const contentType = normalizeString(unwrapOptional(rawAttachment.contentType)) || 'application/pdf';
      const bytes = normalizeBytes(unwrapOptional(rawAttachment.bytes));
      
      // Ensure filename ends with .pdf
      if (!filename.toLowerCase().endsWith('.pdf')) {
        filename = `${filename}.pdf`;
      }
      
      // Only include attachment if we have valid bytes
      if (bytes && bytes.length > 0) {
        normalizedAttachment = {
          filename,
          contentType,
          bytes,
        };
      }
    }
  }

  // Build the normalized ApplicationStatus
  const normalized: ApplicationStatus = {
    applicationId: unwrapped.applicationId,
    applicantEmail: unwrapped.applicantEmail,
    applicantName: unwrapped.applicantName || '',
    visaType: unwrapped.visaType || '',
    status: unwrapped.status || '',
    lastUpdated: unwrapped.lastUpdated,
    comments: unwrapOptional(unwrapped.comments) || undefined,
    attachment: normalizedAttachment,
  };

  return normalized;
}
