import { VERB_BY_VOSEO, VERB_BY_TUTEO, VERB_BY_USTEDEO } from '../data/verbMappings';
import type { VerbEntry } from '../data/verbMappings';
import { normalizeForLookup } from './accentUtils';

/**
 * Looks up verb conjugation forms in the dictionary.
 *
 * The matcher normalises words (lowercase, strip accents for -ar/-er/-ir regular
 * forms) and checks all three tone maps.  It is deliberately conservative: a
 * word is only returned as a match when found verbatim (after normalisation) in
 * one of the maps.
 */
export class VerbMatcher {
  /** Look up a word as a voseo 2nd-person present form. */
  findByVoseo(word: string): VerbEntry | undefined {
    return VERB_BY_VOSEO.get(normalizeForLookup(word));
  }

  /** Look up a word as a tuteo 2nd-person present form. */
  findByTuteo(word: string): VerbEntry | undefined {
    return VERB_BY_TUTEO.get(normalizeForLookup(word));
  }

  /** Look up a word as a ustedeo 2nd-person present form. */
  findByUstedeo(word: string): VerbEntry | undefined {
    return VERB_BY_USTEDEO.get(normalizeForLookup(word));
  }

  /**
   * Detects likely unsupported tenses by pattern.
   * Returns a warning message if the word looks like a past/future/subjunctive
   * 2nd-person form that the engine does not handle, null otherwise.
   */
  detectUnsupportedTense(word: string): string | null {
    const lower = word.toLowerCase();

    // Voseo preterite patterns: -aste, -iste
    if (/[aeiouáéíóú]ste$/.test(lower)) return 'preterite';
    // Imperfect: -abas, -ías
    if (/abas$|ías$/.test(lower)) return 'imperfect';
    // Future: -ás (ambiguous — voseo present IS -ás, skip)
    // Conditional: -arías, -erías, -irías
    if (/[aei]rías$/.test(lower)) return 'conditional';
    // Present subjunctive -es (tuteo) like "hables", "comas" — handled already
    // Imperfect subjunctive: -aras, -eras, -ieras, -ieras
    if (/aras$|eras$|ieras$/.test(lower)) return 'subjunctive';

    return null;
  }
}

export const verbMatcher = new VerbMatcher();
