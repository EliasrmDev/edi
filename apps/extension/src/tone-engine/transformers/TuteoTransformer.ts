import { BaseTransformer } from './BaseTransformer';
import { VERB_BY_VOSEO, VERB_BY_USTEDEO } from '../data/verbMappings';

/**
 * Converts text from voseo or ustedeo to **tuteo**.
 *
 * Strategy:
 *   1. Look up the word in VERB_BY_VOSEO.  If found, return the tuteo form.
 *   2. Fall back to VERB_BY_USTEDEO for ustedeo-only forms.
 *   3. Apply pronoun replacements (vos→tú, usted→tú, contigo stays, ti stays).
 *
 * Diphthong insertion (e.g., tenés→tienes, podés→puedes) is handled
 * automatically because the tuteo forms in VERB_MAPPINGS already include the
 * correct diphthongating tuteo form.
 */
export class TuteoTransformer extends BaseTransformer {
  constructor() {
    super('tuteo');
  }

  protected lookupVerb(normalized: string): string | null {
    // Prefer voseo source lookup first (most unambiguous — has accents)
    const fromVoseo = VERB_BY_VOSEO.get(normalized);
    if (fromVoseo) {
      const target = fromVoseo.tuteo;
      return target.toLowerCase() !== normalized ? target : null;
    }

    // Fall back to ustedeo source
    const fromUstedeo = VERB_BY_USTEDEO.get(normalized);
    if (fromUstedeo) {
      const target = fromUstedeo.tuteo;
      return target.toLowerCase() !== normalized ? target : null;
    }

    return null;
  }
}

export const tuteoTransformer = new TuteoTransformer();
