import type { ErrorHandler } from 'hono';
import { ZodError } from 'zod';
import type { AppEnv } from '../types.js';

/**
 * Typed application error with HTTP status code.
 * Use instead of generic Error for known business-logic failures.
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;

  constructor(
    code: string,
    message: string,
    statusCode: number = 400,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * Global Hono error handler.
 * - ZodError → 422 with field-level validation details
 * - AppError → its statusCode with code/message
 * - Unknown → 500 with generic message (never leak stack traces in production)
 */
export const errorHandler: ErrorHandler<AppEnv> = (err, c) => {
  const requestId = c.get('requestId');

  // --- Zod validation errors ---
  if (err instanceof ZodError) {
    const details: Record<string, string[]> = {};
    for (const issue of err.issues) {
      const path = issue.path.join('.') || '_root';
      const existing = details[path];
      if (existing) {
        existing.push(issue.message);
      } else {
        details[path] = [issue.message];
      }
    }
    return c.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Invalid request data', details } },
      422,
    );
  }

  // --- Known app errors ---
  if (err instanceof AppError) {
    return c.json(
      { error: { code: err.code, message: err.message, details: err.details } },
      err.statusCode as 400,
    );
  }

  // --- Unknown errors → 500, never leak internals ---
  console.error(JSON.stringify({
    level: 'error',
    requestId,
    error: err.message,
    stack: err.stack,
    timestamp: new Date().toISOString(),
  }));

  return c.json(
    { error: { code: 'INTERNAL_SERVER_ERROR', message: 'An unexpected error occurred' } },
    500,
  );
};
