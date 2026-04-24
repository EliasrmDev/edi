import { tokenize, reconstruct, splitPunctuation } from '../utils/tokenizer';
import { preserveCase, normalizeForLookup } from '../utils/accentUtils';
import { PRONOUN_REPLACEMENTS } from '../data/pronounMappings';
import type { PronounReplacement } from '../data/pronounMappings';
import type { VerbEntry } from '../data/verbMappings';
import { deriveFallbackImperative } from '../utils/RegularVerbFallback';
import type { VerbalMode } from '@edi/shared';

export type TargetTone = 'voseo' | 'tuteo' | 'ustedeo';

/**
 * Returns the target form from a VerbEntry for the given target tone and mode.
 * Falls back to deriveFallbackImperative when no explicit imperative is stored,
 * and ultimately falls back to the indicative form.
 */
export function getTargetVerbForm(
  entry: VerbEntry,
  targetTone: TargetTone,
  mode: VerbalMode,
): string {
  if (mode === 'imperativo') {
    const imp =
      targetTone === 'voseo'   ? entry.voseoImperative
      : targetTone === 'tuteo'   ? entry.tuteoImperative
      :                            entry.ustedeoImperative;
    if (imp) return imp;

    // Derive from the indicative form when no explicit imperative is stored
    const indicative =
      targetTone === 'voseo'   ? entry.voseo
      : targetTone === 'tuteo'   ? entry.tuteo
      :                            entry.ustedeo;
    const derived = deriveFallbackImperative(indicative, targetTone);
    if (derived) return derived;
  }

  // indicativo (default) or fallback when imperative cannot be derived
  switch (targetTone) {
    case 'voseo':   return entry.voseo;
    case 'tuteo':   return entry.tuteo;
    case 'ustedeo': return entry.ustedeo;
  }
}

/**
 * Abstract base class for tone transformers.
 *
 * Subclasses implement `lookupVerb()` which receives a normalised word and
 * returns the correct replacement form (or null when no replacement applies).
 */
export abstract class BaseTransformer {
  protected readonly targetTone: TargetTone;
  protected readonly verbalMode: VerbalMode;

  constructor(targetTone: TargetTone, verbalMode: VerbalMode = 'indicativo') {
    this.targetTone = targetTone;
    this.verbalMode = verbalMode;
  }

  /**
   * Given a normalised word (lowercase, stripped punctuation), return the
   * replacement form in the target tone, or null if no change is needed.
   */
  protected abstract lookupVerb(normalized: string): string | null;

  /**
   * Applies pronoun replacements to the full text using the pronoun rules
   * for this transformer's target tone.
   */
  protected applyPronounReplacements(text: string): string {
    let result = text;
    for (const rule of PRONOUN_REPLACEMENTS) {
      result = this._applyOnePronoun(result, rule);
    }
    return result;
  }

  private _applyOnePronoun(text: string, rule: PronounReplacement): string {
    const targetForm = this._getPronounTarget(rule);
    return text.replace(rule.pattern, (match: string) =>
      preserveCase(match, targetForm),
    );
  }

  private _getPronounTarget(rule: PronounReplacement): string {
    switch (this.targetTone) {
      case 'voseo':   return rule.voseo;
      case 'tuteo':   return rule.tuteo;
      case 'ustedeo': return rule.ustedeo;
    }
  }

  /**
   * Transforms verbs token-by-token then calls pronoun replacements.
   */
  transform(text: string): string {
    // 1. Verb replacement (token-level)
    const tokens = tokenize(text);
    const processed = tokens.map((token) => {
      if (!token.isWord) return token;

      const { leading, core, trailing } = splitPunctuation(token.text);
      if (!core) return token;

      const normalized = normalizeForLookup(core);
      const replacement = this.lookupVerb(normalized);

      if (replacement === null) return token;

      // Preserve capitalisation of original core
      const cased = preserveCase(core, replacement);
      return { ...token, text: leading + cased + trailing };
    });

    const verbReplaced = reconstruct(processed);

    // 2. Pronoun replacement (regex-level)
    return this.applyPronounReplacements(verbReplaced);
  }
}
