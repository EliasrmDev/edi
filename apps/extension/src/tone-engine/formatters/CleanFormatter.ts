/**
 * Formatting cleaner.
 *
 * Removes invisible/spurious characters and normalises whitespace without
 * altering the semantic content of the text.
 */

// ---------------------------------------------------------------------------
// Unicode Mathematical Alphanumeric Symbols helpers
// ---------------------------------------------------------------------------

/** Maps each character through a codepoint transform. Handles supplementary
 *  (4-byte) Unicode chars by spreading with [...text]. */
function _mapChars(text: string, fn: (cp: number) => number | null): string {
  return [...text]
    .map((ch) => {
      const cp = ch.codePointAt(0);
      if (cp === undefined) return ch;
      const out = fn(cp);
      return out !== null ? String.fromCodePoint(out) : ch;
    })
    .join('');
}

const _isUC = (c: number): boolean => c >= 65 && c <= 90;   // A-Z
const _isLC = (c: number): boolean => c >= 97 && c <= 122;  // a-z
const _isDig = (c: number): boolean => c >= 48 && c <= 57;  // 0-9

/** Converts ASCII letters/digits to Math Bold (U+1D400/U+1D41A/U+1D7CE). */
export function toUnicodeBold(text: string): string {
  return _mapChars(text, (c) => {
    if (_isUC(c)) return 0x1d400 + (c - 65);
    if (_isLC(c)) return 0x1d41a + (c - 97);
    if (_isDig(c)) return 0x1d7ce + (c - 48);
    return null;
  });
}

/** Converts ASCII letters to Math Italic (U+1D434/U+1D44E).
 *  Note: U+1D455 is unassigned; lowercase h maps to U+210E (ℎ). */
export function toUnicodeItalic(text: string): string {
  return _mapChars(text, (c) => {
    if (_isUC(c)) return 0x1d434 + (c - 65);
    if (_isLC(c)) {
      if (c === 104) return 0x210e; // 'h' — U+1D455 is unassigned
      return 0x1d44e + (c - 97);
    }
    return null;
  });
}

/** Converts ASCII letters to Math Bold Italic (U+1D468/U+1D482). */
export function toUnicodeBoldItalic(text: string): string {
  return _mapChars(text, (c) => {
    if (_isUC(c)) return 0x1d468 + (c - 65);
    if (_isLC(c)) return 0x1d482 + (c - 97);
    return null;
  });
}

/** Converts ASCII letters to Math Bold Script (U+1D4D0/U+1D4EA).
 *  Bold Script is fully contiguous (unlike regular Script which has gaps). */
export function toUnicodeBoldScript(text: string): string {
  return _mapChars(text, (c) => {
    if (_isUC(c)) return 0x1d4d0 + (c - 65);
    if (_isLC(c)) return 0x1d4ea + (c - 97);
    return null;
  });
}

/** Converts ASCII letters/digits to Math Monospace (U+1D670/U+1D68A/U+1D7F6). */
export function toUnicodeMonospace(text: string): string {
  return _mapChars(text, (c) => {
    if (_isUC(c)) return 0x1d670 + (c - 65);
    if (_isLC(c)) return 0x1d68a + (c - 97);
    if (_isDig(c)) return 0x1d7f6 + (c - 48);
    return null;
  });
}

/** Converts ASCII letters/digits to Fullwidth (U+FF21/U+FF41/U+FF10). */
export function toUnicodeFullwidth(text: string): string {
  return _mapChars(text, (c) => {
    if (_isUC(c)) return 0xff21 + (c - 65);
    if (_isLC(c)) return 0xff41 + (c - 97);
    if (_isDig(c)) return 0xff10 + (c - 48);
    return null;
  });
}

/** Strips Unicode Mathematical Alphanumeric Symbols and Fullwidth chars back
 *  to plain ASCII. Covers all styles added by the toUnicode* functions above,
 *  plus several adjacent Math styles (sans-serif, double-struck, fraktur). */
export function stripUnicodeStyles(text: string): string {
  // Each array entry is the base codepoint for A (uppercase) or a (lowercase)
  // or '0' (digit) for one style. The 26 (or 10) chars after each base are
  // the full alphabet/digits for that style.
  const upperBases = [
    0x1d400, 0x1d434, 0x1d468, 0x1d4d0, 0x1d5a0,
    0x1d5d4, 0x1d608, 0x1d63c, 0x1d670,
  ];
  const lowerBases = [
    0x1d41a, 0x1d44e, 0x1d482, 0x1d4ea, 0x1d5ba,
    0x1d5ee, 0x1d622, 0x1d656, 0x1d68a,
  ];
  const digitBases = [0x1d7ce, 0x1d7d8, 0x1d7e2, 0x1d7ec, 0x1d7f6];

  // First normalise fullwidth chars (U+FF01–U+FF60) back to ASCII via NFKC
  let result = text.normalize('NFKC');

  return _mapChars(result, (cp) => {
    // Italic h exception (U+210E → 'h')
    if (cp === 0x210e) return 104;

    for (const base of upperBases) {
      if (cp >= base && cp < base + 26) return 65 + (cp - base);
    }
    for (const base of lowerBases) {
      if (cp >= base && cp < base + 26) return 97 + (cp - base);
    }
    for (const base of digitBases) {
      if (cp >= base && cp < base + 10) return 48 + (cp - base);
    }
    return null;
  });
}

// ---------------------------------------------------------------------------
// Formatting cleaner
// ---------------------------------------------------------------------------

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
  // First strip any Unicode style characters back to plain ASCII
  let result = stripUnicodeStyles(text);

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
