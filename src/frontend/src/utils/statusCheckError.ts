/**
 * Error classification for status check failures
 */
export type StatusCheckErrorCategory = 'connection' | 'backend' | 'unknown';

export interface StatusCheckError {
  /** User-facing error message with actionable guidance */
  message: string;
  /** Error category for UI handling */
  category: StatusCheckErrorCategory;
  /** Raw technical details for debugging */
  technicalDetails: string;
}

/**
 * Maps unknown error values into a structured error model with
 * user-friendly messages and technical details for debugging.
 */
export function parseStatusCheckError(error: unknown): StatusCheckError {
  const technicalDetails = error instanceof Error 
    ? `${error.name}: ${error.message}\n${error.stack || ''}` 
    : String(error);

  // Connection/initialization errors
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    if (
      message.includes('connection not ready') ||
      message.includes('actor not available') ||
      message.includes('agent') ||
      message.includes('fetch') ||
      message.includes('network')
    ) {
      return {
        message: 'Unable to connect to the service. Please check your internet connection and try again.',
        category: 'connection',
        technicalDetails,
      };
    }

    // Backend rejection errors (traps, authorization, etc.)
    if (
      message.includes('unauthorized') ||
      message.includes('trap') ||
      message.includes('rejected')
    ) {
      return {
        message: 'The service rejected your request. Please verify your application details and try again.',
        category: 'backend',
        technicalDetails,
      };
    }
  }

  // Generic fallback
  return {
    message: 'Unable to check application status. Please try again later.',
    category: 'unknown',
    technicalDetails,
  };
}
