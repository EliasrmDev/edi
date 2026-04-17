/**
 * Formatting cleaner.
 *
 * Removes invisible/spurious characters and normalises whitespace without
 * altering the semantic content of the text.
 */

/**
 * Removes common formatting noise from text:
 *   - Collapses multiple consecutive spaces/tabs to a single space
 *   - Collapses more than 2 consecutive newlines to 2
 *   - Removes zero-width characters (ZWSP, ZWNJ, ZWJ, BOM)
 *   - Removes soft hyphens (U+00AD)
 *   - Normalises em-dashes (—) and en-dashes (–) to hyphens surrounded by spaces
 *   - Trims each line individually (removes leading/trailing whitespace per line)
 *   - Trims the overall result
 */
export function removeFormatting(text: string): string {
  let result = text;

  // Remove zero-width and invisible characters
  // U+200B ZERO WIDTH SPACE, U+200C ZWNJ, U+200D ZWJ, U+FEFF BOM/ZWNBSP
  result = result.replace(/[\u200B\u200C\u200D\uFEFF]/g, '');

  // Remove soft hyphen
  result = result.replace(/\u00AD/g, '');

  // Normalise em-dash / en-dash to " - "
  result = result.replace(/\s*[—–]\s*/g, ' - ');

  // Collapse multiple spaces/tabs to single space
  result = result.replace(/[ \t]+/g, ' ');

  // Collapse more than 2 consecutive newlines to exactly 2
  result = result.replace(/(\r?\n){3,}/g, '\n\n');

  // Normalise Windows-style line endings to Unix
  result = result.replace(/\r\n/g, '\n');

  // Trim each individual line
  result = result
    .split('\n')
    .map((line) => line.trim())
    .join('\n');

  // Trim overall
  return result.trim();
}
