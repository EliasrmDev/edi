const ACCENT_MAP: Record<string, string> = {
  a: 'á', e: 'é', i: 'í', o: 'ó', u: 'ú',
  A: 'Á', E: 'É', I: 'Í', O: 'Ó', U: 'Ú',
};

const DEACCENT_MAP: Record<string, string> = {
  á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u', ü: 'u',
  Á: 'A', É: 'E', Í: 'I', Ó: 'O', Ú: 'U', Ü: 'U',
};

/** Adds an accent to a plain vowel character. Returns the character unchanged if not accentable. */
export function addAccent(char: string): string {
  return ACCENT_MAP[char] ?? char;
}

/** Removes the accent from an accented vowel. Returns the character unchanged otherwise. */
export function removeAccent(char: string): string {
  return DEACCENT_MAP[char] ?? char;
}

/** Returns true if the character is an accented vowel. */
export function isAccentedVowel(char: string): boolean {
  return char in DEACCENT_MAP;
}

/**
 * Strips all accent marks from a word, returning the plain ASCII-ish form.
 * Preserves ñ/Ñ as-is (they are not accent variants of n).
 */
export function stripAccents(word: string): string {
  return word
    .split('')
    .map((c) => DEACCENT_MAP[c] ?? c)
    .join('');
}

/**
 * Normalises a word for dictionary lookup:
 *   1. Lowercase
 *   2. Strip leading/trailing non-letter characters (punctuation)
 */
export function normalizeForLookup(word: string): string {
  // Strip leading/trailing punctuation (but keep ñ and accented chars)
  return word.toLowerCase().replace(/^[^a-záéíóúüñ]+|[^a-záéíóúüñ]+$/gi, '');
}

/**
 * Copies the capitalisation pattern of `original` onto `transformed`.
 * Rules (applied to the first codepoint):
 *   - If original starts uppercase → capitalise transformed.
 *   - If original is all-uppercase → upper-case the entire transformed string.
 *   - Otherwise → return transformed as-is.
 */
export function preserveCase(original: string, transformed: string): string {
  if (!original || !transformed) return transformed;

  if (original === original.toUpperCase() && original.length > 1) {
    return transformed.toUpperCase();
  }

  const firstChar = original[0];
  if (firstChar && firstChar === firstChar.toUpperCase() && firstChar !== firstChar.toLowerCase()) {
    return transformed[0]!.toUpperCase() + transformed.slice(1);
  }

  return transformed;
}
