import type { TargetTone } from '../transformers/BaseTransformer';

/**
 * Derives the imperative form of a verb from its present indicative form,
 * using morphological rules for regular Spanish verbs.
 *
 * This is a fallback used when a verb is found in the dictionary (indicative
 * maps) but its entry lacks an explicit imperative field.
 *
 * Rules:
 *   Voseo:   -ás → -á  |  -és → -é  |  -ís → -í
 *   Tuteo:   -as → -a  |  -es → -e   (drop the -s)
 *   Ustedeo: -a  → -e  |  -e  → -a   (swap final vowel: AR→E, ER/IR→A)
 *
 * Returns null when the form cannot be derived (e.g. suppletive irregulars
 * like "sos/eres/es" or forms ending in ambiguous letters).
 */
export function deriveFallbackImperative(
  indicativeForm: string,
  targetTone: TargetTone,
): string | null {
  const lower = indicativeForm.toLowerCase();

  switch (targetTone) {
    case 'voseo':
      if (lower.endsWith('ás')) return lower.slice(0, -2) + 'á';
      if (lower.endsWith('és')) return lower.slice(0, -2) + 'é';
      if (lower.endsWith('ís')) return lower.slice(0, -2) + 'í';
      return null;

    case 'tuteo':
      if (lower.endsWith('as') || lower.endsWith('es')) return lower.slice(0, -1);
      return null;

    case 'ustedeo':
      if (lower.endsWith('a')) return lower.slice(0, -1) + 'e';
      if (lower.endsWith('e')) return lower.slice(0, -1) + 'a';
      return null;
  }
}
