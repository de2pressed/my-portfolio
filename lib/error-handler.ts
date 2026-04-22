/**
 * Error handling utilities to prevent information leakage in production
 */

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function handleApiError(error: unknown): {
  error: string;
  statusCode: number;
} {
  // Log detailed error server-side
  if (process.env.NODE_ENV === 'development') {
    console.error('API Error:', error);
  }

  // Return generic error to client in production
  if (error instanceof AppError) {
    return {
      error: error.isOperational ? error.message : 'An error occurred',
      statusCode: error.statusCode,
    };
  }

  if (error instanceof Error) {
    // In production, don't leak error messages
    const message = process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred' 
      : error.message;
    
    return {
      error: message,
      statusCode: 500,
    };
  }

  return {
    error: 'An unexpected error occurred',
    statusCode: 500,
  };
}
