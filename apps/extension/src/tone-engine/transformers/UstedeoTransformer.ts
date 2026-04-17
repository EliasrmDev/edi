import { BaseTransformer } from './BaseTransformer';
import { VERB_BY_VOSEO, VERB_BY_TUTEO } from '../data/verbMappings';

/**
 * Converts text from voseo or tuteo to **ustedeo**.
 *
 * Strategy:
 *   1. Look up the word in VERB_BY_VOSEO.  If found, return the ustedeo form.
 *   2. Fall back to VERB_BY_TUTEO for tuteo-only forms (like diphthongated verbs
 *      which differ from voseo: "tienes" is not in VERB_BY_VOSEO).
 *   3. Apply pronoun replacements (vos→usted, tú→usted, ti→usted,
 *      con vos/contigo→con usted).
 *
 * Limitation: ustedeo forms are identical to 3rd-person él/ella forms.
 * The engine cannot distinguish "habla" (2nd-person ustedeo target) from
 * "habla" (3rd-person). A TONE_COVERAGE_LIMITED warning is always attached.
 */
export class UstedeoTransformer extends BaseTransformer {
  constructor() {
    super('ustedeo');
  }

  protected lookupVerb(normalized: string): string | null {
    // Prefer voseo source (accented endings — unambiguous)
    const fromVoseo = VERB_BY_VOSEO.get(normalized);
    if (fromVoseo) {
      const target = fromVoseo.ustedeo;
      return target.toLowerCase() !== normalized ? target : null;
    }

    // Fall back to tuteo source (diphthongated forms unique to tuteo)
    const fromTuteo = VERB_BY_TUTEO.get(normalized);
    if (fromTuteo) {
      const target = fromTuteo.ustedeo;
      return target.toLowerCase() !== normalized ? target : null;
    }

    return null;
  }
}

export const ustedeoTransformer = new UstedeoTransformer();
