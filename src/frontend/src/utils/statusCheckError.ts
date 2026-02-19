/**
 * Error parsing utility that maps unknown error values into structured error models
 * with user-friendly messages, error categories, and raw technical details for debugging.
 */

export interface StatusCheckError {
  message: string;
  category: 'connection' | 'backend' | 'unknown';
  rawError: unknown;
}

/**
 * Parses and categorizes errors from application status checks.
 * Provides user-friendly messages while preserving technical details for debugging.
 */
export function parseStatusCheckError(error: unknown): StatusCheckError {
  const timestamp = new Date().toISOString();
  
  console.error(`[${timestamp}] [statusCheckError] Parsing error:`, {
    errorType: typeof error,
    errorConstructor: error?.constructor?.name,
    error,
  });

  // Handle Error objects
  if (error instanceof Error) {
    console.error(`[${timestamp}] [statusCheckError] Error instance:`, {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });

    // Connection errors
    if (error.message.includes('Unable to connect') || error.message.includes('network') || error.message.includes('fetch')) {
      return {
        message: 'Unable to connect to the backend service. Please check your internet connection and try again.',
        category: 'connection',
        rawError: error,
      };
    }

    // Backend errors (traps, authorization, etc.)
    if (error.message.includes('Unauthorized') || error.message.includes('trap') || error.message.includes('does not exist')) {
      return {
        message: error.message,
        category: 'backend',
        rawError: error,
      };
    }

    // Generic error
    return {
      message: error.message || 'An unexpected error occurred',
      category: 'unknown',
      rawError: error,
    };
  }

  // Handle string errors
  if (typeof error === 'string') {
    console.error(`[${timestamp}] [statusCheckError] String error:`, error);
    return {
      message: error,
      category: 'unknown',
      rawError: error,
    };
  }

  // Handle object errors with message property
  if (error && typeof error === 'object' && 'message' in error) {
    const message = String((error as { message: unknown }).message);
    console.error(`[${timestamp}] [statusCheckError] Object with message:`, message);
    return {
      message,
      category: 'unknown',
      rawError: error,
    };
  }

  // Unknown error type
  console.error(`[${timestamp}] [statusCheckError] Unknown error type:`, error);
  return {
    message: 'An unexpected error occurred while checking application status',
    category: 'unknown',
    rawError: error,
  };
}
