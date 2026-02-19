/**
 * Shared normalization helpers for application status identifiers.
 * Ensures consistent handling of applicationId and applicantEmail across all UI paths.
 * 
 * Normalization rules:
 * - applicationId: Trim whitespace from both ends
 * - applicantEmail: Trim whitespace and convert to lowercase for case-insensitive matching
 */

export interface NormalizedApplicationKey {
  applicationId: string;
  applicantEmail: string;
}

/**
 * Normalizes application status identifiers for consistent backend lookups.
 * - Trims whitespace from applicationId
 * - Trims whitespace and converts to lowercase for applicantEmail
 * 
 * @param applicationId - Raw application ID input
 * @param applicantEmail - Raw applicant email input
 * @returns Normalized key object with consistent formatting
 */
export function normalizeApplicationKey(
  applicationId: string,
  applicantEmail: string
): NormalizedApplicationKey {
  const timestamp = new Date().toISOString();
  const normalized = {
    applicationId: applicationId.trim(),
    applicantEmail: applicantEmail.trim().toLowerCase(),
  };
  
  console.log(`[${timestamp}] [applicationStatusNormalization] Normalizing:`, {
    raw: { applicationId: `"${applicationId}"`, applicantEmail: `"${applicantEmail}"` },
    normalized: { applicationId: `"${normalized.applicationId}"`, applicantEmail: `"${normalized.applicantEmail}"` },
  });
  
  return normalized;
}
