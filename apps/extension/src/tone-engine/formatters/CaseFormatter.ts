/**
 * Text case formatters.
 *
 * All functions are pure — they take a string and return a new string with
 * the desired case transformation applied, leaving whitespace intact.
 */

/** Converts every character to uppercase. */
export function toUpperCase(text: string): string {
  return text.toUpperCase();
}

/** Converts every character to lowercase. */
export function toLowerCase(text: string): string {
  return text.toLowerCase();
}

/**
 * Converts text to sentence case.
 *
 * Rules:
 *   1. The first letter after `^` (start of text, ignoring leading whitespace)
 *      is capitalised.
 *   2. The first letter after a sentence-ending punctuation mark (`.` `!` `?`)
 *      followed by at least one whitespace character is capitalised.
 *   3. Spanish opening punctuation (`¿` `¡`) immediately preceding a letter
 *      does NOT prevent capitalisation of that letter.
 *   4. Ellipsis (`...`) is treated as non-terminal — the word following is
 *      NOT capitalised.
 *   5. Each operating unit is a single sentence; the rest is left unchanged
 *      (preserving existing mixed caps inside sentences).
 */
export function toSentenceCase(text: string): string {
  // We splice by sentence boundaries, capitalising the first real letter of
  // each sentence.
  return text.replace(
    /(^|[.!?]\s+|\n\n+)([ \t]*[¿¡]?[ \t]*)([a-záéíóúüñ])/gi,
    (_match: string, boundary: string, prefix: string, firstLetter: string): string =>
      boundary + prefix + firstLetter.toUpperCase(),
  );
}
