import { VERB_BY_VOSEO, VERB_BY_TUTEO } from '../data/verbMappings';
import { tokenize, splitPunctuation } from '../utils/tokenizer';
import { normalizeForLookup } from '../utils/accentUtils';
import type { DetectionResult, ToneClass } from '../types';

/**
 * Score-based tone detector for Spanish 2nd-person address.
 *
 * Scores each tone by counting clear lexical indicators then selects the
 * winner.  Returns confidence based on score delta and absolute count.
 */
export class ToneDetector {
  detect(text: string): DetectionResult {
    const tokens = tokenize(text);
    let voseo = 0;
    let tuteo = 0;
    let ustedeo = 0;

    for (const token of tokens) {
      if (!token.isWord) continue;
      const { core } = splitPunctuation(token.text);
      const lower = normalizeForLookup(core);

      // ── Voseo-specific indicators ─────────────────────────────────────────
      if (lower === 'vos') {
        voseo += 3;
        continue;
      }
      if (lower === 'sos') {
        voseo += 3; // voseo of ser
        continue;
      }
      // Verb form in voseo map AND not in tuteo map → clearly voseo
      if (VERB_BY_VOSEO.has(lower) && !VERB_BY_TUTEO.has(lower)) {
        const entry = VERB_BY_VOSEO.get(lower)!;
        // Extra weight for the accented endings unique to voseo (-ás, -és, -ís)
        if (/[áéí]s$/.test(lower) || /[ís]$/.test(lower)) {
          voseo += entry.isIrregular ? 2 : 3;
        } else {
          voseo += 1;
        }
        continue;
      }

      // ── Tuteo-specific indicators ─────────────────────────────────────────
      if (lower === 'tú') {
        tuteo += 3;
        continue;
      }
      if (lower === 'eres') {
        tuteo += 3; // tuteo of ser
        continue;
      }
      // Diphthongated tuteo forms (unique to tuteo, not shared with voseo)
      // These are only in VERB_BY_TUTEO and NOT in VERB_BY_VOSEO
      if (VERB_BY_TUTEO.has(lower) && !VERB_BY_VOSEO.has(lower)) {
        const entry = VERB_BY_TUTEO.get(lower)!;
        tuteo += entry.isDiphthongating ? 3 : 2;
        continue;
      }

      // ── Ustedeo-specific indicators ───────────────────────────────────────
      if (lower === 'usted') {
        ustedeo += 4;
        continue;
      }
    }

    // ── Pronoun-level scan with regex for multi-word expressions ─────────────
    const textLower = text.toLowerCase();
    if (/\bvos\b/.test(textLower)) voseo += 2;
    if (/\btú\b/.test(textLower)) tuteo += 2;
    if (/\busted\b/.test(textLower)) ustedeo += 3;
    // Strong voseo phrases
    if (/\bqué hacés\b/.test(textLower)) voseo += 3;
    if (/\bvos sabés\b/.test(textLower)) voseo += 4;
    // Strong tuteo phrases
    if (/\bqué haces\b/.test(textLower)) tuteo += 3;
    if (/\bcontigo\b/.test(textLower)) tuteo += 2;
    // Strong ustedeo phrases
    if (/\bcon usted\b/.test(textLower)) ustedeo += 3;
    if (/\bde usted\b/.test(textLower)) ustedeo += 3;

    const detectedTone = this._selectTone(voseo, tuteo, ustedeo);
    const total = voseo + tuteo + ustedeo;

    let confidence: 'high' | 'medium' | 'low';
    if (total === 0) {
      confidence = 'low';
    } else {
      const maxScore = Math.max(voseo, tuteo, ustedeo);
      const secondMax = [voseo, tuteo, ustedeo]
        .sort((a, b) => b - a)
        .slice(1)
        .reduce((a, b) => Math.max(a, b), 0);
      const delta = maxScore - secondMax;
      confidence = delta >= 5 ? 'high' : delta >= 2 ? 'medium' : 'low';
      if (maxScore < 2) confidence = 'low';
    }

    return { detectedTone, confidence, scores: { voseo, tuteo, ustedeo } };
  }

  private _selectTone(v: number, t: number, u: number): ToneClass {
    if (v === 0 && t === 0 && u === 0) return 'unknown';
    if (v >= t && v >= u) return 'voseo';
    if (t >= v && t >= u) return 'tuteo';
    return 'ustedeo';
  }
}

export const toneDetector = new ToneDetector();
