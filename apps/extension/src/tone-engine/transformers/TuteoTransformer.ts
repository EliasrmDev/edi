import { BaseTransformer, getTargetVerbForm } from './BaseTransformer';
import { VERB_BY_VOSEO, VERB_BY_USTEDEO, VERB_BY_VOSEO_IMP, VERB_BY_USTEDEO_IMP } from '../data/verbMappings';
import type { VerbalMode } from '@edi/shared';

/**
 * Converts text from voseo or ustedeo to **tuteo**.
 *
 * Strategy:
 *   1. Look up the word in indicative (and imperative when mode=imperativo) source maps.
 *   2. Return the target tuteo form for the current verbalMode.
 *   3. Apply pronoun replacements (vos→tú, usted→tú).
 *
 * Diphthong insertion (e.g., tenés→tienes, podés→puedes) is handled
 * automatically because the tuteo forms in VERB_MAPPINGS already include the
 * correct diphthongating tuteo form.
 */
export class TuteoTransformer extends BaseTransformer {
  constructor(mode: VerbalMode = 'indicativo') {
    super('tuteo', mode);
  }

  protected lookupVerb(normalized: string): string | null {
    // Prefer voseo source lookup first (most unambiguous — has accents)
    const fromVoseo = VERB_BY_VOSEO.get(normalized);
    if (fromVoseo) {
      const target = getTargetVerbForm(fromVoseo, 'tuteo', this.verbalMode);
      return target.toLowerCase() !== normalized ? target : null;
    }

    // Fall back to ustedeo source
    const fromUstedeo = VERB_BY_USTEDEO.get(normalized);
    if (fromUstedeo) {
      const target = getTargetVerbForm(fromUstedeo, 'tuteo', this.verbalMode);
      return target.toLowerCase() !== normalized ? target : null;
    }

    if (this.verbalMode === 'imperativo') {
      const fromVoseoImp = VERB_BY_VOSEO_IMP.get(normalized);
      if (fromVoseoImp) {
        const target = getTargetVerbForm(fromVoseoImp, 'tuteo', this.verbalMode);
        return target.toLowerCase() !== normalized ? target : null;
      }

      const fromUstedeoImp = VERB_BY_USTEDEO_IMP.get(normalized);
      if (fromUstedeoImp) {
        const target = getTargetVerbForm(fromUstedeoImp, 'tuteo', this.verbalMode);
        return target.toLowerCase() !== normalized ? target : null;
      }
    }

    return null;
  }
}

export function createTuteoTransformer(mode: VerbalMode = 'indicativo'): TuteoTransformer {
  return new TuteoTransformer(mode);
}

/** @deprecated Use createTuteoTransformer() to get a mode-aware instance */
export const tuteoTransformer = new TuteoTransformer();
