export interface Token {
  text: string;
  isWord: boolean;
}

export interface SplitWord {
  leading: string;
  core: string;
  trailing: string;
}

/**
 * Splits `text` into an array of alternating word and non-word tokens.
 * Non-word tokens are whitespace sequences. Word tokens are everything else.
 * Order and content are preserved exactly (round-trip safe).
 */
export function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  // Match either whitespace runs or non-whitespace runs
  const re = /\s+|[^\s]+/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    const segment = match[0];
    tokens.push({ text: segment, isWord: !/^\s+$/.test(segment) });
  }
  return tokens;
}

/** Reconstructs the original text from an array of tokens. */
export function reconstruct(tokens: Token[]): string {
  return tokens.map((t) => t.text).join('');
}

/**
 * Splits a word token into three parts:
 *   leading  — leading non-alphabetic characters (punctuation, symbols, digits)
 *   core     — the alphabetic/accented heart of the word (a-z, á-ú, ñ)
 *   trailing — trailing non-alphabetic characters
 *
 * Examples:
 *   "¡Hablás!"  → leading="¡", core="Hablás", trailing="!"
 *   "hablás,"   → leading="",  core="hablás",  trailing=","
 *   "123"       → leading="",  core="",         trailing="123"  (no alpha core)
 */
export function splitPunctuation(word: string): SplitWord {
  const leadMatch = /^([^a-záéíóúüñA-ZÁÉÍÓÚÜÑ]*)/.exec(word);
  const leading = leadMatch ? leadMatch[1] ?? '' : '';

  const trailMatch = /([^a-záéíóúüñA-ZÁÉÍÓÚÜÑ]*)$/.exec(word);
  const trailing = trailMatch ? trailMatch[1] ?? '' : '';

  const core = word.slice(leading.length, word.length - trailing.length);

  return { leading, core, trailing };
}
