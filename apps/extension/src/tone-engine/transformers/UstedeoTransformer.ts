import { BaseTransformer, getTargetVerbForm } from './BaseTransformer';
import { VERB_BY_VOSEO, VERB_BY_TUTEO, VERB_BY_VOSEO_IMP, VERB_BY_TUTEO_IMP } from '../data/verbMappings';
import type { VerbalMode } from '@edi/shared';

/**
 * Converts text from voseo or tuteo to **ustedeo**.
 *
 * Strategy:
 *   1. Look up the word in indicative (and imperative when mode=imperativo) source maps.
 *   2. Return the target ustedeo form for the current verbalMode.
 *   3. Apply pronoun replacements (vos→usted, tú→usted, ti→usted,
 *      con vos/contigo→con usted).
 *
 * Limitation: ustedeo forms are identical to 3rd-person él/ella forms.
 * The engine cannot distinguish "habla" (2nd-person ustedeo target) from
 * "habla" (3rd-person). A TONE_COVERAGE_LIMITED warning is always attached.
 */
export class UstedeoTransformer extends BaseTransformer {
  constructor(mode: VerbalMode = 'indicativo') {
    super('ustedeo', mode);
  }

  protected lookupVerb(normalized: string): string | null {
    // Prefer voseo source (accented endings — unambiguous)
    const fromVoseo = VERB_BY_VOSEO.get(normalized);
    if (fromVoseo) {
      const target = getTargetVerbForm(fromVoseo, 'ustedeo', this.verbalMode);
      return target.toLowerCase() !== normalized ? target : null;
    }

    // Fall back to tuteo source (diphthongated forms unique to tuteo)
    const fromTuteo = VERB_BY_TUTEO.get(normalized);
    if (fromTuteo) {
      const target = getTargetVerbForm(fromTuteo, 'ustedeo', this.verbalMode);
      return target.toLowerCase() !== normalized ? target : null;
    }

    if (this.verbalMode === 'imperativo') {
      const fromVoseoImp = VERB_BY_VOSEO_IMP.get(normalized);
      if (fromVoseoImp) {
        const target = getTargetVerbForm(fromVoseoImp, 'ustedeo', this.verbalMode);
        return target.toLowerCase() !== normalized ? target : null;
      }

      const fromTuteoImp = VERB_BY_TUTEO_IMP.get(normalized);
      if (fromTuteoImp) {
        const target = getTargetVerbForm(fromTuteoImp, 'ustedeo', this.verbalMode);
        return target.toLowerCase() !== normalized ? target : null;
      }
    }

    return null;
  }
}

export function createUstedeoTransformer(mode: VerbalMode = 'indicativo'): UstedeoTransformer {
  return new UstedeoTransformer(mode);
}

/** @deprecated Use createUstedeoTransformer() to get a mode-aware instance */
export const ustedeoTransformer = new UstedeoTransformer();
