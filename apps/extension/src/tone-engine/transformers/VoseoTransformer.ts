import { BaseTransformer } from './BaseTransformer';
import { VERB_BY_TUTEO, VERB_BY_USTEDEO } from '../data/verbMappings';

/**
 * Converts text from tuteo or ustedeo to **voseo costarricense**.
 *
 * Strategy:
 *   1. Look up the word in VERB_BY_TUTEO.  If found, return the voseo form.
 *   2. Fall back to VERB_BY_USTEDEO for words that look like ustedeo 3rd-person
 *      forms (only when not already matched above).
 *   3. Apply pronoun replacements (tú→vos, usted→vos, ti→vos, contigo→con vos).
 *
 * Note: Ustedeo verb forms coincide with 3rd-person él/ella forms, so step 2
 * may produce false positives.  A TONE_COVERAGE_LIMITED warning is always
 * attached by ToneEngine.
 */
export class VoseoTransformer extends BaseTransformer {
  constructor() {
    super('voseo');
  }

  protected lookupVerb(normalized: string): string | null {
    // Prefer tuteo source lookup first
    const fromTuteo = VERB_BY_TUTEO.get(normalized);
    if (fromTuteo) {
      const target = fromTuteo.voseo;
      // If target === source form (e.g., "estás" tuteo ≡ voseo), no change
      return target.toLowerCase() !== normalized ? target : null;
    }

    // Fall back to ustedeo source
    const fromUstedeo = VERB_BY_USTEDEO.get(normalized);
    if (fromUstedeo) {
      const target = fromUstedeo.voseo;
      return target.toLowerCase() !== normalized ? target : null;
    }

    return null;
  }
}

export const voseoTransformer = new VoseoTransformer();
