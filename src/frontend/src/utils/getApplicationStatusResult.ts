import type { ApplicationStatus } from '../backend';

/**
 * Runtime normalization helper that converts raw backend getApplicationStatus responses
 * into ApplicationStatus with proper TypeScript types and extensive diagnostic logging.
 */
export function getApplicationStatusResult(rawResult: ApplicationStatus | null): ApplicationStatus | null {
  const timestamp = new Date().toISOString();
  
  console.log(`[${timestamp}] [getApplicationStatusResult] Processing raw result:`, {
    hasResult: !!rawResult,
    resultType: rawResult ? typeof rawResult : 'null',
  });

  if (!rawResult) {
    console.log(`[${timestamp}] [getApplicationStatusResult] Result is null, returning null`);
    return null;
  }

  console.log(`[${timestamp}] [getApplicationStatusResult] Raw result details:`, {
    applicationId: rawResult.applicationId,
    applicantEmail: rawResult.applicantEmail,
    applicantName: rawResult.applicantName,
    visaType: rawResult.visaType,
    status: rawResult.status,
    hasComments: !!rawResult.comments,
    hasAttachment: !!rawResult.attachment,
    attachmentFilename: rawResult.attachment?.filename,
    attachmentBytesLength: rawResult.attachment?.bytes?.length,
  });

  // Normalize attachment bytes if present
  let normalizedAttachment = rawResult.attachment;
  if (rawResult.attachment?.bytes) {
    const rawBytes = rawResult.attachment.bytes;
    const isUint8Array = rawBytes instanceof Uint8Array;
    
    console.log(`[${timestamp}] [getApplicationStatusResult] Attachment bytes type check:`, {
      isUint8Array,
      isArray: Array.isArray(rawBytes),
      rawType: typeof rawBytes,
      length: rawBytes.length,
    });

    if (!isUint8Array) {
      console.log(`[${timestamp}] [getApplicationStatusResult] Converting bytes to Uint8Array`);
      // rawBytes is Uint8Array type from backend, but might be array-like at runtime
      const convertedBytes = new Uint8Array(rawBytes as ArrayLike<number>);
      console.log(`[${timestamp}] [getApplicationStatusResult] Conversion complete:`, {
        originalLength: (rawBytes as ArrayLike<number>).length,
        convertedLength: convertedBytes.length,
        firstTenBytes: Array.from(convertedBytes.slice(0, 10)),
      });
      
      normalizedAttachment = {
        ...rawResult.attachment,
        bytes: convertedBytes,
      };
    }
  }

  const result: ApplicationStatus = {
    applicationId: rawResult.applicationId,
    applicantEmail: rawResult.applicantEmail,
    applicantName: rawResult.applicantName,
    visaType: rawResult.visaType,
    status: rawResult.status,
    lastUpdated: rawResult.lastUpdated,
    comments: rawResult.comments || undefined,
    attachment: normalizedAttachment,
  };

  console.log(`[${timestamp}] [getApplicationStatusResult] Normalized result:`, {
    applicationId: result.applicationId,
    applicantEmail: result.applicantEmail,
    hasAttachment: !!result.attachment,
    attachmentBytesType: result.attachment?.bytes ? (result.attachment.bytes instanceof Uint8Array ? 'Uint8Array' : 'other') : 'undefined',
  });

  return result;
}
