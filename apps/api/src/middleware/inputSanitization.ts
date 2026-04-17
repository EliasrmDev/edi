import { createMiddleware } from 'hono/factory';

// ---------------------------------------------------------------------------
// Depth checker
// ---------------------------------------------------------------------------

/**
 * Returns the maximum nesting depth of a parsed JSON value.
 * Objects and arrays each count as one level.
 */
function getJsonDepth(value: unknown, current = 0): number {
  if (current > 6) return current; // early exit — already over limit
  if (typeof value !== 'object' || value === null) return current;

  const children: unknown[] = Array.isArray(value) ? value : Object.values(value);
  if (children.length === 0) return current;

  let max = current;
  for (const child of children) {
    const d = getJsonDepth(child, current + 1);
    if (d > max) max = d;
  }
  return max;
}

// ---------------------------------------------------------------------------
// Recursive sanitizer
// ---------------------------------------------------------------------------

/**
 * Recursively walks a parsed JSON value:
 * - Strips null bytes (U+0000) from all strings
 * - Normalizes all strings to Unicode NFC (prevents homograph attacks)
 * - Sanitizes object keys as well as values
 * - Leaves numbers, booleans, and null unchanged
 *
 * Does NOT HTML-escape — that is the rendering layer's responsibility.
 */
function sanitizeValue(value: unknown): unknown {
  if (typeof value === 'string') {
    return value.replace(/\0/g, '').normalize('NFC');
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (typeof value === 'object' && value !== null) {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      // Sanitize keys too — prevents header-injection style attacks via JSON keys
      const cleanKey = k.replace(/\0/g, '').normalize('NFC');
      result[cleanKey] = sanitizeValue(v);
    }
    return result;
  }
  // number, boolean, null — pass through unchanged
  return value;
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

const MAX_JSON_DEPTH = 5;

/**
 * Input sanitization middleware for all API routes.
 *
 * For JSON request bodies this middleware:
 * 1. Rejects bodies that contain null bytes
 * 2. Rejects bodies nested beyond MAX_JSON_DEPTH levels
 * 3. Normalizes all string values to Unicode NFC
 * 4. Patches `c.req.json()` on the request so downstream handlers
 *    automatically receive the sanitized payload without code changes.
 *
 * Note: Payload size limiting is handled separately by Hono's built-in
 * bodyLimit middleware — apply that before this one in index.ts.
 */
export const inputSanitization = () =>
  createMiddleware(async (c, next) => {
    const method = c.req.method;
    if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
      return next();
    }

    const contentType = c.req.header('content-type') ?? '';
    if (!contentType.includes('application/json')) {
      return next();
    }

    const raw = await c.req.text();

    if (raw.trim() === '') {
      return next();
    }

    // --- 1. Null byte check on raw string ---
    if (raw.includes('\0')) {
      return c.json(
        { error: { code: 'INVALID_INPUT', message: 'Request body contains invalid characters' } },
        400,
      );
    }

    // --- 2. Parse JSON (let parse errors through so Hono/Zod handles them normally) ---
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // Non-JSON body — let the route handler's schema validation produce the error
      return next();
    }

    // --- 3. Depth check ---
    if (getJsonDepth(parsed) > MAX_JSON_DEPTH) {
      return c.json(
        {
          error: {
            code: 'INVALID_INPUT',
            message: `Request body exceeds maximum nesting depth of ${MAX_JSON_DEPTH}`,
          },
        },
        400,
      );
    }

    // --- 4. Sanitize (null bytes in nested strings, Unicode NFC) ---
    const sanitized = sanitizeValue(parsed);

    // Patch req.json() on this request instance so route handlers receive
    // the sanitized version. We use defineProperty to override the method on
    // the instance without touching the prototype.
    Object.defineProperty(c.req, 'json', {
      value: () => Promise.resolve(sanitized),
      configurable: true,
      writable: true,
    });

    return next();
  });
