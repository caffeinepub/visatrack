/**
 * Shared normalization helpers for application status identifiers.
 * Ensures consistent handling of applicationId and applicantEmail across all UI paths.
 */

export interface NormalizedApplicationKey {
  applicationId: string;
  applicantEmail: string;
}

/**
 * Normalizes application status identifiers for consistent backend lookups.
 * - Trims whitespace from applicationId
 * - Trims whitespace and converts to lowercase for applicantEmail
 */
export function normalizeApplicationKey(
  applicationId: string,
  applicantEmail: string
): NormalizedApplicationKey {
  return {
    applicationId: applicationId.trim(),
    applicantEmail: applicantEmail.trim().toLowerCase(),
  };
}
