// ── Interfaces for the complete Spanish verb conjugation library ──────────────
//
// ConjugationGroup is re-declared here as a structural copy to avoid a circular
// import with verbMappings.ts. TypeScript structural typing means both are
// mutually assignable — they must always stay in sync.
export type ConjugationGroup = '-ar' | '-er' | '-ir';

/** All eight persons for a single tense/mood. */
export interface PersonForms {
  yo: string;
  /** Voseo CR — 2ª person singular informal: "vos" */
  voseo: string;
  /** Tuteo — 2ª person singular estándar: "tú" */
  tuteo: string;
  /** Ustedeo — 2ª person formal/íntimo CR: "usted" */
  ustedeo: string;
  /** él / ella / ello */
  el: string;
  nosotros: string;
  /** ustedes — 2ª plural latinoamericana */
  ustedes: string;
  ellos: string;
}

/** Imperative forms (positive or negative). Only 2ⁿᵈ-person forms are required. */
export interface ImperativoForms {
  /** e.g. "hablá", "hacé", "andá" */
  voseo: string;
  /** e.g. "habla", "haz", "ve" */
  tuteo: string;
  /** e.g. "hable", "haga", "vaya" — always present subjunctive ustedeo */
  ustedeo: string;
  /** e.g. "hablemos", "hagamos" */
  nosotros?: string;
  /** e.g. "hablen", "hagan" */
  ustedes?: string;
}

/**
 * Full conjugation record for a Spanish verb.
 *
 * Costa Rican voseo rules (encoded in the data):
 *   - presenteInd.voseo ends in accented vowel + s (-ás / -és / -ís).
 *     Exception: "ser" → "sos", "ir"/"estar"/"ver"/"dar" have no accent.
 *   - imperativoPos.voseo = presenteInd.voseo minus the final -s.
 *   - imperativoNeg.voseo = "no" + presenteSubj.voseo.
 *   - In all other tenses (preterite, imperfect, future, conditional, subj.
 *     imperfect) voseo == tuteo form.
 */
export interface CompleteVerbEntry {
  infinitive: string;
  /** Present participle: "hablando", "teniendo" */
  gerundio: string;
  /** Past participle: "hablado", "tenido" */
  participio: string;
  conjugationGroup: ConjugationGroup;
  isIrregular: boolean;
  /** Diphthong shift (o→ue / e→ie) in stressed syllables */
  isDiphthongating: boolean;
  /** Stem vowel change e→i in -IR verbs */
  isStemChanging: boolean;

  // ── Indicative mood ────────────────────────────────────────────────────────
  presenteInd: PersonForms;
  /** Pretérito indefinido: comí, hablé */
  preteritoInd: PersonForms;
  /** Pretérito imperfecto: comía, hablaba */
  imperfectoInd: PersonForms;
  /** Futuro simple: comeré, hablaré */
  futuroInd: PersonForms;
  /** Condicional simple: comería, hablaría */
  condicionalInd: PersonForms;

  // ── Subjunctive mood ───────────────────────────────────────────────────────
  presenteSubj: PersonForms;
  /** Imperfecto subjuntivo -ra: comiera, hablara */
  imperfectoSubjRa: PersonForms;
  /** Imperfecto subjuntivo -se: comiese, hablase */
  imperfectoSubjSe: PersonForms;

  // ── Imperative ─────────────────────────────────────────────────────────────
  /** Affirmative: "comprá", "compra", "compre" */
  imperativoPos: ImperativoForms;
  /** Negative: "no comprés", "no compres", "no compre" */
  imperativoNeg: ImperativoForms;

  /** Free-text notes on irregular voseo CR behaviour, if any. */
  voseoNotes?: string;
}
