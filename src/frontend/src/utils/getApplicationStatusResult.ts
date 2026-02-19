import type { ApplicationStatus } from '../backend';

/**
 * Normalizes the raw backend response for getApplicationStatus into a consistent shape.
 * Handles optional fields, ensures bytes are Uint8Array, and provides sensible defaults.
 * 
 * @param rawResult - The raw result from backend.getApplicationStatus()
 * @returns Normalized ApplicationStatus or null
 */
export function getApplicationStatusResult(rawResult: ApplicationStatus | null): ApplicationStatus | null {
  const timestamp = new Date().toISOString();
  console.log(`🔍 [getApplicationStatusResult] ${timestamp} Normalizing result:`, {
    hasRawResult: !!rawResult,
    rawResultType: rawResult ? typeof rawResult : 'null',
  });

  if (!rawResult) {
    console.log(`🔍 [getApplicationStatusResult] ${timestamp} Raw result is null, returning null`);
    return null;
  }

  console.log(`🔍 [getApplicationStatusResult] ${timestamp} Raw result details:`, {
    applicationId: rawResult.applicationId,
    status: rawResult.status,
    hasAttachment: !!rawResult.attachment,
    attachmentBytesLength: rawResult.attachment?.bytes?.length || 0,
    attachmentBytesType: rawResult.attachment?.bytes ? (rawResult.attachment.bytes instanceof Uint8Array ? 'Uint8Array' : Array.isArray(rawResult.attachment.bytes) ? 'Array' : typeof rawResult.attachment.bytes) : 'undefined',
  });

  // Normalize attachment if present
  let normalizedAttachment = rawResult.attachment;
  if (rawResult.attachment) {
    const bytes = rawResult.attachment.bytes;
    
    console.log(`🔍 [getApplicationStatusResult] ${timestamp} Normalizing attachment:`, {
      originalBytesType: bytes instanceof Uint8Array ? 'Uint8Array' : Array.isArray(bytes) ? 'Array' : typeof bytes,
      originalBytesLength: bytes?.length || 0,
      filename: rawResult.attachment.filename,
      contentType: rawResult.attachment.contentType,
    });

    // Ensure bytes are Uint8Array
    const normalizedBytes = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    
    console.log(`🔍 [getApplicationStatusResult] ${timestamp} Normalized bytes:`, {
      type: 'Uint8Array',
      length: normalizedBytes.length,
      firstTenBytes: Array.from(normalizedBytes.slice(0, 10)),
      lastTenBytes: Array.from(normalizedBytes.slice(-10)),
      headerString: String.fromCharCode(...Array.from(normalizedBytes.slice(0, 5))),
    });

    // Ensure contentType defaults to application/pdf
    const contentType = rawResult.attachment.contentType || 'application/pdf';
    
    // Ensure filename is non-empty and has .pdf extension
    let filename = rawResult.attachment.filename || 'attachment.pdf';
    if (!filename.toLowerCase().endsWith('.pdf')) {
      filename = `${filename}.pdf`;
    }

    normalizedAttachment = {
      bytes: normalizedBytes,
      contentType,
      filename,
    };

    console.log(`✅ [getApplicationStatusResult] ${timestamp} Attachment normalized:`, {
      filename: normalizedAttachment.filename,
      contentType: normalizedAttachment.contentType,
      bytesLength: normalizedAttachment.bytes.length,
      bytesType: 'Uint8Array',
    });
  }

  const normalized: ApplicationStatus = {
    applicationId: rawResult.applicationId,
    applicantEmail: rawResult.applicantEmail,
    applicantName: rawResult.applicantName,
    visaType: rawResult.visaType,
    status: rawResult.status,
    lastUpdated: rawResult.lastUpdated,
    comments: rawResult.comments,
    attachment: normalizedAttachment,
  };

  console.log(`✅ [getApplicationStatusResult] ${timestamp} Result normalized successfully:`, {
    applicationId: normalized.applicationId,
    status: normalized.status,
    hasAttachment: !!normalized.attachment,
    attachmentBytesLength: normalized.attachment?.bytes?.length || 0,
  });

  return normalized;
}
