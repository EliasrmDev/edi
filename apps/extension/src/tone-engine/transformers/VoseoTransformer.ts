import { BaseTransformer, getTargetVerbForm } from './BaseTransformer';
import { VERB_BY_TUTEO, VERB_BY_USTEDEO, VERB_BY_TUTEO_IMP, VERB_BY_USTEDEO_IMP } from '../data/verbMappings';
import type { VerbalMode } from '@edi/shared';

/**
 * Converts text from tuteo or ustedeo to **voseo costarricense**.
 *
 * Strategy:
 *   1. Look up the word in indicative (and imperative when mode=imperativo) source maps.
 *   2. Return the target voseo form for the current verbalMode.
 *   3. Apply pronoun replacements (tú→vos, usted→vos, ti→vos, contigo→con vos).
 *
 * Note: Ustedeo verb forms coincide with 3rd-person él/ella forms, so step 2
 * may produce false positives.  A TONE_COVERAGE_LIMITED warning is always
 * attached by ToneEngine.
 */
export class VoseoTransformer extends BaseTransformer {
  constructor(mode: VerbalMode = 'indicativo') {
    super('voseo', mode);
  }

  protected lookupVerb(normalized: string): string | null {
    // Prefer tuteo source lookup first (indicative)
    const fromTuteo = VERB_BY_TUTEO.get(normalized);
    if (fromTuteo) {
      const target = getTargetVerbForm(fromTuteo, 'voseo', this.verbalMode);
      return target.toLowerCase() !== normalized ? target : null;
    }

    // Fall back to ustedeo source (indicative)
    const fromUstedeo = VERB_BY_USTEDEO.get(normalized);
    if (fromUstedeo) {
      const target = getTargetVerbForm(fromUstedeo, 'voseo', this.verbalMode);
      return target.toLowerCase() !== normalized ? target : null;
    }

    if (this.verbalMode === 'imperativo') {
      // Also check imperative source maps so imperative input is recognised
      const fromTuteoImp = VERB_BY_TUTEO_IMP.get(normalized);
      if (fromTuteoImp) {
        const target = getTargetVerbForm(fromTuteoImp, 'voseo', this.verbalMode);
        return target.toLowerCase() !== normalized ? target : null;
      }

      const fromUstedeoImp = VERB_BY_USTEDEO_IMP.get(normalized);
      if (fromUstedeoImp) {
        const target = getTargetVerbForm(fromUstedeoImp, 'voseo', this.verbalMode);
        return target.toLowerCase() !== normalized ? target : null;
      }
    }

    return null;
  }
}

export function createVoseoTransformer(mode: VerbalMode = 'indicativo'): VoseoTransformer {
  return new VoseoTransformer(mode);
}

/** @deprecated Use createVoseoTransformer() to get a mode-aware instance */
export const voseoTransformer = new VoseoTransformer();
