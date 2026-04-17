export interface PronounReplacement {
  /** RegExp that matches the source pronoun form (case-insensitive, word-bounded) */
  pattern: RegExp;
  /** Replacement form for voseo-cr target */
  voseo: string;
  /** Replacement form for tuteo target */
  tuteo: string;
  /** Replacement form for ustedeo target */
  ustedeo: string;
  /** Human-readable context tag */
  context: string;
}

/**
 * Directional pronoun replacement rules.
 * Each rule can be applied in a directional transformer:
 *   - VoseoTransformer  uses .voseo   as replacement
 *   - TuteoTransformer  uses .tuteo   as replacement
 *   - UstedeoTransformer uses .ustedeo as replacement
 *
 * NOTE: Only unambiguous replacements are listed.
 *   - "te" (reflexive/indirect) is intentionally omitted — too context-dependent.
 *   - "tu/su" (possessive) conversion: only ustedeo↔other is handled, and
 *     only for the clearly-marked "su" form (3rd person possessive is a known
 *     false-positive risk — a TONE_COVERAGE_LIMITED warning must accompany it).
 */
export const PRONOUN_REPLACEMENTS: PronounReplacement[] = [
  // ── Subject pronouns ─────────────────────────────────────────────────────────
  {
    pattern: /\bvos\b/gi,
    voseo: 'vos',
    tuteo: 'tú',
    ustedeo: 'usted',
    context: 'subject',
  },
  {
    // "tú" with accent = unambiguous tuteo subject
    pattern: /\btú\b/gi,
    voseo: 'vos',
    tuteo: 'tú',
    ustedeo: 'usted',
    context: 'subject',
  },
  {
    // "usted" — subject or formal vocative
    pattern: /\busted\b/gi,
    voseo: 'vos',
    tuteo: 'tú',
    ustedeo: 'usted',
    context: 'subject',
  },
  // ── Prepositional pronouns ────────────────────────────────────────────────────
  {
    // After prepositions (a, para, de, por, con, sin, etc.) tuteo uses "ti"
    // Voseo and ustedeo use "vos"/"usted" — handled as subject pronoun above.
    // This rule converts standalone "ti" which is always tuteo-prepositional.
    pattern: /\bti\b/gi,
    voseo: 'vos',
    tuteo: 'ti',
    ustedeo: 'usted',
    context: 'prepositional',
  },
  {
    // "contigo" (tuteo, always) — fixed phrase
    pattern: /\bcontigo\b/gi,
    voseo: 'con vos',
    tuteo: 'contigo',
    ustedeo: 'con usted',
    context: 'prepositional-con',
  },
];

/** Pronoun set reference — maps tone to second-person subject pronoun */
export const SUBJECT_PRONOUN: Record<'voseo' | 'tuteo' | 'ustedeo', string> = {
  voseo: 'vos',
  tuteo: 'tú',
  ustedeo: 'usted',
};
