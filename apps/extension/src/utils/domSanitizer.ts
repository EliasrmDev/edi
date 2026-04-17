/**
 * DOM sanitization utilities for the EDI content script.
 *
 * These helpers are used before any DOM manipulation to prevent
 * null byte injection and homograph attacks. They are safe for use
 * with textContent / value assignments.
 *
 * Do NOT use these as a substitute for output encoding when writing
 * to innerHTML — that operation is forbidden in this codebase.
 */

/**
 * Sanitizes a string before it is written to a DOM text node,
 * input.value, or textarea.value.
 *
 * Operations performed:
 * - Removes null bytes (U+0000) which can cause unexpected behavior in
 *   some browsers when embedded in text nodes
 * - Normalizes to Unicode NFC to prevent visual homograph attacks where
 *   visually identical characters have different code-point sequences
 *
 * This function is intentionally NOT an HTML escaper — the string is
 * always assigned to a textContent/value property (never innerHTML).
 */
export function sanitizeForTextNode(text: string): string {
  return text.replace(/\0/g, '').normalize('NFC');
}

/**
 * Validates a CSS selector string before calling querySelector.
 *
 * Returns `true` only when:
 * 1. The selector is a non-empty string
 * 2. It does not contain known CSS injection patterns (expression(),
 *    url(), @import, javascript:)
 * 3. It is syntactically valid according to the browser's CSS parser
 *
 * Use this before any dynamic querySelector call where the selector
 * originates from user data or extension messages.
 */
export function validateSelector(selector: string): boolean {
  if (typeof selector !== 'string' || selector.trim() === '') return false;

  // Block CSS injection / data-exfiltration patterns
  const DANGEROUS_PATTERNS = /expression\s*\(|url\s*\(|@import\b|javascript\s*:/i;
  if (DANGEROUS_PATTERNS.test(selector)) return false;

  // Delegate syntactic validation to the browser's own CSS parser.
  // querySelector throws a SyntaxError for invalid selectors.
  try {
    // Use a detached DocumentFragment so there are no side effects.
    if (typeof document !== 'undefined') {
      document.createDocumentFragment().querySelector(selector);
    }
    return true;
  } catch {
    return false;
  }
}
